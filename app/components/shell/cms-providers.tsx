import type { ReactNode } from "react";
import { RecorderProvider } from "../animation/recorder-context";
import { CommandsProvider } from "../commands/commands-context";
import { CanvasSettingsProvider } from "../canvas-editing/settings-context";
import { FormatMenuProvider } from "../format/format-menu-context";
import { MediaProvider } from "../media/media-context";
import { NavigationProvider } from "../navigation/navigation-context";
import { SiteProvider } from "../site/site-context";
import type { SiteState } from "../site/types";
import { VersioningProvider } from "../versioning/versioning-context";
import { ViewportProvider } from "../viewport/viewport-context";
import { WorkbenchProvider } from "../workbench/workbench-context";

const Passthrough = ({ children }: { children: ReactNode }) => <>{children}</>;

/** `viewer`: el sitio publicado para el público: parte de ese sitio, no guarda nada y no sale de «Probar». */
export function CmsProviders({ children, viewer }: { children: ReactNode; viewer?: SiteState }) {
  const Versions = viewer ? Passthrough : VersioningProvider;
  return (
    <SiteProvider initial={viewer} persist={!viewer}>
      <MediaProvider>
          <Versions>
            <ViewportProvider>
              <CanvasSettingsProvider>
                <NavigationProvider initialMode={viewer ? "preview" : "edit"} locked={!!viewer}>
                  <WorkbenchProvider>
                    <CommandsProvider>
                      <FormatMenuProvider>
                        <RecorderProvider>{children}</RecorderProvider>
                      </FormatMenuProvider>
                    </CommandsProvider>
                  </WorkbenchProvider>
                </NavigationProvider>
              </CanvasSettingsProvider>
            </ViewportProvider>
          </Versions>
      </MediaProvider>
    </SiteProvider>
  );
}
