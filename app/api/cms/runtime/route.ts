import { runtimeScript } from "../../../components/external-site/runtime-script";

/** El script que el cliente instala en su web: pide lo publicado y lo aplica a la página. */
export async function GET(request: Request) {
  const site = new URL(request.url).searchParams.get("site") ?? "";
  return new Response(runtimeScript(site), {
    headers: { "content-type": "application/javascript; charset=utf-8", "cache-control": "no-store" },
  });
}
