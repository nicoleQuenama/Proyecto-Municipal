import { describe, expect, it } from "vitest";
import { optimizedSrc } from "./optimize-src";

const IK = "https://ik.imagekit.io/cuenta/org/o/p/abc123-foto";

describe("optimizedSrc", () => {
  it("pide formato y calidad automáticos a las imágenes de ImageKit", () => {
    expect(optimizedSrc(`${IK}.png`)).toBe(`${IK}.png?tr=f-auto,q-auto`);
    expect(optimizedSrc(`${IK}.JPG`)).toBe(`${IK}.JPG?tr=f-auto,q-auto`);
  });

  it("respeta lo que ya trae transformaciones, los GIF y los videos", () => {
    expect(optimizedSrc(`${IK}.png?tr=w-300`)).toBe(`${IK}.png?tr=w-300`);
    expect(optimizedSrc(`${IK}.gif`)).toBe(`${IK}.gif`);
    expect(optimizedSrc(`${IK}.mp4`)).toBe(`${IK}.mp4`);
  });

  it("no toca direcciones de otros sitios ni lo que no es una dirección", () => {
    expect(optimizedSrc("https://otro.com/foto.png")).toBe("https://otro.com/foto.png");
    expect(optimizedSrc("data:image/png;base64,AAAA")).toBe("data:image/png;base64,AAAA");
    expect(optimizedSrc("no es una dirección")).toBe("no es una dirección");
  });
});
