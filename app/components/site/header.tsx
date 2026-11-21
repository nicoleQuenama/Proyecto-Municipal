"use client";

import React, { useState } from "react";

// --- Íconos SVG limpios y reutilizables ---

const MenuIcon = ({ size = 24, className = "" }: { size?: number; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="18" x2="20" y2="18" />
  </svg>
);

const CloseIcon = ({ size = 24, className = "" }: { size?: number; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SearchIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const MunicipalEmblem = ({ size = 42, className = "" }: { size?: number; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 200 200" fill="none" className={className}>
    <circle cx="100" cy="100" r="92" className="fill-blue-600/20 stroke-blue-500" strokeWidth="6" />
    <path d="M100 35 L145 60 V105 C145 135 125 160 100 170 C75 160 55 135 55 105 V60 Z" className="fill-blue-600 stroke-blue-400" strokeWidth="4" />
    <path d="M100 70 L110 92 L133 93 L114 107 L121 129 L100 115 L79 129 L86 107 L67 93 L90 92 Z" fill="#ffffff" />
  </svg>
);

// --- Definición de enlaces por defecto (fácil de editar y ampliar) ---

export interface NavItem {
  label: string;
  href: string;
}

export const DEFAULT_NAV_ITEMS: NavItem[] = [
  { label: "Inicio", href: "/" },
  { label: "Trámites", href: "#tramites" },
  { label: "Transparencia", href: "#transparencia" },
  { label: "Proyectos", href: "#proyectos" },
  { label: "Servicios", href: "#servicios" },
  { label: "Contacto", href: "#contacto" },
];

export interface HeaderProps {
  brandName?: string;
  brandSubtitle?: string;
  logoUrl?: string;
  navItems?: NavItem[];
  showSearch?: boolean;
  ctaText?: string;
  ctaHref?: string;
}

/**
 * Header institucional moderno, sencillo y completamente responsivo:
 * - Escritorio: Barra completa con logo, navegación horizontal, búsqueda y botón de acción.
 * - Tablet y Móvil: Menú hamburguesa (☰) que despliega suavemente los enlaces sin desbordes.
 * - Sin medidas fijas ni tarjetas: usa layout flexbox fluido de Tailwind.
 */
export default function Header({
  brandName = "Gobierno Autónomo Municipal",
  brandSubtitle = "Portal de Atención Ciudadana",
  logoUrl,
  navItems = DEFAULT_NAV_ITEMS,
  showSearch = true,
  ctaText = "Ventanilla Digital",
  ctaHref = "#ventanilla",
}: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-slate-900/95 text-white backdrop-blur-md border-b border-slate-800 shadow-sm transition-all">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-18 items-center justify-between gap-4">
          
          {/* Logo y Nombre Institucional */}
          <a href="/" className="flex items-center gap-3 group focus:outline-hidden">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={brandName}
                className="h-11 w-11 rounded-full object-cover border border-slate-700 shadow-xs"
              />
            ) : (
              <MunicipalEmblem size={44} className="shrink-0" />
            )}
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-bold tracking-tight text-white group-hover:text-blue-400 transition-colors">
                {brandName}
              </span>
              <span className="text-xs text-slate-400 font-normal hidden sm:block">
                {brandSubtitle}
              </span>
            </div>
          </a>

          {/* Enlaces de Navegación en Escritorio (lg+) */}
          <nav className="hidden lg:flex items-center gap-7" aria-label="Navegación principal">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors duration-200"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Acciones Rápidas (Buscador, CTA y Botón Móvil) */}
          <div className="flex items-center gap-3">
            {showSearch && (
              <button
                type="button"
                aria-label="Buscar en el portal"
                className="flex items-center gap-2 rounded-lg bg-slate-800/80 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              >
                <SearchIcon size={16} className="text-slate-400" />
                <span className="hidden sm:inline">Buscar...</span>
              </button>
            )}

            {ctaText && (
              <a
                href={ctaHref}
                className="hidden sm:inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-500 active:scale-95 transition-all cursor-pointer"
              >
                {ctaText}
              </a>
            )}

            {/* Botón Menú Hamburguesa en Tablet y Móvil */}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              aria-expanded={isOpen}
              aria-label={isOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
              className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-hidden transition-colors cursor-pointer"
            >
              {isOpen ? <CloseIcon size={24} /> : <MenuIcon size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Menú Desplegable en Móvil y Tablet */}
      {isOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-900/98 px-4 sm:px-6 py-5 shadow-2xl backdrop-blur-lg animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-3" aria-label="Navegación móvil">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="rounded-lg px-3 py-2 text-base font-medium text-slate-200 hover:bg-slate-800 hover:text-blue-400 transition-colors"
              >
                {item.label}
              </a>
            ))}

            {/* Botón CTA dentro del menú móvil */}
            {ctaText && (
              <div className="pt-3 border-t border-slate-800">
                <a
                  href={ctaHref}
                  onClick={() => setIsOpen(false)}
                  className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
                >
                  {ctaText}
                </a>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
