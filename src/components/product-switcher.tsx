"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { SidebarMenuButton, useSidebar } from "@/components/ui/sidebar";

const MODULE_LABELS: Record<string, string> = {
  lending: "Lending",
  capital: "Capital",
  deals: "Deals",
  syndication: "Syndication",
  compliance: "Compliance",
};

function useActiveModule(): string {
  const pathname = usePathname();
  const match = pathname.match(/^\/dashboard\/([^/]+)/);
  if (match && MODULE_LABELS[match[1]]) {
    return MODULE_LABELS[match[1]];
  }
  return "Suite";
}

/**
 * Dashboard sidebar header: HOME BUTTON.
 * Shows current module name below "OpenShut".
 */
export function ProductSwitcher() {
  const activeModule = useActiveModule();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <SidebarMenuButton size="lg" asChild className="h-auto py-3">
      <Link href="/dashboard" className="flex items-center gap-0">
        <Image
          src="/logo.png"
          alt="OpenShut"
          width={isCollapsed ? 32 : 80}
          height={isCollapsed ? 18 : 46}
          className={`flex-shrink-0 dark:invert ${isCollapsed ? "" : "-mr-3"}`}
        />
        {!isCollapsed && (
          <div className="flex flex-col gap-0 leading-none">
            <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent text-base font-bold tracking-tight">
              OpenShut
            </span>
            <span className="text-[10px] text-muted-foreground">
              {activeModule}
            </span>
          </div>
        )}
      </Link>
    </SidebarMenuButton>
  );
}

/**
 * Marketing nav logo: Simple link to homepage.
 */
export function MarketingLogo() {
  return (
    <Link href="/" className="flex items-center gap-0">
      <Image
        src="/logo.png"
        alt="OpenShut"
        width={72}
        height={42}
        className="flex-shrink-0 -mr-3 dark:invert"
      />
      <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent text-lg font-bold tracking-tight">
        OpenShut
      </span>
    </Link>
  );
}
