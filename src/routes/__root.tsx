import { Outlet, createRootRoute, HeadContent, Scripts, Link } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="min-h-screen grid place-items-center bg-background px-6">
      <div className="text-center max-w-sm">
        <div className="font-serif text-gold text-6xl mb-2">404</div>
        <div className="label-cap mb-6">Path not found</div>
        <p className="text-ash text-sm mb-8">
          The destination you requested does not exist in this terminal.
        </p>
        <Link
          to="/pulse"
          className="inline-block border border-gold text-gold px-6 py-2 text-sm font-mono uppercase tracking-widest hover:bg-gold-soft transition-colors"
        >
          Return to Pulse
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Lucid — Private Performance Terminal" },
      {
        name: "description",
        content:
          "Lucid is a private performance terminal for tracking habits, objectives, and journaled intent. Stealth-wealth aesthetic, hairline interface, executive density.",
      },
      { property: "og:title", content: "Lucid — Private Performance Terminal" },
      {
        property: "og:description",
        content:
          "Track habits, objectives, and journaled intent in a private banking-grade interface.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: () => (
    <AuthProvider>
      <Outlet />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "var(--color-charcoal)",
            color: "var(--color-bone)",
            border: "1px solid var(--color-hairline)",
            borderRadius: "2px",
            fontFamily: "var(--font-sans)",
            fontSize: "13px",
          },
        }}
      />
    </AuthProvider>
  ),
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
