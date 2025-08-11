import * as React from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useFetcher } from "react-router";

type Theme = "light" | "dark";

function readCookieTheme(): Theme | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|; )theme=([^;]+)/);
  const v = m ? decodeURIComponent(m[1]) : "";
  return v === "dark" || v === "light" ? (v as Theme) : null;
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

export function ThemeToggle() {
  const fetcher = useFetcher();
  const [theme, setTheme] = React.useState<Theme>(() => {
    // Prefer cookie (SSR source of truth). Fallback to light on server.
    return readCookieTheme() ?? "light";
  });

  React.useEffect(() => {
    // Ensure DOM reflects current theme on mount/changes
    applyTheme(theme);
  }, [theme]);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next); // optimistic
    // Persist to server cookie for SSR
    const fd = new FormData();
    fd.set("theme", next);
    fetcher.submit(fd, { method: "post", action: "/theme" });
  };

  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      aria-label="Toggle theme"
      onClick={toggle}
      className="relative"
      title={theme === "dark" ? "Switch to light" : "Switch to dark"}
    >
      {theme === "dark" ? (
        <Sun className="size-4" />
      ) : (
        <Moon className="size-4" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
