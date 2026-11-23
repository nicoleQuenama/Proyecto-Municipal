import { describe, expect, it } from "vitest";
import { newElement } from "./component-templates";
import { INITIAL_SITE } from "./initial-site";
import { uniqueElements, uniqueSiteElements } from "./unique-elements";

describe("uniqueElements", () => {
  it("conserva el primero de cada id repetido", () => {
    const a = newElement("text", "c1-kind", { text: "primero" });
    const b = newElement("text", "c1-kind", { text: "segundo" });
    const c = newElement("text", "c1-title", { text: "otro" });

    expect(uniqueElements([a, b, c]).map((e) => e.text)).toEqual(["primero", "otro"]);
  });
});

describe("uniqueSiteElements", () => {
  it("no cambia un sitio sin ids repetidos", () => {
    expect(uniqueSiteElements(INITIAL_SITE)).toBe(INITIAL_SITE);
  });

  it("sanea los componentes cargados con ids duplicados", () => {
    const el = newElement("rect", "dup", {});
    const site = {
      ...INITIAL_SITE,
      components: [
        {
          ...INITIAL_SITE.components[0],
          elements: [el, { ...el }],
        },
      ],
    };

    const clean = uniqueSiteElements(site);
    expect(clean).not.toBe(site);
    expect(clean.components[0].elements).toHaveLength(1);
  });
});
