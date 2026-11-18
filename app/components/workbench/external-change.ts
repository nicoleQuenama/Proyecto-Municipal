/**
 * Lo que debe mostrar el editor cuando el archivo cambió por fuera de él (el modal «Contenido», deshacer…):
 * el texto nuevo, o `null` si lo guardado en el sitio es lo mismo que el editor guardó por su cuenta.
 */
export const adoptExternal = (stored: string, savedByEditor: string): string | null => (stored === savedByEditor ? null : stored);
