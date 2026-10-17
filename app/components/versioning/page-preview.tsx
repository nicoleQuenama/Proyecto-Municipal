import type { CSSProperties, ReactNode } from "react";
import { mediaNodes, valueOf, type PreviewModel } from "./preview-model";

const PAGE_WIDTH = 720;
const SCALE = 0.55;

const BACKGROUNDS: Record<string, string> = { Blanco: "#ffffff", "Gris claro": "#e5e7eb" };
const ALIGNMENTS: Record<string, CSSProperties["textAlign"]> = {
  izquierda: "left",
  centrar: "center",
  derecha: "right",
  justificar: "justify",
};

const HEX_COLOR = /^#[0-9a-f]{3,8}$/i;
const colorOf = (value: string, fallback: string) =>
  HEX_COLOR.test(value) ? value : (BACKGROUNDS[value] ?? fallback);
const pixelsOf = (value: string, fallback: number) => parseInt(value, 10) || fallback;

interface RegionProps {
  node: string;
  pins: Record<string, number>;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

/** Zona de la página. Si cambió, se marca con un borde punteado y un número. */
function Region({ node, pins, className = "", style, children }: RegionProps) {
  const pin = pins[node];

  return (
    <div
      className={`relative ${pin ? "outline-3 outline-offset-4 outline-amber-500 outline-dashed" : ""} ${className}`}
      style={style}
    >
      {pin && (
        <span className="absolute -top-6 -left-6 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-amber-500 text-lg font-bold text-white">
          {pin}
        </span>
      )}
      {children}
    </div>
  );
}

const Bar = ({ width }: { width: string }) => (
  <span className="block h-3 rounded bg-neutral-300" style={{ width }} />
);

interface PagePreviewProps {
  model: PreviewModel;
  /** Número de cada elemento que cambió, para marcarlo en la página. */
  pins: Record<string, number>;
  label: string;
}

/** Miniatura de la página tal como queda con un conjunto de valores de diseño. */
export function PagePreview({ model, pins, label }: PagePreviewProps) {
  const get = (node: string, property: string) => valueOf(model, node, property);

  const decorations = [
    get("Titular", "Subrayado") === "Sí" && "underline",
    get("Titular", "Tachado") === "Sí" && "line-through",
  ].filter(Boolean).join(" ");
  const highlight = get("Titular", "Resaltado");

  const buttonText = get("Hero · Botón", "Texto");
  const media = mediaNodes(model);

  return (
    <div
      role="img"
      aria-label={label}
      className="overflow-hidden rounded-md border border-line bg-white text-neutral-900"
      style={{ width: PAGE_WIDTH * SCALE }}
    >
      <div style={{ width: PAGE_WIDTH, zoom: SCALE }}>
        <div className="flex h-14 items-center gap-8 bg-neutral-100 px-8 text-base">
          <strong>Alcaldía</strong>
          <span className="text-neutral-500">Inicio</span>
          <span className="text-neutral-500">Trámites</span>
          <span className="text-neutral-500">Contacto</span>
        </div>

        <Region
          node="Hero"
          pins={pins}
          className="px-12 py-14"
          style={{ background: colorOf(get("Hero", "Fondo"), "#ffffff") }}
        >
          <Region node="Titular" pins={pins}>
            <h1
              style={{
                fontSize: pixelsOf(get("Titular", "Tamaño"), 48),
                color: colorOf(get("Titular", "Color"), "#171717"),
                fontWeight: get("Titular", "Negrita") === "Sí" ? 700 : 400,
                fontStyle: get("Titular", "Cursiva") === "Sí" ? "italic" : "normal",
                textDecoration: decorations || "none",
                background: HEX_COLOR.test(highlight) ? highlight : "transparent",
                textAlign: ALIGNMENTS[get("Titular", "Alineación")] ?? "left",
                lineHeight: 1.15,
              }}
            >
              {get("Titular", "Texto")}
            </h1>
          </Region>

          <div className="mt-6 flex flex-col gap-2">
            <Bar width="70%" />
            <Bar width="50%" />
          </div>

          {buttonText !== "—" && (
            <Region node="Hero · Botón" pins={pins} className="mt-8 inline-block">
              <span className="inline-block rounded-md bg-sky-600 px-7 py-3.5 text-xl text-white">
                {buttonText}
              </span>
            </Region>
          )}
        </Region>

        <div className="grid grid-cols-3 gap-6 px-12 py-10">
          {[0, 1, 2].map((card) => (
            <div key={card} className="flex h-32 flex-col gap-3 rounded-lg bg-neutral-100 p-5">
              <span className="h-8 w-8 rounded bg-neutral-300" />
              <Bar width="80%" />
              <Bar width="55%" />
            </div>
          ))}
        </div>

        {media.length > 0 && (
          <div className="flex flex-col gap-4 px-12 pb-10">
            {media.map((node) => (
              <Region
                key={node}
                node={node}
                pins={pins}
                className="flex h-36 items-center justify-center rounded-lg bg-neutral-200 text-lg text-neutral-500"
              >
                {node}
              </Region>
            ))}
          </div>
        )}

        <Region
          node="Pie de página"
          pins={pins}
          className="bg-neutral-800 text-base text-white"
          style={{ padding: `${pixelsOf(get("Pie de página", "Relleno"), 16)}px 48px` }}
        >
          Pie de página · © Alcaldía
        </Region>
      </div>
    </div>
  );
}
