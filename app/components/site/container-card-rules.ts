import { SECTION_KEY, type CanvasElement, type ComponentDef } from "./types.ts";
import { newElement } from "./component-templates.ts";
import { GAMC_BRAND_TOKENS } from "../auth/brand-manual.ts";

export interface ContainerCardInfo {
  id: string;
  title: string;
  elementCount: number;
  fill?: string;
}

/** Encuentra los elementos hijos de una tarjeta, ya sea por parentId explícito o por contención geométrica. */
export function findCardChildren(elements: CanvasElement[], rootId: string): CanvasElement[] {
  const explicit = elements.filter((e) => e.parentId === rootId);
  if (explicit.length > 0) return explicit;

  const rootEl = elements.find((e) => e.id === rootId);
  if (!rootEl || rootEl.kind !== "rect" || rootEl.width < 80 || rootEl.height < 50) return [];

  // Elementos sin parentId cuyo centro está contenido geométricamente dentro del rectángulo
  return elements.filter((e) => {
    if (e.id === rootId || e.parentId) return false;
    const cx = e.x + e.width / 2;
    const cy = e.y + e.height / 2;
    return (
      cx >= rootEl.x - 2 &&
      cx <= rootEl.x + rootEl.width + 2 &&
      cy >= rootEl.y - 2 &&
      cy <= rootEl.y + rootEl.height + 2
    );
  });
}

/** Obtiene las tarjetas y su título descriptivo dentro del componente, soportando tanto auto-layout como tarjetas fijas. */
export function getContainerCards(def: ComponentDef): ContainerCardInfo[] {
  const topRoots = def.elements.filter((e) => !e.parentId);

  // Identificar si hay tarjetas rectangulares contenedoras (con role "container" o rectángulos con hijos)
  const cardsWithChildren = topRoots.filter((root) => {
    if (root.role === "container") return true;
    if (root.id.endsWith("-bg") || root.id.includes("bg-") || (root.role as string) === "background" || root.role === "button") return false;
    if (root.kind === "rect" && root.width >= 100 && root.height >= 60) {
      if (root.width >= def.width * 0.85 && root.height >= def.height * 0.8) return false;
      const kids = findCardChildren(def.elements, root.id);
      return kids.length > 0;
    }
    return false;
  });

  // Solo devolvemos tarjetas si realmente existen en el componente; no convertir cualquier elemento o figura en tarjeta
  const rootsToUse = cardsWithChildren;

  return rootsToUse.map((root, idx) => {
    const children = findCardChildren(def.elements, root.id);
    const heading =
      children.find((c) => c.role === "heading" || (c.kind === "text" && (c.fontSize ?? 16) >= 13)) ??
      children.find((c) => c.kind === "text") ??
      (root.kind === "text" ? root : null);
    const title = heading?.text?.trim() || root.text?.trim() || `Tarjeta ${idx + 1}`;
    return {
      id: root.id,
      title,
      elementCount: 1 + children.length,
      fill: root.fill,
    };
  });
}

/** Encuentra el id de la tarjeta raíz a partir del id de cualquier elemento hijo o de la propia tarjeta. */
export function findRootCardId(elements: CanvasElement[], elementId: string): string {
  const el = elements.find((e) => e.id === elementId);
  if (!el) return elementId;
  if (el.parentId) return findRootCardId(elements, el.parentId);

  // Si no tiene parentId explícito, verificar si está dentro de algún contenedor de tarjeta real (no fondos ni formas generales)
  const container = elements.find((candidate) => {
    if (candidate.id === elementId || candidate.kind !== "rect" || candidate.parentId) return false;
    if (candidate.id.endsWith("-bg") || candidate.id.includes("bg-") || (candidate.role as string) === "background") return false;
    if (candidate.width < 100 || candidate.height < 60) return false;
    if (candidate.width >= 900 && candidate.height >= 500) return false;
    if (candidate.width * candidate.height <= el.width * el.height && candidate.kind === el.kind) return false;
    const cx = el.x + el.width / 2;
    const cy = el.y + el.height / 2;
    return (
      cx >= candidate.x - 2 &&
      cx <= candidate.x + candidate.width + 2 &&
      cy >= candidate.y - 2 &&
      cy <= candidate.y + candidate.height + 2
    );
  });

  return container ? container.id : el.id;
}

/** Duplica una tarjeta y todos sus hijos dentro del componente, acomodándola limpiamente sin sobreponer. */
export function duplicateCardInComponent(
  def: ComponentDef,
  cardElementId: string,
): { component: ComponentDef; newCardId: string } {
  const rootId = findRootCardId(def.elements, cardElementId);
  const rootEl = def.elements.find((e) => e.id === rootId);
  if (!rootEl) return { component: def, newCardId: cardElementId };

  const children = findCardChildren(def.elements, rootId);
  const newRootId = crypto.randomUUID();

  // Calcular la posición óptima de la nueva tarjeta:
  // Detectar tarjetas hermanas de tamaño similar en la misma sección
  const siblingCards = def.elements.filter(
    (e) => !e.parentId && e.kind === rootEl.kind && Math.abs(e.width - rootEl.width) <= 40 && Math.abs(e.height - rootEl.height) <= 40,
  );

  let nextX = rootEl.x + 24;
  let nextY = rootEl.y;

  if (siblingCards.length > 0) {
    // Ordenar de arriba a abajo y de izquierda a derecha
    siblingCards.sort((a, b) => (Math.abs(a.y - b.y) > 10 ? a.y - b.y : a.x - b.x));
    const lastSibling = siblingCards[siblingCards.length - 1];
    const firstSibling = siblingCards[0];

    // Detectar separación (gap) horizontal típica
    let gap = 16;
    const firstRowCards = siblingCards.filter((c) => Math.abs(c.y - firstSibling.y) <= 10);
    if (firstRowCards.length >= 2) {
      firstRowCards.sort((a, b) => a.x - b.x);
      gap = Math.max(8, firstRowCards[1].x - (firstRowCards[0].x + firstRowCards[0].width));
    }

    const candidateX = lastSibling.x + lastSibling.width + gap;
    // Si cabe en la misma fila:
    if (candidateX + rootEl.width <= def.width - 16) {
      nextX = candidateX;
      nextY = lastSibling.y;
    } else {
      // Salta a la siguiente fila limpiamente (para tener 6, 7, 8 o más tarjetas sin salirse)
      nextX = firstSibling.x;
      nextY = lastSibling.y + lastSibling.height + Math.max(16, gap);
    }
  }

  const deltaX = nextX - rootEl.x;
  const deltaY = nextY - rootEl.y;

  const clonedRoot: CanvasElement = {
    ...rootEl,
    id: newRootId,
    x: nextX,
    y: nextY,
  };

  const clonedChildren: CanvasElement[] = children.map((c) => ({
    ...c,
    id: crypto.randomUUID(),
    parentId: newRootId,
    x: c.x + deltaX,
    y: c.y + deltaY,
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

  // Agrandar la altura del componente si la nueva fila sobrepasa la dimensión
  const newHeight = Math.max(def.height, nextY + rootEl.height + 24);

  return {
    component: {
      ...def,
      height: newHeight,
      elements: newElements,
    },
    newCardId: newRootId,
  };
}

/** Agrega una nueva tarjeta limpia y estilizada al contenedor respetando las reglas y colores institucionales. */
export function addCardToComponent(
  def: ComponentDef,
  customTitle?: string,
): { component: ComponentDef; newCardId: string } {
  const existingCards = getContainerCards(def);
  const index = existingCards.length;
  const newCardId = crypto.randomUUID();
  const title = customTitle || `Tarjeta ${index + 1}`;

  // Si el componente ya tiene tarjetas existentes, adaptamos tamaño, posición y heredamos su estilo institucional
  if (existingCards.length > 0) {
    const lastCardInfo = existingCards[existingCards.length - 1];
    const lastRootEl = def.elements.find((e) => e.id === lastCardInfo.id);
    const lastKids = findCardChildren(def.elements, lastCardInfo.id);

    if (lastRootEl) {
      // Calcular la posición óptima de la nueva tarjeta (misma fila o saltando a la siguiente si está llena)
      const siblingCards = def.elements.filter(
        (e) => !e.parentId && e.kind === lastRootEl.kind && Math.abs(e.width - lastRootEl.width) <= 40 && Math.abs(e.height - lastRootEl.height) <= 40,
      );

      let nextX = lastRootEl.x + 24;
      let nextY = lastRootEl.y;

      if (siblingCards.length > 0) {
        siblingCards.sort((a, b) => (Math.abs(a.y - b.y) > 10 ? a.y - b.y : a.x - b.x));
        const lastSibling = siblingCards[siblingCards.length - 1];
        const firstSibling = siblingCards[0];

        let gap = 16;
        const firstRowCards = siblingCards.filter((c) => Math.abs(c.y - firstSibling.y) <= 10);
        if (firstRowCards.length >= 2) {
          firstRowCards.sort((a, b) => a.x - b.x);
          gap = Math.max(8, firstRowCards[1].x - (firstRowCards[0].x + firstRowCards[0].width));
        }

        const candidateX = lastSibling.x + lastSibling.width + gap;
        if (candidateX + lastRootEl.width <= def.width - 16) {
          nextX = candidateX;
          nextY = lastSibling.y;
        } else {
          // Salta a la siguiente fila
          nextX = firstSibling.x;
          nextY = lastSibling.y + lastSibling.height + Math.max(16, gap);
        }
      }

      const deltaX = nextX - lastRootEl.x;
      const deltaY = nextY - lastRootEl.y;

      // Heredar el estilo visual de la tarjeta existente para mantener consistencia institucional
      const cardFill = lastRootEl.fill ?? GAMC_BRAND_TOKENS.bgMain;

      const newCardRoot: CanvasElement = {
        ...lastRootEl,
        id: newCardId,
        x: nextX,
        y: nextY,
        fill: cardFill,
      };

      // Si la tarjeta previa tenía hijos, adaptamos la estructura con textos limpios y estilos heredados
      let newChildren: CanvasElement[] = [];
      if (lastKids.length > 0) {
        newChildren = lastKids.map((kid) => {
          const kidId = crypto.randomUUID();
          let newText = kid.text;
          if (kid.role === "heading" || (kid.kind === "text" && (kid.fontSize ?? 16) >= 13)) {
            newText = title;
          } else if (kid.kind === "text" && (kid.text === "ENLACE EXTERNO" || kid.text === "TRÁMITE")) {
            newText = "TRÁMITE";
          } else if (kid.kind === "text" && (kid.fontSize ?? 16) < 13 && kid.text) {
            newText = "Descripción del nuevo servicio o trámite.";
          }
          return {
            ...kid,
            id: kidId,
            parentId: newCardId,
            x: kid.x + deltaX,
            y: kid.y + deltaY,
            text: newText,
          };
        });
      } else {
        newChildren.push(
          newElement("text", crypto.randomUUID(), {
            parentId: newCardId,
            role: "heading",
            x: nextX + 16,
            y: nextY + 16,
            width: lastRootEl.width - 32,
            height: 26,
            text: title,
            fontSize: 16,
            bold: true,
            color: GAMC_BRAND_TOKENS.textPrimary,
          }),
        );
      }

      const cardGroupIds = new Set([lastRootEl.id, ...lastKids.map((c) => c.id)]);
      let lastIndex = -1;
      for (let i = 0; i < def.elements.length; i++) {
        if (cardGroupIds.has(def.elements[i].id)) {
          lastIndex = i;
        }
      }

      const insertIndex = lastIndex >= 0 ? lastIndex + 1 : def.elements.length;
      const newElements = [
        ...def.elements.slice(0, insertIndex),
        newCardRoot,
        ...newChildren,
        ...def.elements.slice(insertIndex),
      ];

      const newHeight = Math.max(def.height, nextY + lastRootEl.height + 24);

      return {
        component: {
          ...def,
          height: newHeight,
          elements: newElements,
        },
        newCardId,
      };
    }
  }

  // Plantilla predeterminada con estilos del manual de marca institucional GAMC
  const containerCard = newElement("rect", newCardId, {
    role: "container",
    x: 0,
    y: 0,
    width: 240,
    height: 190,
    fill: GAMC_BRAND_TOKENS.bgMain,
    borderWidth: 1,
    borderColor: GAMC_BRAND_TOKENS.borderSubtle,
    radius: 12,
  });

  const iconElement = newElement("rect", crypto.randomUUID(), {
    parentId: newCardId,
    x: 16,
    y: 16,
    width: 40,
    height: 40,
    fill: GAMC_BRAND_TOKENS.primaryTint,
    radius: 8,
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
    color: GAMC_BRAND_TOKENS.textPrimary,
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
    color: GAMC_BRAND_TOKENS.textSecondary,
  });

  return {
    component: {
      ...def,
      elements: [...def.elements, containerCard, iconElement, titleElement, descElement],
    },
    newCardId,
  };
}

/** Elimina una tarjeta y todos sus hijos dentro del componente, adaptando la altura del bloque al contenido restante. */
export function deleteCardFromComponent(def: ComponentDef, cardElementId: string): ComponentDef {
  const rootId = findRootCardId(def.elements, cardElementId);
  const children = findCardChildren(def.elements, rootId);
  const toDelete = new Set([rootId, ...children.map((c) => c.id)]);

  const remaining = def.elements.filter((e) => !toDelete.has(e.id));

  // Recalcular la altura adaptada del bloque según los elementos restantes
  let adaptedHeight = def.height;
  if (remaining.length > 0) {
    const maxBottom = remaining.reduce((max, el) => Math.max(max, el.y + el.height), 0);
    if (maxBottom > 0) {
      adaptedHeight = Math.max(120, maxBottom + 24);
    }
  }

  return {
    ...def,
    height: adaptedHeight,
    elements: remaining,
  };
}

/** Rellena el componente con N tarjetas pre-diseñadas (3, 4, 5 o más). */
export function fillComponentWithCards(def: ComponentDef, count = 3): ComponentDef {
  const items = [
    { title: "Atención Vecinal", desc: "Consultas y trámites digitales en línea.", color: "#00A7D6" },
    { title: "Pagos y Tributos", desc: "Pago seguro y al día de contribuciones.", color: "#0DA593" },
    { title: "Seguridad y Apoyo", desc: "Canales de contacto y asistencia 24/7.", color: "#462D81" },
    { title: "Gaceta y Normas", desc: "Leyes, decretos y resoluciones municipales.", color: "#34C3E8" },
    { title: "Plataformas Digitales", desc: "Sistemas en línea para trámites ciudadanos.", color: "#F47B38" },
    { title: "Transparencia", desc: "Rendición de cuentas e información pública.", color: "#00A7D6" },
  ];

  const takeItems = items.slice(0, Math.min(count, items.length));
  const newElements: CanvasElement[] = [];

  for (let i = 0; i < count; i++) {
    const item = takeItems[i % takeItems.length];
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

/** Rellena el componente con 3 tarjetas pre-diseñadas para contenedor horizontal. */
export function fillComponentWithThreeCards(def: ComponentDef): ComponentDef {
  return fillComponentWithCards(def, 3);
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
    fill: isSecondary ? "#f8fafc" : "#00A7D6",
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
    name: "Portal · Cierre institucional",
    description: "Cierre institucional en 4 columnas limpias con escudo, trámites, normas y contacto",
    category: "navigation",
    width: 1024,
    height: 240,
    custom: true,
    styles: {
      [SECTION_KEY]: {
        classes: "w-full",
        css: "",
      },
    },
    elements: [
      newElement("rect", nextId(), { role: "none", x: 0, y: 0, width: 1024, height: 240, fill: "#0f172a", radius: 0 }),
      newElement("rect", nextId(), { role: "none", x: 0, y: 0, width: 1024, height: 2, fill: "#1e293b", radius: 0 }),

      // Columna 1: Logo municipal e Identidad
      newElement("rect", col1, { role: "container", x: 40, y: 28, width: 220, height: 190, fill: "transparent", radius: 0 }),
      newElement("ellipse", nextId(), { parentId: col1, role: "image", frame: true, src: "/logo-municipal.png", alt: "Escudo GAMC", x: 0, y: 0, width: 44, height: 44, fill: "#1e293b", radius: 8 }),
      newElement("text", nextId(), { parentId: col1, role: "heading", x: 0, y: 52, width: 210, height: 22, text: "Gobierno Autónomo Municipal", fontSize: 14, bold: true, color: "#ffffff" }),
      newElement("text", nextId(), { parentId: col1, role: "text", x: 0, y: 78, width: 210, height: 38, text: "Portal oficial de trámites, servicios y participación ciudadana.", fontSize: 11, color: "#94a3b8" }),
      newElement("text", nextId(), { parentId: col1, role: "text", x: 0, y: 124, width: 210, height: 20, text: "© 2026 GAMC. Cochabamba, Bolivia.", fontSize: 10, color: "#64748b" }),

      // Columna 2: Trámites y Servicios
      newElement("rect", col2, { role: "container", x: 285, y: 28, width: 210, height: 190, fill: "transparent", radius: 0 }),
      newElement("text", nextId(), { parentId: col2, role: "heading", x: 0, y: 0, width: 195, height: 22, text: "Trámites y Servicios", fontSize: 13, bold: true, color: "#f8fafc" }),
      newElement("text", nextId(), { parentId: col2, role: "link", x: 0, y: 28, width: 195, height: 20, text: "• Ventanilla Única Digital", fontSize: 12, color: "#cbd5e1" }),
      newElement("text", nextId(), { parentId: col2, role: "link", x: 0, y: 52, width: 195, height: 20, text: "• Catastro y Territorio", fontSize: 12, color: "#cbd5e1" }),
      newElement("text", nextId(), { parentId: col2, role: "link", x: 0, y: 76, width: 195, height: 20, text: "• Licencias de Actividades", fontSize: 12, color: "#cbd5e1" }),
      newElement("text", nextId(), { parentId: col2, role: "link", x: 0, y: 100, width: 195, height: 20, text: "• Pagos de Impuestos en Línea", fontSize: 12, color: "#cbd5e1" }),
      newElement("text", nextId(), { parentId: col2, role: "link", x: 0, y: 124, width: 195, height: 20, text: "• Seguimiento de Trámites", fontSize: 12, color: "#cbd5e1" }),

      // Columna 3: Transparencia y Normativas
      newElement("rect", col3, { role: "container", x: 525, y: 28, width: 210, height: 190, fill: "transparent", radius: 0 }),
      newElement("text", nextId(), { parentId: col3, role: "heading", x: 0, y: 0, width: 195, height: 22, text: "Transparencia y Normas", fontSize: 13, bold: true, color: "#f8fafc" }),
      newElement("text", nextId(), { parentId: col3, role: "link", x: 0, y: 28, width: 195, height: 20, text: "• Rendición Pública de Cuentas", fontSize: 12, color: "#cbd5e1" }),
      newElement("text", nextId(), { parentId: col3, role: "link", x: 0, y: 52, width: 195, height: 20, text: "• Gaceta y Decretos Ediles", fontSize: 12, color: "#cbd5e1" }),
      newElement("text", nextId(), { parentId: col3, role: "link", x: 0, y: 76, width: 195, height: 20, text: "• Licitaciones y Convocatorias", fontSize: 12, color: "#cbd5e1" }),
      newElement("text", nextId(), { parentId: col3, role: "link", x: 0, y: 100, width: 195, height: 20, text: "• Presupuesto Participativo", fontSize: 12, color: "#cbd5e1" }),
      newElement("text", nextId(), { parentId: col3, role: "link", x: 0, y: 124, width: 195, height: 20, text: "• Marco Normativo Municipal", fontSize: 12, color: "#cbd5e1" }),

      // Columna 4: Horarios y Contacto Ciudadano
      newElement("rect", col4, { role: "container", x: 765, y: 28, width: 230, height: 190, fill: "transparent", radius: 0 }),
      newElement("text", nextId(), { parentId: col4, role: "heading", x: 0, y: 0, width: 215, height: 22, text: "Horarios y Contacto", fontSize: 13, bold: true, color: "#f8fafc" }),
      newElement("text", nextId(), { parentId: col4, role: "text", x: 0, y: 28, width: 215, height: 20, text: "Lun a Vie: 08:00 - 16:00", fontSize: 12, color: "#cbd5e1" }),
      newElement("text", nextId(), { parentId: col4, role: "text", x: 0, y: 52, width: 215, height: 20, text: "Línea Gratuita: 800-14-0200", fontSize: 12, bold: true, color: "#f8fafc" }),
      newElement("text", nextId(), { parentId: col4, role: "text", x: 0, y: 76, width: 215, height: 20, text: "Plaza 14 de Septiembre, GAMC", fontSize: 12, color: "#94a3b8" }),
      newElement("text", nextId(), { parentId: col4, role: "link", x: 0, y: 100, width: 215, height: 20, text: "contacto@gamc.gob.bo", fontSize: 12, color: "#34C3E8" }),
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

  return {
    id: compId,
    name: "Encabezado del portal",
    description: "Barra de navegación institucional con degradado oficial de la marca, enlaces y buscador ciudadano",
    category: "navigation",
    width: 1024,
    height: 88,
    custom: true,
    styles: {
      [SECTION_KEY]: {
        classes: "flex items-center justify-between px-6 py-3.5 text-white w-full shadow-md",
        css: "background: linear-gradient(100deg, var(--color-celeste-oscuro) 0%, var(--color-primario) 100%);",
      },
    },
    elements: [
      newElement("rect", nextId(), { role: "none", x: 0, y: 0, width: 1024, height: 88, fill: "linear-gradient(100deg, var(--color-celeste-oscuro) 0%, var(--color-primario) 100%)", radius: 0 }),
      newElement("rect", nextId(), { role: "none", x: 0, y: 71, width: 1024, height: 1, fill: "#e5e7eb", radius: 0 }),
      newElement("ellipse", nextId(), {
        role: "image",
        frame: true,
        src: "/logo-municipal.png",
        alt: "Escudo Municipal",
        x: 21,
        y: 14,
        width: 44,
        height: 44,
        fill: "#86cdea",
        radius: 8,
      }),
      newElement("text", nextId(), {
        role: "heading",
        x: 73,
        y: 17,
        width: 160,
        height: 20,
        text: "COCHABAMBA",
        fontSize: 16,
        color: "#ffffff",
        bold: true,
      }),
      newElement("text", nextId(), {
        role: "text",
        x: 73,
        y: 38,
        width: 160,
        height: 14,
        text: "Gobierno de la Ciudad",
        fontSize: 10,
        color: "#E6F6FB",
      }),
      newElement("text", nextId(), { role: "link", x: 240, y: 29, width: 110, height: 16, text: "Trámites y Leyes", fontSize: 12, color: "#ffffff" }),
      newElement("text", nextId(), { role: "link", x: 364, y: 29, width: 80, height: 16, text: "Cocha Unida", fontSize: 12, color: "#ffffff" }),
      newElement("text", nextId(), { role: "link", x: 458, y: 29, width: 45, height: 16, text: "GAMC", fontSize: 12, color: "#ffffff" }),
      newElement("text", nextId(), { role: "link", x: 518, y: 29, width: 60, height: 16, text: "Noticias", fontSize: 12, color: "#ffffff" }),
      newElement("text", nextId(), { role: "link", x: 592, y: 29, width: 175, height: 16, text: "Gabinete de Transparencia", fontSize: 12, color: "#ffffff" }),
      newElement("text", nextId(), { role: "link", x: 782, y: 29, width: 65, height: 16, text: "Servicios", fontSize: 12, color: "#ffffff" }),
      newElement("rect", nextId(), {
        role: "button",
        control: { kind: "button", name: "search-trigger" },
        x: 960,
        y: 19,
        width: 34,
        height: 34,
        fill: "rgba(255, 255, 255, 0.2)",
        radius: 8,
        text: "⌕",
        icon: "search",
        color: "#ffffff",
        bold: true,
        align: "center",
        fontSize: 16,
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
    fill: "#ffffff",
    radius: 8,
    color: "#008BB3",
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

/**
 * Crea una sección Hero para la página de Buscador Municipal con título, descripción,
 * caja de búsqueda interactiva y botones de acceso rápido que abren el buscador modal.
 */
export function createMunicipalSearchHero(id?: string): ComponentDef {
  const compId = id || crypto.randomUUID();
  let count = 0;
  const nextId = () => `${compId}-e${++count}`;

  return {
    id: compId,
    name: "Portal · Buscador Hero",
    description: "Cabecera institucional con barra de búsqueda rápida y disparador del buscador modal de trámites",
    category: "sections",
    width: 1024,
    height: 250,
    custom: true,
    styles: {
      [SECTION_KEY]: {
        classes: "w-full py-8 px-6",
        css: "background: linear-gradient(100deg, var(--color-celeste-oscuro) 0%, var(--color-primario) 100%);",
      },
    },
    elements: [
      newElement("rect", nextId(), {
        role: "none",
        x: 0,
        y: 0,
        width: 1024,
        height: 250,
        fill: "linear-gradient(100deg, var(--color-celeste-oscuro) 0%, var(--color-primario) 100%)",
        radius: 0,
      }),
      newElement("text", nextId(), {
        role: "heading",
        x: 32,
        y: 20,
        width: 450,
        height: 16,
        text: "PORTAL DE ATENCIÓN Y TRÁMITES GAMC",
        fontSize: 11,
        color: "#E6F6FB",
        bold: true,
      }),
      newElement("text", nextId(), {
        role: "heading",
        x: 32,
        y: 42,
        width: 720,
        height: 38,
        text: "Buscador de Trámites y Servicios",
        fontSize: 32,
        color: "#ffffff",
        bold: true,
      }),
      newElement("text", nextId(), {
        role: "text",
        x: 32,
        y: 86,
        width: 760,
        height: 22,
        text: "Encuentra trámites digitales, licencias, catastro, salud y atención ciudadana de Cochabamba.",
        fontSize: 14,
        color: "#e2e8f0",
      }),
      // Input funcional de búsqueda interactiva
      newElement("rect", nextId(), {
        role: "none",
        control: {
          kind: "input",
          inputType: "search",
          name: "search-query",
          placeholder: "¿Qué trámite o servicio estás buscando? (Ej. licencias, catastro, RUAT...)",
        },
        x: 32,
        y: 122,
        width: 610,
        height: 48,
        fill: "#ffffff",
        color: "#0f172a",
        radius: 8,
        fontSize: 14,
      }),
      // Botón de búsqueda modal
      newElement("rect", nextId(), {
        role: "button",
        control: { kind: "button", name: "search-trigger" },
        x: 654,
        y: 122,
        width: 170,
        height: 48,
        fill: "#ffffff",
        radius: 8,
        text: "Buscar trámites",
        color: "#008BB3",
        bold: true,
        fontSize: 14,
        align: "center",
      }),
      // Sugerencias rápidas
      newElement("text", nextId(), {
        role: "text",
        x: 32,
        y: 188,
        width: 130,
        height: 20,
        text: "Búsquedas rápidas:",
        fontSize: 11,
        color: "#e2e8f0",
        bold: true,
      }),
      newElement("rect", nextId(), {
        role: "button",
        control: { kind: "button", name: "search-trigger" },
        x: 164,
        y: 184,
        width: 115,
        height: 28,
        fill: "rgba(255, 255, 255, 0.18)",
        radius: 6,
        text: "Ventanilla Única",
        color: "#ffffff",
        fontSize: 11,
        bold: true,
        align: "center",
      }),
      newElement("rect", nextId(), {
        role: "button",
        control: { kind: "button", name: "search-trigger" },
        x: 287,
        y: 184,
        width: 80,
        height: 28,
        fill: "rgba(255, 255, 255, 0.18)",
        radius: 6,
        text: "Licencias",
        color: "#ffffff",
        fontSize: 11,
        bold: true,
        align: "center",
      }),
      newElement("rect", nextId(), {
        role: "button",
        control: { kind: "button", name: "search-trigger" },
        x: 375,
        y: 184,
        width: 80,
        height: 28,
        fill: "rgba(255, 255, 255, 0.18)",
        radius: 6,
        text: "Catastro",
        color: "#ffffff",
        fontSize: 11,
        bold: true,
        align: "center",
      }),
      newElement("rect", nextId(), {
        role: "button",
        control: { kind: "button", name: "search-trigger" },
        x: 463,
        y: 184,
        width: 115,
        height: 28,
        fill: "rgba(255, 255, 255, 0.18)",
        radius: 6,
        text: "Impuestos RUAT",
        color: "#ffffff",
        fontSize: 11,
        bold: true,
        align: "center",
      }),
      newElement("rect", nextId(), {
        role: "button",
        control: { kind: "button", name: "search-trigger" },
        x: 586,
        y: 184,
        width: 95,
        height: 28,
        fill: "rgba(255, 255, 255, 0.18)",
        radius: 6,
        text: "Salud GAMC",
        color: "#ffffff",
        fontSize: 11,
        bold: true,
        align: "center",
      }),
      newElement("rect", nextId(), {
        role: "button",
        control: { kind: "button", name: "search-trigger" },
        x: 689,
        y: 184,
        width: 125,
        height: 28,
        fill: "rgba(255, 255, 255, 0.18)",
        radius: 6,
        text: "Emergencias 151",
        color: "#ffffff",
        fontSize: 11,
        bold: true,
        align: "center",
      }),
    ],
    links: {},
  };
}

/**
 * Crea una lista / directorio de trámites y servicios municipales en tarjetas,
 * organizada con categorías, descripciones y disparadores de búsqueda y navegación.
 */
export function createMunicipalSearchList(id?: string): ComponentDef {
  const compId = id || crypto.randomUUID();
  let count = 0;
  const nextId = () => `${compId}-e${++count}`;

  const cardsData = [
    {
      category: "Trámite",
      badgeFill: "#E6F6FB",
      badgeColor: "#00A7D6",
      title: "Ventanilla Única Digital (SITRAM)",
      desc: "Ingreso de correspondencia ciudadana, licencias y seguimiento en tiempo real con hoja de ruta municipal.",
      btnText: "Iniciar trámite →",
    },
    {
      category: "Trámite",
      badgeFill: "#E6F6FB",
      badgeColor: "#00A7D6",
      title: "Catastro y Certificación Territorial",
      desc: "Emisión de certificados catastrales, aprobación de planos de loteamiento y registro de bienes inmuebles.",
      btnText: "Consultar catastro →",
    },
    {
      category: "Trámite",
      badgeFill: "#E6F6FB",
      badgeColor: "#00A7D6",
      title: "Licencias de Funcionamiento",
      desc: "Apertura y renovación de actividades económicas comerciales, industriales y de servicios en Cochabamba.",
      btnText: "Requisitos de licencia →",
    },
    {
      category: "Trámite",
      badgeFill: "#E6F6FB",
      badgeColor: "#00A7D6",
      title: "Pago de Impuestos y Patentes (RUAT)",
      desc: "Liquidación y cobro de impuestos sobre vehículos automotores, inmuebles y patentes con descuentos oficiales.",
      btnText: "Pagar en línea →",
    },
    {
      category: "Servicio",
      badgeFill: "#E6F7F5",
      badgeColor: "#0DA593",
      title: "Salud Municipal y Farmacias GAMC",
      desc: "Red de centros de salud municipal, postas médicas barriales y acceso a medicamentos esenciales a costo social.",
      btnText: "Ver centros de salud →",
    },
    {
      category: "Contacto",
      badgeFill: "#F3F0FA",
      badgeColor: "#462D81",
      title: "Líneas de Emergencia y Atención 24/7",
      desc: "Línea Gratuita 800-14-0200, Ambulancias SEM 151, Defensoría de la Niñez 156 y Guardia Municipal.",
      btnText: "Llamar a emergencias →",
    },
  ];

  const elements: CanvasElement[] = [
    newElement("rect", nextId(), { role: "none", x: 0, y: 0, width: 1024, height: 580, fill: "#ffffff", radius: 0 }),
    newElement("text", nextId(), {
      role: "heading",
      x: 32,
      y: 20,
      width: 600,
      height: 28,
      text: "Trámites y Servicios Disponibles",
      fontSize: 22,
      color: "#0f172a",
      bold: true,
    }),
    newElement("text", nextId(), {
      role: "text",
      x: 32,
      y: 52,
      width: 750,
      height: 20,
      text: "Consulta los requisitos, aranceles y canales oficiales de atención municipal en Cochabamba.",
      fontSize: 13,
      color: "#64748b",
    }),
  ];

  const colWidth = 464;
  const cardHeight = 140;
  const leftX = 32;
  const rightX = 528;
  const startY = 88;
  const gapY = 16;

  cardsData.forEach((item, index) => {
    const row = Math.floor(index / 2);
    const isRight = index % 2 === 1;
    const x = isRight ? rightX : leftX;
    const y = startY + row * (cardHeight + gapY);

    const cardContainerId = nextId();
    elements.push(
      newElement("rect", cardContainerId, {
        role: "container",
        x,
        y,
        width: colWidth,
        height: cardHeight,
        fill: "#f8fafc",
        radius: 8,
      }),
      newElement("rect", nextId(), {
        role: "none",
        parentId: cardContainerId,
        x: x + 16,
        y: y + 16,
        width: 65,
        height: 20,
        fill: item.badgeFill,
        radius: 4,
        text: item.category,
        color: item.badgeColor,
        bold: true,
        fontSize: 10,
        align: "center",
      }),
      newElement("text", nextId(), {
        role: "heading",
        parentId: cardContainerId,
        x: x + 88,
        y: y + 16,
        width: colWidth - 104,
        height: 20,
        text: item.title,
        fontSize: 14,
        color: "#0f172a",
        bold: true,
      }),
      newElement("text", nextId(), {
        role: "text",
        parentId: cardContainerId,
        x: x + 16,
        y: y + 44,
        width: colWidth - 32,
        height: 48,
        text: item.desc,
        fontSize: 12,
        color: "#64748b",
      }),
      newElement("rect", nextId(), {
        role: "button",
        parentId: cardContainerId,
        control: { kind: "button", name: "search-trigger" },
        x: x + 16,
        y: y + 96,
        width: 160,
        height: 28,
        fill: "#00A7D6",
        radius: 6,
        text: item.btnText,
        color: "#ffffff",
        bold: true,
        fontSize: 11,
        align: "center",
      }),
    );
  });

  return {
    id: compId,
    name: "Portal · Lista de Trámites y Servicios",
    description: "Catálogo y lista organizada de trámites, servicios y consultas ciudadanas",
    category: "cards",
    width: 1024,
    height: 580,
    custom: true,
    styles: {
      [SECTION_KEY]: {
        classes: "w-full py-8 px-6 bg-white",
        css: "",
      },
    },
    elements,
    links: {},
  };
}

/**
 * Sección «Trámites y Leyes»: tres seleccionables cambian las cards visibles, con minibuscador y lista de fechas.
 * Los seleccionables son un grupo de radio (estado nativo), así que el resaltado y el filtrado funcionan también en el
 * sitio publicado sin código en un iframe. «opcion 1» muestra los dos decretos; las otras dos, uno cada una.
 */
export function createTramitesLeyesDecretos(id?: string): ComponentDef {
  const compId = id || crypto.randomUUID();
  const el = (suffix: string) => `${compId}-${suffix}`;

  const card = (
    prefix: string,
    x: number,
    y: number,
    kindText?: string,
    titleText = "Título",
    bodyText = "Información",
    dateText = "Fecha",
  ) => {
    const cardId = el(`${prefix}-card`);
    const cardWidth = 304;
    const cardHeight = 220;
    const pad = 16;
    const innerWidth = cardWidth - pad * 2;
    const optMatch = prefix.match(/opt\d+/);
    const resolvedKind =
      kindText ||
      (optMatch
        ? optMatch[0] === "opt1"
          ? "Decretos"
          : optMatch[0] === "opt2"
            ? "Leyes"
            : "Normativas"
        : "Categoría");

    return [
      newElement("rect", cardId, { role: "container", x, y, width: cardWidth, height: cardHeight, fill: "#ffffff", radius: 12 }),
      newElement("text", el(`${prefix}-kind`), { role: "text", parentId: cardId, x: x + pad, y: y + 16, width: innerWidth, height: 18, text: resolvedKind, fontSize: 12, bold: true, color: "#00A7D6" }),
      newElement("text", el(`${prefix}-title`), { role: "heading", parentId: cardId, x: x + pad, y: y + 38, width: innerWidth, height: 24, text: titleText, fontSize: 16, bold: true, color: "#0f172a" }),
      newElement("text", el(`${prefix}-body`), { role: "text", parentId: cardId, x: x + pad, y: y + 66, width: innerWidth, height: 56, text: bodyText, fontSize: 13, color: "#475569" }),
      newElement("text", el(`${prefix}-date`), { role: "text", parentId: cardId, x: x + pad, y: y + 128, width: innerWidth, height: 18, text: dateText, fontSize: 12, color: "#64748b" }),
      newElement("rect", el(`${prefix}-btn`), { role: "button", parentId: cardId, control: { kind: "button", name: "abrir-pdf" }, x: x + pad, y: y + 156, width: innerWidth, height: 38, fill: "#00A7D6", radius: 8, text: "Abrir PDF", color: "#ffffff", bold: true, fontSize: 13, align: "center" }),
    ];
  };

  return {
    id: compId,
    name: "Portal · Trámites y Leyes — Decretos",
    description: "Tres seleccionables interactivos con cards dedicadas para Decretos, Leyes y Normativas",
    category: "sections",
    width: 1024,
    height: 480,
    custom: true,
    styles: {
      [SECTION_KEY]: {
        classes: "w-full py-6 px-6 bg-slate-50",
        css: [
          `& [data-el*="-opt"] { display: none !important; }`,
          `&:not([data-active-option]) [data-el*="-opt1-"] { display: block !important; }`,
          `&:has(input[value="opcion 2"]:checked) [data-el*="-opt1-"], &:has(input[value="Leyes"]:checked) [data-el*="-opt1-"], &[data-active-option="opt2"] [data-el*="-opt1-"], :where([data-active-option="opt2"]) [data-el*="-opt1-"] { display: none !important; }`,
          `&:has(input[value="opcion 2"]:checked) [data-el*="-opt3-"], &:has(input[value="Leyes"]:checked) [data-el*="-opt3-"], &[data-active-option="opt2"] [data-el*="-opt3-"], :where([data-active-option="opt2"]) [data-el*="-opt3-"] { display: none !important; }`,
          `&:has(input[value="opcion 2"]:checked) [data-el*="-opt2-"], &:has(input[value="Leyes"]:checked) [data-el*="-opt2-"], &[data-active-option="opt2"] [data-el*="-opt2-"], :where([data-active-option="opt2"]) [data-el*="-opt2-"] { display: block !important; }`,
          `&:has(input[value="opcion 3"]:checked) [data-el*="-opt1-"], &:has(input[value="Normativas"]:checked) [data-el*="-opt1-"], &[data-active-option="opt3"] [data-el*="-opt1-"], :where([data-active-option="opt3"]) [data-el*="-opt1-"] { display: none !important; }`,
          `&:has(input[value="opcion 3"]:checked) [data-el*="-opt2-"], &:has(input[value="Normativas"]:checked) [data-el*="-opt2-"], &[data-active-option="opt3"] [data-el*="-opt2-"], :where([data-active-option="opt3"]) [data-el*="-opt2-"] { display: none !important; }`,
          `&:has(input[value="opcion 3"]:checked) [data-el*="-opt3-"], &:has(input[value="Normativas"]:checked) [data-el*="-opt3-"], &[data-active-option="opt3"] [data-el*="-opt3-"], :where([data-active-option="opt3"]) [data-el*="-opt3-"] { display: block !important; }`,
          ...Array.from({ length: 12 }, (_, i) => `&[data-active-option="opt${i + 1}"] [data-el*="-opt${i + 1}-"], :where([data-active-option="opt${i + 1}"]) [data-el*="-opt${i + 1}-"] { display: block !important; }`),
          `& [data-el*="-bar"] { display: none !important; }`,
          `& [data-el*="-card"] { border: 1px solid #e2e8f0 !important; border-radius: 12px !important; box-shadow: 0 1px 3px rgba(0,0,0,0.06) !important; overflow: hidden !important; max-width: 100% !important; box-sizing: border-box !important; background: #ffffff !important; }`,
          `& [data-el*="-body"] { overflow: hidden !important; text-overflow: ellipsis !important; }`,
        ].join("\n"),
      },
    },
    elements: [
      newElement("rect", el("bg"), { role: "none", x: 0, y: 0, width: 1024, height: 480, fill: "#f8fafc", radius: 0 }),
      newElement("text", el("title"), { role: "heading", x: 40, y: 24, width: 600, height: 36, text: "Trámites y Leyes", fontSize: 30, bold: true, color: "#0f172a" }),
      newElement("text", el("subtitle"), { role: "text", x: 40, y: 64, width: 700, height: 22, text: "Consulta los decretos ejecutivos y la normativa municipal de Cochabamba.", fontSize: 14, color: "#475569" }),
      newElement("text", el("options-label"), { role: "text", x: 40, y: 96, width: 440, height: 18, text: "Selecciona una opción", fontSize: 11, bold: true, color: "#475569" }),
      newElement("rect", el("options"), {
        role: "none",
        control: { kind: "input", inputType: "radio", name: "opcion", options: ["Decretos", "Leyes", "Normativas"] },
        x: 40, y: 118, width: 440, height: 42, fill: "transparent", radius: 19, color: "#0f172a",
      }),
      newElement("rect", el("search"), {
        role: "none",
        control: { kind: "input", inputType: "search", name: "search-query", placeholder: "Buscar decreto o normativa..." },
        x: 500, y: 118, width: 230, height: 42, fill: "#ffffff", radius: 8, color: "#0f172a", fontSize: 13,
      }),
      newElement("rect", el("search-button"), {
        role: "button",
        control: { kind: "button", name: "search-trigger" },
        x: 738, y: 118, width: 86, height: 42, fill: "#00A7D6", radius: 8,
        text: "Buscar", color: "#ffffff", bold: true, fontSize: 13, align: "center",
      }),
      newElement("text", el("date-label"), { role: "text", x: 832, y: 96, width: 152, height: 18, text: "Seleccionar la fecha", fontSize: 11, bold: true, color: "#475569", hiddenOn: ["mobile", "tablet"] }),
      newElement("rect", el("date"), {
        role: "none",
        control: { kind: "select", name: "fecha", options: ["Todas las fechas", "2021-09-02", "2020-09-29", "2020-07-21"] },
        x: 832, y: 118, width: 152, height: 42, fill: "#ffffff", radius: 8, color: "#0f172a", fontSize: 13,
      }),

      // Opcion 1 (fila de 3 cards en PC - Categoría automática: Decretos)
      ...card("opt1-c1", 40, 176, "Decretos", "Título", "Información", "Fecha"),
      ...card("opt1-c2", 360, 176, "Decretos", "Título", "Información", "Fecha"),
      ...card("opt1-c3", 680, 176, "Decretos", "Título", "Información", "Fecha"),

      // Opcion 2 (fila de 3 cards en PC - Categoría automática: Leyes)
      ...card("opt2-c1", 40, 176, "Leyes", "Título", "Información", "Fecha"),
      ...card("opt2-c2", 360, 176, "Leyes", "Título", "Información", "Fecha"),
      ...card("opt2-c3", 680, 176, "Leyes", "Título", "Información", "Fecha"),

      // Opcion 3 (fila de 3 cards en PC - Categoría automática: Normativas)
      ...card("opt3-c1", 40, 176, "Normativas", "Título", "Información", "Fecha"),
      ...card("opt3-c2", 360, 176, "Normativas", "Título", "Información", "Fecha"),
      ...card("opt3-c3", 680, 176, "Normativas", "Título", "Información", "Fecha"),
    ],
    links: {},
  };
}

export interface ComponentOptionItem {
  key: string;
  label: string;
  index: number;
}

/** Detecta si un componente tiene un conjunto de opciones (pestañas o radio buttons) para filtrar cards. */
export function getComponentOptions(def: ComponentDef): ComponentOptionItem[] {
  const optionsEl = def.elements.find(
    (e) =>
      e.control?.name === "opcion" ||
      (e.control?.kind === "input" && e.control?.inputType === "radio") ||
      (e.control?.kind === "select" && e.control?.name === "opcion"),
  );

  const rawOptions = optionsEl?.control?.options;
  if (Array.isArray(rawOptions) && rawOptions.length > 0) {
    return rawOptions.map((label, idx) => ({
      key: `opt${idx + 1}`,
      label,
      index: idx,
    }));
  }

  // Si no hay control explícito pero hay tarjetas con sufijo -opt1-, -opt2-, -opt3-
  const hasOpt1 = def.elements.some((e) => e.id.includes("-opt1-"));
  const hasOpt2 = def.elements.some((e) => e.id.includes("-opt2-"));
  const hasOpt3 = def.elements.some((e) => e.id.includes("-opt3-"));

  if (hasOpt1 || hasOpt2 || hasOpt3) {
    const list: ComponentOptionItem[] = [];
    if (hasOpt1) list.push({ key: "opt1", label: "Decretos", index: 0 });
    if (hasOpt2) list.push({ key: "opt2", label: "Leyes", index: 1 });
    if (hasOpt3) list.push({ key: "opt3", label: "Normativas", index: 2 });
    return list;
  }

  return [];
}

/** Obtiene el nombre de la categoría asignada a una opción (ej: "Decretos" para opt1). */
export function getCategoryForOption(def: ComponentDef, optionKey: string): string {
  const options = getComponentOptions(def);
  const found = options.find((o) => o.key === optionKey);
  if (found && found.label?.trim()) {
    return found.label.trim();
  }
  if (optionKey === "opt1") return "Decretos";
  if (optionKey === "opt2") return "Leyes";
  if (optionKey === "opt3") return "Normativas";
  return "Categoría";
}

/** Extrae el prefijo de la tarjeta (ej. "opt1-c1") a partir del id de cualquiera de sus elementos. */
export function getCardPrefix(elementId: string): string | null {
  const match = elementId.match(/(opt\d+-[a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

/**
 * Prefijo nuevo para una tarjeta, sin chocar con los ids ya guardados.
 * Al mover se intenta conservar el tag original (`c1`), pero si la opción destino ya tiene una tarjeta con ese tag
 * se genera uno fresco: reutilizarlo duplicaría los ids de todos los elementos de la tarjeta y React avisaría
 * de claves repetidas al renderizar.
 */
function freshCardPrefix(def: ComponentDef, optionKey: string, preferredTag?: string): string {
  const isFree = (tag: string) =>
    !def.elements.some((e) => e.id.startsWith(`${def.id}-${optionKey}-${tag}-`));

  if (preferredTag && /^[a-zA-Z0-9]+$/.test(preferredTag) && isFree(preferredTag)) {
    return `${optionKey}-${preferredTag}`;
  }

  const base = `c${Date.now().toString(36).slice(-4)}`;
  let tag = base;
  for (let i = 1; !isFree(tag); i++) tag = `${base}${i}`;
  return `${optionKey}-${tag}`;
}

/** Obtiene las tarjetas pertenecientes a una opción específica. */
export function getCardsForOption(def: ComponentDef, optionKey: string): ContainerCardInfo[] {
  const cardRoots = def.elements.filter(
    (e) => e.id.includes(`-${optionKey}-`) && (e.id.endsWith("-card") || e.role === "container"),
  );

  return cardRoots.map((root, idx) => {
    const prefix = getCardPrefix(root.id);
    const related = prefix ? def.elements.filter((e) => e.id.includes(prefix)) : [root];
    const heading = related.find((e) => e.role === "heading" || e.id.endsWith("-title"));
    const title = heading?.text?.trim() || root.text?.trim() || `Tarjeta ${idx + 1}`;
    return {
      id: root.id,
      title,
      elementCount: related.length,
      fill: root.fill,
    };
  });
}

/** Agrega una nueva tarjeta limpia y estilizada a una opción específica del componente con categoría automática. */
export function addCardToOption(
  def: ComponentDef,
  optionKey: string,
  customTitle?: string,
): { component: ComponentDef; newCardId: string } {
  const prefix = freshCardPrefix(def, optionKey);
  const compId = def.id;
  const el = (suffix: string) => `${compId}-${prefix}-${suffix}`;
  const rootId = el("card");

  // Calcular la posición col/row en cuadrícula de 3 columnas
  const existingCards = def.elements.filter(
    (e) => e.id.includes(`-${optionKey}-`) && (e.id.endsWith("-card") || e.role === "container"),
  );
  const cardIndex = existingCards.length;
  const col = cardIndex % 3;
  const row = Math.floor(cardIndex / 3);

  const cardWidth = 304;
  const cardHeight = 220;
  const gapX = 16;
  const gapY = 16;
  const nextX = 40 + col * (cardWidth + gapX);
  const nextY = 176 + row * (cardHeight + gapY);

  const title = customTitle || "Título";
  const categoryText = getCategoryForOption(def, optionKey);
  const pad = 16;
  const innerWidth = cardWidth - pad * 2;

  const newElements: CanvasElement[] = [
    newElement("rect", rootId, { role: "container", x: nextX, y: nextY, width: cardWidth, height: cardHeight, fill: "#ffffff", radius: 12 }),
    newElement("text", el("kind"), { role: "text", parentId: rootId, x: nextX + pad, y: nextY + 16, width: innerWidth, height: 18, text: categoryText, fontSize: 12, bold: true, color: "#00A7D6" }),
    newElement("text", el("title"), { role: "heading", parentId: rootId, x: nextX + pad, y: nextY + 38, width: innerWidth, height: 24, text: title, fontSize: 16, bold: true, color: "#0f172a" }),
    newElement("text", el("body"), { role: "text", parentId: rootId, x: nextX + pad, y: nextY + 66, width: innerWidth, height: 56, text: "Información", fontSize: 13, color: "#475569" }),
    newElement("text", el("date"), { role: "text", parentId: rootId, x: nextX + pad, y: nextY + 128, width: innerWidth, height: 18, text: "Fecha", fontSize: 12, color: "#64748b" }),
    newElement("rect", el("btn"), { role: "button", parentId: rootId, control: { kind: "button", name: "abrir-pdf" }, x: nextX + pad, y: nextY + 156, width: innerWidth, height: 38, fill: "#00A7D6", radius: 8, text: "Abrir PDF", color: "#ffffff", bold: true, fontSize: 13, align: "center" }),
  ];

  const updatedHeight = Math.max(def.height, nextY + cardHeight + 40);

  return {
    component: {
      ...def,
      height: updatedHeight,
      elements: [...def.elements, ...newElements],
    },
    newCardId: rootId,
  };
}

/** Duplica una tarjeta dentro de su misma opción. */
export function duplicateCardInOption(
  def: ComponentDef,
  cardId: string,
): { component: ComponentDef; newCardId: string } {
  const prefix = getCardPrefix(cardId);
  if (!prefix) return { component: def, newCardId: cardId };

  const optMatch = prefix.match(/opt\d+/);
  const optionKey = optMatch ? optMatch[0] : "opt1";
  const cardElements = def.elements.filter((e) => e.id.includes(prefix));
  if (cardElements.length === 0) return { component: def, newCardId: cardId };

  const rootEl = cardElements.find((e) => e.id.endsWith("-card")) || cardElements[0];
  const newPrefix = freshCardPrefix(def, optionKey);
  const newRootId = rootEl.id.replace(prefix, newPrefix);

  // Posicionar según el índice de la nueva tarjeta (columna/fila en grilla de 3)
  const optionCards = def.elements.filter(
    (e) => e.id.includes(`-${optionKey}-`) && (e.id.endsWith("-card") || e.role === "container"),
  );
  const cardIndex = optionCards.length;
  const col = cardIndex % 3;
  const row = Math.floor(cardIndex / 3);
  const cardWidth = rootEl.width || 304;
  const cardHeight = rootEl.height || 220;
  const nextX = 40 + col * (cardWidth + 16);
  const nextY = 176 + row * (cardHeight + 16);

  const deltaX = nextX - rootEl.x;
  const deltaY = nextY - rootEl.y;

  const categoryText = getCategoryForOption(def, optionKey);

  const clonedElements: CanvasElement[] = cardElements.map((el) => ({
    ...el,
    id: el.id.replace(prefix, newPrefix),
    parentId: el.parentId ? el.parentId.replace(prefix, newPrefix) : undefined,
    x: el.x + deltaX,
    y: el.y + deltaY,
    text: el.id.endsWith("-title")
      ? `${el.text} (Copia)`
      : el.id.endsWith("-kind")
        ? categoryText
        : el.text,
    control: el.id.endsWith("-btn")
      ? { kind: "button", name: "abrir-pdf" }
      : el.control,
  }));

  const updatedHeight = Math.max(def.height, nextY + cardHeight + 40);

  return {
    component: {
      ...def,
      height: updatedHeight,
      elements: [...def.elements, ...clonedElements],
    },
    newCardId: newRootId,
  };
}

/** Elimina una tarjeta y todos sus elementos subordinados de una opción, reacomodando las restantes. */
export function deleteCardFromOption(def: ComponentDef, cardId: string): ComponentDef {
  const prefix = getCardPrefix(cardId);
  if (!prefix) {
    return {
      ...def,
      elements: def.elements.filter((e) => e.id !== cardId),
    };
  }

  const optMatch = prefix.match(/opt\d+/);
  const optionKey = optMatch ? optMatch[0] : null;

  // Filtrar los elementos eliminados
  const remainingElements = def.elements.filter((e) => !e.id.includes(prefix) && e.id !== cardId);

  // Si pertenece a una opción con cards, reacomodar las coordenadas en grilla de 3 columnas para no dejar huecos
  if (optionKey) {
    const optionCardRoots = remainingElements
      .filter((e) => e.id.includes(`-${optionKey}-`) && (e.id.endsWith("-card") || e.role === "container"))
      .sort((a, b) => (Math.abs(a.y - b.y) > 10 ? a.y - b.y : a.x - b.x));

    const repositionedElements = [...remainingElements];
    optionCardRoots.forEach((cardRoot, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      const cardWidth = cardRoot.width || 304;
      const cardHeight = cardRoot.height || 220;
      const targetX = 40 + col * (cardWidth + 16);
      const targetY = 176 + row * (cardHeight + 16);
      const diffX = targetX - cardRoot.x;
      const diffY = targetY - cardRoot.y;
      if (diffX !== 0 || diffY !== 0) {
        const cPrefix = getCardPrefix(cardRoot.id);
        if (cPrefix) {
          for (let i = 0; i < repositionedElements.length; i++) {
            if (repositionedElements[i].id.includes(cPrefix)) {
              repositionedElements[i] = {
                ...repositionedElements[i],
                x: repositionedElements[i].x + diffX,
                y: repositionedElements[i].y + diffY,
              };
            }
          }
        }
      }
    });

    return {
      ...def,
      elements: repositionedElements,
    };
  }

  return {
    ...def,
    elements: remainingElements,
  };
}

/** Mueve una tarjeta de una opción a otra, actualizando automáticamente su categoría. */
export function moveCardToOption(
  def: ComponentDef,
  cardId: string,
  targetOptionKey: string,
): { component: ComponentDef; newCardId: string } {
  const prefix = getCardPrefix(cardId);
  if (!prefix) return { component: def, newCardId: cardId };

  const currentOptMatch = prefix.match(/opt\d+/);
  const currentOptKey = currentOptMatch ? currentOptMatch[0] : "opt1";
  if (currentOptKey === targetOptionKey) return { component: def, newCardId: cardId };

  const cardElements = def.elements.filter((e) => e.id.includes(prefix));
  const remainingElements = def.elements.filter((e) => !e.id.includes(prefix));

  // Posicionar al final de la opción destino (col/row modulo 3)
  const rootEl = cardElements.find((e) => e.id.endsWith("-card")) || cardElements[0];
  const cardWidth = rootEl.width || 304;
  const cardHeight = rootEl.height || 220;
  const targetCards = remainingElements.filter(
    (e) => e.id.includes(`-${targetOptionKey}-`) && (e.id.endsWith("-card") || e.role === "container"),
  );
  const cardIndex = targetCards.length;
  const col = cardIndex % 3;
  const row = Math.floor(cardIndex / 3);
  const nextX = 40 + col * (cardWidth + 16);
  const nextY = 176 + row * (cardHeight + 16);
  const deltaX = nextX - rootEl.x;
  const deltaY = nextY - rootEl.y;

  const preferredTag = prefix.replace(/^opt\d+-/, "");
  const newPrefix = freshCardPrefix(def, targetOptionKey, preferredTag);
  const newRootId = rootEl.id.replace(prefix, newPrefix);

  const targetCategory = getCategoryForOption(def, targetOptionKey);

  const movedElements: CanvasElement[] = cardElements.map((el) => ({
    ...el,
    id: el.id.replace(prefix, newPrefix),
    parentId: el.parentId ? el.parentId.replace(prefix, newPrefix) : undefined,
    x: el.x + deltaX,
    y: el.y + deltaY,
    text: el.id.endsWith("-kind") ? targetCategory : el.text,
    control: el.id.endsWith("-btn")
      ? { kind: "button", name: "abrir-pdf" }
      : el.control,
  }));

  const updatedHeight = Math.max(def.height, nextY + cardHeight + 40);

  return {
    component: {
      ...def,
      height: updatedHeight,
      elements: [...remainingElements, ...movedElements],
    },
    newCardId: newRootId,
  };
}

/** Actualiza la etiqueta de una opción seleccionable y sincroniza automáticamente las cards de esa categoría. */
export function updateOptionLabel(
  def: ComponentDef,
  optionIndex: number,
  newLabel: string,
): ComponentDef {
  const optionsIndex = def.elements.findIndex(
    (e) => e.control?.name === "opcion" || (e.control?.kind === "input" && e.control?.inputType === "radio"),
  );
  if (optionsIndex < 0) return def;

  const optionsEl = def.elements[optionsIndex];
  const currentOptions = [...(optionsEl.control?.options ?? [])];
  if (optionIndex < 0 || optionIndex >= currentOptions.length) return def;

  currentOptions[optionIndex] = newLabel;

  const updatedElement: CanvasElement = {
    ...optionsEl,
    control: {
      ...optionsEl.control!,
      options: currentOptions,
    },
  };

  const optionKey = `opt${optionIndex + 1}`;
  const updatedElements = def.elements.map((el, i) => {
    if (i === optionsIndex) return updatedElement;
    // Sincronizar automáticamente el texto de categoría para las cards de esta opción
    if (el.id.includes(`-${optionKey}-`) && el.id.endsWith("-kind")) {
      return { ...el, text: newLabel };
    }
    return el;
  });

  return {
    ...def,
    elements: updatedElements,
  };
}

/**
 * Unifica todos los colores de un componente al estándar oficial del Manual de Marca GAMC:
 * - Detecta automáticamente si es cabecera, pie de página, hero, trámites o tarjetas.
 * - Elimina amarillos, morados y azules heredados no institucionales.
 * - Aplica Celeste GAMC (#00A7D6), Blanco, Oscuro Institucional (#0F172A) y Superficie (#F8FAFC).
 */
export function unifyComponentColors(def: ComponentDef): ComponentDef {
  const isHeader =
    def.category === "navigation" &&
    (def.id.toLowerCase().includes("header") ||
      def.name.toLowerCase().includes("encabezado") ||
      def.name.toLowerCase().includes("cabecera"));

  const isFooter =
    def.category === "navigation" &&
    (def.id.toLowerCase().includes("footer") ||
      def.name.toLowerCase().includes("pie") ||
      def.name.toLowerCase().includes("cierre"));

  const isHero =
    def.name.toLowerCase().includes("hero") ||
    def.name.toLowerCase().includes("buscador hero") ||
    def.elements.some((e) => e.control?.name === "search-query" && e.height >= 40);

  const isTramitesLeyes =
    def.elements.some((e) => e.control?.name === "opcion") ||
    def.elements.some((e) => e.id.includes("-opt1-") || e.id.includes("-opt2-"));

  const updatedElements = def.elements.map((el) => {
    // 1. Cabecera (Header / Navbar)
    if (isHeader) {
      if (el.kind === "rect" && !el.parentId && el.y === 0 && el.height >= 70) {
        return {
          ...el,
          fill: "linear-gradient(100deg, var(--color-celeste-oscuro, #008BB3) 0%, var(--color-primario, #00A7D6) 100%)",
        };
      }
      if (el.kind === "text") {
        if (el.role === "heading") {
          return { ...el, color: "#ffffff" };
        }
        const isSubtitle = el.fontSize && el.fontSize <= 11;
        return { ...el, color: isSubtitle ? "#E6F6FB" : "#ffffff" };
      }
      if (el.role === "button" || el.control?.name === "search-trigger") {
        const isIconOnly = el.width <= 44;
        return {
          ...el,
          fill: isIconOnly ? "rgba(255, 255, 255, 0.2)" : "#ffffff",
          color: isIconOnly ? "#ffffff" : "#008BB3",
        };
      }
      return el;
    }

    // 2. Pie de página (Footer)
    if (isFooter) {
      if (el.kind === "rect" && !el.parentId && el.y === 0) {
        return { ...el, fill: "#0f172a" };
      }
      if (el.kind === "text") {
        if (el.role === "heading") {
          return { ...el, color: "#f8fafc" };
        }
        if (el.role === "link") {
          if (el.text && (el.text.includes("@") || el.text.includes("gob.bo"))) {
            return { ...el, color: "#34C3E8" };
          }
          return { ...el, color: "#cbd5e1" };
        }
        return { ...el, color: el.bold ? "#ffffff" : "#94a3b8" };
      }
      if (el.role === "button") {
        return { ...el, fill: "#00A7D6", color: "#ffffff" };
      }
      return el;
    }

    // 3. Hero / Buscador Hero
    if (isHero) {
      if (el.kind === "rect" && !el.parentId && el.y === 0 && el.height >= 180) {
        return {
          ...el,
          fill: "linear-gradient(100deg, var(--color-celeste-oscuro, #008BB3) 0%, var(--color-primario, #00A7D6) 100%)",
        };
      }
      if (el.kind === "text") {
        if (el.text && el.text.toUpperCase().includes("PORTAL DE ATENCIÓN")) {
          return { ...el, color: "#E6F6FB" };
        }
        if (el.role === "heading") {
          return { ...el, color: "#ffffff" };
        }
        return { ...el, color: "#e2e8f0" };
      }
      if (el.role === "button") {
        const isMainSearch = el.text && el.text.toLowerCase().includes("buscar");
        if (isMainSearch) {
          return { ...el, fill: "#ffffff", color: "#008BB3" };
        }
        return { ...el, fill: "rgba(255, 255, 255, 0.18)", color: "#ffffff" };
      }
      if (el.control?.kind === "input") {
        return { ...el, fill: "#ffffff", color: "#0f172a" };
      }
      return el;
    }

    // 4. Trámites y Leyes / Normativas
    if (isTramitesLeyes) {
      if (el.kind === "rect" && !el.parentId && el.y === 0) {
        return { ...el, fill: "#f8fafc" };
      }
      if (el.id.endsWith("-title") && !el.parentId) {
        return { ...el, color: "#0f172a" };
      }
      if (el.id.endsWith("-subtitle") || el.id.endsWith("-label")) {
        return { ...el, color: "#475569" };
      }
      if (el.id.endsWith("-kind")) {
        return { ...el, color: "#00A7D6" };
      }
      if (el.id.endsWith("-btn") || el.role === "button") {
        return { ...el, fill: "#00A7D6", color: "#ffffff" };
      }
      if (el.id.endsWith("-card")) {
        return { ...el, fill: "#ffffff" };
      }
      if (el.id.endsWith("-title") && el.parentId) {
        return { ...el, color: "#0f172a" };
      }
      if (el.id.endsWith("-body")) {
        return { ...el, color: "#475569" };
      }
      if (el.id.endsWith("-date")) {
        return { ...el, color: "#64748b" };
      }
      return el;
    }

    // 5. Componentes generales: sustituir colores heredados
    let nextEl = { ...el };
    if (nextEl.fill && /#ffd200|#ffda18|#f59e0b/i.test(nextEl.fill)) {
      nextEl.fill = "#00A7D6";
      nextEl.color = "#ffffff";
    }
    if (nextEl.color && /#ffd200|#ffda18|#f59e0b/i.test(nextEl.color)) {
      nextEl.color = "#00A7D6";
    }
    if (nextEl.fill && /#1b1550|#efe9f8|#8b5cf6/i.test(nextEl.fill)) {
      nextEl.fill = nextEl.role === "button" ? "#00A7D6" : "#E6F6FB";
      if (nextEl.role === "button") nextEl.color = "#ffffff";
    }
    if (nextEl.color && /#1b1550|#4a1070/i.test(nextEl.color)) {
      nextEl.color = "#0f172a";
    }
    if (nextEl.fill && /#0d99ff|#0284c7/i.test(nextEl.fill)) {
      nextEl.fill = "#00A7D6";
      nextEl.color = "#ffffff";
    }
    if (nextEl.color && /#0d99ff|#0284c7/i.test(nextEl.color)) {
      nextEl.color = "#00A7D6";
    }

    return nextEl;
  });

  return {
    ...def,
    elements: updatedElements,
  };
}



