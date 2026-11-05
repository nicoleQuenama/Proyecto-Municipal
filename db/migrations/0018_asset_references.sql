-- 0018 · Qué archivos de ImageKit ya no usa nadie.
--
-- El diseño guarda la DIRECCIÓN pública del archivo (`https://ik.imagekit.io/<cuenta>/org/<organización>/<proyecto>/<huella>-nombre.png`)
-- en cualquier parte: una sección, un componente, el fondo de una página, la biblioteca de medios, el código… Por eso la limpieza ya
-- no se fía de columnas sueltas: un archivo está en uso si su RUTA aparece en lo que hay de contenido hoy, en alguna versión
-- guardada (se puede volver a ella) o en una publicación. La ruta lleva la huella del contenido, así que no hay falsos positivos.
CREATE OR REPLACE FUNCTION app.find_orphan_assets(p_grace interval DEFAULT interval '7 days')
RETURNS TABLE (asset_id uuid, organization_id uuid, imagekit_file_id text, imagekit_path text)
LANGUAGE sql STABLE AS
$$
  SELECT a.id, a.organization_id, a.imagekit_file_id, a.imagekit_path
  FROM app.assets a
  WHERE (a.status <> 'ready' AND a.created_at < now() - interval '1 day')
     OR (a.status = 'ready' AND a.created_at < now() - p_grace
         AND NOT EXISTS (SELECT 1 FROM app.publication_assets p WHERE p.organization_id = a.organization_id AND p.project_id = a.project_id AND p.asset_id = a.id)
         AND NOT EXISTS (SELECT 1 FROM app.pages x       WHERE x.organization_id = a.organization_id AND x.project_id = a.project_id AND to_jsonb(x)::text LIKE '%' || a.imagekit_path || '%')
         AND NOT EXISTS (SELECT 1 FROM app.blocks x      WHERE x.organization_id = a.organization_id AND x.project_id = a.project_id AND to_jsonb(x)::text LIKE '%' || a.imagekit_path || '%')
         AND NOT EXISTS (SELECT 1 FROM app.media_items x WHERE x.organization_id = a.organization_id AND x.project_id = a.project_id AND to_jsonb(x)::text LIKE '%' || a.imagekit_path || '%')
         AND NOT EXISTS (SELECT 1 FROM app.components x  WHERE x.organization_id = a.organization_id AND x.project_id = a.project_id AND to_jsonb(x)::text LIKE '%' || a.imagekit_path || '%')
         AND NOT EXISTS (SELECT 1 FROM app.projects x    WHERE x.organization_id = a.organization_id AND x.id = a.project_id AND to_jsonb(x)::text LIKE '%' || a.imagekit_path || '%')
         AND NOT EXISTS (SELECT 1 FROM app.site_snapshots x WHERE x.organization_id = a.organization_id AND x.project_id = a.project_id AND x.document::text LIKE '%' || a.imagekit_path || '%')
         AND NOT EXISTS (SELECT 1 FROM app.publications x   WHERE x.organization_id = a.organization_id AND x.project_id = a.project_id AND x.snapshot::text LIKE '%' || a.imagekit_path || '%'))
$$;
