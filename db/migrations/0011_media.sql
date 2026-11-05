-- 0011 · Medios (ImageKit): cuota de almacenamiento, qué publicación usa qué archivo, y limpieza.
--
-- ImageKit hospeda los originales y entrega cualquier tamaño o formato por URL, así que no hay tabla de versiones.
-- Lo que sí hace falta en la base de datos: cuánto ocupa cada organización, que una publicación no pierda sus
-- imágenes, y encontrar los archivos que ya nadie usa para borrarlos de ImageKit.

-- Consumo de almacenamiento por organización. Organización 1 ── 1 consumo.
-- Un contador (no un SUM sobre assets): subir un archivo cuesta una fila actualizada, no recorrer miles.
-- Solo lo mueven los disparadores de abajo; la API no tiene permiso de escritura (ver apply_grants).
CREATE TABLE app.organization_usage (
  organization_id uuid   PRIMARY KEY REFERENCES app.organizations (id) ON DELETE CASCADE,
  storage_bytes   bigint NOT NULL DEFAULT 0 CHECK (storage_bytes >= 0)
);
INSERT INTO app.organization_usage (organization_id) SELECT id FROM app.organizations;

CREATE FUNCTION app.create_organization_usage() RETURNS trigger
LANGUAGE plpgsql AS
$$ BEGIN INSERT INTO app.organization_usage (organization_id) VALUES (NEW.id); RETURN NULL; END $$;
CREATE TRIGGER organizations_create_usage AFTER INSERT ON app.organizations
  FOR EACH ROW EXECUTE FUNCTION app.create_organization_usage();

-- Cobra la cuota al reservar la subida; falla si la organización se pasaría de su plan.
-- SECURITY DEFINER: actualiza organization_usage, que la API no puede tocar.
CREATE FUNCTION app.charge_storage() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, app, pg_temp AS
$$
BEGIN
  UPDATE app.organization_usage u SET storage_bytes = u.storage_bytes + NEW.byte_size
  FROM app.organizations o
  WHERE u.organization_id = NEW.organization_id AND o.id = u.organization_id
    AND u.storage_bytes + NEW.byte_size <= o.max_storage_bytes;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'La organización alcanzó su cuota de almacenamiento' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NULL;
END
$$;

CREATE FUNCTION app.release_storage() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, app, pg_temp AS
$$
BEGIN
  UPDATE app.organization_usage SET storage_bytes = greatest(storage_bytes - OLD.byte_size, 0)
  WHERE organization_id = OLD.organization_id;
  RETURN NULL;
END
$$;

CREATE TRIGGER assets_charge  AFTER INSERT ON app.assets FOR EACH ROW EXECUTE FUNCTION app.charge_storage();
CREATE TRIGGER assets_release AFTER DELETE ON app.assets FOR EACH ROW EXECUTE FUNCTION app.release_storage();

-- Tras reservarse, de un archivo solo cambian su estado, su fileId de ImageKit y sus medidas. Ruta, tipo, tamaño y hash son
-- inmutables: si pudieran cambiar, la cuota y la deduplicación dejarían de ser fiables.
CREATE FUNCTION app.freeze_asset() RETURNS trigger
LANGUAGE plpgsql AS
$$
BEGIN
  IF (NEW.organization_id, NEW.project_id, NEW.imagekit_path, NEW.content_type, NEW.byte_size, NEW.sha256)
     IS DISTINCT FROM (OLD.organization_id, OLD.project_id, OLD.imagekit_path, OLD.content_type, OLD.byte_size, OLD.sha256)
     OR (OLD.imagekit_file_id IS NOT NULL AND NEW.imagekit_file_id IS DISTINCT FROM OLD.imagekit_file_id) THEN
    RAISE EXCEPTION 'El contenido de un archivo no se modifica: sube uno nuevo' USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  RETURN NEW;
END
$$;
CREATE TRIGGER assets_freeze BEFORE UPDATE ON app.assets FOR EACH ROW EXECUTE FUNCTION app.freeze_asset();

-- Qué archivos usa cada publicación. Publicación N ── M Archivo.
-- Las publicaciones son fotos inmutables que apuntan a archivos: si se borrara uno, una versión publicada
-- (o una a la que se pueda volver) quedaría con imágenes rotas. NO ACTION lo impide, y sigue permitiendo
-- borrar el proyecto entero (publicaciones y archivos caen en la misma sentencia).
CREATE TABLE app.publication_assets (
  organization_id uuid NOT NULL,
  project_id      uuid NOT NULL,
  publication_id  uuid NOT NULL,
  asset_id        uuid NOT NULL,
  PRIMARY KEY (organization_id, project_id, publication_id, asset_id),
  FOREIGN KEY (organization_id, project_id, publication_id) REFERENCES app.publications (organization_id, project_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, project_id, asset_id) REFERENCES app.assets (organization_id, project_id, id)
);
CREATE INDEX publication_assets_asset_idx ON app.publication_assets (organization_id, project_id, asset_id);
CREATE TRIGGER publication_assets_guard BEFORE INSERT OR UPDATE OR DELETE ON app.publication_assets
  FOR EACH ROW EXECUTE FUNCTION app.guard_permission('publishMain');

-- Limpieza (la ejecuta la plataforma con un trabajo programado, NO la API):
--   1. llama a app.find_orphan_assets(): devuelve lo que ya no usa nadie;
--   2. borra esos archivos en ImageKit (por fileId, o por ruta si la subida nunca se completó);
--   3. borra las filas (DELETE FROM app.assets WHERE id = ANY(…)); el disparador devuelve la cuota.
-- Huérfano = subida sin completar (>1 día), o archivo listo sin ningún uso tras el periodo de gracia:
-- ni medio, ni portada, ni publicación, ni mención `asset:<id>` dentro de un componente o sección.
CREATE FUNCTION app.find_orphan_assets(p_grace interval DEFAULT interval '7 days')
RETURNS TABLE (asset_id uuid, organization_id uuid, imagekit_file_id text, imagekit_path text)
LANGUAGE sql STABLE AS
$$
  SELECT a.id, a.organization_id, a.imagekit_file_id, a.imagekit_path
  FROM app.assets a
  WHERE (a.status <> 'ready' AND a.created_at < now() - interval '1 day')
     OR (a.status = 'ready' AND a.created_at < now() - p_grace
         AND NOT EXISTS (SELECT 1 FROM app.media_items m WHERE m.organization_id = a.organization_id AND m.project_id = a.project_id
                           AND (m.asset_id = a.id OR m.poster_asset_id = a.id))
         AND NOT EXISTS (SELECT 1 FROM app.publication_assets p WHERE p.organization_id = a.organization_id AND p.project_id = a.project_id AND p.asset_id = a.id)
         AND NOT EXISTS (SELECT 1 FROM app.components c WHERE c.organization_id = a.organization_id AND c.project_id = a.project_id
                           AND c.elements::text LIKE '%asset:' || a.id::text || '%')
         AND NOT EXISTS (SELECT 1 FROM app.blocks b WHERE b.organization_id = a.organization_id AND b.project_id = a.project_id
                           AND b.format::text LIKE '%asset:' || a.id::text || '%'))
$$;
REVOKE ALL ON FUNCTION app.find_orphan_assets(interval) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.find_orphan_assets(interval) TO portal_platform;

SELECT app.apply_rls();
SELECT app.apply_grants();
