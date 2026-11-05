-- Prueba de carga de las rutas críticas. Siembra datos sintéticos y mide con EXPLAIN ANALYZE bajo el rol
-- de la API (con RLS). Úsala SOLO en una base desechable:  psql -v ON_ERROR_STOP=1 -d portal -f db/tests/load-bench.sql
-- Volumen: 50 organizaciones × 5 proyectos × 20 páginas × 30 bloques = 150 000 bloques.
\set ON_ERROR_STOP on
\timing off

INSERT INTO app.organizations (slug, name, max_projects)
SELECT 'bench-' || g, 'Bench ' || g, 50 FROM generate_series(1, 50) g;

INSERT INTO app.users (organization_id, email, username, name, role, password_hash)
SELECT o.id, 'u' || u || '@' || o.slug || '.test', 'user' || u, 'Usuario ' || u, CASE WHEN u = 1 THEN 'superadmin' ELSE 'dev' END, 'hash'
FROM app.organizations o, generate_series(1, 20) u WHERE o.slug LIKE 'bench-%';

INSERT INTO app.projects (organization_id, slug, name)
SELECT o.id, 'sitio-' || p, 'Sitio ' || p FROM app.organizations o, generate_series(1, 5) p WHERE o.slug LIKE 'bench-%';

INSERT INTO app.pages (organization_id, project_id, name, slug, is_home, position, title)
SELECT p.organization_id, p.id, 'Página ' || g, 'pagina-' || g, g = 1, g - 1, '{"text":"Titular","size":48}'
FROM app.projects p, generate_series(1, 20) g WHERE p.slug LIKE 'sitio-%';

INSERT INTO app.components (organization_id, project_id, id, name, category, width, height, custom)
SELECT p.organization_id, p.id, 'hero-banner', 'Hero', 'secciones', 1200, 400, false FROM app.projects p WHERE p.slug LIKE 'sitio-%';

INSERT INTO app.blocks (organization_id, project_id, page_id, component_id, position, format)
SELECT pg.organization_id, pg.project_id, pg.id, 'hero-banner', g - 1,
       jsonb_build_object('elements', (SELECT jsonb_object_agg('el' || e, jsonb_build_object('text', repeat('x', 40), 'fontSize', 16, 'fill', '#0d99ff')) FROM generate_series(1, 6) e),
                          'box', jsonb_build_object('padding', 24), 'custom', jsonb_build_object('$section', jsonb_build_object('classes', 'p-4', 'css', '')))
FROM app.pages pg, generate_series(1, 30) g;

INSERT INTO app.publications (organization_id, project_id, number, branch_id, snapshot, snapshot_sha256)
SELECT p.organization_id, p.id, 1, b.id,
       jsonb_build_object('pages', (SELECT jsonb_agg(jsonb_build_object('slug', 'p' || g, 'html', repeat('<section>x</section>', 100))) FROM generate_series(1, 20) g)),
       sha256(p.id::text::bytea)
FROM app.projects p JOIN app.branches b ON b.project_id = p.id AND b.is_main WHERE p.slug LIKE 'sitio-%';
UPDATE app.projects p SET live_publication_id = pub.id FROM app.publications pub WHERE pub.project_id = p.id;
INSERT INTO app.project_domains (organization_id, project_id, host, verified_at)
SELECT p.organization_id, p.id, p.slug || '.' || o.slug || '.example.com', now()
FROM app.projects p JOIN app.organizations o ON o.id = p.organization_id WHERE o.slug LIKE 'bench-%';

-- Peor caso real: quien trabaja NO es superadmin, sino un desarrollador miembro de los 5 proyectos
-- (cada consulta paga la visibilidad por membresía y cada escritura paga las guardas de permisos).
INSERT INTO app.project_members (organization_id, project_id, user_id, member_role)
SELECT p.organization_id, p.id, u.id, 'editor' FROM app.projects p JOIN app.organizations o ON o.id = p.organization_id
JOIN app.users u ON u.organization_id = o.id AND u.email = 'u7@' || o.slug || '.test' WHERE o.slug LIKE 'bench-%';

VACUUM ANALYZE;

-- Una organización y proyecto cualesquiera, como si fuera la sesión de la API.
SELECT o.id AS org, p.id AS project, (SELECT id FROM app.users WHERE organization_id = o.id AND email = 'u7@bench-25.test') AS usr
FROM app.organizations o JOIN app.projects p ON p.organization_id = o.id
WHERE o.slug = 'bench-25' AND p.slug = 'sitio-3' \gset

BEGIN;
SELECT set_config('app.org_id', :'org', true), set_config('app.user_id', :'usr', true);
SET LOCAL ROLE portal_app;

\echo '== 1. Abrir el editor: bloques de TODO el proyecto (600 filas con su formato)'
EXPLAIN (ANALYZE, BUFFERS, SUMMARY) SELECT id, page_id, position, component_id, hidden, locked, format
  FROM app.blocks WHERE organization_id = :'org' AND project_id = :'project' ORDER BY page_id, position;

\echo '== 2. Abrir el editor: páginas del proyecto'
EXPLAIN (ANALYZE, SUMMARY) SELECT * FROM app.pages WHERE organization_id = :'org' AND project_id = :'project' ORDER BY position;

\echo '== 3. Guardar una página: actualizar sus 30 bloques en una sola sentencia'
EXPLAIN (ANALYZE, SUMMARY) UPDATE app.blocks b SET format = v.format, position = v.position
  FROM (SELECT id, format, position FROM app.blocks WHERE organization_id = :'org' AND project_id = :'project'
        AND page_id = (SELECT id FROM app.pages WHERE organization_id = :'org' AND project_id = :'project' AND slug = 'pagina-2')) v
  WHERE b.organization_id = :'org' AND b.project_id = :'project' AND b.id = v.id;
ROLLBACK;

\echo '== 4. Iniciar sesión (sin organización aún): login_lookup por correo'
BEGIN;
SET LOCAL ROLE portal_app;
EXPLAIN (ANALYZE, SUMMARY) SELECT * FROM app.login_lookup('u7@bench-25.test');

\echo '== 5. Sitio público por dominio (lo que ve el visitante)'
EXPLAIN (ANALYZE, SUMMARY) SELECT project_id, publication_id, snapshot_sha256, length(snapshot::text) AS bytes FROM app.resolve_public_site('sitio-3.bench-25.example.com');
ROLLBACK;
