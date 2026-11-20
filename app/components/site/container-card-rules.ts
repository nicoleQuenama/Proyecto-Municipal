import { SECTION_KEY, type CanvasElement, type ComponentDef } from "./types";
import { newElement } from "./component-templates";

export interface ContainerCardInfo {
  id: string;
  title: string;
  elementCount: number;
}

/** Obtiene las tarjetas (elementos raíz sin parentId) y su título descriptivo dentro del componente. */
export function getContainerCards(def: ComponentDef): ContainerCardInfo[] {
  const topElements = def.elements.filter((e) => !e.parentId);
  return topElements.map((root, idx) => {
    const children = def.elements.filter((e) => e.parentId === root.id);
    const heading = children.find((c) => c.role === "heading" || c.kind === "text") ?? (root.kind === "text" ? root : null);
    const title = heading?.text?.trim() || root.text?.trim() || `Tarjeta ${idx + 1}`;
    return {
      id: root.id,
      title,
      elementCount: 1 + children.length,
    };
  });
}

/** Encuentra el id de la tarjeta raíz a partir del id de cualquier elemento hijo o de la propia tarjeta. */
export function findRootCardId(elements: CanvasElement[], elementId: string): string {
  const el = elements.find((e) => e.id === elementId);
  if (!el) return elementId;
  return el.parentId ? findRootCardId(elements, el.parentId) : el.id;
}

/** Duplica una tarjeta y todos sus hijos dentro del componente, insertándola a continuación. */
export function duplicateCardInComponent(
  def: ComponentDef,
  cardElementId: string,
): { component: ComponentDef; newCardId: string } {
  const rootId = findRootCardId(def.elements, cardElementId);
  const rootEl = def.elements.find((e) => e.id === rootId);
  if (!rootEl) return { component: def, newCardId: cardElementId };

  const children = def.elements.filter((e) => e.parentId === rootId);
  const newRootId = crypto.randomUUID();

  const clonedRoot: CanvasElement = {
    ...rootEl,
    id: newRootId,
    x: rootEl.x + 24,
    y: rootEl.y,
  };

  const clonedChildren: CanvasElement[] = children.map((c) => ({
    ...c,
    id: crypto.randomUUID(),
    parentId: newRootId,
  }));

  // Encontrar el último índice de este grupo de tarjeta en el array de elementos
  const cardGroupIds = new Set([rootId, ...children.map((c) => c.id)]);
  let lastIndex = -1;
  for (let i = 0; i < def.elements.length; i++) {
    if (cardGroupIds.has(def.elements[i].id)) {
      lastIndex = i;
    }
  }

  const insertIndex = lastIndex >= 0 ? lastIndex + 1 : def.elements.length;
  const newElements = [
    ...def.elements.slice(0, insertIndex),
    clonedRoot,
    ...clonedChildren,
    ...def.elements.slice(insertIndex),
  ];

  return {
    component: {
      ...def,
      elements: newElements,
    },
    newCardId: newRootId,
  };
}

const CARD_COLORS = ["#0d99ff", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4"];

/** Agrega una nueva tarjeta limpia y estilizada al contenedor. */
export function addCardToComponent(
  def: ComponentDef,
  customTitle?: string,
): { component: ComponentDef; newCardId: string } {
  const newCardId = crypto.randomUUID();
  const topElements = def.elements.filter((e) => !e.parentId);
  const index = topElements.length;
  const color = CARD_COLORS[index % CARD_COLORS.length];
  const title = customTitle || `Tarjeta ${index + 1}`;

  const containerCard = newElement("rect", newCardId, {
    role: "container",
    x: 0,
    y: 0,
    width: 240,
    height: 190,
    fill: "#f8fafc",
    radius: 16,
  });

  const iconElement = newElement("rect", crypto.randomUUID(), {
    parentId: newCardId,
    x: 16,
    y: 16,
    width: 40,
    height: 40,
    fill: color,
    radius: 10,
  });

  const titleElement = newElement("text", crypto.randomUUID(), {
    parentId: newCardId,
    role: "heading",
    x: 16,
    y: 66,
    width: 200,
    height: 26,
    text: title,
    fontSize: 16,
    bold: true,
  });

  const descElement = newElement("text", crypto.randomUUID(), {
    parentId: newCardId,
    role: "text",
    x: 16,
    y: 98,
    width: 200,
    height: 60,
    text: "Descripción del contenido o servicio de esta tarjeta.",
    fontSize: 13,
    color: "#64748b",
  });

  return {
    component: {
      ...def,
      elements: [...def.elements, containerCard, iconElement, titleElement, descElement],
    },
    newCardId,
  };
}

/** Elimina una tarjeta y todos sus hijos dentro del componente. */
export function deleteCardFromComponent(def: ComponentDef, cardElementId: string): ComponentDef {
  const rootId = findRootCardId(def.elements, cardElementId);
  const children = def.elements.filter((e) => e.parentId === rootId);
  const toDelete = new Set([rootId, ...children.map((c) => c.id)]);

  return {
    ...def,
    elements: def.elements.filter((e) => !toDelete.has(e.id)),
  };
}

/** Rellena el componente con 3 tarjetas pre-diseñadas para contenedor horizontal. */
export function fillComponentWithThreeCards(def: ComponentDef): ComponentDef {
  const items = [
    { title: "Atención Vecinal", desc: "Consultas y trámites digitales en línea.", color: "#0d99ff" },
    { title: "Pagos y Tributos", desc: "Pago seguro y al día de contribuciones.", color: "#10b981" },
    { title: "Seguridad y Apoyo", desc: "Canales de contacto y asistencia 24/7.", color: "#8b5cf6" },
  ];

  const newElements: CanvasElement[] = [];

  for (const item of items) {
    const cardId = crypto.randomUUID();
    newElements.push(
      newElement("rect", cardId, { role: "container", x: 0, y: 0, width: 240, height: 190, fill: "#f8fafc", radius: 16 }),
      newElement("rect", crypto.randomUUID(), { parentId: cardId, x: 16, y: 16, width: 40, height: 40, fill: item.color, radius: 10 }),
      newElement("text", crypto.randomUUID(), { parentId: cardId, role: "heading", x: 16, y: 66, width: 200, height: 26, text: item.title, fontSize: 16, bold: true }),
      newElement("text", crypto.randomUUID(), { parentId: cardId, role: "text", x: 16, y: 98, width: 200, height: 60, text: item.desc, fontSize: 13, color: "#64748b" }),
    );
  }

  return {
    ...def,
    elements: newElements,
  };
}

/** Reordena una tarjeta hacia adelante o atrás en el flujo del contenedor. */
export function reorderCardInComponent(
  def: ComponentDef,
  cardElementId: string,
  direction: -1 | 1,
): ComponentDef {
  const rootId = findRootCardId(def.elements, cardElementId);
  const topElements = def.elements.filter((e) => !e.parentId);
  const topIds = topElements.map((e) => e.id);
  const idx = topIds.indexOf(rootId);
  if (idx < 0) return def;

  const targetIdx = idx + direction;
  if (targetIdx < 0 || targetIdx >= topIds.length) return def;

  const groups = new Map<string, CanvasElement[]>();
  for (const tid of topIds) groups.set(tid, []);
  for (const el of def.elements) {
    const pid = el.parentId ?? el.id;
    const grp = groups.get(pid);
    if (grp) grp.push(el);
    else groups.set(el.id, [el]);
  }

  const newTopIds = [...topIds];
  const temp = newTopIds[idx];
  newTopIds[idx] = newTopIds[targetIdx];
  newTopIds[targetIdx] = temp;

  const reorderedElements = newTopIds.flatMap((id) => groups.get(id) ?? []);
  return {
    ...def,
    elements: reorderedElements,
  };
}

/** Reordena elementos hijos mediante drag-and-drop dentro de un contenedor en flujo (sin tocar coordenadas x/y). */
export function reorderElementInComponent(
  def: ComponentDef,
  sourceId: string,
  targetId: string,
  position: "before" | "after" = "after",
): ComponentDef {
  const sourceRootId = findRootCardId(def.elements, sourceId);
  const targetRootId = findRootCardId(def.elements, targetId);

  if (sourceRootId === targetRootId) return def;

  const topElements = def.elements.filter((e) => !e.parentId);
  const topIds = topElements.map((e) => e.id);
  const sourceIdx = topIds.indexOf(sourceRootId);
  const targetIdx = topIds.indexOf(targetRootId);

  if (sourceIdx < 0 || targetIdx < 0) return def;

  // Extraer el id fuente
  const remainingIds = topIds.filter((id) => id !== sourceRootId);
  const newTargetIdx = remainingIds.indexOf(targetRootId);
  const insertIndex = position === "before" ? newTargetIdx : newTargetIdx + 1;

  const newTopIds = [
    ...remainingIds.slice(0, insertIndex),
    sourceRootId,
    ...remainingIds.slice(insertIndex),
  ];

  const groups = new Map<string, CanvasElement[]>();
  for (const tid of topIds) groups.set(tid, []);
  for (const el of def.elements) {
    const pid = el.parentId ?? el.id;
    const grp = groups.get(pid);
    if (grp) grp.push(el);
    else groups.set(el.id, [el]);
  }

  const reorderedElements = newTopIds.flatMap((id) => groups.get(id) ?? []);
  return {
    ...def,
    elements: reorderedElements,
  };
}

/** Reordena cualquier elemento hacia arriba/antes (-1) o abajo/después (1) en el flujo del componente. */
export function moveElementOrderInComponent(
  def: ComponentDef,
  elementId: string,
  direction: -1 | 1,
): ComponentDef {
  const element = def.elements.find((e) => e.id === elementId);
  if (!element) return def;

  // Si tiene parentId, reordenamos entre hermanos con el mismo parentId
  if (element.parentId) {
    const parentId = element.parentId;
    const siblings = def.elements.filter((e) => e.parentId === parentId);
    const idx = siblings.findIndex((e) => e.id === elementId);
    const targetIdx = idx + direction;
    if (idx < 0 || targetIdx < 0 || targetIdx >= siblings.length) return def;

    const targetSibling = siblings[targetIdx];
    const elementsCopy = [...def.elements];
    const elPos = elementsCopy.findIndex((e) => e.id === elementId);
    const targetPos = elementsCopy.findIndex((e) => e.id === targetSibling.id);

    const oldY = element.y;
    const updatedEl = { ...element, y: targetSibling.y };
    const updatedTarget = { ...targetSibling, y: oldY };

    elementsCopy[elPos] = updatedTarget;
    elementsCopy[targetPos] = updatedEl;

    return {
      ...def,
      elements: elementsCopy,
    };
  }

  // Si es un elemento raíz (con o sin hijos)
  const rootId = findRootCardId(def.elements, elementId);
  return reorderCardInComponent(def, rootId, direction);
}

/** Agrega un nuevo botón limpio a un set de botones. */
export function addButtonToComponent(
  def: ComponentDef,
  customLabel?: string,
): { component: ComponentDef; newButtonId: string } {
  const newButtonId = crypto.randomUUID();
  const topElements = def.elements.filter((e) => !e.parentId);
  const count = topElements.length;
  const isSecondary = count > 0;
  const label = customLabel || (count === 0 ? "Principal" : count === 1 ? "Secundario" : `Botón ${count + 1}`);

  const button = newElement("rect", newButtonId, {
    role: "button",
    x: 0,
    y: 0,
    width: 144,
    height: 48,
    fill: isSecondary ? "#e2e8f0" : "#0d99ff",
    radius: 10,
    text: label,
    color: isSecondary ? "#0f172a" : "#ffffff",
    bold: true,
    align: "center",
  });

  return {
    component: {
      ...def,
      elements: [...def.elements, button],
    },
    newButtonId,
  };
}

/**
 * Crea una plantilla municipal limpia de pie de página (footer) de 3 columnas
 * con coordenadas de escritorio separadas y layout responsivo automático.
 */
export function createDefaultMunicipalFooter(id?: string): ComponentDef {
  const compId = id || crypto.randomUUID();
  let count = 0;
  const nextId = () => `${compId}-e${++count}`;
  const col1 = nextId();
  const col2 = nextId();
  const col3 = nextId();
  const col4 = nextId();

  return {
    id: compId,
    name: "Pie de página (Footer)",
    description: "Cierre institucional en 4 columnas: Identidad, Trámites, Transparencia y Contacto",
    category: "navigation",
    width: 1024,
    height: 260,
    custom: true,
    styles: {
      [SECTION_KEY]: {
        classes: "grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 p-6 lg:p-10 bg-slate-900 text-slate-200 border-t border-slate-800 w-full",
        css: "",
      },
    },
    elements: [
      // Columna 1: Logo municipal e Identidad
      newElement("rect", col1, { role: "container", x: 24, y: 24, width: 220, height: 210, fill: "transparent", radius: 0 }),
      newElement("ellipse", nextId(), { parentId: col1, role: "image", frame: true, src: "/login-brand.svg", alt: "Escudo GAMC", x: 0, y: 0, width: 44, height: 44, fill: "#475569" }),
      newElement("text", nextId(), { parentId: col1, x: 0, y: 52, width: 210, height: 24, text: "Gobierno Autónomo Municipal", fontSize: 15, bold: true, color: "#ffffff", role: "heading" }),
      newElement("text", nextId(), { parentId: col1, x: 0, y: 80, width: 210, height: 48, text: "Portal oficial de trámites, servicios y participación ciudadana.", fontSize: 12, color: "#94a3b8" }),
      newElement("text", nextId(), { parentId: col1, x: 0, y: 136, width: 210, height: 32, text: "© 2026 GAMC. Todos los derechos reservados.", fontSize: 11, color: "#94a3b8" }),

      // Columna 2: Trámites y Servicios
      newElement("rect", col2, { role: "container", x: 270, y: 24, width: 220, height: 210, fill: "transparent", radius: 0 }),
      newElement("text", nextId(), { parentId: col2, x: 0, y: 0, width: 210, height: 24, text: "Trámites y Servicios", fontSize: 14, bold: true, color: "#f8fafc", role: "heading" }),
      newElement("text", nextId(), { parentId: col2, x: 0, y: 32, width: 210, height: 22, text: "• Ventanilla Única Digital", fontSize: 13, color: "#cbd5e1", role: "link" }),
      newElement("text", nextId(), { parentId: col2, x: 0, y: 58, width: 210, height: 22, text: "• Catastro y Territorio", fontSize: 13, color: "#cbd5e1", role: "link" }),
      newElement("text", nextId(), { parentId: col2, x: 0, y: 84, width: 210, height: 22, text: "• Licencias de Actividades", fontSize: 13, color: "#cbd5e1", role: "link" }),
      newElement("text", nextId(), { parentId: col2, x: 0, y: 110, width: 210, height: 22, text: "• Pagos de Impuestos en Línea", fontSize: 13, color: "#cbd5e1", role: "link" }),

      // Columna 3: Transparencia y Normativas
      newElement("rect", col3, { role: "container", x: 516, y: 24, width: 220, height: 210, fill: "transparent", radius: 0 }),
      newElement("text", nextId(), { parentId: col3, x: 0, y: 0, width: 210, height: 24, text: "Transparencia y Normas", fontSize: 14, bold: true, color: "#f8fafc", role: "heading" }),
      newElement("text", nextId(), { parentId: col3, x: 0, y: 32, width: 210, height: 22, text: "• Rendición Pública de Cuentas", fontSize: 13, color: "#cbd5e1", role: "link" }),
      newElement("text", nextId(), { parentId: col3, x: 0, y: 58, width: 210, height: 22, text: "• Gaceta y Decretos Ediles", fontSize: 13, color: "#cbd5e1", role: "link" }),
      newElement("text", nextId(), { parentId: col3, x: 0, y: 84, width: 210, height: 22, text: "• Licitaciones y Convocatorias", fontSize: 13, color: "#cbd5e1", role: "link" }),
      newElement("text", nextId(), { parentId: col3, x: 0, y: 110, width: 210, height: 22, text: "• Presupuesto Participativo", fontSize: 13, color: "#cbd5e1", role: "link" }),

      // Columna 4: Horarios y Contacto Ciudadano
      newElement("rect", col4, { role: "container", x: 762, y: 24, width: 230, height: 210, fill: "transparent", radius: 0 }),
      newElement("text", nextId(), { parentId: col4, x: 0, y: 0, width: 220, height: 24, text: "Horarios y Contacto", fontSize: 14, bold: true, color: "#f8fafc", role: "heading" }),
      newElement("text", nextId(), { parentId: col4, x: 0, y: 32, width: 220, height: 22, text: "Lun a Vie: 08:00 - 16:00", fontSize: 12, color: "#cbd5e1" }),
      newElement("text", nextId(), { parentId: col4, x: 0, y: 58, width: 220, height: 22, text: "Línea Gratuita: 800-14-0200", fontSize: 12, bold: true, color: "#f8fafc" }),
      newElement("text", nextId(), { parentId: col4, x: 0, y: 84, width: 220, height: 22, text: "Plaza 14 de Septiembre, GAMC", fontSize: 12, color: "#94a3b8" }),
      newElement("text", nextId(), { parentId: col4, x: 0, y: 110, width: 220, height: 22, text: "contacto@gamc.gob.bo", fontSize: 12, color: "#f8fafc", role: "link" }),
    ],
    links: {},
  };
}

/**
 * Organiza los elementos de un pie de página en columnas responsivas y limpias (1, 2, 3 o 4 columnas).
 * Limpia y agrupa elementos sueltos o desordenados en contenedores organizados para que no se sobrepongan.
 */
export function organizeFooterIntoColumns(
  def: ComponentDef,
  columnCount: 1 | 2 | 3 | 4 = 3,
  align: "left" | "center" = "left",
): ComponentDef {
  // Descartar backdrops rectangulares que cubren todo el fondo (el fondo va en las clases de la sección)
  const isBackdrop = (e: CanvasElement) =>
    e.kind === "rect" && !e.parentId && !e.text && e.x === 0 && e.y === 0 && e.width >= def.width * 0.85;

  // Extraer todos los elementos con contenido real (textos, enlaces, botones, imágenes)
  const rawContent = def.elements.filter((e) => !isBackdrop(e) && e.role !== "container");

  // Si no hay suficiente contenido, creamos el footer municipal predeterminado
  if (rawContent.length === 0) {
    return createDefaultMunicipalFooter(def.id);
  }

  // Ordenar los elementos existentes de izquierda a derecha y arriba hacia abajo
  const sorted = [...rawContent].sort((a, b) => {
    const colDiff = Math.floor(a.x / 250) - Math.floor(b.x / 250);
    return colDiff !== 0 ? colDiff : a.y - b.y;
  });

  // Si los elementos ya vienen organizados por columnas existentes, preservar sus agrupaciones
  const existingContainers = def.elements.filter((e) => e.role === "container" && !e.parentId);
  let groups: CanvasElement[][] = [];

  if (existingContainers.length > 0) {
    const existingGroups = existingContainers.map((c) =>
      rawContent.filter((el) => el.parentId === c.id).sort((a, b) => a.y - b.y)
    ).filter((g) => g.length > 0);

    if (existingGroups.length === columnCount) {
      groups = existingGroups;
    } else if (existingGroups.length < columnCount) {
      groups = [...existingGroups];
      while (groups.length < columnCount) groups.push([]);
    } else {
      // Si hay más contenedores que columnCount, consolidar manteniendo contigüidad
      groups = Array.from({ length: columnCount }, () => []);
      existingGroups.forEach((eg, idx) => {
        const target = Math.min(idx, columnCount - 1);
        groups[target].push(...eg);
      });
    }
  } else {
    // Dividir en grupos contiguos para que los encabezados permanezcan con sus enlaces
    const chunkSize = Math.ceil(sorted.length / columnCount);
    groups = Array.from({ length: columnCount }, (_, i) =>
      sorted.slice(i * chunkSize, (i + 1) * chunkSize)
    );
  }

  const colWidth = Math.round((def.width - 64 - (columnCount - 1) * 32) / columnCount);
  const newElements: CanvasElement[] = [];

  groups.forEach((group, colIdx) => {
    const colId = crypto.randomUUID();
    const colX = 32 + colIdx * (colWidth + 32);
    let currentY = 0;

    const columnChildren: CanvasElement[] = group.map((el) => {
      const child: CanvasElement = {
        ...el,
        parentId: colId,
        x: 0,
        y: currentY,
        width: Math.min(el.width, colWidth - 10),
        align,
      };
      currentY += el.height + 12;
      return child;
    });

    const colContainer = newElement("rect", colId, {
      role: "container",
      x: colX,
      y: 24,
      width: colWidth,
      height: Math.max(180, currentY + 16),
      fill: "transparent",
      radius: 0,
    });

    newElements.push(colContainer, ...columnChildren);
  });

  const gridClasses =
    columnCount === 1
      ? "flex flex-col items-center justify-center text-center gap-4 p-6 lg:p-10 w-full bg-slate-900 text-slate-200 border-t border-slate-800"
      : columnCount === 2
        ? "grid grid-cols-2 gap-4 sm:gap-6 p-6 lg:p-10 w-full bg-slate-900 text-slate-200 border-t border-slate-800"
        : columnCount === 4
          ? "grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 p-6 lg:p-10 w-full bg-slate-900 text-slate-200 border-t border-slate-800"
          : "grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 p-6 lg:p-10 w-full bg-slate-900 text-slate-200 border-t border-slate-800";

  return {
    ...def,
    elements: newElements,
    height: Math.max(240, ...newElements.filter((e) => !e.parentId).map((c) => c.height + 48)),
    styles: {
      ...def.styles,
      [SECTION_KEY]: {
        classes: gridClasses,
        css: def.styles?.[SECTION_KEY]?.css ?? "",
      },
    },
  };
}

/** Mueve un elemento del footer a otra columna específica. */
export function moveElementToFooterColumn(
  def: ComponentDef,
  elementId: string,
  targetColIndex: number,
): ComponentDef {
  const columns = def.elements.filter((e) => !e.parentId && e.role === "container");
  if (targetColIndex < 0 || targetColIndex >= columns.length) return def;

  const targetCol = columns[targetColIndex];
  const targetColChildren = def.elements.filter((e) => e.parentId === targetCol.id && e.id !== elementId);
  const lastY = targetColChildren.reduce((max, c) => Math.max(max, c.y + c.height + 10), 0);

  const updatedElements = def.elements.map((e) => {
    if (e.id === elementId) {
      return {
        ...e,
        parentId: targetCol.id,
        x: 0,
        y: lastY,
      };
    }
    return e;
  });

  return {
    ...def,
    elements: updatedElements,
  };
}

/** Añade un enlace limpio a una columna del footer. */
export function addLinkToFooterColumn(
  def: ComponentDef,
  columnIdOrIndex: string | number,
  label = "• Nuevo enlace",
): { component: ComponentDef; newLinkId: string } {
  const columns = def.elements.filter((e) => !e.parentId && e.role === "container");
  const targetCol =
    typeof columnIdOrIndex === "number"
      ? columns[columnIdOrIndex] ?? columns[0]
      : columns.find((c) => c.id === columnIdOrIndex) ?? columns[0];

  const newLinkId = crypto.randomUUID();
  if (!targetCol) {
    // Si no hay columnas, reorganizamos primero en 3 columnas
    const organized = organizeFooterIntoColumns(def, 3);
    return addLinkToFooterColumn(organized, 0, label);
  }

  const siblings = def.elements.filter((e) => e.parentId === targetCol.id);
  const lastY = siblings.reduce((max, s) => Math.max(max, s.y + s.height + 10), 0);

  const newLink = newElement("text", newLinkId, {
    parentId: targetCol.id,
    x: 0,
    y: lastY,
    width: Math.max(160, targetCol.width - 20),
    height: 24,
    text: label,
    fontSize: 13,
    color: "#cbd5e1",
    role: "link",
  });

  // Ajustar altura de la columna si es necesario
  const updatedElements = def.elements.map((el) => {
    if (el.id === targetCol.id) {
      return { ...el, height: Math.max(el.height, lastY + 36) };
    }
    return el;
  });

  return {
    component: {
      ...def,
      elements: [...updatedElements, newLink],
    },
    newLinkId,
  };
}

/** Añade un nuevo enlace de navegación a la cabecera (header/navbar). */
export function addLinkToHeader(
  def: ComponentDef,
  label = "Nuevo enlace",
): { component: ComponentDef; newLinkId: string } {
  const newLinkId = crypto.randomUUID();
  const existingLinks = def.elements.filter((e) => e.role === "link" || (e.kind === "text" && e.role !== "heading"));

  let newX = 380;
  let newY = 21;
  if (existingLinks.length > 0) {
    const lastLink = existingLinks[existingLinks.length - 1];
    newX = lastLink.x + lastLink.width + 16;
    newY = lastLink.y;
  }

  const newLink = newElement("text", newLinkId, {
    x: newX,
    y: newY,
    width: 80,
    height: 22,
    text: label,
    fontSize: 14,
    color: "#cbd5e1",
    role: "link",
    align: "center",
  });

  return {
    component: {
      ...def,
      elements: [...def.elements, newLink],
    },
    newLinkId,
  };
}

/** Agrega un botón de buscador ciudadano a la cabecera si no lo tiene. */
export function addSearchButtonToHeader(
  def: ComponentDef,
): { component: ComponentDef; searchId: string } {
  const searchId = crypto.randomUUID();
  const existingButtons = def.elements.filter((e) => e.role === "button");
  let newX = 720;
  let newY = 14;
  if (existingButtons.length > 0) {
    const firstButton = existingButtons[0];
    newX = Math.max(200, firstButton.x - 150);
    newY = firstButton.y;
  }

  const searchBtn = newElement("rect", searchId, {
    role: "button",
    x: newX,
    y: newY,
    width: 140,
    height: 36,
    fill: "#1e293b",
    radius: 8,
    text: "Buscar trámites...",
    color: "#94a3b8",
    fontSize: 12,
    bold: false,
    align: "center",
    control: { kind: "button", name: "search-trigger" },
  });

  return {
    component: {
      ...def,
      elements: [...def.elements, searchBtn],
    },
    searchId,
  };
}

/**
 * Crea una cabecera municipal oficial limpia y moderna con logo (marco Canva con escudo oficial),
 * 4 enlaces de navegación (Transparencia, Proyectos, GAMC, Servicios) y buscador global ciudadano.
 */
export function createDefaultMunicipalHeader(id?: string): ComponentDef {
  const compId = id || crypto.randomUUID();
  let count = 0;
  const nextId = () => `${compId}-e${++count}`;
  const logoId = nextId();
  const link1 = nextId();
  const link2 = nextId();
  const link3 = nextId();
  const link4 = nextId();
  const searchBtn = nextId();

  return {
    id: compId,
    name: "Cabecera Municipal Oficial",
    description: "Barra de navegación institucional con escudo, 4 enlaces y buscador ciudadano",
    category: "navigation",
    width: 1024,
    height: 72,
    custom: true,
    styles: {
      [SECTION_KEY]: {
        classes: "flex items-center justify-between px-6 py-3.5 bg-slate-800 text-slate-100 border-b border-slate-700 w-full shadow-md",
        css: "",
      },
    },
    elements: [
      // Marco para Escudo / Logo (estilo Canva con escudo oficial)
      newElement("ellipse", logoId, {
        role: "image",
        frame: true,
        src: "/login-brand.svg",
        alt: "Escudo Municipal",
        x: 24,
        y: 12,
        width: 48,
        height: 48,
        fill: "#475569",
      }),
      // Enlace 1: Transparencia
      newElement("text", link1, {
        role: "link",
        x: 240,
        y: 24,
        width: 110,
        height: 24,
        text: "Transparencia",
        fontSize: 14,
        color: "#f1f5f9",
        align: "center",
      }),
      // Enlace 2: Proyectos
      newElement("text", link2, {
        role: "link",
        x: 370,
        y: 24,
        width: 90,
        height: 24,
        text: "Proyectos",
        fontSize: 14,
        color: "#f1f5f9",
        align: "center",
      }),
      // Enlace 3: GAMC
      newElement("text", link3, {
        role: "link",
        x: 480,
        y: 24,
        width: 70,
        height: 24,
        text: "GAMC",
        fontSize: 14,
        color: "#f1f5f9",
        align: "center",
      }),
      // Enlace 4: Servicios
      newElement("text", link4, {
        role: "link",
        x: 570,
        y: 24,
        width: 80,
        height: 24,
        text: "Servicios",
        fontSize: 14,
        color: "#f1f5f9",
        align: "center",
      }),
      // Buscador Global Ciudadano (Botón con ícono de lupa)
      newElement("rect", searchBtn, {
        role: "button",
        control: { kind: "button", name: "search-trigger" },
        x: 880,
        y: 16,
        width: 110,
        height: 40,
        fill: "#475569",
        radius: 8,
        text: "Buscar",
        icon: "search",
        color: "#ffffff",
        bold: true,
        align: "center",
      }),
    ],
    links: {},
  };
}

/** Añade un nuevo botón de acción a la cabecera. */
export function addButtonToHeader(
  def: ComponentDef,
  label = "Nuevo botón",
): { component: ComponentDef; newButtonId: string } {
  const newButtonId = crypto.randomUUID();
  const existingButtons = def.elements.filter((e) => e.role === "button");
  const existingLinks = def.elements.filter((e) => e.role === "link");

  let newX = 780;
  let newY = 14;
  if (existingButtons.length > 0) {
    const last = existingButtons[existingButtons.length - 1];
    newX = last.x + last.width + 12;
    newY = last.y;
  } else if (existingLinks.length > 0) {
    const last = existingLinks[existingLinks.length - 1];
    newX = last.x + last.width + 24;
    newY = 14;
  }

  const newBtn = newElement("rect", newButtonId, {
    x: newX,
    y: newY,
    width: 130,
    height: 40,
    text: label,
    fill: "#0d99ff",
    radius: 8,
    color: "#ffffff",
    bold: true,
    role: "button",
    align: "center",
  });

  return {
    component: {
      ...def,
      elements: [...def.elements, newBtn],
    },
    newButtonId,
  };
}

/** Elimina un elemento de la cabecera. */
export function deleteElementFromHeader(def: ComponentDef, elementId: string): ComponentDef {
  return {
    ...def,
    elements: def.elements.filter((e) => e.id !== elementId),
  };
}

