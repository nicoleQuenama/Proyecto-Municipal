import { MailIcon, UserIcon, UsersIcon } from "../viewport/icons";
import { UserField } from "./user-field";

const inputClass =
  "min-w-0 flex-1 bg-transparent text-xs text-ink outline-none placeholder:text-ink-dim/60";

export function UserIdentityFields({
  name,
  username,
  email,
  onName,
  onUsername,
  onEmail,
}: {
  name: string;
  username: string;
  email: string;
  onName: (value: string) => void;
  onUsername: (value: string) => void;
  onEmail: (value: string) => void;
}) {
  return (
    <>
      <UserField label="Nombre completo" icon={<UserIcon />}>
        <input value={name} onChange={(event) => onName(event.target.value)} placeholder="Ana Torres" className={inputClass} />
      </UserField>

      <UserField label="Nombre de usuario" icon={<UsersIcon />}>
        <input
          value={username}
          onChange={(event) => onUsername(event.target.value)}
          placeholder="ana.torres"
          autoCapitalize="none"
          spellCheck={false}
          className={inputClass}
        />
      </UserField>

      <UserField label="Correo electrónico" icon={<MailIcon />}>
        <input
          type="email"
          value={email}
          onChange={(event) => onEmail(event.target.value)}
          placeholder="ana@empresa.com"
          className={inputClass}
        />
      </UserField>
    </>
  );
}
