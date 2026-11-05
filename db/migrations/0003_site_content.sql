-- 0003 · Contenido del sitio.
--
-- Decisión de modelado (híbrido): el ESQUELETO es relacional (páginas, bloques, componentes, variables, reglas)
-- porque ahí hay identidad, orden, permisos y borrados en cascada que la base de datos debe garantizar;
-- las HOJAS son jsonb (los elementos de un componente, el formato propio de un bloque) porque son
-- documentos que el editor siempre lee y escribe enteros y cuya forma evoluciona con el CMS.
-- Convención: toda tabla del proyecto lleva (organization_id, project_id) y sus índices empiezan por ellos.

-- Biblioteca de medios del proyecto (imágenes y videos, «estilo Canva»), alojados en ImageKit.
-- ImageKit guarda el original y genera cualquier tamaño o formato por URL (…?tr=w-640,f-auto): aquí no hay
-- miniaturas ni versiones, solo la ficha. Proyecto 1 ── N archivos. Flujo:
--   1. la API crea la ficha «pending» (reserva la cuota) y firma los parámetros de subida de ImageKit;
--   2. el navegador sube DIRECTO a ImageKit (el archivo no pasa por la API: no ocupa memoria ni tiempo);
--   3. la API consulta el archivo en ImageKit, verifica su tamaño y guarda su fileId → «ready».
-- La URL pública no se guarda: es el «URL endpoint» configurado + imagekit_path (cambiar de dominio no migra datos).
CREATE TABLE app.assets (
  id              uuid        PRIMARY KEY DEFAULT app.new_id(),
  organization_id uuid        NOT NULL,
  project_id      uuid        NOT NULL,
  kind            text        NOT NULL CHECK (kind IN ('image', 'video')),
  status          text        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ready', 'failed')),
  name            text        NOT NULL CHECK (length(name) BETWEEN 1 AND 255),
  tags            text[]      NOT NULL DEFAULT '{}' CHECK (cardinality(tags) <= 20),
  -- Siempre bajo la carpeta de SU organización en ImageKit: la ficha no puede apuntar al archivo de otra.
  imagekit_path   text        NOT NULL UNIQUE CHECK (imagekit_path LIKE '/org/' || organization_id::text || '/%'),
  -- Lo entrega ImageKit al terminar la subida; sirve para consultarlo y borrarlo por su API.
  imagekit_file_id text       UNIQUE,
  -- Lista cerrada. SVG puede llevar scripts: sanear al subir o servir con CSP restrictiva.
  content_type    text        NOT NULL CHECK (content_type IN (
                    'image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif', 'image/svg+xml',
                    'video/mp4', 'video/webm')),
  byte_size       bigint      NOT NULL CHECK (byte_size BETWEEN 1 AND 536870912),     -- máx. 512 MB
  sha256          bytea       NOT NULL CHECK (length(sha256) = 32),
  width           int         CHECK (width > 0),
  height          int         CHECK (height > 0),
  duration_ms     int         CHECK (duration_ms > 0),
  created_by      uuid,
  created_at      timestamptz NOT NULL DEFAULT now(),
  ready_at        timestamptz,
  deleted_at      timestamptz,
  UNIQUE (organization_id, project_id, id),
  FOREIGN KEY (organization_id, project_id) REFERENCES app.projects (organization_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, created_by) REFERENCES app.users (organization_id, id),
  CHECK ((status = 'ready') = (imagekit_file_id IS NOT NULL)),
  CHECK ((status = 'ready') = (ready_at IS NOT NULL)),
  CHECK (kind = CASE WHEN content_type LIKE 'image/%' THEN 'image' ELSE 'video' END)
);
-- El mismo contenido no se sube dos veces al mismo proyecto: la API pregunta por el hash ANTES de subir.
CREATE UNIQUE INDEX assets_content_key ON app.assets (organization_id, project_id, sha256)
  WHERE deleted_at IS NULL AND status <> 'failed';
CREATE INDEX assets_cleanup_idx ON app.assets (created_at) WHERE status <> 'ready' OR deleted_at IS NOT NULL;

-- Página: Proyecto 1 ── N páginas. Se borra de verdad: sus bloques, medios, reglas y variables caen en cascada
-- (es lo que hace hoy el reducer con withoutScope).
CREATE TABLE app.pages (
  id              text        NOT NULL DEFAULT app.new_id()::text CHECK (length(id) BETWEEN 1 AND 100),
  organization_id uuid        NOT NULL,
  project_id      uuid        NOT NULL,
  name            app.citext  NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 120),
  slug            app.citext  NOT NULL CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  is_home         boolean     NOT NULL DEFAULT false,
  -- Páginas con función especial (pantalla de carga, 404); NULL = página normal.
  role            text        CHECK (role IN ('loading', 'not-found', 'skeleton')),
  position        int         NOT NULL CHECK (position >= 0),
  hidden          boolean     NOT NULL DEFAULT false,
  -- Ruta dinámica "/pokemon/:id"; NULL = la ruta sale del slug.
  route           text        CHECK (route ~ '^/'),
  title           jsonb       NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(title) = 'object'),
  -- Fondo, color, márgenes, colocación del titular, parámetros de vista previa… (el CSS/JS de la página: code_units)
  settings        jsonb       NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(settings) = 'object'),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  row_version     int         NOT NULL DEFAULT 1,
  PRIMARY KEY (organization_id, project_id, id),
  UNIQUE (organization_id, project_id, slug),
  -- Reordenar páginas = varios UPDATE en una transacción; el índice se comprueba al final.
  UNIQUE (organization_id, project_id, position) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (organization_id, project_id) REFERENCES app.projects (organization_id, id) ON DELETE CASCADE,
  CHECK (NOT (is_home AND role IS NOT NULL))
);
-- Exactamente una página de inicio por proyecto.
CREATE UNIQUE INDEX pages_one_home_key ON app.pages (organization_id, project_id) WHERE is_home;

-- Componente propio (plantilla reutilizable). Los de fábrica viven en el código, no aquí.
-- Proyecto 1 ── N componentes.
CREATE TABLE app.components (
  id              text        NOT NULL DEFAULT app.new_id()::text CHECK (length(id) BETWEEN 1 AND 100),
  organization_id uuid        NOT NULL,
  project_id      uuid        NOT NULL,
  name            app.citext  NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 120),
  description     text        NOT NULL DEFAULT '',
  category        text        NOT NULL,
  width           int         NOT NULL CHECK (width BETWEEN 1 AND 10000),
  height          int         NOT NULL CHECK (height BETWEEN 1 AND 10000),
  -- false = componente de fábrica (no se edita en el constructor, solo se duplica); drawn = figura dibujada en la página.
  custom          boolean     NOT NULL DEFAULT true,
  drawn           boolean     NOT NULL DEFAULT false,
  elements        jsonb       NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(elements) = 'array'),
  -- Enlaces por id de elemento: { "<elemento>": { kind: "page", pageId } | { kind: "external", url } }
  links           jsonb       NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(links) = 'object'),
  styles          jsonb       NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(styles) = 'object'),
  settings        jsonb       NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(settings) = 'object'),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  row_version     int         NOT NULL DEFAULT 1,
  position        int         NOT NULL DEFAULT 0 CHECK (position >= 0),
  PRIMARY KEY (organization_id, project_id, id),
  UNIQUE (organization_id, project_id, name),
  FOREIGN KEY (organization_id, project_id) REFERENCES app.projects (organization_id, id) ON DELETE CASCADE
);

-- Bloque: una sección colocada en una página. Página 1 ── N bloques; Componente 1 ── N bloques.
-- Apunta a su componente (de fábrica o propio: ambos son filas de components).
-- Borrar un componente borra sus bloques (regla actual de "component/delete").
CREATE TABLE app.blocks (
  id              text        NOT NULL DEFAULT app.new_id()::text CHECK (length(id) BETWEEN 1 AND 100),
  organization_id uuid        NOT NULL,
  project_id      uuid        NOT NULL,
  page_id         text        NOT NULL,
  component_id    text        NOT NULL,
  position        int         NOT NULL CHECK (position >= 0),
  hidden          boolean     NOT NULL DEFAULT false,
  locked          boolean     NOT NULL DEFAULT false,
  -- Encabezado / cuerpo / pie y «solo esta página» / «todo el sitio». NULL = lo que decida la regla por defecto
  -- (un encabezado o pie sin ámbito de la página de inicio se muestra en todo el sitio).
  slot            text        CHECK (slot IN ('header', 'body', 'footer')),
  scope           text        CHECK (scope IN ('page', 'global')),
  -- Formato propio: overrides de elementos, CSS propio, interacciones, enlaces de datos, repetición, caja, colocación…
  format          jsonb       NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(format) = 'object'),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  row_version     int         NOT NULL DEFAULT 1,
  PRIMARY KEY (organization_id, project_id, id),
  -- Sirve a la vez de índice de la FK a la página y de orden dentro de ella.
  UNIQUE (organization_id, project_id, page_id, position) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (organization_id, project_id, page_id)      REFERENCES app.pages (organization_id, project_id, id)      ON DELETE CASCADE,
  FOREIGN KEY (organization_id, project_id, component_id) REFERENCES app.components (organization_id, project_id, id) ON DELETE CASCADE
);
CREATE INDEX blocks_component_idx ON app.blocks (organization_id, project_id, component_id);

-- Animaciones grabadas en una página (galería «Animar»). Página 1 ── N animaciones; Animación 1 ── N pasos.
-- Cada paso apunta a la sección que anima: al borrar la sección, sus pasos desaparecen solos
-- (hoy lo hace a mano removal-cleanup.ts). Las interacciones que las reproducen viven en blocks.format.
CREATE TABLE app.animations (
  id              text        NOT NULL DEFAULT app.new_id()::text CHECK (length(id) BETWEEN 1 AND 100),
  organization_id uuid        NOT NULL,
  project_id      uuid        NOT NULL,
  page_id         text        NOT NULL,
  name            text        NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 120),
  position        int         NOT NULL CHECK (position >= 0),
  PRIMARY KEY (organization_id, project_id, id),
  UNIQUE (organization_id, project_id, page_id, position) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (organization_id, project_id, page_id) REFERENCES app.pages (organization_id, project_id, id) ON DELETE CASCADE
);

-- Un paso: una propiedad pasa de `from` a `to`, empieza `start_ms` después del inicio y dura `duration_ms`.
-- El destino es un elemento de la sección (key = su id) o la sección entera (key = '$section').
CREATE TABLE app.animation_steps (
  organization_id uuid        NOT NULL,
  project_id      uuid        NOT NULL,
  animation_id    text        NOT NULL,
  id              text        NOT NULL DEFAULT app.new_id()::text CHECK (length(id) BETWEEN 1 AND 100),
  block_id        text        NOT NULL,
  key             text        NOT NULL CHECK (key = '$section' OR length(key) BETWEEN 1 AND 80),
  prop            text        NOT NULL CHECK (prop IN ('x', 'y', 'width', 'height', 'fill', 'color', 'fontSize', 'radius',
                    'opacity', 'scale', 'rotate', 'move', 'blur', 'reveal', 'glow', 'flip', 'tilt')),
  -- Número o texto (un color): jsonb conserva el tipo tal como lo grabó el editor.
  from_value      jsonb       NOT NULL CHECK (jsonb_typeof(from_value) IN ('number', 'string')),
  to_value        jsonb       NOT NULL CHECK (jsonb_typeof(to_value) IN ('number', 'string')),
  start_ms        int         NOT NULL CHECK (start_ms >= 0),
  duration_ms     int         NOT NULL CHECK (duration_ms > 0),
  easing          text,
  iterations      int         CHECK (iterations >= 0),                    -- 0 = sin fin; NULL = una vez
  direction       text        CHECK (direction IN ('normal', 'alternate')),
  position        int         NOT NULL CHECK (position >= 0),
  PRIMARY KEY (organization_id, project_id, animation_id, id),
  UNIQUE (organization_id, project_id, animation_id, position) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (organization_id, project_id, animation_id) REFERENCES app.animations (organization_id, project_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, project_id, block_id)     REFERENCES app.blocks (organization_id, project_id, id) ON DELETE CASCADE
);
CREATE INDEX animation_steps_block_idx ON app.animation_steps (organization_id, project_id, block_id);

-- Imagen o video suelto de una página. Página 1 ── N medios; Archivo 1 ── N medios.
CREATE TABLE app.media_items (
  id              text        NOT NULL DEFAULT app.new_id()::text CHECK (length(id) BETWEEN 1 AND 100),
  organization_id uuid        NOT NULL,
  project_id      uuid        NOT NULL,
  page_id         text        NOT NULL,
  position        int         NOT NULL CHECK (position >= 0),
  kind            text        NOT NULL CHECK (kind IN ('image', 'video')),
  src             text        NOT NULL CHECK (length(btrim(src)) > 0),
  embed           boolean     NOT NULL DEFAULT false,
  asset_id        uuid,
  poster          text,
  poster_asset_id uuid,
  alt             text,
  hidden          boolean     NOT NULL DEFAULT false,
  placement       jsonb       CHECK (jsonb_typeof(placement) = 'object'),
  -- El resto de lo que describe al medio (proveedor, si es un archivo local…).
  settings        jsonb       NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(settings) = 'object'),
  PRIMARY KEY (organization_id, project_id, id),
  UNIQUE (organization_id, project_id, page_id, position) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (organization_id, project_id, page_id) REFERENCES app.pages (organization_id, project_id, id) ON DELETE CASCADE,
  -- Si se borra el archivo, el medio sobrevive con su URL externa (o vacío y la API lo marca roto).
  FOREIGN KEY (organization_id, project_id, asset_id)        REFERENCES app.assets (organization_id, project_id, id) ON DELETE SET NULL (asset_id),
  FOREIGN KEY (organization_id, project_id, poster_asset_id) REFERENCES app.assets (organization_id, project_id, id) ON DELETE SET NULL (poster_asset_id)
);
CREATE INDEX media_items_asset_idx  ON app.media_items (organization_id, project_id, asset_id) WHERE asset_id IS NOT NULL;
CREATE INDEX media_items_poster_idx ON app.media_items (organization_id, project_id, poster_asset_id) WHERE poster_asset_id IS NOT NULL;

-- Variables CSS. Ámbito: global (todo el proyecto), de página o de componente; cae con su ámbito.
CREATE TABLE app.style_variables (
  id              text        NOT NULL DEFAULT app.new_id()::text CHECK (length(id) BETWEEN 1 AND 100),
  organization_id uuid        NOT NULL,
  project_id      uuid        NOT NULL,
  scope           text        NOT NULL CHECK (scope IN ('global', 'page', 'component')),
  page_id         text,
  component_id    text,
  name            text        NOT NULL CHECK (name ~ '^[a-z][a-z0-9-]*$'),
  kind            text        NOT NULL CHECK (kind IN ('color', 'size', 'font')),
  value           text        NOT NULL,
  -- El ámbito y sus referencias deben coincidir: ni páginas en un ámbito global, ni ámbitos huérfanos.
  position        int         NOT NULL DEFAULT 0 CHECK (position >= 0),
  CHECK ((scope = 'global'    AND page_id IS NULL     AND component_id IS NULL)
      OR (scope = 'page'      AND page_id IS NOT NULL AND component_id IS NULL)
      OR (scope = 'component' AND page_id IS NULL     AND component_id IS NOT NULL)),
  -- Mismo nombre solo una vez por ámbito (NULLS NOT DISTINCT: dos globales con el mismo nombre chocan).
  PRIMARY KEY (organization_id, project_id, id),
  UNIQUE NULLS NOT DISTINCT (organization_id, project_id, scope, page_id, component_id, name),
  FOREIGN KEY (organization_id, project_id, page_id)      REFERENCES app.pages (organization_id, project_id, id)      ON DELETE CASCADE,
  FOREIGN KEY (organization_id, project_id, component_id) REFERENCES app.components (organization_id, project_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, project_id) REFERENCES app.projects (organization_id, id) ON DELETE CASCADE
);
CREATE INDEX style_variables_page_idx      ON app.style_variables (organization_id, project_id, page_id) WHERE page_id IS NOT NULL;
CREATE INDEX style_variables_component_idx ON app.style_variables (organization_id, project_id, component_id) WHERE component_id IS NOT NULL;

-- Reglas de estilo por ámbito y objetivo (rol de elemento, bloque, página). props: { propiedad: valor }.
CREATE TABLE app.style_rules (
  id              uuid        PRIMARY KEY DEFAULT app.new_id(),
  organization_id uuid        NOT NULL,
  project_id      uuid        NOT NULL,
  scope           text        NOT NULL CHECK (scope IN ('global', 'page', 'component')),
  page_id         text,
  component_id    text,
  target          text        NOT NULL CHECK (length(target) BETWEEN 1 AND 40),
  props           jsonb       NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(props) = 'object'),
  position        int         NOT NULL DEFAULT 0 CHECK (position >= 0),
  CHECK ((scope = 'global'    AND page_id IS NULL     AND component_id IS NULL)
      OR (scope = 'page'      AND page_id IS NOT NULL AND component_id IS NULL)
      OR (scope = 'component' AND page_id IS NULL     AND component_id IS NOT NULL)),
  UNIQUE NULLS NOT DISTINCT (organization_id, project_id, scope, page_id, component_id, target),
  FOREIGN KEY (organization_id, project_id, page_id)      REFERENCES app.pages (organization_id, project_id, id)      ON DELETE CASCADE,
  FOREIGN KEY (organization_id, project_id, component_id) REFERENCES app.components (organization_id, project_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, project_id) REFERENCES app.projects (organization_id, id) ON DELETE CASCADE
);
CREATE INDEX style_rules_page_idx      ON app.style_rules (organization_id, project_id, page_id) WHERE page_id IS NOT NULL;
CREATE INDEX style_rules_component_idx ON app.style_rules (organization_id, project_id, component_id) WHERE component_id IS NOT NULL;

-- Funciones reutilizables del código del usuario. Proyecto 1 ── N funciones.
-- Dónde valen: todo el proyecto, una sección o un elemento. Las de una sección caen con ella (FK en cascada).
-- El cuerpo es código: vive como AST en code_units (slot «body»).
CREATE TABLE app.shared_functions (
  id              text        NOT NULL DEFAULT app.new_id()::text CHECK (length(id) BETWEEN 1 AND 100),
  organization_id uuid        NOT NULL,
  project_id      uuid        NOT NULL,
  name            text        NOT NULL CHECK (name ~ '^[A-Za-z_$][A-Za-z0-9_$]*$'),
  scope_kind      text        NOT NULL DEFAULT 'global' CHECK (scope_kind IN ('global', 'block', 'element')),
  block_id        text,
  element_id      text        CHECK (length(element_id) BETWEEN 1 AND 80),
  position        int         NOT NULL DEFAULT 0 CHECK (position >= 0),
  CHECK ((scope_kind = 'global'  AND block_id IS NULL     AND element_id IS NULL)
      OR (scope_kind = 'block'   AND block_id IS NOT NULL AND element_id IS NULL)
      OR (scope_kind = 'element' AND block_id IS NOT NULL AND element_id IS NOT NULL)),
  PRIMARY KEY (organization_id, project_id, id),
  UNIQUE NULLS NOT DISTINCT (organization_id, project_id, scope_kind, block_id, element_id, name),
  FOREIGN KEY (organization_id, project_id) REFERENCES app.projects (organization_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, project_id, block_id) REFERENCES app.blocks (organization_id, project_id, id) ON DELETE CASCADE
);
CREATE INDEX shared_functions_block_idx ON app.shared_functions (organization_id, project_id, block_id) WHERE block_id IS NOT NULL;

-- Librerías instaladas en el proyecto (reemplaza portal-libraries.json). Proyecto 1 ── N librerías.
CREATE TABLE app.project_libraries (
  id              text        NOT NULL DEFAULT app.new_id()::text CHECK (length(id) BETWEEN 1 AND 100),
  organization_id uuid        NOT NULL,
  project_id      uuid        NOT NULL,
  name            text        NOT NULL CHECK (length(name) BETWEEN 1 AND 214),
  version         text        NOT NULL,
  source          text        NOT NULL CHECK (source IN ('cdn', 'pnpm')),
  installed_at    timestamptz NOT NULL DEFAULT now(),
  position        int         NOT NULL DEFAULT 0 CHECK (position >= 0),
  PRIMARY KEY (organization_id, project_id, id),
  UNIQUE (organization_id, project_id, name),
  FOREIGN KEY (organization_id, project_id) REFERENCES app.projects (organization_id, id) ON DELETE CASCADE
);

-- Comentarios sobre el diseño, anclados a un punto de una página. Página 1 ── N comentarios.
-- "private" solo lo ve su autor; lo hace cumplir la política RLS de 0008, no solo la API.
CREATE TABLE app.design_comments (
  id              text        NOT NULL DEFAULT app.new_id()::text CHECK (length(id) BETWEEN 1 AND 100),
  organization_id uuid        NOT NULL,
  project_id      uuid        NOT NULL,
  page_id         text        NOT NULL,
  author_id       uuid        NOT NULL,
  x               numeric(9,2) NOT NULL,
  y               numeric(9,2) NOT NULL,
  body            text        NOT NULL CHECK (length(btrim(body)) BETWEEN 1 AND 2000),
  audience        text        NOT NULL DEFAULT 'team' CHECK (audience IN ('team', 'private')),
  resolved        boolean     NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  position        int         NOT NULL DEFAULT 0 CHECK (position >= 0),
  PRIMARY KEY (organization_id, project_id, id),
  FOREIGN KEY (organization_id, project_id, page_id) REFERENCES app.pages (organization_id, project_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, author_id) REFERENCES app.users (organization_id, id)
);
CREATE INDEX design_comments_page_idx ON app.design_comments (organization_id, project_id, page_id, created_at);

-- Alcance de una cuenta con acceso limitado (solo aplica si project_members.scope_limited).
-- Miembro N ── M Página, y Miembro N ── M Bloque: la FK garantiza que no se asigne algo de otro proyecto
-- y que, al borrar la página o el bloque, el permiso desaparezca solo.
CREATE TABLE app.member_scope_pages (
  organization_id uuid NOT NULL,
  project_id      uuid NOT NULL,
  user_id         uuid NOT NULL,
  page_id         text NOT NULL,
  PRIMARY KEY (organization_id, project_id, user_id, page_id),
  FOREIGN KEY (organization_id, project_id, user_id) REFERENCES app.project_members (organization_id, project_id, user_id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, project_id, page_id) REFERENCES app.pages (organization_id, project_id, id) ON DELETE CASCADE
);
CREATE INDEX member_scope_pages_page_idx ON app.member_scope_pages (organization_id, project_id, page_id);

CREATE TABLE app.member_scope_blocks (
  organization_id uuid NOT NULL,
  project_id      uuid NOT NULL,
  user_id         uuid NOT NULL,
  block_id        text NOT NULL,
  PRIMARY KEY (organization_id, project_id, user_id, block_id),
  FOREIGN KEY (organization_id, project_id, user_id)  REFERENCES app.project_members (organization_id, project_id, user_id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, project_id, block_id) REFERENCES app.blocks (organization_id, project_id, id) ON DELETE CASCADE
);
CREATE INDEX member_scope_blocks_block_idx ON app.member_scope_blocks (organization_id, project_id, block_id);
