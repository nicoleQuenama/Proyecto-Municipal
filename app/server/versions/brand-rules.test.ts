import { describe, expect, it } from "vitest";
import type { SiteState } from "../../components/site/types";
import type { SitePatch } from "../site/site-patch";
import { changesBrand, looseBrandValues } from "./brand-rules";

const global = { kind: "global" } as const;
const page = { kind: "page", pageId: "p1" } as const;
const brandColor = { id: "v1", scope: global, name: "marca", kind: "color" as const, value: "#112233" };
const site = { variables: [brandColor], rules: [{ scope: global, target: "heading", props: { color: "var(--marca)" } }] } as unknown as SiteState;

describe("manual de marca", () => {
  it("ampliar con variables propias no toca la marca", () => {
    const patch: SitePatch = { variables: [brandColor, { id: "v2", scope: page, name: "mio", kind: "color", value: "#fff" }] };
    expect(changesBrand(patch, site)).toBe(false);
  });
  it("cambiar o borrar la paleta global sí", () => {
    expect(changesBrand({ variables: [{ ...brandColor, value: "#000000" }] }, site)).toBe(true);
    expect(changesBrand({ variables: [] }, site)).toBe(true);
    expect(changesBrand({ rules: [] }, site)).toBe(true);
  });
  it("activar «obligatorio» solo cambia la marca si el valor es distinto", () => {
    expect(changesBrand({ settings: { brandRequired: true } }, site)).toBe(true);
    expect(changesBrand({ settings: { other: 1 } }, site)).toBe(false);
  });
  it("en modo obligatorio, un color suelto se detecta y una variable no", () => {
    const loose: SitePatch = { rules: [...site.rules, { scope: page, target: "text", props: { color: "#ff0000", fontSize: "12px" } }] };
    expect(looseBrandValues(loose, site)).toEqual(["text.color"]);
    const ok: SitePatch = { rules: [...site.rules, { scope: page, target: "text", props: { color: "var(--marca)" } }] };
    expect(looseBrandValues(ok, site)).toEqual([]);
  });
});
