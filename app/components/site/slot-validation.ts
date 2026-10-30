import type { CanvasElement, ComponentDef } from "./types";

export interface SlotValidationRule {
  allowedCategories?: string[];
  allowedElementKinds?: string[];
  allowedRoles?: string[];
  disallowedMessage: string;
}

/**
 * Reglas de compatibilidad e inserción por categoría o id de contenedor.
 */
export const SLOT_VALIDATION_RULES: Record<string, SlotValidationRule> = {
  buttons: {
    allowedCategories: ["buttons"],
    allowedElementKinds: ["rect", "text", "icon", "line"],
    allowedRoles: ["button", "link", "text", "none"],
    disallowedMessage: "Un grupo de botones CTA solo acepta elementos de tipo botón o enlace, bloqueando la inserción de cards o secciones complejas.",
  },
  "cta-buttons": {
    allowedCategories: ["buttons"],
    allowedElementKinds: ["rect", "text", "icon", "line"],
    allowedRoles: ["button", "link", "text", "none"],
    disallowedMessage: "Un componente 'Set de Botones CTA' solo acepta elementos de tipo botón o enlace, bloqueando la inserción de cards o secciones complejas.",
  },
  bento: {
    allowedCategories: ["cards", "sections"],
    allowedElementKinds: ["rect", "text", "image", "video", "icon"],
    disallowedMessage: "Una cuadrícula Bento está configurada para Cards; solo acepta componentes de categoría card o elementos visuales directos.",
  },
  cards: {
    allowedCategories: ["cards"],
    allowedElementKinds: ["rect", "text", "image", "icon"],
    disallowedMessage: "Este contenedor de tarjetas solo acepta componentes de categoría card.",
  },
  "container-row": {
    allowedCategories: ["cards"],
    disallowedMessage: "Un contenedor horizontal de tarjetas solo acepta componentes de categoría card.",
  },
  "grid-cards": {
    allowedCategories: ["cards"],
    disallowedMessage: "El catálogo de tarjetas solo acepta componentes de categoría card.",
  },
};

/**
 * Obtiene la regla de validación aplicable a un contenedor según su definición y clases.
 */
export function getContainerSlotRule(
  containerDef: ComponentDef,
  containerClasses?: string,
): SlotValidationRule | null {
  if (containerDef.id === "cta-buttons" || containerDef.id === "buttons" || containerDef.category === "buttons") {
    return SLOT_VALIDATION_RULES["cta-buttons"];
  }

  const classes = containerClasses || containerDef.styles?.["section"]?.classes || "";
  if (classes.includes("bento") || classes.includes("auto-rows-")) {
    return SLOT_VALIDATION_RULES["bento"];
  }

  if (containerDef.id === "container-row" || containerDef.id === "grid-cards") {
    return SLOT_VALIDATION_RULES[containerDef.id];
  }

  if (containerDef.category === "cards") {
    return SLOT_VALIDATION_RULES["cards"];
  }

  return null;
}

export interface ValidationResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Valida si un componente hijo puede insertarse dentro del contenedor padre.
 */
export function canInsertComponent(
  parentDef: ComponentDef,
  childDef: ComponentDef,
  parentClasses?: string,
): ValidationResult {
  const rule = getContainerSlotRule(parentDef, parentClasses);
  if (!rule) return { allowed: true };

  // Validar por categoría permitida
  if (rule.allowedCategories && rule.allowedCategories.length > 0) {
    const isCategoryAllowed = rule.allowedCategories.includes(childDef.category);
    if (!isCategoryAllowed) {
      return {
        allowed: false,
        reason: rule.disallowedMessage,
      };
    }
  }

  return { allowed: true };
}

/**
 * Valida si un elemento individual (rect, text, icon, etc.) puede insertarse en el contenedor.
 */
export function canInsertElement(
  parentDef: ComponentDef,
  element: Partial<CanvasElement>,
  parentClasses?: string,
): ValidationResult {
  const rule = getContainerSlotRule(parentDef, parentClasses);
  if (!rule) return { allowed: true };

  if (rule.allowedElementKinds && element.kind) {
    if (!rule.allowedElementKinds.includes(element.kind)) {
      return {
        allowed: false,
        reason: rule.disallowedMessage,
      };
    }
  }

  if (rule.allowedRoles && element.role) {
    if (!rule.allowedRoles.includes(element.role)) {
      return {
        allowed: false,
        reason: rule.disallowedMessage,
      };
    }
  }

  return { allowed: true };
}

/**
 * Filtra la lista de componentes disponibles mostrando solo los compatibles con el contenedor dado.
 */
export function filterAllowedComponents(
  components: ComponentDef[],
  containerDef?: ComponentDef | null,
  containerClasses?: string,
): ComponentDef[] {
  if (!containerDef) return components;
  return components.filter((c) => canInsertComponent(containerDef, c, containerClasses).allowed);
}
