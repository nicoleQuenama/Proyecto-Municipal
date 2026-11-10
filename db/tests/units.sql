-- Pruebas de unidades (departamentos): techo por tipo, páginas por unidad, lo global, desplegar y revisión obligatoria.
-- Corre en una transacción con ROLLBACK:   psql -v ON_ERROR_STOP=1 -f db/tests/units.sql <URL de la base>
\set ON_ERROR_STOP on
BEGIN;

CREATE SCHEMA t;
GRANT USAGE ON SCHEMA t TO portal_app, portal_readonly;
CREATE FUNCTION t.id(n text) RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT current_setting('t.' || n)::uuid $$;
CREATE FUNCTION t.tid(n text) RETURNS text LANGUAGE sql STABLE AS $$ SELECT current_setting('t.' || n) $$;
CREATE FUNCTION t.expect_error(p_state text, p_sql text, p_label text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE p_sql;
  RAISE EXCEPTION 'FALLO [%]: se esperaba el error % y la sentencia pasó', p_label, p_state;
EXCEPTION WHEN OTHERS THEN
  IF SQLSTATE = p_state THEN RAISE NOTICE 'ok   [%] rechazado con %', p_label, SQLSTATE;
  ELSE RAISE EXCEPTION 'FALLO [%]: se esperaba % y llegó % (%)', p_label, p_state, SQLSTATE, SQLERRM; END IF;
END $$;
CREATE FUNCTION t.expect_ok(p_sql text, p_label text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE p_sql;
  RAISE NOTICE 'ok   [%] permitido', p_label;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'FALLO [%]: debía permitirse y falló con % (%)', p_label, SQLSTATE, SQLERRM;
END $$;
CREATE FUNCTION t.expect_eq(p_label text, p_actual bigint, p_expected bigint) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF p_actual IS DISTINCT FROM p_expected THEN RAISE EXCEPTION 'FALLO [%]: se esperaba % y hay %', p_label, p_expected, p_actual; END IF;
  RAISE NOTICE 'ok   [%] = %', p_label, p_actual;
END $$;
CREATE FUNCTION t.yes(p_project uuid, p_permission text) RETURNS bigint LANGUAGE sql VOLATILE AS $$ SELECT CASE WHEN app.has_permission(p_project, p_permission) THEN 1 ELSE 0 END $$;

\set as_sys   'RESET ROLE;'
\set as_admin 'RESET ROLE; SELECT set_config(''app.org_id'', current_setting(''t.a''), true), set_config(''app.user_id'', current_setting(''t.admin''), true); SET LOCAL ROLE portal_app;'
\set as_zoo   'RESET ROLE; SELECT set_config(''app.org_id'', current_setting(''t.a''), true), set_config(''app.user_id'', current_setting(''t.zoo''), true); SET LOCAL ROLE portal_app;'
\set as_sis   'RESET ROLE; SELECT set_config(''app.org_id'', current_setting(''t.a''), true), set_config(''app.user_id'', current_setting(''t.sis''), true); SET LOCAL ROLE portal_app;'
\set as_both  'RESET ROLE; SELECT set_config(''app.org_id'', current_setting(''t.a''), true), set_config(''app.user_id'', current_setting(''t.both''), true); SET LOCAL ROLE portal_app;'
\set as_gl    'RESET ROLE; SELECT set_config(''app.org_id'', current_setting(''t.a''), true), set_config(''app.user_id'', current_setting(''t.gl''), true); SET LOCAL ROLE portal_app;'
\set as_own   'RESET ROLE; SELECT set_config(''app.org_id'', current_setting(''t.a''), true), set_config(''app.user_id'', current_setting(''t.own''), true); SET LOCAL ROLE portal_app;'
\set as_loose 'RESET ROLE; SELECT set_config(''app.org_id'', current_setting(''t.a''), true), set_config(''app.user_id'', current_setting(''t.loose''), true); SET LOCAL ROLE portal_app;'

-- ───────── Datos de partida: dos unidades, un contenido de cada una y uno global ─────────
DO $$
DECLARE
  a uuid; b uuid; admin uuid; pa uuid; uz uuid; us uuid; ub uuid; pz text; ps text; pg text; bz text; bs text; bg text;
  zoo uuid; sis uuid; bo uuid; gl uuid; own uuid; loose uuid;
BEGIN
  a := app.provision_organization('org-u-a', 'Org A', 'admin@ua.com', 'Admin A', 'admin-ua', 'h');
  b := app.provision_organization('org-u-b', 'Org B', 'admin@ub.com', 'Admin B', 'admin-ub', 'h');
  SELECT id INTO admin FROM app.users WHERE organization_id = a;
  INSERT INTO app.users (organization_id, email, username, name, role, password_hash, invited_by) VALUES (a, 'zoo@ua.com',  'zoo',  'Zoo',  'designer', 'h', admin) RETURNING id INTO zoo;
  INSERT INTO app.users (organization_id, email, username, name, role, password_hash, invited_by) VALUES (a, 'sis@ua.com',  'sis',  'Sis',  'dev',      'h', admin) RETURNING id INTO sis;
  INSERT INTO app.users (organization_id, email, username, name, role, password_hash, invited_by) VALUES (a, 'both@ua.com', 'both', 'Both', 'designer', 'h', admin) RETURNING id INTO bo;
  INSERT INTO app.users (organization_id, email, username, name, role, password_hash, invited_by, can_edit_global) VALUES (a, 'gl@ua.com', 'global-u', 'Gl', 'designer', 'h', admin, true) RETURNING id INTO gl;
  INSERT INTO app.users (organization_id, email, username, name, role, password_hash, invited_by) VALUES (a, 'own@ua.com',  'own',  'Own',  'designer', 'h', admin) RETURNING id INTO own;
  INSERT INTO app.users (organization_id, email, username, name, role, password_hash, invited_by) VALUES (a, 'loose@ua.com','loose','Loose','designer', 'h', admin) RETURNING id INTO loose;

  INSERT INTO app.units (organization_id, name, kind, owner_id) VALUES (a, 'Zoonosis', 'designer', own) RETURNING id INTO uz;
  INSERT INTO app.units (organization_id, name, kind) VALUES (a, 'Sistemas', 'dev') RETURNING id INTO us;
  INSERT INTO app.units (organization_id, name, kind) VALUES (b, 'Otra', 'designer') RETURNING id INTO ub;
  INSERT INTO app.unit_members (organization_id, unit_id, user_id) VALUES (a, uz, zoo), (a, us, sis), (a, uz, bo), (a, us, bo), (a, uz, gl), (a, uz, own);

  INSERT INTO app.projects (organization_id, slug, name, created_by) VALUES (a, 'sitio', 'Sitio A', admin) RETURNING id INTO pa;
  INSERT INTO app.pages (organization_id, project_id, name, slug, is_home, position, unit_id) VALUES (a, pa, 'Zoonosis', 'zoonosis', false, 0, uz) RETURNING id INTO pz;
  INSERT INTO app.pages (organization_id, project_id, name, slug, position, unit_id) VALUES (a, pa, 'Sistemas', 'sistemas', 1, us) RETURNING id INTO ps;
  INSERT INTO app.pages (organization_id, project_id, name, slug, is_home, position) VALUES (a, pa, 'Inicio', 'inicio', true, 2) RETURNING id INTO pg;
  INSERT INTO app.components (organization_id, project_id, id, name, category, width, height, custom) VALUES (a, pa, 'navbar', 'Barra', 'navegación', 1200, 80, false);
  INSERT INTO app.blocks (organization_id, project_id, page_id, component_id, position) VALUES (a, pa, pz, 'navbar', 0) RETURNING id INTO bz;
  INSERT INTO app.blocks (organization_id, project_id, page_id, component_id, position) VALUES (a, pa, ps, 'navbar', 0) RETURNING id INTO bs;
  INSERT INTO app.blocks (organization_id, project_id, page_id, component_id, position) VALUES (a, pa, pg, 'navbar', 0) RETURNING id INTO bg;
  INSERT INTO app.project_members (organization_id, project_id, user_id, member_role) SELECT a, pa, u, 'editor' FROM unnest(ARRAY[zoo, sis, bo, gl, own, loose]) u;

  PERFORM set_config('t.' || k, v, false) FROM (VALUES ('a', a::text), ('b', b::text), ('admin', admin::text), ('pa', pa::text),
    ('uz', uz::text), ('us', us::text), ('ub', ub::text), ('pz', pz), ('ps', ps), ('pg', pg), ('bz', bz), ('bs', bs), ('bg', bg),
    ('zoo', zoo::text), ('sis', sis::text), ('both', bo::text), ('gl', gl::text), ('own', own::text), ('loose', loose::text)) x(k, v);
END $$;

-- ───────── 1. Páginas por unidad ─────────
:as_zoo
SELECT t.expect_ok(format('UPDATE app.blocks SET hidden = true WHERE id = %L', t.tid('bz')), 'unidad: edita una sección de su página');
SELECT t.expect_error('42501', format('UPDATE app.blocks SET hidden = true WHERE id = %L', t.tid('bs')), 'unidad: no edita la página de otra unidad');
SELECT t.expect_error('42501', format('UPDATE app.blocks SET hidden = true WHERE id = %L', t.tid('bg')), 'unidad: no edita una página global');
SELECT t.expect_error('42501', format('UPDATE app.pages SET name = ''X'' WHERE id = %L', t.tid('pg')), 'unidad: no renombra una página global');
SELECT t.expect_ok(format('UPDATE app.pages SET position = 30 WHERE id = %L', t.tid('pg')), 'unidad: reordenar páginas (solo la posición) no exige poseerlas');
SELECT t.expect_ok(format('INSERT INTO app.pages (organization_id, project_id, name, slug, position, unit_id) VALUES (%L, %L, ''Nueva'', ''nueva'', 10, %L)', t.id('a'), t.id('pa'), t.id('uz')), 'unidad: crea una página en su unidad');
SELECT t.expect_error('42501', format('INSERT INTO app.pages (organization_id, project_id, name, slug, position, unit_id) VALUES (%L, %L, ''Ajena'', ''ajena'', 11, %L)', t.id('a'), t.id('pa'), t.id('us')), 'unidad: no crea páginas en otra unidad');
SELECT t.expect_error('42501', format('INSERT INTO app.pages (organization_id, project_id, name, slug, position) VALUES (%L, %L, ''Glob'', ''glob'', 12)', t.id('a'), t.id('pa')), 'unidad: no crea páginas globales');

:as_both
SELECT t.expect_ok(format('UPDATE app.blocks SET hidden = false WHERE id = %L', t.tid('bz')), 'varias unidades: edita la primera');
SELECT t.expect_ok(format('UPDATE app.blocks SET hidden = false WHERE id = %L', t.tid('bs')), 'varias unidades: edita la segunda');
SELECT t.expect_error('42501', format('UPDATE app.blocks SET hidden = true WHERE id = %L', t.tid('bg')), 'varias unidades: lo global sigue cerrado');

:as_gl
SELECT t.expect_ok(format('UPDATE app.blocks SET hidden = true WHERE id = %L', t.tid('bg')), 'permiso global: edita una página global');
SELECT t.expect_error('42501', format('UPDATE app.blocks SET hidden = true WHERE id = %L', t.tid('bs')), 'permiso global: no edita la página de otra unidad');

:as_loose
SELECT t.expect_error('42501', format('UPDATE app.blocks SET hidden = true WHERE id = %L', t.tid('bz')), 'sin unidad en una organización con unidades: no edita');
:as_admin
SELECT t.expect_ok(format('UPDATE app.blocks SET hidden = false WHERE id = %L', t.tid('bs')), 'superadmin edita lo de cualquier unidad');
SELECT t.expect_ok(format('UPDATE app.blocks SET hidden = false WHERE id = %L', t.tid('bg')), 'superadmin edita lo global');

-- ───────── 2. Mover páginas ─────────
:as_zoo
SELECT t.expect_error('42501', format('UPDATE app.pages SET unit_id = %L WHERE id = %L', t.id('uz'), t.tid('ps')), 'mover: no se mueve una página ajena');
SELECT t.expect_ok(format('UPDATE app.pages SET unit_id = %L WHERE id = %L', t.id('us'), t.tid('pz')), 'mover: enviar una página propia a otra unidad');
SELECT t.expect_error('42501', format('UPDATE app.blocks SET hidden = true WHERE id = %L', t.tid('bz')), 'mover: la página enviada ya no es suya');
:as_sys
UPDATE app.pages SET unit_id = t.id('uz') WHERE id = t.tid('pz');
:as_zoo
SELECT t.expect_ok(format('INSERT INTO app.pages (organization_id, project_id, id, name, slug, position, unit_id) VALUES (%L, %L, %L, ''Zoonosis'', ''zoonosis'', 0, %L) ON CONFLICT (organization_id, project_id, id) DO UPDATE SET unit_id = excluded.unit_id', t.id('a'), t.id('pa'), t.tid('pz'), t.id('us')), 'mover: con «insertar o actualizar» (como guarda el editor)');
SELECT t.expect_error('42501', format('INSERT INTO app.pages (organization_id, project_id, id, name, slug, position, unit_id) VALUES (%L, %L, %L, ''Sistemas'', ''sistemas'', 1, %L) ON CONFLICT (organization_id, project_id, id) DO UPDATE SET unit_id = excluded.unit_id', t.id('a'), t.id('pa'), t.tid('ps'), t.id('uz')), 'mover: con «insertar o actualizar» no se roba una ajena');
:as_sys
UPDATE app.pages SET unit_id = t.id('uz') WHERE id = t.tid('pz');

-- ───────── 3. Lo global exige permiso de lo global ─────────
:as_zoo
SELECT t.expect_error('42501', format('INSERT INTO app.components (organization_id, project_id, id, name, category, width, height, custom) VALUES (%L, %L, ''c2'', ''Otro2'', ''x'', 10, 10, true)', t.id('a'), t.id('pa')), 'global: un componente exige permiso global');
:as_sis
SELECT t.expect_error('42501', format('INSERT INTO app.data_sources (organization_id, project_id, name, url) VALUES (%L, %L, ''api'', ''https://x.test'')', t.id('a'), t.id('pa')), 'global: ni un desarrollador de unidad crea fuentes de datos');
:as_gl
SELECT t.expect_ok(format('INSERT INTO app.components (organization_id, project_id, id, name, category, width, height, custom) VALUES (%L, %L, ''c3'', ''Otro3'', ''x'', 10, 10, true)', t.id('a'), t.id('pa')), 'global: con permiso global sí');
:as_admin
SELECT t.expect_ok(format('INSERT INTO app.components (organization_id, project_id, id, name, category, width, height, custom) VALUES (%L, %L, ''c4'', ''Otro4'', ''x'', 10, 10, true)', t.id('a'), t.id('pa')), 'global: el superadmin sí');

-- ───────── 4. Archivos subidos ─────────
:as_zoo
SELECT t.expect_ok(format('INSERT INTO app.assets (organization_id, project_id, kind, name, imagekit_path, content_type, byte_size, sha256, unit_id) VALUES (%L, %L, ''image'', ''a'', ''/org/%s/pa/uz/a.png'', ''image/png'', 10, sha256(''a''), %L)', t.id('a'), t.id('pa'), t.id('a'), t.id('uz')), 'archivo: se sube a su unidad');
SELECT t.expect_error('42501', format('INSERT INTO app.assets (organization_id, project_id, kind, name, imagekit_path, content_type, byte_size, sha256, unit_id) VALUES (%L, %L, ''image'', ''b'', ''/org/%s/pa/uz/b.png'', ''image/png'', 10, sha256(''b''), %L)', t.id('a'), t.id('pa'), t.id('a'), t.id('us')), 'archivo: no se sube a otra unidad');
SELECT t.expect_error('42501', format('INSERT INTO app.assets (organization_id, project_id, kind, name, imagekit_path, content_type, byte_size, sha256) VALUES (%L, %L, ''image'', ''c'', ''/org/%s/pa/uz/c.png'', ''image/png'', 10, sha256(''c''))', t.id('a'), t.id('pa'), t.id('a')), 'archivo: global exige permiso global');

-- ───────── 5. Desplegar y techo de la unidad ─────────
SELECT t.expect_eq('diseñador en una unidad puede desplegar (la unidad lo concede)', t.yes(t.id('pa'), 'deploy'), 1);
SELECT t.expect_error('42501', format('INSERT INTO app.deploy_targets (organization_id, project_id, kind, config) VALUES (%L, %L, ''ftp'', ''{}'')', t.id('a'), t.id('pa')), 'configurar servidores es de lo global');
SELECT t.expect_eq('la unidad de tipo diseñador no edita código', t.yes(t.id('pa'), 'editCode'), 0);
:as_loose
SELECT t.expect_eq('sin unidad en una organización con unidades: no despliega', t.yes(t.id('pa'), 'deploy'), 0);
:as_sys
INSERT INTO app.unit_permission_overrides (organization_id, unit_id, permission, allowed) VALUES (t.id('a'), t.id('uz'), 'deploy', false);
:as_zoo
SELECT t.expect_eq('ajuste de la unidad: se le quita desplegar', t.yes(t.id('pa'), 'deploy'), 0);
:as_both
SELECT t.expect_eq('en varias unidades basta con que una lo conceda', t.yes(t.id('pa'), 'deploy'), 1);
:as_sys
DELETE FROM app.unit_permission_overrides;

-- ───────── 6. Revisión obligatoria ─────────
UPDATE app.units SET review_required = true WHERE id = t.id('uz');
:as_zoo
SELECT t.expect_eq('revisión obligatoria: el miembro no publica en main', t.yes(t.id('pa'), 'publishMain'), 0);
SELECT t.expect_error('42501', format('UPDATE app.blocks SET hidden = true WHERE id = %L', t.tid('bz')), 'revisión obligatoria: no escribe directo en main');
:as_own
SELECT t.expect_eq('revisión obligatoria: el dueño sí publica', t.yes(t.id('pa'), 'publishMain'), 1);
:as_sys
UPDATE app.units SET review_required = false WHERE id = t.id('uz');

-- ───────── 7. Quién administra las unidades ─────────
:as_zoo
SELECT t.expect_error('42501', format('INSERT INTO app.units (organization_id, name, kind) VALUES (%L, ''Mia'', ''dev'')', t.id('a')), 'solo el superadmin crea unidades');
SELECT t.expect_error('42501', format('INSERT INTO app.unit_members (organization_id, unit_id, user_id) VALUES (%L, %L, %L)', t.id('a'), t.id('us'), t.id('zoo')), 'nadie se agrega a otra unidad');
SELECT t.expect_error('42501', format('UPDATE app.users SET can_edit_global = true WHERE id = %L', t.id('zoo')), 'nadie se da el permiso global');
:as_admin
SELECT t.expect_ok(format('INSERT INTO app.units (organization_id, name, kind) VALUES (%L, ''Nueva unidad'', ''dev'')', t.id('a')), 'el superadmin crea unidades');
SELECT t.expect_ok(format('UPDATE app.users SET can_edit_global = true WHERE id = %L', t.id('zoo')), 'el superadmin da el permiso global');

-- ───────── 8. Integridad ─────────
:as_sys
SELECT t.expect_error('23503', format('UPDATE app.pages SET unit_id = %L WHERE id = %L', t.id('ub'), t.tid('pg')), 'una página no puede ser de una unidad de otra organización');
SELECT t.expect_error('23514', format('UPDATE app.units SET deleted_at = now() WHERE id = %L', t.id('uz')), 'no se borra una unidad con páginas');
SELECT t.expect_ok(format('UPDATE app.units SET deleted_at = now() WHERE name = ''Nueva unidad'' AND organization_id = %L', t.id('a')), 'sí se borra una unidad vacía');
SELECT t.expect_error('23505', format('INSERT INTO app.units (organization_id, name, kind) VALUES (%L, ''zoonosis'', ''dev'')', t.id('a')), 'el nombre de una unidad no se repite');

-- ───────── 9. Quitar a alguien de su unidad corta el acceso en la misma transacción ─────────
:as_zoo
SELECT t.expect_ok(format('UPDATE app.blocks SET hidden = false WHERE id = %L', t.tid('bz')), 'antes de quitarla: edita');
:as_sys
DELETE FROM app.unit_members WHERE user_id = t.id('zoo');
:as_zoo
SELECT t.expect_error('42501', format('UPDATE app.blocks SET hidden = true WHERE id = %L', t.tid('bz')), 'después de quitarla: ya no edita (caché de permisos invalidada)');

-- ───────── 10. Enviar a revisión: el revisor puede venir decidido por el servidor ─────────
:as_sys
UPDATE app.units SET review_required = true WHERE id = t.id('uz');
INSERT INTO app.site_snapshots (organization_id, project_id, sha256, document) VALUES (t.id('a'), t.id('pa'), sha256('u0'), '{}');
INSERT INTO app.unit_members (organization_id, unit_id, user_id) VALUES (t.id('a'), t.id('uz'), t.id('zoo'));
:as_zoo
SELECT set_config('t.work', app.ensure_work_branch(t.id('pa'))::text, false);
SELECT t.expect_ok(format('INSERT INTO app.commits (organization_id, project_id, branch_id, snapshot_id, parent_commit_id, message) VALUES (%L, %L, %L, (SELECT id FROM app.site_snapshots LIMIT 1), (SELECT head_commit_id FROM app.branches WHERE id = %L), ''c1'')', t.id('a'), t.id('pa'), t.id('work'), t.id('work')), 'unidad con revisión: guarda en su rama');
SELECT set_config('t.pr1', app.open_pull_request(t.id('work'), 'Para el dueño', t.id('own'), true)::text, false);
SELECT t.expect_eq('con revisor explícito va al dueño de la unidad', (SELECT count(*) FROM app.pull_requests WHERE id = t.id('pr1') AND reviewer_id = t.id('own')), 1);
:as_own
SELECT t.expect_eq('el dueño la ve', (SELECT count(*) FROM app.pull_requests WHERE id = t.id('pr1')), 1);
:as_zoo
UPDATE app.pull_requests SET status = 'closed', closed_at = now() WHERE id = t.id('pr1');
SELECT t.expect_ok(format('INSERT INTO app.commits (organization_id, project_id, branch_id, snapshot_id, parent_commit_id, message) VALUES (%L, %L, %L, (SELECT id FROM app.site_snapshots LIMIT 1), (SELECT head_commit_id FROM app.branches WHERE id = %L), ''c2'')', t.id('a'), t.id('pa'), t.id('work'), t.id('work')), 'otra versión');
SELECT set_config('t.pr2', app.open_pull_request(t.id('work'), 'Para el superadmin', NULL, true)::text, false);
SELECT t.expect_eq('con revisor explícito nulo va a un superadmin', (SELECT count(*) FROM app.pull_requests WHERE id = t.id('pr2') AND reviewer_id IS NULL), 1);
UPDATE app.pull_requests SET status = 'closed', closed_at = now() WHERE id = t.id('pr2');
SELECT t.expect_ok(format('INSERT INTO app.commits (organization_id, project_id, branch_id, snapshot_id, parent_commit_id, message) VALUES (%L, %L, %L, (SELECT id FROM app.site_snapshots LIMIT 1), (SELECT head_commit_id FROM app.branches WHERE id = %L), ''c3'')', t.id('a'), t.id('pa'), t.id('work'), t.id('work')), 'una más');
SELECT set_config('t.pr3', app.open_pull_request(t.id('work'), 'Como siempre')::text, false);
SELECT t.expect_eq('sin revisor explícito sigue yendo a quien invitó al autor', (SELECT count(*) FROM app.pull_requests WHERE id = t.id('pr3') AND reviewer_id = t.id('admin')), 1);

DO $$ BEGIN RAISE NOTICE 'TODAS LAS PRUEBAS DE UNIDADES PASARON'; END $$;
ROLLBACK;
