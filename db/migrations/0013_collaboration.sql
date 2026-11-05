-- 0013 · Colaboración: invitaciones, enlaces para compartir y registro de operaciones (tiempo real).
--
-- Regla que nunca se rompe: una persona con cuenta pertenece a UNA organización. Compartir significa
--   · invitar a alguien A LA MISMA organización (invitations), o
--   · dar un enlace de SOLO LECTURA de una publicación inmutable (share_links, audience «anyone»), o
--   · dar un enlace interno que exige iniciar sesión en la misma organización (audience «organization»).
-- No existe ningún camino para dar acceso de edición a una cuenta de otra organización.

-- ───────── Invitaciones ─────────
-- Proyecto 1 ── N invitaciones. Al aceptarla se crea la cuenta (en la organización del proyecto) y su membresía,
-- con el acceso que la invitación llevaba: rol en el proyecto, vetos, alcance y vencimiento.
CREATE TABLE app.invitations (
  id              uuid        PRIMARY KEY DEFAULT app.new_id(),
  organization_id uuid        NOT NULL,
  project_id      uuid        NOT NULL,
  email           app.citext  NOT NULL CHECK (length(email) <= 254 AND email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  role            text        NOT NULL CHECK (role IN ('dev', 'designer')),
  member_role     text        NOT NULL DEFAULT 'editor' CHECK (member_role IN ('viewer', 'commenter', 'reviewer', 'editor')),
  denied          text[]      NOT NULL DEFAULT '{}'
                  CHECK (denied <@ ARRAY['installLibraries','editCode','editStyles','editData','invite','publishMain','deploy']::text[]),
  scope_limited   boolean     NOT NULL DEFAULT false,
  page_ids        text[]      NOT NULL DEFAULT '{}',
  block_ids       text[]      NOT NULL DEFAULT '{}',
  access_expires_at timestamptz,
  token_hash      bytea       NOT NULL UNIQUE CHECK (length(token_hash) = 32),
  invited_by      uuid        NOT NULL,
  expires_at      timestamptz NOT NULL,
  accepted_at     timestamptz,
  accepted_user_id uuid,
  revoked_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (organization_id, project_id)       REFERENCES app.projects (organization_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, invited_by)       REFERENCES app.users (organization_id, id),
  FOREIGN KEY (organization_id, accepted_user_id) REFERENCES app.users (organization_id, id),
  CHECK (accepted_at IS NULL OR revoked_at IS NULL),
  CHECK ((accepted_at IS NOT NULL) = (accepted_user_id IS NOT NULL)),
  CHECK (scope_limited OR (cardinality(page_ids) = 0 AND cardinality(block_ids) = 0)),
  CHECK (expires_at > created_at)
);
CREATE INDEX invitations_project_idx ON app.invitations (organization_id, project_id, created_at DESC);
-- Una sola invitación pendiente por correo y proyecto.
CREATE UNIQUE INDEX invitations_pending_key ON app.invitations (organization_id, project_id, email)
  WHERE accepted_at IS NULL AND revoked_at IS NULL;

CREATE FUNCTION app.guard_invitation() RETURNS trigger
LANGUAGE plpgsql AS
$$
DECLARE v_ttl int;
BEGIN
  IF NOT app.is_system_session() AND NEW.invited_by IS DISTINCT FROM app.current_user_id() THEN
    PERFORM app.deny('invitar a nombre de otra persona');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM app.users g JOIN app.role_grants rg ON rg.granter_role = g.role AND rg.granted_role = NEW.role
                 WHERE g.organization_id = NEW.organization_id AND g.id = NEW.invited_by) THEN
    PERFORM app.deny('dar el rol ' || NEW.role);
  END IF;
  SELECT invitation_ttl_hours INTO v_ttl FROM app.organization_settings WHERE organization_id = NEW.organization_id;
  IF NEW.expires_at > now() + make_interval(hours => v_ttl) THEN
    RAISE EXCEPTION 'La invitación no puede durar más de % horas en esta organización', v_ttl USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$$;
CREATE TRIGGER invitations_guard BEFORE INSERT ON app.invitations FOR EACH ROW EXECUTE FUNCTION app.guard_invitation();
CREATE TRIGGER invitations_perm  BEFORE INSERT OR UPDATE OR DELETE ON app.invitations
  FOR EACH ROW EXECUTE FUNCTION app.guard_permission('invite');

-- Lo mínimo para mostrar «Fulano te invitó a Proyecto X» antes de que exista la cuenta.
CREATE FUNCTION app.resolve_invitation(p_token_hash bytea)
RETURNS TABLE (organization_name text, project_name text, email app.citext, role text, member_role text, expires_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, app, pg_temp AS
$$
  SELECT o.name, p.name, i.email, i.role, i.member_role, i.expires_at
  FROM app.invitations i
  JOIN app.organizations o ON o.id = i.organization_id AND o.status = 'active' AND o.deleted_at IS NULL
  JOIN app.projects p ON p.organization_id = i.organization_id AND p.id = i.project_id AND p.deleted_at IS NULL
  WHERE i.token_hash = p_token_hash AND i.accepted_at IS NULL AND i.revoked_at IS NULL AND i.expires_at > now()
$$;

-- Acepta la invitación en UNA transacción: crea la cuenta, su membresía con el acceso pactado y gasta el enlace.
-- Devuelve el usuario, o NULL si el enlace no vale. Si el correo ya tiene cuenta en la plataforma (en cualquier
-- organización) falla con unique_violation: nadie se cuela a otra organización con una invitación.
CREATE FUNCTION app.accept_invitation(p_token_hash bytea, p_username text, p_name text, p_password_hash text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, app, pg_temp AS
$$
DECLARE
  i      app.invitations;
  v_user uuid;
BEGIN
  SELECT * INTO i FROM app.invitations
  WHERE token_hash = p_token_hash AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at > now()
  FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;

  INSERT INTO app.users (organization_id, email, username, name, role, password_hash, invited_by)
  VALUES (i.organization_id, i.email, p_username, p_name, i.role, p_password_hash, i.invited_by)
  RETURNING id INTO v_user;

  INSERT INTO app.project_members (organization_id, project_id, user_id, member_role, denied, scope_limited, expires_at, granted_by)
  VALUES (i.organization_id, i.project_id, v_user, i.member_role, i.denied, i.scope_limited, i.access_expires_at, i.invited_by);

  INSERT INTO app.member_scope_pages (organization_id, project_id, user_id, page_id)
  SELECT i.organization_id, i.project_id, v_user, unnest(i.page_ids);
  INSERT INTO app.member_scope_blocks (organization_id, project_id, user_id, block_id)
  SELECT i.organization_id, i.project_id, v_user, unnest(i.block_ids);

  UPDATE app.invitations SET accepted_at = now(), accepted_user_id = v_user WHERE id = i.id;
  RETURN v_user;
END
$$;

-- ───────── Enlaces para compartir ─────────
-- Proyecto 1 ── N enlaces; opcionalmente de UNA página y/o de UNA publicación concreta.
--   anyone       cualquiera con el enlace, SIN cuenta. Solo lectura de una publicación inmutable y siempre con vencimiento.
--   organization exige iniciar sesión en la misma organización; puede dar acceso de comentar.
-- Solo se guarda el SHA-256 del token. Contraseña opcional (hash).
CREATE TABLE app.share_links (
  id              uuid        PRIMARY KEY DEFAULT app.new_id(),
  organization_id uuid        NOT NULL,
  project_id      uuid        NOT NULL,
  page_id         text,
  publication_id  uuid,
  token_hash      bytea       NOT NULL UNIQUE CHECK (length(token_hash) = 32),
  audience        text        NOT NULL CHECK (audience IN ('anyone', 'organization')),
  access          text        NOT NULL DEFAULT 'view' CHECK (access IN ('view', 'comment')),
  password_hash   text,
  expires_at      timestamptz,
  revoked_at      timestamptz,
  created_by      uuid        NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (organization_id, project_id)                 REFERENCES app.projects (organization_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, project_id, page_id)        REFERENCES app.pages (organization_id, project_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, project_id, publication_id) REFERENCES app.publications (organization_id, project_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, created_by)                 REFERENCES app.users (organization_id, id),
  -- Sin cuenta no se comenta ni se ve un borrador: solo una publicación, solo lectura, y que venza.
  CHECK (audience <> 'anyone' OR (access = 'view' AND publication_id IS NOT NULL AND expires_at IS NOT NULL))
);
CREATE INDEX share_links_project_idx     ON app.share_links (organization_id, project_id, created_at DESC);
CREATE INDEX share_links_page_idx        ON app.share_links (organization_id, project_id, page_id)        WHERE page_id IS NOT NULL;
CREATE INDEX share_links_publication_idx ON app.share_links (organization_id, project_id, publication_id) WHERE publication_id IS NOT NULL;

-- Las reglas de la organización mandan: puede prohibir los enlaces públicos y fija su duración máxima.
CREATE FUNCTION app.guard_share_link() RETURNS trigger
LANGUAGE plpgsql AS
$$
DECLARE s app.organization_settings;
BEGIN
  IF NOT app.is_system_session() AND NEW.created_by IS DISTINCT FROM app.current_user_id() THEN
    PERFORM app.deny('compartir a nombre de otra persona');
  END IF;
  IF NEW.audience = 'anyone' THEN
    SELECT * INTO s FROM app.organization_settings WHERE organization_id = NEW.organization_id;
    IF NOT s.allow_public_share_links THEN
      RAISE EXCEPTION 'Esta organización no permite enlaces públicos' USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF NEW.expires_at > now() + make_interval(days => s.share_link_max_days) THEN
      RAISE EXCEPTION 'Un enlace público no puede durar más de % días en esta organización', s.share_link_max_days
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END
$$;
CREATE TRIGGER share_links_guard BEFORE INSERT ON app.share_links FOR EACH ROW EXECUTE FUNCTION app.guard_share_link();
CREATE TRIGGER share_links_perm  BEFORE INSERT OR UPDATE OR DELETE ON app.share_links
  FOR EACH ROW EXECUTE FUNCTION app.guard_permission('invite');

-- Abrir un enlace (aún sin saber la organización). Devuelve lo mínimo; el contenido (snapshot) SOLO si el enlace es
-- público. Uno interno devuelve a qué organización pertenece: la API compara con la de la sesión y, si no coincide,
-- responde 404 — así el enlace no sirve para espiar entre organizaciones.
CREATE FUNCTION app.resolve_share_link(p_token_hash bytea)
RETURNS TABLE (organization_id uuid, project_id uuid, page_id text, audience text, access text,
               password_hash text, publication_id uuid, snapshot jsonb)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, app, pg_temp AS
$$
  SELECT l.organization_id, l.project_id, l.page_id, l.audience, l.access, l.password_hash, l.publication_id,
         CASE WHEN l.audience = 'anyone' THEN pub.snapshot END
  FROM app.share_links l
  JOIN app.organizations o ON o.id = l.organization_id AND o.status = 'active' AND o.deleted_at IS NULL
  LEFT JOIN app.publications pub ON pub.organization_id = l.organization_id AND pub.project_id = l.project_id AND pub.id = l.publication_id
  WHERE l.token_hash = p_token_hash AND l.revoked_at IS NULL AND (l.expires_at IS NULL OR l.expires_at > now())
$$;

-- ───────── Trabajo en tiempo real: registro de operaciones ─────────
-- Un cliente edita enviando ACCIONES del reducer (las 45 de SiteAction). El servidor las ordena con un número de
-- secuencia por rama, las guarda y las difunde; quien se conecta tarde pide «dame todo desde la seq N» y se pone al día.
-- La presencia (quién está, dónde está su cursor, qué elemento tiene seleccionado) NO va a Postgres: cambia varias
-- veces por segundo y llenaría la tabla de filas muertas. Vive en memoria / Redis. Para difundir, la API publica en
-- Redis DESPUÉS del commit; no uses LISTEN/NOTIFY aquí (serializa los commits con un bloqueo global).

-- Contador de secuencia por rama, separado de projects para que editar no suba project.row_version.
CREATE TABLE app.branch_sync (
  organization_id uuid   NOT NULL,
  project_id      uuid   NOT NULL,
  branch_id       uuid   NOT NULL,
  next_seq        bigint NOT NULL DEFAULT 1 CHECK (next_seq > 0),
  -- Operaciones con seq <= este valor ya se archivaron: un cliente más atrasado debe recargar la rama entera.
  compacted_through bigint NOT NULL DEFAULT 0 CHECK (compacted_through >= 0),
  PRIMARY KEY (organization_id, project_id, branch_id),
  FOREIGN KEY (organization_id, project_id, branch_id) REFERENCES app.branches (organization_id, project_id, id) ON DELETE CASCADE
);
CREATE FUNCTION app.create_branch_sync() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, app, pg_temp AS
$$ BEGIN INSERT INTO app.branch_sync (organization_id, project_id, branch_id) VALUES (NEW.organization_id, NEW.project_id, NEW.id); RETURN NULL; END $$;
CREATE TRIGGER branches_create_sync AFTER INSERT ON app.branches FOR EACH ROW EXECUTE FUNCTION app.create_branch_sync();

-- Rama 1 ── N operaciones. Inmutable.
CREATE TABLE app.edit_operations (
  organization_id uuid        NOT NULL,
  project_id      uuid        NOT NULL,
  branch_id       uuid        NOT NULL,
  seq             bigint      NOT NULL CHECK (seq > 0),
  actor_id        uuid        NOT NULL,
  -- Pestaña/dispositivo que la envió: lo usa para no volver a aplicar sus propias operaciones al recibirlas.
  client_id       uuid        NOT NULL,
  action          jsonb       NOT NULL CHECK (jsonb_typeof(action) = 'object' AND jsonb_typeof(action -> 'type') = 'string'),
  created_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, project_id, branch_id, seq),
  FOREIGN KEY (organization_id, project_id, branch_id) REFERENCES app.branches (organization_id, project_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, actor_id) REFERENCES app.users (organization_id, id)
);
CREATE TRIGGER edit_operations_immutable BEFORE UPDATE ON app.edit_operations FOR EACH ROW EXECUTE FUNCTION app.forbid_update();
CREATE TRIGGER edit_operations_guard BEFORE INSERT ON app.edit_operations
  FOR EACH ROW EXECUTE FUNCTION app.guard_branch_write();

-- Reserva un rango de secuencias y guarda varias acciones en UNA ida y vuelta. Devuelve la primera seq.
-- Se ejecuta con los permisos de quien llama: RLS y los permisos de 0010 siguen aplicando.
CREATE FUNCTION app.append_operations(p_branch uuid, p_client uuid, p_actions jsonb) RETURNS bigint
LANGUAGE plpgsql AS
$$
DECLARE
  v_org     uuid := app.current_org();
  v_project uuid;
  v_n       int;
  v_first   bigint;
BEGIN
  IF jsonb_typeof(p_actions) <> 'array' THEN RAISE EXCEPTION 'Se esperaba una lista de acciones' USING ERRCODE = 'invalid_parameter_value'; END IF;
  v_n := jsonb_array_length(p_actions);
  IF v_n NOT BETWEEN 1 AND 500 THEN RAISE EXCEPTION 'Entre 1 y 500 acciones por envío' USING ERRCODE = 'invalid_parameter_value'; END IF;

  SELECT b.project_id INTO v_project FROM app.branches b WHERE b.organization_id = v_org AND b.id = p_branch AND b.deleted_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'La rama no existe' USING ERRCODE = 'no_data_found'; END IF;

  UPDATE app.branch_sync SET next_seq = next_seq + v_n
  WHERE organization_id = v_org AND project_id = v_project AND branch_id = p_branch
  RETURNING next_seq - v_n INTO v_first;

  INSERT INTO app.edit_operations (organization_id, project_id, branch_id, seq, actor_id, client_id, action)
  SELECT v_org, v_project, p_branch, v_first + (t.ord - 1), app.current_user_id(), p_client, t.action
  FROM jsonb_array_elements(p_actions) WITH ORDINALITY AS t(action, ord);
  RETURN v_first;
END
$$;

-- Archiva operaciones ya incluidas en una versión guardada (la ejecuta la plataforma, p. ej. cada noche).
CREATE FUNCTION app.compact_operations(p_branch uuid, p_through bigint) RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, app, pg_temp AS
$$
DECLARE v_deleted bigint;
BEGIN
  DELETE FROM app.edit_operations WHERE branch_id = p_branch AND seq <= p_through;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  UPDATE app.branch_sync SET compacted_through = greatest(compacted_through, p_through) WHERE branch_id = p_branch;
  RETURN v_deleted;
END
$$;

REVOKE ALL ON FUNCTION app.resolve_invitation(bytea), app.accept_invitation(bytea, text, text, text),
  app.resolve_share_link(bytea), app.compact_operations(uuid, bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.resolve_invitation(bytea), app.accept_invitation(bytea, text, text, text),
  app.resolve_share_link(bytea) TO portal_app;
GRANT EXECUTE ON FUNCTION app.compact_operations(uuid, bigint) TO portal_platform;
GRANT EXECUTE ON FUNCTION app.append_operations(uuid, uuid, jsonb) TO portal_app;

SELECT app.apply_rls();
SELECT app.apply_grants();
