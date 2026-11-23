import { SECTION_KEY, type CanvasElement, type ComponentDef, type BlockInstance } from "./types";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function isNavComponent(def: ComponentDef): boolean {
  const name = (def.name || "").toLowerCase();
  const id = (def.id || "").toLowerCase();
  return (
    (def.category === "navigation" || id.includes("header") || id.includes("nav") || name.includes("cabecera") || name.includes("navegaci")) &&
    !id.includes("footer") &&
    !name.includes("pie")
  );
}

function isFooterComponent(def: ComponentDef): boolean {
  const name = (def.name || "").toLowerCase();
  const id = (def.id || "").toLowerCase();
  return (
    id.includes("footer") ||
    name.includes("pie") ||
    (def.category === "navigation" && (id.includes("pie") || name.includes("footer")))
  );
}

/**
 * Convierte un componente (o bloque) en código HTML semántico, limpio y responsivo con clases de Tailwind CSS.
 * Esto asegura que al hacer clic en "Código", el usuario siempre pueda ver y editar el código real del componente.
 */
export function componentToHtml(def: ComponentDef, block?: BlockInstance): string {
  if (isNavComponent(def)) {
    return generateHeaderHtml(def, block);
  }
  if (isFooterComponent(def)) {
    return generateFooterHtml(def, block);
  }
  return generateGenericComponentHtml(def, block);
}

function generateHeaderHtml(def: ComponentDef, block?: BlockInstance): string {
  const logo = def.elements.find(
    (e) => (e.kind === "ellipse" || e.kind === "image" || e.role === "image") && (e.src || e.x < 150),
  );
  const links = def.elements.filter(
    (e) => e.role === "link" || (e.kind === "text" && !e.parentId && e.y >= 10 && e.x > 150 && e.x < 800),
  );
  const searchBtn = def.elements.find(
    (e) => e.role === "button" || e.control?.name === "search-trigger" || e.text?.toLowerCase().includes("buscar"),
  );
  const logoSrc = logo?.src || "/logo-municipal.png";
  const logoAlt = logo?.alt || "Escudo Municipal";

  const navLinksHtml = links.length > 0
    ? links
        .map(
          (l) =>
            `      <a href="#${escapeHtml(l.text.toLowerCase().replace(/\s+/g, "-"))}" class="text-sm font-medium text-slate-300 hover:text-white transition-colors duration-200">${escapeHtml(l.text)}</a>`,
        )
        .join("\n")
    : `      <a href="/" class="text-sm font-medium text-slate-300 hover:text-white transition-colors duration-200">Inicio</a>
      <a href="#tramites" class="text-sm font-medium text-slate-300 hover:text-white transition-colors duration-200">Trámites</a>
      <a href="#transparencia" class="text-sm font-medium text-slate-300 hover:text-white transition-colors duration-200">Transparencia</a>
      <a href="#proyectos" class="text-sm font-medium text-slate-300 hover:text-white transition-colors duration-200">Proyectos</a>
      <a href="#servicios" class="text-sm font-medium text-slate-300 hover:text-white transition-colors duration-200">Servicios</a>
      <a href="#contacto" class="text-sm font-medium text-slate-300 hover:text-white transition-colors duration-200">Contacto</a>`;

  const mobileLinksHtml = links.length > 0
    ? links
        .map(
          (l) =>
            `      <a href="#${escapeHtml(l.text.toLowerCase().replace(/\s+/g, "-"))}" class="block py-2 px-3 rounded-lg text-base font-medium text-slate-200 hover:bg-slate-800 hover:text-blue-400 transition-colors">${escapeHtml(l.text)}</a>`,
        )
        .join("\n")
    : `      <a href="/" class="block py-2 px-3 rounded-lg text-base font-medium text-slate-200 hover:bg-slate-800 hover:text-blue-400 transition-colors">Inicio</a>
      <a href="#tramites" class="block py-2 px-3 rounded-lg text-base font-medium text-slate-200 hover:bg-slate-800 hover:text-blue-400 transition-colors">Trámites</a>
      <a href="#transparencia" class="block py-2 px-3 rounded-lg text-base font-medium text-slate-200 hover:bg-slate-800 hover:text-blue-400 transition-colors">Transparencia</a>
      <a href="#proyectos" class="block py-2 px-3 rounded-lg text-base font-medium text-slate-200 hover:bg-slate-800 hover:text-blue-400 transition-colors">Proyectos</a>
      <a href="#servicios" class="block py-2 px-3 rounded-lg text-base font-medium text-slate-200 hover:bg-slate-800 hover:text-blue-400 transition-colors">Servicios</a>
      <a href="#contacto" class="block py-2 px-3 rounded-lg text-base font-medium text-slate-200 hover:bg-slate-800 hover:text-blue-400 transition-colors">Contacto</a>`;

  return `<!-- Cabecera Institucional Moderna y Responsiva (Sin medidas de tarjetas fijas) -->
<header class="sticky top-0 z-50 w-full bg-slate-900/95 text-white backdrop-blur-md border-b border-slate-800 shadow-sm transition-all">
  <div class="container mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex h-18 items-center justify-between gap-4">
      
      <!-- Logotipo y Nombre -->
      <a href="/" class="flex items-center gap-3 group focus:outline-hidden">
        <img src="${escapeHtml(logoSrc)}" alt="${escapeHtml(logoAlt)}" class="h-11 w-11 rounded-full object-cover border border-slate-700 shadow-xs" onerror="this.style.display='none'" />
        <div class="flex flex-col">
          <span class="text-base sm:text-lg font-bold tracking-tight text-white group-hover:text-blue-400 transition-colors">Gobierno Autónomo Municipal</span>
          <span class="text-xs text-slate-400 font-normal hidden sm:block">Portal de Atención Ciudadana</span>
        </div>
      </a>

      <!-- Navegación en Pantallas Grandes (Escritorio) -->
      <nav class="hidden lg:flex items-center gap-7" aria-label="Navegación principal">
${navLinksHtml}
      </nav>

      <!-- Acciones: Buscador, Botón Principal y Menú Móvil -->
      <div class="flex items-center gap-3">
        <!-- Buscador -->
        <button type="button" class="flex items-center gap-2 rounded-lg bg-slate-800/80 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 transition-colors cursor-pointer">
          <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span class="hidden sm:inline">${escapeHtml(searchBtn?.text || "Buscar...")}</span>
        </button>

        <!-- Botón de Atención / Trámite -->
        <a href="#ventanilla" class="hidden sm:inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-500 active:scale-95 transition-all">
          Ventanilla Digital
        </a>

        <!-- Botón Menú Hamburguesa (visible en tablet y móvil) -->
        <button
          type="button"
          onclick="const m = document.getElementById('mobile-nav-panel'); m.classList.toggle('hidden');"
          class="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-hidden transition-colors cursor-pointer"
          aria-label="Alternar menú de navegación"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </div>
  </div>

  <!-- Panel Móvil Desplegable -->
  <div id="mobile-nav-panel" class="hidden lg:hidden border-t border-slate-800 bg-slate-900/98 px-4 sm:px-6 py-5 shadow-2xl backdrop-blur-lg">
    <nav class="flex flex-col space-y-3" aria-label="Navegación móvil">
${mobileLinksHtml}
      <div class="pt-3 border-t border-slate-800">
        <a href="#ventanilla" class="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-blue-500 transition-colors">
          Ventanilla Digital
        </a>
      </div>
    </nav>
  </div>
</header>`;
}

function generateFooterHtml(def: ComponentDef, block?: BlockInstance): string {
  return `<!-- Pie de Página Institucional - Moderno, 100% Responsivo y Compacto en Móvil -->
<footer class="w-full mt-auto bg-gradient-to-b from-slate-900 to-black text-slate-200 py-8 sm:py-10 lg:py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-800 font-sans">
  <div class="container mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10">
    
    <!-- Columna 1: Marca, Descripción y Redes Sociales -->
    <div class="space-y-3 sm:space-y-4 col-span-1 sm:col-span-2 lg:col-span-1">
      <div class="flex items-center space-x-3">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 200 200" width="36" height="36" class="shrink-0">
          <circle cx="100" cy="100" r="90" fill="#0284c7" fill-opacity="0.2" />
          <path fill="#0284c7" d="M100 20 C120 60 160 80 180 100 C160 120 120 140 100 180 C80 140 40 120 20 100 C40 80 80 60 100 20 Z" />
          <circle cx="100" cy="100" r="28" fill="#38bdf8" />
        </svg>
        <div>
          <h3 class="text-lg sm:text-xl font-extrabold text-white tracking-tight leading-tight">
            Gobierno Municipal
          </h3>
          <span class="text-[11px] text-slate-400 font-normal">Portal Institucional Oficial</span>
        </div>
      </div>
      <p class="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-sm">
        Portal oficial de trámites, servicios y participación ciudadana. Comprometidos con el desarrollo sostenible y la transparencia.
      </p>
      <!-- Íconos Sociales -->
      <div class="flex items-center space-x-3 pt-1">
        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" class="text-slate-400 hover:text-blue-400 transition-transform transform hover:scale-110">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/></svg>
        </a>
        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter / X" class="text-slate-400 hover:text-blue-400 transition-transform transform hover:scale-110">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.594 0-6.492 2.901-6.492 6.492 0 .512.057 1.01.173 1.496-5.405-.271-10.187-2.86-13.387-6.795-.56.96-.883 2.077-.883 3.256 0 2.254 1.147 4.243 2.887 5.419-.847-.025-1.649-.26-2.35-.647-.029.749.208 1.45.746 2.005.679.679 1.574 1.186 2.603 1.307-.207.056-.424.086-.647.086-.159 0-.315-.015-.467-.045.767 2.405 2.989 4.168 5.636 4.217-2.868 2.247-6.49 3.586-10.462 3.586-.681 0-1.35-.039-2.006-.118 3.692 2.378 8.016 3.766 12.692 3.766 15.232 0 23.52-12.69 23.52-23.52 0-.357-.012-.71-.031-1.063z"/></svg>
        </a>
        <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" class="text-slate-400 hover:text-blue-400 transition-transform transform hover:scale-110">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
        </a>
        <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub" class="text-slate-400 hover:text-blue-400 transition-transform transform hover:scale-110">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.087-.731.084-.716.084-.716 1.205.082 1.838 1.215 1.838 1.215 1.07 1.835 2.809 1.305 3.492.998.108-.776.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.046.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
        </a>
      </div>
    </div>

    <!-- Columnas Dinámicas de Enlaces (Columnas 2 y 3 en 2 columnas en móvil) -->
    <div class="grid grid-cols-2 gap-4 sm:gap-6 col-span-1 sm:col-span-2 lg:col-span-2">
      <div class="space-y-2.5 sm:space-y-3">
        <h4 class="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">Trámites y Servicios</h4>
        <ul class="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
          <li><a href="#" class="text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-1.5"><span class="text-slate-600 text-[10px]">•</span> Ventanilla Única Digital</a></li>
          <li><a href="#" class="text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-1.5"><span class="text-slate-600 text-[10px]">•</span> Catastro y Territorio</a></li>
          <li><a href="#" class="text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-1.5"><span class="text-slate-600 text-[10px]">•</span> Licencias de Actividades</a></li>
          <li><a href="#" class="text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-1.5"><span class="text-slate-600 text-[10px]">•</span> Pagos de Impuestos en Línea</a></li>
          <li><a href="#" class="text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-1.5"><span class="text-slate-600 text-[10px]">•</span> Seguimiento de Trámites</a></li>
        </ul>
      </div>

      <div class="space-y-2.5 sm:space-y-3">
        <h4 class="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">Transparencia y Normas</h4>
        <ul class="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
          <li><a href="#" class="text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-1.5"><span class="text-slate-600 text-[10px]">•</span> Rendición de Cuentas</a></li>
          <li><a href="#" class="text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-1.5"><span class="text-slate-600 text-[10px]">•</span> Gaceta y Decretos</a></li>
          <li><a href="#" class="text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-1.5"><span class="text-slate-600 text-[10px]">•</span> Licitaciones Públicas</a></li>
          <li><a href="#" class="text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-1.5"><span class="text-slate-600 text-[10px]">•</span> Presupuesto GAMC</a></li>
          <li><a href="#" class="text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-1.5"><span class="text-slate-600 text-[10px]">•</span> Marco Normativo</a></li>
        </ul>
      </div>
    </div>

    <!-- Columna 4: Atención y Contacto -->
    <div class="space-y-2.5 sm:space-y-3 col-span-1 sm:col-span-2 lg:col-span-1 border-t sm:border-t-0 border-slate-800/80 pt-4 sm:pt-0">
      <h4 class="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">Atención y Contacto</h4>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 text-xs sm:text-sm text-slate-400">
        <p class="flex items-start gap-2">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-500 shrink-0 mt-0.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          <span>Plaza 14 de Septiembre, GAMC</span>
        </p>
        <p class="flex items-start gap-2">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-500 shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          <span>Lun a Vie: 08:00 - 16:00</span>
        </p>
        <p class="flex items-start gap-2">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-500 shrink-0 mt-0.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
          <span class="font-semibold text-slate-200">800-14-0200 (Gratuito)</span>
        </p>
        <p class="flex items-start gap-2">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-500 shrink-0 mt-0.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
          <a href="mailto:contacto@gamc.gob.bo" class="text-blue-400 hover:underline">contacto@gamc.gob.bo</a>
        </p>
      </div>
    </div>

  </div>

  <!-- Barra Inferior -->
  <div class="container mx-auto text-center text-slate-500 text-[11px] sm:text-xs pt-4 sm:pt-6 mt-6 sm:mt-8 border-t border-slate-800/80">
    <p>&copy; 2026 Gobierno Autónomo Municipal. Todos los derechos reservados.</p>
    <p class="mt-1 text-slate-600">
      Diseñado con <span class="text-red-500">&hearts;</span> para la atención y transparencia ciudadana
    </p>
  </div>
</footer>`;
}

function generateGenericComponentHtml(def: ComponentDef, block?: BlockInstance): string {
  const sectionClasses = def.styles?.[SECTION_KEY]?.classes || "w-full max-w-7xl mx-auto px-6 py-8 flex flex-col gap-4";
  const elements = def.elements.filter((e) => !e.hidden);

  const elementsHtml = elements
    .map((el) => {
      const text = escapeHtml(el.text || "");
      if (el.role === "heading" || el.fontSize >= 22) {
        return `    <h2 class="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">${text}</h2>`;
      }
      if (el.role === "link") {
        return `    <a href="#" class="text-accent hover:underline font-medium">${text}</a>`;
      }
      if (el.role === "button" || el.kind === "rect" && text) {
        return `    <button type="button" class="px-4 py-2 rounded-lg bg-accent text-white font-semibold shadow-xs hover:bg-accent/90 transition-colors">${text}</button>`;
      }
      if (el.kind === "image" || el.kind === "ellipse" && el.src) {
        return `    <img src="${escapeHtml(el.src)}" alt="${escapeHtml(el.alt || "Imagen")}" class="rounded-lg max-w-full h-auto object-cover" />`;
      }
      if (el.kind === "text") {
        return `    <p class="text-base text-slate-700 leading-relaxed">${text}</p>`;
      }
      return `    <div class="w-full p-4 rounded-lg bg-slate-50 border border-slate-200">${text}</div>`;
    })
    .join("\n");

  return `<section class="${escapeHtml(sectionClasses)}">
${elementsHtml}
</section>`;
}
