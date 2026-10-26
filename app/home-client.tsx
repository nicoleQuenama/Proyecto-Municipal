"use client";

import { AuthProvider } from "./components/auth/auth-context";
import { AppShell } from "./components/shell/app-shell";

export default function HomeClient() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
