import type { CodeSource } from "./types.ts";

/**
 * Bloques institucionales personalizados para el portal del GAMC:
 * 1. Edificio Municipal: Sede central de 13 pisos con directorio interactivo accesible y ficha de trámites por piso.
 * 2. Organigrama Institucional: Estructura jerárquica interactiva y desplegable (d3-org-chart) con diseño limpio, sobrio y sin ilustraciones artificiales.
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

  if (btnAnterior) btnAnterior.disabled = p.piso <= 1;
  if (btnSiguiente) btnSiguiente.disabled = p.piso >= 13;
}

function seleccionarPiso(num: number): void {
  const pisoObj = PISOS.find((item) => item.piso === num);
  if (!pisoObj) return;

  pisoActivo = num;

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
    <div class="org-gamc__insignia">
      <span class="org-gamc__insignia-punto" aria-hidden="true"></span>
      <span>Estructura Oficial · Gobierno Autónomo Municipal de Cochabamba</span>
    </div>
    <h2 id="org-titulo" class="org-gamc__titulo">Organigrama Institucional</h2>
    <p class="org-gamc__intro">
      Estructura jerárquica y operativa del GAMC. Explora el mapa interactivo de dependencias, desde el Despacho del Alcalde hasta las Secretarías, Direcciones, Departamentos y Empresas Descentralizadas.
    </p>

    <div class="org-gamc__barra-control">
      <div class="org-gamc__buscador-wrap">
        <span class="org-gamc__lupa-simbolo" aria-hidden="true">&#9906;</span>
        <input id="org-buscar" type="search" placeholder="Buscar secretaría, dirección, unidad o trámite..." aria-label="Buscar en el organigrama" autocomplete="off">
        <button type="button" id="org-limpiar" class="org-gamc__limpiar-btn" aria-label="Borrar búsqueda" hidden="">&times;</button>
      </div>

      <div class="org-gamc__selector-vista" role="group" aria-label="Modo de visualización">
        <button type="button" id="org-btn-vista-diagrama" class="org-gamc__vista-btn is-activo" aria-pressed="true">
          <span>Diagrama Dinámico</span>
        </button>
        <button type="button" id="org-btn-vista-arbol" class="org-gamc__vista-btn" aria-pressed="false">
          <span>Estructura por Niveles</span>
        </button>
      </div>
    </div>

    <div class="org-gamc__filtros" role="group" aria-label="Filtrar por nivel">
      <button type="button" class="org-gamc__filtro-chip is-activo" data-filtro="todos">Todos los niveles</button>
      <button type="button" class="org-gamc__filtro-chip" data-filtro="secretaria">Secretarías</button>
      <button type="button" class="org-gamc__filtro-chip" data-filtro="direccion">Direcciones</button>
      <button type="button" class="org-gamc__filtro-chip" data-filtro="departamento">Departamentos</button>
      <button type="button" class="org-gamc__filtro-chip" data-filtro="descentralizada">Empresas Descentralizadas</button>
    </div>

    <p id="org-estado" class="org-gamc__estado" aria-live="polite"></p>
  </header>

  <div id="org-contenedor-diagrama" class="org-gamc__diagrama-marco">
    <div class="org-gamc__herramientas" role="toolbar" aria-label="Herramientas de navegación del diagrama">
      <button type="button" data-accion="acercar" title="Acercar zoom" aria-label="Acercar zoom">+</button>
      <button type="button" data-accion="alejar" title="Alejar zoom" aria-label="Alejar zoom">&minus;</button>
      <button type="button" data-accion="ajustar" title="Ajustar diagrama a pantalla" aria-label="Ajustar a la pantalla">Ajustar</button>
      <span class="org-gamc__separador-herramientas"></span>
      <button type="button" data-accion="expandir" class="org-gamc__btn-texto">Expandir todo</button>
      <button type="button" data-accion="contraer" class="org-gamc__btn-texto">Contraer todo</button>
      <span class="org-gamc__separador-herramientas"></span>
      <button type="button" data-accion="exportar-svg" class="org-gamc__btn-texto" title="Exportar diagrama en formato vectorial">Descargar SVG</button>
      <button type="button" data-accion="pantalla-completa" class="org-gamc__btn-texto" title="Alternar pantalla completa">Pantalla completa</button>
    </div>

    <div id="org-lienzo" class="org-gamc__lienzo"></div>
    <ul id="org-leyenda" class="org-gamc__leyenda" aria-label="Niveles jerárquicos"></ul>
  </div>

  <div id="org-contenedor-arbol" class="org-gamc__arbol-marco" hidden="">
    <div id="org-arbol-niveles" class="org-gamc__arbol-niveles"></div>
  </div>

  <aside id="org-detalle" class="org-gamc__detalle" aria-live="polite" hidden="">
    <div class="org-gamc__detalle-cabecera">
      <div class="org-gamc__detalle-badges">
        <span id="org-tipo-badge" class="org-gamc__badge-nivel"></span>
        <span id="org-sigla-badge" class="org-gamc__badge-sigla" hidden=""></span>
      </div>
      <button type="button" id="org-detalle-cerrar" class="org-gamc__detalle-cerrar-btn" aria-label="Cerrar ficha de detalle">&times;</button>
    </div>
    <p id="org-ruta" class="org-gamc__ruta"></p>
    <div class="org-gamc__detalle-cuerpo">
      <div class="org-gamc__detalle-info">
        <h3 id="org-nombre" class="org-gamc__nombre-unidad"></h3>
        <p id="org-cuenta" class="org-gamc__cuenta-dependientes"></p>

        <div class="org-gamc__ficha-grid">
          <div class="org-gamc__ficha-item">
            <span class="org-gamc__ficha-label">Ubicación / Piso</span>
            <strong id="org-ficha-piso" class="org-gamc__ficha-valor">-</strong>
          </div>
          <div class="org-gamc__ficha-item">
            <span class="org-gamc__ficha-label">Horario de Atención</span>
            <strong id="org-ficha-horario" class="org-gamc__ficha-valor">-</strong>
          </div>
          <div class="org-gamc__ficha-item">
            <span class="org-gamc__ficha-label">Contacto / Interno</span>
            <strong id="org-ficha-contacto" class="org-gamc__ficha-valor">-</strong>
          </div>
          <div class="org-gamc__ficha-item org-gamc__ficha-item--full">
            <span class="org-gamc__ficha-label">Trámites y Servicios</span>
            <p id="org-ficha-tramites" class="org-gamc__ficha-desc">-</p>
          </div>
        </div>
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
  --gamc-acento-naranja: #ea580c;
  font-family: inherit;
  color: var(--gamc-marino);
  padding: 16px 8px 32px;
  max-width: 1100px;
  margin: 0 auto 48px;
  position: relative;
  clear: both;
}

.org-gamc__encabezado {
  margin-bottom: 20px;
}

.org-gamc__insignia {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 14px;
  background: var(--gamc-primario-suave);
  color: var(--gamc-primario-hover);
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-bottom: 10px;
  border: 1px solid rgba(0, 167, 214, 0.2);
}

.org-gamc__insignia-punto {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--gamc-primario);
  display: inline-block;
}

.org-gamc__titulo {
  margin: 0 0 8px;
  font-size: 32px;
  font-weight: 800;
  color: var(--gamc-marino);
  letter-spacing: -0.02em;
}

.org-gamc__intro {
  margin: 0 0 18px;
  font-size: 15px;
  line-height: 1.5;
  color: var(--gamc-texto-suave);
  max-width: 760px;
}

.org-gamc__barra-control {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.org-gamc__buscador-wrap {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 260px;
  max-width: 480px;
  background: #ffffff;
  border: 1px solid var(--gamc-borde);
  border-radius: 10px;
  padding: 0 12px;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.org-gamc__buscador-wrap:focus-within {
  border-color: var(--gamc-primario);
  box-shadow: 0 0 0 3px rgba(0, 167, 214, 0.15);
}

.org-gamc__lupa-simbolo {
  font-size: 16px;
  color: var(--gamc-texto-suave);
  margin-right: 8px;
  line-height: 1;
  user-select: none;
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
  font-size: 18px;
  color: var(--gamc-texto-suave);
  cursor: pointer;
  line-height: 1;
}

.org-gamc__selector-vista {
  display: flex;
  gap: 4px;
  background: var(--gamc-superficie);
  padding: 4px;
  border: 1px solid var(--gamc-borde-suave);
  border-radius: 10px;
}

.org-gamc__vista-btn {
  display: inline-flex;
  align-items: center;
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

.org-gamc__filtros {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

.org-gamc__filtro-chip {
  padding: 6px 14px;
  background: #ffffff;
  border: 1px solid var(--gamc-borde-suave);
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  color: var(--gamc-texto);
  cursor: pointer;
  transition: all 0.15s ease;
}

.org-gamc__filtro-chip:hover {
  border-color: var(--gamc-primario);
  color: var(--gamc-primario);
  background: var(--gamc-primario-suave);
}

.org-gamc__filtro-chip.is-activo {
  background: var(--gamc-marino);
  border-color: var(--gamc-marino);
  color: #ffffff;
  font-weight: 700;
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
  background-image: radial-gradient(var(--gamc-borde-suave) 1px, transparent 1px);
  background-size: 20px 20px;
  border: 1.5px solid var(--gamc-borde-suave);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
}

.org-gamc__lienzo {
  height: 620px;
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
  background: rgba(255, 255, 255, 0.96);
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
  padding: 0 10px;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 700;
  color: var(--gamc-marino);
  cursor: pointer;
  transition: background 0.15s;
}

.org-gamc__herramientas button:hover {
  background: var(--gamc-superficie);
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
  max-width: 75%;
  margin: 0;
  padding: 8px 14px;
  list-style: none;
  font-size: 12px;
  font-weight: 600;
  color: var(--gamc-marino);
  background: rgba(255, 255, 255, 0.96);
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
  stroke: #00a7d6 !important;
  stroke-width: 2px !important;
  stroke-opacity: 0.6 !important;
}

/* Tarjeta de cada nodo en el diagrama */
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
  padding: 5px 12px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.org-nodo__nivel-texto {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.org-nodo__nivel-badge {
  background: rgba(255, 255, 255, 0.25);
  border-radius: 9999px;
  padding: 1px 6px;
  font-size: 9px;
  font-weight: 800;
  margin-left: 6px;
}

.org-nodo__cuerpo {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 10px 14px;
  flex: 1;
}

.org-nodo__cab-fila {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 6px;
}

.org-nodo__nombre {
  font-size: 13px;
  font-weight: 800;
  line-height: 1.3;
  color: var(--gamc-marino);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.org-nodo__sigla {
  font-size: 10px;
  font-weight: 700;
  color: var(--gamc-primario-hover);
  background: var(--gamc-primario-suave);
  padding: 1px 6px;
  border-radius: 4px;
  white-space: nowrap;
}

.org-nodo__subtitulo {
  font-size: 11px;
  font-weight: 600;
  color: var(--gamc-texto-suave);
  margin-top: 4px;
}

.org-nodo__piso-badge {
  font-size: 10px;
  font-weight: 600;
  color: #059669;
  background: #ecfdf5;
  padding: 1px 6px;
  border-radius: 4px;
  margin-top: 4px;
  align-self: flex-start;
}

/* Boton de expandir / contraer en d3-org-chart */
.node-button-foreign-object {
  overflow: visible !important;
}

.node-button-div {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  pointer-events: all !important;
}

.org-nodo__alternar-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  background: #ffffff;
  border: 1.5px solid var(--gamc-primario);
  border-radius: 9999px;
  padding: 3px 12px;
  font-size: 11px;
  font-weight: 700;
  color: var(--gamc-primario);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 167, 214, 0.2);
  transition: all 0.18s ease;
  white-space: nowrap;
  pointer-events: all;
  user-select: none;
}

.org-nodo__alternar-btn:hover {
  background: var(--gamc-primario);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 167, 214, 0.35);
  transform: translateY(-1px);
}

.org-nodo__alternar-btn.is-abierto {
  background: #f8fafc;
  border-color: var(--gamc-borde);
  color: var(--gamc-texto-suave);
}

.org-nodo__alternar-btn.is-abierto:hover {
  background: #fee2e2;
  border-color: #ef4444;
  color: #b91c1c;
}

.org-nodo__alternar-simbolo {
  font-size: 13px;
  font-weight: 800;
  line-height: 1;
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

.org-gamc__arbol-grupo-cabecera:hover {
  background: var(--gamc-primario-suave);
}

.org-gamc__arbol-grupo-titulo {
  font-size: 14px;
  font-weight: 800;
  color: var(--gamc-marino);
}

.org-gamc__arbol-hijos-lista {
  padding: 10px 18px 14px 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-top: 1px solid var(--gamc-borde-suave);
}

.org-gamc__arbol-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #ffffff;
  border: 1px solid var(--gamc-borde-suave);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.org-gamc__arbol-item:hover {
  border-color: var(--gamc-primario);
  background: var(--gamc-primario-suave);
}

/* Ficha de detalle institucional */
.org-gamc__detalle {
  margin-top: 16px;
  padding: 24px;
  background: #ffffff;
  border: 1.5px solid var(--gamc-borde-suave);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.06);
}

.org-gamc__detalle-cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.org-gamc__detalle-badges {
  display: flex;
  align-items: center;
  gap: 8px;
}

.org-gamc__badge-nivel {
  font-size: 11px;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: 9999px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.org-gamc__badge-sigla {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
  background: var(--gamc-primario-suave);
  color: var(--gamc-primario-hover);
  border: 1px solid rgba(0, 167, 214, 0.3);
}

.org-gamc__detalle-cerrar-btn {
  background: transparent;
  border: none;
  font-size: 22px;
  line-height: 1;
  color: var(--gamc-texto-suave);
  cursor: pointer;
  padding: 4px;
}

.org-gamc__detalle-cerrar-btn:hover {
  color: var(--gamc-marino);
}

.org-gamc__ruta {
  margin: 0 0 16px;
  font-size: 12px;
  color: var(--gamc-texto-suave);
  line-height: 1.4;
}

.org-gamc__detalle-cuerpo {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.org-gamc__nombre-unidad {
  margin: 0 0 4px;
  font-size: 22px;
  font-weight: 800;
  color: var(--gamc-marino);
}

.org-gamc__cuenta-dependientes {
  margin: 0 0 16px;
  font-size: 13px;
  color: var(--gamc-texto-suave);
}

.org-gamc__ficha-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  padding: 16px;
  background: var(--gamc-superficie);
  border: 1px solid var(--gamc-borde-suave);
  border-radius: 12px;
}

.org-gamc__ficha-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.org-gamc__ficha-item--full {
  grid-column: 1 / -1;
}

.org-gamc__ficha-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--gamc-texto-suave);
}

.org-gamc__ficha-valor {
  font-size: 13px;
  font-weight: 700;
  color: var(--gamc-marino);
}

.org-gamc__ficha-desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.4;
  color: var(--gamc-texto);
}

.org-gamc__detalle-acciones {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.org-gamc__accion-btn {
  padding: 9px 16px;
  background: #ffffff;
  border: 1.5px solid var(--gamc-borde-suave);
  border-radius: 8px;
  font-size: 13px;
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
  .org-gamc__ficha-grid {
    grid-template-columns: 1fr;
  }
}`;

export const ORGANIGRAMA_MUNICIPAL_TS = `import { OrgChart } from "d3-org-chart";

type Tipo = "despacho" | "secretaria" | "direccion" | "departamento" | "division" | "descentralizada";

interface Unidad {
  nombre: string;
  tipo: Tipo;
  sigla?: string;
  piso?: string;
  horario?: string;
  contacto?: string;
  tramites?: string;
  hijos?: Unidad[];
}

interface Nodo extends Unidad {
  id: string;
  parentId: string | null;
  hijos: number;
  total: number;
  ruta: string[];
  _expanded?: boolean;
  _highlighted?: boolean;
}

export const ORGANIGRAMA: Unidad = {
  nombre: "Alcalde Municipal",
  tipo: "despacho",
  sigla: "MAE",
  piso: "Piso 12 · Despacho",
  horario: "08:00 - 16:00 (Continuo)",
  contacto: "Línea Central: 151 / 4258030",
  tramites: "Máxima Autoridad Ejecutiva del GAMC. Dirección general de la gestión municipal, promulgación de decretos y audiencias públicas.",
  hijos: [
    {
      nombre: "Asesoría General del Despacho",
      tipo: "direccion",
      sigla: "AGD",
      piso: "Piso 12",
      horario: "08:00 - 16:00",
      contacto: "Interno: 1201",
      tramites: "Asesoramiento técnico, político y estratégico al Alcalde Municipal.",
    },
    {
      nombre: "Dirección de Gabinete y Protocolo",
      tipo: "direccion",
      sigla: "DGP",
      piso: "Piso 12",
      horario: "08:00 - 16:00",
      contacto: "Interno: 1202",
      tramites: "Coordinación de agenda del Alcalde, relaciones institucionales y actos protocolares.",
      hijos: [
        { nombre: "Departamento de Protocolo y Eventos Cívicos", tipo: "departamento", piso: "Piso 12", contacto: "Interno: 1205", tramites: "Organización de ceremonias oficiales y actos cívicos municipales." },
        { nombre: "Departamento de Comunicación e Imagen Corporativa", tipo: "departamento", piso: "Piso 12", contacto: "Interno: 1208", tramites: "Prensa, difusión oficial, redes sociales y campañas informativas municipales." },
      ],
    },
    {
      nombre: "Dirección de Transparencia y Lucha contra la Corrupción",
      tipo: "direccion",
      sigla: "DTLCC",
      piso: "Piso 11",
      horario: "08:00 - 16:00",
      contacto: "Línea Anticorrupción: 4255320",
      tramites: "Recepción y procesamiento de denuncias por hechos de corrupción, control de ética pública y acceso a información.",
    },
    {
      nombre: "Dirección de Auditoría Interna",
      tipo: "direccion",
      sigla: "DAI",
      piso: "Piso 11",
      horario: "08:00 - 16:00",
      contacto: "Interno: 1104",
      tramites: "Auditorías financieras, operacionales y de cumplimiento de normas de control gubernamental.",
    },
    {
      nombre: "Dirección de Tecnologías de Información y Comunicación",
      tipo: "direccion",
      sigla: "DTIC",
      piso: "Piso 10",
      horario: "08:00 - 16:00",
      contacto: "Soporte: 4258035",
      tramites: "Desarrollo y administración de sistemas informáticos, plataforma digital del GAMC y redes municipales.",
      hijos: [
        { nombre: "Departamento de Sistemas y Plataformas Digitales", tipo: "departamento", piso: "Piso 10", contacto: "Interno: 1002", tramites: "Portal web, trámites en línea y modernización de servicios digitales." },
        { nombre: "Departamento de Redes, Telecomunicaciones y Seguridad", tipo: "departamento", piso: "Piso 10", contacto: "Interno: 1005", tramites: "Infraestructura de servidores, conectividad y seguridad de la información." },
      ],
    },
    {
      nombre: "Secretaría General y de Gobernabilidad",
      tipo: "secretaria",
      sigla: "SGG",
      piso: "Piso 11",
      horario: "08:00 - 16:00",
      contacto: "Interno: 1101",
      tramites: "Gobernabilidad territorial, concertación social, seguridad ciudadana y orden público.",
      hijos: [
        {
          nombre: "Dirección de Gobernabilidad y Diálogo Social",
          tipo: "direccion",
          sigla: "DGDS",
          piso: "Piso 11",
          contacto: "Interno: 1110",
          tramites: "Prevención de conflictos y diálogo con organizaciones sociales.",
          hijos: [
            { nombre: "Departamento de Concertación y Diálogo Ciudadano", tipo: "departamento", piso: "Piso 11", tramites: "Mesas de concertación ciudadana y mediación vecinal." },
            { nombre: "Departamento de Relacionamiento con Juntas Vecinales y OTBs", tipo: "departamento", piso: "Piso 11", tramites: "Personerías jurídicas de OTBs, registro de directivas y audiencias distritales." },
          ],
        },
        {
          nombre: "Dirección de Asuntos Jurídicos",
          tipo: "direccion",
          sigla: "DAJ",
          piso: "Piso 11",
          contacto: "Interno: 1120",
          tramites: "Patrocinio legal de procesos municipales y emisión de criterios legales.",
          hijos: [
            { nombre: "Departamento de Contratos, Convenios y Licitaciones", tipo: "departamento", piso: "Piso 11", tramites: "Elaboración y revisión legal de contratos y convenios intergubernamentales." },
            { nombre: "Departamento de Procesos Constitucionales y Contenciosos", tipo: "departamento", piso: "Piso 11", tramites: "Defensa jurídica del municipio en fueros judiciales." },
          ],
        },
        {
          nombre: "Dirección de Seguridad Ciudadana",
          tipo: "direccion",
          sigla: "DSC",
          piso: "Planta Baja · Módulo Seguridad",
          contacto: "Emergencias: 911 / 4252020",
          tramites: "Planes integrales de seguridad ciudadana, monitoreo de cámaras y control del orden.",
          hijos: [
            { nombre: "Intendencia Municipal y Defensa al Consumidor", tipo: "departamento", piso: "Planta Baja", tramites: "Control de pesos, medidas, inocuidad alimentaria y ordenamiento de mercados." },
            { nombre: "Guardia Municipal de Cochabamba", tipo: "departamento", piso: "Planta Baja", tramites: "Patrullaje preventivo, despeje de aceras y apoyo operativo en eventos." },
          ],
        },
      ],
    },
    {
      nombre: "Secretaría de Finanzas y Administración",
      tipo: "secretaria",
      sigla: "SFA",
      piso: "Piso 9",
      horario: "08:00 - 16:00",
      contacto: "Interno: 901 / 4258040",
      tramites: "Administración financiera, presupuesto municipal, tesorería, contrataciones estatales y recursos humanos.",
      hijos: [
        {
          nombre: "Dirección de Finanzas y Contabilidad",
          tipo: "direccion",
          sigla: "DFC",
          piso: "Piso 9",
          contacto: "Interno: 910",
          tramites: "Gestión contable, balances financieros y programación de pagos a proveedores.",
          hijos: [
            { nombre: "Departamento de Presupuesto y Contabilidad", tipo: "departamento", piso: "Piso 9", tramites: "Formulación presupuestaria y estados financieros oficiales." },
            { nombre: "Departamento de Tesorería y Crédito Público", tipo: "departamento", piso: "Piso 9", tramites: "Flujo de fondos, pago a contratistas y gestión crediticia municipal." },
          ],
        },
        {
          nombre: "Dirección Administrativa y Bienes",
          tipo: "direccion",
          sigla: "DAB",
          piso: "Piso 9",
          contacto: "Interno: 920",
          tramites: "Procesos de contratación de obras, bienes y servicios (SICOES) y custodia patrimonial.",
          hijos: [
            { nombre: "Departamento de Contrataciones Estatales", tipo: "departamento", piso: "Piso 9", tramites: "Licitaciones públicas, contrataciones menores y convocatorias ANPE." },
            { nombre: "Departamento de Bienes Municipales y Activos Fijos", tipo: "departamento", piso: "Piso 9", tramites: "Inventario general, altas y bajas de activos e infraestructura comunal." },
          ],
        },
        {
          nombre: "Dirección de Recursos Humanos",
          tipo: "direccion",
          sigla: "DRH",
          piso: "Piso 9",
          contacto: "Interno: 930",
          tramites: "Administración del personal municipal, planillas, convocatorias de empleo y bienestar laboral.",
          hijos: [
            { nombre: "Departamento de Planillas y Selección", tipo: "departamento", piso: "Piso 9", tramites: "Planillas de sueldos, aportes de ley y reclutamiento de servidores públicos." },
            { nombre: "Departamento de Capacitación y Bienestar Laboral", tipo: "departamento", piso: "Piso 9", tramites: "Planes de inducción, capacitación funcionaria y salud ocupacional." },
          ],
        },
      ],
    },
    {
      nombre: "Secretaría de Desarrollo Urbano y Catastro",
      tipo: "secretaria",
      sigla: "SDUC",
      piso: "Piso 5",
      horario: "08:00 - 16:00",
      contacto: "Interno: 501 / 4258050",
      tramites: "Planificación territorial, catastro municipal, administración de uso de suelos y recaudaciones.",
      hijos: [
        {
          nombre: "Dirección de Administración Geográfica y Catastro",
          tipo: "direccion",
          sigla: "DAGC",
          piso: "Piso 5",
          contacto: "Interno: 510",
          tramites: "Certificados catastrales, planos de lote, actualización de datos técnicos de inmuebles.",
          hijos: [
            { nombre: "Departamento de Gestión Catastral", tipo: "departamento", piso: "Piso 5", tramites: "Emisión de avalúos catastrales y asignación de código catastral." },
            { nombre: "Departamento de Cartografía y GIS Municipal", tipo: "departamento", piso: "Piso 5", tramites: "Mapas temáticos, ortofotos territoriales y georreferenciación." },
          ],
        },
        {
          nombre: "Dirección de Urbanismo",
          tipo: "direccion",
          sigla: "DU",
          piso: "Piso 5",
          contacto: "Interno: 520",
          tramites: "Aprobación de planos de construcción, licencias urbanísticas y regulación de fraccionamientos.",
          hijos: [
            { nombre: "Departamento de Control de Edificaciones", tipo: "departamento", piso: "Piso 5", tramites: "Fiscalización de construcciones, permisos de obra y visado de planos." },
            { nombre: "Departamento de Administración Urbana", tipo: "departamento", piso: "Piso 5", tramites: "Aprobación de urbanizaciones, subdivisiones y rasantes de vía." },
          ],
        },
        {
          nombre: "Dirección de Recaudaciones y Dinamización Económica",
          tipo: "direccion",
          sigla: "DR",
          piso: "Piso 3 · Ventanilla Única",
          contacto: "Atención al Contribuyente: 4258060",
          tramites: "Cobro de impuestos a bienes inmuebles, vehículos, patentes de funcionamiento y planes de pago.",
          hijos: [
            { nombre: "Departamento de Atención al Contribuyente", tipo: "departamento", piso: "Piso 3", tramites: "Liquidación tributaria, prescripciones y emisión de proformas." },
            { nombre: "Departamento de Fiscalización Tributaria", tipo: "departamento", piso: "Piso 3", tramites: "Control fiscal, auditorías tributarias municipales y cobranza coactiva." },
          ],
        },
        {
          nombre: "Unidad Municipal Mi Casa Segura",
          tipo: "direccion",
          sigla: "MCS",
          piso: "Piso 4",
          contacto: "Línea Directa: 4258045",
          tramites: "Programa especial de regularización técnica y legal de bienes inmuebles y construcciones fuera de norma.",
        },
      ],
    },
    {
      nombre: "Secretaría de Desarrollo de Infraestructura Territorial",
      tipo: "secretaria",
      sigla: "SDIT",
      piso: "Piso 8",
      horario: "08:00 - 16:00",
      contacto: "Interno: 801 / 4258080",
      tramites: "Construcción y mantenimiento de obras públicas, infraestructura vial, puentes y movilidad urbana.",
      hijos: [
        {
          nombre: "Dirección de Obras Públicas",
          tipo: "direccion",
          sigla: "DOP",
          piso: "Piso 8",
          contacto: "Interno: 810",
          tramites: "Ejecución y supervisión técnica de obras municipales en los 14 distritos.",
          hijos: [
            {
              nombre: "Departamento de Infraestructura y Mejoramiento de Barrios",
              tipo: "departamento",
              piso: "Piso 8",
              tramites: "Parques, canchas deportivas, centros comunitarios y sedes vecinales.",
              hijos: [
                { nombre: "División de Construcción de Infraestructura", tipo: "division", piso: "Piso 8", tramites: "Supervisión de obras civiles de equipamiento urbano." },
                { nombre: "División de Mantenimiento de Edificaciones Públicas", tipo: "division", piso: "Piso 8", tramites: "Refacción y preservación de inmuebles municipales." },
              ],
            },
            {
              nombre: "Departamento de Obras Viales",
              tipo: "departamento",
              piso: "Piso 8",
              tramites: "Apertura de vías, empedrados, pavimentos y puentes vehiculares.",
              hijos: [
                { nombre: "División de Asfaltos y Bacheo", tipo: "division", piso: "Piso 8", tramites: "Planta de asfalto municipal y cuadrillas de bacheo distrital." },
                { nombre: "División de Señalización y Red Vial", tipo: "division", piso: "Piso 8", tramites: "Pintado de calzadas, reductores de velocidad y letreros viales." },
              ],
            },
          ],
        },
        {
          nombre: "Dirección de Movilidad Urbana",
          tipo: "direccion",
          sigla: "DMU",
          piso: "Piso 7",
          contacto: "Interno: 720",
          tramites: "Ordenamiento del transporte público, semaforización y ciclovías.",
          hijos: [
            { nombre: "Departamento de Semaforización y Tecnología Vial", tipo: "departamento", piso: "Piso 7", tramites: "Mantenimiento y sincronización de red semafórica." },
            { nombre: "Departamento de Tráfico y Vialidad", tipo: "departamento", piso: "Piso 7", tramites: "Rutas de transporte público, paradas autorizadas y permisos de circulación." },
          ],
        },
        {
          nombre: "Departamento de Gestión de Riesgos y Desastres (UGR)",
          tipo: "departamento",
          sigla: "UGR",
          piso: "Piso 8 · Base UGR",
          contacto: "Emergencias UGR: 4255322",
          tramites: "Atención inmediata a inundaciones, torrenteras, deslizamientos y contingencias climáticas.",
        },
      ],
    },
    {
      nombre: "Secretaría de Salud",
      tipo: "secretaria",
      sigla: "SS",
      piso: "Piso 6",
      horario: "08:00 - 16:00",
      contacto: "Interno: 601 / 4258066",
      tramites: "Rectoría del sistema municipal de salud, centros de primer nivel y hospitales de segundo nivel.",
      hijos: [
        {
          nombre: "Dirección de Hospitales de Segundo Nivel",
          tipo: "direccion",
          sigla: "DHSN",
          piso: "Piso 6",
          contacto: "Interno: 610",
          tramites: "Coordinación y provisión de equipamiento e insumos a hospitales municipales.",
          hijos: [
            { nombre: "Hospital del Norte", tipo: "departamento", piso: "Av. Circunvalación", tramites: "Atención médica especializada, internación, cirugía y farmacia municipal." },
            { nombre: "Hospital del Sur", tipo: "departamento", piso: "Zona Tamborada", tramites: "Emergencias 24h, maternidad, pediatría y banco de sangre." },
            { nombre: "Hospital Cochabamba", tipo: "departamento", piso: "Zona Central", tramites: "Medicina interna, traumatología y consulta ambulatoria." },
          ],
        },
        {
          nombre: "Dirección de Centros de Salud de Primer Nivel",
          tipo: "direccion",
          sigla: "DCSPN",
          piso: "Piso 6",
          contacto: "Interno: 620",
          tramites: "Gestión de la red de postas sanitarias y centros integrales en los distritos.",
          hijos: [
            { nombre: "Red de Centros de Salud Distritos 1 a 7", tipo: "departamento", piso: "Piso 6", tramites: "Atención médica preventiva, vacunas del PAI y control prenatal." },
            { nombre: "Red de Centros de Salud Distritos 8 a 14", tipo: "departamento", piso: "Piso 6", tramites: "Consultas de medicina general, odontología y enfermería distrital." },
          ],
        },
        {
          nombre: "Dirección de Promoción y Prevención de Salud",
          tipo: "direccion",
          sigla: "DPPS",
          piso: "Piso 6",
          contacto: "Interno: 630",
          tramites: "Campañas de vacunación comunitaria, nutrición infantil y prevención de epidemias.",
          hijos: [
            { nombre: "Departamento de Programas de Salud Comunitaria", tipo: "departamento", piso: "Piso 6", tramites: "Ferias de salud preventiva y brigadas médicas móviles." },
            { nombre: "Departamento de Vigilancia Epidemiológica", tipo: "departamento", piso: "Piso 6", tramites: "Monitoreo de brotes epidemiológicos y control de vectores (dengue, rabia)." },
          ],
        },
      ],
    },
    {
      nombre: "Secretaría de Medio Ambiente y Protección de la Madre Tierra",
      tipo: "secretaria",
      sigla: "SMAPMT",
      piso: "Piso 7",
      horario: "08:00 - 16:00",
      contacto: "Interno: 701 / 4258070",
      tramites: "Preservación ambiental, control de contaminación, áreas protegidas, saneamiento y zoonosis.",
      hijos: [
        {
          nombre: "Dirección de Medio Ambiente",
          tipo: "direccion",
          sigla: "DMA",
          piso: "Piso 7",
          contacto: "Interno: 710",
          tramites: "Licencias ambientales, monitoreo de ruidos molestos, calidad del aire y emisiones.",
          hijos: [
            { nombre: "Departamento de Calidad Ambiental", tipo: "departamento", piso: "Piso 7", tramites: "Medición de gases de escape vehicular y fuentes industriales fijas." },
            { nombre: "Departamento de Recursos Naturales y Áreas Protegidas", tipo: "departamento", piso: "Piso 7", tramites: "Protección del Parque Tunari, Serranía de San Pedro y Laguna Alalay." },
          ],
        },
        {
          nombre: "Dirección de Gestión de Residuos y Saneamiento",
          tipo: "direccion",
          sigla: "DGRS",
          piso: "Piso 7",
          contacto: "Interno: 715",
          tramites: "Políticas de reciclaje, disposición final de residuos y saneamiento básico rural.",
          hijos: [
            { nombre: "Departamento de Residuos Sólidos y Reciclaje", tipo: "departamento", piso: "Piso 7", tramites: "Puntos verdes distritales y educación ambiental para separación de basura." },
            { nombre: "Departamento de Saneamiento Básico Rural", tipo: "departamento", piso: "Piso 7", tramites: "Sistemas de agua potable comunitaria en zonas periurbanas." },
          ],
        },
        {
          nombre: "Dirección de Zoonosis y Bienestar Animal",
          tipo: "direccion",
          sigla: "DZBA",
          piso: "Sede La Chimba",
          contacto: "Zoonosis: 4253322",
          tramites: "Campañas de esterilización canina y felina, adopciones responsables y vacunación antirrábica.",
        },
      ],
    },
    {
      nombre: "Secretaría de Desarrollo Humano, Género y Generacional",
      tipo: "secretaria",
      sigla: "SDHGG",
      piso: "Piso 4",
      horario: "08:00 - 16:00",
      contacto: "Interno: 401 / 4258042",
      tramites: "Protección de grupos vulnerables, defensorías de la niñez, educación, deportes y equidad de género.",
      hijos: [
        {
          nombre: "Dirección de Género y Asuntos Generacionales",
          tipo: "direccion",
          sigla: "DGAG",
          piso: "Piso 4",
          contacto: "Línea Gratuita DNA: 156",
          tramites: "Atención psicológica, social y legal a menores, mujeres, adultos mayores y personas con discapacidad.",
          hijos: [
            { nombre: "Departamento de Niñez y Adolescencia (Defensorías DNA)", tipo: "departamento", piso: "Piso 4", tramites: "Permisos de viaje para menores y atención integral a víctimas de violencia." },
            { nombre: "Departamento del Adulto Mayor", tipo: "departamento", piso: "Piso 4", tramites: "Asistencia legal al adulto mayor, clubes distritales y actividades recreativas." },
            { nombre: "Departamento de Personas con Discapacidad (UMADIS)", tipo: "departamento", piso: "Piso 4", tramites: "Calificación de discapacidad y pago de bono municipal mensual." },
          ],
        },
        {
          nombre: "Dirección de Educación y Deporte",
          tipo: "direccion",
          sigla: "DED",
          piso: "Piso 4",
          contacto: "Interno: 420",
          tramites: "Desayuno escolar complementario, mantenimiento de escuelas y escuelas deportivas gratuitas.",
          hijos: [
            { nombre: "Departamento de Apoyo a Unidades Educativas", tipo: "departamento", piso: "Piso 4", tramites: "Distribución del alimento complementario escolar y mobiliario estudiantil." },
            { nombre: "Departamento de Fomento al Deporte", tipo: "departamento", piso: "Piso 4", tramites: "Gestión de coliseos, piscinas municipales y torneos estudiantiles distritales." },
          ],
        },
      ],
    },
    {
      nombre: "Secretaría de Desarrollo Productivo, Turismo y Cultura",
      tipo: "secretaria",
      sigla: "SDPTC",
      piso: "Piso 2",
      horario: "08:00 - 16:00",
      contacto: "Interno: 201 / 4258022",
      tramites: "Fomento económico, reactivación de microempresas, ferias productivas, promoción cultural y turística.",
      hijos: [
        {
          nombre: "Dirección de Cultura y Patrimonio Histórico",
          tipo: "direccion",
          sigla: "DCPH",
          piso: "Casona Santiváñez",
          contacto: "Cultura: 4255325",
          tramites: "Administración de teatros municipales, bibliotecas, casonas coloniales y museos de la ciudad.",
          hijos: [
            { nombre: "Departamento de Teatros y Museos Municipales", tipo: "departamento", piso: "Piso 2", tramites: "Préstamo y reserva de salas de teatro, exposiciones artísticas y conciertos." },
            { nombre: "Departamento de Patrimonio Histórico e Inmaterial", tipo: "departamento", piso: "Piso 2", tramites: "Catalogación patrimonial del Centro Histórico y festividades folclóricas." },
          ],
        },
        {
          nombre: "Dirección de Turismo",
          tipo: "direccion",
          sigla: "DTUR",
          piso: "Piso 2",
          contacto: "Turismo: 4258025",
          tramites: "Información turística en casetas, rutas gastronómicas, turismo de convenciones y ferias.",
          hijos: [
            { nombre: "Departamento de Promoción Turística y Rutas Patrimoniales", tipo: "departamento", piso: "Piso 2", tramites: "Guías turísticas oficiales, recorridos históricos y señalización turística." },
          ],
        },
        {
          nombre: "Dirección de Desarrollo Productivo y Emprendedurismo",
          tipo: "direccion",
          sigla: "DDPE",
          piso: "Piso 2",
          contacto: "Interno: 230",
          tramites: "Incubadora de empresas municipales, capacitación técnica a productores y ferias distritales.",
          hijos: [
            { nombre: "Departamento de Microempresas y Ferias Productivas", tipo: "departamento", piso: "Piso 2", tramites: "Organización de ferias francas, mercados sobre ruedas y ferias gastronómicas." },
          ],
        },
      ],
    },
    {
      nombre: "Empresas Descentralizadas Municipales",
      tipo: "descentralizada",
      sigla: "EMPRESAS",
      piso: "Sedes Descentralizadas",
      horario: "Atención Continua y Emergencias 24h",
      contacto: "Central de Servicios: 151",
      tramites: "Entidades públicas descentralizadas bajo tuición municipal encargadas de servicios básicos y mantenimiento integral.",
      hijos: [
        {
          nombre: "SEMAPA - Servicio Municipal de Agua Potable y Alcantarillado",
          tipo: "descentralizada",
          sigla: "SEMAPA",
          piso: "Sede Central: Parque Excombatientes",
          horario: "08:00 - 16:00 · Reclamos 24h",
          contacto: "Línea Gratuita: 800108822",
          tramites: "Instalación de nuevas conexiones de agua potable y alcantarillado sanitario, atención de fugas y facturación.",
        },
        {
          nombre: "EMSA - Empresa Municipal de Servicios de Aseo",
          tipo: "descentralizada",
          sigla: "EMSA",
          piso: "Sede Operativa: Av. Killman",
          horario: "Atención 24h",
          contacto: "Reclamos: 4253325 / 4253326",
          tramites: "Barrido urbano, recolección domiciliaria de residuos, recojo de escombros y poda programada.",
        },
        {
          nombre: "EMAC - Empresa Municipal de Áreas Verdes y Recreación",
          tipo: "descentralizada",
          sigla: "EMAC",
          piso: "Vivero Municipal: Av. Guayacán",
          horario: "07:30 - 15:30",
          contacto: "Vivero: 4258075",
          tramites: "Mantenimiento de áreas verdes, forestación de avenidas, donación de plantines y podas controladas.",
        },
        {
          nombre: "PROMAN - Programa Municipal de Mantenimiento Integral",
          tipo: "descentralizada",
          sigla: "PROMAN",
          piso: "Campamento Central: Av. Blanco Galindo",
          horario: "08:00 - 16:00",
          contacto: "Campamento: 4258088",
          tramites: "Mantenimiento preventivo y correctivo de puentes, pasos a desnivel, torrenteras y obras mayores.",
        },
      ],
    },
  ],
};

const TIPOS: Record<Tipo, { etiqueta: string; rol: string; fondo: string; trazo: string; textoColor: string }> = {
  despacho: {
    etiqueta: "Despacho Alcaldía",
    rol: "Máxima Autoridad Ejecutiva",
    fondo: "#0f172a",
    trazo: "#0f172a",
    textoColor: "#00a7d6",
  },
  secretaria: {
    etiqueta: "Secretaría Municipal",
    rol: "Nivel Ejecutivo y Rector",
    fondo: "#e6f6fb",
    trazo: "#00a7d6",
    textoColor: "#008bb3",
  },
  direccion: {
    etiqueta: "Dirección",
    rol: "Nivel Operativo y Gestión",
    fondo: "#ecfdf5",
    trazo: "#0da593",
    textoColor: "#059669",
  },
  departamento: {
    etiqueta: "Departamento",
    rol: "Área Técnica Especializada",
    fondo: "#faf5ff",
    trazo: "#462d81",
    textoColor: "#462d81",
  },
  division: {
    etiqueta: "División / Unidad",
    rol: "Unidad Operativa de Campo",
    fondo: "#f8fafc",
    trazo: "#64748b",
    textoColor: "#475569",
  },
  descentralizada: {
    etiqueta: "Empresa Descentralizada",
    rol: "Entidad Municipal Autárquica",
    fondo: "#fff7ed",
    trazo: "#ea580c",
    textoColor: "#c2410c",
  },
};

let idContador = 0;
const nodos: Nodo[] = [];
const porId = new Map<string, Nodo>();

function aplanar(unidad: Unidad, parentId: string | null = null, ancestros: string[] = []): Nodo {
  const id = \`u-\${++idContador}\`;
  const ruta = [...ancestros, unidad.nombre];
  const nodo: Nodo = {
    ...unidad,
    id,
    parentId,
    nombre: unidad.nombre,
    tipo: unidad.tipo,
    hijos: unidad.hijos ? unidad.hijos.length : 0,
    total: 0,
    ruta,
    _expanded: parentId === null || unidad.tipo === "secretaria",
    _highlighted: false,
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
  .svgHeight(lienzo.clientHeight || 620)
  .svgWidth(lienzo.clientWidth || 920)
  .data(nodos)
  .nodeWidth(() => 240)
  .nodeHeight(() => 110)
  .childrenMargin(() => 45)
  .siblingsMargin(() => 20)
  .neighbourMargin(() => 22)
  .compact(false)
  .duration(280)
  .nodeButtonWidth(() => 140)
  .nodeButtonHeight(() => 28)
  .nodeButtonX(() => -70)
  .nodeButtonY(() => -14)
  .buttonContent((d: { node: { data: Nodo; children?: unknown[]; _children?: unknown[] } }) => {
    const node = d.node;
    const hasChildren = (node.children && node.children.length > 0) || (node._children && node._children.length > 0);
    if (!hasChildren) return "";
    const isExpanded = Boolean(node.children && node.children.length > 0);
    const count = node.data.hijos || (node.children?.length) || (node._children?.length) || 0;
    return \`<div class="org-nodo__alternar-btn \${isExpanded ? "is-abierto" : ""}">
      <span class="org-nodo__alternar-simbolo">\${isExpanded ? "−" : "+"}</span>
      <span>\${isExpanded ? "Contraer" : \`\${count} dependencias\`}</span>
    </div>\`;
  })
  .onNodeClick((d: { data: Nodo }) => {
    elegir(d.data.id);
  })
  .nodeContent((d: { data: Nodo; width: number; height: number }) => {
    const nodo = d.data;
    const tipo = TIPOS[nodo.tipo];
    const tieneHijos = nodo.hijos > 0;
    const clases = [
      "org-nodo",
      nodo._highlighted ? "is-coincide" : "",
      nodo.id === seleccion ? "is-activo" : "",
    ].join(" ");

    return \`<div class="org-nodo-tarjeta" style="width:\${d.width}px;height:\${d.height}px">
      <div class="\${clases}" data-id="\${nodo.id}" role="button" tabindex="0">
        <div class="org-nodo__nivel-barra" style="background:\${tipo.trazo}">
          <span class="org-nodo__nivel-texto">\${tipo.etiqueta}</span>
          \${tieneHijos ? \`<span class="org-nodo__nivel-badge">\${nodo.hijos}</span>\` : ""}
        </div>
        <div class="org-nodo__cuerpo">
          <div class="org-nodo__cab-fila">
            <strong class="org-nodo__nombre">\${escapar(nodo.nombre)}</strong>
            \${nodo.sigla ? \`<span class="org-nodo__sigla">\${escapar(nodo.sigla)}</span>\` : ""}
          </div>
          <span class="org-nodo__subtitulo">\${tipo.rol}</span>
          \${nodo.piso ? \`<span class="org-nodo__piso-badge">\${escapar(nodo.piso)}</span>\` : ""}
        </div>
      </div>
    </div>\`;
  });

function dibujar(ajustar = false) {
  grafico.svgWidth(lienzo.clientWidth || 920).data(nodos).render();
  if (ajustar) grafico.fit();
}

function abrirAncestros(nodo: Nodo) {
  let padre = nodo.parentId ? porId.get(nodo.parentId) : undefined;
  while (padre) {
    grafico.setExpanded(padre.id, true);
    padre = padre.parentId ? porId.get(padre.parentId) : undefined;
  }
}

const descendientes = (nodo: Nodo): Nodo[] =>
  nodos.filter((otro) => otro.parentId === nodo.id).flatMap((hijo) => [hijo, ...descendientes(hijo)]);

function buscar(texto: string) {
  const q = normalizar(texto.trim());
  limpiar.hidden = q === "";

  if (q === "") {
    estado.textContent = "";
    nodos.forEach((n) => (n._highlighted = false));
    grafico.clearHighlighting().render();
  } else {
    const coincidencias = nodos.filter(
      (nodo) =>
        normalizar(nodo.nombre).includes(q) ||
        (nodo.sigla && normalizar(nodo.sigla).includes(q)) ||
        (nodo.tramites && normalizar(nodo.tramites).includes(q))
    );

    nodos.forEach((n) => (n._highlighted = false));
    coincidencias.forEach((nodo) => {
      nodo._highlighted = true;
      abrirAncestros(nodo);
    });

    estado.textContent =
      coincidencias.length === 0
        ? "No se encontraron dependencias con ese término."
        : \`\${coincidencias.length} dependencias localizadas en el organigrama.\`;

    if (coincidencias.length > 0) {
      grafico.setHighlighted(coincidentesId(coincidencias));
    }
  }

  dibujar(q !== "");
  generarVistaArbol();
}

function coincidentesId(lista: Nodo[]): string {
  return lista[0].id;
}

function elegir(id: string) {
  const nodo = porId.get(id);
  if (!nodo) return;
  seleccion = id;

  const tipo = TIPOS[nodo.tipo];
  detalle.hidden = false;

  const badge = $("org-tipo-badge");
  badge.textContent = tipo.etiqueta;
  badge.style.backgroundColor = tipo.fondo;
  badge.style.color = tipo.textoColor;
  badge.style.border = \`1px solid \${tipo.trazo}\`;

  const siglaBadge = $("org-sigla-badge");
  if (nodo.sigla) {
    siglaBadge.textContent = nodo.sigla;
    siglaBadge.hidden = false;
  } else {
    siglaBadge.hidden = true;
  }

  $("org-ruta").textContent = nodo.ruta.join("  ›  ");
  $("org-nombre").textContent = nodo.nombre;
  $("org-cuenta").textContent =
    nodo.hijos === 0
      ? "Unidad operativa de atención y ejecución directa."
      : \`\${nodo.hijos} \${nodo.hijos === 1 ? "dependencia directa" : "dependencias directas"} · \${nodo.total} en total bajo esta área.\`;

  $("org-ficha-piso").textContent = nodo.piso ?? "Edificio Central GAMC";
  $("org-ficha-horario").textContent = nodo.horario ?? "08:00 - 16:00 (Continuo)";
  $("org-ficha-contacto").textContent = nodo.contacto ?? "Línea Central GAMC: 151 / 4258030";
  $("org-ficha-tramites").textContent = nodo.tramites ?? "Atención de trámites institucionales del área, resoluciones y servicios al ciudadano.";

  detalle.querySelector<HTMLButtonElement>('[data-detalle="superior"]')!.disabled = nodo.parentId === null;
  detalle.querySelector<HTMLButtonElement>('[data-detalle="rama"]')!.disabled = nodo.hijos === 0;

  grafico.setHighlighted(id).render();
}

function generarVistaArbol() {
  arbolNiveles.innerHTML = "";
  const secretarias = nodos.filter((n) => n.parentId === raiz.id);

  const rootDiv = document.createElement("div");
  rootDiv.className = "org-gamc__arbol-item";
  rootDiv.style.borderColor = "var(--gamc-primario)";
  rootDiv.style.background = "var(--gamc-primario-suave)";
  rootDiv.innerHTML = \`<div><strong style="font-size:15px;color:var(--gamc-marino)">\${raiz.nombre}</strong><br><small style="color:var(--gamc-texto-suave)">Máxima Autoridad Ejecutiva Municipal · \${raiz.piso ?? ""}</small></div><span class="org-gamc__badge-nivel" style="background:#0f172a;color:#ffffff">\${TIPOS[raiz.tipo].etiqueta}</span>\`;
  rootDiv.addEventListener("click", () => elegir(raiz.id));
  arbolNiveles.appendChild(rootDiv);

  secretarias.forEach((sec) => {
    const grupo = document.createElement("div");
    grupo.className = "org-gamc__arbol-grupo";

    const cab = document.createElement("div");
    cab.className = "org-gamc__arbol-grupo-cabecera";
    cab.innerHTML = \`<div class="org-gamc__arbol-grupo-titulo">\${sec.nombre} \${sec.sigla ? \`<span style="font-size:11px;font-weight:700;color:var(--gamc-primario-hover)">(\${sec.sigla})</span>\` : ""}</div><span class="org-gamc__badge-nivel" style="background:\${TIPOS[sec.tipo].fondo};color:\${TIPOS[sec.tipo].textoColor};border:1px solid \${TIPOS[sec.tipo].trazo}">\${TIPOS[sec.tipo].etiqueta}</span>\`;
    cab.addEventListener("click", () => elegir(sec.id));
    grupo.appendChild(cab);

    const subHijos = nodos.filter((n) => n.parentId === sec.id);
    if (subHijos.length > 0) {
      const lista = document.createElement("div");
      lista.className = "org-gamc__arbol-hijos-lista";

      subHijos.forEach((sub) => {
        const item = document.createElement("div");
        item.className = "org-gamc__arbol-item";
        item.innerHTML = \`<div><strong style="font-size:13px;color:var(--gamc-marino)">\${sub.nombre}</strong><br><small style="color:var(--gamc-texto-suave)">\${sub.piso ?? ""}</small></div><span style="font-size:10px;font-weight:700;color:\${TIPOS[sub.tipo].textoColor}">\${TIPOS[sub.tipo].etiqueta}</span>\`;
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

$("org-detalle-cerrar")?.addEventListener("click", () => {
  detalle.hidden = true;
  seleccion = null;
  grafico.clearHighlighting().render();
});

document.querySelectorAll<HTMLButtonElement>("[data-filtro]").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll("[data-filtro]").forEach((c) => c.classList.remove("is-activo"));
    chip.classList.add("is-activo");
    const filtro = chip.dataset.filtro;
    if (filtro === "todos") {
      grafico.clearHighlighting();
      grafico.fit();
      return;
    }
    const coincidentes = nodos.filter((n) => n.tipo === filtro);
    coincidentes.forEach((n) => abrirAncestros(n));
    grafico.render();
    if (coincidentes.length > 0) {
      grafico.setHighlighted(coincidentes[0].id).render();
    }
  });
});

const ACCIONES: Record<string, () => void> = {
  acercar: () => grafico.zoomIn(),
  alejar: () => grafico.zoomOut(),
  ajustar: () => grafico.fit(),
  expandir: () => {
    grafico.expandAll().fit();
  },
  contraer: () => {
    seleccion = null;
    detalle.hidden = true;
    buscador.value = "";
    grafico.collapseAll().fit();
    buscar("");
  },
  "exportar-svg": () => {
    const fn = (grafico as unknown as { exportSvg?: () => void }).exportSvg;
    if (typeof fn === "function") fn.call(grafico);
  },
  "pantalla-completa": () => {
    if (!document.fullscreenElement) {
      contenedorDiagrama.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  },
};

document.querySelectorAll<HTMLElement>("[data-accion]").forEach((boton) =>
  boton.addEventListener("click", () => {
    const accion = boton.dataset.accion;
    if (accion && ACCIONES[accion]) ACCIONES[accion]();
  })
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
    grafico.setExpanded(nodo.id, true).render();
    [nodo, ...descendientes(nodo)].forEach((otro) => grafico.setExpanded(otro.id, true));
    dibujar(true);
  } else if (boton.dataset.detalle === "centrar") {
    abrirAncestros(nodo);
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

dibujar(true);
generarVistaArbol();
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
