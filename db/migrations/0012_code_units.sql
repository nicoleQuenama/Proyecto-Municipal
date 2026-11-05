-- 0012 · Código del usuario como OBJETOS (AST), nunca como texto.
--
-- Todo lo que el usuario escribe —TypeScript/JavaScript, CSS, HTML de un bloque de código— se parsea en el
-- navegador/API y se guarda como árbol: estilo Babel (ESTree en JSON) para TS/JS, postcss para CSS, parse5 para HTML.
-- En la base de datos NO existe ninguna columna con código fuente. Qué gana esto:
--   · seguridad: el árbol se valida contra una lista blanca de nodos ANTES de guardarse (sin eval, Function,
--     document.cookie, import dinámico…). Texto sin validar nunca se ejecuta;
--   · el editor reimprime el código desde el árbol (Babel generator) al abrirlo en Monaco, y lo parsea al guardar;
--   · se puede transformar, buscar y migrar con herramientas de AST, no con expresiones regulares.
-- Coste asumido: al reimprimir se normaliza el formato (como Prettier al guardar); se conservan los comentarios
-- (en `comments` del nodo File) pero no los espacios. Los AST ocupan ~10× el texto: se guardan sin loc/start/end/tokens.
-- El CSS (postcss) conserva además su espacio en blanco en `raws`: vuelve idéntico.
--
-- Cada unidad de código pertenece a EXACTAMENTE un dueño (o al proyecto, si no tiene ninguno) y a una ranura
-- con nombre dentro de él; muere con su dueño (ON DELETE CASCADE) y hereda el aislamiento por organización.
--   proyecto ── css global            slot «global.css»
--   página   ── css / js              slots «css», «js»
--   función  ── cuerpo                slot «body»
--   API      ── transformación        slot «transform»
--   bloque   ── css propio, comportamientos, bloque de código   slots «custom.<clave>.css», «behavior.<id>.js», «code.html» …
--   componente ── css propio          slot «custom.<clave>.css»
CREATE TABLE app.code_units (
  id                  uuid        PRIMARY KEY DEFAULT app.new_id(),
  organization_id     uuid        NOT NULL,
  project_id          uuid        NOT NULL,
  page_id             text,
  block_id            text,
  component_id        text,
  shared_function_id  text,
  data_source_id      text,
  slot                text        NOT NULL CHECK (slot ~ '^[A-Za-z0-9_$.:-]{1,120}$'),
  language            text        NOT NULL CHECK (language IN ('typescript', 'css', 'html')),
  -- Quién generó el árbol y con qué versión: el formato de un AST cambia entre versiones del analizador.
  parser              text        NOT NULL CHECK (parser IN ('babel', 'postcss', 'parse5')),
  parser_version      text        NOT NULL CHECK (parser_version ~ '^[0-9]+\.[0-9]+(\.[0-9]+)?([-+][0-9A-Za-z.-]+)?$'),
  ast                 jsonb       NOT NULL,
  -- SHA-256 del árbol canónico (lo calcula la API): detecta cambios reales y deduplica en las fotos de versión.
  ast_sha256          bytea       NOT NULL CHECK (length(ast_sha256) = 32),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  row_version         int         NOT NULL DEFAULT 1,
  UNIQUE (organization_id, project_id, id),
  FOREIGN KEY (organization_id, project_id)                     REFERENCES app.projects (organization_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, project_id, page_id)            REFERENCES app.pages (organization_id, project_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, project_id, block_id)           REFERENCES app.blocks (organization_id, project_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, project_id, component_id)       REFERENCES app.components (organization_id, project_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, project_id, shared_function_id) REFERENCES app.shared_functions (organization_id, project_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, project_id, data_source_id)     REFERENCES app.data_sources (organization_id, project_id, id) ON DELETE CASCADE,
  CHECK (num_nonnulls(page_id, block_id, component_id, shared_function_id, data_source_id) <= 1),
  -- El lenguaje decide el analizador y la forma de la raíz: no se puede guardar «texto» disfrazado de árbol.
  CHECK (CASE language
    WHEN 'typescript' THEN parser = 'babel'   AND ast ->> 'type' = 'File' AND jsonb_typeof(ast -> 'program') = 'object'
    WHEN 'css'        THEN parser = 'postcss' AND ast ->> 'type' = 'root' AND jsonb_typeof(ast -> 'nodes') = 'array'
    WHEN 'html'       THEN parser = 'parse5'  AND ast ->> 'nodeName' IN ('#document', '#document-fragment') AND jsonb_typeof(ast -> 'childNodes') = 'array'
  END),
  -- Sin posiciones ni tokens (inflan 5-10× y se regeneran): tampoco la lista de tokens, que es el texto otra vez.
  CHECK (NOT (ast ? 'tokens') AND NOT (ast ? 'loc')),
  CHECK (pg_column_size(ast) <= 4194304)
);
-- Una ranura por dueño. NULLS NOT DISTINCT: dos unidades «css» del mismo proyecto sin dueño también chocan.
CREATE UNIQUE INDEX code_units_slot_key ON app.code_units (organization_id, project_id, page_id, block_id, component_id, shared_function_id, data_source_id, slot) NULLS NOT DISTINCT;
CREATE INDEX code_units_page_idx     ON app.code_units (organization_id, project_id, page_id)           WHERE page_id IS NOT NULL;
CREATE INDEX code_units_block_idx    ON app.code_units (organization_id, project_id, block_id)          WHERE block_id IS NOT NULL;
CREATE INDEX code_units_component_idx ON app.code_units (organization_id, project_id, component_id)    WHERE component_id IS NOT NULL;
CREATE INDEX code_units_function_idx ON app.code_units (organization_id, project_id, shared_function_id) WHERE shared_function_id IS NOT NULL;
CREATE INDEX code_units_source_idx   ON app.code_units (organization_id, project_id, data_source_id)   WHERE data_source_id IS NOT NULL;

CREATE TRIGGER code_units_touch BEFORE UPDATE ON app.code_units FOR EACH ROW EXECUTE FUNCTION app.touch();

-- Permisos: JS/TS/HTML exigen `editCode`; CSS exige `editStyles`. Si el dueño es una sección o una página, además
-- se exige tener esa sección/página en el alcance (igual que para editar su contenido).
CREATE FUNCTION app.guard_code_unit() RETURNS trigger
LANGUAGE plpgsql AS
$$
BEGIN
  IF TG_OP <> 'INSERT' THEN PERFORM app.check_code_unit(OLD); END IF;
  IF TG_OP <> 'DELETE' THEN PERFORM app.check_code_unit(NEW); END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END
$$;

CREATE FUNCTION app.check_code_unit(u app.code_units) RETURNS void
LANGUAGE plpgsql AS
$$
DECLARE v_page text := u.page_id;
BEGIN
  IF NOT app.has_permission(u.project_id, CASE WHEN u.language = 'css' THEN 'editStyles' ELSE 'editCode' END) THEN
    PERFORM app.deny(CASE WHEN u.language = 'css' THEN 'editStyles' ELSE 'editCode' END);
  END IF;
  IF u.block_id IS NOT NULL THEN
    SELECT b.page_id INTO v_page FROM app.blocks b
    WHERE b.organization_id = u.organization_id AND b.project_id = u.project_id AND b.id = u.block_id;
  END IF;
  IF (u.page_id IS NOT NULL OR u.block_id IS NOT NULL) AND NOT app.can_edit_content(u.project_id, v_page, u.block_id) THEN
    PERFORM app.deny('editar el código de esta página o sección');
  END IF;
END
$$;
CREATE TRIGGER code_units_guard BEFORE INSERT OR UPDATE OR DELETE ON app.code_units
  FOR EACH ROW EXECUTE FUNCTION app.guard_code_unit();
CREATE TRIGGER code_units_main_guard BEFORE INSERT OR UPDATE OR DELETE ON app.code_units
  FOR EACH ROW EXECUTE FUNCTION app.guard_permission('publishMain');

SELECT app.apply_rls();
SELECT app.apply_grants();
