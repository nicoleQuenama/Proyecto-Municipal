import { CommandPalette } from "./components/commands/command-palette";
import { CommandsProvider } from "./components/commands/commands-context";
import { ShortcutsSettings } from "./components/commands/shortcuts-settings";
import { MediaProvider } from "./components/media/media-context";
import { MediaDropZone } from "./components/media/media-drop-zone";
import { MediaNotice } from "./components/media/media-notice";
import { MediaUrlDialog } from "./components/media/media-url-dialog";
import { ConnectionOverlay } from "./components/navigation/connection-overlay";
import { ModeBar } from "./components/navigation/mode-bar";
import { NavigationProvider } from "./components/navigation/navigation-context";
import { PreviewToggle } from "./components/navigation/preview-toggle";
import { SidePanel } from "./components/side-panel/side-panel";
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

export default function Home() {
  return (
    <SiteProvider>
      <MediaProvider>
        <VersioningProvider>
          <ViewportProvider>
            <NavigationProvider>
              <CommandsProvider>
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

                    <CanvasSurface>
                      <CanvasPages />
                    </CanvasSurface>
                  </main>
                </div>

                <BottomToolbar />
                <CommandPalette />
                <ShortcutsSettings />
                <VersionsDialog />
                <MediaUrlDialog />
                <MediaNotice />
                <MediaDropZone />
                <ModeBar />
                <ConnectionOverlay />

                <footer></footer>
              </CommandsProvider>
            </NavigationProvider>
          </ViewportProvider>
        </VersioningProvider>
      </MediaProvider>
    </SiteProvider>
  );
}
