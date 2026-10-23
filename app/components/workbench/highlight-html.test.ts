import { describe, expect, it } from "vitest";
import { tokenizeHtml } from "./highlight-html";

const kinds = (code: string) => tokenizeHtml(code).map((t) => `${t.kind}:${t.text}`);

describe("tokenizeHtml", () => {
  it("colorea una etiqueta con atributos", () => {
    expect(kinds('<div data-el="e4">')).toEqual(["punct:<", "tag:div", "text: ", "attr:data-el", "punct:=", 'string:"e4"', "punct:>"]);
  });

  it("distingue el texto y el cierre", () => {
    expect(kinds("<p>Hola</p>")).toEqual(["punct:<", "tag:p", "punct:>", "text:Hola", "punct:</", "tag:p", "punct:>"]);
  });

  it("no pierde ni una letra", () => {
    const code = '<img data-el="e1" src="https://a.com/x.png">';
    expect(tokenizeHtml(code).map((t) => t.text).join("")).toBe(code);
  });
});
