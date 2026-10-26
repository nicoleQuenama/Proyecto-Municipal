import { ICON_NAMES, type IconName } from "./icon-set";
import { ICON_LABELS } from "./icon-labels";

const plain = (text: string): string =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

/** Los íconos cuyo nombre o palabras contienen todo lo escrito (sin importar acentos ni mayúsculas). */
export function searchIcons(query: string): IconName[] {
  const words = plain(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return ICON_NAMES;
  return ICON_NAMES.filter((name) => {
    const haystack = `${plain(ICON_LABELS[name])} ${name}`;
    return words.every((word) => haystack.includes(word));
  });
}
