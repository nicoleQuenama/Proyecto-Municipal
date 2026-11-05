import { describe, expect, it } from "vitest";
import { sniffMediaType } from "./sniff";

const bytes = (...values: number[]) => new Uint8Array([...values, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
const text = (value: string) => new TextEncoder().encode(value.padEnd(16, " "));

describe("tipo real de un archivo", () => {
  it("reconoce las imágenes y videos permitidos por sus primeros bytes", () => {
    expect(sniffMediaType(bytes(0x89, 0x50, 0x4e, 0x47))).toBe("image/png");
    expect(sniffMediaType(bytes(0xff, 0xd8, 0xff))).toBe("image/jpeg");
    expect(sniffMediaType(text("GIF89a"))).toBe("image/gif");
    expect(sniffMediaType(text("RIFF....WEBPVP8 "))).toBe("image/webp");
    expect(sniffMediaType(text("....ftypavif"))).toBe("image/avif");
    expect(sniffMediaType(text("....ftypisom"))).toBe("video/mp4");
    expect(sniffMediaType(bytes(0x1a, 0x45, 0xdf, 0xa3))).toBe("video/webm");
  });

  it("rechaza lo demás: scripts, SVG, ejecutables y archivos vacíos", () => {
    expect(sniffMediaType(text("<script>alert(1)</script>"))).toBeNull();
    expect(sniffMediaType(text('<svg xmlns="http://www.w3.org/2000/svg">'))).toBeNull();
    expect(sniffMediaType(text("MZ\u0090 programa"))).toBeNull();
    expect(sniffMediaType(new Uint8Array())).toBeNull();
  });
});
