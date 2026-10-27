import { REQUEST_HEADER } from "../../server/request-header";
import type { Access } from "./access";
import type { NewUser, User } from "./types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      [REQUEST_HEADER]: "1",
      ...init?.headers,
    },
  });

  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? "No se pudo completar la operación.");
  return data;
}

export async function fetchCurrentUser(): Promise<User | null> {
  try {
    return (await request<{ user: User | null }>("/api/auth/me")).user;
  } catch {
    return null;
  }
}

export async function login(username: string, password: string): Promise<User> {
  return (await request<{ user: User }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  })).user;
}

export async function logout(): Promise<void> {
  await request<{ ok: true }>("/api/auth/logout", { method: "POST" });
}

export async function fetchUsers(): Promise<User[]> {
  return (await request<{ users: User[] }>("/api/auth/users")).users;
}

export async function createUser(input: NewUser): Promise<User> {
  return (await request<{ user: User }>("/api/auth/users", {
    method: "POST",
    body: JSON.stringify(input),
  })).user;
}

export async function removeUser(id: string): Promise<void> {
  await request<{ ok: true }>(`/api/auth/users?id=${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function saveAccess(id: string, access: Access): Promise<User> {
  return (await request<{ user: User }>("/api/auth/users", { method: "PATCH", body: JSON.stringify({ id, access }) })).user;
}
