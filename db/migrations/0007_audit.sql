-- 0007 · Auditoría de acciones. Solo se inserta (nunca se actualiza ni se borra fila a fila).
--
-- Particionada por mes: borrar un mes viejo es DROP/DETACH de una partición (instantáneo, sin VACUUM)
-- y las consultas recientes solo tocan 1-2 particiones. Sin claves foráneas a propósito: el registro debe
-- sobrevivir aunque se archive el usuario, el proyecto o la organización a los que se refiere.
CREATE TABLE app.audit_log (
  id              uuid        NOT NULL DEFAULT app.new_id(),
  organization_id uuid        NOT NULL,
  project_id      uuid,
  actor_id        uuid,
  action          text        NOT NULL CHECK (action ~ '^[a-z_]+\.[a-z_]+$'),      -- p. ej. publication.create
  entity_type     text        NOT NULL,
  entity_id       uuid,
  metadata        jsonb       NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(metadata) = 'object'),
  ip              inet,
  occurred_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, occurred_at)
) PARTITION BY RANGE (occurred_at);

CREATE INDEX audit_log_org_time_idx    ON app.audit_log (organization_id, occurred_at DESC);
CREATE INDEX audit_log_entity_idx      ON app.audit_log (organization_id, entity_type, entity_id, occurred_at DESC);

-- Crea las particiones de este mes y de los próximos `p_months`. Idempotente: un trabajo programado
-- (pg_cron o el cron de la plataforma) la llama a diario.
CREATE FUNCTION app.ensure_audit_partitions(p_months int DEFAULT 3) RETURNS int
LANGUAGE plpgsql AS
$$
DECLARE
  month_start date;
  created     int := 0;
  part_name   text;
BEGIN
  FOR i IN 0..p_months LOOP
    month_start := (date_trunc('month', now()) + make_interval(months => i))::date;
    part_name   := format('audit_log_%s', to_char(month_start, 'YYYY_MM'));
    IF to_regclass(format('app.%I', part_name)) IS NULL THEN
      EXECUTE format('CREATE TABLE app.%I PARTITION OF app.audit_log FOR VALUES FROM (%L) TO (%L)',
                     part_name, month_start, (month_start + interval '1 month')::date);
      created := created + 1;
    END IF;
  END LOOP;
  RETURN created;
END
$$;

SELECT app.ensure_audit_partitions(3);
