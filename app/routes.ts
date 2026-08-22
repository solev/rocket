import { type RouteConfig, route, index } from "@react-router/dev/routes";

export default [
  // Root index
  index("routes/_index.tsx"),
  // Auth
  route("login", "routes/login.tsx"),
  route("signup", "routes/signup.tsx"),
  route("forgot-password", "routes/forgot-password.tsx"),
  // Better Auth issues the reset token as a path segment, not a query param.
  route("reset-password/:token", "routes/reset-password.tsx"),
  // Protected dashboard with children
  route("dashboard", "routes/dashboard/dashboard-layout.tsx", [
    index("routes/dashboard/dashboard.index.tsx"),
    route("billing", "routes/dashboard/dashboard.billing.tsx"),
    route("settings", "routes/dashboard/dashboard.settings.tsx"),
    route("ai", "routes/ai/chat.tsx"),
  ]),
  // Logout action
  route("logout", "routes/logout.tsx"),
  // Theme cookie action
  route("theme", "routes/theme.tsx"),
  // Polar webhooks
  route("polar/webhooks", "routes/polar.webhooks.tsx"),
  // Better Auth dynamic API handler (splat)
  route("api/auth/*", "routes/api.auth.$.tsx"),
  route("api/chat", "routes/api/chat.tsx"),
] satisfies RouteConfig;
