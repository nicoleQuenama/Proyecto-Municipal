import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export const DEMO_USERS = [
  {
    name: "Super Admin",
    username: "superadmin",
    email: "superadmin@portal.dev",
    role: "superadmin" as const,
    password: "SuperAdmin2026!",
  },
  {
    name: "Desarrollador",
    username: "dev",
    email: "dev@portal.dev",
    role: "dev" as const,
    password: "Dev2026!",
  },
  {
    name: "Diseñador",
    username: "designer",
    email: "designer@portal.dev",
    role: "designer" as const,
    password: "Designer2026!",
  },
];

export function newSalt(): string {
  return randomBytes(16).toString("hex");
}

export function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString("hex");
}

export function passwordMatches(password: string, hash: string, salt: string): boolean {
  const actual = Buffer.from(hash, "hex");
  const expected = Buffer.from(hashPassword(password, salt), "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
