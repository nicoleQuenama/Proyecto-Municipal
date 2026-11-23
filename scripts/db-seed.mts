/**
 * Carga inicial de la base de datos: crea la organización, su proyecto y, en desarrollo, tres cuentas de prueba.
 *   pnpm db:seed
 * Se puede repetir: lo que ya existe no se duplica. En producción no crea cuentas de prueba: la organización y su primer
 * superadministrador se dan de alta con `app.provision_organization` (ver db/README.md).
 * Usa DATABASE_ADMIN_URL (el dueño de las tablas): es una tarea de operación, no de la API.
 */
import postgres from "postgres";
import { hashPassword } from "../app/server/password-hash.ts";
import {
  createMunicipalSearchHero,
  createMunicipalSearchList,
  createTramitesLeyesDecretos,
} from "../app/components/site/container-card-rules.ts";
import { INITIAL_STATE as INITIAL_TITLE } from "../app/components/title-editor/constants.ts";

const TRAMITES_SLUG = "tramites-y-leyes";



function buildMunicipalTextBlock(id = "texto-oficial") {
  return {
    id,
    name: "Bloque de Texto",
    description: "Sección con título y párrafo editable para noticias, comunicados o contenido",
    category: "sections",
    width: 1024,
    height: 180,
    custom: true,
    styles: {
      $section: {
        classes: "px-8 py-8 w-full max-w-5xl mx-auto flex flex-col gap-3",
        css: "",
      },
    },
    elements: [
      {
        id: `${id}-title`,
        kind: "text",
        role: "heading",
        x: 32,
        y: 24,
        width: 800,
        height: 36,
        text: "Título de la sección",
        fontSize: 28,
        bold: true,
        color: "#0f172a",
        align: "left",
        fontFamily: "",
        fill: "transparent",
        radius: 0,
        src: "",
      },
      {
        id: `${id}-body`,
        kind: "text",
        role: "text",
        x: 32,
        y: 72,
        width: 800,
        height: 72,
        text: "Escribe aquí la información oficial, comunicado o contenido que desees publicar en este portal municipal. Puedes editar el tamaño de las letras, alineación y colores.",
        fontSize: 16,
        bold: false,
        color: "#475569",
        align: "left",
        fontFamily: "",
        fill: "transparent",
        radius: 0,
        src: "",
      },
    ],
    links: {},
  };
}

const DEMO = [
  { name: "Super Admin", username: "superadmin", email: "superadmin@portal.dev", role: "superadmin" as const, password: "SuperAdmin2026!" },
  { name: "Desarrollador", username: "dev", email: "dev@portal.dev", role: "dev" as const, password: "Dev2026!" },
  { name: "Diseñador", username: "designer", email: "designer@portal.dev", role: "designer" as const, password: "Designer2026!" },
];

if (process.env.NODE_ENV === "production") throw new Error("En producción no se crean cuentas de prueba: da de alta la organización con app.provision_organization.");

const adminUrl = process.env.DATABASE_ADMIN_URL;
if (!adminUrl) throw new Error("Falta DATABASE_ADMIN_URL (ver .env.example).");
const sql = postgres(adminUrl, { prepare: false, onnotice: () => undefined });

const accounts = await Promise.all(DEMO.map(async (demo) => ({ ...demo, passwordHash: await hashPassword(demo.password) })));
const first = accounts[0];

const slug = process.env.PORTAL_ORG_SLUG ?? "portal";
const [existing] = await sql<{ id: string }[]>`select id from app.organizations where slug = ${slug}`;
const orgId =
  existing?.id ??
  (await sql<{ id: string }[]>`
    select app.provision_organization(${slug}, ${process.env.PORTAL_ORG_NAME ?? "Portal"}, ${first.email}, ${first.name}, ${first.username}, ${first.passwordHash}) as id`)[0].id;

const [project] = await sql<{ id: string }[]>`select id from app.projects where organization_id = ${orgId} and deleted_at is null limit 1`;
const projectId = project?.id ?? (await sql<{ id: string }[]>`
  insert into app.projects (organization_id, slug, name, settings) values (${orgId}, 'proyecto-municipal', 'Proyecto Municipal', '{"brandRequired": true}'::jsonb) returning id`)[0].id;

// Asegurar que el proyecto tiene configurado el uso obligatorio de marca
await sql`
  update app.projects
  set settings = coalesce(settings, '{}'::jsonb) || '{"brandRequired": true}'::jsonb
  where id = ${projectId} and organization_id = ${orgId}
`;

// Variables oficiales del Manual de Marca GAMC
const brandVariables = [
  { name: "color-primario", value: "#00A7D6", kind: "color" },
  { name: "color-primario-hover", value: "#008BB3", kind: "color" },
  { name: "color-primario-light", value: "#34C3E8", kind: "color" },
  { name: "color-primario-soft", value: "#8AD4E7", kind: "color" },
  { name: "color-primario-tint", value: "#E6F6FB", kind: "color" },
  { name: "color-secundario", value: "#462D81", kind: "color" },
  { name: "color-secundario-light", value: "#695CA8", kind: "color" },
  { name: "color-acento-calido", value: "#F47B38", kind: "color" },
  { name: "color-acento-rosa", value: "#F05D80", kind: "color" },
  { name: "color-acento-teal", value: "#0DA593", kind: "color" },
  { name: "color-exito", value: "#0DA593", kind: "color" },
  { name: "color-exito-bg", value: "#ABDBCB", kind: "color" },
  { name: "color-alerta", value: "#F47B38", kind: "color" },
  { name: "color-alerta-bg", value: "#FFE6C2", kind: "color" },
  { name: "color-alerta-amarillo", value: "#FFDA18", kind: "color" },
  { name: "color-error", value: "#A91E5D", kind: "color" },
  { name: "color-error-bg", value: "#F5C3C0", kind: "color" },
  { name: "color-fondo", value: "#FFFFFF", kind: "color" },
  { name: "color-superficie", value: "#F8FAFC", kind: "color" },
  { name: "color-borde", value: "#E2E8F0", kind: "color" },
  { name: "color-texto", value: "#0F172A", kind: "color" },
  { name: "color-texto-secundario", value: "#475569", kind: "color" },
  { name: "color-texto-suave", value: "#94A3B8", kind: "color" },
  { name: "fuente-interfaz", value: "Roboto, sans-serif", kind: "font" },
  { name: "fuente-editorial", value: "'Roboto Serif', serif", kind: "font" },
];

for (let i = 0; i < brandVariables.length; i++) {
  const v = brandVariables[i];
  await sql`
    INSERT INTO app.style_variables (organization_id, project_id, scope, name, kind, value, position)
    VALUES (${orgId}, ${projectId}, 'global', ${v.name}, ${v.kind}, ${v.value}, ${i})
    ON CONFLICT (organization_id, project_id, scope, page_id, component_id, name)
    DO UPDATE SET value = EXCLUDED.value, kind = EXCLUDED.kind, position = EXCLUDED.position
  `;
}

let created = 0;
for (const account of accounts) {
  const [row] = await sql<{ id: string }[]>`select id from app.users where organization_id = ${orgId} and email = ${account.email} and deleted_at is null`;
  if (row) continue;
  const [made] = await sql<{ id: string }[]>`
    insert into app.users (organization_id, email, username, name, role, password_hash)
    values (${orgId}, ${account.email}, ${account.username}, ${account.name}, ${account.role}, ${account.passwordHash}) returning id`;
  created += 1;
  if (account.role !== "superadmin") {
    await sql`
      insert into app.project_members (organization_id, project_id, user_id, member_role)
      values (${orgId}, ${projectId}, ${made.id}, 'editor') on conflict (organization_id, project_id, user_id) do nothing`;
  }
}

const [homePage] = await sql<{ id: string }[]>`
  select id from app.pages where organization_id = ${orgId} and project_id = ${projectId} and (is_home or slug = 'inicio') limit 1
`;

// La página de Trámites y Leyes se crea solo si no existe: si el usuario ya la editó, se conserva.
let [tramitesPage] = await sql<{ id: string }[]>`
  select id from app.pages where organization_id = ${orgId} and project_id = ${projectId} and slug = ${TRAMITES_SLUG} limit 1
`;
if (!tramitesPage) {
  const [next] = await sql<{ max: number | null }[]>`
    select max(position) as max from app.pages where organization_id = ${orgId} and project_id = ${projectId}
  `;
  await sql`
    INSERT INTO app.pages (id, organization_id, project_id, name, slug, position, title, settings)
    VALUES (
      'pagina-tramites-y-leyes', ${orgId}, ${projectId}, 'Trámites y Leyes', ${TRAMITES_SLUG},
      ${(next?.max ?? -1) + 1}, ${sql.json({ ...INITIAL_TITLE, text: "Trámites y Leyes" })}, '{}'
    )
    ON CONFLICT (organization_id, project_id, slug) DO NOTHING
  `;
  [tramitesPage] = await sql<{ id: string }[]>`
    select id from app.pages where organization_id = ${orgId} and project_id = ${projectId} and slug = ${TRAMITES_SLUG} limit 1
  `;
}
const tramitesPageId = tramitesPage?.id;
if (!tramitesPageId) throw new Error("No se pudo crear la página de Trámites y Leyes");

// Bloque de texto municipal en la base de datos (editable por los usuarios)
const textDef = buildMunicipalTextBlock("texto-oficial");

await sql`
  INSERT INTO app.components (
    organization_id, project_id, id, name, description, category, width, height, custom, drawn, elements, links, styles, settings
  ) VALUES (
    ${orgId}, ${projectId}, ${textDef.id}, ${textDef.name}, ${textDef.description}, ${textDef.category},
    ${textDef.width}, ${textDef.height}, true, false,
    ${sql.json(textDef.elements)}, ${sql.json(textDef.links || {})}, ${sql.json(textDef.styles || {})}, '{}'
  )
  ON CONFLICT (organization_id, project_id, id) DO UPDATE SET
    elements = EXCLUDED.elements,
    styles = EXCLUDED.styles,
    updated_at = NOW()
`;

// Componentes del buscador municipal
const heroDef = createMunicipalSearchHero("hero-buscador");
const listDef = createMunicipalSearchList("lista-buscador");

await sql`
  INSERT INTO app.components (
    organization_id, project_id, id, name, description, category, width, height, custom, drawn, elements, links, styles, settings
  ) VALUES (
    ${orgId}, ${projectId}, ${heroDef.id}, ${heroDef.name}, ${heroDef.description}, ${heroDef.category},
    ${heroDef.width}, ${heroDef.height}, true, false,
    ${sql.json(heroDef.elements)}, ${sql.json(heroDef.links || {})}, ${sql.json(heroDef.styles || {})}, '{}'
  )
  ON CONFLICT (organization_id, project_id, id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    elements = EXCLUDED.elements,
    styles = EXCLUDED.styles,
    updated_at = NOW()
`;

await sql`
  INSERT INTO app.components (
    organization_id, project_id, id, name, description, category, width, height, custom, drawn, elements, links, styles, settings
  ) VALUES (
    ${orgId}, ${projectId}, ${listDef.id}, ${listDef.name}, ${listDef.description}, ${listDef.category},
    ${listDef.width}, ${listDef.height}, true, false,
    ${sql.json(listDef.elements)}, ${sql.json(listDef.links || {})}, ${sql.json(listDef.styles || {})}, '{}'
  )
  ON CONFLICT (organization_id, project_id, id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    elements = EXCLUDED.elements,
    styles = EXCLUDED.styles,
    updated_at = NOW()
`;

// Componentes de la página de Trámites y Leyes
const decreesDef = createTramitesLeyesDecretos("tramites-leyes-decretos");

await sql`
  INSERT INTO app.components (
    organization_id, project_id, id, name, description, category, width, height, custom, drawn, elements, links, styles, settings
  ) VALUES (
    ${orgId}, ${projectId}, ${decreesDef.id}, ${decreesDef.name}, ${decreesDef.description}, ${decreesDef.category},
    ${decreesDef.width}, ${decreesDef.height}, true, false,
    ${sql.json(decreesDef.elements)}, ${sql.json(decreesDef.links || {})}, ${sql.json(decreesDef.styles || {})}, '{}'
  )
  ON CONFLICT (organization_id, project_id, id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    height = EXCLUDED.height,
    elements = EXCLUDED.elements,
    styles = EXCLUDED.styles,
    updated_at = NOW()
`;

const officialHeaderId = "5a3aa5a6-ed26-464c-bdef-023f492cf471";
const officialFooterId = "992e86c1-192a-4cb9-ac8e-28982ba109f4";

const headerFormat = {
  adapt: { tablet: "menu", mobile: "menu" },
  menu: {
    panel: "drop",
    icon: "menu",
    iconSize: 28,
    panelColor: "#ffffff",
    itemIds: [
      "70d283cf-ec68-421a-9bcd-a5fb4699abf7",
      "464be65b-f216-4547-9475-37b9884acb33",
      "3c598908-0412-4691-9395-28e06c2b3fd8",
      "209c3eba-3bff-4fc3-8d6f-72096fa0bfc9",
      "d78d6cc7-bce4-467e-8d69-12ee4e30a800",
      "8f0b6b8d-b456-4d86-bd80-aa6503a668a7",
      "e9f93527-cc8c-42d1-92dd-ad7f79b23bb9",
      "1aabfd6f-7122-447c-a84f-07f08061d09f",
    ],
  },
};

if (homePage) {
  const existingBlocks = await sql<{ id: string; component_id: string; slot: string; position: number }[]>`
    SELECT id, component_id, slot, "position" FROM app.blocks
    WHERE organization_id = ${orgId} AND project_id = ${projectId} AND page_id = ${homePage.id}
  `;

  const headerBlock = existingBlocks.find((b) => b.slot === "header");
  const footerBlock = existingBlocks.find((b) => b.slot === "footer");

  if (headerBlock) {
    await sql`
      UPDATE app.blocks
      SET component_id = ${officialHeaderId}, scope = 'global', format = ${sql.json(headerFormat)}, updated_at = NOW()
      WHERE organization_id = ${orgId} AND project_id = ${projectId} AND id = ${headerBlock.id}
    `;
  }
  if (footerBlock) {
    await sql`
      UPDATE app.blocks
      SET component_id = ${officialFooterId}, scope = 'global', updated_at = NOW()
      WHERE organization_id = ${orgId} AND project_id = ${projectId} AND id = ${footerBlock.id}
    `;
  }

  if (!headerBlock) {
    const nextPos = existingBlocks.length;
    await sql`
      INSERT INTO app.blocks (organization_id, project_id, page_id, id, component_id, slot, "position", scope, format)
      VALUES (${orgId}, ${projectId}, ${homePage.id}, 'header-block-inicio', ${officialHeaderId}, 'header', ${nextPos}, 'global', ${sql.json(headerFormat)})
    `;
  }
  if (!footerBlock) {
    const nextPos = existingBlocks.length + (headerBlock ? 0 : 1);
    await sql`
      INSERT INTO app.blocks (organization_id, project_id, page_id, id, component_id, slot, "position", scope, format)
      VALUES (${orgId}, ${projectId}, ${homePage.id}, 'footer-block-inicio', ${officialFooterId}, 'footer', ${nextPos}, 'global', '{}')
    `;
  }
}

// Asegurar bloques en la página buscador si existe
const [buscadorPage] = await sql<{ id: string }[]>`
  select id from app.pages where organization_id = ${orgId} and project_id = ${projectId} and slug = 'buscador' limit 1
`;
if (buscadorPage) {
  const existingBuscadorBlocks = await sql<{ id: string }[]>`
    SELECT id FROM app.blocks WHERE organization_id = ${orgId} AND project_id = ${projectId} AND page_id = ${buscadorPage.id}
  `;
  if (existingBuscadorBlocks.length === 0) {
    await sql`
      INSERT INTO app.blocks (organization_id, project_id, page_id, id, component_id, slot, "position", scope, format)
      VALUES
        (${orgId}, ${projectId}, ${buscadorPage.id}, ${crypto.randomUUID()}, ${officialHeaderId}, 'header', 0, 'global', ${sql.json(headerFormat)}),
        (${orgId}, ${projectId}, ${buscadorPage.id}, ${crypto.randomUUID()}, 'hero-buscador', 'body', 1, null, '{}'),
        (${orgId}, ${projectId}, ${buscadorPage.id}, ${crypto.randomUUID()}, 'lista-buscador', 'body', 2, null, '{}'),
        (${orgId}, ${projectId}, ${buscadorPage.id}, ${crypto.randomUUID()}, ${officialFooterId}, 'footer', 3, 'global', '{}')
    `;
  }
}

// Asegurar los bloques de la página de Trámites y Leyes sin borrar lo que ya haya puesto el usuario.
const existingTramitesBlocks = await sql<{ component_id: string; slot: string | null; position: number }[]>`
  SELECT component_id, slot, "position" FROM app.blocks
  WHERE organization_id = ${orgId} AND project_id = ${projectId} AND page_id = ${tramitesPageId}
`;
let nextTramitesPosition = Math.max(-1, ...existingTramitesBlocks.map((b) => b.position)) + 1;
if (!existingTramitesBlocks.some((b) => b.slot === "header")) {
  await sql`
    INSERT INTO app.blocks (organization_id, project_id, page_id, id, component_id, slot, "position", scope, format)
    VALUES (${orgId}, ${projectId}, ${tramitesPageId}, ${crypto.randomUUID()}, ${officialHeaderId}, 'header', ${nextTramitesPosition++}, 'global', ${sql.json(headerFormat)})
  `;
}
if (!existingTramitesBlocks.some((b) => b.component_id === decreesDef.id)) {
  await sql`
    INSERT INTO app.blocks (organization_id, project_id, page_id, id, component_id, slot, "position", scope, format)
    VALUES (${orgId}, ${projectId}, ${tramitesPageId}, ${crypto.randomUUID()}, ${decreesDef.id}, 'body', ${nextTramitesPosition++}, null, '{}')
  `;
}
if (!existingTramitesBlocks.some((b) => b.slot === "footer")) {
  await sql`
    INSERT INTO app.blocks (organization_id, project_id, page_id, id, component_id, slot, "position", scope, format)
    VALUES (${orgId}, ${projectId}, ${tramitesPageId}, ${crypto.randomUUID()}, ${officialFooterId}, 'footer', ${nextTramitesPosition++}, 'global', '{}')
  `;
}

console.log(`Organización «${slug}» lista. Componentes municipales listos.`);
await sql.end();
