import { ReactNode, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Menu, X, type LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BrandLogo } from "@/components/BrandLogo";
import { cn } from "@/lib/utils";

export interface DashboardNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface DashboardShellProps {
  brand: string;
  roleLabel: string;
  items: DashboardNavItem[];
  active: string;
  onSelect: (id: string) => void;
  title: ReactNode;
  description?: ReactNode;
  headerActions?: ReactNode;
  children: ReactNode;
}

/**
 * Responsive dashboard layout: persistent sidebar on large screens,
 * slide-in drawer with a sticky top bar on phones/tablets.
 */
export const DashboardShell = ({
  brand,
  roleLabel,
  items,
  active,
  onSelect,
  title,
  description,
  headerActions,
  children,
}: DashboardShellProps) => {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close the drawer on Escape and lock background scroll while it is open
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [drawerOpen]);

  const handleSelect = (id: string) => {
    onSelect(id);
    setDrawerOpen(false);
    // Move focus to the content region so screen readers announce the new section
    requestAnimationFrame(() => document.getElementById("main-content")?.focus({ preventScroll: true }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const nav = (
    <>
      <div className="flex items-center justify-between px-2 pb-6">
        <BrandLogo name={brand} />
        <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
          {roleLabel}
        </span>
      </div>

      <nav aria-label={`${roleLabel} navigation`} className="flex-1 overflow-y-auto">
        <ul className="space-y-1">
          {items.map((item) => {
            const isActive = active === item.id;
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "group relative flex w-full min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon size={20} aria-hidden="true" className="shrink-0" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-4 border-t border-border pt-4">
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="flex w-full min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut size={20} aria-hidden="true" />
          <span>Log out</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-dvh bg-background">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card p-4 lg:flex">
        {nav}
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-card/90 px-4 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={drawerOpen}
            aria-controls="mobile-nav"
            className="-ml-2 flex h-11 w-11 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-accent"
          >
            <Menu size={22} aria-hidden="true" />
          </button>
          <BrandLogo name={brand} size="sm" />
        </div>
        {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              key="scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setDrawerOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              key="drawer"
              id="mobile-nav"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
              className="fixed inset-y-0 left-0 z-50 flex w-[min(18rem,85vw)] flex-col bg-card p-4 shadow-xl lg:hidden"
            >
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close navigation menu"
                className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X size={20} aria-hidden="true" />
              </button>
              <div className="pt-12 flex flex-1 flex-col min-h-0">{nav}</div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main
        id="main-content"
        tabIndex={-1}
        className="px-4 pb-28 pt-6 outline-none sm:px-6 lg:ml-64 lg:px-10 lg:pt-10"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{title}</h1>
              {description && <p className="mt-1.5 text-muted-foreground">{description}</p>}
            </div>
            {headerActions && <div className="hidden items-center gap-2 lg:flex">{headerActions}</div>}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
};
