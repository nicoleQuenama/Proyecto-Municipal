"use client";

import { useMemo, type ReactNode } from "react";
import { NavigationContext, useNavigation } from "../navigation/navigation-context";

/** Lo de dentro se ve y responde como en «Probar», aunque el editor esté en modo Editar. */
export function PreviewScope({ children }: { children: ReactNode }) {
  const navigation = useNavigation();
  const value = useMemo(() => ({ ...navigation, mode: "preview" as const }), [navigation]);
  return <NavigationContext value={value}>{children}</NavigationContext>;
}
