import type { SiteAction, SiteState, Page } from "../site/types";

export type Category = "performance" | "accessibility" | "best-practices" | "seo";
export type Severity = "error" | "warning" | "info";

/** Dónde está el problema: sirve para «Ir al elemento». */
export interface Target {
  blockId?: string;
  elementId?: string;
  mediaId?: string;
}

/** Un arreglo con un clic. Si pide texto (`ask`), `build` lo recibe. */
export interface Fix {
  label: string;
  build: (text?: string) => SiteAction[];
  ask?: { label: string; initial: string };
}

/** Un problema encontrado, explicado para alguien que no programa. */
export interface Finding {
  ruleId: string;
  category: Category;
  severity: Severity;
  pageId: string;
  title: string;
  /** Por qué importa, en lenguaje llano. */
  why: string;
  /** Cómo se arregla. */
  how: string;
  /** Puntos que resta a la nota de su categoría. */
  points: number;
  target?: Target;
  fixes: Fix[];
}

/** Mediciones opcionales tomadas del DOM de la vista previa. */
export interface DomMeasures {
  /** Nodos del DOM por página. */
  nodes: Record<string, number>;
  /** Imágenes dibujadas: tamaño original frente al mostrado. */
  images: { src: string; naturalWidth: number; shownWidth: number }[];
}

/** Lo que una regla devuelve; el resto lo completa `defineRule`. */
export type FindingData = Omit<Finding, "ruleId" | "category" | "pageId" | "points" | "severity" | "fixes"> & {
  severity?: Severity;
  fixes?: Fix[];
  points?: number;
};

export interface Rule {
  id: string;
  category: Category;
  /** Puntos que resta cada hallazgo. */
  weight: number;
  /** Lo máximo que esta regla puede restar a la categoría. */
  cap: number;
  check: (site: SiteState, page: Page, dom?: DomMeasures) => Finding[];
}

export interface RuleMeta {
  id: string;
  category: Category;
  weight: number;
  cap?: number;
  severity?: Severity;
}

export interface CategoryScore {
  category: Category;
  score: number;
}

export interface PageReport {
  pageId: string;
  findings: Finding[];
  scores: Record<Category, number>;
}
