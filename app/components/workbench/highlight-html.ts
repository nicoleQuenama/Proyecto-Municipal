export type TokenKind = "punct" | "tag" | "attr" | "string" | "text";

export interface Token {
  text: string;
  kind: TokenKind;
}

/** Cada alternativa reconoce un trozo de una línea de HTML; los grupos dicen de qué clase es. */
const PIECES = /(<\/?)([\w-]+)|([\w:-]+)(=)("[^"]*")|(\/?>)|(\s+)|([^<>\s=]+|=)/g;

/** Parte una línea de HTML (`<div data-el="e4">Texto</div>`) en trozos con su clase, para colorearla. */
export function tokenizeHtml(code: string): Token[] {
  const tokens: Token[] = [];
  for (const m of code.matchAll(PIECES)) {
    if (m[2]) tokens.push({ text: m[1], kind: "punct" }, { text: m[2], kind: "tag" });
    else if (m[3]) tokens.push({ text: m[3], kind: "attr" }, { text: m[4], kind: "punct" }, { text: m[5], kind: "string" });
    else if (m[6]) tokens.push({ text: m[6], kind: "punct" });
    else tokens.push({ text: m[0], kind: "text" });
  }
  return tokens;
}
