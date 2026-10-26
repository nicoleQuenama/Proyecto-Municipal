import { describe, expect, it } from "vitest";
import type { Page, SiteState } from "../site/types";
import { defineRule } from "./define-rule";
import { bandOf, scoreCategory } from "./score";

const data = { title: "x", why: "", how: "" };
const repeated = defineRule({ id: "t", category: "seo", weight: 10, cap: 25 }, () => Array.from({ length: 5 }, () => data));
const informative = defineRule({ id: "i", category: "seo", weight: 10, severity: "info" }, () => [data]);
const site = {} as SiteState;
const page = { id: "p" } as Page;

describe("puntuación", () => {
  it("sin problemas es 100", () => expect(scoreCategory("seo", [], [repeated])).toBe(100));

  it("resta el peso y respeta el tope de la regla", () => {
    const findings = repeated.check(site, page);
    expect(findings).toHaveLength(5);
    expect(scoreCategory("seo", findings, [repeated])).toBe(75);
  });

  it("los avisos informativos no restan", () => {
    expect(scoreCategory("seo", informative.check(site, page), [informative])).toBe(100);
  });

  it("solo cuenta la categoría pedida", () => {
    expect(scoreCategory("accessibility", repeated.check(site, page), [repeated])).toBe(100);
  });

  it("colorea como Lighthouse", () => {
    expect([bandOf(100), bandOf(90), bandOf(89), bandOf(50), bandOf(49)]).toEqual(["good", "good", "average", "average", "poor"]);
  });
});
