/** Los archivos que se generan (no vienen del código): README, Docker y variables de entorno. Texto puro, sin disco. */

export type BundleKind = "zip" | "docker";

export const DOCKERFILE = `# Imagen del sitio publicado con este CMS. Construye con: docker compose up --build
FROM node:22-alpine
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile || pnpm install
COPY . .
RUN pnpm build
ENV NODE_ENV=production
ENV CMS_MODE=site
EXPOSE 3000
CMD ["pnpm", "start"]
`;

export const COMPOSE = `services:
  sitio:
    build: .
    ports:
      - "3000:3000"
    environment:
      CMS_MODE: site
      AUTH_SECRET: \${AUTH_SECRET:-cambia-esta-clave}
    restart: unless-stopped
`;

export const DOCKERIGNORE = `node_modules
.next
.git
.cms-data/backups
.cms-data/users.json
`;

export const ENV_EXAMPLE = `# Copia este archivo a .env y cambia los valores.
AUTH_SECRET=cambia-esta-clave-larga-y-secreta
# «site» muestra solo el sitio publicado en la raíz; sin esto, la raíz es el editor.
CMS_MODE=site
PORT=3000
`;

export function readme(kind: BundleKind, published: boolean): string {
  const how =
    kind === "docker"
      ? "## Con Docker\n\n1. Copia `.env.example` a `.env` y cambia `AUTH_SECRET`.\n2. `docker compose up --build`\n3. Abre http://localhost:3000 — verás tu sitio publicado.\n"
      : "## Sin Docker\n\n1. `pnpm install`\n2. `pnpm build`\n3. `CMS_MODE=site pnpm start` y abre http://localhost:3000\n";
  return `# Tu sitio

Paquete exportado desde el CMS.

${published ? "Incluye el sitio **publicado** (`.cms-data/published-site.json`)." : "Aún no se había publicado nada: incluye el diseño tal como estaba guardado."}

${how}
## Qué hay dentro

- \`app/\` — el código del CMS y del visor del sitio (\`/ver\`).
- \`.cms-data/published-site.json\` — el contenido del sitio.
- \`Dockerfile\`, \`docker-compose.yml\` — para ejecutarlo en cualquier servidor con Docker.
`;
}

/** Los archivos extra de cada tipo de paquete: ruta → contenido. */
export function extraFiles(kind: BundleKind, published: boolean): Record<string, string> {
  const common = { "README.md": readme(kind, published), ".env.example": ENV_EXAMPLE };
  return kind === "docker" ? { ...common, Dockerfile: DOCKERFILE, "docker-compose.yml": COMPOSE, ".dockerignore": DOCKERIGNORE } : common;
}
