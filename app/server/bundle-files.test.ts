import { describe, expect, it } from "vitest";
import { extraFiles } from "./bundle-files";

describe("archivos del paquete exportado", () => {
  it("el de Docker lleva Dockerfile, compose y dockerignore; el ZIP, no", () => {
    expect(Object.keys(extraFiles("docker", true))).toEqual(expect.arrayContaining(["Dockerfile", "docker-compose.yml", ".dockerignore", "README.md"]));
    expect(Object.keys(extraFiles("zip", true))).not.toContain("Dockerfile");
  });

  it("el README avisa si no había nada publicado", () => {
    expect(extraFiles("zip", false)["README.md"]).toContain("Aún no se había publicado");
    expect(extraFiles("zip", true)["README.md"]).toContain("publicado");
  });

  it("la imagen arranca en modo sitio", () => {
    expect(extraFiles("docker", true).Dockerfile).toContain("CMS_MODE=site");
  });
});
