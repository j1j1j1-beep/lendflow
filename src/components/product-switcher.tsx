"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarMenuButton } from "@/components/ui/sidebar";

export function useActiveProduct() {
  const pathname = usePathname();
  void pathname;
  return "lending" as const;
}

/**
 * Briefcase mid-close icon — tilted, lid partially shutting.
 * Represents "OpenShut" — a deal in the middle of closing.
 */
function BriefcaseLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ transform: "rotate(-12deg) perspective(400px) rotateY(-8deg)" }}
    >
      {/* Handle */}
      <path d="M8 6V4.5A2.5 2.5 0 0 1 10.5 2h3A2.5 2.5 0 0 1 16 4.5V6" />
      {/* Body */}
      <rect x="2" y="9" width="20" height="11" rx="2" />
      {/* Lid — partially closing (tilted down from open) */}
      <path d="M2 11 L2 9.5 A2 2 0 0 1 4 7.5 L20 6.5 A2 2 0 0 1 22 8.5 L22 11" />
      {/* Latch */}
      <path d="M10 14h4" />
    </svg>
  );
}

/**
 * Dashboard sidebar header: HOME BUTTON.
 * Links back to the dashboard. No dropdown.
 */
export function ProductSwitcher() {
  return (
    <SidebarMenuButton size="lg" asChild>
      <Link href="/dashboard" className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-accent-foreground shadow-sm">
          <BriefcaseLogo className="h-5 w-5" />
        </div>
        <div className="flex flex-col gap-0.5 leading-none">
          <span className="font-semibold tracking-tight">OpenShut</span>
          <span className="text-xs text-muted-foreground">Suite</span>
        </div>
      </Link>
    </SidebarMenuButton>
  );
}

/**
 * Marketing nav logo: Simple link to homepage.
 */
export function MarketingLogo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <BriefcaseLogo className="h-5 w-5" />
      </div>
      <span className="text-lg font-semibold tracking-tight text-foreground">
        OpenShut
      </span>
    </Link>
  );
}
