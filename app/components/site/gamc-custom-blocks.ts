import type { CodeSource } from "./types.ts";

/**
 * Bloques institucionales personalizados para el portal del GAMC:
 * 1. Edificio Municipal: Sede central de 13 pisos con directorio interactivo accesible y ficha de trámites por piso.
 * 2. Organigrama Institucional: Estructura jerárquica clara por niveles institucionales con búsqueda y filtrado dinámico.
 */

export const EDIFICIO_MUNICIPAL_HTML = `<section class="edificio-gamc" aria-labelledby="edificio-titulo">
  <header class="edificio-gamc__encabezado">
    <div class="edificio-gamc__marca-sede">
      <span class="edificio-gamc__punto-estado" aria-hidden="true"></span>
      <span>Sede Central GAMC · Plaza 14 de Septiembre</span>
    </div>
    <h2 id="edificio-titulo" class="edificio-gamc__titulo">Edificio Municipal</h2>
    <p class="edificio-gamc__subtitulo">
      Directorio de los 13 pisos de la sede central del Gobierno Autónomo Municipal de Cochabamba. Selecciona un piso para ver sus secretarías, ventanillas y trámites ciudadanos.
    </p>

    <div class="edificio-gamc__barra-busqueda">
      <div class="edificio-gamc__buscador-input-wrap">
        <span class="edificio-gamc__lupa-simbolo" aria-hidden="true">&#9906;</span>
        <input type="search" id="edificio-busqueda" placeholder="Buscar piso, trámite o secretaría..." aria-label="Buscar dependencias en el edificio" autocomplete="off">
        <button type="button" id="edificio-limpiar-busqueda" class="edificio-gamc__limpiar-btn" aria-label="Limpiar búsqueda" hidden="">&times;</button>
      </div>
      <div class="edificio-gamc__selector-movil-wrap">
        <label for="edificio-select-movil" class="edificio-gamc__sr-only">Seleccionar piso</label>
        <select id="edificio-select-movil" class="edificio-gamc__select-movil" aria-label="Seleccionar piso"></select>
      </div>
    </div>
  </header>

  <div class="edificio-gamc__cuerpo">
    <!-- Panel izquierdo: Lista de 13 pisos -->
    <aside class="edificio-gamc__directorio" aria-label="Lista de 13 pisos del edificio central">
      <div class="edificio-gamc__directorio-cabecera">
        <span class="edificio-gamc__directorio-titulo">Pisos del Edificio (13)</span>
        <span class="edificio-gamc__directorio-sub">Del 13 al 1</span>
      </div>
      <div id="edificio-lista-pisos" class="edificio-gamc__lista-pisos" role="tablist" aria-orientation="vertical"></div>
    </aside>

    <!-- Panel derecho: Ficha de información detallada del piso activo -->
    <main class="edificio-gamc__detalle" aria-live="polite">
      <div class="edificio-gamc__detalle-cabecera">
        <div class="edificio-gamc__detalle-identificador">
          <span id="edificio-detalle-badge-sector" class="edificio-gamc__badge-sector"></span>
          <h3 id="edificio-detalle-numero" class="edificio-gamc__detalle-piso-titulo">Piso 01</h3>
          <p id="edificio-detalle-nombre" class="edificio-gamc__detalle-piso-nombre"></p>
        </div>
        <div class="edificio-gamc__navegacion-pisos" role="group" aria-label="Navegar entre pisos">
          <button type="button" id="edificio-btn-anterior" class="edificio-gamc__nav-btn" aria-label="Ir al piso anterior">
            <span>&larr;</span> Anterior
          </button>
          <button type="button" id="edificio-btn-siguiente" class="edificio-gamc__nav-btn" aria-label="Ir al piso siguiente">
            Siguiente <span>&rarr;</span>
          </button>
        </div>
      </div>

      <p id="edificio-detalle-descripcion" class="edificio-gamc__detalle-desc"></p>

      <div class="edificio-gamc__metadatos-piso">
        <div class="edificio-gamc__meta-item">
          <span class="edificio-gamc__meta-etiqueta">Horario de atención</span>
          <strong id="edificio-detalle-horario" class="edificio-gamc__meta-valor">Lunes a Viernes 08:00 a 16:00</strong>
        </div>
        <div class="edificio-gamc__meta-item">
          <span class="edificio-gamc__meta-etiqueta">Modalidad de servicio</span>
          <strong id="edificio-detalle-modalidad" class="edificio-gamc__meta-valor">Presencial y Ventanilla Única</strong>
        </div>
        <div class="edificio-gamc__meta-item">
          <span class="edificio-gamc__meta-etiqueta">Accesibilidad</span>
          <strong class="edificio-gamc__meta-valor">Ascensores A y B · Rampa Inclusiva</strong>
        </div>
      </div>

      <div class="edificio-gamc__seccion-oficinas">
        <h4 class="edificio-gamc__oficinas-titulo">Oficinas y Trámites en este Piso</h4>
        <div id="edificio-lista-oficinas" class="edificio-gamc__lista-oficinas"></div>
      </div>
    </main>
  </div>
</section>`;

export const EDIFICIO_MUNICIPAL_CSS = `.edificio-gamc {
  --gamc-celeste: #00a7d6;
  --gamc-celeste-hover: #008bb3;
  --gamc-celeste-suave: #e6f6fb;
  --gamc-marino: #0f172a;
  --gamc-texto: #334155;
  --gamc-texto-suave: #64748b;
  --gamc-borde: #cbd5e1;
  --gamc-borde-suave: #e2e8f0;
  --gamc-superficie: #f8fafc;
  --gamc-blanco: #ffffff;
  --gamc-teal: #0da593;
  --gamc-morado: #462d81;
  font-family: inherit;
  color: var(--gamc-marino);
  padding: 16px 8px 32px;
  max-width: 1080px;
  margin: 0 auto 48px;
  position: relative;
  clear: both;
}

.edificio-gamc__encabezado {
  margin-bottom: 24px;
}

.edificio-gamc__marca-sede {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--gamc-celeste-suave);
  color: var(--gamc-celeste-hover);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 6px 12px;
  border-radius: 9999px;
  margin-bottom: 12px;
  border: 1px solid rgba(0, 167, 214, 0.2);
}

.edificio-gamc__punto-estado {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--gamc-celeste);
  display: inline-block;
}

.edificio-gamc__titulo {
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--gamc-marino);
  margin: 0 0 8px;
}

.edificio-gamc__subtitulo {
  font-size: 15px;
  color: var(--gamc-texto-suave);
  line-height: 1.5;
  margin: 0 0 20px;
  max-width: 780px;
}

.edificio-gamc__barra-busqueda {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.edificio-gamc__buscador-input-wrap {
  position: relative;
  flex: 1;
  min-width: 240px;
}

.edificio-gamc__lupa-simbolo {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--gamc-texto-suave);
  font-size: 16px;
  pointer-events: none;
}

.edificio-gamc__buscador-input-wrap input {
  width: 100%;
  height: 44px;
  border-radius: 10px;
  border: 1px solid var(--gamc-borde);
  padding: 0 38px 0 38px;
  font-size: 14px;
  color: var(--gamc-marino);
  background: var(--gamc-blanco);
  transition: border-color 0.15s, box-shadow 0.15s;
  box-sizing: border-box;
}

.edificio-gamc__buscador-input-wrap input:focus {
  outline: none;
  border-color: var(--gamc-celeste);
  box-shadow: 0 0 0 3px rgba(0, 167, 214, 0.15);
}

.edificio-gamc__limpiar-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--gamc-texto-suave);
  font-size: 20px;
  cursor: pointer;
  line-height: 1;
  padding: 4px;
}

.edificio-gamc__selector-movil-wrap {
  display: none;
  width: 100%;
}

.edificio-gamc__select-movil {
  width: 100%;
  height: 44px;
  border-radius: 10px;
  border: 1px solid var(--gamc-borde);
  background: var(--gamc-blanco);
  padding: 0 12px;
  font-size: 14px;
  color: var(--gamc-marino);
  font-weight: 600;
}

.edificio-gamc__sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

/* Cuerpo en 2 columnas: Directorio y Detalle */
.edificio-gamc__cuerpo {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 24px;
  align-items: start;
}

.edificio-gamc__directorio {
  background: var(--gamc-blanco);
  border: 1px solid var(--gamc-borde-suave);
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
  overflow: hidden;
}

.edificio-gamc__directorio-cabecera {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: var(--gamc-superficie);
  border-bottom: 1px solid var(--gamc-borde-suave);
}

.edificio-gamc__directorio-titulo {
  font-size: 13px;
  font-weight: 700;
  color: var(--gamc-marino);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.edificio-gamc__directorio-sub {
  font-size: 11px;
  color: var(--gamc-texto-suave);
  font-weight: 600;
}

.edificio-gamc__lista-pisos {
  max-height: 580px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.edificio-gamc__piso-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  border-bottom: 1px solid var(--gamc-borde-suave);
  transition: background-color 0.15s, border-left-color 0.15s;
  width: 100%;
  box-sizing: border-box;
}

.edificio-gamc__piso-item:last-child {
  border-bottom: none;
}

.edificio-gamc__piso-item:hover {
  background: var(--gamc-superficie);
}

.edificio-gamc__piso-item.is-activo {
  background: var(--gamc-celeste-suave);
  border-left: 4px solid var(--gamc-celeste);
}

.edificio-gamc__piso-numero-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 800;
  background: var(--gamc-superficie);
  color: var(--gamc-marino);
  border: 1px solid var(--gamc-borde);
  flex-shrink: 0;
  transition: all 0.15s;
}

.edificio-gamc__piso-item.is-activo .edificio-gamc__piso-numero-badge {
  background: var(--gamc-celeste);
  color: var(--gamc-blanco);
  border-color: var(--gamc-celeste);
}

.edificio-gamc__piso-item-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.edificio-gamc__piso-item-nombre {
  font-size: 13px;
  font-weight: 700;
  color: var(--gamc-marino);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.edificio-gamc__piso-item.is-activo .edificio-gamc__piso-item-nombre {
  color: var(--gamc-celeste-hover);
}

.edificio-gamc__piso-item-sector {
  font-size: 11px;
  color: var(--gamc-texto-suave);
  font-weight: 500;
}

.edificio-gamc__piso-item[hidden] {
  display: none !important;
}

/* Ficha Detallada */
.edificio-gamc__detalle {
  background: var(--gamc-blanco);
  border: 1px solid var(--gamc-borde-suave);
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
  padding: 24px;
}

.edificio-gamc__detalle-cabecera {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--gamc-borde-suave);
  padding-bottom: 16px;
}

.edificio-gamc__badge-sector {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 3px 8px;
  border-radius: 6px;
  background: var(--gamc-superficie);
  color: var(--gamc-texto-suave);
  border: 1px solid var(--gamc-borde);
  margin-bottom: 6px;
}

.edificio-gamc__detalle-piso-titulo {
  font-size: 28px;
  font-weight: 800;
  color: var(--gamc-marino);
  margin: 0 0 4px;
  letter-spacing: -0.01em;
}

.edificio-gamc__detalle-piso-nombre {
  font-size: 16px;
  font-weight: 600;
  color: var(--gamc-celeste-hover);
  margin: 0;
}

.edificio-gamc__navegacion-pisos {
  display: flex;
  gap: 8px;
}

.edificio-gamc__nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid var(--gamc-borde);
  background: var(--gamc-blanco);
  font-size: 13px;
  font-weight: 600;
  color: var(--gamc-marino);
  cursor: pointer;
  transition: all 0.15s;
}

.edificio-gamc__nav-btn:hover:not(:disabled) {
  border-color: var(--gamc-celeste);
  background: var(--gamc-celeste-suave);
  color: var(--gamc-celeste-hover);
}

.edificio-gamc__nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.edificio-gamc__detalle-desc {
  font-size: 14px;
  line-height: 1.6;
  color: var(--gamc-texto);
  margin: 0 0 20px;
}

.edificio-gamc__metadatos-piso {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  background: var(--gamc-superficie);
  border: 1px solid var(--gamc-borde-suave);
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 24px;
}

.edificio-gamc__meta-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.edificio-gamc__meta-etiqueta {
  font-size: 11px;
  font-weight: 600;
  color: var(--gamc-texto-suave);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.edificio-gamc__meta-valor {
  font-size: 13px;
  font-weight: 700;
  color: var(--gamc-marino);
}

.edificio-gamc__oficinas-titulo {
  font-size: 15px;
  font-weight: 700;
  color: var(--gamc-marino);
  margin: 0 0 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--gamc-borde-suave);
}

.edificio-gamc__lista-oficinas {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.edificio-gamc__oficina-tarjeta {
  border: 1px solid var(--gamc-borde-suave);
  border-radius: 10px;
  padding: 14px 16px;
  background: var(--gamc-blanco);
  transition: border-color 0.15s;
}

.edificio-gamc__oficina-tarjeta:hover {
  border-color: var(--gamc-celeste);
}

.edificio-gamc__oficina-cabecera {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.edificio-gamc__oficina-nombre {
  font-size: 14px;
  font-weight: 700;
  color: var(--gamc-marino);
}

.edificio-gamc__oficina-ventanilla {
  font-size: 11px;
  font-weight: 700;
  background: var(--gamc-celeste-suave);
  color: var(--gamc-celeste-hover);
  padding: 2px 8px;
  border-radius: 4px;
}

.edificio-gamc__tramites-lista {
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
  color: var(--gamc-texto);
  line-height: 1.5;
}

.edificio-gamc__oficina-pie {
  margin-top: 8px;
  font-size: 11px;
  color: var(--gamc-texto-suave);
  font-weight: 600;
}

@media (max-width: 840px) {
  .edificio-gamc__cuerpo {
    grid-template-columns: 1fr;
  }
  .edificio-gamc__selector-movil-wrap {
    display: block;
  }
  .edificio-gamc__directorio {
    max-height: 260px;
  }
  .edificio-gamc__lista-pisos {
    max-height: 200px;
  }
}`;

export const EDIFICIO_MUNICIPAL_TS = `interface Oficina {
  nombre: string;
  tramites: string[];
  ventanilla?: string;
  interno?: string;
}

interface PisoInfo {
  piso: number;
  nombre: string;
  sector: string;
  color: string;
  descripcion: string;
  horario: string;
  modalidad: string;
  oficinas: Oficina[];
}

export const PISOS: PisoInfo[] = [
  {
    piso: 1,
    nombre: "Plataforma Única de Atención al Ciudadano",
    sector: "Atención y Trámites",
    color: "#00a7d6",
    descripcion: "Punto central de orientación al ciudadano, ventanilla única de trámites rápidos y recepción de correspondencia oficial.",
    horario: "Lunes a Viernes 08:00 - 16:00 (Continuo)",
    modalidad: "Presencial y Ventanilla Digital",
    oficinas: [
      {
        nombre: "Ventanilla Única de Trámites",
        tramites: ["Recepción de correspondencia oficial", "Ingreso de solicitudes y cartas", "Seguimiento de hoja de ruta"],
        ventanilla: "Ventanillas 1 a 6",
        interno: "2101",
      },
      {
        nombre: "Plataforma de Orientación Ciudadana",
        tramites: ["Guía al contribuyente", "Requisitos para licencias y catastro", "Atención preferencial a adultos mayores y personas con discapacidad"],
        ventanilla: "Módulo Central",
        interno: "2102",
      },
      {
        nombre: "Cajas y Cobranzas Municipales",
        tramites: ["Pago de aranceles de trámites rápidos", "Certificaciones inmediatas", "Valores municipales"],
        ventanilla: "Cajas 7 y 8",
        interno: "2103",
      },
    ],
  },
  {
    piso: 2,
    nombre: "Dirección de Recaudaciones y Tributación (RUAT)",
    sector: "Recaudaciones",
    color: "#0da593",
    descripcion: "Gestión de impuestos sobre bienes inmuebles, vehículos automotores (RUAT) y patentes de funcionamiento comercial.",
    horario: "Lunes a Viernes 08:00 - 16:00",
    modalidad: "Presencial y Plataforma RUAT Virtual",
    oficinas: [
      {
        nombre: "Unidad de Impuestos a la Propiedad Inmueble",
        tramites: ["Liquidación tributaria de casas y lotes", "Certificados de no adeudo tributario", "Planes de pago y condonaciones"],
        ventanilla: "Ventanillas 1 a 5",
        interno: "2201",
      },
      {
        nombre: "Unidad de Vehículos Automotores (RUAT)",
        tramites: ["Radicatoria vehicular", "Pago de impuestos anuales", "Transferencias y duplicados de placas"],
        ventanilla: "Ventanillas 6 a 10",
        interno: "2202",
      },
      {
        nombre: "Unidad de Actividades Económicas y Patentes",
        tramites: ["Emisión de Licencias de Funcionamiento", "Renovación de patentes comerciales e industriales", "Baja y traspaso de actividades"],
        ventanilla: "Ventanillas 11 a 14",
        interno: "2203",
      },
    ],
  },
  {
    piso: 3,
    nombre: "Desarrollo Humano, Género y Generacional",
    sector: "Social y Familia",
    color: "#462d81",
    descripcion: "Políticas de protección integral a la familia, defensorías de la niñez y programas de apoyo a grupos vulnerables.",
    horario: "Lunes a Viernes 08:00 - 16:00",
    modalidad: "Presencial y Equipo Móvil de Apoyo",
    oficinas: [
      {
        nombre: "Coordinación de Defensorías de la Niñez",
        tramites: ["Asesoramiento legal a menores", "Permisos de viaje para niños y adolescentes", "Atención psicosocial integral"],
        ventanilla: "Módulos 1 al 4",
        interno: "2301",
      },
      {
        nombre: "Departamento del Adulto Mayor",
        tramites: ["Carnetización y beneficios preferenciales", "Orientación jurídica y psicológica", "Talleres del centro de día"],
        ventanilla: "Oficina 302",
        interno: "2302",
      },
      {
        nombre: "Unidad de Personas con Discapacidad (UMADIS)",
        tramites: ["Registro y calificación municipal", "Gestión de apoyo técnico e inserción", "Trámites de exención de pago"],
        ventanilla: "Oficina 303",
        interno: "2303",
      },
    ],
  },
  {
    piso: 4,
    nombre: "Secretaría Municipal de Salud",
    sector: "Salud Pública",
    color: "#0da593",
    descripcion: "Supervisión de la red municipal de centros de salud y hospitales de primer nivel, campañas de prevención y control epidemiológico.",
    horario: "Lunes a Viernes 08:00 - 16:00",
    modalidad: "Presencial y Red de Salud",
    oficinas: [
      {
        nombre: "Dirección de Gestión Hospitalaria",
        tramites: ["Supervisión de centros de salud municipales", "Abastecimiento de medicamentos esenciales", "Coordinación con el SUS"],
        ventanilla: "Oficina 401",
        interno: "2401",
      },
      {
        nombre: "Unidad de Epidemiología y Prevención",
        tramites: ["Campañas de vacunación masiva", "Control de vectores y brotes", "Educación comunitaria en salud"],
        ventanilla: "Oficina 402",
        interno: "2402",
      },
      {
        nombre: "Programa de Salud Escolar y Comunitaria",
        tramites: ["Atención odontológica preventiva en colegios", "Seguros de salud escolar", "Ferias integrales de salud"],
        ventanilla: "Oficina 403",
        interno: "2403",
      },
    ],
  },
  {
    piso: 5,
    nombre: "Medio Ambiente y Protección a la Madre Tierra",
    sector: "Medio Ambiente",
    color: "#0da593",
    descripcion: "Conservación ecológica de la cuenca, arborización urbana, calidad ambiental y gestión integral de recursos naturales.",
    horario: "Lunes a Viernes 08:00 - 16:00",
    modalidad: "Presencial e Inspecciones de Campo",
    oficinas: [
      {
        nombre: "Dirección de Gestión y Calidad Ambiental",
        tramites: ["Licencias y fichas ambientales municipales", "Control de emisiones atmosféricas y acústicas", "Inspecciones a industrias"],
        ventanilla: "Oficina 501",
        interno: "2501",
      },
      {
        nombre: "Departamento de Recursos Naturales y Serranías",
        tramites: ["Protección del Parque Tunari y serranías", "Gestión de lagunas y torrenteras", "Monitoreo hídrico"],
        ventanilla: "Oficina 502",
        interno: "2502",
      },
      {
        nombre: "Unidad Forestal y Jardinería Urbana",
        tramites: ["Permisos de poda y tala controlada", "Donación de especies nativas para barrios", "Plan Maestro de Arborización"],
        ventanilla: "Oficina 503",
        interno: "2503",
      },
    ],
  },
  {
    piso: 6,
    nombre: "Movilidad Urbana y Seguridad Ciudadana",
    sector: "Transporte y Seguridad",
    color: "#00a7d6",
    descripcion: "Regulación técnica del transporte público, semaforización moderna, ciclovías y coordinación de vigilancia preventiva.",
    horario: "Lunes a Viernes 08:00 - 16:00",
    modalidad: "Presencial e Informes Técnicos",
    oficinas: [
      {
        nombre: "Dirección de Movilidad Urbana",
        tramites: ["Autorizaciones de rutas de transporte público", "Tarjetas de operación vehicular", "Estudios viales distritales"],
        ventanilla: "Oficina 601",
        interno: "2601",
      },
      {
        nombre: "Departamento de Señalización y Semáforos",
        tramites: ["Solicitudes vecinales de semáforos y reductores", "Pintado de pasos peatonales", "Mantenimiento semafórico"],
        ventanilla: "Oficina 602",
        interno: "2602",
      },
      {
        nombre: "Dirección de Seguridad Ciudadana",
        tramites: ["Monitoreo de cámaras de vigilancia municipal", "Alarmas comunitarias vecinales", "Coordinación con la Policía Boliviana"],
        ventanilla: "Oficina 603",
        interno: "2603",
      },
    ],
  },
  {
    piso: 7,
    nombre: "Secretaría de Infraestructura y Obras Públicas",
    sector: "Obras Públicas",
    color: "#00a7d6",
    descripcion: "Diseño, licitación, ejecución y mantenimiento de grandes obras de asfalto, puentes, distribuidores e infraestructura comunitaria.",
    horario: "Lunes a Viernes 08:00 - 16:00",
    modalidad: "Presencial y Verificaciones Técnicas",
    oficinas: [
      {
        nombre: "Dirección de Obras Públicas",
        tramites: ["Fiscalización de proyectos de pavimento y asfalto", "Construcción de escuelas y centros cívicos", "Obras de desagüe pluvial"],
        ventanilla: "Oficina 701",
        interno: "2701",
      },
      {
        nombre: "Unidad de Mantenimiento y Emergencias Viales",
        tramites: ["Atención de baches y emergencias por lluvias", "Limpieza de canales y desniveles", "Cuadrillas operativas 24/7"],
        ventanilla: "Oficina 702",
        interno: "2702",
      },
      {
        nombre: "Departamento de Contrataciones Técnicas",
        tramites: ["Pliegos de especificaciones de obra", "Adjudicaciones SICOES", "Revisión de garantías contractuales"],
        ventanilla: "Oficina 703",
        interno: "2703",
      },
    ],
  },
  {
    piso: 8,
    nombre: "Administración Territorial y Catastro Urbano",
    sector: "Territorio y Catastro",
    color: "#00a7d6",
    descripcion: "Regularización del suelo urbano, emisión de códigos catastrales, línea y nivel oficial, y certificación georreferenciada.",
    horario: "Lunes a Viernes 08:00 - 16:00",
    modalidad: "Presencial con Cita Digital",
    oficinas: [
      {
        nombre: "Dirección de Catastro Municipal",
        tramites: ["Emisión y actualización de Registro Catastral", "Certificados de Avalúo Catastral", "Resoluciones de unificación y fraccionamiento"],
        ventanilla: "Ventanillas 1 al 6",
        interno: "2801",
      },
      {
        nombre: "Departamento de Topografía y Geodesia",
        tramites: ["Marcación de línea y nivel oficial", "Levantamientos topográficos", "Verificación de áreas de cesión municipal"],
        ventanilla: "Oficina 802",
        interno: "2802",
      },
      {
        nombre: "Unidad de Regularización de Bienes Inmuebles",
        tramites: ["Saneamiento de derecho propietario municipal", "Planes de regularización vecinal", "Certificaciones de límites distritales"],
        ventanilla: "Oficina 803",
        interno: "2803",
      },
    ],
  },
  {
    piso: 9,
    nombre: "Secretaría de Planificación y Urbanismo",
    sector: "Planificación Urbana",
    color: "#00a7d6",
    descripcion: "Plan Regulador de Cochabamba, aprobación de planos de construcción, directrices de uso de suelo y desarrollo urbano sostenible.",
    horario: "Lunes a Viernes 08:00 - 16:00",
    modalidad: "Presencial y Plataforma Urbanística Virtual",
    oficinas: [
      {
        nombre: "Dirección de Urbanismo",
        tramites: ["Aprobación de planos arquitectónicos", "Permisos de construcción unifamiliar y multifamiliar", "Fiscalización del Código de Urbanismo"],
        ventanilla: "Oficina 901",
        interno: "2901",
      },
      {
        nombre: "Departamento de Plan Regulador",
        tramites: ["Directrices de zonificación y altura máxima", "Estudios de impacto urbano", "Renovación del centro histórico patrimonial"],
        ventanilla: "Oficina 902",
        interno: "2902",
      },
      {
        nombre: "Unidad de Proyectos Urbanísticos Especiales",
        tramites: ["Planes maestros de corredores urbanos", "Revitalización de espacios públicos y plazas", "Diseño urbano estratégico"],
        ventanilla: "Oficina 903",
        interno: "2903",
      },
    ],
  },
  {
    piso: 10,
    nombre: "Secretaría de Finanzas y Administración Central",
    sector: "Finanzas Municipales",
    color: "#462d81",
    descripcion: "Planificación presupuestaria del municipio, contabilidad oficial, tesorería central y rendición de cuentas pública.",
    horario: "Lunes a Viernes 08:00 - 16:00",
    modalidad: "Presencial y Sistema SIGEP",
    oficinas: [
      {
        nombre: "Dirección de Presupuestos",
        tramites: ["Formulación y seguimiento del POA municipal", "Modificaciones presupuestarias", "Asignación a proyectos distritales"],
        ventanilla: "Oficina 1001",
        interno: "3001",
      },
      {
        nombre: "Dirección de Contabilidad y Tesorería",
        tramites: ["Pagos a proveedores y contratistas", "Conciliaciones bancarias y estados financieros", "Control de transferencias del TGN"],
        ventanilla: "Oficina 1002",
        interno: "3002",
      },
      {
        nombre: "Departamento de Bienes y Suministros Central",
        tramites: ["Inventario patrimonial de activos fijos", "Almacenes centrales", "Adquisición de insumos institucionales"],
        ventanilla: "Oficina 1003",
        interno: "3003",
      },
    ],
  },
  {
    piso: 11,
    nombre: "Transparencia, Asuntos Jurídicos y Auditoría",
    sector: "Control y Legalidad",
    color: "#0f172a",
    descripcion: "Garantía de probidad administrativa, lucha contra la corrupción, defensa jurídica del patrimonio municipal y auditoría de gestión.",
    horario: "Lunes a Viernes 08:00 - 16:00",
    modalidad: "Presencial y Buzón Confidencial",
    oficinas: [
      {
        nombre: "Dirección de Transparencia y Lucha Contra la Corrupción",
        tramites: ["Recepción de denuncias por presuntas irregularidades", "Vigilancia de procesos de contratación", "Acceso a la información pública"],
        ventanilla: "Módulo de Recepción Directa",
        interno: "3101",
      },
      {
        nombre: "Dirección de Asesoría Jurídica",
        tramites: ["Defensa legal del municipio en litigios", "Elaboración de decretos y proyectos de leyes municipales", "Revisión jurídica de contratos"],
        ventanilla: "Oficina 1102",
        interno: "3102",
      },
      {
        nombre: "Dirección de Auditoría Interna",
        tramites: ["Auditorías financieras y operativas independientes", "Seguimiento a recomendaciones de la Contraloría", "Evaluación del sistema de control interno"],
        ventanilla: "Oficina 1103",
        interno: "3103",
      },
    ],
  },
  {
    piso: 12,
    nombre: "Secretaría General y Coordinación de Gabinete",
    sector: "Gabinete Municipal",
    color: "#0f172a",
    descripcion: "Articulación interinstitucional de todas las Secretarías, enlace con el Concejo Municipal y gestión de la comunicación oficial.",
    horario: "Lunes a Viernes 08:00 - 18:00",
    modalidad: "Presencial y Despacho Ejecutivo",
    oficinas: [
      {
        nombre: "Secretaría General del GAMC",
        tramites: ["Coordinación del Gabinete de Secretarios", "Relacionamiento con el Concejo Municipal de Cochabamba", "Promulgación y registro de leyes municipales"],
        ventanilla: "Recepción de Secretaría General",
        interno: "3201",
      },
      {
        nombre: "Dirección de Comunicación e Imagen Institucional",
        tramites: ["Gacetilla de prensa oficial", "Gestión del portal web municipal y redes sociales", "Campañas informativas de interés ciudadano"],
        ventanilla: "Oficina 1202",
        interno: "3202",
      },
      {
        nombre: "Unidad de Relaciones Internacionales y Cooperación",
        tramites: ["Convenios con organismos multilaterales", "Hermanamientos y fondos de cooperación externa", "Proyectos de cooperación técnica"],
        ventanilla: "Oficina 1203",
        interno: "3203",
      },
    ],
  },
  {
    piso: 13,
    nombre: "Despacho del Alcalde Municipal de Cochabamba",
    sector: "Alta Dirección MAE",
    color: "#0f172a",
    descripcion: "Sede de la Máxima Autoridad Ejecutiva del municipio, Sala de Gabinete de Crisis y Dirección Estratégica de Cochabamba.",
    horario: "Lunes a Viernes 08:00 - 19:00",
    modalidad: "Presencial con Agenda Institucional",
    oficinas: [
      {
        nombre: "Despacho Oficial del Alcalde",
        tramites: ["Audiencias ciudadanas y vecinales programadas", "Toma de decisiones ejecutivas del municipio", "Firma de convenios y promulgaciones oficiales"],
        ventanilla: "Recepción de Despacho",
        interno: "3301",
      },
      {
        nombre: "Sala de Gabinete Central",
        tramites: ["Reuniones de coordinación de gabinete municipal", "Comité de Operaciones de Emergencia Municipal (COEM)", "Planificación estratégica institucional"],
        ventanilla: "Ala Norte",
        interno: "3302",
      },
      {
        nombre: "Jefatura de Gabinete y Protocolo",
        tramites: ["Coordinación de la agenda oficial del Alcalde", "Actos protocolares y cívicos de Cochabamba", "Atención a misiones diplomáticas y comitivas distritales"],
        ventanilla: "Oficina 1303",
        interno: "3303",
      },
    ],
  },
];

let pisoActivo = 1;
const contenedorLista = document.getElementById("edificio-lista-pisos") as HTMLElement;
const selectMovil = document.getElementById("edificio-select-movil") as HTMLSelectElement;
const inputBusqueda = document.getElementById("edificio-busqueda") as HTMLInputElement;
const btnLimpiar = document.getElementById("edificio-limpiar-busqueda") as HTMLButtonElement;
const btnAnterior = document.getElementById("edificio-btn-anterior") as HTMLButtonElement;
const btnSiguiente = document.getElementById("edificio-btn-siguiente") as HTMLButtonElement;

const elemNumero = document.getElementById("edificio-detalle-numero") as HTMLElement;
const elemNombre = document.getElementById("edificio-detalle-nombre") as HTMLElement;
const elemSector = document.getElementById("edificio-detalle-badge-sector") as HTMLElement;
const elemDesc = document.getElementById("edificio-detalle-descripcion") as HTMLElement;
const elemHorario = document.getElementById("edificio-detalle-horario") as HTMLElement;
const elemModalidad = document.getElementById("edificio-detalle-modalidad") as HTMLElement;
const elemOficinas = document.getElementById("edificio-lista-oficinas") as HTMLElement;

function formatearNumero(num: number): string {
  return num < 10 ? "0" + num : String(num);
}

function renderizarDirectorio(): void {
  if (!contenedorLista) return;
  contenedorLista.innerHTML = "";
  if (selectMovil) selectMovil.innerHTML = "";

  // Mostrar los 13 pisos de forma descendente (13 al 1) como en un edificio real
  const pisosDescendentes = [...PISOS].reverse();

  pisosDescendentes.forEach((p) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "edificio-gamc__piso-item" + (p.piso === pisoActivo ? " is-activo" : "");
    btn.id = "piso-btn-" + p.piso;
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-selected", p.piso === pisoActivo ? "true" : "false");
    btn.setAttribute("data-piso", String(p.piso));

    btn.innerHTML = \`<span class="edificio-gamc__piso-numero-badge">\${formatearNumero(p.piso)}</span>
      <div class="edificio-gamc__piso-item-info">
        <span class="edificio-gamc__piso-item-nombre">\${p.nombre}</span>
        <span class="edificio-gamc__piso-item-sector">\${p.sector}</span>
      </div>\`;

    btn.addEventListener("click", () => seleccionarPiso(p.piso));
    contenedorLista.appendChild(btn);

    if (selectMovil) {
      const opt = document.createElement("option");
      opt.value = String(p.piso);
      opt.textContent = \`Piso \${formatearNumero(p.piso)} - \${p.nombre}\`;
      opt.selected = p.piso === pisoActivo;
      selectMovil.appendChild(opt);
    }
  });
}

function renderizarFichaPiso(p: PisoInfo): void {
  if (!elemNumero) return;
  elemNumero.textContent = "Piso " + formatearNumero(p.piso);
  elemNombre.textContent = p.nombre;
  elemSector.textContent = p.sector;
  elemDesc.textContent = p.descripcion;
  elemHorario.textContent = p.horario;
  elemModalidad.textContent = p.modalidad;

  if (elemOficinas) {
    elemOficinas.innerHTML = p.oficinas
      .map(
        (oficina) => \`<article class="edificio-gamc__oficina-tarjeta">
          <div class="edificio-gamc__oficina-cabecera">
            <span class="edificio-gamc__oficina-nombre">\${oficina.nombre}</span>
            \${oficina.ventanilla ? \`<span class="edificio-gamc__oficina-ventanilla">\${oficina.ventanilla}</span>\` : ""}
          </div>
          <ul class="edificio-gamc__tramites-lista">
            \${oficina.tramites.map((t) => \`<li>\${t}</li>\`).join("")}
          </ul>
          \${oficina.interno ? \`<div class="edificio-gamc__oficina-pie">Interno de contacto: \${oficina.interno}</div>\` : ""}
        </article>\`
      )
      .join("");
  }

  // Actualizar estado de botones anterior y siguiente
  if (btnAnterior) btnAnterior.disabled = p.piso <= 1;
  if (btnSiguiente) btnSiguiente.disabled = p.piso >= 13;
}

function seleccionarPiso(num: number): void {
  const pisoObj = PISOS.find((item) => item.piso === num);
  if (!pisoObj) return;

  pisoActivo = num;

  // Actualizar clases activas en botones
  const botones = contenedorLista?.querySelectorAll(".edificio-gamc__piso-item");
  botones?.forEach((b) => {
    const esActivo = b.getAttribute("data-piso") === String(num);
    b.classList.toggle("is-activo", esActivo);
    b.setAttribute("aria-selected", esActivo ? "true" : "false");
  });

  if (selectMovil) {
    selectMovil.value = String(num);
  }

  renderizarFichaPiso(pisoObj);
}

if (selectMovil) {
  selectMovil.addEventListener("change", (e) => {
    const val = Number((e.target as HTMLSelectElement).value);
    if (!isNaN(val)) seleccionarPiso(val);
  });
}

if (btnAnterior) {
  btnAnterior.addEventListener("click", () => {
    if (pisoActivo > 1) seleccionarPiso(pisoActivo - 1);
  });
}

if (btnSiguiente) {
  btnSiguiente.addEventListener("click", () => {
    if (pisoActivo < 13) seleccionarPiso(pisoActivo + 1);
  });
}

if (inputBusqueda) {
  inputBusqueda.addEventListener("input", () => {
    const q = inputBusqueda.value.trim().toLowerCase();
    if (btnLimpiar) btnLimpiar.hidden = q.length === 0;

    const botones = contenedorLista?.querySelectorAll<HTMLElement>(".edificio-gamc__piso-item");
    botones?.forEach((btn) => {
      const numPiso = Number(btn.getAttribute("data-piso"));
      const p = PISOS.find((item) => item.piso === numPiso);
      if (!p) return;

      const coincide =
        q.length === 0 ||
        p.nombre.toLowerCase().includes(q) ||
        p.sector.toLowerCase().includes(q) ||
        String(p.piso) === q ||
        p.oficinas.some((o) => o.nombre.toLowerCase().includes(q) || o.tramites.some((t) => t.toLowerCase().includes(q)));

      btn.hidden = !coincide;
    });
  });
}

if (btnLimpiar) {
  btnLimpiar.addEventListener("click", () => {
    if (inputBusqueda) {
      inputBusqueda.value = "";
      inputBusqueda.dispatchEvent(new Event("input"));
      inputBusqueda.focus();
    }
  });
}

renderizarDirectorio();
seleccionarPiso(1);
`;

export const ORGANIGRAMA_MUNICIPAL_HTML = `<section class="org-gamc" aria-labelledby="org-titulo">
  <header class="org-gamc__encabezado">
    <div class="org-gamc__marca">
      <span class="org-gamc__punto-estado" aria-hidden="true"></span>
      <span>Estructura Orgánica Oficial · GAMC</span>
    </div>
    <h2 id="org-titulo" class="org-gamc__titulo">Organigrama Institucional</h2>
    <p class="org-gamc__subtitulo">
      Estructura jerárquica del Gobierno Autónomo Municipal de Cochabamba. Conoce los niveles de decisión ejecutiva, secretarías municipales y direcciones operativas.
    </p>

    <div class="org-gamc__controles">
      <div class="org-gamc__buscador-wrap">
        <span class="org-gamc__lupa-simbolo" aria-hidden="true">&#9906;</span>
        <input type="search" id="org-busqueda" placeholder="Buscar dependencia, secretaría o dirección..." aria-label="Buscar en el organigrama" autocomplete="off">
        <button type="button" id="org-limpiar-busqueda" class="org-gamc__limpiar-btn" aria-label="Limpiar búsqueda" hidden="">&times;</button>
      </div>

      <nav class="org-gamc__filtros" aria-label="Filtrar por nivel orgánico">
        <button type="button" class="org-gamc__filtro-btn is-activo" data-nivel="todos">Todos los niveles</button>
        <button type="button" class="org-gamc__filtro-btn" data-nivel="directivo">Nivel Directivo</button>
        <button type="button" class="org-gamc__filtro-btn" data-nivel="ejecutivo">Secretarías Municipales</button>
        <button type="button" class="org-gamc__filtro-btn" data-nivel="operativo">Direcciones Operativas</button>
      </nav>
    </div>
  </header>

  <div class="org-gamc__estructura">
    <!-- Nivel 1: Directivo Superior -->
    <div class="org-gamc__seccion-nivel" data-seccion-nivel="directivo">
      <div class="org-gamc__nivel-encabezado">
        <span class="org-gamc__nivel-indicador org-gamc__nivel-indicador--marino"></span>
        <h3 class="org-gamc__nivel-titulo">Nivel Directivo Superior</h3>
      </div>
      <div class="org-gamc__rejilla org-gamc__rejilla--directivo" id="org-rejilla-directivo"></div>
    </div>

    <!-- Nivel 2: Secretarías Municipales -->
    <div class="org-gamc__seccion-nivel" data-seccion-nivel="ejecutivo">
      <div class="org-gamc__nivel-encabezado">
        <span class="org-gamc__nivel-indicador org-gamc__nivel-indicador--celeste"></span>
        <h3 class="org-gamc__nivel-titulo">Secretarías Municipales (Nivel Ejecutivo)</h3>
      </div>
      <div class="org-gamc__rejilla org-gamc__rejilla--secretarias" id="org-rejilla-secretarias"></div>
    </div>

    <!-- Nivel 3: Direcciones Operativas y Desconcentradas -->
    <div class="org-gamc__seccion-nivel" data-seccion-nivel="operativo">
      <div class="org-gamc__nivel-encabezado">
        <span class="org-gamc__nivel-indicador org-gamc__nivel-indicador--teal"></span>
        <h3 class="org-gamc__nivel-titulo">Direcciones Operativas y Unidades Desconcentradas</h3>
      </div>
      <div class="org-gamc__rejilla org-gamc__rejilla--operativo" id="org-rejilla-operativo"></div>
    </div>
  </div>
</section>`;

export const ORGANIGRAMA_MUNICIPAL_CSS = `.org-gamc {
  --gamc-celeste: #00a7d6;
  --gamc-celeste-hover: #008bb3;
  --gamc-celeste-suave: #e6f6fb;
  --gamc-marino: #0f172a;
  --gamc-texto: #334155;
  --gamc-texto-suave: #64748b;
  --gamc-borde: #cbd5e1;
  --gamc-borde-suave: #e2e8f0;
  --gamc-superficie: #f8fafc;
  --gamc-blanco: #ffffff;
  --gamc-teal: #0da593;
  --gamc-morado: #462d81;
  font-family: inherit;
  color: var(--gamc-marino);
  padding: 16px 8px 32px;
  max-width: 1080px;
  margin: 0 auto 48px;
  position: relative;
  clear: both;
}

.org-gamc__encabezado {
  margin-bottom: 28px;
}

.org-gamc__marca {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--gamc-celeste-suave);
  color: var(--gamc-celeste-hover);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 6px 12px;
  border-radius: 9999px;
  margin-bottom: 12px;
  border: 1px solid rgba(0, 167, 214, 0.2);
}

.org-gamc__punto-estado {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--gamc-celeste);
  display: inline-block;
}

.org-gamc__titulo {
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--gamc-marino);
  margin: 0 0 8px;
}

.org-gamc__subtitulo {
  font-size: 15px;
  color: var(--gamc-texto-suave);
  line-height: 1.5;
  margin: 0 0 20px;
  max-width: 780px;
}

.org-gamc__controles {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.org-gamc__buscador-wrap {
  position: relative;
  max-width: 500px;
}

.org-gamc__lupa-simbolo {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--gamc-texto-suave);
  font-size: 16px;
  pointer-events: none;
}

.org-gamc__buscador-wrap input {
  width: 100%;
  height: 44px;
  border-radius: 10px;
  border: 1px solid var(--gamc-borde);
  padding: 0 38px 0 38px;
  font-size: 14px;
  color: var(--gamc-marino);
  background: var(--gamc-blanco);
  transition: border-color 0.15s, box-shadow 0.15s;
  box-sizing: border-box;
}

.org-gamc__buscador-wrap input:focus {
  outline: none;
  border-color: var(--gamc-celeste);
  box-shadow: 0 0 0 3px rgba(0, 167, 214, 0.15);
}

.org-gamc__limpiar-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--gamc-texto-suave);
  font-size: 20px;
  cursor: pointer;
  line-height: 1;
  padding: 4px;
}

.org-gamc__filtros {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.org-gamc__filtro-btn {
  padding: 7px 14px;
  border-radius: 9999px;
  border: 1px solid var(--gamc-borde);
  background: var(--gamc-blanco);
  font-size: 13px;
  font-weight: 600;
  color: var(--gamc-texto);
  cursor: pointer;
  transition: all 0.15s;
}

.org-gamc__filtro-btn:hover {
  border-color: var(--gamc-celeste);
  background: var(--gamc-celeste-suave);
  color: var(--gamc-celeste-hover);
}

.org-gamc__filtro-btn.is-activo {
  background: var(--gamc-marino);
  color: var(--gamc-blanco);
  border-color: var(--gamc-marino);
}

/* Estructura por niveles */
.org-gamc__estructura {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.org-gamc__seccion-nivel[hidden] {
  display: none !important;
}

.org-gamc__nivel-encabezado {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--gamc-borde-suave);
}

.org-gamc__nivel-indicador {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.org-gamc__nivel-indicador--marino {
  background: var(--gamc-marino);
}

.org-gamc__nivel-indicador--celeste {
  background: var(--gamc-celeste);
}

.org-gamc__nivel-indicador--teal {
  background: var(--gamc-teal);
}

.org-gamc__nivel-titulo {
  font-size: 18px;
  font-weight: 700;
  color: var(--gamc-marino);
  margin: 0;
}

.org-gamc__rejilla {
  display: grid;
  gap: 16px;
}

.org-gamc__rejilla--directivo {
  grid-template-columns: 1fr;
}

.org-gamc__rejilla--secretarias {
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
}

.org-gamc__rejilla--operativo {
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

/* Tarjetas de dependencias */
.org-gamc__tarjeta {
  background: var(--gamc-blanco);
  border: 1px solid var(--gamc-borde-suave);
  border-radius: 12px;
  padding: 18px 20px;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.03);
  transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.org-gamc__tarjeta:hover {
  border-color: var(--gamc-celeste);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
}

.org-gamc__tarjeta--destacada {
  border-left: 5px solid var(--gamc-marino);
  background: linear-gradient(180deg, #ffffff 0%, var(--gamc-superficie) 100%);
}

.org-gamc__tarjeta--secretaria {
  border-left: 5px solid var(--gamc-celeste);
}

.org-gamc__tarjeta--operativa {
  border-left: 5px solid var(--gamc-teal);
}

.org-gamc__tarjeta-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.org-gamc__tarjeta-badge {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 3px 8px;
  border-radius: 6px;
  background: var(--gamc-superficie);
  color: var(--gamc-texto-suave);
}

.org-gamc__tarjeta-ubicacion {
  font-size: 11px;
  font-weight: 700;
  color: var(--gamc-celeste-hover);
  background: var(--gamc-celeste-suave);
  padding: 2px 8px;
  border-radius: 4px;
}

.org-gamc__tarjeta-titulo {
  font-size: 16px;
  font-weight: 800;
  color: var(--gamc-marino);
  margin: 0 0 4px;
  line-height: 1.3;
}

.org-gamc__tarjeta-titular {
  font-size: 13px;
  font-weight: 600;
  color: var(--gamc-celeste-hover);
  margin: 0 0 10px;
}

.org-gamc__tarjeta-desc {
  font-size: 13px;
  line-height: 1.5;
  color: var(--gamc-texto);
  margin: 0 0 14px;
  flex: 1;
}

.org-gamc__dependencias-wrap {
  border-top: 1px solid var(--gamc-borde-suave);
  padding-top: 10px;
  margin-top: auto;
}

.org-gamc__dependencias-rotulo {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--gamc-texto-suave);
  display: block;
  margin-bottom: 6px;
}

.org-gamc__chips-lista {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.org-gamc__chip {
  font-size: 11px;
  font-weight: 600;
  background: var(--gamc-superficie);
  color: var(--gamc-marino);
  border: 1px solid var(--gamc-borde-suave);
  padding: 3px 8px;
  border-radius: 6px;
}

.org-gamc__tarjeta[hidden] {
  display: none !important;
}
`;

export const ORGANIGRAMA_MUNICIPAL_TS = `interface OrganoDirectivo {
  id: string;
  nombre: string;
  titular?: string;
  nivel: "directivo" | "ejecutivo" | "operativo";
  ubicacion: string;
  descripcion: string;
  dependencias?: string[];
}

export const DEPENDENCIAS: OrganoDirectivo[] = [
  // Nivel Directivo Superior
  {
    id: "despacho-alcalde",
    nombre: "Despacho del Alcalde Municipal",
    titular: "Lic. Manfred Reyes Villa",
    nivel: "directivo",
    ubicacion: "Piso 13 · Edificio Central",
    descripcion: "Máxima Autoridad Ejecutiva del Gobierno Autónomo Municipal de Cochabamba. Dirección estratégica, planificación de políticas públicas y coordinación general del gabinete municipal.",
    dependencias: ["Secretaría General", "Dirección de Transparencia", "Dirección de Auditoría Interna", "Jefatura de Gabinete"],
  },
  {
    id: "secretaria-general",
    nombre: "Secretaría General y Coordinación de Gabinete",
    nivel: "directivo",
    ubicacion: "Piso 12 · Edificio Central",
    descripcion: "Coordinación ejecutiva del gabinete de secretarios, relacionamiento con el Concejo Municipal y gestión de convenios interinstitucionales.",
    dependencias: ["Dirección de Comunicación Institucional", "Unidad de Relaciones Internacionales", "Gabinete de Despacho"],
  },
  {
    id: "transparencia-control",
    nombre: "Dirección de Transparencia y Lucha Contra la Corrupción",
    nivel: "directivo",
    ubicacion: "Piso 11 · Edificio Central",
    descripcion: "Garantía de probidad administrativa, prevención y procesamiento de denuncias por hechos irregulares y facilitación del acceso ciudadano a la información.",
    dependencias: ["Unidad de Ética Pública", "Unidad de Procesamiento de Denuncias", "Oficina de Acceso a la Información"],
  },

  // Secretarías Municipales (Nivel Ejecutivo)
  {
    id: "sec-finanzas",
    nombre: "Secretaría de Finanzas y Administración Tributaria",
    nivel: "ejecutivo",
    ubicacion: "Piso 10 · Edificio Central",
    descripcion: "Gestión financiera, formulación del POA y presupuesto municipal, tesorería central y política tributaria local.",
    dependencias: ["Dirección de Recaudaciones (RUAT)", "Dirección de Presupuestos", "Dirección de Contabilidad y Tesorería", "Almacenes Centrales"],
  },
  {
    id: "sec-planificacion",
    nombre: "Secretaría de Planificación y Urbanismo",
    nivel: "ejecutivo",
    ubicacion: "Piso 09 · Edificio Central",
    descripcion: "Plan Regulador de Cochabamba, fiscalización del Código de Urbanismo, aprobación de proyectos arquitectónicos y desarrollo urbano.",
    dependencias: ["Dirección de Urbanismo", "Departamento de Plan Regulador", "Unidad de Proyectos Urbanísticos Especiales"],
  },
  {
    id: "sec-catastro",
    nombre: "Secretaría de Administración Territorial y Catastro",
    nivel: "ejecutivo",
    ubicacion: "Piso 08 · Edificio Central",
    descripcion: "Administración del suelo urbano, emisión de registros catastrales, certificación georreferenciada, topografía y línea y nivel.",
    dependencias: ["Dirección de Catastro Municipal", "Departamento de Topografía y Geodesia", "Unidad de Regularización de Inmuebles"],
  },
  {
    id: "sec-infraestructura",
    nombre: "Secretaría de Infraestructura y Obras Públicas",
    nivel: "ejecutivo",
    ubicacion: "Piso 07 · Edificio Central",
    descripcion: "Construcción y mantenimiento de la red vial urbana, distribuidores, puentes, drenaje pluvial y equipamiento comunal.",
    dependencias: ["Dirección de Obras Públicas", "Unidad de Emergencias Viales", "Departamento de Contrataciones Técnicas"],
  },
  {
    id: "sec-movilidad",
    nombre: "Secretaría de Movilidad Urbana y Seguridad Ciudadana",
    nivel: "ejecutivo",
    ubicacion: "Piso 06 · Edificio Central",
    descripcion: "Regulación técnica del transporte, semaforización moderna, ciclovías integradas y vigilancia preventiva municipal.",
    dependencias: ["Dirección de Movilidad Urbana", "Departamento de Señalización", "Dirección de Seguridad Ciudadana"],
  },
  {
    id: "sec-medioambiente",
    nombre: "Secretaría de Medio Ambiente y Protección a la Madre Tierra",
    nivel: "ejecutivo",
    ubicacion: "Piso 05 · Edificio Central",
    descripcion: "Protección ambiental de la cuenca, arborización masiva, calidad del aire y gestión integral de lagunas y serranías.",
    dependencias: ["Dirección de Gestión Ambiental", "Departamento de Recursos Naturales", "Unidad Forestal Municipal"],
  },
  {
    id: "sec-salud",
    nombre: "Secretaría Municipal de Salud",
    nivel: "ejecutivo",
    ubicacion: "Piso 04 · Edificio Central",
    descripcion: "Administración de la red de centros de salud y hospitales de primer nivel, control epidemiológico y programas de salud escolar.",
    dependencias: ["Dirección de Gestión Hospitalaria", "Unidad de Epidemiología", "Programa de Salud Escolar y Comunitaria"],
  },
  {
    id: "sec-desarrollo-humano",
    nombre: "Secretaría de Desarrollo Humano, Género y Generacional",
    nivel: "ejecutivo",
    ubicacion: "Piso 03 · Edificio Central",
    descripcion: "Protección integral a la niñez, juventud, adultos mayores y personas con discapacidad a través de servicios sociales especializados.",
    dependencias: ["Defensorías de la Niñez y Adolescencia", "Departamento del Adulto Mayor", "Unidad UMADIS", "Servicios Legales Integrales (SLIM)"],
  },
  {
    id: "sec-gobernabilidad",
    nombre: "Secretaría de Gobernabilidad y Asuntos Jurídicos",
    nivel: "ejecutivo",
    ubicacion: "Piso 11 · Edificio Central",
    descripcion: "Diálogo y resolución de conflictos sociales distritales, defensa jurídica del municipio y relacionamiento con juntas vecinales.",
    dependencias: ["Dirección de Asuntos Jurídicos", "Dirección de Gobernabilidad", "Unidad de Mediación Vecinal"],
  },

  // Direcciones Operativas y Desconcentradas
  {
    id: "op-recaudaciones",
    nombre: "Dirección de Recaudaciones y RUAT",
    nivel: "operativo",
    ubicacion: "Piso 02 · Edificio Central",
    descripcion: "Atención al contribuyente para cobro de impuestos a inmuebles, vehículos y patentes comerciales.",
  },
  {
    id: "op-catastro-operativo",
    nombre: "Plataforma de Catastro Urbano",
    nivel: "operativo",
    ubicacion: "Piso 08 · Edificio Central",
    descripcion: "Ventanillas de tramitación de certificados catastrales, línea y nivel y fraccionamiento.",
  },
  {
    id: "op-intendencia",
    nombre: "Intendencia Municipal de Cochabamba",
    nivel: "operativo",
    ubicacion: "Mercado Central / Oficinas Desconcentradas",
    descripcion: "Control de higiene e inocuidad alimentaria en mercados, fiscalización de pesaje y defensa del consumidor.",
  },
  {
    id: "op-defensorias",
    nombre: "Red Distrital de Defensorías de la Niñez",
    nivel: "operativo",
    ubicacion: "Subalcaldías Distritales (Distritos 1 al 14)",
    descripcion: "Atención multidisciplinaria descentralizada (legal, psicológica y social) para la niñez y familia en cada distrito.",
  },
  {
    id: "op-emavra",
    nombre: "Empresa Municipal de Áreas Verdes y Recreación (EMAVRA)",
    nivel: "operativo",
    ubicacion: "Parques y Viveros Municipales",
    descripcion: "Mantenimiento y embellecimiento de plazas, parques infantiles, avenidas y áreas verdes de la ciudad.",
  },
  {
    id: "op-emsa",
    nombre: "Empresa Municipal de Servicios de Aseo (EMSA)",
    nivel: "operativo",
    ubicacion: "Instalaciones Operativas EMSA",
    descripcion: "Recolección, barrido, transporte y tratamiento técnico de residuos sólidos en todo el municipio.",
  },
];

const rejillaDirectivo = document.getElementById("org-rejilla-directivo") as HTMLElement;
const rejillaSecretarias = document.getElementById("org-rejilla-secretarias") as HTMLElement;
const rejillaOperativo = document.getElementById("org-rejilla-operativo") as HTMLElement;
const inputBusquedaOrg = document.getElementById("org-busqueda") as HTMLInputElement;
const btnLimpiarOrg = document.getElementById("org-limpiar-busqueda") as HTMLButtonElement;
const botonesFiltro = document.querySelectorAll<HTMLButtonElement>(".org-gamc__filtro-btn");
const seccionesNivel = document.querySelectorAll<HTMLElement>(".org-gamc__seccion-nivel");

function crearTarjetaHTML(item: OrganoDirectivo): string {
  const claseTipo =
    item.nivel === "directivo"
      ? "org-gamc__tarjeta--destacada"
      : item.nivel === "ejecutivo"
      ? "org-gamc__tarjeta--secretaria"
      : "org-gamc__tarjeta--operativa";

  const rotuloNivel =
    item.nivel === "directivo"
      ? "Nivel Directivo"
      : item.nivel === "ejecutivo"
      ? "Secretaría Municipal"
      : "Dirección Operativa";

  return \`<article class="org-gamc__tarjeta \${claseTipo}" data-id="\${item.id}" data-nivel="\${item.nivel}">
    <div class="org-gamc__tarjeta-meta">
      <span class="org-gamc__tarjeta-badge">\${rotuloNivel}</span>
      <span class="org-gamc__tarjeta-ubicacion">\${item.ubicacion}</span>
    </div>
    <h4 class="org-gamc__tarjeta-titulo">\${item.nombre}</h4>
    \${item.titular ? \`<div class="org-gamc__tarjeta-titular">\${item.titular}</div>\` : ""}
    <p class="org-gamc__tarjeta-desc">\${item.descripcion}</p>
    \${
      item.dependencias && item.dependencias.length > 0
        ? \`<div class="org-gamc__dependencias-wrap">
            <span class="org-gamc__dependencias-rotulo">Dependencias a su cargo:</span>
            <div class="org-gamc__chips-lista">
              \${item.dependencias.map((dep) => \`<span class="org-gamc__chip">\${dep}</span>\`).join("")}
            </div>
          </div>\`
        : ""
    }
  </article>\`;
}

function renderizarOrganigrama(): void {
  const directivos = DEPENDENCIAS.filter((d) => d.nivel === "directivo");
  const secretarias = DEPENDENCIAS.filter((d) => d.nivel === "ejecutivo");
  const operativos = DEPENDENCIAS.filter((d) => d.nivel === "operativo");

  if (rejillaDirectivo) rejillaDirectivo.innerHTML = directivos.map(crearTarjetaHTML).join("");
  if (rejillaSecretarias) rejillaSecretarias.innerHTML = secretarias.map(crearTarjetaHTML).join("");
  if (rejillaOperativo) rejillaOperativo.innerHTML = operativos.map(crearTarjetaHTML).join("");
}

function aplicarFiltros(): void {
  const q = inputBusquedaOrg ? inputBusquedaOrg.value.trim().toLowerCase() : "";
  const filtroActivo = document.querySelector(".org-gamc__filtro-btn.is-activo")?.getAttribute("data-nivel") || "todos";

  if (btnLimpiarOrg) btnLimpiarOrg.hidden = q.length === 0;

  // Filtrar secciones por nivel
  seccionesNivel.forEach((sec) => {
    const nivelSec = sec.getAttribute("data-seccion-nivel");
    const coincideNivel = filtroActivo === "todos" || filtroActivo === nivelSec;
    sec.hidden = !coincideNivel;
  });

  // Filtrar tarjetas por búsqueda
  const tarjetas = document.querySelectorAll<HTMLElement>(".org-gamc__tarjeta");
  tarjetas.forEach((tarjeta) => {
    const id = tarjeta.getAttribute("data-id");
    const item = DEPENDENCIAS.find((d) => d.id === id);
    if (!item) return;

    const coincideTexto =
      q.length === 0 ||
      item.nombre.toLowerCase().includes(q) ||
      (item.titular && item.titular.toLowerCase().includes(q)) ||
      item.descripcion.toLowerCase().includes(q) ||
      item.ubicacion.toLowerCase().includes(q) ||
      (item.dependencias && item.dependencias.some((dep) => dep.toLowerCase().includes(q)));

    tarjeta.hidden = !coincideTexto;
  });
}

botonesFiltro.forEach((btn) => {
  btn.addEventListener("click", () => {
    botonesFiltro.forEach((b) => b.classList.remove("is-activo"));
    btn.classList.add("is-activo");
    aplicarFiltros();
  });
});

if (inputBusquedaOrg) {
  inputBusquedaOrg.addEventListener("input", aplicarFiltros);
}

if (btnLimpiarOrg) {
  btnLimpiarOrg.addEventListener("click", () => {
    inputBusquedaOrg.value = "";
    inputBusquedaOrg.dispatchEvent(new Event("input"));
    inputBusquedaOrg.focus();
  });
}

renderizarOrganigrama();
`;

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
