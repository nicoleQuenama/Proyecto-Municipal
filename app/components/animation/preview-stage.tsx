"use client";

import { useMemo, type RefObject } from "react";
import { PageBlocks } from "../site/page-blocks";
import type { Page } from "../site/types";
import type { AnimationStep } from "./types";

/** El escenario de la vista previa: solo las secciones que la animación toca, sin que nada responda al cursor. */
export function PreviewStage({ page, steps, stageRef }: { page: Page; steps: AnimationStep[]; stageRef: RefObject<HTMLDivElement | null> }) {
  const stagePage = useMemo<Page>(() => {
    const touched = new Set(steps.map((step) => step.blockId));
    return { ...page, blocks: page.blocks.filter((block) => touched.has(block.id)) };
  }, [page, steps]);

  return (
    <div ref={stageRef} className="pointer-events-none relative min-h-64 overflow-auto bg-white p-8 text-neutral-900">
      <PageBlocks page={stagePage} interactive={false} slot="top" />
      <PageBlocks page={stagePage} interactive={false} slot="body" />
    </div>
  );
}
