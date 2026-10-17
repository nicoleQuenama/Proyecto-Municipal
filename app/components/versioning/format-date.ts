const formatter = new Intl.DateTimeFormat("es", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** "2026-10-16T11:30:00" → "16 oct 2026, 11:30" */
export const formatDateTime = (iso: string): string => formatter.format(new Date(iso));
