"use client";

import React from "react";

// --- Íconos de Redes Sociales y Utilidades ---

export const GitHubIcon = ({ size = 22, className = "" }: { size?: number; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.087-.731.084-.716.084-.716 1.205.082 1.838 1.215 1.838 1.215 1.07 1.835 2.809 1.305 3.492.998.108-.776.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.046.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

export const TwitterIcon = ({ size = 22, className = "" }: { size?: number; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.594 0-6.492 2.901-6.492 6.492 0 .512.057 1.01.173 1.496-5.405-.271-10.187-2.86-13.387-6.795-.56.96-.883 2.077-.883 3.256 0 2.254 1.147 4.243 2.887 5.419-.847-.025-1.649-.26-2.35-.647-.029.749.208 1.45.746 2.005.679.679 1.574 1.186 2.603 1.307-.207.056-.424.086-.647.086-.159 0-.315-.015-.467-.045.767 2.405 2.989 4.168 5.636 4.217-2.868 2.247-6.49 3.586-10.462 3.586-.681 0-1.35-.039-2.006-.118 3.692 2.378 8.016 3.766 12.692 3.766 15.232 0 23.52-12.69 23.52-23.52 0-.357-.012-.71-.031-1.063z" />
  </svg>
);

export const LinkedInIcon = ({ size = 22, className = "" }: { size?: number; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
);

export const FacebookIcon = ({ size = 22, className = "" }: { size?: number; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
  </svg>
);

const LogoFlower = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 200 200"
    width="40"
    height="40"
    className="shrink-0"
  >
    <circle cx="100" cy="100" r="90" fill="#0284c7" fillOpacity="0.2" />
    <path
      fill="#0284c7"
      d="M100 20 C120 60 160 80 180 100 C160 120 120 140 100 180 C80 140 40 120 20 100 C40 80 80 60 100 20 Z"
    />
    <circle cx="100" cy="100" r="28" fill="#38bdf8" />
  </svg>
);

// --- Configuración modular de columnas y enlaces (agrega lo que quieras fácilmente) ---

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

export interface ContactInfo {
  address?: string;
  email?: string;
  phone?: string;
  hours?: string;
}

const DEFAULT_COLUMNS: FooterColumn[] = [
  {
    title: "Trámites y Servicios",
    links: [
      { label: "Ventanilla Única Digital", href: "#" },
      { label: "Catastro y Territorio", href: "#" },
      { label: "Licencias de Actividades", href: "#" },
      { label: "Pagos de Impuestos en Línea", href: "#" },
      { label: "Seguimiento de Trámites", href: "#" },
    ],
  },
  {
    title: "Transparencia y Normas",
    links: [
      { label: "Rendición Pública de Cuentas", href: "#" },
      { label: "Gaceta y Decretos Ediles", href: "#" },
      { label: "Licitaciones y Convocatorias", href: "#" },
      { label: "Presupuesto Participativo", href: "#" },
      { label: "Marco Normativo Municipal", href: "#" },
    ],
  },
];

const DEFAULT_CONTACT: ContactInfo = {
  address: "Plaza 14 de Septiembre, Edificio GAMC",
  email: "contacto@gamc.gob.bo",
  phone: "800-14-0200 (Línea Gratuita)",
  hours: "Lunes a Viernes: 08:00 - 16:00",
};

export interface FooterProps {
  brandName?: string;
  brandDescription?: string;
  columns?: FooterColumn[];
  contact?: ContactInfo;
  year?: number;
}

/**
 * Footer institucional elegante, modular y 100% responsivo:
 * - Sin tarjetas fijas ni medidas calculadas en píxeles.
 * - Grid responsivo: 1 columna en móvil, 2 en tablet, 4 en desktop.
 * - Fácil de extender: solo agrega elementos al arreglo de columnas o enlaces.
 * - Queda siempre en su lugar sin sobreponerse al cuerpo de la página.
 */
export default function Footer({
  brandName = "Gobierno Autónomo Municipal",
  brandDescription = "Comprometidos con el desarrollo sostenible, la transparencia institucional y la atención cercana y moderna para cada ciudadano.",
  columns = DEFAULT_COLUMNS,
  contact = DEFAULT_CONTACT,
  year = new Date().getFullYear(),
}: FooterProps) {
  return (
    <footer className="w-full mt-auto bg-gradient-to-b from-slate-900 to-black text-slate-200 py-8 sm:py-10 lg:py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-800 font-sans">
      <div className="container mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10">
        
        {/* Columna 1: Marca, Descripción y Redes Sociales */}
        <div className="space-y-3 sm:space-y-4 col-span-1 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center space-x-3">
            <LogoFlower />
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight leading-tight">
                {brandName}
              </h3>
              <span className="text-[11px] text-slate-400 font-normal">Portal Institucional Oficial</span>
            </div>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-sm">
            {brandDescription}
          </p>
          <div className="flex items-center space-x-3 pt-1">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="text-slate-400 hover:text-blue-400 transition-transform transform hover:scale-110"
            >
              <FacebookIcon size={20} />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter / X"
              className="text-slate-400 hover:text-blue-400 transition-transform transform hover:scale-110"
            >
              <TwitterIcon size={20} />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="text-slate-400 hover:text-blue-400 transition-transform transform hover:scale-110"
            >
              <LinkedInIcon size={20} />
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="text-slate-400 hover:text-blue-400 transition-transform transform hover:scale-110"
            >
              <GitHubIcon size={20} />
            </a>
          </div>
        </div>

        {/* Columnas Dinámicas de Enlaces (Columnas 2 y 3 organizadas en 2 columnas en móvil) */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6 col-span-1 sm:col-span-2 lg:col-span-2">
          {columns.map((column) => (
            <div key={column.title} className="space-y-2.5 sm:space-y-3">
              <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                {column.title}
              </h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-slate-400 hover:text-blue-400 transition-colors duration-150 flex items-center gap-1.5"
                    >
                      <span className="text-slate-600 text-[10px]">•</span>
                      <span>{link.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Columna 4: Información de Contacto y Atención */}
        <div className="space-y-2.5 sm:space-y-3 col-span-1 sm:col-span-2 lg:col-span-1 border-t sm:border-t-0 border-slate-800/80 pt-4 sm:pt-0">
          <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
            Atención y Contacto
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 text-xs sm:text-sm text-slate-400">
            {contact.address && (
              <p className="flex items-start gap-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 shrink-0 mt-0.5" aria-hidden="true">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>{contact.address}</span>
              </p>
            )}
            {contact.hours && (
              <p className="flex items-start gap-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 shrink-0 mt-0.5" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>{contact.hours}</span>
              </p>
            )}
            {contact.phone && (
              <p className="flex items-start gap-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 shrink-0 mt-0.5" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <span className="font-semibold text-slate-200">{contact.phone}</span>
              </p>
            )}
            {contact.email && (
              <p className="flex items-start gap-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 shrink-0 mt-0.5" aria-hidden="true">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <a href={`mailto:${contact.email}`} className="text-blue-400 hover:underline">
                  {contact.email}
                </a>
              </p>
            )}
          </div>
        </div>

      </div>

      {/* Barra Inferior: Derechos Reservados y Créditos */}
      <div className="container mx-auto text-center text-slate-500 text-[11px] sm:text-xs pt-4 sm:pt-6 mt-6 sm:mt-8 border-t border-slate-800/80">
        <p>
          &copy; {year} {brandName}. Todos los derechos reservados.
        </p>
        <p className="mt-1 text-slate-600">
          Diseñado con <span className="text-red-500">&hearts;</span> para la atención y transparencia ciudadana
        </p>
      </div>
    </footer>
  );
}
