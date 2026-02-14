"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignInButton, useUser } from "@clerk/nextjs";
import { Menu, X, ChevronDown, LayoutDashboard } from "lucide-react";
import {
  Landmark,
  Building2,
  Handshake,
  Building,
  ShieldCheck,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { MarketingLogo } from "@/components/product-switcher";

const PRODUCTS = [
  { href: "/lending", label: "Lending", icon: Landmark, desc: "Loan packages for 14 programs" },
  { href: "/capital", label: "Capital", icon: Building2, desc: "Fund formation documents" },
  { href: "/deals", label: "Deals / M&A", icon: Handshake, desc: "Acquisition docs, LOI to close" },
  { href: "/syndication", label: "Syndication", icon: Building, desc: "Real estate investor docs" },
  { href: "/compliance", label: "Compliance", icon: ShieldCheck, desc: "LP reports and fund admin" },
];

const NAV_LINKS = [
  { href: "/platform", label: "Platform" },
  { href: "/pricing", label: "Pricing" },
];

export function MarketingNav() {
  const pathname = usePathname();
  const { isSignedIn } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProductsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="w-full border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <MarketingLogo />
          <div className="hidden md:flex items-center gap-1">
            {/* Products Dropdown */}
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setProductsOpen(!productsOpen)}
                className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  productsOpen || pathname.startsWith("/lending") || pathname.startsWith("/capital") || pathname.startsWith("/deals") || pathname.startsWith("/syndication") || pathname.startsWith("/compliance")
                    ? "text-foreground bg-muted"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                Products
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${productsOpen ? "rotate-180" : ""}`} />
              </button>

              {productsOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 rounded-xl border bg-card p-2 shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
                  {PRODUCTS.map((product) => (
                    <Link
                      key={product.href}
                      href={product.href}
                      onClick={() => setProductsOpen(false)}
                      className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted"
                    >
                      <product.icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-foreground">{product.label}</div>
                        <div className="text-xs text-muted-foreground">{product.desc}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "text-foreground bg-muted"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3">
          {isSignedIn ? (
            <Link
              href="/dashboard"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary/90 hover:shadow-md"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          ) : (
            <>
              <SignInButton mode="modal">
                <button className="inline-flex h-9 items-center justify-center rounded-lg px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                  Sign In
                </button>
              </SignInButton>
              <SignInButton mode="modal">
                <button className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary/90 hover:shadow-md">
                  Try It Free
                </button>
              </SignInButton>
            </>
          )}
        </div>

        <button
          className="md:hidden p-2 text-muted-foreground hover:text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 bg-background px-6 pb-4 pt-2">
          <div className="flex flex-col gap-1">
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Products
            </div>
            {PRODUCTS.map((product) => (
              <Link
                key={product.href}
                href={product.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/50"
              >
                <product.icon className="h-4 w-4 text-primary" />
                {product.label}
              </Link>
            ))}
            <div className="my-1 border-t border-border/50" />
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "text-foreground bg-muted"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {isSignedIn ? (
              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary/90"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            ) : (
              <>
                <SignInButton mode="modal">
                  <button className="w-full rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                    Sign In
                  </button>
                </SignInButton>
                <SignInButton mode="modal">
                  <button className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary/90">
                    Try It Free
                  </button>
                </SignInButton>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
