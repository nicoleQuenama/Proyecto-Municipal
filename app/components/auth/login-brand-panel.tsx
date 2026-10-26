import Image from "next/image";
import { LOGIN_BRAND_IMAGE } from "./login-data";

/** Panel de marca a pantalla completa: mensaje, imagen y firma. */
export function LoginBrandPanel() {
  return (
    <section className="relative hidden min-h-dvh flex-col justify-between overflow-hidden border-r border-line/60 bg-[#1b1b1b] px-10 py-10 lg:flex xl:px-16 xl:py-14">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(13,153,255,0.2),transparent_40%),radial-gradient(circle_at_85%_90%,rgba(124,92,255,0.18),transparent_45%)]"
      />

      <div className="relative my-auto w-full max-w-xl">
        <h1 className="max-w-lg text-4xl leading-[1.06] font-semibold tracking-tight text-ink xl:text-5xl">
          Crea sitios que se sienten vivos.
        </h1>
        <p className="mt-5 max-w-md text-sm leading-relaxed text-ink-dim">
          Diseña, publica y evoluciona tu sitio desde un solo lugar, con el control y la precisión de un
          editor profesional.
        </p>

        <figure className="relative mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]">
          <div className="relative aspect-[16/10]">
            <Image
              src={LOGIN_BRAND_IMAGE}
              alt="Vista previa del editor visual con bloques de una página"
              fill
              priority
              unoptimized
              sizes="(min-width: 1280px) 46vw, (min-width: 1024px) 52vw, 100vw"
              className="object-cover"
            />
          </div>
        </figure>
      </div>
    </section>
  );
}
