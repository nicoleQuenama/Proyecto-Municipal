/**
 * Carga inicial de la base de datos: crea la organización, su proyecto y, en desarrollo, tres cuentas de prueba.
 *   pnpm db:seed
 * Se puede repetir: lo que ya existe no se duplica. En producción no crea cuentas de prueba: la organización y su primer
 * superadministrador se dan de alta con `app.provision_organization` (ver db/README.md).
 * Usa DATABASE_ADMIN_URL (el dueño de las tablas): es una tarea de operación, no de la API.
 */
import postgres from "postgres";
import { hashPassword } from "../app/server/password-hash.ts";

function buildMunicipalHeader(id = "header-oficial") {
  return {
    id,
    name: "Cabecera Municipal Oficial",
    description: "Barra de navegación institucional blanca con escudo, enlaces y buscador ciudadano",
    category: "navigation",
    width: 1024,
    height: 72,
    custom: true,
    styles: {
      $section: {
        classes: "flex items-center justify-between px-6 py-3.5 bg-white text-slate-800 border-b border-slate-200/80 w-full shadow-xs",
        css: "",
      },
    },
    elements: [
      { id: `${id}-bg`, kind: "rect", role: "none", x: 0, y: 0, width: 1024, height: 72, fill: "#ffffff", radius: 0, text: "", fontSize: 16, color: "#0f172a", bold: false, align: "left", fontFamily: "", src: "" },
      { id: `${id}-border`, kind: "rect", role: "none", x: 0, y: 71, width: 1024, height: 1, fill: "#e5e7eb", radius: 0, text: "", fontSize: 16, color: "#0f172a", bold: false, align: "left", fontFamily: "", src: "" },
      { id: `${id}-logo`, kind: "ellipse", role: "image", frame: true, src: "/logo-municipal.png", alt: "Escudo Municipal", x: 21, y: 14, width: 44, height: 44, fill: "#86cdea", radius: 8, text: "", fontSize: 16, color: "#ffffff", bold: false, align: "left", fontFamily: "" },
      { id: `${id}-brand`, kind: "text", role: "heading", x: 73, y: 17, width: 160, height: 20, text: "COCHABAMBA", fontSize: 16, color: "#1b1550", bold: true, align: "left", fontFamily: "", fill: "transparent", radius: 8, src: "" },
      { id: `${id}-sub`, kind: "text", role: "text", x: 73, y: 38, width: 160, height: 14, text: "Gobierno de la Ciudad", fontSize: 10, color: "#4b5563", bold: false, align: "left", fontFamily: "", fill: "transparent", radius: 8, src: "" },
      { id: `${id}-link1`, kind: "text", role: "link", x: 240, y: 29, width: 110, height: 16, text: "Trámites y Leyes", fontSize: 12, color: "#1b1550", bold: false, align: "left", fontFamily: "", fill: "transparent", radius: 8, src: "" },
      { id: `${id}-link2`, kind: "text", role: "link", x: 364, y: 29, width: 80, height: 16, text: "Cocha Unida", fontSize: 12, color: "#1b1550", bold: false, align: "left", fontFamily: "", fill: "transparent", radius: 8, src: "" },
      { id: `${id}-link3`, kind: "text", role: "link", x: 458, y: 29, width: 45, height: 16, text: "GAMC", fontSize: 12, color: "#1b1550", bold: false, align: "left", fontFamily: "", fill: "transparent", radius: 8, src: "" },
      { id: `${id}-link4`, kind: "text", role: "link", x: 518, y: 29, width: 60, height: 16, text: "Noticias", fontSize: 12, color: "#1b1550", bold: false, align: "left", fontFamily: "", fill: "transparent", radius: 8, src: "" },
      { id: `${id}-link5`, kind: "text", role: "link", x: 592, y: 29, width: 175, height: 16, text: "Gabinete de Transparencia", fontSize: 12, color: "#1b1550", bold: false, align: "left", fontFamily: "", fill: "transparent", radius: 8, src: "" },
      { id: `${id}-link6`, kind: "text", role: "link", x: 782, y: 29, width: 65, height: 16, text: "Servicios", fontSize: 12, color: "#1b1550", bold: false, align: "left", fontFamily: "", fill: "transparent", radius: 8, src: "" },
      { id: `${id}-search`, kind: "rect", role: "button", control: { kind: "button", name: "search-trigger" }, x: 960, y: 19, width: 34, height: 34, fill: "#efe9f8", radius: 8, text: "⌕", icon: "search", color: "#4a1070", bold: true, align: "center", fontSize: 16, fontFamily: "", src: "" },
    ],
    links: {},
  };
}

function buildMunicipalFooter(id = "footer-oficial") {
  return {
    id,
    name: "Pie de Página Municipal Oficial",
    description: "Cierre institucional en 4 columnas limpias con escudo, trámites, normas y contacto",
    category: "navigation",
    width: 1024,
    height: 240,
    custom: true,
    styles: {
      $section: {
        classes: "w-full",
        css: "",
      },
    },
    elements: [
      { id: `${id}-bg`, kind: "rect", role: "none", x: 0, y: 0, width: 1024, height: 240, fill: "#0f172a", radius: 0, text: "", fontSize: 16, color: "#0f172a", bold: false, align: "left", fontFamily: "", src: "" },
      { id: `${id}-line`, kind: "rect", role: "none", x: 0, y: 0, width: 1024, height: 2, fill: "#1e293b", radius: 0, text: "", fontSize: 16, color: "#0f172a", bold: false, align: "left", fontFamily: "", src: "" },
      { id: `${id}-flogo`, kind: "ellipse", role: "image", frame: true, src: "/logo-municipal.png", alt: "Escudo GAMC", x: 40, y: 28, width: 44, height: 44, fill: "#1e293b", radius: 8, text: "", fontSize: 16, color: "#ffffff", bold: false, align: "left", fontFamily: "" },
      { id: `${id}-title`, kind: "text", role: "heading", x: 40, y: 80, width: 210, height: 22, text: "Gobierno Autónomo Municipal", fontSize: 14, bold: true, color: "#ffffff", align: "left", fontFamily: "", fill: "transparent", radius: 0, src: "" },
      { id: `${id}-desc`, kind: "text", role: "text", x: 40, y: 106, width: 210, height: 38, text: "Portal oficial de trámites, servicios y participación ciudadana.", fontSize: 11, color: "#94a3b8", bold: false, align: "left", fontFamily: "", fill: "transparent", radius: 0, src: "" },
      { id: `${id}-copy`, kind: "text", role: "text", x: 40, y: 152, width: 210, height: 20, text: "© 2026 GAMC. Cochabamba, Bolivia.", fontSize: 10, color: "#64748b", bold: false, align: "left", fontFamily: "", fill: "transparent", radius: 0, src: "" },

      { id: `${id}-t2`, kind: "text", role: "heading", x: 285, y: 28, width: 195, height: 22, text: "Trámites y Servicios", fontSize: 13, bold: true, color: "#f8fafc", align: "left", fontFamily: "", fill: "transparent", radius: 0, src: "" },
      { id: `${id}-l21`, kind: "text", role: "link", x: 285, y: 56, width: 195, height: 20, text: "• Ventanilla Única Digital", fontSize: 12, color: "#cbd5e1", bold: false, align: "left", fontFamily: "", fill: "transparent", radius: 0, src: "" },
      { id: `${id}-l22`, kind: "text", role: "link", x: 285, y: 80, width: 195, height: 20, text: "• Catastro y Territorio", fontSize: 12, color: "#cbd5e1", bold: false, align: "left", fontFamily: "", fill: "transparent", radius: 0, src: "" },
      { id: `${id}-l23`, kind: "text", role: "link", x: 285, y: 104, width: 195, height: 20, text: "• Licencias de Actividades", fontSize: 12, color: "#cbd5e1", bold: false, align: "left", fontFamily: "", fill: "transparent", radius: 0, src: "" },
      { id: `${id}-l24`, kind: "text", role: "link", x: 285, y: 128, width: 195, height: 20, text: "• Pagos de Impuestos en Línea", fontSize: 12, color: "#cbd5e1", bold: false, align: "left", fontFamily: "", fill: "transparent", radius: 0, src: "" },
      { id: `${id}-l25`, kind: "text", role: "link", x: 285, y: 152, width: 195, height: 20, text: "• Seguimiento de Trámites", fontSize: 12, color: "#cbd5e1", bold: false, align: "left", fontFamily: "", fill: "transparent", radius: 0, src: "" },

      { id: `${id}-t3`, kind: "text", role: "heading", x: 525, y: 28, width: 195, height: 22, text: "Transparencia y Normas", fontSize: 13, bold: true, color: "#f8fafc", align: "left", fontFamily: "", fill: "transparent", radius: 0, src: "" },
      { id: `${id}-l31`, kind: "text", role: "link", x: 525, y: 56, width: 195, height: 20, text: "• Rendición Pública de Cuentas", fontSize: 12, color: "#cbd5e1", bold: false, align: "left", fontFamily: "", fill: "transparent", radius: 0, src: "" },
      { id: `${id}-l32`, kind: "text", role: "link", x: 525, y: 80, width: 195, height: 20, text: "• Gaceta y Decretos Ediles", fontSize: 12, color: "#cbd5e1", bold: false, align: "left", fontFamily: "", fill: "transparent", radius: 0, src: "" },
      { id: `${id}-l33`, kind: "text", role: "link", x: 525, y: 104, width: 195, height: 20, text: "• Licitaciones y Convocatorias", fontSize: 12, color: "#cbd5e1", bold: false, align: "left", fontFamily: "", fill: "transparent", radius: 0, src: "" },
      { id: `${id}-l34`, kind: "text", role: "link", x: 525, y: 128, width: 195, height: 20, text: "• Presupuesto Participativo", fontSize: 12, color: "#cbd5e1", bold: false, align: "left", fontFamily: "", fill: "transparent", radius: 0, src: "" },
      { id: `${id}-l35`, kind: "text", role: "link", x: 525, y: 152, width: 195, height: 20, text: "• Marco Normativo Municipal", fontSize: 12, color: "#cbd5e1", bold: false, align: "left", fontFamily: "", fill: "transparent", radius: 0, src: "" },

      { id: `${id}-t4`, kind: "text", role: "heading", x: 765, y: 28, width: 215, height: 22, text: "Horarios y Contacto", fontSize: 13, bold: true, color: "#f8fafc", align: "left", fontFamily: "", fill: "transparent", radius: 0, src: "" },
      { id: `${id}-l41`, kind: "text", role: "text", x: 765, y: 56, width: 215, height: 20, text: "Lun a Vie: 08:00 - 16:00", fontSize: 12, color: "#cbd5e1", bold: false, align: "left", fontFamily: "", fill: "transparent", radius: 0, src: "" },
      { id: `${id}-l42`, kind: "text", role: "text", x: 765, y: 80, width: 215, height: 20, text: "Línea Gratuita: 800-14-0200", fontSize: 12, bold: true, color: "#f8fafc", align: "left", fontFamily: "", fill: "transparent", radius: 0, src: "" },
      { id: `${id}-l43`, kind: "text", role: "text", x: 765, y: 104, width: 215, height: 20, text: "Plaza 14 de Septiembre, GAMC", fontSize: 12, color: "#94a3b8", bold: false, align: "left", fontFamily: "", fill: "transparent", radius: 0, src: "" },
      { id: `${id}-l44`, kind: "text", role: "link", x: 765, y: 128, width: 215, height: 20, text: "contacto@gamc.gob.bo", fontSize: 12, color: "#38bdf8", bold: false, align: "left", fontFamily: "", fill: "transparent", radius: 0, src: "" },
    ],
    links: {},
  };
}

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
  insert into app.projects (organization_id, slug, name) values (${orgId}, 'proyecto-municipal', 'Proyecto Municipal') returning id`)[0].id;

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

// Componentes y bloques oficiales municipales en la base de datos (editables por los usuarios)
const headerDef = buildMunicipalHeader("header-oficial");
const footerDef = buildMunicipalFooter("footer-oficial");
const textDef = buildMunicipalTextBlock("texto-oficial");

await sql`
  INSERT INTO app.components (
    organization_id, project_id, id, name, description, category, width, height, custom, drawn, elements, links, styles, settings
  ) VALUES (
    ${orgId}, ${projectId}, ${headerDef.id}, ${headerDef.name}, ${headerDef.description}, ${headerDef.category},
    ${headerDef.width}, ${headerDef.height}, true, false,
    ${sql.json(headerDef.elements)}, ${sql.json(headerDef.links || {})}, ${sql.json(headerDef.styles || {})}, '{}'
  )
  ON CONFLICT (organization_id, project_id, id) DO UPDATE SET
    elements = EXCLUDED.elements,
    styles = EXCLUDED.styles,
    updated_at = NOW()
`;

await sql`
  INSERT INTO app.components (
    organization_id, project_id, id, name, description, category, width, height, custom, drawn, elements, links, styles, settings
  ) VALUES (
    ${orgId}, ${projectId}, ${footerDef.id}, ${footerDef.name}, ${footerDef.description}, ${footerDef.category},
    ${footerDef.width}, ${footerDef.height}, true, false,
    ${sql.json(footerDef.elements)}, ${sql.json(footerDef.links || {})}, ${sql.json(footerDef.styles || {})}, '{}'
  )
  ON CONFLICT (organization_id, project_id, id) DO UPDATE SET
    elements = EXCLUDED.elements,
    styles = EXCLUDED.styles,
    updated_at = NOW()
`;

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

const [homePage] = await sql<{ id: string }[]>`
  select id from app.pages where organization_id = ${orgId} and project_id = ${projectId} and (is_home or slug = 'inicio') limit 1
`;
if (homePage) {
  const headerFormat = {
    adapt: { tablet: "menu", mobile: "menu" },
    menu: {
      panel: "drop",
      icon: "menu",
      itemIds: headerDef.elements.filter((e) => e.role === "link" || e.role === "button").map((e) => e.id),
    },
  };

  const existingBlocks = await sql<{ id: string; component_id: string; slot: string; position: number }[]>`
    SELECT id, component_id, slot, "position" FROM app.blocks
    WHERE organization_id = ${orgId} AND project_id = ${projectId} AND page_id = ${homePage.id}
  `;

  const headerBlock = existingBlocks.find((b) => b.slot === "header");
  const footerBlock = existingBlocks.find((b) => b.slot === "footer");

  if (headerBlock) {
    await sql`
      UPDATE app.blocks
      SET component_id = ${headerDef.id}, scope = 'global', format = ${sql.json(headerFormat)}, updated_at = NOW()
      WHERE organization_id = ${orgId} AND project_id = ${projectId} AND id = ${headerBlock.id}
    `;
  }
  if (footerBlock) {
    await sql`
      UPDATE app.blocks
      SET component_id = ${footerDef.id}, scope = 'global', updated_at = NOW()
      WHERE organization_id = ${orgId} AND project_id = ${projectId} AND id = ${footerBlock.id}
    `;
  }

  if (!headerBlock) {
    const nextPos = existingBlocks.length;
    await sql`
      INSERT INTO app.blocks (organization_id, project_id, page_id, id, component_id, slot, "position", scope, format)
      VALUES (${orgId}, ${projectId}, ${homePage.id}, 'header-block-inicio', ${headerDef.id}, 'header', ${nextPos}, 'global', ${sql.json(headerFormat)})
    `;
  }
  if (!footerBlock) {
    const nextPos = existingBlocks.length + (headerBlock ? 0 : 1);
    await sql`
      INSERT INTO app.blocks (organization_id, project_id, page_id, id, component_id, slot, "position", scope, format)
      VALUES (${orgId}, ${projectId}, ${homePage.id}, 'footer-block-inicio', ${footerDef.id}, 'footer', ${nextPos}, 'global', '{}')
    `;
  }
}

console.log(`Organización «${slug}» lista. Componentes municipales listos.`);
await sql.end();
