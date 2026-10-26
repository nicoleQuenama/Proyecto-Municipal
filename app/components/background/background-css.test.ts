import { describe, expect, it } from "vitest";
import {
  DEFAULT_BACKGROUND,
  embedBackgroundUrl,
  hasBackground,
  imageLayerStyle,
  spanStyle,
  stretches,
  veilStyle,
  videoLayerStyle,
} from "./background-css";
import type { BlockBackground } from "./types";

const image: BlockBackground = { kind: "image", src: "https://x.test/a.jpg", ...DEFAULT_BACKGROUND };

describe("imageLayerStyle", () => {
  it("cubre, centra y no se repite por defecto", () => {
    expect(imageLayerStyle(image, image.src)).toMatchObject({
      backgroundImage: 'url("https://x.test/a.jpg")',
      backgroundSize: "cover",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center center",
      backgroundAttachment: "scroll",
    });
  });

  it("fijo al scroll, repetido, anclado y desenfocado", () => {
    const style = imageLayerStyle({ ...image, fit: "repeat", anchor: "tl", fixed: true, blur: 6 }, image.src);
    expect(style).toMatchObject({ backgroundRepeat: "repeat", backgroundPosition: "left top", backgroundAttachment: "fixed", filter: "blur(6px)" });
  });

  it("escapa las comillas de la dirección", () => {
    expect(imageLayerStyle(image, 'a"b').backgroundImage).toBe('url("a%22b")');
  });
});

describe("videoLayerStyle", () => {
  it("usa object-fit y object-position", () => {
    expect(videoLayerStyle({ ...image, kind: "video", fit: "contain", anchor: "br" })).toMatchObject({
      objectFit: "contain",
      objectPosition: "right bottom",
    });
  });
});

describe("veilStyle", () => {
  it("convierte el porcentaje en opacidad y omite un velo invisible", () => {
    expect(veilStyle({ ...image, veil: { color: "#000", opacity: 40 } })).toEqual({ background: "#000", opacity: 0.4 });
    expect(veilStyle({ ...image, veil: { color: "#000", opacity: 0 } })).toBeNull();
    expect(veilStyle(image)).toBeNull();
  });
});

describe("embedBackgroundUrl", () => {
  it("YouTube: silenciado, en bucle y sin controles", () => {
    const url = new URL(embedBackgroundUrl("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"));
    expect(url.searchParams.get("mute")).toBe("1");
    expect(url.searchParams.get("loop")).toBe("1");
    expect(url.searchParams.get("playlist")).toBe("dQw4w9WgXcQ");
  });

  it("Vimeo: modo fondo", () => {
    expect(new URL(embedBackgroundUrl("https://player.vimeo.com/video/123")).searchParams.get("background")).toBe("1");
  });
});

describe("spanStyle y hasBackground", () => {
  it("la pantalla completa ocupa todo el alto y el contenido no cambia nada", () => {
    expect(spanStyle("screen")).toMatchObject({ minHeight: "100vh", width: "100%" });
    expect(spanStyle(undefined)).toEqual({});
    expect(stretches("width")).toBe(true);
    expect(stretches(undefined)).toBe(false);
  });

  it("un fondo sin dirección no cuenta", () => {
    expect(hasBackground({ ...image, src: " " })).toBe(false);
    expect(hasBackground(image)).toBe(true);
    expect(hasBackground(undefined)).toBe(false);
  });
});
