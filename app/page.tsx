import { redirect } from "next/navigation";
import HomeClient from "./home-client";

export default function Home() {
  // En el paquete desplegado (CMS_MODE=site) la raíz es el sitio publicado, no el editor.
  if (process.env.CMS_MODE === "site") redirect("/ver");
  return <HomeClient />;
}
