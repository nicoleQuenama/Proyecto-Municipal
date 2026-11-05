-- 0008 · Reglas de integridad que la base de datos hace cumplir sola (disparadores).

-- 1. updated_at y row_version en toda tabla que tenga ambas columnas.
DO $$
DECLARE t text;
BEGIN
  FOR t IN
    SELECT c.table_name FROM information_schema.columns c
    WHERE c.table_schema = 'app' AND c.column_name = 'row_version'
  LOOP
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON app.%I FOR EACH ROW EXECUTE FUNCTION app.touch()',
                   t || '_touch', t);
  END LOOP;
END
$$;

-- 2. Lo que ya ocurrió no se reescribe: versiones, cambios, publicaciones y auditoría solo se insertan.
CREATE FUNCTION app.forbid_update() RETURNS trigger
LANGUAGE plpgsql AS
$$
BEGIN
  RAISE EXCEPTION '% es inmutable: no se puede modificar una fila ya guardada', TG_TABLE_NAME
    USING ERRCODE = 'integrity_constraint_violation';
END
$$;
CREATE TRIGGER commits_immutable        BEFORE UPDATE ON app.commits        FOR EACH ROW EXECUTE FUNCTION app.forbid_update();
CREATE TRIGGER site_snapshots_immutable  BEFORE UPDATE ON app.site_snapshots  FOR EACH ROW EXECUTE FUNCTION app.forbid_update();
CREATE TRIGGER commit_changes_immutable BEFORE UPDATE ON app.commit_changes FOR EACH ROW EXECUTE FUNCTION app.forbid_update();
CREATE TRIGGER publications_immutable   BEFORE UPDATE ON app.publications   FOR EACH ROW EXECUTE FUNCTION app.forbid_update();
CREATE TRIGGER audit_log_immutable      BEFORE UPDATE ON app.audit_log      FOR EACH ROW EXECUTE FUNCTION app.forbid_update();

-- 3. Todo proyecto nace con su rama principal, sus contadores y su creador como editor (si no es superadmin, que ve todo).
-- SECURITY DEFINER: corre como el sistema, porque el creador todavía no es miembro y los permisos (0010) y RLS
-- le negarían ver el proyecto que acaba de crear.
CREATE FUNCTION app.bootstrap_project() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, app, pg_temp AS
$$
BEGIN
  INSERT INTO app.branches (organization_id, project_id, name, is_main)
  VALUES (NEW.organization_id, NEW.id, 'main', true);
  INSERT INTO app.project_counters (organization_id, project_id) VALUES (NEW.organization_id, NEW.id);

  INSERT INTO app.project_members (organization_id, project_id, user_id, member_role)
  SELECT NEW.organization_id, NEW.id, u.id, 'editor'
  FROM app.users u
  WHERE u.organization_id = NEW.organization_id AND u.id = NEW.created_by AND u.role <> 'superadmin';
  RETURN NULL;
END
$$;
CREATE TRIGGER projects_bootstrap AFTER INSERT ON app.projects
  FOR EACH ROW EXECUTE FUNCTION app.bootstrap_project();

-- 4. Cuota de proyectos del plan. SECURITY DEFINER para poder bloquear la fila de la organización
-- (serializa dos altas simultáneas: sin esto ambas verían "queda 1" y pasarían).
CREATE FUNCTION app.enforce_project_quota() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, app, pg_temp AS
$$
DECLARE
  v_max  int;
  v_used int;
BEGIN
  SELECT max_projects INTO v_max FROM app.organizations WHERE id = NEW.organization_id FOR UPDATE;
  SELECT count(*) INTO v_used FROM app.projects WHERE organization_id = NEW.organization_id AND deleted_at IS NULL;
  IF v_used >= v_max THEN
    RAISE EXCEPTION 'La organización alcanzó su límite de % proyectos', v_max USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$$;
CREATE TRIGGER projects_quota BEFORE INSERT ON app.projects
  FOR EACH ROW EXECUTE FUNCTION app.enforce_project_quota();
