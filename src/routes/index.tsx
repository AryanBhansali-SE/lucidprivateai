import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: IndexRedirect,
});

function IndexRedirect() {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="font-serif italic text-gold text-3xl animate-pulse">Lucid</div>
      </div>
    );
  }
  return <Navigate to={session ? "/pulse" : "/auth"} />;
}
