import * as React from "react";
import { Link } from "react-router";

export default function WireframeB() {
  return (
    <div className="min-h-screen bg-white text-foreground">
      <header className="mx-auto max-w-6xl px-6 py-6 flex items-center gap-4">
        <div className="font-semibold tracking-tight">Seestem.dev</div>
        <nav className="ml-auto flex gap-4 text-sm text-muted-foreground">
          <Link to="/wireframes/a">Wireframe A</Link>
          <Link to="/wireframes/c">Wireframe C</Link>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid grid-cols-12 gap-8 items-start">
          <div className="col-span-6">
            <p className="text-xs font-medium uppercase text-teal-600">Developer-first</p>
            <h1 className="mt-4 text-4xl font-bold leading-tight">
              Integrate AI where your engineers already work
            </h1>
            <ul className="mt-6 space-y-2 text-muted-foreground">
              <li>• IDE plugins & language server integration</li>
              <li>• CI/CD friendly agents and deterministic runs</li>
              <li>• Built-in observability and audit logs</li>
            </ul>

            <div className="mt-8 flex gap-3">
              <button className="rounded bg-teal-600 px-5 py-2 text-white">Request pilot</button>
              <button className="rounded border px-5 py-2">View SDK</button>
            </div>
          </div>

          <div className="col-span-6">
            <div className="rounded-lg border bg-slate-50 p-6">
              <div className="h-48 bg-white rounded-md border p-4 font-mono text-sm text-slate-700">
                <div className="text-xs text-muted-foreground">IDE: VSCode</div>
                <pre className="mt-2">import {{ Agent }} from '@seestem/agent'
// …</pre>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-12">
          <h3 className="text-lg font-semibold">Why engineers love Seestem</h3>
          <div className="mt-6 grid grid-cols-3 gap-6">
            <div className="rounded border p-4">Fast onboarding</div>
            <div className="rounded border p-4">Secure by design</div>
            <div className="rounded border p-4">Enterprise ready</div>
          </div>
        </section>
      </main>
    </div>
  );
}
