"use client";

import { useCallback, useSyncExternalStore } from "react";
import { TABS, type PanelTab } from "./data";

const KEY_COLLAPSED = "portal.sidepanel.collapsed";
const KEY_TAB = "portal.sidepanel.tab";
const KEY_WIDTH = "portal.sidepanel.width";

export const DEFAULT_WIDTH = 304;
export const MIN_WIDTH = 248;
export const MAX_WIDTH = 520;
export const clampWidth = (width: number) => Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, width));

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => void listeners.delete(listener);
};

let cachedCollapsed: boolean | null = null;
let cachedTab: PanelTab | null = null;
let cachedWidth: number | null = null;

function readCollapsed(): boolean {
  if (cachedCollapsed === null) {
    if (typeof window === "undefined") return false;
    try {
      cachedCollapsed = localStorage.getItem(KEY_COLLAPSED) === "1";
    } catch {
      cachedCollapsed = false;
    }
  }
  return cachedCollapsed;
}

function writeCollapsed(next: boolean | ((prev: boolean) => boolean)) {
  const current = readCollapsed();
  const resolved = typeof next === "function" ? next(current) : next;
  cachedCollapsed = resolved;
  try {
    localStorage.setItem(KEY_COLLAPSED, resolved ? "1" : "0");
  } catch {}
  notify();
}

function readTab(): PanelTab {
  if (cachedTab === null) {
    if (typeof window === "undefined") return "components";
    try {
      const saved = localStorage.getItem(KEY_TAB);
      if (saved && TABS.some((t) => t.value === saved)) {
        cachedTab = saved as PanelTab;
      } else {
        cachedTab = "components";
      }
    } catch {
      cachedTab = "components";
    }
  }
  return cachedTab ?? "components";
}

function writeTab(next: PanelTab | ((prev: PanelTab) => PanelTab)) {
  const current = readTab();
  const resolved = typeof next === "function" ? next(current) : next;
  cachedTab = resolved;
  try {
    localStorage.setItem(KEY_TAB, resolved);
  } catch {}
  notify();
}

function readWidth(): number {
  if (cachedWidth === null) {
    if (typeof window === "undefined") return DEFAULT_WIDTH;
    try {
      const saved = localStorage.getItem(KEY_WIDTH);
      if (saved) {
        const parsed = Number(saved);
        if (!Number.isNaN(parsed)) cachedWidth = clampWidth(parsed);
      }
    } catch {}
    if (cachedWidth === null) cachedWidth = DEFAULT_WIDTH;
  }
  return cachedWidth;
}

function writeWidth(next: number | ((prev: number) => number)) {
  const current = readWidth();
  const resolved = clampWidth(typeof next === "function" ? next(current) : next);
  cachedWidth = resolved;
  try {
    localStorage.setItem(KEY_WIDTH, String(resolved));
  } catch {}
  notify();
}

/** Recuerda si el panel lateral está plegado o expandido en este navegador */
export function usePanelCollapsed(): [boolean, (next: boolean | ((prev: boolean) => boolean)) => void] {
  const value = useSyncExternalStore(subscribe, readCollapsed, () => false);
  const set = useCallback((next: boolean | ((prev: boolean) => boolean)) => writeCollapsed(next), []);
  return [value, set];
}

/** Recuerda la pestaña activa del panel lateral (p. ej. "appearance" / Estilo) en este navegador */
export function usePanelTab(): [PanelTab, (next: PanelTab | ((prev: PanelTab) => PanelTab)) => void] {
  const value = useSyncExternalStore<PanelTab>(subscribe, readTab, () => "components" as PanelTab);
  const set = useCallback((next: PanelTab | ((prev: PanelTab) => PanelTab)) => writeTab(next), []);
  return [value, set];
}

/** Recuerda el ancho personalizado del panel lateral al arrastrarlo */
export function usePanelWidth(): [number, (next: number | ((prev: number) => number)) => void] {
  const value = useSyncExternalStore(subscribe, readWidth, () => DEFAULT_WIDTH);
  const set = useCallback((next: number | ((prev: number) => number)) => writeWidth(next), []);
  return [value, set];
}
