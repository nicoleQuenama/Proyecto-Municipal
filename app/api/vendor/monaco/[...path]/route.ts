import { serveVendorFile } from "../../../../server/vendor-files";

/** El editor Monaco (el de VS Code), servido desde node_modules para no depender de un CDN. */
export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return serveVendorFile("monaco-editor/min/vs", path.join("/"));
}
