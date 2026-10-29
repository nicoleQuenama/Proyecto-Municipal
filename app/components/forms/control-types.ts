/** El rol funcional de un elemento: lo que hace en la página (botón, campo, casilla…), más allá de cómo se ve. */

export type ControlKind = "button" | "submit" | "input" | "textarea" | "select" | "checkbox";

export type InputType = "text" | "email" | "tel" | "number" | "password" | "date" | "search";

/** Los datos del rol; el aspecto (relleno, esquinas, tipografía) sigue siendo el del propio elemento. */
export interface ControlSpec {
  kind: ControlKind;
  /** Cómo se llama el dato al enviarlo (`nombre`, `correo`…). */
  name: string;
  placeholder?: string;
  required?: boolean;
  inputType?: InputType;
  /** Las opciones de una lista. */
  options?: string[];
}

export const CONTROL_LABELS: Record<ControlKind, string> = {
  button: "Botón",
  submit: "Botón de enviar",
  input: "Campo de texto",
  textarea: "Área de texto",
  select: "Lista de opciones",
  checkbox: "Casilla",
};

export const INPUT_TYPE_LABELS: Record<InputType, string> = {
  text: "Texto",
  email: "Correo",
  tel: "Teléfono",
  number: "Número",
  password: "Contraseña",
  date: "Fecha",
  search: "Búsqueda",
};

/** Los datos con que empieza cada rol al asignarlo. */
export const CONTROL_DEFAULTS: Record<ControlKind, Omit<ControlSpec, "kind">> = {
  button: { name: "" },
  submit: { name: "" },
  input: { name: "campo", placeholder: "Escribe aquí", inputType: "text" },
  textarea: { name: "mensaje", placeholder: "Escribe tu mensaje" },
  select: { name: "opcion", options: ["Opción 1", "Opción 2"] },
  checkbox: { name: "acepto" },
};

export const newControl = (kind: ControlKind): ControlSpec => ({ kind, ...CONTROL_DEFAULTS[kind] });
