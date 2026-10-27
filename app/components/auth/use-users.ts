"use client";

import { useEffect, useState } from "react";
import { createUser, fetchUsers, removeUser } from "./auth-api";
import { hasPermission, useAuth, useAuthDispatch } from "./auth-context";
import type { UserRole } from "./types";

export function useUsers() {
  const { currentUser, users } = useAuth();
  const dispatch = useAuthDispatch();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("designer");

  useEffect(() => {
    if (!hasPermission(currentUser, "manageUsers")) return;
    let active = true;
    fetchUsers()
      .then((list) => {
        if (active) dispatch({ type: "users/set", users: list });
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : "No se pudieron cargar los usuarios.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [currentUser, dispatch]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !username.trim() || !email.trim() || !password) {
      setError("Completa todos los campos para crear el usuario.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");
    try {
      const user = await createUser({ name, username, email, password, role });
      dispatch({ type: "user/create", user });
      setName("");
      setUsername("");
      setEmail("");
      setPassword("");
      setRole("designer");
      setNotice(`Usuario «${user.username}» creado.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo crear el usuario.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string, usernameToRemove: string) => {
    setRemovingId(id);
    setError("");
    setNotice("");
    try {
      await removeUser(id);
      dispatch({ type: "user/remove", id });
      setNotice(`Usuario «${usernameToRemove}» eliminado.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo eliminar el usuario.");
    } finally {
      setRemovingId(null);
    }
  };

  return {
    currentUser, users, loading, saving, removingId, error, notice,
    name, username, email, password, role,
    setName, setUsername, setEmail, setPassword, setRole,
    submit, remove,
  };
}
