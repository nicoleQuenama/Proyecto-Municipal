-- 0009 · Seguridad: aislamiento por organización (RLS), funciones privilegiadas y permisos.
--
-- Defensa en profundidad, tres barreras independientes:
--   1. Claves foráneas compuestas (organization_id, id): una fila no puede apuntar a otra organización.
--   2. RLS: la sesión solo ve y escribe filas de app.current_org(); sin organización fijada, no ve nada.
--   3. Permisos: la API usa portal_app, que no es dueño de las tablas y por eso NO salta RLS.

-- Quién es la persona de la transacción (para comentarios privados y auditoría). La API lo fija junto a app.org_id.
CREATE FUNCTION app.current_user_id() RETURNS uuid
LANGUAGE sql STABLE PARALLEL SAFE AS
$$ SELECT nullif(current_setting('app.user_id', true), '')::uuid $$;
GRANT EXECUTE ON FUNCTION app.current_user_id() TO portal_app, portal_readonly, portal_platform;

-- Proyectos que la persona de esta transacción puede ver: todos los de su organización si es superadministrador;
-- si no, solo aquellos de los que es miembro, con el acceso vigente y sin `viewAll` vetado. Sin usuario, ninguno.
-- SECURITY DEFINER para leer project_members sin que RLS se llame a sí misma. Se usa como `IN (SELECT …)`, que el
-- planificador evalúa UNA vez por consulta (no por fila): cuesta lo mismo con 6 filas que con 6 000.
CREATE FUNCTION app.visible_projects() RETURNS SETOF uuid
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, app, pg_temp AS
$$
DECLARE
  v_org  uuid := app.current_org();
  v_user uuid := app.current_user_id();
  v_role text;
BEGIN
  IF v_org IS NULL OR v_user IS NULL THEN RETURN; END IF;
  SELECT u.role INTO v_role FROM app.users u
  WHERE u.organization_id = v_org AND u.id = v_user AND u.status = 'active' AND u.deleted_at IS NULL;
  IF v_role IS NULL THEN RETURN; END IF;

  IF v_role = 'superadmin' THEN
    RETURN QUERY SELECT p.id FROM app.projects p WHERE p.organization_id = v_org;
  ELSE
    RETURN QUERY SELECT pm.project_id FROM app.project_members pm
    WHERE pm.organization_id = v_org AND pm.user_id = v_user
      AND (pm.expires_at IS NULL OR pm.expires_at > now()) AND NOT ('viewAll' = ANY (pm.denied));
  END IF;
END
$$;
GRANT EXECUTE ON FUNCTION app.visible_projects() TO portal_app, portal_readonly;

CREATE FUNCTION app.is_org_superadmin() RETURNS boolean
LANGUAGE sql STABLE AS
$$ SELECT coalesce((SELECT u.role = 'superadmin' FROM app.users u
                    WHERE u.organization_id = app.current_org() AND u.id = app.current_user_id()), false) $$;
GRANT EXECUTE ON FUNCTION app.is_org_superadmin() TO portal_app, portal_readonly;

-- RLS genérico, idempotente (toda migración que añada tablas la vuelve a llamar; la prueba de esquema falla si se olvida):
--   · tablas del proyecto (tienen project_id): misma organización Y proyecto visible para la persona;
--   · projects: igual con su propio id (insertar solo exige la organización: el creador aún no es miembro);
--   · el resto de tablas con organization_id: misma organización.
-- (SELECT app.current_org()) en vez de la llamada directa: el planificador la evalúa UNA vez por consulta.
CREATE FUNCTION app.apply_rls() RETURNS void
LANGUAGE plpgsql AS
$$
DECLARE
  t record;
  org_ok   constant text := 'organization_id = (SELECT app.current_org())';
  visible  constant text := 'IN (SELECT app.visible_projects())';
  v_using  text;
BEGIN
  FOR t IN
    SELECT c.relname,
           EXISTS (SELECT 1 FROM pg_attribute a WHERE a.attrelid = c.oid AND a.attname = 'project_id' AND NOT a.attisdropped) AS has_project,
           coalesce((SELECT NOT a.attnotnull FROM pg_attribute a WHERE a.attrelid = c.oid AND a.attname = 'project_id' AND NOT a.attisdropped), false) AS project_nullable
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'app' AND c.relkind IN ('r', 'p') AND NOT c.relispartition
      AND c.relname NOT IN ('design_comments', 'organizations')
      AND EXISTS (SELECT 1 FROM pg_attribute a WHERE a.attrelid = c.oid AND a.attname = 'organization_id' AND NOT a.attisdropped)
  LOOP
    EXECUTE format('ALTER TABLE app.%I ENABLE ROW LEVEL SECURITY', t.relname);
    CONTINUE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'app' AND tablename = t.relname AND policyname LIKE 'tenant\_%');

    IF t.relname = 'projects' THEN
      EXECUTE format('CREATE POLICY tenant_select ON app.projects FOR SELECT USING (%s AND id %s)', org_ok, visible);
      EXECUTE format('CREATE POLICY tenant_insert ON app.projects FOR INSERT WITH CHECK (%s)', org_ok);
      EXECUTE format('CREATE POLICY tenant_update ON app.projects FOR UPDATE USING (%s AND id %s) WITH CHECK (%s)', org_ok, visible, org_ok);
      EXECUTE format('CREATE POLICY tenant_delete ON app.projects FOR DELETE USING (%s AND id %s)', org_ok, visible);
    ELSE
      v_using := CASE
        WHEN NOT t.has_project THEN org_ok
        WHEN t.project_nullable THEN format('%s AND (project_id IS NULL OR project_id %s)', org_ok, visible)
        ELSE format('%s AND project_id %s', org_ok, visible)
      END;
      -- Tablas con una regla propia además de la de organización/proyecto:
      --   preferencias: solo las de uno mismo; pull requests: solo las que envió o le toca revisar
      --   (como canSee() de group-rules.ts); sus aprobaciones, versiones y conflictos siguen a su pull request.
      v_using := v_using || coalesce((SELECT e.pred FROM (VALUES
        ('user_preferences',        ' AND user_id = (SELECT app.current_user_id())'),
        ('pull_requests',           ' AND (author_id = (SELECT app.current_user_id()) OR reviewer_id = (SELECT app.current_user_id())'
                                    || ' OR (reviewer_id IS NULL AND (SELECT app.is_org_superadmin())))'),
        ('pull_request_commits',    ' AND pull_request_id IN (SELECT id FROM app.pull_requests)'),
        ('pull_request_approvals',  ' AND pull_request_id IN (SELECT id FROM app.pull_requests)'),
        ('pull_request_conflicts',  ' AND pull_request_id IN (SELECT id FROM app.pull_requests)')
      ) e(tbl, pred) WHERE e.tbl = t.relname), '');
      EXECUTE format('CREATE POLICY tenant_isolation ON app.%I USING (%s) WITH CHECK (%s)', t.relname, v_using, v_using);
    END IF;
  END LOOP;
END
$$;
SELECT app.apply_rls();

-- La organización solo se ve a sí misma.
ALTER TABLE app.organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON app.organizations
  USING (id = (SELECT app.current_org())) WITH CHECK (id = (SELECT app.current_org()));

-- Comentarios: los "private" solo los ve (y borra) su autor, aunque la API se equivoque.
ALTER TABLE app.design_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY comments_select ON app.design_comments FOR SELECT
  USING (organization_id = (SELECT app.current_org()) AND project_id IN (SELECT app.visible_projects())
         AND (audience = 'team' OR author_id = (SELECT app.current_user_id())));
CREATE POLICY comments_insert ON app.design_comments FOR INSERT
  WITH CHECK (organization_id = (SELECT app.current_org()) AND project_id IN (SELECT app.visible_projects())
              AND author_id = (SELECT app.current_user_id()));
CREATE POLICY comments_update ON app.design_comments FOR UPDATE
  USING (organization_id = (SELECT app.current_org()) AND project_id IN (SELECT app.visible_projects())
         AND (audience = 'team' OR author_id = (SELECT app.current_user_id())))
  WITH CHECK (organization_id = (SELECT app.current_org()));
CREATE POLICY comments_delete ON app.design_comments FOR DELETE
  USING (organization_id = (SELECT app.current_org()) AND author_id = (SELECT app.current_user_id()));

-- ───────────────────────── Funciones que cruzan organizaciones, a propósito y acotadas ─────────────────────────
-- Antes de saber la organización (iniciar sesión, restablecer contraseña, ver un sitio público por su dominio)
-- la API no puede filtrar por ella. Estas funciones SECURITY DEFINER son la ÚNICA puerta, devuelven lo mínimo
-- y llevan search_path fijo (sin esto, un esquema ajeno podría suplantar tablas o funciones).

-- Inicio de sesión: correo → cuenta. La API compara el hash y luego fija app.org_id con el organization_id devuelto.
-- También sirve para «olvidé mi contraseña»: devuelve el usuario y el nombre para confirmarlos y escribirle.
CREATE FUNCTION app.login_lookup(p_email app.citext)
RETURNS TABLE (user_id uuid, organization_id uuid, email app.citext, username app.citext, name text, role text,
               password_hash text, session_version int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, app, pg_temp AS
$$
  SELECT u.id, u.organization_id, u.email, u.username, u.name, u.role, u.password_hash, u.session_version
  FROM app.users u
  JOIN app.organizations o ON o.id = u.organization_id
  WHERE u.email = p_email AND u.status = 'active' AND u.deleted_at IS NULL
    AND o.status = 'active' AND o.deleted_at IS NULL
$$;

-- Restablecer contraseña: gasta el token (un solo uso, atómico), cambia el hash, cierra las demás sesiones
-- y anula los otros enlaces pendientes. Devuelve a quién (para avisarle por correo); sin filas si el token no vale.
CREATE FUNCTION app.reset_password_with_token(p_token_hash bytea, p_new_password_hash text)
RETURNS TABLE (user_id uuid, email app.citext, name text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, app, pg_temp AS
$$
DECLARE
  v_user uuid;
  v_org  uuid;
BEGIN
  UPDATE app.password_reset_tokens t SET used_at = now()
  WHERE t.token_hash = p_token_hash AND t.used_at IS NULL AND t.expires_at > now()
  RETURNING t.user_id, t.organization_id INTO v_user, v_org;
  IF v_user IS NULL THEN RETURN; END IF;

  UPDATE app.password_reset_tokens SET used_at = now()
  WHERE organization_id = v_org AND password_reset_tokens.user_id = v_user AND used_at IS NULL;

  RETURN QUERY
  WITH changed AS (
    UPDATE app.users u SET password_hash = p_new_password_hash, session_version = u.session_version + 1
    WHERE u.id = v_user AND u.organization_id = v_org AND u.status = 'active' AND u.deleted_at IS NULL
    RETURNING u.id, u.email, u.name
  )
  SELECT c.id, c.email, c.name FROM changed c;
END
$$;

-- Sitio público: dominio verificado → publicación en línea. Dos búsquedas por índice único, sin tocar tablas de edición.
CREATE FUNCTION app.resolve_public_site(p_host app.citext)
RETURNS TABLE (project_id uuid, publication_id uuid, snapshot jsonb, snapshot_sha256 bytea, published_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, app, pg_temp AS
$$
  SELECT p.id, pub.id, pub.snapshot, pub.snapshot_sha256, pub.published_at
  FROM app.project_domains d
  JOIN app.projects p      ON p.organization_id = d.organization_id AND p.id = d.project_id AND p.deleted_at IS NULL
  JOIN app.organizations o ON o.id = p.organization_id AND o.status = 'active' AND o.deleted_at IS NULL
  JOIN app.publications pub ON pub.organization_id = p.organization_id AND pub.project_id = p.id
                           AND pub.id = p.live_publication_id
  WHERE d.host = p_host AND d.verified_at IS NOT NULL
$$;

-- Alta de organización con su primer superadministrador. Solo la plataforma (no la API de los clientes).
CREATE FUNCTION app.provision_organization(
  p_slug text, p_name text, p_admin_email text, p_admin_name text, p_admin_username text, p_admin_password_hash text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, app, pg_temp AS
$$
DECLARE v_org uuid;
BEGIN
  INSERT INTO app.organizations (slug, name) VALUES (p_slug, p_name) RETURNING id INTO v_org;
  INSERT INTO app.users (organization_id, email, username, name, role, password_hash)
  VALUES (v_org, p_admin_email, p_admin_username, p_admin_name, 'superadmin', p_admin_password_hash);
  RETURN v_org;
END
$$;

REVOKE ALL ON FUNCTION app.login_lookup(app.citext), app.reset_password_with_token(bytea, text),
  app.resolve_public_site(app.citext), app.provision_organization(text, text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.login_lookup(app.citext), app.reset_password_with_token(bytea, text),
  app.resolve_public_site(app.citext) TO portal_app;
GRANT EXECUTE ON FUNCTION app.provision_organization(text, text, text, text, text, text) TO portal_platform;

-- ───────────────────────── Permisos ─────────────────────────
-- Idempotente: cada migración que añada tablas vuelve a llamarla (no usamos ALTER DEFAULT PRIVILEGES para
-- que ninguna tabla nueva quede abierta por olvido). Las particiones no reciben permisos: se entra por el padre.
CREATE FUNCTION app.apply_grants() RETURNS void
LANGUAGE plpgsql AS
$$
DECLARE t text;
BEGIN
  FOR t IN
    SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'app' AND c.relkind IN ('r', 'p') AND NOT c.relispartition
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON app.%I TO portal_app', t);
    EXECUTE format('GRANT SELECT ON app.%I TO portal_readonly', t);
  END LOOP;
  GRANT USAGE ON ALL SEQUENCES IN SCHEMA app TO portal_app;

  -- Matriz de permisos por defecto (0010): la cambia una migración, no la API.
  IF to_regclass('app.role_permissions') IS NOT NULL THEN
    REVOKE INSERT, UPDATE, DELETE ON app.role_permissions, app.member_role_permissions, app.role_grants FROM portal_app;
  END IF;
  -- Los contadores (proyectos y almacenamiento) solo los mueven funciones y disparadores, nunca la API.
  REVOKE INSERT, UPDATE, DELETE ON app.project_counters FROM portal_app;
  IF to_regclass('app.organization_usage') IS NOT NULL THEN
    REVOKE INSERT, UPDATE, DELETE ON app.organization_usage FROM portal_app;
  END IF;

  -- La organización la crea y dimensiona la plataforma; la API solo puede renombrarla.
  REVOKE INSERT, UPDATE, DELETE ON app.organizations FROM portal_app;
  GRANT UPDATE (name) ON app.organizations TO portal_app;
  -- Registros que solo crecen: la API no los edita ni los borra (la retención la hace la plataforma).
  REVOKE UPDATE, DELETE ON app.audit_log, app.commits, app.commit_changes, app.publications, app.site_snapshots FROM portal_app;
  GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA app TO portal_platform;
  GRANT USAGE ON ALL SEQUENCES IN SCHEMA app TO portal_platform;
END
$$;
SELECT app.apply_grants();
