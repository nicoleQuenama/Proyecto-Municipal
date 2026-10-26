import { ComponentsIcon } from "../viewport/icons";
import { FEATURES } from "./login-data";

export function LoginBrandPanel() {
  return (
    <section className="relative hidden flex-col justify-between overflow-hidden border-r border-line/70 bg-[#242424] p-10 lg:flex">
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(13,153,255,0.18),transparent_45%)]" />
      <div className="relative">

        <h1 className="mt-14 max-w-sm text-4xl leading-[1.1] font-semibold tracking-tight text-ink">
          Crea sitios que se sienten vivos.
        </h1>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-dim">
          Diseña, publica y evoluciona tu sitio desde un solo lugar, con el control y la precisión de un
          editor profesional.
        </p>

        <ul className="mt-10 flex flex-col gap-4">
          {FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-sm text-ink-dim">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-[10px] text-accent">
                ✓
              </span>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <p className="relative text-[11px] text-ink-dim/80">
        Tu contenido, tus reglas. Todo el poder del diseño visual en un solo espacio.
      </p>
    </section>
  );
}
