"use client";

import { useCallback, useMemo, useState } from "react";
import { useSite } from "../site/site-context";
import { measureDom } from "./dom-measures";
import { auditSite } from "./run-audit";
import type { DomMeasures } from "./types";

const readDom = (): DomMeasures | undefined => (typeof document === "undefined" ? undefined : measureDom());

/** La auditoría del proyecto en vivo: se recalcula al cambiar el sitio, y «revisar de nuevo» vuelve a medir el DOM. */
export function useAudit() {
  const site = useSite();
  const [dom, setDom] = useState<DomMeasures | undefined>(readDom);
  const [checkedAt, setCheckedAt] = useState(() => Date.now());

  const reports = useMemo(() => auditSite(site, dom), [site, dom]);
  const recheck = useCallback(() => {
    setDom(readDom());
    setCheckedAt(Date.now());
  }, []);

  return { site, reports, recheck, checkedAt };
}
