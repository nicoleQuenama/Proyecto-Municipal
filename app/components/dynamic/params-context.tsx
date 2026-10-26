"use client";

import { createContext, useContext } from "react";
import type { PageParams } from "../data-sources/build-request";

/** Los parámetros de la página dinámica en pantalla; sin página dinámica, vacío. */
export const ParamsContext = createContext<PageParams>({});

export const usePageParams = () => useContext(ParamsContext);
