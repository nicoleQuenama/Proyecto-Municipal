import type { ReactNode } from "react";
import { PagesIcon, UploadIcon } from "../viewport/icons";
import { BranchIcon, CommitIcon, IssueIcon, PullRequestIcon } from "./versioning-icons";

export type TabId = "overview" | "changes" | "history" | "branches" | "pulls" | "issues";

/** Lo que se cuenta al lado de cada sección. */
export interface NavCounts {
  changes: number;
  branches: number;
  pulls: number;
  issues: number;
}

export interface NavItem {
  id: TabId;
  label: string;
  /** El nombre técnico, que solo se muestra en el modo avanzado. */
  term?: string;
  icon: ReactNode;
  /** Solo aparece con el modo avanzado. */
  advanced: boolean;
  count?: keyof NavCounts;
}

/** Las secciones del panel, en orden. Una nueva es una entrada nueva (y su contenido en `versions-dialog`). */
export const NAV_ITEMS: NavItem[] = [
  { id: "overview", label: "Resumen", icon: <UploadIcon />, advanced: false },
  { id: "changes", label: "Cambios", icon: <PagesIcon />, advanced: false, count: "changes" },
  { id: "history", label: "Historial", term: "commits", icon: <CommitIcon />, advanced: false },
  { id: "branches", label: "Borradores", term: "ramas", icon: <BranchIcon />, advanced: true, count: "branches" },
  { id: "pulls", label: "Revisiones", term: "pull requests", icon: <PullRequestIcon />, advanced: true, count: "pulls" },
  { id: "issues", label: "Tareas", term: "issues", icon: <IssueIcon />, advanced: true, count: "issues" },
];
