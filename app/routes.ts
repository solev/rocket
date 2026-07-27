import { type RouteConfig, route, index } from "@react-router/dev/routes";

export default [
	// Root index
	index("routes/_index.tsx"),
	// Auth
	route("login", "routes/login.tsx"),
	route("signup", "routes/signup.tsx"),
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
	// Wireframe previews for Seestem
	route("wireframes/a", "routes/wireframes/seestem-wireframe-a.tsx"),
	route("wireframes/b", "routes/wireframes/seestem-wireframe-b.tsx"),
	route("wireframes/c", "routes/wireframes/seestem-wireframe-c.tsx"),
] satisfies RouteConfig;
