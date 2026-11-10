-- 0019 · Unidades (departamentos) dentro de una organización.
--
-- Una organización tiene UN sitio y varias unidades (Zoonosis, Salud, Comunicación…). Cada página y cada archivo de la biblioteca
-- es de una unidad, o es GLOBAL (unit_id nulo). Una persona puede estar en varias unidades. Lo que decide qué puede hacer es:
--   · el TIPO de la unidad (designer / dev), que pone el techo de sus miembros (se suma a las condiciones de 0010);
--   · de quién es la página: solo se edita lo de las unidades propias, y lo global exige `can_edit_global()`.
-- Todo es aditivo: una organización SIN unidades funciona exactamente como antes. En cuanto tiene alguna, quien no es
-- superadministrador queda sujeto a ellas (también quien no está en ninguna: quitar a alguien de su unidad no le abre todo).

-- ───────── Tablas y columnas ─────────
-- Organización 1 ── N unidades.
CREATE TABLE app.units (
  id              uuid        PRIMARY KEY DEFAULT app.new_id(),
  organization_id uuid        NOT NULL REFERENCES app.organizations (id),
  name            app.citext  NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 120),
  kind            text        NOT NULL CHECK (kind IN ('designer', 'dev')),
  -- Quien recibe a revisión lo que envían los miembros (y publica aunque haya revisión obligatoria).
  owner_id        uuid,
  -- Los miembros no publican directo en main: todo pasa por revisión (el dueño sí publica).
  review_required boolean     NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz,
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, owner_id) REFERENCES app.users (organization_id, id)
);
CREATE UNIQUE INDEX units_name_key ON app.units (organization_id, name) WHERE deleted_at IS NULL;

-- Unidad N ── M persona: una persona puede trabajar en varias unidades.
CREATE TABLE app.unit_members (
  organization_id uuid NOT NULL,
  unit_id         uuid NOT NULL,
  user_id         uuid NOT NULL,
  PRIMARY KEY (organization_id, unit_id, user_id),
  FOREIGN KEY (organization_id, unit_id) REFERENCES app.units (organization_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, user_id) REFERENCES app.users (organization_id, id) ON DELETE CASCADE
);
CREATE INDEX unit_members_user_idx ON app.unit_members (organization_id, user_id);

-- Lo máximo que permite cada tipo de unidad (como role_permissions, pero para unidades).
CREATE TABLE app.unit_kind_permissions (
  kind       text           NOT NULL CHECK (kind IN ('designer', 'dev')),
  permission app.permission NOT NULL,
  PRIMARY KEY (kind, permission)
);
INSERT INTO app.unit_kind_permissions (kind, permission)
SELECT k.kind, p.permission
FROM (VALUES ('designer'), ('dev')) k(kind)
CROSS JOIN (VALUES ('viewAll'), ('editContent'), ('editStyles'), ('editCode'), ('editData'), ('installLibraries'),
                   ('invite'), ('publishMain'), ('manageUsers'), ('viewAudit'), ('deploy'), ('comment')) p(permission)
WHERE (k.kind = 'dev' AND p.permission <> 'manageUsers')
   OR (k.kind = 'designer' AND p.permission IN ('viewAll', 'editContent', 'invite', 'publishMain', 'comment', 'deploy'));

-- Ajustes de una unidad concreta sobre su tipo (los hace el superadministrador).
CREATE TABLE app.unit_permission_overrides (
  organization_id uuid           NOT NULL,
  unit_id         uuid           NOT NULL,
  permission      app.permission NOT NULL,
  allowed         boolean        NOT NULL,
  PRIMARY KEY (organization_id, unit_id, permission),
  FOREIGN KEY (organization_id, unit_id) REFERENCES app.units (organization_id, id) ON DELETE CASCADE
);

-- Quienes pueden editar lo global (cabecera, pie, estilos y medios comunes). El superadministrador siempre puede.
ALTER TABLE app.users ADD COLUMN can_edit_global boolean NOT NULL DEFAULT false;

-- Dueño del contenido: nulo = global. La clave compuesta impide apuntar a una unidad de otra organización.
ALTER TABLE app.pages  ADD COLUMN unit_id uuid;
ALTER TABLE app.pages  ADD FOREIGN KEY (organization_id, unit_id) REFERENCES app.units (organization_id, id);
ALTER TABLE app.assets ADD COLUMN unit_id uuid;
ALTER TABLE app.assets ADD FOREIGN KEY (organization_id, unit_id) REFERENCES app.units (organization_id, id);
CREATE INDEX pages_unit_idx  ON app.pages  (organization_id, unit_id) WHERE unit_id IS NOT NULL;
CREATE INDEX assets_unit_idx ON app.assets (organization_id, unit_id) WHERE unit_id IS NOT NULL;

-- El mismo archivo subido por dos unidades se guarda una vez por unidad (aislamiento total entre ellas).
DROP INDEX app.assets_content_key;
CREATE UNIQUE INDEX assets_content_key ON app.assets (organization_id, project_id, coalesce(unit_id, '00000000-0000-0000-0000-000000000000'::uuid), sha256)
  WHERE deleted_at IS NULL AND status <> 'failed';

-- ───────── Funciones de decisión ─────────
-- ¿La organización usa unidades y esta persona está sujeta a ellas? (El superadministrador no lo está.)
CREATE FUNCTION app.unit_scoped() RETURNS boolean
LANGUAGE sql STABLE AS
$$ SELECT NOT app.is_org_superadmin()
          AND EXISTS (SELECT 1 FROM app.units u WHERE u.organization_id = app.current_org() AND u.deleted_at IS NULL) $$;

-- Las unidades (vigentes) de la persona de esta transacción.
CREATE FUNCTION app.user_unit_ids() RETURNS uuid[]
LANGUAGE sql STABLE AS
$$ SELECT coalesce(array_agg(m.unit_id), '{}'::uuid[])
   FROM app.unit_members m
   JOIN app.units u ON u.organization_id = m.organization_id AND u.id = m.unit_id AND u.deleted_at IS NULL
   WHERE m.organization_id = app.current_org() AND m.user_id = app.current_user_id() $$;

-- ¿Puede editar lo global? Superadministrador o persona marcada. Las sesiones del sistema, siempre.
CREATE FUNCTION app.can_edit_global() RETURNS boolean
LANGUAGE sql STABLE AS
$$ SELECT app.is_system_session()
       OR coalesce((SELECT u.role = 'superadmin' OR u.can_edit_global FROM app.users u
                    WHERE u.organization_id = app.current_org() AND u.id = app.current_user_id()
                      AND u.status = 'active' AND u.deleted_at IS NULL), false) $$;

-- ¿Concede esta unidad el permiso? Su tipo, con los ajustes encima; con revisión obligatoria, publicar en main es del dueño.
CREATE FUNCTION app.unit_allows(p_unit uuid, p_permission text) RETURNS boolean
LANGUAGE sql STABLE AS
$$ SELECT coalesce((
     SELECT coalesce(
              (SELECT o.allowed FROM app.unit_permission_overrides o
                WHERE o.organization_id = u.organization_id AND o.unit_id = u.id AND o.permission = p_permission),
              EXISTS (SELECT 1 FROM app.unit_kind_permissions k WHERE k.kind = u.kind AND k.permission = p_permission))
            AND NOT (p_permission = 'publishMain' AND u.review_required AND u.owner_id IS DISTINCT FROM app.current_user_id())
     FROM app.units u WHERE u.organization_id = app.current_org() AND u.id = p_unit AND u.deleted_at IS NULL), false) $$;

-- La unidad de una página (nulo si es global o no existe).
CREATE FUNCTION app.page_unit(p_project uuid, p_page text) RETURNS uuid
LANGUAGE sql STABLE AS
$$ SELECT p.unit_id FROM app.pages p WHERE p.organization_id = app.current_org() AND p.project_id = p_project AND p.id = p_page $$;

-- La unidad que manda sobre una fila de contenido: la de su página; una sección global es de todos (nulo).
CREATE FUNCTION app.content_unit(p_table text, p_row jsonb) RETURNS uuid
LANGUAGE sql STABLE AS
$$ SELECT CASE WHEN p_table = 'pages' THEN nullif(p_row ->> 'unit_id', '')::uuid
               WHEN p_table = 'blocks' AND p_row ->> 'scope' = 'global' THEN NULL
               ELSE app.page_unit((p_row ->> 'project_id')::uuid, p_row ->> 'page_id') END $$;

-- ───────── El techo de la unidad dentro de has_permission ─────────
-- Igual que en 0010, con un paso nuevo tras el rol de la cuenta: quien está sujeto a unidades necesita que ALGUNA de las suyas
-- conceda el permiso. Para `deploy` la unidad SUSTITUYE al rol de la cuenta (las unidades deben poder desplegar).
CREATE OR REPLACE FUNCTION app.has_permission_uncached(p_project uuid, p_permission text) RETURNS boolean
LANGUAGE plpgsql STABLE AS
$$
DECLARE
  v_user     uuid := app.current_user_id();
  v_org      uuid := app.current_org();
  v_role     text;
  v_by_role  boolean;
  v_unit     boolean;
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

  -- 1b. Techo de las unidades.
  IF v_role <> 'superadmin' AND app.unit_scoped() THEN
    SELECT EXISTS (SELECT 1 FROM unnest(app.user_unit_ids()) x(id) WHERE app.unit_allows(x.id, p_permission)) INTO v_unit;
    v_by_role := CASE WHEN p_permission = 'deploy' THEN v_unit ELSE v_by_role AND v_unit END;
  END IF;
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

-- ¿Puede editar contenido de esta unidad (nulo = global)? Quien no está sujeto a unidades sigue con la regla de siempre.
CREATE FUNCTION app.can_edit_in_unit(p_project uuid, p_unit uuid) RETURNS boolean
LANGUAGE plpgsql VOLATILE AS
$$
BEGIN
  IF app.is_system_session() THEN RETURN true; END IF;
  IF NOT app.has_permission(p_project, 'editContent') THEN RETURN false; END IF;
  IF NOT app.unit_scoped() THEN RETURN app.can_edit_all_content(p_project); END IF;
  IF p_unit IS NULL THEN RETURN app.can_edit_global(); END IF;
  RETURN p_unit = ANY (app.user_unit_ids()) AND app.unit_allows(p_unit, 'editContent');
END
$$;

-- ¿Puede tocar esa página o esa sección? Con unidades decide la unidad de la página; sin ellas, el alcance asignado (0010).
CREATE OR REPLACE FUNCTION app.can_edit_content(p_project uuid, p_page text, p_block text DEFAULT NULL) RETURNS boolean
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

  IF app.unit_scoped() THEN
    IF p_page IS NULL THEN RETURN false; END IF;
    RETURN app.can_edit_in_unit(p_project, app.page_unit(p_project, p_page));
  END IF;

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

-- Páginas, secciones y medios de una página: permiso de contenido + de quién es la página (o el alcance, sin unidades).
CREATE OR REPLACE FUNCTION app.guard_content() RETURNS trigger
LANGUAGE plpgsql AS
$$
DECLARE
  v_old_page text; v_old_block text; v_new_page text; v_new_block text;
  v_position_only boolean := false;
  v_unit_move boolean := false;
  v_exists boolean := false;
  v_project uuid := CASE WHEN TG_OP = 'DELETE' THEN OLD.project_id ELSE NEW.project_id END;
BEGIN
  IF app.can_edit_all_content(v_project) THEN
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
  ELSIF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'pages' AND app.unit_scoped() THEN
    -- Reordenar páginas mueve también las de otras unidades y las globales: con unidades, solo la posición no exige poseerlas.
    v_position_only := NEW.position IS DISTINCT FROM OLD.position
      AND (to_jsonb(NEW) - 'position' - 'updated_at' - 'row_version') = (to_jsonb(OLD) - 'position' - 'updated_at' - 'row_version');
  END IF;
  IF v_position_only THEN
    IF NOT app.has_permission(NEW.project_id, 'editContent') THEN PERFORM app.deny('editContent'); END IF;
    RETURN NEW;
  END IF;

  -- Con unidades: manda la unidad dueña de la página. Mover una página a otra unidad solo exige poder editar la de origen.
  IF app.unit_scoped() THEN
    -- El editor guarda con «insertar o, si existe, actualizar»: el INSERT de una página que ya existe se decide con la unidad
    -- que tiene (así se puede enviar a otra unidad); el UPDATE que sigue ya trata el cambio de unidad.
    IF TG_OP = 'INSERT' AND TG_TABLE_NAME = 'pages' THEN
      SELECT true INTO v_exists FROM app.pages p WHERE p.organization_id = NEW.organization_id AND p.project_id = NEW.project_id AND p.id = NEW.id;
      IF v_exists THEN
        IF NOT app.can_edit_in_unit(v_project, app.page_unit(v_project, NEW.id)) THEN PERFORM app.deny('editar esta página o sección'); END IF;
        RETURN NEW;
      END IF;
    END IF;
    IF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'pages' THEN v_unit_move := (to_jsonb(NEW) ->> 'unit_id') IS DISTINCT FROM (to_jsonb(OLD) ->> 'unit_id'); END IF;
    IF TG_OP <> 'INSERT' AND NOT app.can_edit_in_unit(v_project, app.content_unit(TG_TABLE_NAME, to_jsonb(OLD))) THEN
      PERFORM app.deny('editar esta página o sección');
    END IF;
    IF TG_OP <> 'DELETE' AND NOT v_unit_move
       AND NOT app.can_edit_in_unit(v_project, app.content_unit(TG_TABLE_NAME, to_jsonb(NEW))) THEN
      PERFORM app.deny('editar esta página o sección');
    END IF;
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
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

-- ───────── Guardas de lo global y de lo que cuelga de una página ─────────
-- ¿Es esta fila algo que una unidad puede tocar sin permiso global? Solo lo que cuelga de una página o sección suya.
CREATE FUNCTION app.unit_owns_row(p_table text, p_row jsonb) RETURNS boolean
LANGUAGE plpgsql VOLATILE AS
$$
DECLARE
  v_project uuid := (p_row ->> 'project_id')::uuid;
  v_page    text;
BEGIN
  IF p_table IN ('style_variables', 'style_rules') AND p_row ->> 'scope' = 'page' THEN v_page := p_row ->> 'page_id';
  ELSIF p_table = 'shared_functions' AND p_row ->> 'scope_kind' IN ('block', 'element') THEN
    SELECT b.page_id INTO v_page FROM app.blocks b WHERE b.organization_id = (p_row ->> 'organization_id')::uuid AND b.project_id = v_project AND b.id = p_row ->> 'block_id';
  ELSIF p_table = 'code_units' AND (p_row ->> 'page_id' IS NOT NULL OR p_row ->> 'block_id' IS NOT NULL) THEN
    RETURN true;   -- el código de una página o sección ya lo comprueba check_code_unit (0012)
  ELSE RETURN false;
  END IF;
  RETURN v_page IS NOT NULL AND app.can_edit_in_unit(v_project, app.page_unit(v_project, v_page));
END
$$;

-- Lo global (componentes, funciones, fuentes de datos, librerías, estilos globales, destinos de despliegue…) exige permiso global.
CREATE FUNCTION app.guard_global() RETURNS trigger
LANGUAGE plpgsql AS
$$
BEGIN
  IF app.is_system_session() OR NOT app.unit_scoped() OR app.can_edit_global() THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;
  IF TG_OP <> 'INSERT' AND NOT app.unit_owns_row(TG_TABLE_NAME, to_jsonb(OLD)) THEN PERFORM app.deny('editar lo global'); END IF;
  IF TG_OP <> 'DELETE' AND NOT app.unit_owns_row(TG_TABLE_NAME, to_jsonb(NEW)) THEN PERFORM app.deny('editar lo global'); END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END
$$;
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['components', 'shared_functions', 'data_sources', 'project_libraries', 'deploy_targets', 'style_variables', 'style_rules', 'code_units']
  LOOP
    EXECUTE format('CREATE TRIGGER %I BEFORE INSERT OR UPDATE OR DELETE ON app.%I FOR EACH ROW EXECUTE FUNCTION app.guard_global()', t || '_global_guard', t);
  END LOOP;
END
$$;

-- La navegación y los ajustes del sitio son globales; la biblioteca de medios (settings.projectMedia) la mantiene cada unidad
-- (la API valida entrada por entrada).
CREATE FUNCTION app.guard_project_global() RETURNS trigger
LANGUAGE plpgsql AS
$$
BEGIN
  IF app.is_system_session() OR NOT app.unit_scoped() OR app.can_edit_global() THEN RETURN NEW; END IF;
  IF NEW.navigation IS DISTINCT FROM OLD.navigation OR (NEW.settings - 'projectMedia') IS DISTINCT FROM (OLD.settings - 'projectMedia') THEN
    PERFORM app.deny('editar lo global');
  END IF;
  RETURN NEW;
END
$$;
CREATE TRIGGER projects_global_guard BEFORE UPDATE ON app.projects FOR EACH ROW EXECUTE FUNCTION app.guard_project_global();

-- Animaciones y sus pasos cuelgan de una página: manda la unidad de esa página.
CREATE FUNCTION app.guard_page_child() RETURNS trigger
LANGUAGE plpgsql AS
$$
DECLARE
  r jsonb := to_jsonb(CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END);
  v_project uuid := (r ->> 'project_id')::uuid;
  v_page text;
BEGIN
  IF app.is_system_session() OR NOT app.unit_scoped() THEN RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END; END IF;
  v_page := coalesce(r ->> 'page_id', (SELECT b.page_id FROM app.blocks b WHERE b.organization_id = (r ->> 'organization_id')::uuid AND b.project_id = v_project AND b.id = r ->> 'block_id'));
  IF NOT app.can_edit_in_unit(v_project, app.page_unit(v_project, v_page)) THEN PERFORM app.deny('editar la animación de esta página'); END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END
$$;
CREATE TRIGGER animations_unit_guard      BEFORE INSERT OR UPDATE OR DELETE ON app.animations      FOR EACH ROW EXECUTE FUNCTION app.guard_page_child();
CREATE TRIGGER animation_steps_unit_guard BEFORE INSERT OR UPDATE OR DELETE ON app.animation_steps FOR EACH ROW EXECUTE FUNCTION app.guard_page_child();

-- Un archivo se sube a una unidad propia; subirlo como global exige permiso global.
CREATE FUNCTION app.guard_asset_unit() RETURNS trigger
LANGUAGE plpgsql AS
$$
BEGIN
  IF app.is_system_session() OR NOT app.unit_scoped() OR app.can_edit_global() THEN RETURN NEW; END IF;
  IF NEW.unit_id IS NULL OR NOT (NEW.unit_id = ANY (app.user_unit_ids())) THEN PERFORM app.deny('subir archivos a esa unidad'); END IF;
  RETURN NEW;
END
$$;
CREATE TRIGGER assets_unit_guard BEFORE INSERT OR UPDATE OF unit_id ON app.assets FOR EACH ROW EXECUTE FUNCTION app.guard_asset_unit();

-- ───────── Quién administra las unidades ─────────
-- Crear unidades, asignar personas y ajustar permisos es del superadministrador (igual que el modelo de trabajo).
CREATE TRIGGER units_guard                    BEFORE INSERT OR UPDATE OR DELETE ON app.units                     FOR EACH ROW EXECUTE FUNCTION app.guard_org_admin();
CREATE TRIGGER unit_members_guard             BEFORE INSERT OR UPDATE OR DELETE ON app.unit_members              FOR EACH ROW EXECUTE FUNCTION app.guard_org_admin();
CREATE TRIGGER unit_permission_overrides_guard BEFORE INSERT OR UPDATE OR DELETE ON app.unit_permission_overrides FOR EACH ROW EXECUTE FUNCTION app.guard_org_admin();

CREATE FUNCTION app.guard_can_edit_global() RETURNS trigger
LANGUAGE plpgsql AS
$$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.can_edit_global) OR (TG_OP = 'UPDATE' AND NEW.can_edit_global IS DISTINCT FROM OLD.can_edit_global) THEN
    IF NOT app.has_permission(NULL, 'manageUsers') THEN PERFORM app.deny('dar el permiso de editar lo global'); END IF;
  END IF;
  RETURN NEW;
END
$$;
CREATE TRIGGER users_guard_can_edit_global BEFORE INSERT OR UPDATE OF can_edit_global ON app.users FOR EACH ROW EXECUTE FUNCTION app.guard_can_edit_global();

-- Una unidad con páginas o archivos no se borra: primero se reasignan.
CREATE FUNCTION app.guard_unit_delete() RETURNS trigger
LANGUAGE plpgsql AS
$$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL AND (
       EXISTS (SELECT 1 FROM app.pages p WHERE p.organization_id = OLD.organization_id AND p.unit_id = OLD.id)
    OR EXISTS (SELECT 1 FROM app.assets a WHERE a.organization_id = OLD.organization_id AND a.unit_id = OLD.id AND a.deleted_at IS NULL)) THEN
    RAISE EXCEPTION 'La unidad tiene páginas o archivos: reasígnalos antes de borrarla' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$$;
CREATE TRIGGER units_guard_delete BEFORE UPDATE OF deleted_at ON app.units FOR EACH ROW EXECUTE FUNCTION app.guard_unit_delete();

-- Los cambios de unidades, miembros y ajustes invalidan la caché de permisos de la transacción (como los de 0010).
CREATE TRIGGER units_bump_epoch                     AFTER INSERT OR UPDATE OR DELETE ON app.units                     FOR EACH STATEMENT EXECUTE FUNCTION app.bump_permission_epoch();
CREATE TRIGGER unit_members_bump_epoch              AFTER INSERT OR UPDATE OR DELETE ON app.unit_members              FOR EACH STATEMENT EXECUTE FUNCTION app.bump_permission_epoch();
CREATE TRIGGER unit_permission_overrides_bump_epoch AFTER INSERT OR UPDATE OR DELETE ON app.unit_permission_overrides FOR EACH STATEMENT EXECUTE FUNCTION app.bump_permission_epoch();

-- ───────── Enviar a revisión: el revisor lo puede decidir el servidor ─────────
-- Como en 0014, pero con revisor explícito: con `p_explicit_reviewer` se usa `p_reviewer` (nulo = un superadministrador); sin él, quien
-- invitó al autor, como siempre. El servidor lo calcula por las unidades que toca el cambio (dueño de la unidad, o superadmin).
DROP FUNCTION app.open_pull_request(uuid, text);
CREATE FUNCTION app.open_pull_request(p_branch uuid, p_title text, p_reviewer uuid DEFAULT NULL, p_explicit_reviewer boolean DEFAULT false) RETURNS uuid
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
    SELECT v_org, b.project_id, app.next_number(b.project_id, 'pr'), p_title, p_branch, b.base_branch_id, v_user,
           CASE WHEN p_explicit_reviewer THEN p_reviewer ELSE u.invited_by END
    FROM app.users u WHERE u.organization_id = v_org AND u.id = v_user
    RETURNING id INTO v_pr;
  END IF;
  PERFORM app.link_branch_commits(v_pr);
  RETURN v_pr;
END
$$;

-- ───────── RLS y permisos de tabla ─────────
-- apply_grants (0009) con una línea más: la matriz de tipos de unidad la cambia una migración, no la API.
CREATE OR REPLACE FUNCTION app.apply_grants() RETURNS void
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
  IF to_regclass('app.unit_kind_permissions') IS NOT NULL THEN
    REVOKE INSERT, UPDATE, DELETE ON app.unit_kind_permissions FROM portal_app;
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

SELECT app.apply_rls();
SELECT app.apply_grants();
