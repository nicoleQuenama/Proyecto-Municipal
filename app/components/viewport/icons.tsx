import type { ReactNode } from "react";

export function Icon({ children, size = 16 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

export const CursorIcon = () => (
  <Icon><path d="M4 3l16 7-7 2-2 7z" /></Icon>
);
export const HandIcon = () => (
  <Icon>
    <path d="M8 13V5a1.5 1.5 0 013 0v6M11 11V4a1.5 1.5 0 013 0v7M14 11V6a1.5 1.5 0 013 0v8a7 7 0 01-7 7h-1a6 6 0 01-5-3l-2-4a1.5 1.5 0 012.5-1.5L8 15" />
  </Icon>
);
export const FrameIcon = () => (
  <Icon><rect x="4" y="4" width="16" height="16" rx="1" /></Icon>
);
export const TextIcon = () => (
  <Icon><path d="M5 5h14M12 5v14" /></Icon>
);
export const ShapesIcon = () => (
  <Icon>
    <circle cx="8" cy="8" r="4" />
    <rect x="11" y="11" width="9" height="9" rx="1" />
  </Icon>
);
export const ImageIcon = () => (
  <Icon>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="9" cy="10" r="1.5" />
    <path d="M21 16l-5-5-9 9" />
  </Icon>
);
export const CommentIcon = () => (
  <Icon><path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z" /></Icon>
);
export const ChevronIcon = ({ size = 12 }: { size?: number }) => (
  <Icon size={size}><path d="M6 9l6 6 6-6" /></Icon>
);
export const MinusIcon = () => (<Icon><path d="M5 12h14" /></Icon>);
export const PlusIcon = () => (<Icon><path d="M12 5v14M5 12h14" /></Icon>);
export const RectangleIcon = () => (
  <Icon><rect x="4" y="6" width="16" height="12" rx="1" /></Icon>
);
export const EllipseIcon = () => (
  <Icon><circle cx="12" cy="12" r="8" /></Icon>
);
export const LineIcon = () => (<Icon><path d="M5 19L19 5" /></Icon>);
export const TriangleIcon = () => (
  <Icon><path d="M12 4l9 16H3z" /></Icon>
);
export const UploadIcon = () => (
  <Icon><path d="M12 16V4M7 9l5-5 5 5M4 20h16" /></Icon>
);
export const DesktopIcon = () => (
  <Icon>
    <rect x="2" y="3" width="20" height="13" rx="2" />
    <path d="M8 21h8M12 16v5" />
  </Icon>
);
export const TabletIcon = () => (
  <Icon>
    <rect x="5" y="2" width="14" height="20" rx="2" />
    <path d="M11 18h2" />
  </Icon>
);
export const MobileIcon = () => (
  <Icon>
    <rect x="7" y="2" width="10" height="20" rx="2" />
    <path d="M11 18h2" />
  </Icon>
);
export const SearchIcon = () => (
  <Icon>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </Icon>
);
export const LinkIcon = () => (
  <Icon>
    <path d="M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1" />
    <path d="M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1" />
  </Icon>
);
export const VideoIcon = () => (
  <Icon>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M10 9l5 3-5 3z" />
  </Icon>
);
export const EyeIcon = () => (
  <Icon>
    <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
);
export const EyeOffIcon = () => (
  <Icon>
    <path d="M3 3l18 18" />
    <path d="M10.6 6.1A9.7 9.7 0 0112 5c6 0 10 7 10 7a17 17 0 01-3.2 3.9M6.6 6.6A17 17 0 002 12s4 7 10 7a9.6 9.6 0 004.4-1.1" />
    <path d="M9.9 9.9a3 3 0 004.2 4.2" />
  </Icon>
);
export const PagesIcon = () => (
  <Icon size={18}>
    <rect x="5" y="3" width="14" height="14" rx="2" />
    <path d="M9 21h10a2 2 0 002-2V8" />
  </Icon>
);
export const ComponentsIcon = () => (
  <Icon size={18}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </Icon>
);
export const RouteIcon = () => (
  <Icon size={18}>
    <circle cx="6" cy="19" r="2.5" />
    <circle cx="18" cy="5" r="2.5" />
    <path d="M8.5 19H15a3 3 0 000-6H9a3 3 0 010-6h6.5" />
  </Icon>
);
export const PaletteIcon = () => (
  <Icon size={18}>
    <path d="M12 3a9 9 0 100 18 2 2 0 002-2c0-1-.8-1.6-.8-2.5S14 14 15 14h2a4 4 0 004-4c0-3.9-4-7-9-7z" />
    <circle cx="7.5" cy="11" r="1" />
    <circle cx="10" cy="7" r="1" />
    <circle cx="15" cy="7.5" r="1" />
  </Icon>
);
export const PackageIcon = () => (
  <Icon size={18}>
    <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" />
    <path d="M4 7.5l8 4.5 8-4.5M12 12v9" />
  </Icon>
);
export const DatabaseIcon = () => (
  <Icon size={18}>
    <ellipse cx="12" cy="6" rx="7" ry="3" />
    <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
  </Icon>
);
export const PanelCollapseIcon = ({ collapsed }: { collapsed: boolean }) => (
  <Icon size={16}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M9 4v16" />
    <path d={collapsed ? "M14 9l3 3-3 3" : "M17 9l-3 3 3 3"} />
  </Icon>
);
export const CodeIcon = () => (
  <Icon size={14}>
    <path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" />
  </Icon>
);
export const SlidersIcon = () => (
  <Icon>
    <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
    <circle cx="16" cy="6" r="2" />
    <circle cx="10" cy="12" r="2" />
    <circle cx="18" cy="18" r="2" />
  </Icon>
);
export const MoreIcon = () => (
  <Icon>
    <circle cx="5" cy="12" r="1.5" />
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="19" cy="12" r="1.5" />
  </Icon>
);
