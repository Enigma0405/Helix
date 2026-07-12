import { Link } from "@tanstack/react-router";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 backdrop-blur-xl bg-background/70">
      <div className="mx-auto max-w-7xl px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <HelixMark />
          <span className="text-[13px] font-medium tracking-tight">Helix</span>
          <span className="text-eyebrow ml-2 hidden sm:inline">Enterprise EvidenceOps</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-[13px] text-muted-foreground">
          <a href="#evidenceops" className="hover:text-foreground transition-colors">Platform</a>
          <a href="#pillars" className="hover:text-foreground transition-colors">Pillars</a>
          <a href="#runtime" className="hover:text-foreground transition-colors">Runtime</a>
          <a href="#architecture" className="hover:text-foreground transition-colors">Architecture</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="text-[13px] text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
          >
            Sign in
          </Link>
          <Link
            to="/login"
            className="text-[13px] font-medium bg-signal text-signal-foreground hover:bg-signal/90 transition-colors px-3.5 py-1.5 rounded-md"
          >
            Launch Helix
          </Link>
        </div>
      </div>
    </header>
  );
}

export function HelixMark({ className = "" }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M4 4c4 4 12 12 16 16M20 4C16 8 8 16 4 20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="text-signal"
      />
      <circle cx="12" cy="12" r="2" fill="currentColor" className="text-signal" />
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 mt-32">
      <div className="mx-auto max-w-7xl px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <HelixMark />
          <span className="text-[13px] font-medium">Helix</span>
          <span className="text-eyebrow">© 2026</span>
        </div>
        <div className="flex flex-wrap gap-6 text-[12px] text-muted-foreground">
          <span>SOC 2 Type II</span>
          <span>ISO 27001</span>
          <span>HIPAA</span>
          <span>GxP Ready</span>
          <span>Private Deployment</span>
        </div>
      </div>
    </footer>
  );
}
