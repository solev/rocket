// Route: POST /theme
// Sets a cookie "theme" to "dark" or "light" for 1 year so SSR can render without flash.

export async function action({ request }: { request: Request }) {
  const form = await request.formData();
  const raw = String(form.get("theme") ?? "");
  const value = raw === "dark" || raw === "light" ? raw : "";

  // If value empty/invalid, clear cookie by setting Max-Age=0
  const cookieParts = [
    `theme=${encodeURIComponent(value)}`,
    "Path=/",
    value ? "Max-Age=31536000" : "Max-Age=0",
    "SameSite=Lax",
  ];
  if (process.env.NODE_ENV === "production") cookieParts.push("Secure");

  return new Response(null, {
    status: 204,
    headers: { "Set-Cookie": cookieParts.join("; ") },
  });
}

export default function ThemeRoute() {
  return null;
}
