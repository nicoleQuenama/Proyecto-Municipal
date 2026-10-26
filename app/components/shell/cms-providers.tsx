import type { ReactNode } from "react";
import { RecorderProvider } from "../animation/recorder-context";
import { CommandsProvider } from "../commands/commands-context";
import { CanvasSettingsProvider } from "../canvas-editing/settings-context";
import { ExternalProvider } from "../external-site/external-context";
import { FormatMenuProvider } from "../format/format-menu-context";
import { MediaProvider } from "../media/media-context";
import { NavigationProvider } from "../navigation/navigation-context";
import { SiteProvider } from "../site/site-context";
import { VersioningProvider } from "../versioning/versioning-context";
import { ViewportProvider } from "../viewport/viewport-context";
import { WorkbenchProvider } from "../workbench/workbench-context";

export function CmsProviders({ children }: { children: ReactNode }) {
  return (
    <SiteProvider>
      <MediaProvider>
        <ExternalProvider>
          <VersioningProvider>
            <ViewportProvider>
              <CanvasSettingsProvider>
                <NavigationProvider>
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
          </VersioningProvider>
        </ExternalProvider>
      </MediaProvider>
    </SiteProvider>
  );
}
