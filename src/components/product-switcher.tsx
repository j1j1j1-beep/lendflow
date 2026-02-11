"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Landmark, FlaskConical, ChevronsUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton } from "@/components/ui/sidebar";

export type Product = "lending" | "bio";

export function useActiveProduct(): Product {
  const pathname = usePathname();
  if (pathname.includes("/bio")) return "bio";
  return "lending";
}

const PRODUCTS = {
  lending: {
    label: "Lending",
    icon: Landmark,
    iconBg: "bg-sidebar-accent text-sidebar-accent-foreground",
    dashboardHref: "/dashboard",
    marketingHref: "/",
  },
  bio: {
    label: "Bio",
    icon: FlaskConical,
    iconBg: "bg-emerald-600 text-white",
    dashboardHref: "/dashboard/bio",
    marketingHref: "/bio",
  },
} as const;

const PRODUCT_KEYS: Product[] = ["lending", "bio"];

/**
 * Dashboard sidebar header: HOME BUTTON.
 * Always links back to the dashboard for the active product. No dropdown.
 */
export function ProductSwitcher() {
  const activeProduct = useActiveProduct();
  const current = PRODUCTS[activeProduct];
  const CurrentIcon = current.icon;

  return (
    <SidebarMenuButton size="lg" asChild>
      <Link href={current.dashboardHref} className="flex items-center gap-3">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${current.iconBg} shadow-sm`}>
          <CurrentIcon className="h-4 w-4" />
        </div>
        <div className="flex flex-col gap-0.5 leading-none">
          <span className="font-semibold tracking-tight">OpenShut</span>
          <span className="text-xs text-muted-foreground">{current.label}</span>
        </div>
      </Link>
    </SidebarMenuButton>
  );
}

/**
 * Marketing nav logo: DROPDOWN to explore/switch between products.
 * On the landing page, users can click to see both Lending and Bio options.
 */
export function MarketingLogo() {
  const activeProduct = useActiveProduct();
  const current = PRODUCTS[activeProduct];
  const CurrentIcon = current.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2.5 outline-none">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${current.iconBg}`}>
          <CurrentIcon className="h-4 w-4" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-lg font-semibold tracking-tight text-foreground">
            OpenShut
          </span>
          <span className="text-[10px] text-muted-foreground">{current.label}</span>
        </div>
        <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground ml-1" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={8} className="min-w-56">
        {PRODUCT_KEYS.map((key) => {
          const product = PRODUCTS[key];
          const Icon = product.icon;
          const isActive = key === activeProduct;

          return (
            <DropdownMenuItem
              key={key}
              asChild={!isActive}
              className={`gap-3 p-2.5 ${isActive ? "bg-accent" : ""}`}
            >
              {isActive ? (
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${product.iconBg}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold">OpenShut</span>
                    <span className="text-xs text-muted-foreground">{product.label}</span>
                  </div>
                </div>
              ) : (
                <Link href={product.marketingHref} className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${product.iconBg}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold">OpenShut</span>
                    <span className="text-xs text-muted-foreground">{product.label}</span>
                  </div>
                </Link>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
