import type { ReactNode } from "react";
import { ComponentsIcon, DatabaseIcon, PackageIcon, PagesIcon, PaletteIcon, RouteIcon, UsersIcon } from "../viewport/icons";
import type { PanelTab } from "./data";

/** El icono de cada sección del panel lateral. Una sección nueva es una entrada nueva. */
export const TAB_ICONS: Record<PanelTab, ReactNode> = {
  pages: <PagesIcon />,
  components: <ComponentsIcon />,
  navigation: <RouteIcon />,
  appearance: <PaletteIcon />,
  libraries: <PackageIcon />,
  users: <UsersIcon />,
  data: <DatabaseIcon />,
};
