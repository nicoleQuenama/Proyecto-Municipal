-- 0014 · Flujo de trabajo como GitHub, numeración y mantenimiento.
--
-- Reglas (las mismas que hoy aplican group-rules.ts y review-store.ts, ahora en la base de datos):
--   · Solo quien tiene `publishMain` escribe en main. Los demás trabajan en SU rama (`trabajo-<usuario>`), que el
--     sistema crea sola, y la envían como pull request.
--   · La recibe quien invitó al autor (o un superadministrador si nadie lo invitó). Nunca el propio autor.
--   · Solo quien puede revisarla y tiene `publishMain` la fusiona. La fusión crea una versión con dos padres en main.
--   · Cada persona solo ve las pull requests que envió o que le toca revisar (RLS en 0009).
-- Las tablas de contenido son el estado de MAIN; las demás ramas viven como fotos y operaciones (0005, 0013).
-- Fusionar = (1) la API calcula el estado fusionado, lo guarda como foto y escribe esas filas en main
-- (cada escritura exige `publishMain`), y (2) llama a app.merge_pull_request, todo en UNA transacción.

-- Mismo criterio que canReview() de group-rules.ts.
CREATE FUNCTION app.can_review(p_author uuid, p_reviewer uuid) RETURNS boolean
LANGUAGE sql STABLE AS
$$ SELECT app.current_user_id() IS DISTINCT FROM p_author
          AND CASE WHEN p_reviewer IS NULL THEN app.is_org_superadmin() ELSE p_reviewer = app.current_user_id() END $$;

-- Números «#12» sin huecos ni carreras, para pull requests, issues y publicaciones.
CREATE FUNCTION app.next_number(p_project uuid, p_kind text) RETURNS int
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, app, pg_temp AS
$$
DECLARE v int;
BEGIN
  IF p_kind NOT IN ('pr', 'issue', 'publication') THEN
    RAISE EXCEPTION 'Tipo de numeración desconocido: %', p_kind USING ERRCODE = 'invalid_parameter_value';
  END IF;
  IF p_project NOT IN (SELECT app.visible_projects()) THEN
    RAISE EXCEPTION 'El proyecto no existe' USING ERRCODE = 'no_data_found';
  END IF;
  UPDATE app.project_counters SET
    next_pr_number          = next_pr_number          + (p_kind = 'pr')::int,
    next_issue_number       = next_issue_number       + (p_kind = 'issue')::int,
    next_publication_number = next_publication_number + (p_kind = 'publication')::int
  WHERE organization_id = app.current_org() AND project_id = p_project
  RETURNING CASE p_kind WHEN 'pr' THEN next_pr_number WHEN 'issue' THEN next_issue_number ELSE next_publication_number END - 1
  INTO v;
  RETURN v;
END
$$;

-- La rama en la que debe trabajar esta persona: main si puede publicar en main; si no, la suya (la crea la primera vez).
CREATE FUNCTION app.ensure_work_branch(p_project uuid) RETURNS uuid
LANGUAGE plpgsql AS
$$
DECLARE
  v_org  uuid := app.current_org();
  v_user uuid := app.current_user_id();
  v_main uuid;
  v_name text;
  v_id   uuid;
BEGIN
  IF v_user IS NULL THEN PERFORM app.deny('trabajar sin una sesión'); END IF;
  SELECT b.id INTO v_main FROM app.branches b WHERE b.organization_id = v_org AND b.project_id = p_project AND b.is_main;
  IF v_main IS NULL THEN RAISE EXCEPTION 'El proyecto no existe' USING ERRCODE = 'no_data_found'; END IF;
  IF app.has_permission(p_project, 'publishMain') THEN RETURN v_main; END IF;
  IF NOT app.has_permission(p_project, 'editContent') THEN PERFORM app.deny('editContent'); END IF;

  -- Mismo nombre que defaultBranchOf() de group-rules.ts.
  SELECT 'trabajo-' || regexp_replace(lower(u.username::text), '[^a-z0-9_-]+', '-', 'g') INTO v_name
  FROM app.users u WHERE u.organization_id = v_org AND u.id = v_user;

  SELECT b.id INTO v_id FROM app.branches b
  WHERE b.organization_id = v_org AND b.project_id = p_project AND b.name = v_name AND b.owner_id = v_user AND b.deleted_at IS NULL;
  IF v_id IS NULL THEN
    INSERT INTO app.branches (organization_id, project_id, name, base_branch_id, owner_id)
    VALUES (v_org, p_project, v_name, v_main, v_user) RETURNING id INTO v_id;
  END IF;
  RETURN v_id;
END
$$;

-- Enlaza a la pull request todas las versiones de la rama desde su punto de bifurcación (sin repetir las ya enlazadas).
CREATE FUNCTION app.link_branch_commits(p_pr uuid) RETURNS void
LANGUAGE sql AS
$$
  WITH RECURSIVE pr AS (
    SELECT p.organization_id, p.project_id, p.id, b.head_commit_id AS head, b.fork_commit_id AS fork
    FROM app.pull_requests p
    JOIN app.branches b ON b.organization_id = p.organization_id AND b.project_id = p.project_id AND b.id = p.from_branch_id
    WHERE p.id = p_pr
  ), chain AS (
    SELECT c.id, c.parent_commit_id FROM app.commits c JOIN pr ON c.organization_id = pr.organization_id AND c.project_id = pr.project_id AND c.id = pr.head
    WHERE c.id IS DISTINCT FROM (SELECT fork FROM pr)
    UNION ALL
    SELECT c.id, c.parent_commit_id FROM app.commits c JOIN chain ON c.id = chain.parent_commit_id
    WHERE c.id IS DISTINCT FROM (SELECT fork FROM pr)
  )
  INSERT INTO app.pull_request_commits (organization_id, project_id, pull_request_id, commit_id)
  SELECT pr.organization_id, pr.project_id, pr.id, chain.id FROM chain, pr
  ON CONFLICT DO NOTHING
$$;

-- «Enviar»: abre la pull request de la rama de esta persona hacia main, o actualiza la que ya está abierta. Idempotente:
-- la API puede llamarla después de cada versión guardada y el trabajo llega solo a quien lo revisa.
CREATE FUNCTION app.open_pull_request(p_branch uuid, p_title text) RETURNS uuid
LANGUAGE plpgsql AS
$$
DECLARE
  v_org      uuid := app.current_org();
  v_user     uuid := app.current_user_id();
  b          app.branches;
  v_pr       uuid;
BEGIN
  SELECT * INTO b FROM app.branches WHERE organization_id = v_org AND id = p_branch AND deleted_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'La rama no existe' USING ERRCODE = 'no_data_found'; END IF;
  IF b.is_main OR b.owner_id IS DISTINCT FROM v_user THEN PERFORM app.deny('enviar una rama que no es tuya'); END IF;
  IF b.head_commit_id IS NOT DISTINCT FROM b.fork_commit_id THEN
    RAISE EXCEPTION 'No hay cambios que enviar' USING ERRCODE = 'invalid_parameter_value';
  END IF;

  SELECT pr.id INTO v_pr FROM app.pull_requests pr
  WHERE pr.organization_id = v_org AND pr.project_id = b.project_id AND pr.author_id = v_user
    AND pr.from_branch_id = p_branch AND pr.status = 'open';

  IF v_pr IS NULL THEN
    INSERT INTO app.pull_requests (organization_id, project_id, number, title, from_branch_id, into_branch_id, author_id, reviewer_id)
    SELECT v_org, b.project_id, app.next_number(b.project_id, 'pr'), p_title, p_branch, b.base_branch_id, v_user, u.invited_by
    FROM app.users u WHERE u.organization_id = v_org AND u.id = v_user
    RETURNING id INTO v_pr;
  END IF;
  PERFORM app.link_branch_commits(v_pr);
  RETURN v_pr;
END
$$;

-- Una versión nueva en una rama con pull request abierta se suma a ella (como al hacer push en GitHub).
-- SECURITY DEFINER: quien corrige la rama puede no ser el autor y no ver la pull request.
CREATE FUNCTION app.link_commit_to_open_pr() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, app, pg_temp AS
$$
BEGIN
  INSERT INTO app.pull_request_commits (organization_id, project_id, pull_request_id, commit_id)
  SELECT pr.organization_id, pr.project_id, pr.id, NEW.id FROM app.pull_requests pr
  WHERE pr.organization_id = NEW.organization_id AND pr.project_id = NEW.project_id
    AND pr.from_branch_id = NEW.branch_id AND pr.status = 'open'
  ON CONFLICT DO NOTHING;
  RETURN NULL;
END
$$;
CREATE TRIGGER commits_link_pr AFTER INSERT ON app.commits FOR EACH ROW EXECUTE FUNCTION app.link_commit_to_open_pr();

-- El estado de una pull request solo cambia por los caminos permitidos: abierta → fusionada (únicamente por
-- merge_pull_request) o abierta → cerrada (su autor o quien la revisa). Una vez cerrada o fusionada, no se toca.
CREATE FUNCTION app.guard_pull_request() RETURNS trigger
LANGUAGE plpgsql AS
$$
BEGIN
  IF app.is_system_session() THEN RETURN NEW; END IF;
  IF OLD.status <> 'open' THEN PERFORM app.deny('cambiar una pull request que ya no está abierta'); END IF;
  IF (NEW.number, NEW.from_branch_id, NEW.into_branch_id, NEW.author_id, NEW.reviewer_id)
     IS DISTINCT FROM (OLD.number, OLD.from_branch_id, OLD.into_branch_id, OLD.author_id, OLD.reviewer_id) THEN
    PERFORM app.deny('cambiar los datos de una pull request');
  END IF;
  IF NEW.status = 'merged' AND current_setting('app.merging', true) IS DISTINCT FROM NEW.id::text THEN
    PERFORM app.deny('fusionar sin pasar por la revisión');
  ELSIF NEW.status = 'closed' AND NOT (app.current_user_id() = OLD.author_id OR app.can_review(OLD.author_id, OLD.reviewer_id)) THEN
    PERFORM app.deny('cerrar esta pull request');
  END IF;
  RETURN NEW;
END
$$;
CREATE TRIGGER pull_requests_guard BEFORE UPDATE ON app.pull_requests FOR EACH ROW EXECUTE FUNCTION app.guard_pull_request();

-- Solo aprueba quien puede revisar esa pull request, y en su propio nombre.
CREATE FUNCTION app.guard_approval() RETURNS trigger
LANGUAGE plpgsql AS
$$
DECLARE pr app.pull_requests;
BEGIN
  IF app.is_system_session() THEN RETURN NEW; END IF;
  SELECT * INTO pr FROM app.pull_requests
  WHERE organization_id = NEW.organization_id AND project_id = NEW.project_id AND id = NEW.pull_request_id;
  IF NOT FOUND OR NEW.user_id IS DISTINCT FROM app.current_user_id() OR NOT app.can_review(pr.author_id, pr.reviewer_id) THEN
    PERFORM app.deny('aprobar esta pull request');
  END IF;
  RETURN NEW;
END
$$;
CREATE TRIGGER pull_request_approvals_guard BEFORE INSERT ON app.pull_request_approvals
  FOR EACH ROW EXECUTE FUNCTION app.guard_approval();

-- Fusiona: aprueba en nombre de quien revisa, exige conflictos resueltos y las aprobaciones pedidas, crea la versión de
-- fusión en main (con la foto ya calculada por la API) y cierra la pull request. Devuelve la versión de fusión.
-- Sin `publishMain`, la inserción de la versión en main falla: solo los permitidos fusionan.
CREATE FUNCTION app.merge_pull_request(p_pr uuid, p_snapshot uuid, p_message text) RETURNS uuid
LANGUAGE plpgsql AS
$$
DECLARE
  v_org       uuid := app.current_org();
  pr          app.pull_requests;
  v_main_head uuid;
  v_from_head uuid;
  v_commit    uuid;
BEGIN
  SELECT * INTO pr FROM app.pull_requests WHERE organization_id = v_org AND id = p_pr FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'La pull request no existe' USING ERRCODE = 'no_data_found'; END IF;
  IF pr.status <> 'open' THEN RAISE EXCEPTION 'Esa pull request ya no está abierta' USING ERRCODE = 'invalid_parameter_value'; END IF;
  IF NOT app.can_review(pr.author_id, pr.reviewer_id) OR NOT app.has_permission(pr.project_id, 'publishMain') THEN
    PERFORM app.deny('fusionar esta pull request');
  END IF;
  IF EXISTS (SELECT 1 FROM app.pull_request_conflicts c
             WHERE c.organization_id = v_org AND c.pull_request_id = p_pr AND c.resolution IS NULL) THEN
    RAISE EXCEPTION 'Hay conflictos sin resolver' USING ERRCODE = 'check_violation';
  END IF;

  INSERT INTO app.pull_request_approvals (organization_id, project_id, pull_request_id, user_id)
  VALUES (v_org, pr.project_id, p_pr, app.current_user_id()) ON CONFLICT DO NOTHING;
  IF (SELECT count(*) FROM app.pull_request_approvals a WHERE a.organization_id = v_org AND a.pull_request_id = p_pr) < pr.required_approvals THEN
    RAISE EXCEPTION 'Faltan aprobaciones' USING ERRCODE = 'check_violation';
  END IF;

  SELECT b.head_commit_id INTO v_main_head FROM app.branches b WHERE b.organization_id = v_org AND b.project_id = pr.project_id AND b.id = pr.into_branch_id;
  SELECT b.head_commit_id INTO v_from_head FROM app.branches b WHERE b.organization_id = v_org AND b.project_id = pr.project_id AND b.id = pr.from_branch_id;
  INSERT INTO app.commits (organization_id, project_id, branch_id, snapshot_id, kind, parent_commit_id, second_parent_commit_id, author_id, message)
  VALUES (v_org, pr.project_id, pr.into_branch_id, p_snapshot, 'merge', v_main_head, v_from_head, app.current_user_id(), p_message)
  RETURNING id INTO v_commit;

  PERFORM set_config('app.merging', p_pr::text, true);
  UPDATE app.pull_requests SET status = 'merged', merge_commit_id = v_commit, closed_at = now() WHERE id = p_pr;
  RETURN v_commit;
END
$$;

-- Mantenimiento (trabajo diario de la plataforma): caché de APIs vencido y tokens de restablecimiento viejos.
CREATE FUNCTION app.purge_expired() RETURNS TABLE (cache_rows bigint, token_rows bigint)
LANGUAGE sql AS
$$
  WITH c AS (DELETE FROM app.data_source_cache WHERE expires_at < now() RETURNING 1),
       t AS (DELETE FROM app.password_reset_tokens
             WHERE expires_at < now() - interval '1 day' OR used_at < now() - interval '1 day' RETURNING 1)
  SELECT (SELECT count(*) FROM c), (SELECT count(*) FROM t)
$$;

REVOKE ALL ON FUNCTION app.purge_expired() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.purge_expired() TO portal_platform;
GRANT EXECUTE ON FUNCTION app.next_number(uuid, text), app.ensure_work_branch(uuid), app.open_pull_request(uuid, text),
  app.merge_pull_request(uuid, uuid, text) TO portal_app;

SELECT app.apply_rls();
SELECT app.apply_grants();
