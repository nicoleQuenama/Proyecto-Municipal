-- 0015 · Trabajo en ramas: hasta qué edición llega cada versión.
--
-- Una rama que no es main no tiene filas propias: su estado es la FOTO de su última versión más las operaciones de edición
-- (`edit_operations`, 0013) guardadas después. Cada versión recuerda hasta qué operación incluye (`ops_through`): al abrir
-- la rama solo se reaplican las posteriores. En main (cuyo estado son las tablas de contenido) vale siempre 0.
ALTER TABLE app.commits ADD COLUMN ops_through bigint NOT NULL DEFAULT 0 CHECK (ops_through >= 0);

SELECT app.apply_rls();
SELECT app.apply_grants();
