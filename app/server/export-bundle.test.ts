import { unzipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { buildBundle } from "./export-bundle";

describe("paquete exportado", () => {
  it("lleva el código y los archivos de Docker, y deja fuera lo privado y lo pesado", async () => {
    const files = Object.keys(unzipSync(await buildBundle("docker")));

    expect(files).toEqual(expect.arrayContaining(["package.json", "app/page.tsx", "Dockerfile", "docker-compose.yml", "README.md"]));
    expect(files.some((name) => name.includes("node_modules/"))).toBe(false);
    expect(files.some((name) => name.startsWith(".next/"))).toBe(false);
    expect(files).not.toContain(".cms-data/users.json");
  }, 60_000);

  it("el ZIP sencillo no lleva Docker", async () => {
    const files = Object.keys(unzipSync(await buildBundle("zip")));
    expect(files).toContain("app/page.tsx");
    expect(files).not.toContain("Dockerfile");
  }, 60_000);
});
