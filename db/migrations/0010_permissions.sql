-- 0010 · Permisos. Lo que hoy decide `hasPermission()` en el navegador, la base de datos lo hace cumplir también.
--
-- Un permiso se concede cuando coinciden CUATRO cosas (y ninguna lo veta):
--   1. el ROL de la cuenta lo tiene        role_permissions  (+ ajustes de la organización)
--   2. el ROL EN EL PROYECTO lo tiene      member_role_permissions  (viewer / commenter / reviewer / editor)
--   3. la cuenta no lo tiene VETADO        project_members.denied
--   4. su acceso no ha VENCIDO             project_members.expires_at
-- y, para editar contenido, además el ALCANCE (páginas/secciones asignadas) si está limitado.
-- Los superadministradores no se limitan. Las sesiones que saltan RLS (dueño, plataforma) son "del sistema".
-- Sin usuario en la sesión, la API no puede escribir nada: se falla cerrado.

CREATE DOMAIN app.permission AS text CHECK (VALUE IN (
  'viewAll', 'editContent', 'editStyles', 'editCode', 'editData', 'installLibraries',
  'invite', 'publishMain', 'manageUsers', 'viewAudit', 'deploy', 'comment'));

-- Matriz por defecto de la plataforma (igual que roleAllows() en auth-context.tsx).
CREATE TABLE app.role_permissions (
  role       text           NOT NULL CHECK (role IN ('superadmin', 'dev', 'designer')),
  permission app.permission NOT NULL,
  PRIMARY KEY (role, permission)
);
INSERT INTO app.role_permissions (role, permission)
SELECT r.role, p.permission
FROM (VALUES ('superadmin'), ('dev'), ('designer')) r(role)
CROSS JOIN (VALUES ('viewAll'), ('editContent'), ('editStyles'), ('editCode'), ('editData'), ('installLibraries'),
                   ('invite'), ('publishMain'), ('manageUsers'), ('viewAudit'), ('deploy'), ('comment')) p(permission)
WHERE r.role = 'superadmin'
   OR (r.role = 'dev' AND p.permission <> 'manageUsers')
   OR (r.role = 'designer' AND p.permission IN ('viewAll', 'editContent', 'invite', 'publishMain', 'comment'));

-- Techo que pone el rol dentro de un proyecto. manageUsers no aparece: es de la organización, no del proyecto.
CREATE TABLE app.member_role_permissions (
  member_role text           NOT NULL CHECK (member_role IN ('viewer', 'commenter', 'reviewer', 'editor')),
  permission  app.permission NOT NULL,
  PRIMARY KEY (member_role, permission)
);
INSERT INTO app.member_role_permissions (member_role, permission) VALUES
  ('viewer', 'viewAll'),
  ('commenter', 'viewAll'), ('commenter', 'comment'),
  ('reviewer', 'viewAll'), ('reviewer', 'comment'), ('reviewer', 'publishMain'),   -- fusiona en main
  ('editor', 'viewAll'), ('editor', 'comment'), ('editor', 'editContent'), ('editor', 'editStyles'),
  ('editor', 'editCode'), ('editor', 'editData'), ('editor', 'installLibraries'), ('editor', 'invite'),
  ('editor', 'publishMain'), ('editor', 'viewAudit'), ('editor', 'deploy');

-- Qué rol puede dar quién al invitar (GIVES en invite-account-form.tsx).
CREATE TABLE app.role_grants (
  granter_role text NOT NULL CHECK (granter_role IN ('superadmin', 'dev', 'designer')),
  granted_role text NOT NULL CHECK (granted_role IN ('superadmin', 'dev', 'designer')),
  PRIMARY KEY (granter_role, granted_role)
);
INSERT INTO app.role_grants VALUES ('superadmin', 'dev'), ('superadmin', 'designer'),
  ('dev', 'dev'), ('dev', 'designer'), ('designer', 'designer');

-- ───────── El modelo de trabajo es POR ORGANIZACIÓN ─────────
-- Cada organización ajusta sus reglas sin tocar a las demás.
-- Organización 1 ── 1 ajustes.
CREATE TABLE app.organization_settings (
  organization_id uuid PRIMARY KEY REFERENCES app.organizations (id) ON DELETE CASCADE,
  -- ¿Se permiten enlaces para compartir con personas SIN cuenta?
  allow_public_share_links boolean NOT NULL DEFAULT true,
  -- Los enlaces públicos siempre vencen; este es el máximo en días.
  share_link_max_days      int     NOT NULL DEFAULT 30  CHECK (share_link_max_days BETWEEN 1 AND 365),
  invitation_ttl_hours     int     NOT NULL DEFAULT 168 CHECK (invitation_ttl_hours BETWEEN 1 AND 720),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  row_version int         NOT NULL DEFAULT 1
);
CREATE TRIGGER organization_settings_touch BEFORE UPDATE ON app.organization_settings
  FOR EACH ROW EXECUTE FUNCTION app.touch();

CREATE FUNCTION app.create_organization_settings() RETURNS trigger
LANGUAGE plpgsql AS
$$ BEGIN INSERT INTO app.organization_settings (organization_id) VALUES (NEW.id); RETURN NULL; END $$;
CREATE TRIGGER organizations_create_settings AFTER INSERT ON app.organizations
  FOR EACH ROW EXECUTE FUNCTION app.create_organization_settings();

-- Excepciones a la matriz por defecto: la organización le da o le quita permisos a un rol.
-- Los superadministradores no se tocan: una organización nunca puede quedarse sin quien la administre.
-- Organización 1 ── N excepciones.
CREATE TABLE app.organization_role_permissions (
  organization_id uuid           NOT NULL REFERENCES app.organizations (id) ON DELETE CASCADE,
  role            text           NOT NULL CHECK (role IN ('dev', 'designer')),
  permission      app.permission NOT NULL,
  allowed         boolean        NOT NULL,
  PRIMARY KEY (organization_id, role, permission)
);

-- ───────── Funciones de decisión ─────────
-- Sesión «del sistema»: la de quien NO es la API ni el soporte de solo lectura. Es decir, el dueño de las tablas
-- (migraciones, funciones SECURITY DEFINER, cascadas) y portal_platform. Se decide por pertenencia DIRECTA a
-- portal_app / portal_readonly (las cuentas de login de la API deben crearse con IN ROLE portal_app): consultar
-- pg_roles en cada fila costaba ~1 ms y esto se llama varias veces por fila; aquí es una búsqueda por índice.
CREATE FUNCTION app.is_system_session() RETURNS boolean
LANGUAGE sql STABLE AS
$$ SELECT NOT (
     current_user IN ('portal_app', 'portal_readonly')
     OR EXISTS (SELECT 1 FROM pg_auth_members m
                WHERE m.roleid IN ('portal_app'::regrole, 'portal_readonly'::regrole) AND m.member = to_regrole(current_user)::oid)) $$;

-- ¿Puede la persona de esta transacción hacer `p_permission` en el proyecto? (cálculo completo, sin caché)
CREATE FUNCTION app.has_permission_uncached(p_project uuid, p_permission text) RETURNS boolean
LANGUAGE plpgsql STABLE AS
$$
DECLARE
  v_user     uuid := app.current_user_id();
  v_org      uuid := app.current_org();
  v_role     text;
  v_by_role  boolean;
  m          record;
BEGIN
  IF v_user IS NULL THEN RETURN false; END IF;

  SELECT u.role INTO v_role FROM app.users u
  WHERE u.organization_id = v_org AND u.id = v_user AND u.status = 'active' AND u.deleted_at IS NULL;
  IF v_role IS NULL THEN RETURN false; END IF;

  -- 1. Rol de la cuenta: la excepción de la organización manda; si no hay, la matriz por defecto.
  SELECT coalesce(
           (SELECT o.allowed FROM app.organization_role_permissions o
             WHERE o.organization_id = v_org AND o.role = v_role AND o.permission = p_permission),
           EXISTS (SELECT 1 FROM app.role_permissions r WHERE r.role = v_role AND r.permission = p_permission))
    INTO v_by_role;
  IF NOT v_by_role THEN RETURN false; END IF;
  IF v_role = 'superadmin' THEN RETURN true; END IF;

  -- 2-4. Rol en el proyecto, vetos y vencimiento.
  SELECT pm.member_role, pm.denied, pm.expires_at INTO m FROM app.project_members pm
  WHERE pm.organization_id = v_org AND pm.project_id = p_project AND pm.user_id = v_user;
  IF NOT FOUND THEN RETURN false; END IF;
  IF m.expires_at IS NOT NULL AND m.expires_at <= now() THEN RETURN false; END IF;
  IF p_permission = ANY (m.denied) THEN RETURN false; END IF;
  RETURN EXISTS (SELECT 1 FROM app.member_role_permissions x WHERE x.member_role = m.member_role AND x.permission = p_permission);
END
$$;

-- Guardar 30 bloques dispara 30 comprobaciones; sin caché eran ~10 consultas cada una (110-180 ms por guardado).
-- La decisión se recuerda DENTRO de la transacción (set_config local: muere con ella, no se filtra por el pool) y se
-- invalida sola cuando esa misma transacción cambia usuarios, membresías o la matriz de la organización (época).
CREATE FUNCTION app.bump_permission_epoch() RETURNS trigger
LANGUAGE plpgsql AS
$$
BEGIN
  PERFORM set_config('app.pc_epoch', (coalesce(nullif(current_setting('app.pc_epoch', true), ''), '0')::int + 1)::text, true);
  RETURN NULL;
END
$$;
CREATE TRIGGER users_bump_epoch                   AFTER INSERT OR UPDATE OR DELETE ON app.users                         FOR EACH STATEMENT EXECUTE FUNCTION app.bump_permission_epoch();
CREATE TRIGGER project_members_bump_epoch         AFTER INSERT OR UPDATE OR DELETE ON app.project_members               FOR EACH STATEMENT EXECUTE FUNCTION app.bump_permission_epoch();
CREATE TRIGGER organization_role_permissions_bump AFTER INSERT OR UPDATE OR DELETE ON app.organization_role_permissions FOR EACH STATEMENT EXECUTE FUNCTION app.bump_permission_epoch();

-- Clave de caché: época + persona + proyecto + lo que se pregunta.
CREATE FUNCTION app.perm_cache_key(p_project uuid, p_what text) RETURNS text
LANGUAGE sql STABLE AS
$$ SELECT 'app.pc.k' || md5(coalesce(current_setting('app.pc_epoch', true), '') || '|' || coalesce(app.current_user_id()::text, '')
                            || '|' || coalesce(p_project::text, '') || '|' || p_what) $$;

-- Quien salta RLS (dueño, plataforma, funciones SECURITY DEFINER) salta también los permisos; sin usuario, nada.
-- VOLATILE porque escribe la caché.
CREATE FUNCTION app.has_permission(p_project uuid, p_permission text) RETURNS boolean
LANGUAGE plpgsql VOLATILE AS
$$
DECLARE
  v_key    text;
  v_cached text;
  v_result boolean;
BEGIN
  IF app.is_system_session() THEN RETURN true; END IF;
  IF app.current_user_id() IS NULL THEN RETURN false; END IF;
  v_key    := app.perm_cache_key(p_project, p_permission);
  v_cached := nullif(current_setting(v_key, true), '');
  IF v_cached IS NOT NULL THEN RETURN v_cached = 't'; END IF;
  v_result := app.has_permission_uncached(p_project, p_permission);
  PERFORM set_config(v_key, CASE WHEN v_result THEN 't' ELSE 'f' END, true);
  RETURN v_result;
END
$$;

-- ¿Puede tocar esa página o esa sección? (permiso de contenido + alcance asignado, si lo tiene limitado)
CREATE FUNCTION app.can_edit_content(p_project uuid, p_page text, p_block text DEFAULT NULL) RETURNS boolean
LANGUAGE plpgsql VOLATILE AS
$$
DECLARE
  v_user    uuid := app.current_user_id();
  v_org     uuid := app.current_org();
  v_key     text;
  v_limited text;
BEGIN
  IF app.is_system_session() THEN RETURN true; END IF;
  IF NOT app.has_permission(p_project, 'editContent') THEN RETURN false; END IF;

  -- «¿Tiene el alcance limitado?» no cambia dentro de la transacción: se calcula una vez (los superadmin, nunca).
  v_key     := app.perm_cache_key(p_project, 'limited');
  v_limited := nullif(current_setting(v_key, true), '');
  IF v_limited IS NULL THEN
    SELECT CASE WHEN u.role = 'superadmin' THEN 'n' WHEN coalesce(pm.scope_limited, true) THEN 'y' ELSE 'n' END INTO v_limited
    FROM app.users u
    LEFT JOIN app.project_members pm ON pm.organization_id = u.organization_id AND pm.project_id = p_project AND pm.user_id = u.id
    WHERE u.organization_id = v_org AND u.id = v_user;
    PERFORM set_config(v_key, coalesce(v_limited, 'y'), true);
  END IF;
  IF v_limited = 'n' THEN RETURN true; END IF;

  RETURN EXISTS (SELECT 1 FROM app.member_scope_pages s WHERE s.organization_id = v_org AND s.project_id = p_project
                   AND s.user_id = v_user AND s.page_id = p_page)
      OR (p_block IS NOT NULL AND EXISTS (SELECT 1 FROM app.member_scope_blocks s WHERE s.organization_id = v_org
                   AND s.project_id = p_project AND s.user_id = v_user AND s.block_id = p_block));
END
$$;

-- Atajo del caso común: ¿puede editar TODO el contenido del proyecto (permiso de contenido y sin alcance limitado)?
-- Una sola consulta a la caché por fila; solo quien tiene el alcance limitado pasa a la comprobación fina.
CREATE FUNCTION app.can_edit_all_content(p_project uuid) RETURNS boolean
LANGUAGE plpgsql VOLATILE AS
$$
DECLARE
  v_key    text;
  v_cached text;
  v_result boolean;
BEGIN
  IF app.is_system_session() THEN RETURN true; END IF;
  v_key    := app.perm_cache_key(p_project, 'all');
  v_cached := nullif(current_setting(v_key, true), '');
  IF v_cached IS NOT NULL THEN RETURN v_cached = 't'; END IF;
  v_result := app.can_edit_content(p_project, NULL, NULL);        -- sin página: solo es cierto si no hay alcance limitado
  PERFORM set_config(v_key, CASE WHEN v_result THEN 't' ELSE 'f' END, true);
  RETURN v_result;
END
$$;

-- ───────── Guardas (disparadores) ─────────
CREATE FUNCTION app.deny(p_what text) RETURNS void
LANGUAGE plpgsql AS
$$ BEGIN RAISE EXCEPTION 'No tienes permiso para %', p_what USING ERRCODE = 'insufficient_privilege'; END $$;

-- Tablas que exigen un permiso concreto. Uno nuevo es una línea en la lista de abajo.
CREATE FUNCTION app.guard_permission() RETURNS trigger
LANGUAGE plpgsql AS
$$
DECLARE v_project uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN v_project := OLD.project_id; ELSE v_project := NEW.project_id; END IF;
  IF NOT app.has_permission(v_project, TG_ARGV[0]) THEN PERFORM app.deny(TG_ARGV[0]); END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END
$$;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('style_variables', 'editStyles'),   ('style_rules', 'editStyles'),
    ('shared_functions', 'editCode'),    ('data_sources', 'editData'),
    ('project_libraries', 'installLibraries'),
    ('components', 'editContent'),       ('assets', 'editContent'),
    ('branches', 'editContent'),         ('site_snapshots', 'editContent'),
    ('publications', 'publishMain'),
    ('deploy_targets', 'deploy'),        ('deployments', 'deploy'),     ('project_domains', 'deploy'),
    ('project_members', 'invite'),
    ('issues', 'comment'),               ('design_comments', 'comment')
  ) t(tbl, perm)
  LOOP
    EXECUTE format('CREATE TRIGGER %I BEFORE INSERT OR UPDATE OR DELETE ON app.%I
                    FOR EACH ROW EXECUTE FUNCTION app.guard_permission(%L)', r.tbl || '_guard', r.tbl, r.perm);
  END LOOP;
END
$$;

-- Páginas, secciones y medios: permiso de contenido + alcance.
CREATE FUNCTION app.guard_content() RETURNS trigger
LANGUAGE plpgsql AS
$$
DECLARE
  v_old_page text; v_old_block text; v_new_page text; v_new_block text;
  v_position_only boolean := false;
BEGIN
  IF app.can_edit_all_content(CASE WHEN TG_OP = 'DELETE' THEN OLD.project_id ELSE NEW.project_id END) THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;

  IF TG_OP <> 'INSERT' THEN
    IF TG_TABLE_NAME = 'pages' THEN v_old_page := OLD.id; ELSE v_old_page := OLD.page_id; END IF;
    IF TG_TABLE_NAME = 'blocks' THEN v_old_block := OLD.id; END IF;
  END IF;
  IF TG_OP <> 'DELETE' THEN
    IF TG_TABLE_NAME = 'pages' THEN v_new_page := NEW.id; ELSE v_new_page := NEW.page_id; END IF;
    IF TG_TABLE_NAME = 'blocks' THEN v_new_block := NEW.id; END IF;
  END IF;

  -- Reordenar solo la posición de una sección no exige poseer esa sección (insertar otra desplaza a sus vecinas).
  IF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'blocks' THEN
    v_position_only := NEW.position IS DISTINCT FROM OLD.position
      AND (NEW.page_id, NEW.component_id, NEW.slot, NEW.scope, NEW.hidden, NEW.locked, NEW.format)
          IS NOT DISTINCT FROM (OLD.page_id, OLD.component_id, OLD.slot, OLD.scope, OLD.hidden, OLD.locked, OLD.format);
  ELSIF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'media_items' THEN
    v_position_only := NEW.position IS DISTINCT FROM OLD.position AND (to_jsonb(NEW) - 'position') = (to_jsonb(OLD) - 'position');
  END IF;
  IF v_position_only THEN
    IF NOT app.has_permission(NEW.project_id, 'editContent') THEN PERFORM app.deny('editContent'); END IF;
    RETURN NEW;
  END IF;

  -- Cada fila implicada (la vieja y/o la nueva) se comprueba: mover una sección a otra página exige las dos.
  IF TG_OP <> 'INSERT' AND NOT app.can_edit_content(OLD.project_id, v_old_page, v_old_block) THEN
    PERFORM app.deny('editar esta página o sección');
  END IF;
  IF TG_OP <> 'DELETE' AND NOT app.can_edit_content(NEW.project_id, v_new_page, v_new_block) THEN
    PERFORM app.deny('editar esta página o sección');
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END
$$;

CREATE TRIGGER pages_guard       BEFORE INSERT OR UPDATE OR DELETE ON app.pages       FOR EACH ROW EXECUTE FUNCTION app.guard_content();
CREATE TRIGGER blocks_guard      BEFORE INSERT OR UPDATE OR DELETE ON app.blocks      FOR EACH ROW EXECUTE FUNCTION app.guard_content();
CREATE TRIGGER media_items_guard BEFORE INSERT OR UPDATE OR DELETE ON app.media_items FOR EACH ROW EXECUTE FUNCTION app.guard_content();

-- Escribir en una rama (versiones y operaciones de edición), como en GitHub:
--   main  → solo quien tiene `publishMain`; los demás trabajan en su rama y envían una pull request;
--   otra  → su dueño con `editContent`, o quien tenga `publishMain` (puede corregirla y fusionarla).
CREATE FUNCTION app.guard_branch_write() RETURNS trigger
LANGUAGE plpgsql AS
$$
DECLARE b app.branches;
BEGIN
  SELECT * INTO b FROM app.branches
  WHERE organization_id = NEW.organization_id AND project_id = NEW.project_id AND id = NEW.branch_id;
  IF b.is_main THEN
    IF NOT app.has_permission(NEW.project_id, 'publishMain') THEN
      PERFORM app.deny('escribir directo en main: trabaja en tu rama y envía una pull request');
    END IF;
  ELSIF NOT app.has_permission(NEW.project_id, 'editContent')
        OR (b.owner_id IS DISTINCT FROM app.current_user_id() AND NOT app.has_permission(NEW.project_id, 'publishMain')) THEN
    PERFORM app.deny('escribir en la rama de otra persona');
  END IF;
  RETURN NEW;
END
$$;
CREATE TRIGGER commits_guard BEFORE INSERT ON app.commits FOR EACH ROW EXECUTE FUNCTION app.guard_branch_write();

-- Cada rama es de quien la crea; main nace con el proyecto. Nadie cambia después el dueño ni el origen de una rama.
CREATE FUNCTION app.guard_branch() RETURNS trigger
LANGUAGE plpgsql AS
$$
BEGIN
  IF app.is_system_session() THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_main OR NEW.owner_id IS DISTINCT FROM app.current_user_id() THEN
      PERFORM app.deny('crear una rama a nombre de otra persona');
    END IF;
  ELSIF (NEW.is_main, NEW.owner_id, NEW.base_branch_id, NEW.fork_commit_id)
        IS DISTINCT FROM (OLD.is_main, OLD.owner_id, OLD.base_branch_id, OLD.fork_commit_id) THEN
    PERFORM app.deny('cambiar el origen o el dueño de una rama');
  END IF;
  RETURN NEW;
END
$$;
CREATE TRIGGER branches_guard_owner BEFORE INSERT OR UPDATE ON app.branches FOR EACH ROW EXECUTE FUNCTION app.guard_branch();

-- Las tablas de contenido SON el estado de main (las demás ramas viven como fotos y operaciones, no como filas).
-- Escribirlas equivale a escribir en main: exige `publishMain`, además del permiso propio de cada tabla.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['pages', 'blocks', 'media_items', 'components', 'style_variables', 'style_rules',
                           'shared_functions', 'data_sources', 'project_libraries', 'animations', 'animation_steps']
  LOOP
    EXECUTE format('CREATE TRIGGER %I BEFORE INSERT OR UPDATE OR DELETE ON app.%I
                    FOR EACH ROW EXECUTE FUNCTION app.guard_permission(%L)', t || '_main_guard', t, 'publishMain');
  END LOOP;
END
$$;

-- Los ajustes del proyecto (nombre, transición por defecto, publicación en línea) también son de main.
CREATE FUNCTION app.guard_project() RETURNS trigger
LANGUAGE plpgsql AS
$$
BEGIN
  IF NOT app.has_permission(OLD.id, 'publishMain') THEN PERFORM app.deny('cambiar los ajustes del proyecto'); END IF;
  RETURN NEW;
END
$$;
CREATE TRIGGER projects_guard BEFORE UPDATE ON app.projects FOR EACH ROW EXECUTE FUNCTION app.guard_project();

-- Al invitar, solo se puede dar un rol que el tuyo permita dar (superadmin→dev/designer, dev→dev/designer, designer→designer).
CREATE FUNCTION app.guard_granted_role() RETURNS trigger
LANGUAGE plpgsql AS
$$
BEGIN
  IF NEW.invited_by IS NOT NULL AND NOT EXISTS (
       SELECT 1 FROM app.users g JOIN app.role_grants rg ON rg.granter_role = g.role AND rg.granted_role = NEW.role
       WHERE g.organization_id = NEW.organization_id AND g.id = NEW.invited_by) THEN
    RAISE EXCEPTION 'Quien invita no puede dar el rol %', NEW.role USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN NEW;
END
$$;
CREATE TRIGGER users_guard_granted_role BEFORE INSERT OR UPDATE OF role, invited_by ON app.users
  FOR EACH ROW EXECUTE FUNCTION app.guard_granted_role();

-- Ajustar el modelo de trabajo de la organización es cosa de su superadministrador.
CREATE FUNCTION app.guard_org_admin() RETURNS trigger
LANGUAGE plpgsql AS
$$
BEGIN
  IF NOT app.has_permission(NULL, 'manageUsers') THEN PERFORM app.deny('cambiar el modelo de trabajo'); END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END
$$;
CREATE TRIGGER organization_settings_guard BEFORE UPDATE ON app.organization_settings
  FOR EACH ROW EXECUTE FUNCTION app.guard_org_admin();
CREATE TRIGGER organization_role_permissions_guard BEFORE INSERT OR UPDATE OR DELETE ON app.organization_role_permissions
  FOR EACH ROW EXECUTE FUNCTION app.guard_org_admin();
-- Las cuentas externas de la organización (credenciales de Vercel, FTP…) también las administra su superadministrador.
CREATE TRIGGER organization_integrations_guard BEFORE INSERT OR UPDATE OR DELETE ON app.organization_integrations
  FOR EACH ROW EXECUTE FUNCTION app.guard_org_admin();
