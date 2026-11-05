import { Suspense } from "react";
import { LoginBackground } from "../components/auth/login-background";
import { LoginBrandPanel } from "../components/auth/login-brand-panel";
import { ToastProvider } from "../components/ui/toast";
import { ResetPasswordForm } from "./reset-password-form";

async function ResetPasswordContent({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <ResetPasswordForm token={token ?? ""} />;
}

// Vista para cambiar la contrasena similar al login
export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-canvas">
      <LoginBackground />
      <div className="relative grid min-h-dvh lg:grid-cols-[minmax(0,1.15fr)_minmax(26rem,0.85fr)]">
        <LoginBrandPanel />
        <section className="flex min-h-dvh items-center justify-center border-line/40 bg-canvas/60 px-5 py-10 backdrop-blur-sm sm:px-8 lg:border-l lg:px-12">
          <div className="w-full max-w-sm">
            <ToastProvider>
              <Suspense fallback={<div className="h-40 animate-pulse rounded-lg bg-panel" />}>
                <ResetPasswordContent searchParams={searchParams} />
              </Suspense>
            </ToastProvider>
          </div>
        </section>
      </div>
    </main>
  );
}
