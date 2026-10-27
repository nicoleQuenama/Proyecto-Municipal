import type { DrawFrame } from "../drawing/draw-plan";
import type { SiteAction } from "../site/types";

/** Un paso de la demostración: una acción real del editor y, si la hay, la zona de la página donde «actúa» el cursor. */
export interface DemoStep {
  action: SiteAction;
  /** La página y la zona (en píxeles de página) hacia donde se mueve el cursor antes de hacer la acción. */
  target?: { pageId: string; frame: Pick<DrawFrame, "x" | "y" | "width" | "height"> };
}
