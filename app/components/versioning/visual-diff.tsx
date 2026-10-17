import { Avatar } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { ChangeChip } from "./diff-row";
import { formatDateTime } from "./format-date";
import { PagePreview } from "./page-preview";
import { groupByNode, type PreviewModel } from "./preview-model";
import type { AttributedChange } from "./types";

interface VisualDiffProps {
  beforeLabel: string;
  afterLabel: string;
  before: PreviewModel;
  after: PreviewModel;
  changes: AttributedChange[];
}

/** El «git diff» de diseño: la página antes y después, con las partes cambiadas numeradas. */
export function VisualDiff({ beforeLabel, afterLabel, before, after, changes }: VisualDiffProps) {
  const groups = groupByNode(changes);
  const pins = Object.fromEntries(groups.map((group, index) => [group.node, index + 1]));

  const sides = [
    { tone: "danger", title: "Antes", label: beforeLabel, model: before },
    { tone: "success", title: "Después", label: afterLabel, model: after },
  ] as const;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap justify-center gap-4">
        {sides.map((side) => (
          <figure key={side.title} className="flex flex-col gap-2">
            <figcaption className="flex items-center gap-2 text-xs">
              <Badge tone={side.tone}>{side.title}</Badge>
              <span className="truncate text-ink-dim">{side.label}</span>
            </figcaption>
            <PagePreview model={side.model} pins={pins} label={`${side.title}: ${side.label}`} />
          </figure>
        ))}
      </div>

      {groups.length > 0 ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {groups.map((group, index) => (
            <li key={group.node} className="flex gap-3 rounded-lg border border-line bg-canvas p-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
                {index + 1}
              </span>

              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <p className="text-[13px] font-medium">{group.node}</p>

                <div className="flex flex-col gap-1">
                  {group.changes.map((change) => (
                    <ChangeChip key={change.property} change={change} />
                  ))}
                </div>

                <p className="flex items-center gap-2 text-xs text-ink-dim">
                  {group.authors.map((author) => (
                    <Avatar key={author} name={author} />
                  ))}
                  <span>
                    {group.authors.join(", ")} · {formatDateTime(group.at)}
                  </span>
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-xs text-ink-dim">Sin diferencias visibles en la página.</p>
      )}
    </div>
  );
}
