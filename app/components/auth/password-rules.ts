export interface PasswordRule {
  id: string;
  label: string;
  test: (value: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { id: "length", label: "Al menos 8 caracteres", test: (value) => value.length >= 8 },
  { id: "lower", label: "Una letra minúscula", test: (value) => /[a-z]/.test(value) },
  { id: "upper", label: "Una letra mayúscula", test: (value) => /[A-Z]/.test(value) },
  { id: "number", label: "Un número", test: (value) => /\d/.test(value) },
  { id: "symbol", label: "Un símbolo (!@#$…)", test: (value) => /[^A-Za-z0-9]/.test(value) },
];

export function passwordIssues(value: string): string[] {
  return PASSWORD_RULES.filter((rule) => !rule.test(value)).map((rule) => rule.label);
}

export function passwordReady(value: string): boolean {
  return passwordIssues(value).length === 0;
}

/** Mensaje único para que el servidor y el cliente expliquen lo mismo. */
export function passwordRequirementMessage(value: string): string {
  const missing = passwordIssues(value);
  return missing.length ? `Falta cumplir: ${missing.join(", ")}.` : "";
}
