import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { User } from "../components/auth/types";
import { DEMO_USERS, hashPassword, newSalt } from "./auth-passwords";

const FILE = join(process.cwd(), ".cms-data", "users.json");

export interface StoredUser extends User {
  passwordHash: string;
  salt: string;
}

export interface Store {
  users: StoredUser[];
}

export function toPublic(user: StoredUser): User {
  return { id: user.id, username: user.username, name: user.name, email: user.email, role: user.role };
}

export async function writeStore(store: Store): Promise<void> {
  await mkdir(dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(store, null, 2));
}

function seed(): Store {
  return {
    users: DEMO_USERS.map((demo) => {
      const salt = newSalt();
      return {
        id: `u-${randomUUID()}`,
        name: demo.name,
        username: demo.username,
        email: demo.email,
        role: demo.role,
        salt,
        passwordHash: hashPassword(demo.password, salt),
      };
    }),
  };
}

export async function readStore(): Promise<Store> {
  try {
    const parsed = JSON.parse(await readFile(FILE, "utf8")) as Partial<Store>;
    if (Array.isArray(parsed.users) && parsed.users.length > 0) return { users: parsed.users };
  } catch {
    // Sin archivo todavía: se crea con los usuarios de demostración.
  }

  const store = seed();
  await writeStore(store);
  return store;
}
