"use client";

import { useState } from "react";
import { login } from "./auth-api";
import { useAuthDispatch } from "./auth-context";
import { LoginBackground } from "./login-background";
import { LoginBrandPanel } from "./login-brand-panel";
import { LoginDemoAccess } from "./login-demo-access";
import { LoginFields } from "./login-fields";
import { LoginIntro } from "./login-intro";

export function LoginForm() {
  const dispatch = useAuthDispatch();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!username.trim() || !password) {
      setError("Indica tu usuario y contraseña.");
      return;
    }

    setPending(true);
    setError("");
    try {
      const user = await login(username, password);
      dispatch({ type: "auth/login", user });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo iniciar sesión.");
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-4 py-10">
      <LoginBackground />
      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-line/80 bg-panel/90 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl lg:grid-cols-[1.08fr_1fr]">
        <LoginBrandPanel />

        <section className="relative p-7 sm:p-10 lg:p-12">
          <div className="mx-auto w-full max-w-sm">
            <LoginIntro />

            <form onSubmit={handleLogin} className="flex flex-col gap-5" noValidate>
              <LoginFields
                username={username}
                password={password}
                showPassword={showPassword}
                onUsername={setUsername}
                onPassword={setPassword}
                onTogglePassword={() => setShowPassword((value) => !value)}
              />

              {error && (
                <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={pending}
                className="mt-1 flex h-11 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-accent to-[#6f7bff] text-sm font-semibold text-white shadow-lg shadow-accent/25 transition-[filter,transform] hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending && (
                  <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                )}
                {pending ? "Comprobando acceso…" : "Entrar al CMS"}
              </button>
            </form>

            <LoginDemoAccess
              onPick={(demoUser, demoPassword) => {
                setUsername(demoUser);
                setPassword(demoPassword);
                setError("");
              }}
            />

            <p className="mt-6 text-center text-[10px] leading-relaxed text-ink-dim/70">
              Sesión protegida con cookie segura. Las contraseñas se guardan cifradas en el servidor.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
