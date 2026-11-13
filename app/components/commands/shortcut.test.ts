import { describe, expect, it } from "vitest";
import { eventToCombo } from "./shortcut";

const event = (key: unknown, extra: Partial<KeyboardEvent> = {}) =>
  ({ key, ctrlKey: false, altKey: false, shiftKey: false, metaKey: false, ...extra }) as KeyboardEvent;

describe("eventToCombo", () => {
  it("normaliza una tecla suelta", () => expect(eventToCombo(event("V"))).toBe("v"));
  it("ordena los modificadores", () =>
    expect(eventToCombo(event("K", { shiftKey: true, ctrlKey: true }))).toBe("ctrl+shift+k"));
  it("ignora los modificadores solos", () => expect(eventToCombo(event("Control"))).toBeNull());

  // Regresión: algunos navegadores/teclados virtuales emiten keydown sin `key`
  // y la consola se llenaba de «Cannot read properties of undefined».
  it("no falla si el evento no trae key", () => expect(eventToCombo(event(undefined))).toBeNull());
  it("no falla si key está vacío", () => expect(eventToCombo(event(""))).toBeNull());
});
