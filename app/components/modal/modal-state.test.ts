import { describe, expect, it } from "vitest";
import type { Page } from "../site/types";
import { openModalFor } from "./modal-state";

const page = { id: "p", route: "/pokemon/:id", previewParams: { id: "1" } } as unknown as Page;

describe("openModalFor", () => {
  it("usa los parámetros del enlace y, si faltan, los de ejemplo", () => {
    expect(openModalFor({ kind: "modal", pageId: "p", params: { id: "25" } }, [page])?.values).toEqual({ id: "25" });
    expect(openModalFor({ kind: "modal", pageId: "p" }, [page])?.values).toEqual({ id: "1" });
  });

  it("completa las opciones y devuelve null si la página no existe", () => {
    expect(openModalFor({ kind: "modal", pageId: "p", options: { size: "full" } }, [page])?.options.size).toBe("full");
    expect(openModalFor({ kind: "modal", pageId: "x" }, [page])).toBeNull();
  });
});
