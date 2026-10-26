import type { Rule } from "../types";
import { debugCode, https, noopener } from "./best-practices";
import { headingOrder, pageLang } from "./a11y-structure";
import { imageAlt, linkName } from "./a11y-images";
import { contrast, smallText, touchTarget } from "./a11y-text";
import { codeSize, dataLoading, domSize, fontDisplay, libraries, loadAnimations } from "./perf-load";
import { embeddedVideo, imageSize, reservedSize } from "./perf-media";
import { readableSlug, seoDescription, seoTitle, singleH1 } from "./seo";
import { brokenLinks, socialImage } from "./seo-links";

/** Todas las comprobaciones. Una regla nueva es una entrada nueva aquí. */
export const RULES: Rule[] = [
  imageAlt, linkName, contrast, smallText, touchTarget, headingOrder, pageLang,
  seoTitle, seoDescription, singleH1, readableSlug, brokenLinks, socialImage,
  imageSize, reservedSize, embeddedVideo, loadAnimations, dataLoading, libraries, codeSize, fontDisplay, domSize,
  https, noopener, debugCode,
];
