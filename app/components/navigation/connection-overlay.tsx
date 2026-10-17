"use client";

import { useNavigation } from "./navigation-context";

const ARROW_SIZE = 14;

/** La flecha que acompaña al puntero mientras se conecta un elemento con una página. */
export function ConnectionOverlay() {
  const { connecting, hotDrop } = useNavigation();
  if (!connecting) return null;

  const { from, to } = connecting;
  const color = hotDrop ? "#22c55e" : "#0d99ff";
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const wing = (offset: number) =>
    `${to.x - ARROW_SIZE * Math.cos(angle + offset)},${to.y - ARROW_SIZE * Math.sin(angle + offset)}`;

  return (
    <svg aria-hidden className="pointer-events-none fixed inset-0 z-[60] h-full w-full">
      <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={color} strokeWidth="2.5" strokeDasharray="6 5" />
      <circle cx={from.x} cy={from.y} r="6" fill={color} />
      <polygon points={`${to.x},${to.y} ${wing(0.45)} ${wing(-0.45)}`} fill={color} />
      <text x={to.x + 14} y={to.y - 14} fill={color} fontSize="12" fontWeight="600">
        {hotDrop ? "Suelta para enlazar" : "Arrastra hasta una página"}
      </text>
    </svg>
  );
}
