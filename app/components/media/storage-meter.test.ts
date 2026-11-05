import { describe, expect, it } from "vitest";
import { formatBytes, toneOf } from "./storage-meter";

describe("medidor de almacenamiento", () => {
  it("dice los tamaños de forma legible", () => {
    expect(formatBytes(0)).toBe("0 KB");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5,0 MB");
    expect(formatBytes(5 * 1024 ** 3)).toBe("5,0 GB");
  });

  it("avisa con el color antes de llenarse", () => {
    expect(toneOf(0.2).bar).toBe("bg-accent");
    expect(toneOf(0.8).bar).toBe("bg-amber-400");
    expect(toneOf(0.97).bar).toBe("bg-red-500");
  });
});
