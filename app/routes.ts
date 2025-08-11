import { type RouteConfig, route, index } from "@react-router/dev/routes";

export default [
	// Root index
	index("routes/_index.tsx"),
	// Auth
	route("login", "routes/login.tsx"),
	// Protected dashboard with children
	route("dashboard", "routes/dashboard-layout.tsx", [
		index("routes/dashboard.index.tsx"),
		route("billing", "routes/dashboard.billing.tsx"),
		route("settings", "routes/dashboard.settings.tsx"),
	]),
	// Logout action
	route("logout", "routes/logout.tsx"),
	// Theme cookie action
	route("theme", "routes/theme.tsx"),
	// Polar webhooks
	route("polar/webhooks", "routes/polar.webhooks.tsx"),
	// Better Auth dynamic API handler (splat)
	route("api/auth/*", "routes/api.auth.$.tsx"),
] satisfies RouteConfig;
