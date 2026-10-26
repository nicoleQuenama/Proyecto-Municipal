"use client";

import { createContext, useContext } from "react";

/** El ancho de la casilla donde se dibuja una copia de una rejilla; sin él, manda el ancho de la página. */
export const CellWidth = createContext<number | null>(null);

export const useCellWidth = () => useContext(CellWidth);
