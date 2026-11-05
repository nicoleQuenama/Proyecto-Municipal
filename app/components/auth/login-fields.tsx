"use client";

import { EyeIcon, EyeOffIcon, LockIcon, UserIcon } from "../viewport/icons";
import { FloatingField } from "./login-field";

interface LoginFieldsProps {
  email: string;
  password: string;
  showPassword: boolean;
  onEmail: (value: string) => void;
  onPassword: (value: string) => void;
  onTogglePassword: () => void;
}

export function LoginFields({
  email,
  password,
  showPassword,
  onEmail,
  onPassword,
  onTogglePassword,
}: LoginFieldsProps) {
  return (
    <>
      <FloatingField
        label="Correo"
        icon={<UserIcon />}
        value={email}
        type="email"
        autoComplete="email"
        onChange={onEmail}
      />

      <FloatingField
        label="Contraseña"
        icon={<LockIcon />}
        value={password}
        type={showPassword ? "text" : "password"}
        autoComplete="current-password"
        onChange={onPassword}
        trailing={
          <button
            type="button"
            onClick={onTogglePassword}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink-dim transition-colors hover:bg-hover hover:text-ink focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none"
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        }
      />
    </>
  );
}
