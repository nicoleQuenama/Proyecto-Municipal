"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useSite, useSiteDispatch } from "../site/site-context";
import { normalizeExternalUrl, resolveTransition } from "./links";
import type { ElementRef, LinkEditorTarget, LinkTarget, NavMode, Point, Transition } from "./types";

/** Atributo que marca un elemento como destino donde soltar una flecha. */
export const DROP_ATTRIBUTE = "data-link-drop";
export const EXTERNAL_DROP = "external";
export const pageDrop = (pageId: string) => `page:${pageId}`;

const NOTICE_MS = 4000;

/** Lo que se mueve el puntero (px) para que un clic sobre el ícono no cuente como arrastre. */
const DRAG_THRESHOLD = 6;

interface Connecting {
  from: Point;
  to: Point;
}

interface NavigationContextValue {
  mode: NavMode;
  setMode: (mode: NavMode) => void;
  /** La flecha que se está arrastrando, si hay una. */
  connecting: Connecting | null;
  /** El destino que hay bajo la flecha ahora mismo ("page:servicios", "external"). */
  hotDrop: string | null;
  /** Empieza una flecha desde un elemento: al soltarla sobre una página la enlaza; si no se arrastra, abre el editor. */
  startConnect: (element: ElementRef, from: Point) => void;
  /** El elemento cuyo enlace se edita ahora, si hay uno. */
  linkEditor: LinkEditorTarget | null;
  closeLinkEditor: () => void;
  /** La transición que se está reproduciendo y un contador que cambia con cada navegación. */
  transition: Transition | null;
  transitionKey: number;
  /** Sigue un enlace en la vista previa: cambia de página con su transición, o abre el sitio externo. */
  followLink: (link: LinkTarget) => void;
  notice: string | null;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error("Debe usarse dentro de <NavigationProvider>");
  return ctx;
}

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

const dropTargetAt = (x: number, y: number): string | null =>
  document.elementFromPoint(x, y)?.closest(`[${DROP_ATTRIBUTE}]`)?.getAttribute(DROP_ATTRIBUTE) ?? null;

export function NavigationProvider({ children }: { children: ReactNode }) {
  const { pages, currentPageId, navigation } = useSite();
  const dispatch = useSiteDispatch();

  const [mode, setModeState] = useState<NavMode>("edit");
  const [connecting, setConnecting] = useState<Connecting | null>(null);
  const [hotDrop, setHotDrop] = useState<string | null>(null);
  const [transition, setTransition] = useState<Transition | null>(null);
  const [transitionKey, setTransitionKey] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [linkEditor, setLinkEditor] = useState<LinkEditorTarget | null>(null);
  const source = useRef<ElementRef | null>(null);
  const origin = useRef<Point | null>(null);
  const noticeTimer = useRef<number | undefined>(undefined);

  const notify = useCallback((message: string) => {
    setNotice(message);
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), NOTICE_MS);
  }, []);

  const stopConnecting = useCallback(() => {
    source.current = null;
    setConnecting(null);
    setHotDrop(null);
  }, []);

  const setMode = useCallback(
    (next: NavMode) => {
      stopConnecting();
      setLinkEditor(null);
      setTransition(null); // la primera página de una vista previa no se anima
      setModeState(next);
    },
    [stopConnecting],
  );

  const startConnect = useCallback((element: ElementRef, from: Point) => {
    source.current = element;
    origin.current = from;
    setLinkEditor(null);
    setConnecting({ from, to: from });
  }, []);

  const closeLinkEditor = useCallback(() => setLinkEditor(null), []);

  const followLink = useCallback(
    (link: LinkTarget) => {
      if (link.kind === "external") {
        const url = normalizeExternalUrl(link.url);
        if (!url) return notify("Este enlace todavía no tiene una URL válida.");

        // En la vista previa siempre se abre en una pestaña nueva, para no perder el trabajo.
        window.open(url, "_blank", "noopener,noreferrer");
        notify(
          link.newTab
            ? `Abre ${url} en una pestaña nueva.`
            : `En el sitio real abriría ${url} en esta misma pestaña.`,
        );
        return;
      }

      const target = pages.find((page) => page.id === link.pageId);
      if (!target || target.hidden || target.id === currentPageId) return;

      setTransition(resolveTransition(link, navigation.defaultTransition));
      setTransitionKey((key) => key + 1);
      dispatch({ type: "page/select", id: link.pageId });
    },
    [currentPageId, pages, navigation.defaultTransition, dispatch, notify],
  );

  const isConnecting = connecting !== null;

  // Mientras se arrastra una flecha: seguir el puntero y, al soltar, enlazar con lo que haya debajo.
  useEffect(() => {
    if (!isConnecting) return;

    const onMove = (e: PointerEvent) => {
      setConnecting((current) => current && { ...current, to: { x: e.clientX, y: e.clientY } });
      setHotDrop(dropTargetAt(e.clientX, e.clientY));
    };

    const onUp = (e: PointerEvent) => {
      const from = source.current;
      const anchor = { x: e.clientX, y: e.clientY };
      const dragged = origin.current !== null && distance(origin.current, anchor) >= DRAG_THRESHOLD;
      const drop = dragged ? dropTargetAt(e.clientX, e.clientY) : null;

      if (from && !dragged) {
        setLinkEditor({ ...from, anchor }); // un clic en el ícono, sin arrastrar
      } else if (from && drop === EXTERNAL_DROP) {
        dispatch({ type: "link/set", ...from, link: { kind: "external", url: "", newTab: true } });
        setLinkEditor({ ...from, anchor }); // falta escribir la URL
      } else if (from && drop?.startsWith("page:")) {
        dispatch({ type: "link/set", ...from, link: { kind: "page", pageId: drop.slice("page:".length) } });
      }
      stopConnecting();
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", stopConnecting);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", stopConnecting);
    };
  }, [isConnecting, dispatch, stopConnecting]);

  // Esc cancela la flecha o, en la vista previa, vuelve a editar (el editor de enlace se cierra solo).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || document.querySelector("dialog[open]")) return;
      if (isConnecting) stopConnecting();
      else if (mode === "preview") setMode("edit");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode, isConnecting, stopConnecting, setMode]);

  const value = useMemo<NavigationContextValue>(
    () => ({
      mode,
      setMode,
      connecting,
      hotDrop,
      startConnect,
      linkEditor,
      closeLinkEditor,
      transition,
      transitionKey,
      followLink,
      notice,
    }),
    [mode, setMode, connecting, hotDrop, startConnect, linkEditor, closeLinkEditor, transition, transitionKey, followLink, notice],
  );

  return <NavigationContext value={value}>{children}</NavigationContext>;
}
