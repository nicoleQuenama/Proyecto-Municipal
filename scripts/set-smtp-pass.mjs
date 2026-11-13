// Guarda SMTP_PASS en .env.local sin mostrarla en pantalla ni dejarla en el historial.
// Uso: pnpm mail:setup
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const file = resolve(process.cwd(), ".env.local");

// Lee una línea sin mostrarla: el terminal no refleja lo que se escribe.
function askHidden(prompt) {
  return new Promise((resolvePromise, reject) => {
    if (!process.stdin.isTTY) {
      reject(new Error("Ejecuta este comando en una terminal interactiva (no por tubería)."));
      return;
    }

    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");

    let value = "";
    const finish = (result, code = 0) => {
      process.stdin.removeListener("data", onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write("\n");
      if (code) process.exit(code);
      resolvePromise(result);
    };
    const onData = (chunk) => {
      for (const char of chunk) {
        if (char === "\r" || char === "\n") return finish(value);
        if (char === "\u0003") return finish("", 130); // Ctrl+C
        if (char === "\u007f" || char === "\b") {
          value = value.slice(0, -1);
          continue;
        }
        if (char >= " ") value += char;
      }
    };

    process.stdin.on("data", onData);
  });
}

// La cuenta SMTP debe estar definida antes de pedir la contraseña.
const user = process.env.SMTP_USER?.trim();
const host = process.env.SMTP_HOST?.trim();
if (!user || !host) {
  console.error("Antes define SMTP_HOST y SMTP_USER en .env.local.");
  process.exit(1);
}

console.log(`Cuenta SMTP: ${user} (${host})`);
console.log("Crea la contraseña de aplicación en https://myaccount.google.com/apppasswords");
console.log("No uses la contraseña normal de Gmail: Google rechazará el envío.");

const typed = await askHidden("Contraseña de aplicación (16 caracteres, oculta): ").catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
const password = typed.replace(/\s+/g, "");

if (!/^[a-zA-Z0-9]{16}$/.test(password)) {
  console.error(
    "La contraseña de aplicación debe tener exactamente 16 letras/números (sin contar espacios). No se guardó nada.",
  );
  process.exit(1);
}

// Se reemplaza solo la línea SMTP_PASS; el resto del archivo (BOM, saltos de línea
// y comentarios) queda intacto. Validar antes evita guardar una contraseña normal.
const original = readFileSync(file, "utf8");
const eol = original.includes("\r\n") ? "\r\n" : "\n";
const line = `SMTP_PASS=${password}`;

if (/^SMTP_PASS=[^\r\n]*/m.test(original)) {
  writeFileSync(file, original.replace(/^SMTP_PASS=[^\r\n]*/m, line), "utf8");
} else {
  const suffix = original.endsWith("\n") ? "" : eol;
  writeFileSync(file, `${original}${suffix}${line}${eol}`, "utf8");
}

console.log("SMTP_PASS guardado en .env.local (el archivo está en .gitignore).");
console.log("Reinicia el servidor y comprueba la conexión con: pnpm mail:test");
