import * as React from "react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";

export default function WireframeA() {
  const [copied, setCopied] = React.useState(false);
  const snippet = "$ npm i @seestem/agent && npx seestem init";

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // noop
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto max-w-6xl px-6 py-6 flex items-center gap-4">
        <div className="font-semibold tracking-tight">Seestem.dev</div>
        <nav className="ml-auto flex gap-4 text-sm text-muted-foreground">
          <Link to="/wireframes/b">Wireframe B</Link>
          <Link to="/wireframes/c">Wireframe C</Link>
          <a href="#contact" className="underline">
            Contact
          </a>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid grid-cols-12 gap-8 items-start">
          <div className="col-span-7">
            <p className="text-xs font-medium uppercase text-teal-600/90">Vision</p>
            <h1 className="mt-4 text-5xl font-extrabold leading-tight">AI engineering for product teams</h1>
            <p className="mt-6 text-muted-foreground max-w-xl text-lg">
              Ship production AI faster — agents, integrations, and observability
              delivered with engineering practices and enterprise readiness.
            </p>

            <div className="mt-8 w-full max-w-lg space-y-3">
              <div className="rounded border bg-card p-4 font-mono text-sm text-slate-700 flex items-start justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">MACOS / LINUX</div>
                  <div className="mt-2">{snippet}</div>
                </div>
                <div className="ml-4 flex flex-col items-end gap-2">
                  <Button variant="outline" size="sm" onClick={copy}>
                    {copied ? "Copied" : "Copy"}
                  </Button>
                  <a className="text-xs text-muted-foreground" href="#docs">
                    View docs →
                  </a>
                </div>
              </div>

              <div className="flex gap-3">
                <Button size="lg" className="px-6">
                  Request a pilot
                </Button>
                <Button variant="outline" size="lg" className="px-6">
                  Book a consult
                </Button>
              </div>
            </div>
          </div>

          <div className="col-span-5">
            <div className="h-72 rounded-lg border bg-gradient-to-br from-white/40 to-muted/10 flex items-center justify-center overflow-hidden">
              <RightNetworkIllustration />
            </div>
          </div>
        </div>

        <section className="mt-16">
          <h3 className="text-xl font-semibold">Core offerings</h3>
          <div className="mt-6 grid grid-cols-3 gap-6">
            <div className="rounded-xl border p-6 bg-card/40">Agents & Workflows</div>
            <div className="rounded-xl border p-6 bg-card/40">SDK & Integrations</div>
            <div className="rounded-xl border p-6 bg-card/40">Observability & Ops</div>
          </div>
        </section>
      </main>
    </div>
  );
}

function RightNetworkIllustration() {
  return (
    <svg viewBox="0 0 480 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id="tealFade" x1="0" x2="1">
          <stop offset="0%" stopColor="#00C2B3" stopOpacity="1" />
          <stop offset="100%" stopColor="#00C2B3" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <g stroke="#D1D5DB" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M20 40h440" opacity="0.25" />
        <path d="M20 90h440" opacity="0.25" />
        <path d="M20 140h440" opacity="0.25" />
        <path d="M20 190h440" opacity="0.25" />
      </g>
      <g>
        <circle cx="60" cy="40" r="6" fill="url(#tealFade)">
          <animate attributeName="r" values="5;8;5" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="160" cy="90" r="5" fill="#00C2B3">
          <animate attributeName="cx" values="160;180;160" dur="6s" repeatCount="indefinite" />
        </circle>
        <circle cx="260" cy="140" r="6" fill="#00C2B3">
          <animate attributeName="cy" values="140;120;140" dur="5s" repeatCount="indefinite" />
        </circle>
        <circle cx="380" cy="190" r="4" fill="#7DDDD0" />
      </g>
      <g stroke="#CBD5DA" strokeWidth="1.5" fill="none">
        <path d="M60 40 C120 40, 140 70, 160 90" opacity="0.6" />
        <path d="M160 90 C210 115, 240 130, 260 140" opacity="0.5" />
        <path d="M260 140 C320 160, 360 180, 380 190" opacity="0.4" />
      </g>
    </svg>
  );
}
