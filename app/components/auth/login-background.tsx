export function LoginBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute -top-40 -left-40 h-[36rem] w-[36rem] rounded-full bg-accent/20 blur-[140px]" />
      <div className="absolute -right-40 -bottom-56 h-[40rem] w-[40rem] rounded-full bg-[#7c5cff]/20 blur-[150px]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
    </div>
  );
}
