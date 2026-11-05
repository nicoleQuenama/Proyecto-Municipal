/** Imágenes que ImageKit puede recomprimir sin perder nada visible: las animadas (GIF) y los videos no se tocan. */
const OPTIMIZABLE = /\.(png|jpe?g|webp)$/i;

/**
 * La dirección con la que se MUESTRA una imagen: si está en ImageKit, se le pide el mejor formato (AVIF/WebP según el
 * navegador) y calidad automática, que pesa mucho menos. El diseño sigue guardando la dirección original; esto solo cambia
 * lo que descarga el visitante. Cualquier otra dirección se devuelve igual.
 */
export function optimizedSrc(src: string): string {
  try {
    const url = new URL(src);
    if (url.hostname !== "ik.imagekit.io" || url.searchParams.has("tr") || !OPTIMIZABLE.test(url.pathname)) return src;
    url.searchParams.set("tr", "f-auto,q-auto");
    return url.toString().replace("%2C", ",");
  } catch {
    return src;
  }
}
