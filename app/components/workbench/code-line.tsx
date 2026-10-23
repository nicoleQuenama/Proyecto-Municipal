import { tokenizeHtml, type TokenKind } from "./highlight-html";

/** El color de cada clase de trozo (sobre fondo claro). Una clase nueva es una entrada nueva. */
const COLORS: Record<TokenKind, string> = {
  punct: "text-slate-400",
  tag: "text-pink-700 font-semibold",
  attr: "text-amber-700",
  string: "text-emerald-700",
  text: "text-slate-700",
};

/** Una línea de HTML con sus etiquetas, atributos y valores en colores distintos. */
export function CodeLine({ code }: { code: string }) {
  return (
    <>
      {tokenizeHtml(code).map((token, index) => (
        <span key={index} className={COLORS[token.kind]}>
          {token.text}
        </span>
      ))}
    </>
  );
}
