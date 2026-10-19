import { CommandPalette } from "./components/commands/command-palette";
import { CommandsProvider } from "./components/commands/commands-context";
import { ShortcutsSettings } from "./components/commands/shortcuts-settings";
import { BuilderHost } from "./components/builder/builder-host";
import { CanvasSettingsProvider } from "./components/canvas-editing/settings-context";
import { Inspector } from "./components/customize/inspector";
import { TailwindRuntime } from "./components/customize/tailwind-runtime";
import { FormatMenu } from "./components/format/format-menu";
import { FormatMenuProvider } from "./components/format/format-menu-context";
import { MediaProvider } from "./components/media/media-context";
import { MediaDropZone } from "./components/media/media-drop-zone";
import { MediaNotice } from "./components/media/media-notice";
import { MediaUrlDialog } from "./components/media/media-url-dialog";
import { ConnectionOverlay } from "./components/navigation/connection-overlay";
import { LinkPopover } from "./components/navigation/link-popover";
import { ModeBar } from "./components/navigation/mode-bar";
import { NavigationProvider } from "./components/navigation/navigation-context";
import { PreviewToggle } from "./components/navigation/preview-toggle";
import { SidePanel } from "./components/side-panel/side-panel";
import { SiteStyles } from "./components/site/site-styles";
import { SiteProvider } from "./components/site/site-context";
import { TitleToolbar } from "./components/title-editor/title-editor";
import { BranchSwitcher } from "./components/versioning/branch-switcher";
import { PublishButton } from "./components/versioning/publish-button";
import { VersioningProvider } from "./components/versioning/versioning-context";
import { VersionsDialog } from "./components/versioning/versions-dialog";
import { CanvasPages, CanvasSurface } from "./components/viewport/artboard";
import { BottomToolbar } from "./components/viewport/bottom-toolbar";
import { ViewportProvider } from "./components/viewport/viewport-context";
import { ViewportSwitcher } from "./components/viewport/viewport-switcher";
import { WorkbenchHost } from "./components/workbench/workbench";
import { WorkbenchProvider } from "./components/workbench/workbench-context";

export default function Home() {
  return (
    <SiteProvider>
      <MediaProvider>
        <VersioningProvider>
          <ViewportProvider>
            <CanvasSettingsProvider>
            <NavigationProvider>
              <WorkbenchProvider>
              <CommandsProvider>
                <FormatMenuProvider>
                    <div className="flex h-screen flex-col">
                      <header className="z-20 flex w-full shrink-0 items-stretch border-b border-line bg-panel">
                        <TitleToolbar />
                        <BranchSwitcher />
                        <PublishButton />
                        <PreviewToggle />
                        <ViewportSwitcher />
                      </header>

                      <main className="flex min-h-0 flex-1 bg-canvas">
                        <SidePanel />

                        {/* La barra de herramientas flota sobre el lienzo, no sobre los paneles laterales. */}
                        <div className="relative flex min-w-0 flex-1">
                          <CanvasSurface>
                            <CanvasPages />
                          </CanvasSurface>
                          <BottomToolbar />
                        </div>

                        <Inspector />
                      </main>
                    </div>

                    <CommandPalette />
                    <BuilderHost />
                    <ShortcutsSettings />
                    <VersionsDialog />
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

                    <footer></footer>
                </FormatMenuProvider>
              </CommandsProvider>
              </WorkbenchProvider>
            </NavigationProvider>
            </CanvasSettingsProvider>
          </ViewportProvider>
        </VersioningProvider>
      </MediaProvider>
    </SiteProvider>
  );
}
