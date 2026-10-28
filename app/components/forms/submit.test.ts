import { describe, expect, it } from "vitest";
import { missingFields } from "./submit";

describe("enviar el formulario", () => {
  it("avisa de los obligatorios vacíos o sin marcar", () => {
    const fields = [
      { name: "nombre", required: true, value: "" },
      { name: "correo", required: true, value: "a@b.c" },
      { name: "acepto", required: true, value: false },
      { name: "nota", required: false, value: "" },
    ];
    expect(missingFields(fields)).toEqual(["nombre", "acepto"]);
  });
});
