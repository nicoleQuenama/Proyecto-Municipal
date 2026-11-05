-- Pruebas de aislamiento entre organizaciones e integridad del esquema.
-- Todo corre dentro de una transacción que termina en ROLLBACK: no deja nada en la base.
--   psql -v ON_ERROR_STOP=1 -d portal -f db/tests/isolation.sql
-- Cualquier fallo aborta con "FALLO [...]". Si llega al final imprime "TODAS LAS PRUEBAS PASARON".
\set ON_ERROR_STOP on
BEGIN;

CREATE SCHEMA t;
GRANT USAGE ON SCHEMA t TO portal_app, portal_readonly;

-- La sentencia debe fallar con ese SQLSTATE (se ejecuta con el rol que esté activo).
CREATE FUNCTION t.expect_error(p_state text, p_sql text, p_label text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE p_sql;
  RAISE EXCEPTION 'FALLO [%]: se esperaba el error % y la sentencia pasó', p_label, p_state;
EXCEPTION WHEN OTHERS THEN
  IF SQLSTATE = p_state THEN
    RAISE NOTICE 'ok   [%] rechazado con %', p_label, SQLSTATE;
  ELSE
    RAISE EXCEPTION 'FALLO [%]: se esperaba % y llegó % (%)', p_label, p_state, SQLSTATE, SQLERRM;
  END IF;
END $$;

CREATE FUNCTION t.expect_eq(p_label text, p_actual bigint, p_expected bigint) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF p_actual IS DISTINCT FROM p_expected THEN
    RAISE EXCEPTION 'FALLO [%]: se esperaba % y hay %', p_label, p_expected, p_actual;
  END IF;
  RAISE NOTICE 'ok   [%] = %', p_label, p_actual;
END $$;

-- Datos de partida, creados por el dueño (salta RLS), como haría el alta de una organización.
DO $$
DECLARE
  a uuid; b uuid; admin_a uuid; admin_b uuid; dev_a uuid; dev_b uuid; pa uuid; pb uuid;
  page_a text; page_b text; main_a uuid; main_b uuid; pub_a uuid; pub_b uuid; snap_a uuid;
BEGIN
  a := app.provision_organization('org-a', 'Org A', 'admin@a.com', 'Admin A', 'admin-a', 'hash');
  b := app.provision_organization('org-b', 'Org B', 'admin@b.com', 'Admin B', 'admin-b', 'hash');
  SELECT id INTO admin_a FROM app.users WHERE organization_id = a;
  SELECT id INTO admin_b FROM app.users WHERE organization_id = b;
  INSERT INTO app.users (organization_id, email, username, name, role, password_hash, invited_by)
    VALUES (a, 'dev@a.com', 'dev-a', 'Dev A', 'dev', 'h', admin_a) RETURNING id INTO dev_a;
  INSERT INTO app.users (organization_id, email, username, name, role, password_hash)
    VALUES (b, 'dev@b.com', 'dev-b', 'Dev B', 'dev', 'h') RETURNING id INTO dev_b;
  INSERT INTO app.projects (organization_id, slug, name) VALUES (a, 'sitio', 'Sitio A') RETURNING id INTO pa;
  INSERT INTO app.projects (organization_id, slug, name) VALUES (b, 'sitio', 'Sitio B') RETURNING id INTO pb;
  INSERT INTO app.components (organization_id, project_id, id, name, category, width, height, custom) VALUES (a, pa, 'navbar', 'Barra', 'navegación', 1200, 80, false);
  INSERT INTO app.pages (organization_id, project_id, name, slug, is_home, position)
    VALUES (a, pa, 'Inicio', 'inicio', true, 0) RETURNING id INTO page_a;
  INSERT INTO app.pages (organization_id, project_id, name, slug, is_home, position)
    VALUES (b, pb, 'Inicio', 'inicio', true, 0) RETURNING id INTO page_b;
  INSERT INTO app.project_members (organization_id, project_id, user_id, member_role) VALUES (a, pa, dev_a, 'editor');
  INSERT INTO app.project_members (organization_id, project_id, user_id, member_role) VALUES (b, pb, dev_b, 'editor');
  SELECT id INTO main_a FROM app.branches WHERE project_id = pa AND is_main;
  SELECT id INTO main_b FROM app.branches WHERE project_id = pb AND is_main;
  INSERT INTO app.publications (organization_id, project_id, number, branch_id, snapshot, snapshot_sha256)
    VALUES (a, pa, 1, main_a, '{"pages":[]}', sha256('a')) RETURNING id INTO pub_a;
  INSERT INTO app.publications (organization_id, project_id, number, branch_id, snapshot, snapshot_sha256)
    VALUES (b, pb, 1, main_b, '{"pages":[]}', sha256('b')) RETURNING id INTO pub_b;
  INSERT INTO app.site_snapshots (organization_id, project_id, sha256, document) VALUES (a, pa, sha256('snap-a'), '{}') RETURNING id INTO snap_a;
  PERFORM set_config('t.snap_a', snap_a::text, false);
  UPDATE app.projects SET live_publication_id = pub_a WHERE id = pa;
  INSERT INTO app.project_domains (organization_id, project_id, host, verified_at)
    VALUES (a, pa, 'a.example.com', now());

  PERFORM set_config('t.a', a::text, false);           PERFORM set_config('t.b', b::text, false);
  PERFORM set_config('t.admin_a', admin_a::text, false); PERFORM set_config('t.dev_a', dev_a::text, false);
  PERFORM set_config('t.dev_b', dev_b::text, false);   PERFORM set_config('t.admin_b', admin_b::text, false);
  PERFORM set_config('t.pa', pa::text, false);         PERFORM set_config('t.pb', pb::text, false);
  PERFORM set_config('t.page_a', page_a::text, false); PERFORM set_config('t.page_b', page_b::text, false);
  PERFORM set_config('t.main_a', main_a::text, false); PERFORM set_config('t.pub_b', pub_b::text, false);
END $$;

-- ───────── Como la API de la organización A (rol portal_app, no dueño) ─────────
SELECT set_config('app.org_id', current_setting('t.a'), true), set_config('app.user_id', current_setting('t.dev_a'), true);
SET LOCAL ROLE portal_app;

SELECT t.expect_eq('A ve solo su organización', (SELECT count(*) FROM app.organizations), 1);
SELECT t.expect_eq('A ve solo sus usuarios', (SELECT count(*) FROM app.users), 2);
SELECT t.expect_eq('A no ve el proyecto de B', (SELECT count(*) FROM app.projects WHERE id = current_setting('t.pb')::uuid), 0);
SELECT t.expect_eq('A no ve las páginas de B', (SELECT count(*) FROM app.pages WHERE id = current_setting('t.page_b')), 0);
SELECT t.expect_eq('A no ve ramas de B', (SELECT count(*) FROM app.branches WHERE project_id = current_setting('t.pb')::uuid), 0);

SELECT t.expect_error('42501',
  format('INSERT INTO app.projects (organization_id, slug, name) VALUES (%L, ''x'', ''X'')', current_setting('t.b')),
  'escribir una fila de la organización B (RLS)');
SELECT t.expect_error('23503',
  format('INSERT INTO app.blocks (organization_id, project_id, page_id, component_id, position) VALUES (%L, %L, %L, ''navbar'', 0)',
         current_setting('t.a'), current_setting('t.pa'), current_setting('t.page_b')),
  'bloque de A apuntando a una página de B (FK compuesta)');
SELECT t.expect_error('23503',
  format('INSERT INTO app.project_members (organization_id, project_id, user_id) VALUES (%L, %L, %L)',
         current_setting('t.a'), current_setting('t.pa'), current_setting('t.dev_b')),
  'usuario de B como miembro de un proyecto de A');
SELECT t.expect_error('42501',
  format('UPDATE app.users SET invited_by = %L WHERE id = %L', current_setting('t.dev_b'), current_setting('t.dev_a')),
  'invitación cruzada entre organizaciones');
SELECT t.expect_error('42501', 'UPDATE app.organizations SET max_projects = 999',
  'la API no puede subirse su propia cuota');

-- Permisos de tablas de solo-inserción
INSERT INTO app.audit_log (organization_id, action, entity_type) VALUES (current_setting('t.a')::uuid, 'project.create', 'project');
SELECT t.expect_error('42501', 'UPDATE app.audit_log SET action = ''x.y''', 'la API no edita la auditoría');
INSERT INTO app.commits (organization_id, project_id, branch_id, snapshot_id, author_id, message)
  VALUES (current_setting('t.a')::uuid, current_setting('t.pa')::uuid, current_setting('t.main_a')::uuid, current_setting('t.snap_a')::uuid, current_setting('t.dev_a')::uuid, 'v1');
SELECT t.expect_error('42501', 'UPDATE app.commits SET message = ''otra''', 'la API no reescribe versiones');

-- Comentarios privados: solo su autor los ve
INSERT INTO app.design_comments (organization_id, project_id, page_id, author_id, x, y, body, audience)
  VALUES (current_setting('t.a')::uuid, current_setting('t.pa')::uuid, current_setting('t.page_a')::uuid,
          current_setting('t.dev_a')::uuid, 10, 10, 'solo mío', 'private'),
         (current_setting('t.a')::uuid, current_setting('t.pa')::uuid, current_setting('t.page_a')::uuid,
          current_setting('t.dev_a')::uuid, 20, 20, 'para el equipo', 'team');
SELECT t.expect_eq('el autor ve sus 2 comentarios', (SELECT count(*) FROM app.design_comments), 2);
SELECT t.expect_error('42501',
  format('INSERT INTO app.design_comments (organization_id, project_id, page_id, author_id, x, y, body) VALUES (%L, %L, %L, %L, 1, 1, ''suplantado'')',
         current_setting('t.a'), current_setting('t.pa'), current_setting('t.page_a'), current_setting('t.admin_a')),
  'comentar a nombre de otra persona');

SELECT set_config('app.user_id', current_setting('t.admin_a'), true);
SELECT t.expect_eq('otra persona solo ve el comentario del equipo', (SELECT count(*) FROM app.design_comments), 1);
DELETE FROM app.design_comments;
SELECT set_config('app.user_id', current_setting('t.dev_a'), true);
SELECT t.expect_eq('nadie borra comentarios ajenos', (SELECT count(*) FROM app.design_comments), 2);

-- Restablecer contraseña y login: cruzan organizaciones solo por las funciones acotadas
SELECT t.expect_eq('login_lookup encuentra por correo sin importar mayúsculas', (SELECT count(*) FROM app.login_lookup('DEV@A.com')), 1);
SELECT t.expect_eq('sitio público se resuelve por dominio', (SELECT count(*) FROM app.resolve_public_site('a.example.com')), 1);
INSERT INTO app.password_reset_tokens (organization_id, user_id, token_hash, expires_at)
  VALUES (current_setting('t.a')::uuid, current_setting('t.dev_a')::uuid, sha256('token-1'), now() + interval '30 minutes');
SELECT t.expect_eq('el token se gasta una vez', (SELECT count(*) FROM app.reset_password_with_token(sha256('token-1'), 'nuevo')), 1);
SELECT t.expect_eq('y no se puede reutilizar', (SELECT count(*) FROM app.reset_password_with_token(sha256('token-1'), 'otro')), 0);
SELECT t.expect_eq('cambiar la contraseña sube session_version', (SELECT session_version FROM app.users WHERE id = current_setting('t.dev_a')::uuid), 1);

-- Sin organización fijada no se ve ni se escribe nada
SELECT set_config('app.org_id', '', true);
SELECT t.expect_eq('sin organización: cero usuarios', (SELECT count(*) FROM app.users), 0);
SELECT t.expect_eq('sin organización: cero proyectos', (SELECT count(*) FROM app.projects), 0);
SELECT t.expect_error('42501',
  format('INSERT INTO app.projects (organization_id, slug, name) VALUES (%L, ''y'', ''Y'')', current_setting('t.a')),
  'escribir sin organización');

-- Soporte de solo lectura también está sujeto a RLS
RESET ROLE;
SELECT set_config('app.org_id', current_setting('t.b'), true), set_config('app.user_id', current_setting('t.admin_b'), true);
SET LOCAL ROLE portal_readonly;
SELECT t.expect_eq('portal_readonly ve solo B', (SELECT count(*) FROM app.projects), 1);
SELECT t.expect_error('42501', 'DELETE FROM app.projects', 'portal_readonly no escribe');

-- ───────── Integridad (como dueño: prueba las reglas del esquema, no los permisos) ─────────
RESET ROLE;
SELECT t.expect_error('23505',
  format('INSERT INTO app.users (organization_id, email, username, name, role, password_hash) VALUES (%L, ''dev@a.com'', ''otro'', ''X'', ''dev'', ''h'')', current_setting('t.b')),
  'el correo es único en toda la plataforma');
SELECT t.expect_error('23505',
  format('INSERT INTO app.users (organization_id, email, username, name, role, password_hash) VALUES (%L, ''z@a.com'', ''DEV-A'', ''X'', ''dev'', ''h'')', current_setting('t.a')),
  'el usuario es único por organización sin distinguir mayúsculas');
SELECT t.expect_error('23514',
  format('UPDATE app.users SET role = ''dev'' WHERE id = %L', current_setting('t.admin_a')),
  'no se quita al último superadministrador');
SELECT t.expect_error('23505',
  format('INSERT INTO app.pages (organization_id, project_id, name, slug, is_home, position) VALUES (%L, %L, ''Otra'', ''otra'', true, 1)',
         current_setting('t.a'), current_setting('t.pa')),
  'una sola página de inicio por proyecto');
SELECT t.expect_error('23514',
  format('INSERT INTO app.style_variables (organization_id, project_id, scope, name, kind, value) VALUES (%L, %L, ''page'', ''c'', ''color'', ''#fff'')',
         current_setting('t.a'), current_setting('t.pa')),
  'variable de página sin página');
INSERT INTO app.style_variables (organization_id, project_id, scope, name, kind, value)
  VALUES (current_setting('t.a')::uuid, current_setting('t.pa')::uuid, 'global', 'primario', 'color', '#0d99ff');
SELECT t.expect_error('23505',
  format('INSERT INTO app.style_variables (organization_id, project_id, scope, name, kind, value) VALUES (%L, %L, ''global'', ''primario'', ''color'', ''#000'')',
         current_setting('t.a'), current_setting('t.pa')),
  'variable global duplicada (NULLS NOT DISTINCT)');
SELECT t.expect_error('23502',
  format('INSERT INTO app.blocks (organization_id, project_id, page_id, position) VALUES (%L, %L, %L, 0)',
         current_setting('t.a'), current_setting('t.pa'), current_setting('t.page_a')),
  'un bloque necesita su componente');
SELECT t.expect_error('23503',
  format('INSERT INTO app.blocks (organization_id, project_id, page_id, component_id, position) VALUES (%L, %L, %L, ''no-existe'', 0)',
         current_setting('t.a'), current_setting('t.pa'), current_setting('t.page_a')),
  'un bloque no puede apuntar a un componente que no existe'); 
SELECT t.expect_error('23503',
  format('UPDATE app.projects SET live_publication_id = %L WHERE id = %L', current_setting('t.pub_b'), current_setting('t.pa')),
  'publicar en línea una publicación de otro proyecto');
SELECT t.expect_error('23000', 'UPDATE app.publications SET message = ''x''', 'las publicaciones son inmutables');
SELECT t.expect_error('23000', 'UPDATE app.commits SET message = ''otra''', 'las versiones son inmutables');

UPDATE app.pages SET name = 'Portada' WHERE id = current_setting('t.page_a');
SELECT t.expect_eq('row_version sube en cada UPDATE', (SELECT row_version FROM app.pages WHERE id = current_setting('t.page_a')), 2);

UPDATE app.organizations SET max_projects = 1 WHERE id = current_setting('t.b')::uuid;
SELECT t.expect_error('23514',
  format('INSERT INTO app.projects (organization_id, slug, name) VALUES (%L, ''segundo'', ''Segundo'')', current_setting('t.b')),
  'cuota de proyectos del plan');

SELECT t.expect_eq('todo proyecto tiene su rama main', (SELECT count(*) FROM app.projects p WHERE NOT EXISTS (SELECT 1 FROM app.branches b WHERE b.project_id = p.id AND b.is_main)), 0);
SELECT t.expect_eq('particiones de auditoría creadas', (SELECT count(*) >= 4 FROM pg_inherits WHERE inhparent = 'app.audit_log'::regclass)::int, 1);

-- ───────── Auditoría estructural del esquema ─────────
SELECT t.expect_eq('toda tabla con organization_id tiene RLS activa',
  (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'app' AND c.relkind IN ('r', 'p') AND NOT c.relispartition AND NOT c.relrowsecurity
     AND (c.relname = 'organizations' OR EXISTS (SELECT 1 FROM pg_attribute a WHERE a.attrelid = c.oid AND a.attname = 'organization_id'))), 0);
SELECT t.expect_eq('toda tabla tiene clave primaria',
  (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'app' AND c.relkind IN ('r', 'p') AND NOT c.relispartition
     AND NOT EXISTS (SELECT 1 FROM pg_constraint k WHERE k.conrelid = c.oid AND k.contype = 'p')), 0);
-- Toda FK debe tener un índice que empiece por sus columnas (si no, borrar/actualizar el padre escanea la hija).
-- Excepción deliberada: FKs hacia users sin acción, porque los usuarios nunca se borran (solo deleted_at).
SELECT t.expect_eq('toda clave foránea tiene índice de apoyo',
  (SELECT count(*) FROM pg_constraint k
   WHERE k.contype = 'f' AND k.connamespace = 'app'::regnamespace
     AND NOT (k.confrelid = 'app.users'::regclass AND k.confdeltype = 'a')
     AND NOT EXISTS (
       SELECT 1 FROM pg_index i
       WHERE i.indrelid = k.conrelid AND i.indisvalid
         AND (string_to_array(i.indkey::text, ' ')::int2[])[1:cardinality(k.conkey)] <@ k.conkey
         AND (string_to_array(i.indkey::text, ' ')::int2[])[1:cardinality(k.conkey)] @> k.conkey)), 0);

DO $$ BEGIN RAISE NOTICE 'TODAS LAS PRUEBAS PASARON'; END $$;
ROLLBACK;
