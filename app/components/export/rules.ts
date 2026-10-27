/** Las reglas para rehacer un diseño del CMS con buenas prácticas en cualquier proyecto. Es texto fijo, igual en todas las herramientas. */

export const SKILL_NAME = "cms-design";
export const SKILL_DESCRIPTION =
  "Rehacer en el proyecto actual un diseño exportado del CMS (especificación + código de referencia) siguiendo su stack y buenas prácticas.";

const RULES: string[] = [
  "**Antes de escribir código, inspecciona el proyecto**: `package.json` o `composer.json`, los archivos de configuración, dónde están los componentes que ya existen y cómo se nombran. Usa su framework, su lenguaje y su forma de estilizar (Tailwind, Sass/SCSS, CSS Modules, CSS-in-JS, estilos con alcance del framework…). No cambies de stack ni añadas dependencias sin pedirlo.",
  "**Crea archivos nuevos** en la carpeta de componentes que ya usa el proyecto. No modifiques archivos existentes; como mucho, di en qué página importar el componente y con qué línea.",
  "**Si el proyecto no tiene un sistema de estilos**, usa CSS normal con clases con prefijo (`hero__titulo`) en un archivo propio.",
  "**La estructura se deduce, no se copia**: la especificación da coordenadas absolutas solo para que entiendas filas, columnas y espacios. Escribe el diseño con flexbox o grid y medidas relativas; nada de `position: absolute` ni píxeles fijos para colocar el contenido.",
  "**HTML semántico y accesible**: `header`, `section`, `nav`, `h1`–`h6` en orden, `a` para navegar y `button` para actuar, `alt` en las imágenes, foco visible y contraste suficiente.",
  "**Responsive**: parte de móvil y ajusta hacia escritorio. Respeta lo que diga la sección sobre tablet y móvil.",
  "**Contenido como datos**: textos, imágenes y enlaces salen como props (o variables del framework) con los valores del diseño por defecto. Si la sección se repite con datos de una API, recibe la lista por prop y recórrela.",
  "**Variables de diseño**: si el proyecto ya tiene tokens (colores, tipografías), úsalos. Si no, convierte las variables indicadas en variables CSS.",
  "**Imágenes**: las rutas `assets/…` son archivos que te entrega la persona; colócalos donde el proyecto guarda sus recursos y ajusta las rutas.",
  "**Fidelidad**: compara con el código de referencia (mismos colores, tamaños de letra, esquinas y proporciones de espacio). Si algo no se puede reproducir, dilo en vez de inventarlo. No inventes contenido.",
  "**Al terminar**, lista los archivos creados y muestra cómo usar el componente (línea de importación y un ejemplo).",
];

/** Las reglas como lista numerada. */
export const RULES_TEXT = RULES.map((rule, index) => `${index + 1}. ${rule}`).join("\n");
