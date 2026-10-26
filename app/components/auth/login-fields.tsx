import { EyeIcon, EyeOffIcon, LockIcon, UserIcon } from "../viewport/icons";

interface LoginFieldsProps {
  username: string;
  password: string;
  showPassword: boolean;
  onUsername: (value: string) => void;
  onPassword: (value: string) => void;
  onTogglePassword: () => void;
}

export function LoginFields({
  username,
  password,
  showPassword,
  onUsername,
  onPassword,
  onTogglePassword,
}: LoginFieldsProps) {
  return (
    <>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-ink">Usuario</span>
        <span className="group flex h-11 items-center gap-2.5 rounded-xl border border-line bg-canvas/70 px-3 transition-colors focus-within:border-accent/70 focus-within:ring-2 focus-within:ring-accent/20">
          <span className="text-ink-dim transition-colors group-focus-within:text-accent">
            <UserIcon />
          </span>
          <input
            type="text"
            value={username}
            onChange={(event) => onUsername(event.target.value)}
            placeholder="tu-usuario"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            className="h-full min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-dim/60"
          />
        </span>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-ink">Contraseña</span>
        <span className="group flex h-11 items-center gap-2.5 rounded-xl border border-line bg-canvas/70 px-3 transition-colors focus-within:border-accent/70 focus-within:ring-2 focus-within:ring-accent/20">
          <span className="text-ink-dim transition-colors group-focus-within:text-accent">
            <LockIcon />
          </span>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => onPassword(event.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            className="h-full min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-dim/60"
          />
          <button
            type="button"
            onClick={onTogglePassword}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink-dim transition-colors hover:bg-hover hover:text-ink"
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </span>
      </label>
    </>
  );
}
