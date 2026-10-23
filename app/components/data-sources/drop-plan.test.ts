import { describe, expect, it } from "vitest";
import type { CanvasElement } from "../site/types";
import { asText } from "./as-text";
import { planDrop, type DropContext } from "./drop-plan";
import { kindOf } from "./value-kind";

const el = (id: string, kind: CanvasElement["kind"], y: number, text = "Texto"): CanvasElement =>
  ({ id, kind, x: 0, y, width: 10, height: 10, text }) as CanvasElement;

const data = {
  news: [{ id: 7, title: "Uno", cover: "https://x.com/a.jpg", author: { name: "Ana" } }, { id: 8, title: "Dos" }],
  tags: ["a", "b"],
  user: { name: "Ana", city: "Lima" },
  total: 12,
};

const elements = [el("img", "image", 0, ""), el("title", "text", 10), el("by", "text", 20), el("empty", "rect", 30, "")];
const ctx = (elementId: string | null, bound: string[] = []): DropContext => ({ pageId: "p", blockId: "b", elementId, elements, bound, data });
const ref = (path: string) => ({ sourceId: "s", path });

describe("kindOf", () => {
  it("distingue cada clase de dato", () => {
    expect(kindOf(undefined)).toBe("empty");
    expect(kindOf(3)).toBe("scalar");
    expect(kindOf(["a"])).toBe("scalars");
    expect(kindOf([{ a: 1 }])).toBe("records");
    expect(kindOf({ a: 1 })).toBe("object");
    expect(kindOf([])).toBe("scalars");
  });
});

describe("asText", () => {
  it("una lista de textos va una por línea; un objeto, clave: valor", () => {
    expect(asText(["a", "b"])).toBe("a\nb");
    expect(asText({ name: "Ana", geo: { city: "Lima" } })).toBe("name: Ana\ngeo.city: Lima");
    expect(asText(5)).toBe("5");
    expect(asText(null)).toBe("");
  });
});

describe("planDrop", () => {
  it("un dato suelto, una lista de textos o un objeto sobre un elemento se enlazan a él", () => {
    for (const path of ["total", "tags", "user"]) {
      expect(planDrop(ref(path), ctx("title"))).toEqual([{ type: "binding/set", pageId: "p", blockId: "b", elementId: "title", ref: ref(path) }]);
    }
  });

  it("una lista de objetos sobre un elemento repite la sección y rellena sus elementos", () => {
    const [repeat, many] = planDrop(ref("news"), ctx("title"));
    expect(repeat).toMatchObject({ type: "repeat/set", ref: ref("news") });
    expect(many).toMatchObject({ type: "binding/many" });
  });

  it("repetir reparte: textos en orden de lectura (primero los de texto) e imagen a la imagen", () => {
    const [, many] = planDrop(ref("news"), ctx(null));
    expect(many).toMatchObject({
      refs: { img: ref("news[0].cover"), title: ref("news[0].title"), by: ref("news[0].author.name") },
    });
  });

  it("no pisa lo que ya tiene dato ni rellena elementos sin texto", () => {
    const [, many] = planDrop(ref("news"), ctx(null, ["title"]));
    expect(Object.keys((many as { refs: object }).refs).sort()).toEqual(["by", "img"]);
  });

  it("un objeto sobre la sección rellena sin repetir", () => {
    const plan = planDrop(ref("user"), ctx(null));
    expect(plan).toHaveLength(1);
    expect(plan[0]).toMatchObject({ type: "binding/many", refs: { title: ref("user.name"), by: ref("user.city") } });
  });

  it("una lista de textos sobre la sección la repite", () => {
    expect(planDrop(ref("tags"), ctx(null))[0]).toMatchObject({ type: "repeat/set" });
  });

  it("lo que no existe no hace nada", () => {
    expect(planDrop(ref("nada"), ctx(null))).toEqual([]);
  });
});
