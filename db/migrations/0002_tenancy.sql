-- 0002 · Inquilinos: organizaciones, usuarios, proyectos y quién trabaja en cuál.
--
-- Regla de oro del aislamiento: toda tabla "hija" lleva organization_id y lo incluye en su clave foránea
-- (organization_id, id). Así una fila de la organización A NO PUEDE apuntar a una fila de la B, aunque la
-- API se equivoque: lo rechaza la base de datos. RLS (0008) añade la segunda barrera para lectura/escritura.

-- Organización: 1 ── N usuarios, 1 ── N proyectos.
CREATE TABLE app.organizations (
  id            uuid        PRIMARY KEY DEFAULT app.new_id(),
  slug          app.citext  NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'),
  name          text        NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 120),
  status        text        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  -- Cuotas del plan; 0 no existe: toda organización tiene un límite explícito.
  max_projects      int     NOT NULL DEFAULT 5  CHECK (max_projects > 0),
  max_storage_bytes bigint  NOT NULL DEFAULT 5368709120 CHECK (max_storage_bytes > 0),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  row_version   int         NOT NULL DEFAULT 1,
  deleted_at    timestamptz
);

-- Usuario: pertenece a UNA sola organización (organization_id NOT NULL, sin tabla puente):
-- imposible que una persona cruce entre organizaciones. El correo es único en toda la plataforma
-- porque identifica el inicio de sesión y el restablecimiento de contraseña antes de saber la organización.
-- Nunca se borra de verdad: el historial (commits, comentarios, auditoría) conserva a su autor.
CREATE TABLE app.users (
  id              uuid        PRIMARY KEY DEFAULT app.new_id(),
  organization_id uuid        NOT NULL REFERENCES app.organizations (id),
  email           app.citext  NOT NULL CHECK (length(email) <= 254 AND email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  username        app.citext  NOT NULL CHECK (length(username) BETWEEN 3 AND 40),
  name            text        NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 120),
  role            text        NOT NULL CHECK (role IN ('superadmin', 'dev', 'designer')),
  -- Hash completo con su sal (p. ej. argon2id: "$argon2id$…"); no hay columna salt aparte.
  password_hash   text        NOT NULL,
  -- Sube al cambiar la contraseña: invalida las sesiones anteriores (el token firmado lleva este número).
  session_version int         NOT NULL DEFAULT 0,
  -- Quién la invitó (árbol de invitaciones). Mismo organization_id garantizado por la clave compuesta.
  invited_by      uuid,
  status          text        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  last_login_at   timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  row_version     int         NOT NULL DEFAULT 1,
  deleted_at      timestamptz,
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, invited_by) REFERENCES app.users (organization_id, id),
  CHECK (invited_by IS DISTINCT FROM id)
);
CREATE UNIQUE INDEX users_email_key         ON app.users (email) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX users_org_username_key  ON app.users (organization_id, username) WHERE deleted_at IS NULL;
CREATE INDEX        users_invited_by_idx    ON app.users (organization_id, invited_by) WHERE invited_by IS NOT NULL;

-- Una organización siempre conserva al menos un superadministrador activo.
CREATE FUNCTION app.guard_last_superadmin() RETURNS trigger
LANGUAGE plpgsql AS
$$
BEGIN
  IF OLD.role = 'superadmin' AND OLD.status = 'active' AND OLD.deleted_at IS NULL
     AND (TG_OP = 'DELETE' OR NEW.role <> 'superadmin' OR NEW.status <> 'active' OR NEW.deleted_at IS NOT NULL) THEN
    -- Serializa a quienes quitan superadmins a la vez: sin esto dos transacciones podrían dejar a cero.
    PERFORM 1 FROM app.organizations WHERE id = OLD.organization_id FOR UPDATE;
    IF NOT EXISTS (
      SELECT 1 FROM app.users u
      WHERE u.organization_id = OLD.organization_id AND u.id <> OLD.id
        AND u.role = 'superadmin' AND u.status = 'active' AND u.deleted_at IS NULL
    ) THEN
      RAISE EXCEPTION 'No se puede quitar al último superadministrador de la organización'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END
$$;
CREATE TRIGGER users_guard_last_superadmin
  BEFORE UPDATE OF role, status, deleted_at OR DELETE ON app.users
  FOR EACH ROW EXECUTE FUNCTION app.guard_last_superadmin();

-- Enlaces de restablecimiento: solo se guarda el SHA-256 del token, nunca el token. Un solo uso.
-- Usuario 1 ── N tokens.
CREATE TABLE app.password_reset_tokens (
  id              uuid        PRIMARY KEY DEFAULT app.new_id(),
  organization_id uuid        NOT NULL,
  user_id         uuid        NOT NULL,
  token_hash      bytea       NOT NULL UNIQUE CHECK (length(token_hash) = 32),
  expires_at      timestamptz NOT NULL,
  used_at         timestamptz,
  requested_ip    inet,
  created_at      timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (organization_id, user_id) REFERENCES app.users (organization_id, id) ON DELETE CASCADE,
  CHECK (expires_at > created_at)
);
CREATE INDEX password_reset_tokens_user_idx ON app.password_reset_tokens (organization_id, user_id) WHERE used_at IS NULL;
CREATE INDEX password_reset_tokens_expiry_idx ON app.password_reset_tokens (expires_at);

-- Preferencias de interfaz de cada persona (atajos de teclado, panel del inspector, modo avanzado…).
-- Antes vivían en el localStorage del navegador; ahora la acompañan a cualquier dispositivo.
-- Usuario 1 ── N preferencias. Cada quien ve y cambia solo las suyas (RLS en 0009).
CREATE TABLE app.user_preferences (
  organization_id uuid        NOT NULL,
  user_id         uuid        NOT NULL,
  key             text        NOT NULL CHECK (key ~ '^[a-z][a-z0-9._-]{0,63}$'),
  value           jsonb       NOT NULL CHECK (pg_column_size(value) <= 65536),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, user_id, key),
  FOREIGN KEY (organization_id, user_id) REFERENCES app.users (organization_id, id) ON DELETE CASCADE
);

-- Proyecto (un sitio web): Organización 1 ── N proyectos.
CREATE TABLE app.projects (
  id              uuid        PRIMARY KEY DEFAULT app.new_id(),
  organization_id uuid        NOT NULL REFERENCES app.organizations (id),
  slug            app.citext  NOT NULL CHECK (slug ~ '^[a-z0-9][a-z0-9-]{0,62}$'),
  name            text        NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 120),
  -- Estado global del sitio que no es una lista: transición por defecto. El CSS global es código: vive como AST en code_units.
  navigation      jsonb       NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(navigation) = 'object'),
  -- Lo que el editor guarda del sitio y no tiene tabla propia (p. ej. la biblioteca de medios hasta ImageKit): nada se pierde.
  settings        jsonb       NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(settings) = 'object'),
  -- Publicación en línea hoy; la FK se añade en 0006 (referencia circular con publications).
  live_publication_id uuid,
  created_by      uuid,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  row_version     int         NOT NULL DEFAULT 1,
  deleted_at      timestamptz,
  -- Destino de las claves foráneas de todo lo que cuelga del proyecto.
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, created_by) REFERENCES app.users (organization_id, id)
);
CREATE UNIQUE INDEX projects_org_slug_key ON app.projects (organization_id, slug) WHERE deleted_at IS NULL;

-- Contadores de los números «#12» de pull requests, issues y publicaciones. Proyecto 1 ── 1 contadores.
-- Aparte de projects para que numerar no suba project.row_version. Solo los mueve app.next_number() (0014).
CREATE TABLE app.project_counters (
  organization_id         uuid NOT NULL,
  project_id              uuid NOT NULL,
  next_pr_number          int  NOT NULL DEFAULT 1 CHECK (next_pr_number > 0),
  next_issue_number       int  NOT NULL DEFAULT 1 CHECK (next_issue_number > 0),
  next_publication_number int  NOT NULL DEFAULT 1 CHECK (next_publication_number > 0),
  PRIMARY KEY (organization_id, project_id),
  FOREIGN KEY (organization_id, project_id) REFERENCES app.projects (organization_id, id) ON DELETE CASCADE
);

-- Quién trabaja en qué proyecto, y con qué límites (la "cuenta con acceso limitado" del CMS).
-- Usuario N ── M Proyecto. Un superadmin ve todos los proyectos de su organización sin fila aquí.
CREATE TABLE app.project_members (
  organization_id uuid        NOT NULL,
  project_id      uuid        NOT NULL,
  user_id         uuid        NOT NULL,
  -- Lo que puede hacer EN ESTE proyecto (se cruza con el rol de la cuenta en 0010):
  -- viewer solo ve; commenter ve y comenta; reviewer además revisa pull requests; editor edita.
  member_role     text        NOT NULL DEFAULT 'editor' CHECK (member_role IN ('viewer', 'commenter', 'reviewer', 'editor')),
  -- Vetos aunque el rol lo permita (Restriction en access.ts). Valores fuera de la lista se rechazan.
  denied          text[]      NOT NULL DEFAULT '{}'
                  CHECK (denied <@ ARRAY['installLibraries','editCode','editStyles','editData','invite','publishMain','deploy']::text[]),
  -- false = puede tocar todo el proyecto; true = solo las páginas/secciones de las tablas member_scope_*.
  scope_limited   boolean     NOT NULL DEFAULT false,
  -- Vence el acceso; NULL = no vence. Pasada la fecha, la API rechaza el inicio de sesión.
  expires_at      timestamptz,
  granted_by      uuid,
  created_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, project_id, user_id),
  FOREIGN KEY (organization_id, project_id) REFERENCES app.projects (organization_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, user_id)    REFERENCES app.users (organization_id, id)    ON DELETE CASCADE,
  FOREIGN KEY (organization_id, granted_by) REFERENCES app.users (organization_id, id)
);
CREATE INDEX project_members_user_idx    ON app.project_members (organization_id, user_id);
