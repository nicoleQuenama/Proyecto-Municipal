-- 0005 · Control de versiones (ramas, versiones, pull requests, issues).
--
-- Modelo tipo git: cada versión (commit) apunta a una FOTO COMPLETA del sitio (site_snapshots), a su versión padre
-- (y a una segunda si es una fusión) y la rama avanza su «cabeza». Con eso se puede restaurar cualquier versión,
-- comparar dos puntos cualquiera, fusionar con ancestro común y detectar dos guardados simultáneos.
-- commit_changes (nodo/propiedad antes→después) queda como el diff legible, derivable de las fotos.
-- Las pull requests se enlazan a las versiones que contienen en vez de duplicar sus cambios.

-- Foto completa del sitio (páginas, bloques, componentes, estilos, funciones y el código como AST) en un instante.
-- Direccionada por contenido: guardar dos veces el mismo estado no duplica nada, y una restauración reutiliza la foto.
-- Inmutable. Proyecto 1 ── N fotos; Foto 1 ── N versiones.
CREATE TABLE app.site_snapshots (
  id              uuid        PRIMARY KEY DEFAULT app.new_id(),
  organization_id uuid        NOT NULL,
  project_id      uuid        NOT NULL,
  sha256          bytea       NOT NULL CHECK (length(sha256) = 32),
  document        jsonb       NOT NULL CHECK (jsonb_typeof(document) = 'object'),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, project_id, id),
  UNIQUE (organization_id, project_id, sha256),
  FOREIGN KEY (organization_id, project_id) REFERENCES app.projects (organization_id, id) ON DELETE CASCADE
);

-- Rama. Proyecto 1 ── N ramas; una es la principal (main) y las demás nacen de otra (base_branch_id) y tienen dueño.
-- Como en GitHub: nadie de afuera escribe en main; cada persona trabaja en su rama y la envía como pull request.
-- El diseño de la rama es la foto de su cabeza; «Cambios» compara esa foto con el estado del editor.
CREATE TABLE app.branches (
  id              uuid        PRIMARY KEY DEFAULT app.new_id(),
  organization_id uuid        NOT NULL,
  project_id      uuid        NOT NULL,
  name            app.citext  NOT NULL CHECK (name ~ '^[^[:space:]]{1,100}$'),
  is_main         boolean     NOT NULL DEFAULT false,
  base_branch_id  uuid,
  -- Versión desde la que nació (ancestro común para fusionar) y última versión de la rama. Las FK se añaden
  -- tras crear commits (referencia circular); la cabeza la avanza un disparador, nunca la API a mano.
  fork_commit_id  uuid,
  head_commit_id  uuid,
  owner_id        uuid,
  created_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz,
  UNIQUE (organization_id, project_id, id),
  FOREIGN KEY (organization_id, project_id) REFERENCES app.projects (organization_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, project_id, base_branch_id) REFERENCES app.branches (organization_id, project_id, id),
  FOREIGN KEY (organization_id, owner_id) REFERENCES app.users (organization_id, id),
  -- La principal es la única sin base ni dueño; el resto cuelga de otra rama y es de alguien.
  CHECK (is_main = (base_branch_id IS NULL)),
  CHECK (is_main = (owner_id IS NULL))
);
CREATE UNIQUE INDEX branches_name_key ON app.branches (organization_id, project_id, name) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX branches_one_main_key ON app.branches (organization_id, project_id) WHERE is_main;
CREATE INDEX branches_base_idx ON app.branches (organization_id, project_id, base_branch_id) WHERE base_branch_id IS NOT NULL;

-- Versión (commit): inmutable. Rama 1 ── N versiones; Foto 1 ── N versiones; Versión 1 ── N cambios.
--   kind 'save'    guardado normal
--        'merge'   fusión de pull request (tiene segundo padre)
--        'restore' vuelve a una foto anterior (nunca se reescribe la historia: se añade una versión nueva)
CREATE TABLE app.commits (
  id              uuid        PRIMARY KEY DEFAULT app.new_id(),
  organization_id uuid        NOT NULL,
  project_id      uuid        NOT NULL,
  branch_id       uuid        NOT NULL,
  snapshot_id     uuid        NOT NULL,
  kind            text        NOT NULL DEFAULT 'save' CHECK (kind IN ('save', 'merge', 'restore')),
  parent_commit_id        uuid,
  second_parent_commit_id uuid,
  restored_from_commit_id uuid,
  author_id       uuid,
  message         text        NOT NULL CHECK (length(btrim(message)) BETWEEN 1 AND 500),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, project_id, id),
  FOREIGN KEY (organization_id, project_id, branch_id)   REFERENCES app.branches (organization_id, project_id, id),
  FOREIGN KEY (organization_id, project_id, snapshot_id) REFERENCES app.site_snapshots (organization_id, project_id, id),
  FOREIGN KEY (organization_id, project_id, parent_commit_id)        REFERENCES app.commits (organization_id, project_id, id),
  FOREIGN KEY (organization_id, project_id, second_parent_commit_id) REFERENCES app.commits (organization_id, project_id, id),
  FOREIGN KEY (organization_id, project_id, restored_from_commit_id) REFERENCES app.commits (organization_id, project_id, id),
  FOREIGN KEY (organization_id, author_id) REFERENCES app.users (organization_id, id),
  CHECK ((kind = 'merge') = (second_parent_commit_id IS NOT NULL)),
  CHECK ((kind = 'restore') = (restored_from_commit_id IS NOT NULL)),
  CHECK (parent_commit_id IS DISTINCT FROM id)
);
CREATE INDEX commits_branch_idx   ON app.commits (organization_id, project_id, branch_id, created_at DESC);
CREATE INDEX commits_snapshot_idx ON app.commits (organization_id, project_id, snapshot_id);
CREATE INDEX commits_parent_idx   ON app.commits (organization_id, project_id, parent_commit_id) WHERE parent_commit_id IS NOT NULL;
CREATE INDEX commits_second_parent_idx ON app.commits (organization_id, project_id, second_parent_commit_id) WHERE second_parent_commit_id IS NOT NULL;
CREATE INDEX commits_restored_idx ON app.commits (organization_id, project_id, restored_from_commit_id) WHERE restored_from_commit_id IS NOT NULL;

ALTER TABLE app.branches
  ADD FOREIGN KEY (organization_id, project_id, fork_commit_id) REFERENCES app.commits (organization_id, project_id, id),
  ADD FOREIGN KEY (organization_id, project_id, head_commit_id) REFERENCES app.commits (organization_id, project_id, id);
CREATE INDEX branches_fork_idx ON app.branches (organization_id, project_id, fork_commit_id) WHERE fork_commit_id IS NOT NULL;
CREATE INDEX branches_head_idx ON app.branches (organization_id, project_id, head_commit_id) WHERE head_commit_id IS NOT NULL;

-- Una rama nueva nace en la cabeza de su rama base: ese punto es su ancestro común para fusionar después.
CREATE FUNCTION app.init_branch_head() RETURNS trigger
LANGUAGE plpgsql AS
$$
BEGIN
  IF NEW.base_branch_id IS NOT NULL THEN
    SELECT b.head_commit_id INTO NEW.head_commit_id FROM app.branches b
    WHERE b.organization_id = NEW.organization_id AND b.project_id = NEW.project_id AND b.id = NEW.base_branch_id;
    NEW.fork_commit_id := NEW.head_commit_id;
  END IF;
  RETURN NEW;
END
$$;
CREATE TRIGGER branches_init_head BEFORE INSERT ON app.branches FOR EACH ROW EXECUTE FUNCTION app.init_branch_head();

-- Una versión nueva debe nacer de la cabeza ACTUAL de su rama. Si otra persona guardó antes, falla con
-- serialization_failure (40001) y el cliente rehace el guardado sobre la cabeza nueva: nadie pisa a nadie.
-- Después de insertar, la cabeza avanza. SECURITY DEFINER: quien fusiona una pull request puede no poder editar la rama.
CREATE FUNCTION app.check_commit_parent() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, app, pg_temp AS
$$
DECLARE v_head uuid;
BEGIN
  SELECT b.head_commit_id INTO v_head FROM app.branches b
  WHERE b.organization_id = NEW.organization_id AND b.project_id = NEW.project_id AND b.id = NEW.branch_id
  FOR UPDATE;
  IF NEW.parent_commit_id IS DISTINCT FROM v_head THEN
    RAISE EXCEPTION 'La rama cambió mientras guardabas: vuelve a cargar y reintenta' USING ERRCODE = 'serialization_failure';
  END IF;
  RETURN NEW;
END
$$;
CREATE FUNCTION app.advance_branch_head() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, app, pg_temp AS
$$
BEGIN
  UPDATE app.branches SET head_commit_id = NEW.id
  WHERE organization_id = NEW.organization_id AND project_id = NEW.project_id AND id = NEW.branch_id;
  RETURN NULL;
END
$$;
CREATE TRIGGER commits_check_parent BEFORE INSERT ON app.commits FOR EACH ROW EXECUTE FUNCTION app.check_commit_parent();
CREATE TRIGGER commits_advance_head AFTER  INSERT ON app.commits FOR EACH ROW EXECUTE FUNCTION app.advance_branch_head();

-- Cambio concreto: un nodo y una propiedad antes/después. Es la tabla que más crece; si pasa de ~100 M de filas
-- se parte por RANGE (created_at) igual que audit_log. Se escribe en bloque (INSERT … SELECT unnest).
CREATE TABLE app.commit_changes (
  id              bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id uuid        NOT NULL,
  project_id      uuid        NOT NULL,
  commit_id       uuid        NOT NULL,
  node            text        NOT NULL,
  property        text        NOT NULL,
  before_value    text,
  after_value     text,
  FOREIGN KEY (organization_id, project_id, commit_id) REFERENCES app.commits (organization_id, project_id, id) ON DELETE CASCADE
);
CREATE INDEX commit_changes_commit_idx ON app.commit_changes (organization_id, project_id, commit_id);

-- Pull request. Rama origen/destino N ── 1 rama. reviewer_id NULL = la recibe un superadministrador.
CREATE TABLE app.pull_requests (
  id                  uuid        PRIMARY KEY DEFAULT app.new_id(),
  organization_id     uuid        NOT NULL,
  project_id          uuid        NOT NULL,
  number              int         NOT NULL CHECK (number > 0),
  title               text        NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 300),
  from_branch_id      uuid        NOT NULL,
  into_branch_id      uuid        NOT NULL,
  author_id           uuid        NOT NULL,
  reviewer_id         uuid,
  status              text        NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'merged', 'closed')),
  required_approvals  int         NOT NULL DEFAULT 1 CHECK (required_approvals >= 1),
  merge_commit_id     uuid,
  created_at          timestamptz NOT NULL DEFAULT now(),
  closed_at           timestamptz,
  UNIQUE (organization_id, project_id, id),
  UNIQUE (organization_id, project_id, number),
  FOREIGN KEY (organization_id, project_id, from_branch_id) REFERENCES app.branches (organization_id, project_id, id),
  FOREIGN KEY (organization_id, project_id, into_branch_id) REFERENCES app.branches (organization_id, project_id, id),
  FOREIGN KEY (organization_id, project_id, merge_commit_id) REFERENCES app.commits (organization_id, project_id, id),
  FOREIGN KEY (organization_id, author_id)   REFERENCES app.users (organization_id, id),
  FOREIGN KEY (organization_id, reviewer_id) REFERENCES app.users (organization_id, id),
  CHECK (from_branch_id <> into_branch_id),
  -- Abierta = sin fecha de cierre; fusionada = con la versión de fusión.
  CHECK ((status = 'open') = (closed_at IS NULL)),
  CHECK ((status = 'merged') = (merge_commit_id IS NOT NULL))
);
-- Regla actual del servidor: una sola PR abierta por autor entre las mismas dos ramas.
CREATE UNIQUE INDEX pull_requests_one_open_key
  ON app.pull_requests (organization_id, project_id, author_id, from_branch_id, into_branch_id) WHERE status = 'open';
CREATE INDEX pull_requests_reviewer_idx ON app.pull_requests (organization_id, project_id, reviewer_id, status);
CREATE INDEX pull_requests_into_idx     ON app.pull_requests (organization_id, project_id, into_branch_id);
CREATE INDEX pull_requests_from_idx     ON app.pull_requests (organization_id, project_id, from_branch_id);
CREATE INDEX pull_requests_merge_idx    ON app.pull_requests (organization_id, project_id, merge_commit_id) WHERE merge_commit_id IS NOT NULL;

-- Qué versiones trae la PR. Pull request N ── M Versión. Los cambios se leen de commit_changes.
CREATE TABLE app.pull_request_commits (
  organization_id uuid NOT NULL,
  project_id      uuid NOT NULL,
  pull_request_id uuid NOT NULL,
  commit_id       uuid NOT NULL,
  PRIMARY KEY (organization_id, project_id, pull_request_id, commit_id),
  FOREIGN KEY (organization_id, project_id, pull_request_id) REFERENCES app.pull_requests (organization_id, project_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, project_id, commit_id)       REFERENCES app.commits (organization_id, project_id, id)
);
CREATE INDEX pull_request_commits_commit_idx ON app.pull_request_commits (organization_id, project_id, commit_id);

-- Aprobaciones. Pull request N ── M Usuario (un voto por persona).
CREATE TABLE app.pull_request_approvals (
  organization_id uuid        NOT NULL,
  project_id      uuid        NOT NULL,
  pull_request_id uuid        NOT NULL,
  user_id         uuid        NOT NULL,
  approved_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, project_id, pull_request_id, user_id),
  FOREIGN KEY (organization_id, project_id, pull_request_id) REFERENCES app.pull_requests (organization_id, project_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, user_id) REFERENCES app.users (organization_id, id)
);

-- Conflictos: mismo nodo y propiedad cambiados en las dos ramas. Pull request 1 ── N conflictos.
CREATE TABLE app.pull_request_conflicts (
  organization_id uuid NOT NULL,
  project_id      uuid NOT NULL,
  pull_request_id uuid NOT NULL,
  node            text NOT NULL,
  property        text NOT NULL,
  base_value      text,
  into_value      text,
  from_value      text,
  resolution      text CHECK (resolution IN ('into', 'from')),
  PRIMARY KEY (organization_id, project_id, pull_request_id, node, property),
  FOREIGN KEY (organization_id, project_id, pull_request_id) REFERENCES app.pull_requests (organization_id, project_id, id) ON DELETE CASCADE
);

-- Etiquetas de issues (las de fábrica y las propias comparten tabla). Proyecto 1 ── N etiquetas.
CREATE TABLE app.issue_labels (
  id              uuid        PRIMARY KEY DEFAULT app.new_id(),
  organization_id uuid        NOT NULL,
  project_id      uuid        NOT NULL,
  name            app.citext  NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 40),
  tone            text        NOT NULL DEFAULT 'neutral' CHECK (tone IN ('neutral', 'accent', 'success', 'danger', 'warning')),
  UNIQUE (organization_id, project_id, id),
  UNIQUE (organization_id, project_id, name),
  FOREIGN KEY (organization_id, project_id) REFERENCES app.projects (organization_id, id) ON DELETE CASCADE
);

-- Issues. Proyecto 1 ── N issues; Etiqueta 1 ── N issues (si se borra la etiqueta, el issue queda sin etiqueta).
CREATE TABLE app.issues (
  id              uuid        PRIMARY KEY DEFAULT app.new_id(),
  organization_id uuid        NOT NULL,
  project_id      uuid        NOT NULL,
  number          int         NOT NULL CHECK (number > 0),
  title           text        NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 300),
  label_id        uuid,
  author_id       uuid        NOT NULL,
  is_open         boolean     NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  closed_at       timestamptz,
  UNIQUE (organization_id, project_id, id),
  UNIQUE (organization_id, project_id, number),
  FOREIGN KEY (organization_id, project_id, label_id) REFERENCES app.issue_labels (organization_id, project_id, id) ON DELETE SET NULL (label_id),
  FOREIGN KEY (organization_id, author_id) REFERENCES app.users (organization_id, id),
  CHECK (is_open = (closed_at IS NULL))
);
CREATE INDEX issues_label_idx ON app.issues (organization_id, project_id, label_id) WHERE label_id IS NOT NULL;
CREATE INDEX issues_open_idx  ON app.issues (organization_id, project_id, number DESC) WHERE is_open;

-- Responsables. Issue N ── M Usuario.
CREATE TABLE app.issue_assignees (
  organization_id uuid NOT NULL,
  project_id      uuid NOT NULL,
  issue_id        uuid NOT NULL,
  user_id         uuid NOT NULL,
  PRIMARY KEY (organization_id, project_id, issue_id, user_id),
  FOREIGN KEY (organization_id, project_id, issue_id) REFERENCES app.issues (organization_id, project_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, user_id) REFERENCES app.users (organization_id, id) ON DELETE CASCADE
);
CREATE INDEX issue_assignees_user_idx ON app.issue_assignees (organization_id, user_id);
