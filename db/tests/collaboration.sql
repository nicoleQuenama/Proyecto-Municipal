-- Pruebas de permisos, compartir, versiones, código como AST, medios y tiempo real.
-- Corre en una transacción con ROLLBACK:   psql -v ON_ERROR_STOP=1 -d portal -f db/tests/collaboration.sql
\set ON_ERROR_STOP on
BEGIN;

CREATE SCHEMA t;
GRANT USAGE ON SCHEMA t TO portal_app, portal_readonly;
CREATE FUNCTION t.id(n text) RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT current_setting('t.' || n)::uuid $$;
-- Los ids que pone el editor (páginas, secciones…) son texto, no UUID.
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

-- Cambiar de persona: rol de la API (sujeto a RLS) + organización + usuario de la transacción.
\set as_sys   'RESET ROLE;'
\set as_dev   'RESET ROLE; SELECT set_config(''app.org_id'', current_setting(''t.a''), true), set_config(''app.user_id'', current_setting(''t.dev''), true); SET LOCAL ROLE portal_app;'
\set as_des   'RESET ROLE; SELECT set_config(''app.org_id'', current_setting(''t.a''), true), set_config(''app.user_id'', current_setting(''t.des''), true); SET LOCAL ROLE portal_app;'
\set as_view  'RESET ROLE; SELECT set_config(''app.org_id'', current_setting(''t.a''), true), set_config(''app.user_id'', current_setting(''t.view''), true); SET LOCAL ROLE portal_app;'
\set as_comm  'RESET ROLE; SELECT set_config(''app.org_id'', current_setting(''t.a''), true), set_config(''app.user_id'', current_setting(''t.comm''), true); SET LOCAL ROLE portal_app;'
\set as_scope 'RESET ROLE; SELECT set_config(''app.org_id'', current_setting(''t.a''), true), set_config(''app.user_id'', current_setting(''t.scope''), true); SET LOCAL ROLE portal_app;'
\set as_exp   'RESET ROLE; SELECT set_config(''app.org_id'', current_setting(''t.a''), true), set_config(''app.user_id'', current_setting(''t.exp''), true); SET LOCAL ROLE portal_app;'
\set as_out   'RESET ROLE; SELECT set_config(''app.org_id'', current_setting(''t.a''), true), set_config(''app.user_id'', current_setting(''t.out''), true); SET LOCAL ROLE portal_app;'
\set as_admin 'RESET ROLE; SELECT set_config(''app.org_id'', current_setting(''t.a''), true), set_config(''app.user_id'', current_setting(''t.admin''), true); SET LOCAL ROLE portal_app;'
\set as_adminb 'RESET ROLE; SELECT set_config(''app.org_id'', current_setting(''t.b''), true), set_config(''app.user_id'', current_setting(''t.adminb''), true); SET LOCAL ROLE portal_app;'
\set as_nouser 'RESET ROLE; SELECT set_config(''app.org_id'', current_setting(''t.a''), true), set_config(''app.user_id'', '''', true); SET LOCAL ROLE portal_app;'

-- ───────── Datos de partida (como el sistema) ─────────
DO $$
DECLARE
  a uuid; b uuid; admin uuid; adminb uuid; pa uuid; pb uuid; p1 text; p2 text; b1 text; b2 text; main_a uuid; snap uuid; pub uuid;
  dev uuid; des uuid; vw uuid; cm uuid; sc uuid; ex uuid; ou uuid;
BEGIN
  a := app.provision_organization('org-a', 'Org A', 'admin@a.com', 'Admin A', 'admin-a', 'h');
  b := app.provision_organization('org-b', 'Org B', 'admin@b.com', 'Admin B', 'admin-b', 'h');
  SELECT id INTO admin FROM app.users WHERE organization_id = a;
  SELECT id INTO adminb FROM app.users WHERE organization_id = b;
  INSERT INTO app.users (organization_id, email, username, name, role, password_hash, invited_by) VALUES (a, 'dev@a.com',  'dev-a',  'Dev',  'dev',      'h', admin) RETURNING id INTO dev;
  INSERT INTO app.users (organization_id, email, username, name, role, password_hash, invited_by) VALUES (a, 'des@a.com',  'des-a',  'Des',  'designer', 'h', admin) RETURNING id INTO des;
  INSERT INTO app.users (organization_id, email, username, name, role, password_hash, invited_by) VALUES (a, 'view@a.com', 'view-a', 'View', 'designer', 'h', admin) RETURNING id INTO vw;
  INSERT INTO app.users (organization_id, email, username, name, role, password_hash, invited_by) VALUES (a, 'comm@a.com', 'comm-a', 'Comm', 'designer', 'h', admin) RETURNING id INTO cm;
  INSERT INTO app.users (organization_id, email, username, name, role, password_hash, invited_by) VALUES (a, 'scope@a.com','scope-a','Scope','designer', 'h', admin) RETURNING id INTO sc;
  INSERT INTO app.users (organization_id, email, username, name, role, password_hash, invited_by) VALUES (a, 'exp@a.com',  'exp-a',  'Exp',  'dev',      'h', admin) RETURNING id INTO ex;
  INSERT INTO app.users (organization_id, email, username, name, role, password_hash)              VALUES (a, 'out@a.com',  'out-a',  'Out',  'designer', 'h')        RETURNING id INTO ou;

  INSERT INTO app.projects (organization_id, slug, name, created_by) VALUES (a, 'sitio', 'Sitio A', admin) RETURNING id INTO pa;
  INSERT INTO app.projects (organization_id, slug, name) VALUES (b, 'sitio', 'Sitio B') RETURNING id INTO pb;
  INSERT INTO app.pages (organization_id, project_id, name, slug, is_home, position) VALUES (a, pa, 'Inicio', 'inicio', true, 0) RETURNING id INTO p1;
  INSERT INTO app.pages (organization_id, project_id, name, slug, position) VALUES (a, pa, 'Otra', 'otra', 1) RETURNING id INTO p2;
  INSERT INTO app.components (organization_id, project_id, id, name, category, width, height, custom) VALUES (a, pa, 'navbar', 'Barra', 'navegación', 1200, 80, false);
  INSERT INTO app.blocks (organization_id, project_id, page_id, component_id, position) VALUES (a, pa, p1, 'navbar', 0) RETURNING id INTO b1;
  INSERT INTO app.blocks (organization_id, project_id, page_id, component_id, position) VALUES (a, pa, p2, 'navbar', 0) RETURNING id INTO b2;

  INSERT INTO app.project_members (organization_id, project_id, user_id, member_role, scope_limited, expires_at) VALUES
    (a, pa, dev, 'editor', false, NULL), (a, pa, des, 'editor', false, NULL), (a, pa, vw, 'viewer', false, NULL),
    (a, pa, cm, 'commenter', false, NULL), (a, pa, sc, 'editor', true, NULL), (a, pa, ex, 'editor', false, now() - interval '1 day');
  INSERT INTO app.member_scope_pages (organization_id, project_id, user_id, page_id) VALUES (a, pa, sc, p1);

  SELECT id INTO main_a FROM app.branches WHERE project_id = pa AND is_main;
  INSERT INTO app.site_snapshots (organization_id, project_id, sha256, document) VALUES (a, pa, sha256('s0'), '{}') RETURNING id INTO snap;
  INSERT INTO app.publications (organization_id, project_id, number, branch_id, snapshot, snapshot_sha256) VALUES (a, pa, 1, main_a, '{"pages":[1]}', sha256('p1')) RETURNING id INTO pub;

  PERFORM set_config('t.' || k, v, false) FROM (VALUES ('a', a::text), ('b', b::text), ('admin', admin::text), ('adminb', adminb::text),
    ('pa', pa::text), ('pb', pb::text), ('p1', p1::text), ('p2', p2::text), ('b1', b1::text), ('b2', b2::text), ('main', main_a::text),
    ('snap', snap::text), ('pub', pub::text), ('dev', dev::text), ('des', des::text), ('view', vw::text), ('comm', cm::text),
    ('scope', sc::text), ('exp', ex::text), ('out', ou::text)) x(k, v);
END $$;

-- ───────── 1. Permisos por rol, rol en el proyecto, vetos, vencimiento y alcance ─────────
:as_des
SELECT t.expect_error('42501', format('INSERT INTO app.style_variables (organization_id, project_id, scope, name, kind, value) VALUES (%L, %L, ''global'', ''c'', ''color'', ''#fff'')', t.id('a'), t.id('pa')),
  'diseñador no edita estilos (rol)');
SELECT t.expect_error('42501', format('INSERT INTO app.data_sources (organization_id, project_id, name, url) VALUES (%L, %L, ''api'', ''https://x.test'')', t.id('a'), t.id('pa')),
  'diseñador no edita APIs (rol)');
SELECT t.expect_ok(format('UPDATE app.blocks SET hidden = true WHERE id = %L', t.tid('b1')), 'diseñador edita contenido');

:as_dev
SELECT t.expect_ok(format('INSERT INTO app.style_variables (organization_id, project_id, scope, name, kind, value) VALUES (%L, %L, ''global'', ''color'', ''color'', ''#fff'')', t.id('a'), t.id('pa')),
  'desarrollador edita estilos');
:as_sys
UPDATE app.project_members SET denied = ARRAY['editStyles'] WHERE user_id = t.id('dev');
:as_dev
SELECT t.expect_error('42501', format('UPDATE app.style_variables SET value = ''#000'' WHERE project_id = %L', t.id('pa')), 'veto editStyles sobre un desarrollador');
:as_sys
UPDATE app.project_members SET denied = '{}' WHERE user_id = t.id('dev');

:as_view
SELECT t.expect_eq('visor ve el proyecto', (SELECT count(*) FROM app.projects), 1);
SELECT t.expect_error('42501', format('UPDATE app.blocks SET hidden = false WHERE id = %L', t.tid('b1')), 'visor no edita');
SELECT t.expect_error('42501', format('INSERT INTO app.design_comments (organization_id, project_id, page_id, author_id, x, y, body) VALUES (%L, %L, %L, %L, 1, 1, ''hola'')', t.id('a'), t.id('pa'), t.tid('p1'), t.id('view')), 'visor no comenta');
:as_comm
SELECT t.expect_ok(format('INSERT INTO app.design_comments (organization_id, project_id, page_id, author_id, x, y, body) VALUES (%L, %L, %L, %L, 1, 1, ''hola'')', t.id('a'), t.id('pa'), t.tid('p1'), t.id('comm')), 'comentarista comenta');
SELECT t.expect_error('42501', format('UPDATE app.blocks SET hidden = false WHERE id = %L', t.tid('b1')), 'comentarista no edita');

:as_scope
SELECT t.expect_ok(format('UPDATE app.blocks SET hidden = true WHERE id = %L', t.tid('b1')), 'alcance limitado: edita su página');
SELECT t.expect_error('42501', format('UPDATE app.blocks SET hidden = true WHERE id = %L', t.tid('b2')), 'alcance limitado: no edita la ajena');
SELECT t.expect_ok(format('UPDATE app.blocks SET position = 5 WHERE id = %L', t.tid('b2')), 'alcance limitado: reordenar vecinos sí');

:as_exp
SELECT t.expect_eq('acceso vencido: no ve el proyecto', (SELECT count(*) FROM app.projects), 0);
:as_out
SELECT t.expect_eq('no miembro: no ve el proyecto de su propia organización', (SELECT count(*) FROM app.projects), 0);
SELECT t.expect_eq('no miembro: no ve sus bloques', (SELECT count(*) FROM app.blocks), 0);
:as_nouser
SELECT t.expect_eq('sin usuario en la sesión: no ve proyectos', (SELECT count(*) FROM app.projects), 0);
SELECT t.expect_error('42501', format('INSERT INTO app.pages (organization_id, project_id, name, slug, position) VALUES (%L, %L, ''x'', ''x'', 9)', t.id('a'), t.id('pa')), 'sin usuario no se escribe (falla cerrado)');
:as_admin
SELECT t.expect_eq('superadmin ve todos los proyectos de su organización', (SELECT count(*) FROM app.projects), 1);
SELECT t.expect_ok(format('UPDATE app.blocks SET hidden = false WHERE id = %L', t.tid('b2')), 'superadmin edita todo');

-- ───────── 2. Modelo de trabajo por organización ─────────
:as_dev
SELECT t.expect_error('42501', format('INSERT INTO app.organization_role_permissions VALUES (%L, ''designer'', ''editStyles'', true)', t.id('a')), 'un desarrollador no cambia el modelo de trabajo');
:as_admin
SELECT t.expect_ok(format('INSERT INTO app.organization_role_permissions VALUES (%L, ''designer'', ''editStyles'', true)', t.id('a')), 'el superadmin ajusta la matriz de su organización');
:as_des
SELECT t.expect_ok(format('INSERT INTO app.style_variables (organization_id, project_id, scope, name, kind, value) VALUES (%L, %L, ''global'', ''extra'', ''color'', ''#111'')', t.id('a'), t.id('pa')),
  'ahora el diseñador de ESA organización edita estilos');
:as_adminb
SELECT t.expect_eq('la excepción no se ve en otra organización', (SELECT count(*) FROM app.organization_role_permissions), 0);

-- Despliegue en dos niveles: la cuenta es de la organización; el destino, de cada proyecto.
:as_dev
SELECT t.expect_error('42501', format('INSERT INTO app.organization_integrations (organization_id, kind, config) VALUES (%L, ''vercel'', ''{"team":"equipo"}'')', t.id('a')), 'un desarrollador no cambia las cuentas de la organización');
SELECT t.expect_ok(format('INSERT INTO app.deploy_targets (organization_id, project_id, kind, config) VALUES (%L, %L, ''vercel'', ''{"project":"sitio-a"}'')', t.id('a'), t.id('pa')), 'el destino de despliegue del proyecto');
:as_view
SELECT t.expect_error('42501', format('INSERT INTO app.deploy_targets (organization_id, project_id, kind, config) VALUES (%L, %L, ''ftp'', ''{}'')', t.id('a'), t.id('pa')), 'un visor no configura el despliegue');
:as_admin
SELECT t.expect_ok(format('INSERT INTO app.organization_integrations (organization_id, kind, config) VALUES (%L, ''vercel'', ''{"team":"equipo"}'')', t.id('a')), 'el superadmin configura la cuenta de la organización');
:as_adminb
SELECT t.expect_eq('otra organización no ve esa cuenta ni ese destino', (SELECT count(*) FROM app.organization_integrations) + (SELECT count(*) FROM app.deploy_targets), 0);

-- ───────── 3. Invitaciones ─────────
:as_des
SELECT t.expect_error('42501', format('INSERT INTO app.invitations (organization_id, project_id, email, role, token_hash, invited_by, expires_at) VALUES (%L, %L, ''n@x.com'', ''dev'', sha256(''i1''), %L, now() + interval ''1 day'')', t.id('a'), t.id('pa'), t.id('des')),
  'un diseñador no puede invitar a un desarrollador');
SELECT t.expect_error('42501', format('INSERT INTO app.invitations (organization_id, project_id, email, role, token_hash, invited_by, expires_at) VALUES (%L, %L, ''n@x.com'', ''designer'', sha256(''i1''), %L, now() + interval ''1 day'')', t.id('a'), t.id('pa'), t.id('dev')),
  'no se invita a nombre de otra persona');
SELECT t.expect_ok(format('INSERT INTO app.invitations (organization_id, project_id, email, role, member_role, scope_limited, page_ids, token_hash, invited_by, expires_at) VALUES (%L, %L, ''nuevo@x.com'', ''designer'', ''editor'', true, ARRAY[%L]::text[], sha256(''i1''), %L, now() + interval ''1 day'')', t.id('a'), t.id('pa'), t.tid('p1'), t.id('des')),
  'un diseñador invita a un diseñador');
SELECT t.expect_error('23514', format('INSERT INTO app.invitations (organization_id, project_id, email, role, token_hash, invited_by, expires_at) VALUES (%L, %L, ''largo@x.com'', ''designer'', sha256(''i2''), %L, now() + interval ''400 days'')', t.id('a'), t.id('pa'), t.id('des')),
  'la invitación no excede el máximo de la organización');
:as_nouser
SELECT t.expect_eq('la invitación se resuelve sin cuenta', (SELECT count(*) FROM app.resolve_invitation(sha256('i1'))), 1);
SELECT t.expect_eq('aceptar crea la cuenta', (SELECT count(*) FROM (SELECT app.accept_invitation(sha256('i1'), 'nuevo', 'Nuevo', 'hash') AS u) s WHERE u IS NOT NULL), 1);
SELECT t.expect_eq('la invitación no se reutiliza', (SELECT count(*) FROM (SELECT app.accept_invitation(sha256('i1'), 'otro', 'Otro', 'hash') AS u) s WHERE u IS NOT NULL), 0);
:as_sys
SELECT t.expect_eq('la membresía nació con el alcance pactado', (SELECT count(*) FROM app.member_scope_pages s JOIN app.users u ON u.id = s.user_id WHERE u.email = 'nuevo@x.com' AND s.page_id = t.tid('p1')), 1);
INSERT INTO app.invitations (organization_id, project_id, email, role, token_hash, invited_by, expires_at)
  VALUES (t.id('a'), t.id('pa'), 'admin@b.com', 'designer', sha256('i3'), t.id('admin'), now() + interval '1 day');
:as_nouser
SELECT t.expect_error('23505', 'SELECT app.accept_invitation(sha256(''i3''), ''colado'', ''Colado'', ''h'')', 'una invitación no sirve para meter a una cuenta de otra organización');

-- ───────── 4. Compartir ─────────
:as_dev
SELECT t.expect_error('23514', format('INSERT INTO app.share_links (organization_id, project_id, publication_id, token_hash, audience, access, expires_at, created_by) VALUES (%L, %L, %L, sha256(''l1''), ''anyone'', ''comment'', now() + interval ''1 day'', %L)', t.id('a'), t.id('pa'), t.id('pub'), t.id('dev')),
  'enlace público: nunca permite comentar');
SELECT t.expect_error('23514', format('INSERT INTO app.share_links (organization_id, project_id, publication_id, token_hash, audience, access, created_by) VALUES (%L, %L, %L, sha256(''l1''), ''anyone'', ''view'', %L)', t.id('a'), t.id('pa'), t.id('pub'), t.id('dev')),
  'enlace público: siempre vence');
SELECT t.expect_error('23514', format('INSERT INTO app.share_links (organization_id, project_id, publication_id, token_hash, audience, access, expires_at, created_by) VALUES (%L, %L, %L, sha256(''l1''), ''anyone'', ''view'', now() + interval ''90 days'', %L)', t.id('a'), t.id('pa'), t.id('pub'), t.id('dev')),
  'enlace público: no excede el máximo de la organización');
SELECT t.expect_ok(format('INSERT INTO app.share_links (organization_id, project_id, publication_id, token_hash, audience, access, expires_at, created_by) VALUES (%L, %L, %L, sha256(''l1''), ''anyone'', ''view'', now() + interval ''7 days'', %L)', t.id('a'), t.id('pa'), t.id('pub'), t.id('dev')),
  'enlace público válido');
SELECT t.expect_ok(format('INSERT INTO app.share_links (organization_id, project_id, token_hash, audience, access, created_by) VALUES (%L, %L, sha256(''l2''), ''organization'', ''comment'', %L)', t.id('a'), t.id('pa'), t.id('dev')),
  'enlace interno para comentar');
:as_view
SELECT t.expect_error('42501', format('INSERT INTO app.share_links (organization_id, project_id, token_hash, audience, access, created_by) VALUES (%L, %L, sha256(''l3''), ''organization'', ''view'', %L)', t.id('a'), t.id('pa'), t.id('view')),
  'un visor no comparte');
:as_nouser
SELECT t.expect_eq('el enlace público entrega el contenido', (SELECT count(*) FROM app.resolve_share_link(sha256('l1')) WHERE snapshot IS NOT NULL), 1);
SELECT t.expect_eq('el enlace interno NO entrega contenido', (SELECT count(*) FROM app.resolve_share_link(sha256('l2')) WHERE snapshot IS NOT NULL), 0);
SELECT t.expect_eq('el enlace interno indica su organización', (SELECT count(*) FROM app.resolve_share_link(sha256('l2')) WHERE organization_id = t.id('a')), 1);
:as_sys
UPDATE app.share_links SET revoked_at = now() WHERE token_hash = sha256('l1');
SELECT t.expect_eq('un enlace revocado deja de abrir', (SELECT count(*) FROM app.resolve_share_link(sha256('l1'))), 0);
UPDATE app.organization_settings SET allow_public_share_links = false WHERE organization_id = t.id('a');
:as_dev
SELECT t.expect_error('42501', format('INSERT INTO app.share_links (organization_id, project_id, publication_id, token_hash, audience, access, expires_at, created_by) VALUES (%L, %L, %L, sha256(''l4''), ''anyone'', ''view'', now() + interval ''1 day'', %L)', t.id('a'), t.id('pa'), t.id('pub'), t.id('dev')),
  'la organización puede prohibir los enlaces públicos');

-- ───────── 5. Versiones ─────────
:as_dev
SELECT t.expect_ok(format('INSERT INTO app.commits (organization_id, project_id, branch_id, snapshot_id, message) VALUES (%L, %L, %L, %L, ''v1'')', t.id('a'), t.id('pa'), t.id('main'), t.id('snap')), 'primera versión');
SELECT t.expect_error('40001', format('INSERT INTO app.commits (organization_id, project_id, branch_id, snapshot_id, message) VALUES (%L, %L, %L, %L, ''pisa'')', t.id('a'), t.id('pa'), t.id('main'), t.id('snap')),
  'guardar sobre una cabeza vieja (dos personas a la vez)');
SELECT set_config('t.c1', (SELECT head_commit_id::text FROM app.branches WHERE id = t.id('main')), false);
SELECT t.expect_ok(format('INSERT INTO app.commits (organization_id, project_id, branch_id, snapshot_id, parent_commit_id, message) VALUES (%L, %L, %L, %L, %L, ''v2'')', t.id('a'), t.id('pa'), t.id('main'), t.id('snap'), t.id('c1')), 'segunda versión sobre la cabeza actual');
SELECT t.expect_ok(format('INSERT INTO app.site_snapshots (organization_id, project_id, sha256, document) VALUES (%L, %L, sha256(''s1''), ''{"v":1}'')', t.id('a'), t.id('pa')), 'foto nueva');
SELECT t.expect_error('23505', format('INSERT INTO app.site_snapshots (organization_id, project_id, sha256, document) VALUES (%L, %L, sha256(''s1''), ''{"v":1}'')', t.id('a'), t.id('pa')), 'la misma foto no se duplica (direccionada por contenido)');
SELECT set_config('t.c2', (SELECT head_commit_id::text FROM app.branches WHERE id = t.id('main')), false);
SELECT t.expect_ok(format('INSERT INTO app.commits (organization_id, project_id, branch_id, snapshot_id, parent_commit_id, kind, restored_from_commit_id, message) VALUES (%L, %L, %L, %L, %L, ''restore'', %L, ''Volver a v1'')', t.id('a'), t.id('pa'), t.id('main'), t.id('snap'), t.id('c2'), t.id('c1')),
  'restaurar una versión añade una versión nueva');
SELECT t.expect_error('23514', format('INSERT INTO app.commits (organization_id, project_id, branch_id, snapshot_id, parent_commit_id, kind, message) VALUES (%L, %L, %L, %L, (SELECT head_commit_id FROM app.branches WHERE id = %L), ''merge'', ''sin segundo padre'')', t.id('a'), t.id('pa'), t.id('main'), t.id('snap'), t.id('main')),
  'una fusión exige segundo padre');
SELECT t.expect_error('42501', format('UPDATE app.commits SET message = ''x'' WHERE id = %L', t.id('c1')), 'la historia no se reescribe');
SELECT t.expect_error('42501', format('INSERT INTO app.branches (organization_id, project_id, name, base_branch_id, owner_id) VALUES (%L, %L, ''de-otro'', %L, %L)', t.id('a'), t.id('pa'), t.id('main'), t.id('des')),
  'no se crea una rama a nombre de otra persona');
SELECT t.expect_ok(format('INSERT INTO app.branches (organization_id, project_id, name, base_branch_id, owner_id) VALUES (%L, %L, ''experimento'', %L, %L)', t.id('a'), t.id('pa'), t.id('main'), t.id('dev')), 'rama propia manual');
SELECT t.expect_eq('la rama nace en la cabeza de su base',
  (SELECT count(*) FROM app.branches br JOIN app.branches m ON m.id = br.base_branch_id WHERE br.name = 'experimento' AND br.fork_commit_id = m.head_commit_id AND br.head_commit_id = m.head_commit_id), 1);
SELECT t.expect_error('42501', format('UPDATE app.branches SET owner_id = %L WHERE name = ''experimento''', t.id('des')), 'nadie cambia el dueño de una rama');
SELECT t.expect_eq('un permitido trabaja directamente en main', (SELECT app.ensure_work_branch(t.id('pa')) = t.id('main'))::int, 1);

-- ───────── 5b. Como GitHub: quien no puede publicar en main trabaja en su rama y la envía como pull request ─────────
:as_sys
UPDATE app.project_members SET denied = ARRAY['publishMain'] WHERE user_id = t.id('des');
:as_des
SELECT t.expect_error('42501', format('UPDATE app.blocks SET hidden = true WHERE id = %L', t.tid('b1')), 'sin publishMain no se edita main (las filas SON main)');
SELECT t.expect_error('42501', format('UPDATE app.projects SET name = ''Otro'' WHERE id = %L', t.id('pa')), 'sin publishMain no se cambian los ajustes del proyecto');
SELECT t.expect_error('42501', format('INSERT INTO app.commits (organization_id, project_id, branch_id, snapshot_id, parent_commit_id, message) VALUES (%L, %L, %L, %L, (SELECT head_commit_id FROM app.branches WHERE id = %L), ''directo a main'')', t.id('a'), t.id('pa'), t.id('main'), t.id('snap'), t.id('main')),
  'sin publishMain no se escribe directo en main');
SELECT set_config('t.work', app.ensure_work_branch(t.id('pa'))::text, false);
SELECT t.expect_eq('el sistema le crea SU rama automáticamente', (SELECT count(*) FROM app.branches WHERE id = t.id('work') AND name = 'trabajo-des-a' AND owner_id = t.id('des') AND base_branch_id = t.id('main')), 1);
SELECT t.expect_eq('y la reutiliza la siguiente vez', (SELECT (app.ensure_work_branch(t.id('pa')) = t.id('work'))::int), 1);
SELECT t.expect_error('22023', format('SELECT app.open_pull_request(%L, ''Mis cambios'')', t.id('work')), 'no se envía una rama sin cambios');
SELECT t.expect_ok(format('INSERT INTO app.commits (organization_id, project_id, branch_id, snapshot_id, parent_commit_id, message) VALUES (%L, %L, %L, %L, (SELECT head_commit_id FROM app.branches WHERE id = %L), ''Cambié el titular'')', t.id('a'), t.id('pa'), t.id('work'), t.id('snap'), t.id('work')),
  'guardar una versión en su rama');
SELECT set_config('t.pr1', app.open_pull_request(t.id('work'), 'Cambios de Des')::text, false);
SELECT t.expect_eq('se envía como pull request #1 a quien la invitó', (SELECT count(*) FROM app.pull_requests WHERE id = t.id('pr1') AND number = 1 AND reviewer_id = t.id('admin') AND into_branch_id = t.id('main')), 1);
SELECT t.expect_ok(format('INSERT INTO app.commits (organization_id, project_id, branch_id, snapshot_id, parent_commit_id, message) VALUES (%L, %L, %L, %L, (SELECT head_commit_id FROM app.branches WHERE id = %L), ''Otro ajuste'')', t.id('a'), t.id('pa'), t.id('work'), t.id('snap'), t.id('work')),
  'segunda versión en la misma rama');
SELECT t.expect_eq('la versión nueva se suma sola a la pull request abierta', (SELECT count(*) FROM app.pull_request_commits WHERE pull_request_id = t.id('pr1')), 2);
SELECT t.expect_eq('enviar de nuevo no duplica la pull request', (SELECT (app.open_pull_request(t.id('work'), 'otra vez') = t.id('pr1'))::int), 1);
SELECT t.expect_error('42501', format('UPDATE app.pull_requests SET status = ''merged'' WHERE id = %L', t.id('pr1')), 'el autor no se fusiona a sí mismo');
SELECT t.expect_error('42501', format('SELECT app.merge_pull_request(%L, %L, ''me fusiono'')', t.id('pr1'), t.id('snap')), 'el autor no puede fusionar su propia pull request');
:as_dev
SELECT t.expect_eq('quien no es autor ni revisor no la ve', (SELECT count(*) FROM app.pull_requests), 0);
SELECT t.expect_error('P0002', format('SELECT app.merge_pull_request(%L, %L, ''x'')', t.id('pr1'), t.id('snap')), 'ni puede fusionar lo que no ve');
:as_des
SELECT t.expect_ok(format('UPDATE app.pull_requests SET status = ''closed'', closed_at = now() WHERE id = %L', t.id('pr1')), 'el autor puede cerrar su pull request');
SELECT t.expect_error('42501', format('UPDATE app.pull_requests SET status = ''open'', closed_at = NULL WHERE id = %L', t.id('pr1')), 'una pull request cerrada no se reabre');
SELECT t.expect_ok(format('INSERT INTO app.commits (organization_id, project_id, branch_id, snapshot_id, parent_commit_id, message) VALUES (%L, %L, %L, %L, (SELECT head_commit_id FROM app.branches WHERE id = %L), ''Tercer ajuste'')', t.id('a'), t.id('pa'), t.id('work'), t.id('snap'), t.id('work')),
  'sigue trabajando en su rama');
SELECT set_config('t.pr2', app.open_pull_request(t.id('work'), 'Segundo envío')::text, false);
SELECT t.expect_eq('al estar cerrada la anterior, se abre la #2', (SELECT number FROM app.pull_requests WHERE id = t.id('pr2')), 2);
:as_sys
INSERT INTO app.pull_request_conflicts (organization_id, project_id, pull_request_id, node, property) VALUES (t.id('a'), t.id('pa'), t.id('pr2'), 'Inicio · Titular', 'Texto');
:as_admin
SELECT t.expect_error('23514', format('SELECT app.merge_pull_request(%L, %L, ''x'')', t.id('pr2'), t.id('snap')), 'no se fusiona con conflictos sin resolver');
:as_sys
UPDATE app.pull_request_conflicts SET resolution = 'from' WHERE pull_request_id = t.id('pr2');
:as_admin
SELECT set_config('t.merge', app.merge_pull_request(t.id('pr2'), t.id('snap'), 'Fusiono los cambios de Des')::text, false);
SELECT t.expect_eq('la fusión crea una versión en main con dos padres',
  (SELECT count(*) FROM app.commits c JOIN app.branches m ON m.id = c.branch_id AND m.is_main
   WHERE c.id = t.id('merge') AND c.kind = 'merge' AND c.parent_commit_id IS NOT NULL AND c.second_parent_commit_id = (SELECT head_commit_id FROM app.branches WHERE id = t.id('work'))), 1);
SELECT t.expect_eq('main avanzó a la fusión', (SELECT count(*) FROM app.branches WHERE is_main AND head_commit_id = t.id('merge')), 1);
SELECT t.expect_eq('la pull request quedó fusionada', (SELECT count(*) FROM app.pull_requests WHERE id = t.id('pr2') AND status = 'merged' AND merge_commit_id = t.id('merge')), 1);

-- ───────── 6. Código como objetos (AST) ─────────
:as_dev
SELECT t.expect_ok(format($q$INSERT INTO app.code_units (organization_id, project_id, page_id, slot, language, parser, parser_version, ast, ast_sha256)
  VALUES (%L, %L, %L, 'js', 'typescript', 'babel', '7.26.0', '{"type":"File","program":{"type":"Program","body":[],"sourceType":"module"},"comments":[]}', sha256('a1'))$q$, t.id('a'), t.id('pa'), t.tid('p1')),
  'guardar TypeScript como árbol');
SELECT t.expect_error('23505', format($q$INSERT INTO app.code_units (organization_id, project_id, page_id, slot, language, parser, parser_version, ast, ast_sha256)
  VALUES (%L, %L, %L, 'js', 'typescript', 'babel', '7.26.0', '{"type":"File","program":{}}', sha256('a2'))$q$, t.id('a'), t.id('pa'), t.tid('p1')), 'una ranura por dueño');
SELECT t.expect_error('23514', format($q$INSERT INTO app.code_units (organization_id, project_id, slot, language, parser, parser_version, ast, ast_sha256)
  VALUES (%L, %L, 'x', 'typescript', 'babel', '7.26.0', '{"type":"Program","body":[]}', sha256('a3'))$q$, t.id('a'), t.id('pa')), 'rechaza un árbol que no es un File de Babel');
SELECT t.expect_error('23514', format($q$INSERT INTO app.code_units (organization_id, project_id, slot, language, parser, parser_version, ast, ast_sha256)
  VALUES (%L, %L, 'y', 'typescript', 'babel', '7.26.0', '{"type":"File","program":{},"tokens":[]}', sha256('a4'))$q$, t.id('a'), t.id('pa')), 'rechaza tokens (sería el texto otra vez)');
SELECT t.expect_error('23514', format($q$INSERT INTO app.code_units (organization_id, project_id, slot, language, parser, parser_version, ast, ast_sha256)
  VALUES (%L, %L, 'z', 'typescript', 'postcss', '8.5.0', '{"type":"File","program":{}}', sha256('a5'))$q$, t.id('a'), t.id('pa')), 'el analizador debe corresponder al lenguaje');
SELECT t.expect_ok(format($q$INSERT INTO app.code_units (organization_id, project_id, slot, language, parser, parser_version, ast, ast_sha256)
  VALUES (%L, %L, 'global.css', 'css', 'postcss', '8.5.0', '{"type":"root","nodes":[]}', sha256('a6'))$q$, t.id('a'), t.id('pa')), 'CSS global como árbol');
:as_des
SELECT t.expect_error('42501', format($q$INSERT INTO app.code_units (organization_id, project_id, page_id, slot, language, parser, parser_version, ast, ast_sha256)
  VALUES (%L, %L, %L, 'js2', 'typescript', 'babel', '7.26.0', '{"type":"File","program":{}}', sha256('a7'))$q$, t.id('a'), t.id('pa'), t.tid('p2')), 'un diseñador no escribe JavaScript (editCode)');
:as_sys
SELECT t.expect_eq('antes de borrar la página existe su código', (SELECT count(*) FROM app.code_units WHERE slot = 'js'), 1);
DELETE FROM app.pages WHERE id = t.tid('p1');
SELECT t.expect_eq('el código muere con su página', (SELECT count(*) FROM app.code_units WHERE slot = 'js'), 0);

-- ───────── 7. Medios (ImageKit) ─────────
:as_dev
SELECT t.expect_error('23514', format($q$INSERT INTO app.assets (organization_id, project_id, kind, name, imagekit_path, content_type, byte_size, sha256)
  VALUES (%L, %L, 'image', 'a.png', '/org/%s/x.png', 'image/png', 100, sha256('m1'))$q$, t.id('a'), t.id('pa'), t.id('b')), 'la ruta de ImageKit debe estar bajo la carpeta de la organización propia');
SELECT t.expect_error('23514', format($q$INSERT INTO app.assets (organization_id, project_id, kind, name, imagekit_path, content_type, byte_size, sha256)
  VALUES (%L, %L, 'image', 'a.sh', '/org/%s/a.sh', 'application/x-sh', 100, sha256('m2'))$q$, t.id('a'), t.id('pa'), t.id('a')), 'tipo de archivo fuera de la lista');
SELECT t.expect_ok(format($q$INSERT INTO app.assets (organization_id, project_id, kind, name, tags, imagekit_path, content_type, byte_size, sha256)
  VALUES (%L, %L, 'image', 'logo.png', ARRAY['marca','logo'], '/org/%s/%s/m3.png', 'image/png', 1000, sha256('m3'))$q$, t.id('a'), t.id('pa'), t.id('a'), t.id('pa')), 'subida reservada con sus etiquetas');
SELECT t.expect_error('23505', format($q$INSERT INTO app.assets (organization_id, project_id, kind, name, imagekit_path, content_type, byte_size, sha256)
  VALUES (%L, %L, 'image', 'copia.png', '/org/%s/%s/otra.png', 'image/png', 1000, sha256('m3'))$q$, t.id('a'), t.id('pa'), t.id('a'), t.id('pa')), 'el mismo contenido no se sube dos veces');
SELECT t.expect_error('42501', 'UPDATE app.organization_usage SET storage_bytes = 0', 'la API no toca el contador de cuota');
SELECT t.expect_error('23514', 'UPDATE app.assets SET status = ''ready'', ready_at = now() WHERE sha256 = sha256(''m3'')', 'ready exige el fileId de ImageKit');
:as_sys
SELECT t.expect_eq('la reserva cobró la cuota', (SELECT storage_bytes FROM app.organization_usage WHERE organization_id = t.id('a')), 1000);
UPDATE app.organizations SET max_storage_bytes = 1500 WHERE id = t.id('a');
SELECT t.expect_error('23514', format($q$INSERT INTO app.assets (organization_id, project_id, kind, name, imagekit_path, content_type, byte_size, sha256)
  VALUES (%L, %L, 'image', 'grande.png', '/org/%s/%s/grande.png', 'image/png', 600, sha256('m4'))$q$, t.id('a'), t.id('pa'), t.id('a'), t.id('pa')), 'cuota de almacenamiento del plan');
SELECT t.expect_error('23000', 'UPDATE app.assets SET byte_size = 1 WHERE sha256 = sha256(''m3'')', 'el contenido de un archivo es inmutable');
UPDATE app.assets SET status = 'ready', ready_at = now(), imagekit_file_id = 'ik-file-1' WHERE sha256 = sha256('m3');
SELECT t.expect_error('23000', 'UPDATE app.assets SET imagekit_file_id = ''otro'' WHERE sha256 = sha256(''m3'')', 'el fileId de ImageKit no cambia');
INSERT INTO app.publication_assets (organization_id, project_id, publication_id, asset_id)
  SELECT t.id('a'), t.id('pa'), t.id('pub'), id FROM app.assets WHERE sha256 = sha256('m3');
SELECT t.expect_error('23503', 'DELETE FROM app.assets WHERE sha256 = sha256(''m3'')', 'no se borra un archivo que usa una publicación');
UPDATE app.assets SET created_at = now() - interval '30 days';
SELECT t.expect_eq('un archivo en uso no es huérfano', (SELECT count(*) FROM app.find_orphan_assets(interval '7 days')), 0);
DELETE FROM app.publication_assets;
SELECT t.expect_eq('sin usos pasa a huérfano, con su fileId para borrarlo en ImageKit', (SELECT count(*) FROM app.find_orphan_assets(interval '7 days') WHERE imagekit_file_id = 'ik-file-1'), 1);
DELETE FROM app.assets WHERE sha256 = sha256('m3');
SELECT t.expect_eq('borrarlo devuelve la cuota', (SELECT storage_bytes FROM app.organization_usage WHERE organization_id = t.id('a')), 0);

-- ───────── 8. Tiempo real ─────────
:as_dev
SELECT t.expect_eq('primera operación = seq 1', app.append_operations(t.id('main'), gen_random_uuid(), '[{"type":"page/rename"}]'), 1);
SELECT t.expect_eq('un lote reserva un rango contiguo', app.append_operations(t.id('main'), gen_random_uuid(), '[{"type":"block/move"},{"type":"block/style"}]'), 2);
SELECT t.expect_eq('puesta al día: todo desde la seq 2', (SELECT count(*) FROM app.edit_operations WHERE branch_id = t.id('main') AND seq >= 2), 2);
SELECT t.expect_error('22023', format('SELECT app.append_operations(%L, gen_random_uuid(), ''{"type":"x"}'')', t.id('main')), 'las acciones deben ir en una lista');
:as_view
SELECT t.expect_error('42501', format('SELECT app.append_operations(%L, gen_random_uuid(), ''[{"type":"x"}]'')', t.id('main')), 'un visor no envía operaciones');
:as_adminb
SELECT t.expect_error('P0002', format('SELECT app.append_operations(%L, gen_random_uuid(), ''[{"type":"x"}]'')', t.id('main')), 'otra organización no ve la rama');
SELECT t.expect_eq('otra organización no lee las operaciones', (SELECT count(*) FROM app.edit_operations), 0);
:as_sys
SELECT t.expect_error('23000', 'UPDATE app.edit_operations SET seq = seq', 'las operaciones son inmutables');

-- ───────── 9. Lo que el CMS ya guarda: animaciones, funciones, preferencias, caché, tipos de página ─────────
:as_sys
SELECT t.expect_ok(format('UPDATE app.pages SET role = ''skeleton'' WHERE id = %L', t.tid('p2')), 'página con función «esqueleto»');
SELECT t.expect_ok(format('UPDATE app.pages SET role = ''not-found'' WHERE id = %L', t.tid('p2')), 'página con función «404»');
SELECT t.expect_error('23514', format('UPDATE app.pages SET role = ''not_found'' WHERE id = %L', t.tid('p2')), 'solo los tipos de página que existen');
INSERT INTO app.animations (organization_id, project_id, page_id, name, position)
  VALUES (t.id('a'), t.id('pa'), t.tid('p2'), 'Entrada', 0) RETURNING id \gset anim_
INSERT INTO app.blocks (organization_id, project_id, page_id, component_id, position) VALUES (t.id('a'), t.id('pa'), t.tid('p2'), 'navbar', 5) RETURNING id \gset bx_
SELECT t.expect_error('23514', format('INSERT INTO app.animation_steps (organization_id, project_id, animation_id, block_id, key, prop, from_value, to_value, start_ms, duration_ms, position) VALUES (%L, %L, %L, %L, ''$section'', ''brillo'', ''0'', ''1'', 0, 300, 0)', t.id('a'), t.id('pa'), :'anim_id', t.tid('b2')), 'solo propiedades animables');
INSERT INTO app.animation_steps (organization_id, project_id, animation_id, block_id, key, prop, from_value, to_value, start_ms, duration_ms, position)
  VALUES (t.id('a'), t.id('pa'), :'anim_id', t.tid('b2'), '$section', 'opacity', '0', '1', 0, 400, 0);
INSERT INTO app.shared_functions (organization_id, project_id, name, scope_kind, block_id) VALUES (t.id('a'), t.id('pa'), 'abrir', 'block', t.tid('b2'));
SELECT t.expect_error('23514', format('INSERT INTO app.shared_functions (organization_id, project_id, name, scope_kind, element_id) VALUES (%L, %L, ''x'', ''element'', ''el1'')', t.id('a'), t.id('pa')), 'una función de elemento exige su sección');
SELECT t.expect_eq('hay un paso y una función ligados a la sección', (SELECT (SELECT count(*) FROM app.animation_steps) + (SELECT count(*) FROM app.shared_functions)), 2);
DELETE FROM app.blocks WHERE id = t.tid('b2');
SELECT t.expect_eq('al borrar la sección desaparecen sus pasos de animación y sus funciones', (SELECT (SELECT count(*) FROM app.animation_steps) + (SELECT count(*) FROM app.shared_functions)), 0);

:as_dev
SELECT t.expect_ok(format('INSERT INTO app.user_preferences (organization_id, user_id, key, value) VALUES (%L, %L, ''editor.shortcuts'', ''{"tool.hand":"g"}'')', t.id('a'), t.id('dev')), 'atajos personalizados en la base de datos');
SELECT t.expect_error('42501', format('INSERT INTO app.user_preferences (organization_id, user_id, key, value) VALUES (%L, %L, ''editor.shortcuts'', ''{}'')', t.id('a'), t.id('des')), 'no se escriben preferencias ajenas');
:as_admin
SELECT t.expect_eq('ni el superadmin lee las preferencias de otra persona', (SELECT count(*) FROM app.user_preferences), 0);
:as_dev
SELECT t.expect_eq('numeración sin huecos: primera pull request disponible', app.next_number(t.id('pa'), 'issue'), 1);
SELECT t.expect_eq('…y la siguiente', app.next_number(t.id('pa'), 'issue'), 2);
SELECT t.expect_error('42501', format('UPDATE app.project_counters SET next_issue_number = 99 WHERE project_id = %L', t.id('pa')), 'la API no toca los contadores');
:as_out
SELECT t.expect_error('P0002', format('SELECT app.next_number(%L, ''pr'')', t.id('pa')), 'no se numera en un proyecto ajeno');
:as_dev
SELECT t.expect_ok(format($q$INSERT INTO app.code_units (organization_id, project_id, block_id, slot, language, parser, parser_version, ast, ast_sha256)
  VALUES (%L, %L, %L, 'code.html', 'html', 'parse5', '7.3.0', '{"nodeName":"#document-fragment","childNodes":[{"nodeName":"section","tagName":"section","attrs":[],"namespaceURI":"http://www.w3.org/1999/xhtml","childNodes":[]}]}', sha256('h1'))$q$, t.id('a'), t.id('pa'), :'bx_id'),
  'un bloque de código HTML se guarda como fragmento parse5');
:as_sys
INSERT INTO app.data_source_cache (organization_id, project_id, cache_key, status, content_type, body, expires_at)
  VALUES (t.id('a'), t.id('pa'), sha256('req1'), 200, 'application/json', '{}', now() - interval '1 hour');
INSERT INTO app.data_source_cache (organization_id, project_id, cache_key, status, content_type, body)
  VALUES (t.id('a'), t.id('pa'), sha256('req2'), 200, 'application/json', '{}');
SELECT t.expect_eq('el mantenimiento borra solo el caché vencido', (SELECT cache_rows FROM app.purge_expired()), 1);
SELECT t.expect_eq('el caché persistente se conserva', (SELECT count(*) FROM app.data_source_cache), 1);

-- ───────── 9. Auditoría estructural ─────────
SELECT t.expect_eq('toda tabla con organization_id tiene RLS activa',
  (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'app' AND c.relkind IN ('r', 'p') AND NOT c.relispartition AND NOT c.relrowsecurity
     AND (c.relname = 'organizations' OR EXISTS (SELECT 1 FROM pg_attribute a WHERE a.attrelid = c.oid AND a.attname = 'organization_id'))), 0);
SELECT t.expect_eq('ninguna columna guarda código como texto',
  (SELECT count(*) FROM information_schema.columns WHERE table_schema = 'app'
     AND column_name IN ('css', 'js', 'code', 'script', 'transform', 'global_css', 'source_code')), 0);

DO $$ BEGIN RAISE NOTICE 'TODAS LAS PRUEBAS DE COLABORACION PASARON'; END $$;
ROLLBACK;
