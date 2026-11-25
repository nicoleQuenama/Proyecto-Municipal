import type { CodeSource } from "./types.ts";

/**
 * Bloques institucionales personalizados para el portal del GAMC:
 * 1. Edificio Municipal: Sede central de 23 niveles con visualización de torre arquitectónica y directorio interactivo.
 * 2. Organigrama Institucional: Estructura jerárquica con iconografía cívica, diagrama interactivo y vista por niveles.
 */

export const EDIFICIO_MUNICIPAL_HTML = `<section class="edificio-gamc" aria-labelledby="edificio-titulo">
  <header class="edificio-gamc__encabezado">
    <div class="edificio-gamc__meta">
      <div class="edificio-gamc__badge-sede">
        <svg class="edificio-gamc__icono-sede" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 21h18M5 21V7l8-4 8 4v14M9 10h2M9 14h2M9 18h2M15 10h2M15 14h2M15 18h2"></path>
        </svg>
        <span>Sede Central GAMC · Plaza 14 de Septiembre</span>
      </div>
      <h2 id="edificio-titulo" class="edificio-gamc__titulo">Edificio Municipal</h2>
      <p class="edificio-gamc__subtitulo">
        Torre institucional de 23 niveles. Navega interactivamente piso por piso, ubica dependencias, ventanillas y horarios de atención al ciudadano.
      </p>
    </div>

    <div class="edificio-gamc__buscador-caja">
      <div class="edificio-gamc__buscador-input-wrap">
        <svg class="edificio-gamc__buscador-lupa" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path>
        </svg>
        <input type="search" id="edificio-busqueda" placeholder="Buscar piso, trámite o secretaría..." aria-label="Buscar dependencias en el edificio" autocomplete="off">
        <button type="button" id="edificio-limpiar-busqueda" class="edificio-gamc__limpiar-btn" aria-label="Limpiar búsqueda" hidden="">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"></path></svg>
        </button>
      </div>
      <nav class="edificio-gamc__filtros" aria-label="Filtros por sector">
        <button type="button" class="edificio-gamc__filtro-btn is-activo" data-sector="todos">Todos los pisos</button>
        <button type="button" class="edificio-gamc__filtro-btn" data-sector="atencion">Atención y Trámites (1–3)</button>
        <button type="button" class="edificio-gamc__filtro-btn" data-sector="obras">Territorio y Obras (4–9)</button>
        <button type="button" class="edificio-gamc__filtro-btn" data-sector="social">Salud y Social (10–15)</button>
        <button type="button" class="edificio-gamc__filtro-btn" data-sector="finanzas">Finanzas y Legal (16–20)</button>
        <button type="button" class="edificio-gamc__filtro-btn" data-sector="despacho">Despacho Alcalde (21–23)</button>
      </nav>
    </div>
  </header>

  <div class="edificio-gamc__panel">
    <aside class="edificio-gamc__torre-modulo" aria-label="Representación arquitectónica de la torre">
      <div class="edificio-gamc__torre-marco">
        <div class="edificio-gamc__torre-remate">
          <div class="edificio-gamc__torre-antena"></div>
          <div class="edificio-gamc__torre-terraza">
            <span class="edificio-gamc__torre-helipuerto">GAMC</span>
          </div>
        </div>

        <div class="edificio-gamc__torre-cuerpo">
          <div class="edificio-gamc__ducto-ascensor" aria-hidden="true">
            <div id="edificio-cabina" class="edificio-gamc__cabina-ascensor">
              <span id="edificio-cabina-nivel" class="edificio-gamc__cabina-numero">01</span>
              <div class="edificio-gamc__cabina-luz"></div>
            </div>
          </div>

          <div id="edificio-torre-niveles" class="edificio-gamc__torre-pisos-lista" role="tablist" aria-orientation="vertical"></div>
        </div>

        <div class="edificio-gamc__torre-base">
          <div class="edificio-gamc__torre-portal">
            <span class="edificio-gamc__portal-rotulo">INGRESO PRINCIPAL</span>
          </div>
        </div>
      </div>
      <p class="edificio-gamc__torre-pista">Selecciona un nivel en la torre o navega el directorio.</p>
    </aside>

    <main class="edificio-gamc__directorio-modulo">
      <div class="edificio-gamc__mando-ascensor">
        <div class="edificio-gamc__mando-indicador">
          <span class="edificio-gamc__mando-etiqueta">Nivel seleccionado</span>
          <div class="edificio-gamc__mando-cifra">
            <strong id="edificio-display-num">01</strong>
            <div class="edificio-gamc__mando-meta">
              <span id="edificio-display-sector">Sector Atención Ciudadana</span>
              <small id="edificio-display-posicion">Piso 1 de 23</small>
            </div>
          </div>
        </div>

        <div class="edificio-gamc__mando-flechas">
          <button type="button" id="edificio-btn-subir" class="edificio-gamc__flecha-btn" title="Subir al piso siguiente" aria-label="Subir un piso">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m18 15-6-6-6 6"></path></svg>
            <span>Subir</span>
          </button>
          <button type="button" id="edificio-btn-bajar" class="edificio-gamc__flecha-btn" title="Bajar al piso anterior" aria-label="Bajar un piso">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"></path></svg>
            <span>Bajar</span>
          </button>
        </div>
      </div>

      <div class="edificio-gamc__carrusel-pisos-wrap">
        <div id="edificio-carrusel-pisos" class="edificio-gamc__carrusel-pisos" role="tablist" aria-label="Lista horizontal de pisos"></div>
      </div>

      <article class="edificio-gamc__ficha" aria-live="polite">
        <header class="edificio-gamc__ficha-encabezado">
          <div class="edificio-gamc__ficha-tags">
            <span id="edificio-ficha-tag-sector" class="edificio-gamc__ficha-tag">Atención Ciudadana</span>
            <span id="edificio-ficha-tag-piso" class="edificio-gamc__ficha-tag-piso">Piso 1</span>
          </div>
          <h3 id="edificio-ficha-titulo" class="edificio-gamc__ficha-titulo">Trámites, Catastro y Ventanilla Única</h3>
          <p id="edificio-ficha-descripcion" class="edificio-gamc__ficha-descripcion">
            Atención al ciudadano, ventanilla única de trámites, información de catastro y oficina de turismo municipal.
          </p>
        </header>

        <div class="edificio-gamc__ficha-grilla">
          <div class="edificio-gamc__info-tarjeta">
            <svg class="edificio-gamc__info-icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path>
            </svg>
            <div>
              <span class="edificio-gamc__info-rotulo">Horario de atención</span>
              <strong class="edificio-gamc__info-valor">Lun a Vie: 08:00 – 16:00</strong>
            </div>
          </div>

          <div class="edificio-gamc__info-tarjeta">
            <svg class="edificio-gamc__info-icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="3" width="20" height="14" rx="2"></rect><path d="M8 21h8M12 17v4"></path>
            </svg>
            <div>
              <span class="edificio-gamc__info-rotulo">Modalidad de servicio</span>
              <strong class="edificio-gamc__info-valor">Presencial y Digital (SIMAT)</strong>
            </div>
          </div>

          <div class="edificio-gamc__info-tarjeta">
            <svg class="edificio-gamc__info-icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 3v18M18 3v18M6 8h12M6 16h12"></path>
            </svg>
            <div>
              <span class="edificio-gamc__info-rotulo">Accesibilidad</span>
              <strong class="edificio-gamc__info-valor">Ascensores A y B · Rampa inclusiva</strong>
            </div>
          </div>

          <div class="edificio-gamc__info-tarjeta">
            <svg class="edificio-gamc__info-icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
            <div>
              <span class="edificio-gamc__info-rotulo">Contacto de guardia</span>
              <strong class="edificio-gamc__info-valor">Línea gratuita 800-10-0000</strong>
            </div>
          </div>
        </div>

        <div class="edificio-gamc__ficha-unidades">
          <span class="edificio-gamc__unidades-titulo">Unidades y ventanillas disponibles en este nivel:</span>
          <ul id="edificio-ficha-chips" class="edificio-gamc__unidades-lista"></ul>
        </div>
      </article>
    </main>
  </div>
</section>`;

export const EDIFICIO_MUNICIPAL_CSS = `.edificio-gamc {
  --gamc-primario: #00a7d6;
  --gamc-primario-hover: #008bb3;
  --gamc-primario-suave: #e6f6fb;
  --gamc-marino: #0f172a;
  --gamc-texto: #334155;
  --gamc-texto-suave: #64748b;
  --gamc-borde: #e2e8f0;
  --gamc-superficie: #f8fafc;
  font-family: inherit;
  color: var(--gamc-marino);
  padding: 16px 8px 32px;
  max-width: 1100px;
  margin: 0 auto;
}

.edificio-gamc__encabezado {
  margin-bottom: 24px;
}

.edificio-gamc__badge-sede {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  background: var(--gamc-primario-suave);
  color: var(--gamc-primario);
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.edificio-gamc__icono-sede {
  width: 15px;
  height: 15px;
}

.edificio-gamc__titulo {
  margin: 0 0 8px;
  font-size: clamp(26px, 4vw, 36px);
  font-weight: 800;
  color: var(--gamc-marino);
  letter-spacing: -0.02em;
}

.edificio-gamc__subtitulo {
  margin: 0 0 20px;
  font-size: 15px;
  line-height: 1.5;
  color: var(--gamc-texto-suave);
  max-width: 680px;
}

.edificio-gamc__buscador-caja {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.edificio-gamc__buscador-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 560px;
  background: #ffffff;
  border: 1.5px solid var(--gamc-borde);
  border-radius: 12px;
  padding: 0 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.edificio-gamc__buscador-input-wrap:focus-within {
  border-color: var(--gamc-primario);
  box-shadow: 0 0 0 3px rgba(0, 167, 214, 0.15);
}

.edificio-gamc__buscador-lupa {
  width: 18px;
  height: 18px;
  color: var(--gamc-texto-suave);
  flex-shrink: 0;
  margin-right: 10px;
}

.edificio-gamc__buscador-input-wrap input {
  flex: 1;
  height: 44px;
  border: none;
  background: transparent;
  font-size: 14px;
  color: var(--gamc-marino);
  outline: none;
}

.edificio-gamc__limpiar-btn {
  background: none;
  border: none;
  padding: 4px;
  color: var(--gamc-texto-suave);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edificio-gamc__limpiar-btn svg {
  width: 16px;
  height: 16px;
}

.edificio-gamc__filtros {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.edificio-gamc__filtro-btn {
  padding: 6px 14px;
  background: var(--gamc-superficie);
  border: 1px solid var(--gamc-borde);
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  color: var(--gamc-texto);
  cursor: pointer;
  transition: all 0.18s ease;
}

.edificio-gamc__filtro-btn:hover {
  background: #ffffff;
  border-color: var(--gamc-primario);
  color: var(--gamc-primario);
}

.edificio-gamc__filtro-btn.is-activo {
  background: var(--gamc-primario);
  border-color: var(--gamc-primario);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 167, 214, 0.25);
}

.edificio-gamc__panel {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

.edificio-gamc__torre-modulo {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.edificio-gamc__torre-marco {
  width: 100%;
  max-width: 230px;
  background: #ffffff;
  border: 1.5px solid var(--gamc-borde);
  border-radius: 18px 18px 10px 10px;
  padding: 12px 10px 10px;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.05);
}

.edificio-gamc__torre-remate {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 6px;
}

.edificio-gamc__torre-antena {
  width: 3px;
  height: 18px;
  background: linear-gradient(to top, var(--gamc-primario), #94a3b8);
  border-radius: 2px 2px 0 0;
}

.edificio-gamc__torre-terraza {
  width: 90%;
  height: 22px;
  background: var(--gamc-marino);
  border-radius: 6px 6px 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edificio-gamc__torre-helipuerto {
  font-size: 10px;
  font-weight: 800;
  color: var(--gamc-primario);
  letter-spacing: 0.1em;
}

.edificio-gamc__torre-cuerpo {
  position: relative;
  display: grid;
  grid-template-columns: 34px 1fr;
  gap: 6px;
  padding: 6px 4px;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
}

.edificio-gamc__ducto-ascensor {
  position: relative;
  width: 32px;
  height: 100%;
  background: #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
}

.edificio-gamc__cabina-ascensor {
  position: absolute;
  left: 2px;
  width: 28px;
  height: 20px;
  background: var(--gamc-primario);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 167, 214, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: top 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 2;
}

.edificio-gamc__cabina-numero {
  font-size: 10px;
  font-weight: 800;
  color: #ffffff;
  line-height: 1;
}

.edificio-gamc__cabina-luz {
  width: 8px;
  height: 2px;
  background: #ffffff;
  border-radius: 1px;
  margin-top: 2px;
  opacity: 0.8;
}

.edificio-gamc__torre-pisos-lista {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 520px;
  overflow-y: auto;
  padding-right: 2px;
}

.edificio-gamc__piso-slot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 3px 6px;
  height: 21px;
  border-radius: 4px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  font-size: 10px;
  font-weight: 700;
  color: var(--gamc-texto);
  cursor: pointer;
  transition: all 0.15s ease;
}

.edificio-gamc__piso-slot:hover {
  background: #e2e8f0;
  border-color: var(--gamc-primario);
}

.edificio-gamc__piso-slot.is-activo {
  background: var(--gamc-primario);
  border-color: var(--gamc-primario);
  color: #ffffff;
}

.edificio-gamc__piso-slot-tag {
  font-size: 8px;
  font-weight: 600;
  opacity: 0.8;
}

.edificio-gamc__torre-base {
  margin-top: 6px;
  padding: 8px;
  background: var(--gamc-marino);
  border-radius: 6px;
  text-align: center;
}

.edificio-gamc__portal-rotulo {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--gamc-primario);
}

.edificio-gamc__torre-pista {
  margin-top: 8px;
  font-size: 11px;
  color: var(--gamc-texto-suave);
  text-align: center;
}

.edificio-gamc__directorio-modulo {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.edificio-gamc__mando-ascensor {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  background: linear-gradient(135deg, #ffffff 0%, var(--gamc-superficie) 100%);
  border: 1.5px solid var(--gamc-borde);
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
}

.edificio-gamc__mando-etiqueta {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--gamc-texto-suave);
}

.edificio-gamc__mando-cifra {
  display: flex;
  align-items: baseline;
  gap: 14px;
  margin-top: 4px;
}

.edificio-gamc__mando-cifra strong {
  font-size: 40px;
  font-weight: 900;
  color: var(--gamc-primario);
  line-height: 1;
}

.edificio-gamc__mando-meta {
  display: flex;
  flex-direction: column;
}

.edificio-gamc__mando-meta span {
  font-size: 15px;
  font-weight: 700;
  color: var(--gamc-marino);
}

.edificio-gamc__mando-meta small {
  font-size: 12px;
  color: var(--gamc-texto-suave);
}

.edificio-gamc__mando-flechas {
  display: flex;
  gap: 8px;
}

.edificio-gamc__flecha-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: #ffffff;
  border: 1.5px solid var(--gamc-borde);
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  color: var(--gamc-marino);
  cursor: pointer;
  transition: all 0.15s ease;
}

.edificio-gamc__flecha-btn:hover:not(:disabled) {
  border-color: var(--gamc-primario);
  color: var(--gamc-primario);
  background: var(--gamc-primario-suave);
}

.edificio-gamc__flecha-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.edificio-gamc__flecha-btn svg {
  width: 16px;
  height: 16px;
}

.edificio-gamc__carrusel-pisos-wrap {
  overflow-x: auto;
  padding-bottom: 4px;
}

.edificio-gamc__carrusel-pisos {
  display: flex;
  gap: 6px;
}

.edificio-gamc__carrusel-item {
  flex: 0 0 auto;
  min-width: 36px;
  height: 36px;
  padding: 0 8px;
  background: #ffffff;
  border: 1px solid var(--gamc-borde);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  color: var(--gamc-texto);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.edificio-gamc__carrusel-item:hover {
  border-color: var(--gamc-primario);
  color: var(--gamc-primario);
}

.edificio-gamc__carrusel-item.is-activo {
  background: var(--gamc-primario);
  border-color: var(--gamc-primario);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 167, 214, 0.3);
}

.edificio-gamc__ficha {
  background: #ffffff;
  border: 1.5px solid var(--gamc-borde);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
}

.edificio-gamc__ficha-encabezado {
  margin-bottom: 20px;
}

.edificio-gamc__ficha-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.edificio-gamc__ficha-tag {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 9999px;
  background: var(--gamc-primario-suave);
  color: var(--gamc-primario);
}

.edificio-gamc__ficha-tag-piso {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 9999px;
  background: #f1f5f9;
  color: var(--gamc-texto);
}

.edificio-gamc__ficha-titulo {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 800;
  color: var(--gamc-marino);
}

.edificio-gamc__ficha-descripcion {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--gamc-texto);
}

.edificio-gamc__ficha-grilla {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.edificio-gamc__info-tarjeta {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  background: var(--gamc-superficie);
  border: 1px solid var(--gamc-borde);
  border-radius: 10px;
}

.edificio-gamc__info-icono {
  width: 20px;
  height: 20px;
  color: var(--gamc-primario);
  flex-shrink: 0;
  margin-top: 2px;
}

.edificio-gamc__info-rotulo {
  display: block;
  font-size: 11px;
  color: var(--gamc-texto-suave);
  margin-bottom: 2px;
}

.edificio-gamc__info-valor {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: var(--gamc-marino);
  line-height: 1.3;
}

.edificio-gamc__ficha-unidades {
  padding-top: 16px;
  border-top: 1px solid var(--gamc-borde);
}

.edificio-gamc__unidades-titulo {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: var(--gamc-texto-suave);
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.edificio-gamc__unidades-lista {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.edificio-gamc__chip {
  padding: 6px 12px;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--gamc-marino);
}

@media (max-width: 840px) {
  .edificio-gamc__panel {
    grid-template-columns: 1fr;
  }
  .edificio-gamc__torre-modulo {
    display: none;
  }
  .edificio-gamc__mando-ascensor {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  .edificio-gamc__mando-flechas {
    width: 100%;
  }
  .edificio-gamc__flecha-btn {
    flex: 1;
    justify-content: center;
  }
}`;

export const EDIFICIO_MUNICIPAL_TS = `type SectorId = "todos" | "atencion" | "obras" | "social" | "finanzas" | "despacho";

interface PisoData {
  piso: number;
  sector: SectorId;
  sectorNombre: string;
  areas: string;
  descripcion: string;
  unidades: string[];
}

const PISOS: PisoData[] = [
  {
    piso: 1,
    sector: "atencion",
    sectorNombre: "Atención y Trámites",
    areas: "Trámites, Catastro y Ventanilla Única",
    descripcion: "Atención al ciudadano, ventanilla única de trámites, información de catastro y oficina de turismo municipal.",
    unidades: ["Ventanilla Única", "Información Catastral", "Guía Ciudadana", "Oficina de Turismo Municipal"]
  },
  {
    piso: 2,
    sector: "atencion",
    sectorNombre: "Atención y Trámites",
    areas: "Recaudaciones e Impuestos Municipales",
    descripcion: "Pago de impuestos a la propiedad de bienes inmuebles y vehículos, tasas municipales y emisión de comprobantes vía SIMAT.",
    unidades: ["Cajas de Cobro SIMAT", "Impuestos Inmuebles", "Impuestos Vehículos", "Exenciones y Beneficios"]
  },
  {
    piso: 3,
    sector: "atencion",
    sectorNombre: "Atención y Trámites",
    areas: "Licencias de Funcionamiento y Actividades Económicas",
    descripcion: "Trámites de apertura, renovación y fiscalización de patentes comerciales, autorizaciones de espectáculos y nuevos emprendimientos.",
    unidades: ["Emisión de Licencias", "Patentes Comerciales", "Asistencia a Emprendedores", "Inspección Económica"]
  },
  {
    piso: 4,
    sector: "obras",
    sectorNombre: "Territorio y Obras",
    areas: "Secretaría de Obras Públicas",
    descripcion: "Seguimiento y fiscalización de obras municipales, pavimento rígido, mantenimiento vial y proyectos vecinales.",
    unidades: ["Despacho de Obras Públicas", "Supervisión de Vías", "Mantenimiento Barrial", "Atención a OTBs"]
  },
  {
    piso: 5,
    sector: "obras",
    sectorNombre: "Territorio y Obras",
    areas: "Urbanismo y Ordenamiento del Territorio",
    descripcion: "Visado de planos de edificación, permisos de construcción, certificados de compatibilidad de uso de suelo y regularización.",
    unidades: ["Aprobación de Planos", "Línea y Nivel", "Regulación Urbana", "Uso de Suelo"]
  },
  {
    piso: 6,
    sector: "obras",
    sectorNombre: "Territorio y Obras",
    areas: "Dirección de Medio Ambiente",
    descripcion: "Gestión de áreas verdes y arbolado urbano, control de emisiones, remediación ambiental y educación ecológica ciudadana.",
    unidades: ["Gestión Ambiental", "Protección de Áreas Verdes", "Monitoreo Atmosférico", "Educación Ambiental"]
  },
  {
    piso: 7,
    sector: "obras",
    sectorNombre: "Territorio y Obras",
    areas: "Gestión de Riesgos y Atención de Emergencias (UGR)",
    descripcion: "Prevención ante eventos climáticos, atención de inundaciones, deslizamientos, inspecciones técnicas de seguridad estructural.",
    unidades: ["Centro de Operaciones de Emergencia", "Monitoreo Hidrológico", "Inspecciones de Seguridad"]
  },
  {
    piso: 8,
    sector: "obras",
    sectorNombre: "Territorio y Obras",
    areas: "Servicios Públicos Municipales",
    descripcion: "Coordinación de alumbrado público, mantenimiento de mercados municipales, cementerios y supervisión de recojo de residuos.",
    unidades: ["Alumbrado Público", "Administración de Mercados", "Cementerio General", "Servicios Básicos"]
  },
  {
    piso: 9,
    sector: "obras",
    sectorNombre: "Territorio y Obras",
    areas: "Movilidad Urbana y Transporte",
    descripcion: "Ordenamiento del transporte público, semaforización moderna, parqueo tarifado SEM y señalización vial en toda la ciudad.",
    unidades: ["Rutas y Tránsito", "Semaforización", "Sistema SEM", "Educación Vial"]
  },
  {
    piso: 10,
    sector: "social",
    sectorNombre: "Salud y Social",
    areas: "Salud Municipal y Red Hospitalaria",
    descripcion: "Coordinación de centros de salud de primer y segundo nivel, farmacias municipales comunitarias y programas preventivos.",
    unidades: ["Red Municipal de Salud", "Farmacia Municipal", "Campañas Preventivas", "Salud Escolar"]
  },
  {
    piso: 11,
    sector: "social",
    sectorNombre: "Salud y Social",
    areas: "Desarrollo Humano, Educación y Cultura",
    descripcion: "Apoyo a unidades educativas fiscales, fomento a la red de bibliotecas municipales, museos, teatros y patrimonio cultural.",
    unidades: ["Infraestructura Educativa", "Bibliotecas y Archivos", "Patrimonio Cultural", "Eventos Cívicos"]
  },
  {
    piso: 12,
    sector: "social",
    sectorNombre: "Salud y Social",
    areas: "Dirección de Deportes y Juventud",
    descripcion: "Gestión de complejos deportivos, escuelas deportivas gratuitas, torneos intercolegiales y apoyo a atletas locales.",
    unidades: ["Complejos y Canchas", "Escuelas de Formación", "Juventud y Voluntariado"]
  },
  {
    piso: 13,
    sector: "social",
    sectorNombre: "Salud y Social",
    areas: "Desarrollo Social y Comunitario",
    descripcion: "Programas de apoyo social a personas adultas mayores, personas con discapacidad y centros integrales para la familia.",
    unidades: ["Atención al Adulto Mayor", "Unidad de Discapacidad", "Albergues Municipales"]
  },
  {
    piso: 14,
    sector: "social",
    sectorNombre: "Salud y Social",
    areas: "Defensoría de la Niñez y Adolescencia",
    descripcion: "Protección integral a niñas, niños y adolescentes, orientación legal especializada y apoyo psicológico multidisciplinario.",
    unidades: ["Mesa de Denuncias", "Equipo Psicológico", "Orientación Familiar", "Permisos de Viaje"]
  },
  {
    piso: 15,
    sector: "social",
    sectorNombre: "Salud y Social",
    areas: "Servicios Legales Integrales Municipales (SLIM)",
    descripcion: "Atención gratuita, contención psicológica y patrocinio legal a víctimas de violencia familiar o de género en el municipio.",
    unidades: ["Atención en Crisis", "Patrocinio Legal Gratuito", "Psicología y Trabajo Social"]
  },
  {
    piso: 16,
    sector: "finanzas",
    sectorNombre: "Finanzas y Legal",
    areas: "Dirección de Asesoría Jurídica",
    descripcion: "Revisión y emisión de criterios legales sobre contratos, decretos ediles, convenios interinstitucionales y resoluciones.",
    unidades: ["Contratos y Convenios", "Normativa Edil", "Defensa Judicial"]
  },
  {
    piso: 17,
    sector: "finanzas",
    sectorNombre: "Finanzas y Legal",
    areas: "Dirección de Transparencia y Lucha contra la Corrupción",
    descripcion: "Canalización de denuncias de ética, acceso a la información pública municipal, rendición de cuentas y control social.",
    unidades: ["Unidad de Ética Pública", "Acceso a la Información", "Rendición de Cuentas"]
  },
  {
    piso: 18,
    sector: "finanzas",
    sectorNombre: "Finanzas y Legal",
    areas: "Secretaría de Planificación y Presupuesto",
    descripcion: "Formulación del Plan Operativo Anual (POA), programación presupuestaria y evaluación estratégica institucional.",
    unidades: ["Planificación Estratégica", "Programación POA", "Evaluación de Gestión"]
  },
  {
    piso: 19,
    sector: "finanzas",
    sectorNombre: "Finanzas y Legal",
    areas: "Secretaría Administrativa y Financiera",
    descripcion: "Ejecución presupuestaria, gestión de pagos a proveedores, contabilidad integrada, balances y tesorería central.",
    unidades: ["Tesorería Municipal", "Contabilidad Central", "Control de Pagos"]
  },
  {
    piso: 20,
    sector: "finanzas",
    sectorNombre: "Finanzas y Legal",
    areas: "Dirección de Recursos Humanos y Contrataciones",
    descripcion: "Administración del personal municipal, convocatorias públicas de empleo, bienestar laboral y licitaciones del SICOES.",
    unidades: ["Personal y Planillas", "Licitaciones y Contratos", "Capacitación Continua"]
  },
  {
    piso: 21,
    sector: "despacho",
    sectorNombre: "Despacho del Alcalde",
    areas: "Dirección de Tecnología y Ciudad Digital",
    descripcion: "Desarrollo de plataformas en línea, infraestructura de red, seguridad informática, trámites digitales y datos abiertos.",
    unidades: ["Desarrollo de Software", "Centro de Datos GAMC", "Soporte e Innovación Digital"]
  },
  {
    piso: 22,
    sector: "despacho",
    sectorNombre: "Despacho del Alcalde",
    areas: "Secretaría General y Coordinación de Gabinete",
    descripcion: "Coordinación entre todas las secretarías municipales, gestión de correspondencia oficial, audiencias y enlace con el Concejo.",
    unidades: ["Gabinete de Secretarios", "Ventanilla de Correspondencia Oficial", "Audiencias Ciudadanas"]
  },
  {
    piso: 23,
    sector: "despacho",
    sectorNombre: "Despacho del Alcalde",
    areas: "Despacho del Alcalde Municipal",
    descripcion: "Oficina principal del Alcalde de Cochabamba, despacho de acuerdos estratégicos, agenda oficial y representación internacional.",
    unidades: ["Despacho Oficial del Alcalde", "Relaciones Internacionales", "Comunicación y Vocería"]
  }
];

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

let actual = 0;
let sectorFiltro: SectorId = "todos";
let terminoBusqueda = "";

const displayNum = $("edificio-display-num");
const displaySector = $("edificio-display-sector");
const displayPosicion = $("edificio-display-posicion");
const btnSubir = $<HTMLButtonElement>("edificio-btn-subir");
const btnBajar = $<HTMLButtonElement>("edificio-btn-bajar");
const carrusel = $("edificio-carrusel-pisos");
const torreNiveles = $("edificio-torre-niveles");
const cabina = $("edificio-cabina");
const cabinaNum = $("edificio-cabina-nivel");

const fichaTagSector = $("edificio-ficha-tag-sector");
const fichaTagPiso = $("edificio-ficha-tag-piso");
const fichaTitulo = $("edificio-ficha-titulo");
const fichaDescripcion = $("edificio-ficha-descripcion");
const fichaChips = $("edificio-ficha-chips");

const inputBusqueda = $<HTMLInputElement>("edificio-busqueda");
const btnLimpiar = $<HTMLButtonElement>("edificio-limpiar-busqueda");
const botonesFiltro = document.querySelectorAll<HTMLButtonElement>(".edificio-gamc__filtro-btn");

function inicializarUI() {
  carrusel.innerHTML = "";
  torreNiveles.innerHTML = "";

  PISOS.forEach((p, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "edificio-gamc__carrusel-item";
    btn.textContent = String(p.piso);
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-label", \`Piso \${p.piso} - \${p.areas}\`);
    btn.addEventListener("click", () => ir(idx));
    carrusel.appendChild(btn);
  });

  for (let i = PISOS.length - 1; i >= 0; i--) {
    const p = PISOS[i];
    const slot = document.createElement("div");
    slot.className = "edificio-gamc__piso-slot";
    slot.dataset.indice = String(i);
    slot.setAttribute("role", "tab");
    slot.innerHTML = \`<span>P\${p.piso < 10 ? "0" + p.piso : p.piso}</span><span class="edificio-gamc__piso-slot-tag">\${p.sector.slice(0, 4).toUpperCase()}</span>\`;
    slot.addEventListener("click", () => ir(i));
    torreNiveles.appendChild(slot);
  }
}

function ir(idx: number) {
  actual = Math.max(0, Math.min(idx, PISOS.length - 1));
  const data = PISOS[actual];
  const numStr = data.piso < 10 ? "0" + data.piso : String(data.piso);

  displayNum.textContent = numStr;
  displaySector.textContent = data.sectorNombre;
  displayPosicion.textContent = \`Piso \${data.piso} de \${PISOS.length}\`;

  btnBajar.disabled = actual === 0;
  btnSubir.disabled = actual === PISOS.length - 1;

  cabinaNum.textContent = numStr;
  const pct = (PISOS.length - 1 - actual) / (PISOS.length - 1);
  const maxHeight = 460;
  cabina.style.top = \`\${Math.round(pct * maxHeight)}px\`;

  document.querySelectorAll(".edificio-gamc__carrusel-item").forEach((btn, i) => {
    btn.classList.toggle("is-activo", i === actual);
    btn.setAttribute("aria-selected", String(i === actual));
  });

  document.querySelectorAll(".edificio-gamc__piso-slot").forEach((slot) => {
    const sIdx = Number((slot as HTMLElement).dataset.indice);
    slot.classList.toggle("is-activo", sIdx === actual);
    slot.setAttribute("aria-selected", String(sIdx === actual));
  });

  fichaTagSector.textContent = data.sectorNombre;
  fichaTagPiso.textContent = \`Piso \${data.piso}\`;
  fichaTitulo.textContent = data.areas;
  fichaDescripcion.textContent = data.descripcion;

  fichaChips.innerHTML = "";
  data.unidades.forEach((u) => {
    const li = document.createElement("li");
    li.className = "edificio-gamc__chip";
    li.textContent = u;
    fichaChips.appendChild(li);
  });

  const activeCarrusel = carrusel.children[actual] as HTMLElement;
  if (activeCarrusel) {
    carrusel.scrollTo({
      left: activeCarrusel.offsetLeft - carrusel.clientWidth / 2 + activeCarrusel.clientWidth / 2,
      behavior: "smooth"
    });
  }
}

function filtrarPisos() {
  const q = terminoBusqueda.toLowerCase().trim();
  btnLimpiar.hidden = q === "";

  let primerCoincidencia = -1;

  PISOS.forEach((p, idx) => {
    const cumpleSector = sectorFiltro === "todos" || p.sector === sectorFiltro;
    const cumpleTexto =
      q === "" ||
      p.areas.toLowerCase().includes(q) ||
      p.descripcion.toLowerCase().includes(q) ||
      p.unidades.some((u) => u.toLowerCase().includes(q)) ||
      String(p.piso) === q;

    const visible = cumpleSector && cumpleTexto;
    const carruselBtn = carrusel.children[idx] as HTMLElement;
    if (carruselBtn) carruselBtn.style.display = visible ? "flex" : "none";

    const slot = torreNiveles.querySelector<HTMLElement>(\`[data-indice="\${idx}"]\`);
    if (slot) {
      slot.style.display = visible ? "flex" : "none";
      if (visible && q !== "") {
        slot.style.borderColor = "var(--gamc-primario)";
      } else if (slot) {
        slot.style.borderColor = "";
      }
    }

    if (visible && primerCoincidencia === -1) {
      primerCoincidencia = idx;
    }
  });

  if (primerCoincidencia !== -1) {
    ir(primerCoincidencia);
  }
}

btnSubir.addEventListener("click", () => ir(actual + 1));
btnBajar.addEventListener("click", () => ir(actual - 1));

botonesFiltro.forEach((btn) => {
  btn.addEventListener("click", () => {
    botonesFiltro.forEach((b) => b.classList.remove("is-activo"));
    btn.classList.add("is-activo");
    sectorFiltro = (btn.dataset.sector || "todos") as SectorId;
    filtrarPisos();
  });
});

inputBusqueda.addEventListener("input", () => {
  terminoBusqueda = inputBusqueda.value;
  filtrarPisos();
});

btnLimpiar.addEventListener("click", () => {
  inputBusqueda.value = "";
  terminoBusqueda = "";
  filtrarPisos();
  inputBusqueda.focus();
});

inicializarUI();
ir(0);`;

export const ORGANIGRAMA_MUNICIPAL_HTML = `<section class="org-gamc" aria-labelledby="org-titulo">
  <header class="org-gamc__encabezado">
    <div class="org-gamc__meta">
      <div class="org-gamc__insignia">
        <svg class="org-gamc__insignia-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L4 5v6.5c0 5.25 3.4 10.15 8 11.5 4.6-1.35 8-6.25 8-11.5V5l-8-3z"></path>
          <path d="M12 7l1.5 3 3.5.5-2.5 2.5.5 3.5-3-1.6-3 1.6.5-3.5-2.5-2.5 3.5-.5z" fill="currentColor"></path>
        </svg>
        <span>Estructura Oficial · Gobierno Autónomo Municipal de Cochabamba</span>
      </div>
      <h2 id="org-titulo" class="org-gamc__titulo">Organigrama Institucional</h2>
      <p class="org-gamc__intro">
        Estructura jerárquica y operativa del GAMC. Explora el mapa de dependencias, desde el Despacho del Alcalde hasta las Secretarías, Direcciones y Departamentos técnicos.
      </p>
    </div>

    <div class="org-gamc__barra-control">
      <div class="org-gamc__buscador-wrap">
        <svg class="org-gamc__lupa-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path>
        </svg>
        <input id="org-buscar" type="search" placeholder="Buscar secretaría, dirección o unidad..." aria-label="Buscar en el organigrama" autocomplete="off">
        <button type="button" id="org-limpiar" class="org-gamc__limpiar-btn" aria-label="Borrar búsqueda" hidden="">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"></path></svg>
        </button>
      </div>

      <div class="org-gamc__selector-vista" role="group" aria-label="Modo de visualización">
        <button type="button" id="org-btn-vista-diagrama" class="org-gamc__vista-btn is-activo" aria-pressed="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="6" height="6" rx="1"></rect><rect x="15" y="15" width="6" height="6" rx="1"></rect><path d="M6 9v3a3 3 0 0 0 3 3h6"></path></svg>
          <span>Diagrama Dinámico</span>
        </button>
        <button type="button" id="org-btn-vista-arbol" class="org-gamc__vista-btn" aria-pressed="false">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
          <span>Estructura por Niveles</span>
        </button>
      </div>
    </div>
    <p id="org-estado" class="org-gamc__estado" aria-live="polite"></p>
  </header>

  <div id="org-contenedor-diagrama" class="org-gamc__diagrama-marco">
    <div class="org-gamc__herramientas" role="toolbar" aria-label="Herramientas de navegación del diagrama">
      <button type="button" data-accion="acercar" title="Acercar zoom" aria-label="Acercar zoom">+</button>
      <button type="button" data-accion="alejar" title="Alejar zoom" aria-label="Alejar zoom">−</button>
      <button type="button" data-accion="ajustar" title="Ajustar diagrama a pantalla" aria-label="Ajustar a la pantalla">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"></path></svg>
      </button>
      <span class="org-gamc__separador-herramientas"></span>
      <button type="button" data-accion="expandir" class="org-gamc__btn-texto">Expandir todo</button>
      <button type="button" data-accion="contraer" class="org-gamc__btn-texto">Contraer todo</button>
    </div>

    <div id="org-lienzo" class="org-gamc__lienzo"></div>
    <ul id="org-leyenda" class="org-gamc__leyenda" aria-label="Niveles jerárquicos"></ul>
  </div>

  <div id="org-contenedor-arbol" class="org-gamc__arbol-marco" hidden="">
    <div id="org-arbol-niveles" class="org-gamc__arbol-niveles"></div>
  </div>

  <aside id="org-detalle" class="org-gamc__detalle" aria-live="polite" hidden="">
    <div class="org-gamc__detalle-cabecera">
      <span id="org-tipo-badge" class="org-gamc__badge-nivel"></span>
      <p id="org-ruta" class="org-gamc__ruta"></p>
    </div>
    <div class="org-gamc__detalle-cuerpo">
      <div class="org-gamc__detalle-info">
        <h3 id="org-nombre" class="org-gamc__nombre-unidad"></h3>
        <p id="org-cuenta" class="org-gamc__cuenta-dependientes"></p>
      </div>
      <div class="org-gamc__detalle-acciones">
        <button type="button" data-detalle="superior" class="org-gamc__accion-btn">Ir a nivel superior</button>
        <button type="button" data-detalle="rama" class="org-gamc__accion-btn">Expandir dependencias</button>
        <button type="button" data-detalle="centrar" class="org-gamc__accion-btn org-gamc__accion-btn--primario">Centrar en diagrama</button>
      </div>
    </div>
  </aside>
</section>`;

export const ORGANIGRAMA_MUNICIPAL_CSS = `.org-gamc {
  --gamc-primario: #00a7d6;
  --gamc-primario-hover: #008bb3;
  --gamc-primario-suave: #e6f6fb;
  --gamc-marino: #0f172a;
  --gamc-texto: #334155;
  --gamc-texto-suave: #64748b;
  --gamc-borde: #cbd5e1;
  --gamc-borde-suave: #e2e8f0;
  --gamc-superficie: #f8fafc;
  --gamc-acento-morado: #462d81;
  --gamc-acento-teal: #0da593;
  font-family: inherit;
  color: var(--gamc-marino);
  padding: 16px 8px 32px;
  max-width: 1100px;
  margin: 0 auto;
}

.org-gamc__encabezado {
  margin-bottom: 20px;
}

.org-gamc__insignia {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  background: var(--gamc-primario-suave);
  color: var(--gamc-primario);
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.org-gamc__insignia-ico {
  width: 16px;
  height: 16px;
}

.org-gamc__titulo {
  margin: 0 0 8px;
  font-size: clamp(26px, 4vw, 36px);
  font-weight: 800;
  color: var(--gamc-marino);
  letter-spacing: -0.02em;
}

.org-gamc__intro {
  margin: 0 0 18px;
  font-size: 15px;
  line-height: 1.5;
  color: var(--gamc-texto-suave);
  max-width: 680px;
}

.org-gamc__barra-control {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.org-gamc__buscador-wrap {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 260px;
  max-width: 480px;
  background: #ffffff;
  border: 1.5px solid var(--gamc-borde-suave);
  border-radius: 12px;
  padding: 0 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.org-gamc__buscador-wrap:focus-within {
  border-color: var(--gamc-primario);
  box-shadow: 0 0 0 3px rgba(0, 167, 214, 0.15);
}

.org-gamc__lupa-ico {
  width: 18px;
  height: 18px;
  color: var(--gamc-texto-suave);
  flex-shrink: 0;
  margin-right: 10px;
}

.org-gamc__buscador-wrap input {
  flex: 1;
  height: 42px;
  border: none;
  background: transparent;
  font-size: 14px;
  color: var(--gamc-marino);
  outline: none;
}

.org-gamc__limpiar-btn {
  background: none;
  border: none;
  padding: 4px;
  color: var(--gamc-texto-suave);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.org-gamc__limpiar-btn svg {
  width: 16px;
  height: 16px;
}

.org-gamc__selector-vista {
  display: flex;
  gap: 6px;
  background: var(--gamc-superficie);
  padding: 4px;
  border: 1px solid var(--gamc-borde-suave);
  border-radius: 10px;
}

.org-gamc__vista-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: none;
  background: transparent;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 600;
  color: var(--gamc-texto);
  cursor: pointer;
  transition: all 0.15s ease;
}

.org-gamc__vista-btn:hover {
  color: var(--gamc-primario);
}

.org-gamc__vista-btn.is-activo {
  background: #ffffff;
  color: var(--gamc-marino);
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08);
}

.org-gamc__vista-btn svg {
  width: 16px;
  height: 16px;
}

.org-gamc__estado {
  min-height: 20px;
  margin: 6px 0 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--gamc-primario);
}

.org-gamc__diagrama-marco {
  position: relative;
  overflow: hidden;
  background: #ffffff;
  border: 1.5px solid var(--gamc-borde-suave);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
}

.org-gamc__lienzo {
  height: 600px;
  cursor: grab;
}

.org-gamc__lienzo:active {
  cursor: grabbing;
}

.org-gamc__herramientas {
  position: absolute;
  top: 14px;
  left: 14px;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  border: 1px solid var(--gamc-borde-suave);
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.08);
}

.org-gamc__herramientas button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 700;
  color: var(--gamc-marino);
  cursor: pointer;
  transition: background 0.15s;
}

.org-gamc__herramientas button:hover {
  background: var(--gamc-superficie);
}

.org-gamc__herramientas button svg {
  width: 16px;
  height: 16px;
}

.org-gamc__btn-texto {
  font-size: 12px !important;
  font-weight: 600 !important;
}

.org-gamc__separador-herramientas {
  width: 1px;
  height: 18px;
  background: var(--gamc-borde-suave);
  margin: 0 4px;
}

.org-gamc__leyenda {
  position: absolute;
  right: 14px;
  bottom: 14px;
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  max-width: 70%;
  margin: 0;
  padding: 8px 14px;
  list-style: none;
  font-size: 12px;
  font-weight: 600;
  color: var(--gamc-marino);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  border: 1px solid var(--gamc-borde-suave);
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.08);
}

.org-gamc__leyenda li {
  display: flex;
  align-items: center;
  gap: 6px;
}

.org-gamc__leyenda-punto {
  width: 10px;
  height: 10px;
  border-radius: 3px;
}

.org-gamc__lienzo path.link {
  stroke: #94a3b8 !important;
  stroke-width: 2px !important;
}

.org-nodo-tarjeta {
  position: relative;
  box-sizing: border-box;
  padding: 0 4px;
  font-family: inherit;
}

.org-nodo {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 110px;
  background: #ffffff;
  border: 1.5px solid var(--gamc-borde-suave);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
}

.org-nodo:hover {
  border-color: var(--gamc-primario);
  box-shadow: 0 6px 18px rgba(0, 167, 214, 0.18);
  transform: translateY(-2px);
}

.org-nodo.is-activo {
  border-color: var(--gamc-primario);
  box-shadow: 0 0 0 2.5px var(--gamc-primario);
}

.org-nodo.is-coincide {
  background: #fffbeb;
  border-color: #f59e0b;
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.35);
}

.org-nodo__nivel-barra {
  padding: 3px 10px;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.org-nodo__cuerpo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  flex: 1;
}

.org-nodo__icono-circulo {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.org-nodo__icono-circulo svg {
  width: 20px;
  height: 20px;
}

.org-nodo__info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.org-nodo__nombre {
  font-size: 12px;
  font-weight: 800;
  line-height: 1.25;
  color: var(--gamc-marino);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.org-nodo__subtitulo {
  font-size: 10px;
  font-weight: 600;
  color: var(--gamc-texto-suave);
  margin-top: 2px;
}

.org-nodo__alternar-btn {
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 4px;
  height: 22px;
  padding: 0 8px;
  background: #ffffff;
  border: 1.5px solid var(--gamc-primario);
  border-radius: 9999px;
  font-size: 10px;
  font-weight: 800;
  color: var(--gamc-primario);
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 167, 214, 0.2);
  transition: all 0.15s ease;
  z-index: 2;
}

.org-nodo__alternar-btn:hover {
  background: var(--gamc-primario);
  color: #ffffff;
}

.org-nodo__alternar-btn svg {
  width: 10px;
  height: 10px;
  transition: transform 0.2s ease;
}

.org-nodo__alternar-btn.is-abierto svg {
  transform: rotate(180deg);
}

.org-gamc__arbol-marco {
  background: #ffffff;
  border: 1.5px solid var(--gamc-borde-suave);
  border-radius: 16px;
  padding: 24px;
}

.org-gamc__arbol-niveles {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.org-gamc__arbol-grupo {
  border: 1px solid var(--gamc-borde-suave);
  border-radius: 12px;
  overflow: hidden;
}

.org-gamc__arbol-grupo-cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  background: var(--gamc-superficie);
  cursor: pointer;
}

.org-gamc__arbol-grupo-titulo {
  font-size: 14px;
  font-weight: 800;
  color: var(--gamc-marino);
}

.org-gamc__arbol-hijos-lista {
  padding: 10px 18px 14px 34px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-top: 1px solid var(--gamc-borde-suave);
}

.org-gamc__arbol-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #ffffff;
  border: 1px solid var(--gamc-borde-suave);
  border-radius: 8px;
  cursor: pointer;
}

.org-gamc__arbol-item:hover {
  border-color: var(--gamc-primario);
  background: var(--gamc-primario-suave);
}

.org-gamc__detalle {
  margin-top: 16px;
  padding: 20px 24px;
  background: #ffffff;
  border: 1.5px solid var(--gamc-borde-suave);
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.05);
}

.org-gamc__detalle-cabecera {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.org-gamc__badge-nivel {
  font-size: 11px;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: 9999px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.org-gamc__ruta {
  margin: 0;
  font-size: 12px;
  color: var(--gamc-texto-suave);
}

.org-gamc__detalle-cuerpo {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.org-gamc__nombre-unidad {
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 800;
  color: var(--gamc-marino);
}

.org-gamc__cuenta-dependientes {
  margin: 0;
  font-size: 13px;
  color: var(--gamc-texto-suave);
}

.org-gamc__detalle-acciones {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.org-gamc__accion-btn {
  padding: 8px 14px;
  background: #ffffff;
  border: 1.5px solid var(--gamc-borde-suave);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  color: var(--gamc-marino);
  cursor: pointer;
  transition: all 0.15s ease;
}

.org-gamc__accion-btn:hover:not(:disabled) {
  border-color: var(--gamc-primario);
  color: var(--gamc-primario);
}

.org-gamc__accion-btn--primario {
  background: var(--gamc-primario);
  border-color: var(--gamc-primario);
  color: #ffffff;
}

.org-gamc__accion-btn--primario:hover:not(:disabled) {
  background: var(--gamc-primario-hover);
  color: #ffffff;
}

@media (max-width: 768px) {
  .org-gamc__lienzo {
    height: 480px;
  }
  .org-gamc__leyenda {
    display: none;
  }
  .org-gamc__btn-texto {
    display: none;
  }
  .org-gamc__detalle-cuerpo {
    flex-direction: column;
    align-items: flex-start;
  }
}`;

export const ORGANIGRAMA_MUNICIPAL_TS = `import { OrgChart } from "d3-org-chart";

type Tipo = "despacho" | "secretaria" | "direccion" | "departamento" | "division";

interface Unidad {
  nombre: string;
  tipo: Tipo;
  hijos?: Unidad[];
}

interface Nodo {
  id: string;
  parentId: string | null;
  nombre: string;
  tipo: Tipo;
  hijos: number;
  total: number;
  ruta: string[];
  _expanded?: boolean;
  _highlighted?: boolean;
}

const ORGANIGRAMA: Unidad = {
  nombre: "Alcalde Municipal",
  tipo: "despacho",
  hijos: [
    {
      nombre: "Dirección de Gabinete y Protocolo",
      tipo: "direccion",
      hijos: [
        { nombre: "Departamento de Protocolo", tipo: "departamento" },
        { nombre: "Dirección de Transparencia y Lucha contra la Corrupción", tipo: "direccion" }
      ]
    },
    { nombre: "Dirección de Auditoría Interna", tipo: "direccion" },
    {
      nombre: "Secretaría de Desarrollo de Infraestructura Territorial",
      tipo: "secretaria",
      hijos: [
        { nombre: "Departamento de Gestión de Riesgos", tipo: "departamento" },
        { nombre: "Departamento de Administración de Proyectos", tipo: "departamento" },
        {
          nombre: "Dirección de Obras Públicas",
          tipo: "direccion",
          hijos: [
            {
              nombre: "Departamento de Infraestructura y Mejoramiento de Barrios",
              tipo: "departamento",
              hijos: [
                { nombre: "División Mejoramiento y Mantenimiento de Barrios y Vías", tipo: "division" },
                { nombre: "División Mantenimiento de Infraestructura Municipal", tipo: "division" }
              ]
            },
            { nombre: "Departamento de Alumbrado Público", tipo: "departamento" }
          ]
        },
        {
          nombre: "Dirección de Gestión de Obras Contratadas",
          tipo: "direccion",
          hijos: [
            { nombre: "Departamento de Supervisión y Fiscalización de Infraestructura", tipo: "departamento" },
            { nombre: "Departamento de Control de Calidad de Obras", tipo: "departamento" }
          ]
        }
      ]
    },
    {
      nombre: "Secretaría de Planificación y Medio Ambiente",
      tipo: "secretaria",
      hijos: [
        {
          nombre: "Dirección de Planificación Estratégica",
          tipo: "direccion",
          hijos: [
            { nombre: "Departamento de Ordenamiento Territorial", tipo: "departamento" },
            { nombre: "Departamento de Patrimonio Territorial", tipo: "departamento" },
            { nombre: "Departamento de Límites", tipo: "departamento" }
          ]
        },
        {
          nombre: "Dirección de Evaluación y Seguimiento de Gestión",
          tipo: "direccion",
          hijos: [
            { nombre: "Departamento de Programación de Operaciones", tipo: "departamento" },
            { nombre: "Departamento de Seguimiento de Obras", tipo: "departamento" }
          ]
        },
        {
          nombre: "Dirección de Gestión y Desarrollo de Proyectos",
          tipo: "direccion",
          hijos: [
            { nombre: "División de Control de Proyectos en Subalcaldías", tipo: "division" },
            { nombre: "Departamento de Diseño de Proyectos de Preinversión", tipo: "departamento" },
            { nombre: "División de Estudios Socioeconómicos", tipo: "division" },
            { nombre: "División de Diseño de Infraestructura", tipo: "division" }
          ]
        },
        {
          nombre: "Dirección de Medio Ambiente",
          tipo: "direccion",
          hijos: [
            { nombre: "Departamento de Gestión de Residuos Sólidos y Líquidos", tipo: "departamento" },
            { nombre: "Departamento de Gestión de Recursos Naturales", tipo: "departamento" },
            { nombre: "División Unidad Forestal", tipo: "division" },
            { nombre: "Departamento de Gestión Atmosférica", tipo: "departamento" }
          ]
        }
      ]
    },
    {
      nombre: "Secretaría Administrativa y Financiera",
      tipo: "secretaria",
      hijos: [
        {
          nombre: "Dirección de Finanzas",
          tipo: "direccion",
          hijos: [
            { nombre: "Departamento de Contabilidad", tipo: "departamento" },
            { nombre: "Departamento de Presupuestos", tipo: "departamento" },
            { nombre: "Departamento de Tesorería Municipal", tipo: "departamento" },
            { nombre: "Departamento de Crédito Público", tipo: "departamento" }
          ]
        },
        {
          nombre: "Dirección Administrativa",
          tipo: "direccion",
          hijos: [
            { nombre: "Departamento de Administración de Almacenes", tipo: "departamento" },
            { nombre: "Departamento de Administración de Activos Fijos Inmuebles", tipo: "departamento" },
            { nombre: "Departamento de Administración de Activos Fijos Muebles", tipo: "departamento" },
            { nombre: "Departamento de Servicios Generales y Seguros", tipo: "departamento" }
          ]
        },
        {
          nombre: "Dirección de Recursos Humanos",
          tipo: "direccion",
          hijos: [
            { nombre: "Departamento de Administración de Personal", tipo: "departamento" },
            { nombre: "Departamento de Desarrollo de Personal y Seguridad Industrial", tipo: "departamento" }
          ]
        },
        {
          nombre: "Dirección de Contrataciones",
          tipo: "direccion",
          hijos: [
            { nombre: "Departamento de Contrataciones Menores", tipo: "departamento" },
            { nombre: "Departamento de Contrataciones Mayores", tipo: "departamento" },
            { nombre: "Departamento de Unidad Jurídica", tipo: "departamento" }
          ]
        }
      ]
    },
    {
      nombre: "Secretaría de Desarrollo Urbano y Catastro",
      tipo: "secretaria",
      hijos: [
        { nombre: "Mi Casa Segura", tipo: "direccion" },
        {
          nombre: "Dirección de Recaudaciones y Dinamización Económica",
          tipo: "direccion",
          hijos: [
            { nombre: "Departamento de Atención al Contribuyente", tipo: "departamento" },
            { nombre: "Departamento de Fiscalización", tipo: "departamento" },
            { nombre: "Departamento Legal Tributario", tipo: "departamento" },
            { nombre: "Departamento de Control de Recaudaciones", tipo: "departamento" },
            { nombre: "Departamento de Servicio de Asistencia, Liquidación y Recaudación", tipo: "departamento" }
          ]
        },
        {
          nombre: "Dirección de Administración Geográfica y Catastro",
          tipo: "direccion",
          hijos: [
            { nombre: "Departamento de Gestión Catastral", tipo: "departamento" },
            { nombre: "Departamento de Servicios Catastrales", tipo: "departamento" },
            { nombre: "Departamento de Cartografía", tipo: "departamento" },
            { nombre: "Departamento de Informática Catastral e Inteligencia Fiscal", tipo: "departamento" }
          ]
        },
        {
          nombre: "Dirección de Urbanismo",
          tipo: "direccion",
          hijos: [
            { nombre: "Departamento de Control de Edificaciones", tipo: "departamento" },
            { nombre: "División de Regulación de Edificaciones", tipo: "division" },
            { nombre: "Departamento de Administración Urbana", tipo: "departamento" }
          ]
        }
      ]
    }
  ]
};

const ICONOS: Record<string, string> = {
  escudo: \`<path d="M12 2L4 5v6.5c0 5.25 3.4 10.15 8 11.5 4.6-1.35 8-6.25 8-11.5V5l-8-3z" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M12 7l1.5 3 3.5.5-2.5 2.5.5 3.5-3-1.6-3 1.6.5-3.5-2.5-2.5 3.5-.5z" fill="currentColor"/>\`,
  capitolio: \`<path d="M3 21h18M4 18h16M4 10h16M12 3l9 5H3l9-5zM6 10v8M10 10v8M14 10v8M18 10v8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>\`,
  brujula: \`<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="m16.2 7.8-2 6.4-6.4 2 2-6.4 6.4-2z" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="#fff"/>\`,
  matriz: \`<rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8" fill="none"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8" fill="none"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8" fill="none"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8" fill="none"/>\`,
  division: \`<path d="m12 2 9 4.5-9 4.5L3 6.5 12 2zM3 12l9 4.5 9-4.5M3 17.5l9 4.5 9-4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>\`
};

const TIPOS: Record<Tipo, { etiqueta: string; fondo: string; trazo: string; iconoColor: string; icono: string }> = {
  despacho: {
    etiqueta: "Despacho Alcaldía",
    fondo: "#0f172a",
    trazo: "#00a7d6",
    iconoColor: "#34c3e8",
    icono: "escudo"
  },
  secretaria: {
    etiqueta: "Secretaría Municipal",
    fondo: "#f0f9ff",
    trazo: "#00a7d6",
    iconoColor: "#00a7d6",
    icono: "capitolio"
  },
  direccion: {
    etiqueta: "Dirección",
    fondo: "#f0fdf4",
    trazo: "#0da593",
    iconoColor: "#0da593",
    icono: "brujula"
  },
  departamento: {
    etiqueta: "Departamento",
    fondo: "#faf5ff",
    trazo: "#462d81",
    iconoColor: "#462d81",
    icono: "matriz"
  },
  division: {
    etiqueta: "División",
    fondo: "#f8fafc",
    trazo: "#64748b",
    iconoColor: "#475569",
    icono: "division"
  }
};

const FLECHA_SVG = \`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>\`;
const renderIcono = (raw: string) => \`<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">\${raw}</svg>\`;

let idContador = 0;
const nodos: Nodo[] = [];
const porId = new Map<string, Nodo>();

function aplanar(unidad: Unidad, parentId: string | null = null, ancestros: string[] = []): Nodo {
  const id = \`u-\${++idContador}\`;
  const ruta = [...ancestros, unidad.nombre];
  const nodo: Nodo = {
    id,
    parentId,
    nombre: unidad.nombre,
    tipo: unidad.tipo,
    hijos: unidad.hijos ? unidad.hijos.length : 0,
    total: 0,
    ruta,
    _expanded: parentId === null || unidad.tipo === "secretaria",
    _highlighted: false
  };
  nodos.push(nodo);
  porId.set(id, nodo);

  let cuentaTotal = 0;
  if (unidad.hijos) {
    unidad.hijos.forEach((hijo) => {
      const descendiente = aplanar(hijo, id, ruta);
      cuentaTotal += 1 + descendiente.total;
    });
  }
  nodo.total = cuentaTotal;
  return nodo;
}

const raiz = aplanar(ORGANIGRAMA);

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const lienzo = $("org-lienzo");
const buscador = $<HTMLInputElement>("org-buscar");
const limpiar = $<HTMLButtonElement>("org-limpiar");
const estado = $("org-estado");
const detalle = $("org-detalle");
const leyenda = $("org-leyenda");

const contenedorDiagrama = $("org-contenedor-diagrama");
const contenedorArbol = $("org-contenedor-arbol");
const btnVistaDiagrama = $<HTMLButtonElement>("org-btn-vista-diagrama");
const btnVistaArbol = $<HTMLButtonElement>("org-btn-vista-arbol");
const arbolNiveles = $("org-arbol-niveles");

const escapar = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const normalizar = (t: string) => t.normalize("NFD").replace(/\\p{M}/gu, "").toLowerCase();

let seleccion: string | null = null;

const grafico = new OrgChart()
  .container("#org-lienzo")
  .svgHeight(lienzo.clientHeight || 580)
  .svgWidth(lienzo.clientWidth || 920)
  .data(nodos)
  .nodeWidth(() => 220)
  .nodeHeight(() => 115)
  .childrenMargin(() => 42)
  .siblingsMargin(() => 16)
  .neighbourMargin(() => 20)
  .compact(false)
  .duration(280)
  .buttonContent(() => "")
  .onNodeClick(() => {})
  .nodeContent((d: { data: Nodo; width: number; height: number }) => {
    const nodo = d.data;
    const tipo = TIPOS[nodo.tipo];
    const tieneHijos = nodo.hijos > 0;
    const btnAlternar = tieneHijos
      ? \`<button type="button" class="org-nodo__alternar-btn \${nodo._expanded ? "is-abierto" : ""}" data-alternar="\${nodo.id}" aria-label="\${nodo._expanded ? "Contraer" : "Expandir"} \${escapar(nodo.nombre)}">\${FLECHA_SVG}<span>\${nodo.hijos}</span></button>\`
      : "";

    const clases = [
      "org-nodo",
      nodo._highlighted ? "is-coincide" : "",
      nodo.id === seleccion ? "is-activo" : ""
    ].join(" ");

    return \`<div class="org-nodo-tarjeta" style="width:\${d.width}px;height:\${d.height}px">
      <div class="\${clases}" data-id="\${nodo.id}" role="button" tabindex="0">
        <div class="org-nodo__nivel-barra" style="background:\${tipo.trazo}">
          <span>\${tipo.etiqueta}</span>
        </div>
        <div class="org-nodo__cuerpo">
          <div class="org-nodo__icono-circulo" style="color:\${tipo.iconoColor};background:\${tipo.fondo}">
            \${renderIcono(ICONOS[tipo.icono])}
          </div>
          <div class="org-nodo__info">
            <strong class="org-nodo__nombre">\${escapar(nodo.nombre)}</strong>
            <span class="org-nodo__subtitulo">\${tieneHijos ? nodo.hijos + " dependencias" : "Unidad operativa"}</span>
          </div>
        </div>
      </div>
      \${btnAlternar}
    </div>\`;
  });

function dibujar(ajustar = false) {
  grafico.svgWidth(lienzo.clientWidth || 920).data(nodos).render();
  if (ajustar) grafico.fit();
}

function abrirAncestros(nodo: Nodo) {
  let padre = nodo.parentId ? porId.get(nodo.parentId) : undefined;
  while (padre) {
    padre._expanded = true;
    padre = padre.parentId ? porId.get(padre.parentId) : undefined;
  }
}

const descendientes = (nodo: Nodo): Nodo[] =>
  nodos.filter((otro) => otro.parentId === nodo.id).flatMap((hijo) => [hijo, ...descendientes(hijo)]);

function reiniciar() {
  nodos.forEach((nodo) => {
    nodo._expanded = false;
    nodo._highlighted = false;
  });
  raiz._expanded = true;
}

function buscar(texto: string) {
  const q = normalizar(texto.trim());
  limpiar.hidden = q === "";
  reiniciar();

  if (q === "") {
    estado.textContent = "";
  } else {
    const coincidencias = nodos.filter((nodo) => normalizar(nodo.nombre).includes(q));
    coincidencias.forEach((nodo) => {
      nodo._highlighted = true;
      abrirAncestros(nodo);
    });
    estado.textContent =
      coincidencias.length === 0
        ? "No se encontraron dependencias con ese término."
        : \`\${coincidencias.length} dependencias localizadas en el organigrama.\`;
  }

  dibujar(true);
  generarVistaArbol();
}

function elegir(id: string) {
  const nodo = porId.get(id);
  if (!nodo) return;
  seleccion = id;
  if (nodo.hijos > 0 && !nodo._expanded) nodo._expanded = true;

  const tipo = TIPOS[nodo.tipo];
  detalle.hidden = false;

  const badge = $("org-tipo-badge");
  badge.textContent = tipo.etiqueta;
  badge.style.backgroundColor = tipo.fondo;
  badge.style.color = tipo.iconoColor;
  badge.style.border = \`1px solid \${tipo.trazo}\`;

  $("org-ruta").textContent = nodo.ruta.join("  ›  ");
  $("org-nombre").textContent = nodo.nombre;
  $("org-cuenta").textContent =
    nodo.hijos === 0
      ? "Unidad operativa final (sin dependencias asignadas)."
      : \`\${nodo.hijos} \${nodo.hijos === 1 ? "dependencia directa" : "dependencias directas"} · \${nodo.total} en total bajo esta área.\`;

  detalle.querySelector<HTMLButtonElement>('[data-detalle="superior"]')!.disabled = nodo.parentId === null;
  detalle.querySelector<HTMLButtonElement>('[data-detalle="rama"]')!.disabled = nodo.hijos === 0;

  dibujar();
}

function generarVistaArbol() {
  arbolNiveles.innerHTML = "";
  const secretarias = nodos.filter((n) => n.parentId === raiz.id);

  const rootDiv = document.createElement("div");
  rootDiv.className = "org-gamc__arbol-item";
  rootDiv.style.borderColor = "var(--gamc-primario)";
  rootDiv.style.background = "var(--gamc-primario-suave)";
  rootDiv.innerHTML = \`<div><strong style="font-size:15px;color:var(--gamc-marino)">\${raiz.nombre}</strong><br><small style="color:var(--gamc-texto-suave)">Máxima Autoridad Ejecutiva Municipal</small></div><span class="org-gamc__badge-nivel" style="background:#0f172a;color:#ffffff">\${TIPOS[raiz.tipo].etiqueta}</span>\`;
  rootDiv.addEventListener("click", () => elegir(raiz.id));
  arbolNiveles.appendChild(rootDiv);

  secretarias.forEach((sec) => {
    const grupo = document.createElement("div");
    grupo.className = "org-gamc__arbol-grupo";

    const cab = document.createElement("div");
    cab.className = "org-gamc__arbol-grupo-cabecera";
    cab.innerHTML = \`<div class="org-gamc__arbol-grupo-titulo">\${sec.nombre}</div><span class="org-gamc__badge-nivel" style="background:\${TIPOS[sec.tipo].fondo};color:\${TIPOS[sec.tipo].iconoColor};border:1px solid \${TIPOS[sec.tipo].trazo}">\${TIPOS[sec.tipo].etiqueta}</span>\`;
    cab.addEventListener("click", () => elegir(sec.id));
    grupo.appendChild(cab);

    const subHijos = nodos.filter((n) => n.parentId === sec.id);
    if (subHijos.length > 0) {
      const lista = document.createElement("div");
      lista.className = "org-gamc__arbol-hijos-lista";

      subHijos.forEach((sub) => {
        const item = document.createElement("div");
        item.className = "org-gamc__arbol-item";
        item.innerHTML = \`<span>\${sub.nombre}</span><span style="font-size:10px;font-weight:700;color:\${TIPOS[sub.tipo].iconoColor}">\${TIPOS[sub.tipo].etiqueta}</span>\`;
        item.addEventListener("click", () => elegir(sub.id));
        lista.appendChild(item);
      });
      grupo.appendChild(lista);
    }

    arbolNiveles.appendChild(grupo);
  });
}

btnVistaDiagrama.addEventListener("click", () => {
  btnVistaDiagrama.classList.add("is-activo");
  btnVistaArbol.classList.remove("is-activo");
  contenedorDiagrama.hidden = false;
  contenedorArbol.hidden = true;
  dibujar(true);
});

btnVistaArbol.addEventListener("click", () => {
  btnVistaArbol.classList.add("is-activo");
  btnVistaDiagrama.classList.remove("is-activo");
  contenedorDiagrama.hidden = true;
  contenedorArbol.hidden = false;
  generarVistaArbol();
});

let espera: number | undefined;
buscador.addEventListener("input", () => {
  window.clearTimeout(espera);
  espera = window.setTimeout(() => buscar(buscador.value), 160);
});

limpiar.addEventListener("click", () => {
  buscador.value = "";
  buscar("");
  buscador.focus();
});

lienzo.addEventListener("click", (e) => {
  const objetivo = e.target as HTMLElement;
  const alternar = objetivo.closest<HTMLElement>("[data-alternar]");
  if (alternar) {
    const nodo = porId.get(alternar.dataset.alternar!);
    if (nodo) {
      nodo._expanded = !nodo._expanded;
      dibujar();
    }
    return;
  }
  const tarjeta = objetivo.closest<HTMLElement>("[data-id]");
  if (tarjeta) elegir(tarjeta.dataset.id!);
});

lienzo.addEventListener("keydown", (e) => {
  const tarjeta = (e.target as HTMLElement).closest<HTMLElement>("[data-id]");
  if (tarjeta && (e.key === "Enter" || e.key === " ")) {
    e.preventDefault();
    elegir(tarjeta.dataset.id!);
  }
});

const ACCIONES: Record<string, () => void> = {
  acercar: () => grafico.zoomIn(),
  alejar: () => grafico.zoomOut(),
  ajustar: () => grafico.fit(),
  expandir: () => {
    nodos.forEach((nodo) => (nodo._expanded = nodo.hijos > 0));
    dibujar(true);
  },
  contraer: () => {
    seleccion = null;
    detalle.hidden = true;
    buscador.value = "";
    buscar("");
  }
};

document.querySelectorAll<HTMLElement>("[data-accion]").forEach((boton) =>
  boton.addEventListener("click", () => ACCIONES[boton.dataset.accion!]())
);

detalle.addEventListener("click", (e) => {
  const boton = (e.target as HTMLElement).closest<HTMLElement>("[data-detalle]");
  const nodo = seleccion ? porId.get(seleccion) : undefined;
  if (!boton || !nodo) return;
  if (boton.dataset.detalle === "superior" && nodo.parentId) {
    abrirAncestros(nodo);
    elegir(nodo.parentId);
    grafico.setCentered(nodo.parentId).render();
  } else if (boton.dataset.detalle === "rama") {
    [nodo, ...descendientes(nodo)].forEach((otro) => (otro._expanded = otro.hijos > 0));
    dibujar(true);
  } else if (boton.dataset.detalle === "centrar") {
    abrirAncestros(nodo);
    dibujar();
    grafico.setCentered(nodo.id).render();
  }
});

leyenda.innerHTML = (Object.values(TIPOS) as (typeof TIPOS)[Tipo][])
  .map(
    (tipo) =>
      \`<li><span class="org-gamc__leyenda-punto" style="background:\${tipo.trazo}"></span>\${tipo.etiqueta}</li>\`
  )
  .join("");

let redimension: number | undefined;
window.addEventListener("resize", () => {
  window.clearTimeout(redimension);
  redimension = window.setTimeout(() => dibujar(), 250);
});

reiniciar();
dibujar(true);
generarVistaArbol();`;

export function getEdificioMunicipalCode(): CodeSource {
  return {
    tailwind: true,
    html: EDIFICIO_MUNICIPAL_HTML,
    css: EDIFICIO_MUNICIPAL_CSS,
    js: EDIFICIO_MUNICIPAL_TS,
  };
}

export function getOrganigramaMunicipalCode(): CodeSource {
  return {
    tailwind: true,
    html: ORGANIGRAMA_MUNICIPAL_HTML,
    css: ORGANIGRAMA_MUNICIPAL_CSS,
    js: ORGANIGRAMA_MUNICIPAL_TS,
  };
}
