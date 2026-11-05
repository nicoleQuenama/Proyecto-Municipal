-- 0016 · Lo que el público (sin sesión) lee: el sitio publicado y la caché de las APIs de los sitios.
--
-- Un visitante no tiene organización ni persona: se sabe a qué sitio llega por su dominio verificado (`resolve_public_site`, 0009)
-- o, mientras no haya dominio (desarrollo, un solo sitio por servidor), por la organización que el servidor tiene configurada.
-- Son las ÚNICAS puertas sin sesión: devuelven lo mínimo, tienen search_path fijo y no aceptan identificadores de otras organizaciones.

-- El sitio en línea del proyecto más antiguo de esa organización.
CREATE FUNCTION app.resolve_public_site_by_org(p_slug app.citext)
RETURNS TABLE (project_id uuid, publication_id uuid, snapshot jsonb, snapshot_sha256 bytea, published_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, app, pg_temp AS
$$
  SELECT p.id, pub.id, pub.snapshot, pub.snapshot_sha256, pub.published_at
  FROM app.organizations o
  JOIN app.projects p ON p.organization_id = o.id AND p.deleted_at IS NULL
  JOIN app.publications pub ON pub.organization_id = p.organization_id AND pub.project_id = p.id AND pub.id = p.live_publication_id
  WHERE o.slug = p_slug AND o.status = 'active' AND o.deleted_at IS NULL
  ORDER BY p.created_at
  LIMIT 1
$$;

-- Caché de las respuestas de las APIs (la usa el proxy, que también atiende a visitantes sin sesión). Va por organización y
-- se guarda en el proyecto más antiguo de esa organización. `p_ttl_seconds` NULL = persistente.
CREATE FUNCTION app.cache_get(p_slug app.citext, p_key bytea)
RETURNS TABLE (status int, content_type text, body text, fetched_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, app, pg_temp AS
$$
  SELECT c.status, c.content_type, c.body, c.fetched_at
  FROM app.organizations o
  JOIN app.data_source_cache c ON c.organization_id = o.id AND c.project_id = (
         SELECT p.id FROM app.projects p WHERE p.organization_id = o.id AND p.deleted_at IS NULL ORDER BY p.created_at LIMIT 1)
  WHERE o.slug = p_slug AND c.cache_key = p_key AND (c.expires_at IS NULL OR c.expires_at > now())
$$;

CREATE FUNCTION app.cache_put(p_slug app.citext, p_key bytea, p_status int, p_content_type text, p_body text, p_ttl_seconds int)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, app, pg_temp AS
$$
DECLARE v_org uuid; v_project uuid;
BEGIN
  SELECT o.id INTO v_org FROM app.organizations o WHERE o.slug = p_slug AND o.status = 'active' AND o.deleted_at IS NULL;
  SELECT p.id INTO v_project FROM app.projects p WHERE p.organization_id = v_org AND p.deleted_at IS NULL ORDER BY p.created_at LIMIT 1;
  IF v_project IS NULL THEN RETURN; END IF;
  INSERT INTO app.data_source_cache (organization_id, project_id, cache_key, status, content_type, body, fetched_at, expires_at)
  VALUES (v_org, v_project, p_key, p_status, p_content_type, p_body, now(), CASE WHEN p_ttl_seconds IS NULL THEN NULL ELSE now() + make_interval(secs => p_ttl_seconds) END)
  ON CONFLICT (organization_id, project_id, cache_key)
  DO UPDATE SET status = excluded.status, content_type = excluded.content_type, body = excluded.body, fetched_at = excluded.fetched_at, expires_at = excluded.expires_at;
END
$$;

REVOKE ALL ON FUNCTION app.resolve_public_site_by_org(app.citext), app.cache_get(app.citext, bytea), app.cache_put(app.citext, bytea, int, text, text, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.resolve_public_site_by_org(app.citext), app.cache_get(app.citext, bytea), app.cache_put(app.citext, bytea, int, text, text, int) TO portal_app;
