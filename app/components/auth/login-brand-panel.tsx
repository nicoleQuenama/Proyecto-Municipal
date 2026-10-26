import { ComponentsIcon } from "../viewport/icons";


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

      </div>

      <p className="relative text-[11px] text-ink-dim/80">
        Tu contenido, tus reglas. Todo el poder del diseño visual en un solo espacio.
      </p>
    </section>
  );
}
