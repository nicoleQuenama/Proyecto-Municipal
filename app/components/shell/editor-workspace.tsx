import { AnimationPreview } from "../animation/animation-preview";
import { RecorderBar } from "../animation/recorder-bar";
import { AuditDialog } from "../audit/audit-dialog";
import { ProfileMenu } from "../auth/profile-menu";
import { BuilderHost } from "../builder/builder-host";
import { CommandPalette } from "../commands/command-palette";
import { ShortcutsSettings } from "../commands/shortcuts-settings";
import { Inspector } from "../customize/inspector";
import { TailwindRuntime } from "../customize/tailwind-runtime";
import { ExternalEditor } from "../external-site/editor/external-editor";
import { FormatMenu } from "../format/format-menu";
import { MediaDropZone } from "../media/media-drop-zone";
import { MediaNotice } from "../media/media-notice";
import { MediaUrlDialog } from "../media/media-url-dialog";
import { ConnectionOverlay } from "../navigation/connection-overlay";
import { LinkPopover } from "../navigation/link-popover";
import { ModeBar } from "../navigation/mode-bar";
import { PreviewToggle } from "../navigation/preview-toggle";
import { SectionColors } from "../section-colors/section-colors";
import { SidePanel } from "../side-panel/side-panel";
import { SiteStyles } from "../site/site-styles";
import { FormatBar } from "../title-editor/format-bar";
import { BranchSwitcher } from "../versioning/branch-switcher";
import { PublishButton } from "../versioning/publish-button";
import { VersionsDialog } from "../versioning/versions-dialog";
import { CanvasPages, CanvasSurface } from "../viewport/artboard";
import { BottomToolbar } from "../viewport/bottom-toolbar";
import { ViewportSwitcher } from "../viewport/viewport-switcher";
import { WorkbenchHost } from "../workbench/workbench";

export function EditorWorkspace() {
  return (
    <>
      <div className="flex h-screen flex-col">
        <header className="z-20 flex w-full shrink-0 items-stretch border-b border-line bg-panel">
          <FormatBar />
          <BranchSwitcher />
          <PublishButton />
          <PreviewToggle />
          <ViewportSwitcher />
          <div className="ml-auto flex items-center px-3">
            <ProfileMenu />
          </div>
        </header>

        <main className="flex min-h-0 flex-1 bg-canvas">
          <SidePanel />
          <div className="relative flex min-w-0 flex-1">
            <CanvasSurface>
              <CanvasPages />
            </CanvasSurface>
            <BottomToolbar />
            <SectionColors />
            <RecorderBar />
          </div>
          <Inspector />
        </main>

        <footer></footer>
      </div>

      <CommandPalette />
      <BuilderHost />
      <ShortcutsSettings />
      <VersionsDialog />
      <AuditDialog />
      <ExternalEditor />
      <MediaUrlDialog />
      <MediaNotice />
      <MediaDropZone />
      <ModeBar />
      <ConnectionOverlay />
      <LinkPopover />
      <FormatMenu />
      <WorkbenchHost />
      <TailwindRuntime />
      <SiteStyles />
      <AnimationPreview />
    </>
  );
}
