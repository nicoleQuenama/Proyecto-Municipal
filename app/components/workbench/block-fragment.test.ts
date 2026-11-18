import { describe, expect, it } from "vitest";
import { fragmentCode } from "./block-fragment";

describe("fragmentCode", () => {
  it("el TypeScript va al js, el HTML al html y el CSS al css", () => {
    expect(fragmentCode("typescript", "a")).toEqual({ js: "a" });
    expect(fragmentCode("html", "<p></p>")).toEqual({ html: "<p></p>" });
    expect(fragmentCode("css", "p{}")).toEqual({ css: "p{}" });
  });
});
