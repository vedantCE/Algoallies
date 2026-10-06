import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-dvh flex-col bg-background px-4">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center">
        <Link to="/" aria-label="HealthAI home" className="rounded-lg">
          <BrandLogo />
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center pb-16">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <Compass size={30} aria-hidden="true" />
          </div>
          <p className="mb-2 font-display text-sm font-semibold uppercase tracking-wider text-primary">Error 404</p>
          <h1 className="mb-3 text-3xl font-bold text-foreground sm:text-4xl">Page not found</h1>
          <p className="mb-8 text-muted-foreground">
            We couldn't find <code className="rounded bg-muted px-1.5 py-0.5 text-sm text-foreground">{location.pathname}</code>.
            It may have moved or never existed.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild className="h-11">
              <Link to="/">
                <ArrowLeft aria-hidden="true" />
                Back to home
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-11">
              <Link to="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
