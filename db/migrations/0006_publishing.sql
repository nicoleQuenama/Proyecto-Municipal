-- 0006 · Publicación, dominios y despliegue.
--
-- Camino caliente del producto: el visitante pide una URL pública (/ver). Esa lectura NO debe tocar las tablas
-- de edición ni hacer joins: se resuelve con dos búsquedas por índice único (dominio → publicación en línea)
-- y se sirve desde una foto ya armada (snapshot). Ver app.resolve_public_site() en 0008 y la capa de caché
-- recomendada en db/README.md.

-- Publicación: foto INMUTABLE del sitio publicado. Proyecto 1 ── N publicaciones.
-- Volver a una versión anterior = apuntar projects.live_publication_id a otra fila (instantáneo, sin copiar nada).
CREATE TABLE app.publications (
  id              uuid        PRIMARY KEY DEFAULT app.new_id(),
  organization_id uuid        NOT NULL,
  project_id      uuid        NOT NULL,
  number          int         NOT NULL CHECK (number > 0),
  branch_id       uuid        NOT NULL,
  commit_id       uuid,
  message         text        NOT NULL DEFAULT '',
  -- El sitio ya resuelto (páginas, componentes, reglas, variables, CSS, código) tal como lo ve el visitante.
  snapshot        jsonb       NOT NULL CHECK (jsonb_typeof(snapshot) = 'object'),
  snapshot_sha256 bytea       NOT NULL CHECK (length(snapshot_sha256) = 32),   -- ETag y detección de cambios
  published_by    uuid,
  published_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, project_id, id),
  UNIQUE (organization_id, project_id, number),
  FOREIGN KEY (organization_id, project_id) REFERENCES app.projects (organization_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, project_id, branch_id) REFERENCES app.branches (organization_id, project_id, id),
  FOREIGN KEY (organization_id, project_id, commit_id) REFERENCES app.commits (organization_id, project_id, id),
  FOREIGN KEY (organization_id, published_by) REFERENCES app.users (organization_id, id)
);
CREATE INDEX publications_history_idx ON app.publications (organization_id, project_id, published_at DESC);
CREATE INDEX publications_branch_idx  ON app.publications (organization_id, project_id, branch_id);
CREATE INDEX publications_commit_idx  ON app.publications (organization_id, project_id, commit_id) WHERE commit_id IS NOT NULL;

-- Cierra la referencia circular: el proyecto apunta a SU publicación en línea (la FK incluye project_id,
-- así que no puede apuntar a una publicación de otro proyecto).
ALTER TABLE app.projects
  ADD CONSTRAINT projects_live_publication_fk
  FOREIGN KEY (organization_id, id, live_publication_id)
  REFERENCES app.publications (organization_id, project_id, id)
  ON DELETE SET NULL (live_publication_id);
CREATE INDEX projects_live_publication_idx ON app.projects (organization_id, id, live_publication_id) WHERE live_publication_id IS NOT NULL;

-- Dominios. Proyecto 1 ── N dominios; un nombre de dominio pertenece a UN proyecto en toda la plataforma.
CREATE TABLE app.project_domains (
  id              uuid        PRIMARY KEY DEFAULT app.new_id(),
  organization_id uuid        NOT NULL,
  project_id      uuid        NOT NULL,
  host            app.citext  NOT NULL UNIQUE
                  CHECK (host ~ '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$' AND length(host) <= 253),
  is_primary      boolean     NOT NULL DEFAULT false,
  verification_token text     NOT NULL DEFAULT encode(sha256(uuid_send(gen_random_uuid()) || uuid_send(gen_random_uuid())), 'hex'),
  verified_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (organization_id, project_id) REFERENCES app.projects (organization_id, id) ON DELETE CASCADE
);
CREATE INDEX project_domains_project_idx ON app.project_domains (organization_id, project_id);
CREATE UNIQUE INDEX project_domains_one_primary_key ON app.project_domains (organization_id, project_id) WHERE is_primary;

-- Cuentas externas de la ORGANIZACIÓN (Vercel, FTP, SFTP, cPanel): se configuran una vez y los proyectos las usan.
-- Es lo que es de toda la organización: la cuenta y sus credenciales (token de Vercel y su equipo, servidor y usuario FTP…).
-- Organización 1 ── N integraciones, una por tipo. Solo su superadministrador las cambia (lo hace cumplir un disparador).
-- Los secretos van cifrados por la API y NUNCA vuelven al navegador.
CREATE TABLE app.organization_integrations (
  organization_id uuid        NOT NULL REFERENCES app.organizations (id) ON DELETE CASCADE,
  kind            text        NOT NULL CHECK (kind IN ('vercel', 'ftp', 'sftp', 'cpanel')),
  config          jsonb       NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(config) = 'object'),
  secrets_enc     bytea,
  updated_by      uuid,
  updated_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, kind),
  FOREIGN KEY (organization_id, updated_by) REFERENCES app.users (organization_id, id)
);

-- Destino de despliegue de UN proyecto (Vercel, FTP, SFTP, cPanel). Proyecto 1 ── N destinos, uno por tipo.
-- Lo que es del proyecto: el nombre del proyecto en Vercel, la carpeta de destino, el dominio… (`config`).
-- Las credenciales salen de la integración de la organización; `secrets_enc` solo existe si el proyecto usa unas propias.
-- Los secretos (token, contraseña) van cifrados por la API y NUNCA vuelven al navegador.
CREATE TABLE app.deploy_targets (
  id              uuid        PRIMARY KEY DEFAULT app.new_id(),
  organization_id uuid        NOT NULL,
  project_id      uuid        NOT NULL,
  kind            text        NOT NULL CHECK (kind IN ('vercel', 'ftp', 'sftp', 'cpanel')),
  config          jsonb       NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(config) = 'object'),
  secrets_enc     bytea,
  created_by      uuid,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  row_version     int         NOT NULL DEFAULT 1,
  UNIQUE (organization_id, project_id, id),
  UNIQUE (organization_id, project_id, kind),
  FOREIGN KEY (organization_id, project_id) REFERENCES app.projects (organization_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, created_by) REFERENCES app.users (organization_id, id)
);

-- Cada ejecución de un despliegue. Publicación 1 ── N despliegues; Destino 1 ── N despliegues.
CREATE TABLE app.deployments (
  id              uuid        PRIMARY KEY DEFAULT app.new_id(),
  organization_id uuid        NOT NULL,
  project_id      uuid        NOT NULL,
  publication_id  uuid        NOT NULL,
  target_id       uuid,
  status          text        NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'succeeded', 'failed')),
  triggered_by    uuid,
  error           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  started_at      timestamptz,
  finished_at     timestamptz,
  FOREIGN KEY (organization_id, project_id, publication_id) REFERENCES app.publications (organization_id, project_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, project_id, target_id) REFERENCES app.deploy_targets (organization_id, project_id, id) ON DELETE SET NULL (target_id),
  FOREIGN KEY (organization_id, triggered_by) REFERENCES app.users (organization_id, id),
  CHECK (finished_at IS NULL OR started_at IS NOT NULL),
  CHECK ((status IN ('succeeded', 'failed')) = (finished_at IS NOT NULL))
);
CREATE INDEX deployments_publication_idx ON app.deployments (organization_id, project_id, publication_id, created_at DESC);
CREATE INDEX deployments_target_idx      ON app.deployments (organization_id, project_id, target_id) WHERE target_id IS NOT NULL;
CREATE INDEX deployments_active_idx      ON app.deployments (status, created_at) WHERE status IN ('queued', 'running');
