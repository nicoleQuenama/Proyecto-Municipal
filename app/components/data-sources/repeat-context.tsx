"use client";

import { createContext, useContext } from "react";

/** Qué copia de una sección repetida se está dibujando (null = una sección normal). */
export const RepeatIndex = createContext<number | null>(null);

export const useRepeatIndex = () => useContext(RepeatIndex);
