"use client";

import { useCommands } from "../commands/commands-context";
import { ChevronIcon } from "../viewport/icons";
import { MenuButton, type MenuItem } from "../viewport/menu-button";
import { BranchIcon } from "./versioning-icons";
import { useVersioning } from "./versioning-context";

const MANAGE = "__manage";

/** Selector de rama del header: cambia de rama o abre el panel de versiones. */
export function BranchSwitcher() {
  const { state, dispatch } = useVersioning();
  const { openDialog, withShortcut } = useCommands();

  const items: MenuItem<string>[] = [
    ...state.branches.map((branch) => ({
      value: branch.name,
      label: branch.name,
      icon: <BranchIcon />,
    })),
    { value: MANAGE, label: "Administrar versiones…", dividerBefore: true },
  ];

  const onSelect = (value: string) =>
    value === MANAGE ? openDialog("versions") : dispatch({ type: "branch/switch", name: value });

  return (
    <div className="flex shrink-0 items-center border-l border-line px-3" title={withShortcut("Rama actual", "versions.open")}>
      <MenuButton
        label="Cambiar de rama"
        items={items}
        selected={state.current}
        onSelect={onSelect}
        placement="bottom-end"
        className="flex h-7 max-w-44 items-center gap-1.5 rounded-md px-2 text-xs hover:bg-hover"
      >
        <BranchIcon />
        <span className="truncate">{state.current}</span>
        <ChevronIcon size={10} />
      </MenuButton>
    </div>
  );
}
