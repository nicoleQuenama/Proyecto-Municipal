"use client";

import { useState, type ReactNode } from "react";
import { EyeIcon, EyeOffIcon } from "../viewport/icons";
import { FloatingField } from "./login-field";

interface PasswordFieldProps {
  label: string;
  icon: ReactNode;
  value: string;
  autoComplete: string;
  onChange: (value: string) => void;
}

// Campo de contraseña 
export function PasswordField({ label, icon, value, autoComplete, onChange }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <FloatingField
      label={label}
      icon={icon}
      value={value}
      type={visible ? "text" : "password"}
      autoComplete={autoComplete}
      onChange={onChange}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          title={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink-dim transition-colors hover:bg-hover hover:text-ink focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none"
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      }
    />
  );
}
