import type { ReactNode } from "react";
import { RecorderProvider } from "../animation/recorder-context";
import { CommandsProvider } from "../commands/commands-context";
import { CanvasSettingsProvider } from "../canvas-editing/settings-context";
import { FormatMenuProvider } from "../format/format-menu-context";
import { MediaProvider } from "../media/media-context";
import { NavigationProvider } from "../navigation/navigation-context";
import { SiteProvider } from "../site/site-context";
import type { SiteState } from "../site/types";
import { RealtimeProvider } from "../realtime/realtime-context";
import { BranchProvider } from "../versioning/branch-context";
import { VersioningProvider } from "../versioning/versioning-context";
import { ToastProvider } from "../ui/toast";
import { ViewportProvider } from "../viewport/viewport-context";
import { WorkbenchProvider } from "../workbench/workbench-context";

import { SearchDialog } from "../search/search-dialog";

const Passthrough = ({ children }: { children: ReactNode }) => <>{children}</>;

/** `viewer`: el sitio publicado para el público: parte de ese sitio, no guarda nada y no sale de «Probar». */
export function CmsProviders({ children, viewer }: { children: ReactNode; viewer?: SiteState }) {
  const Versions = viewer ? Passthrough : VersioningProvider;
  const Branches = viewer ? Passthrough : BranchProvider;
  const Realtime = viewer ? Passthrough : RealtimeProvider;
  return (
    <ToastProvider>
    <Branches>
    <SiteProvider initial={viewer} persist={!viewer}>
      <MediaProvider>
          <Versions>
            <ViewportProvider>
            <Realtime>
              <CanvasSettingsProvider>
                <NavigationProvider initialMode={viewer ? "preview" : "edit"} locked={!!viewer}>
                  <WorkbenchProvider>
                    <CommandsProvider>
                      <FormatMenuProvider>
                        <RecorderProvider>
                          {children}
                          <SearchDialog />
                        </RecorderProvider>
                      </FormatMenuProvider>
                    </CommandsProvider>
                  </WorkbenchProvider>
                </NavigationProvider>
              </CanvasSettingsProvider>
            </Realtime>
            </ViewportProvider>
          </Versions>
      </MediaProvider>
    </SiteProvider>
    </Branches>
    </ToastProvider>
  );
}
