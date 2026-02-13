"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Plus,
  Search,
  X,
  Users,
  Loader2,
  Trash2,
  AlertTriangle,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Investor = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  investorType: string | null;
  accreditationStatus: string;
  accreditationDate: string | null;
  accreditationExpiry: string | null;
  accreditationMethod: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  preferredMinInvestment: string | null;
  preferredMaxInvestment: string | null;
  preferredFundTypes: string[] | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type InvestorForm = {
  name: string;
  email: string;
  phone: string;
  company: string;
  investorType: string;
  accreditationStatus: string;
  accreditationDate: string;
  accreditationExpiry: string;
  accreditationMethod: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  preferredMinInvestment: string;
  preferredMaxInvestment: string;
  notes: string;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EMPTY_FORM: InvestorForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
  investorType: "",
  accreditationStatus: "PENDING",
  accreditationDate: "",
  accreditationExpiry: "",
  accreditationMethod: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  preferredMinInvestment: "",
  preferredMaxInvestment: "",
  notes: "",
};

const INVESTOR_TYPE_LABELS: Record<string, string> = {
  ACCREDITED_INDIVIDUAL: "Accredited Individual",
  ACCREDITED_ENTITY: "Accredited Entity",
  QUALIFIED_PURCHASER: "Qualified Purchaser",
  INSTITUTIONAL: "Institutional",
  NON_ACCREDITED: "Non-Accredited",
};

const ACCREDITATION_STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  VERIFIED: {
    label: "Verified",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  PENDING: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  EXPIRED: {
    label: "Expired",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
  FAILED: {
    label: "Failed",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: string | null): string {
  if (!value) return "--";
  const num = Number(value);
  if (isNaN(num)) return "--";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "--";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/** Returns true when expiry is within 30 days or already past */
function isExpiringOrExpired(expiryStr: string | null): boolean {
  if (!expiryStr) return false;
  const expiry = new Date(expiryStr);
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  return expiry <= thirtyDaysFromNow;
}

function investorToForm(inv: Investor): InvestorForm {
  return {
    name: inv.name,
    email: inv.email ?? "",
    phone: inv.phone ?? "",
    company: inv.company ?? "",
    investorType: inv.investorType ?? "",
    accreditationStatus: inv.accreditationStatus,
    accreditationDate: inv.accreditationDate
      ? inv.accreditationDate.slice(0, 10)
      : "",
    accreditationExpiry: inv.accreditationExpiry
      ? inv.accreditationExpiry.slice(0, 10)
      : "",
    accreditationMethod: inv.accreditationMethod ?? "",
    address: inv.address ?? "",
    city: inv.city ?? "",
    state: inv.state ?? "",
    zip: inv.zip ?? "",
    preferredMinInvestment: inv.preferredMinInvestment ?? "",
    preferredMaxInvestment: inv.preferredMaxInvestment ?? "",
    notes: inv.notes ?? "",
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function InvestorsPage() {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const isInitialLoad = useRef(true);

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingInvestor, setEditingInvestor] = useState<Investor | null>(null);
  const [form, setForm] = useState<InvestorForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Investor | null>(null);
  const [deleting, setDeleting] = useState(false);

  // -------------------------------------------------------------------------
  // Fetch investors
  // -------------------------------------------------------------------------

  const fetchInvestors = useCallback(
    async (cursor?: string) => {
      try {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (cursor) params.set("cursor", cursor);

        const res = await fetch(`/api/contacts/investors?${params}`);
        if (!res.ok) throw new Error("Failed to load investors");
        const data = await res.json();

        if (cursor) {
          setInvestors((prev) => [...prev, ...(data.investors ?? [])]);
        } else {
          setInvestors(data.investors ?? []);
        }
        setNextCursor(data.nextCursor ?? null);
        setFetchError(null);
      } catch {
        setFetchError("Unable to load investors. Please try again.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
        isInitialLoad.current = false;
      }
    },
    [debouncedSearch]
  );

  useEffect(() => {
    setLoading(true);
    fetchInvestors();
  }, [fetchInvestors]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleLoadMore = () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    fetchInvestors(nextCursor);
  };

  // -------------------------------------------------------------------------
  // Create / Update
  // -------------------------------------------------------------------------

  const openAddSheet = () => {
    setEditingInvestor(null);
    setForm(EMPTY_FORM);
    setSheetOpen(true);
  };

  const openEditSheet = (inv: Investor) => {
    setEditingInvestor(inv);
    setForm(investorToForm(inv));
    setSheetOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        company: form.company.trim() || null,
        investorType: form.investorType || null,
        accreditationStatus: form.accreditationStatus || "PENDING",
        accreditationDate: form.accreditationDate || null,
        accreditationExpiry: form.accreditationExpiry || null,
        accreditationMethod: form.accreditationMethod.trim() || null,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        zip: form.zip.trim() || null,
        preferredMinInvestment: form.preferredMinInvestment
          ? Number(form.preferredMinInvestment)
          : null,
        preferredMaxInvestment: form.preferredMaxInvestment
          ? Number(form.preferredMaxInvestment)
          : null,
        notes: form.notes.trim() || null,
      };

      if (editingInvestor) {
        const res = await fetch(`/api/contacts/investors/${editingInvestor.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to update investor");
        }
        const data = await res.json();
        setInvestors((prev) =>
          prev.map((inv) =>
            inv.id === editingInvestor.id ? data.investor : inv
          )
        );
        toast.success("Investor updated");
      } else {
        const res = await fetch("/api/contacts/investors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to create investor");
        }
        const data = await res.json();
        setInvestors((prev) => [data.investor, ...prev]);
        toast.success("Investor added");
      }

      setSheetOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  // -------------------------------------------------------------------------
  // Delete
  // -------------------------------------------------------------------------

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/contacts/investors/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete investor");
      setInvestors((prev) => prev.filter((inv) => inv.id !== deleteTarget.id));
      toast.success("Investor deleted");
    } catch {
      toast.error("Failed to delete investor");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  // -------------------------------------------------------------------------
  // Form field updater
  // -------------------------------------------------------------------------

  const updateField = (field: keyof InvestorForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Investors</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your investor directory for Capital and Syndication projects.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search investors..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-9 w-72 rounded-lg border border-border bg-background pl-9 pr-8 text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-150"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          size="sm"
          onClick={openAddSheet}
          className="transition-all duration-200 hover:shadow-md"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add Investor
        </Button>
      </div>

      {/* Content */}
      {loading && isInitialLoad.current ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      ) : fetchError ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-destructive">{fetchError}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 transition-all duration-200"
            onClick={() => fetchInvestors()}
          >
            Retry
          </Button>
        </div>
      ) : investors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4 transition-transform duration-300 hover:scale-105">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">No investors yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            Add your first investor to start building your investor directory
            for Capital and Syndication projects.
          </p>
          <Button
            onClick={openAddSheet}
            className="mt-6 transition-all duration-200 hover:shadow-md"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Investor
          </Button>
        </div>
      ) : (
        <>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Accreditation</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {investors.map((inv) => {
                  const statusConfig = ACCREDITATION_STATUS_CONFIG[
                    inv.accreditationStatus
                  ] ?? { label: inv.accreditationStatus, className: "" };
                  const expiring = isExpiringOrExpired(inv.accreditationExpiry);

                  return (
                    <TableRow
                      key={inv.id}
                      className="cursor-pointer"
                      onClick={() => openEditSheet(inv)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {inv.name}
                          {expiring && (
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {inv.email ?? "--"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {inv.company ?? "--"}
                      </TableCell>
                      <TableCell>
                        {inv.investorType ? (
                          <Badge variant="secondary" className="text-[11px] font-normal">
                            {INVESTOR_TYPE_LABELS[inv.investorType] ?? inv.investorType}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">--</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-[11px] font-medium border-0 ${statusConfig.className}`}
                        >
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {formatShortDate(inv.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditSheet(inv);
                            }}
                            className="p-1 rounded hover:bg-muted transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(inv);
                            }}
                            className="p-1 rounded hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {nextCursor && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load more"
                )}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Add / Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>
              {editingInvestor ? "Edit Investor" : "Add Investor"}
            </SheetTitle>
            <SheetDescription>
              {editingInvestor
                ? "Update investor details below."
                : "Fill in investor details below. Only name is required."}
            </SheetDescription>
          </SheetHeader>

          <div className="grid gap-4 px-4 pb-4">
            {/* Name */}
            <div className="grid gap-1.5">
              <Label htmlFor="inv-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="inv-name"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Jane Smith"
              />
            </div>

            {/* Email + Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="inv-email">Email</Label>
                <Input
                  id="inv-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="jane@example.com"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="inv-phone">Phone</Label>
                <Input
                  id="inv-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            {/* Company */}
            <div className="grid gap-1.5">
              <Label htmlFor="inv-company">Company</Label>
              <Input
                id="inv-company"
                value={form.company}
                onChange={(e) => updateField("company", e.target.value)}
                placeholder="Acme Capital LLC"
              />
            </div>

            {/* Investor Type + Accreditation Status */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Investor Type</Label>
                <Select
                  value={form.investorType}
                  onValueChange={(val) => updateField("investorType", val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(INVESTOR_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Accreditation Status</Label>
                <Select
                  value={form.accreditationStatus}
                  onValueChange={(val) =>
                    updateField("accreditationStatus", val)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ACCREDITATION_STATUS_CONFIG).map(
                      ([value, cfg]) => (
                        <SelectItem key={value} value={value}>
                          {cfg.label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Accreditation Date + Expiry */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="inv-accred-date">Accreditation Date</Label>
                <Input
                  id="inv-accred-date"
                  type="date"
                  value={form.accreditationDate}
                  onChange={(e) =>
                    updateField("accreditationDate", e.target.value)
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="inv-accred-expiry">Accreditation Expiry</Label>
                <Input
                  id="inv-accred-expiry"
                  type="date"
                  value={form.accreditationExpiry}
                  onChange={(e) =>
                    updateField("accreditationExpiry", e.target.value)
                  }
                />
              </div>
            </div>

            {/* Accreditation Method */}
            <div className="grid gap-1.5">
              <Label htmlFor="inv-accred-method">Accreditation Method</Label>
              <Input
                id="inv-accred-method"
                value={form.accreditationMethod}
                onChange={(e) =>
                  updateField("accreditationMethod", e.target.value)
                }
                placeholder="Third-party verification letter"
              />
            </div>

            {/* Address */}
            <div className="grid gap-1.5">
              <Label htmlFor="inv-address">Address</Label>
              <Input
                id="inv-address"
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder="123 Main St"
              />
            </div>

            {/* City, State, Zip */}
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="inv-city">City</Label>
                <Input
                  id="inv-city"
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  placeholder="New York"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="inv-state">State</Label>
                <Input
                  id="inv-state"
                  value={form.state}
                  onChange={(e) => updateField("state", e.target.value)}
                  placeholder="NY"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="inv-zip">Zip</Label>
                <Input
                  id="inv-zip"
                  value={form.zip}
                  onChange={(e) => updateField("zip", e.target.value)}
                  placeholder="10001"
                />
              </div>
            </div>

            {/* Investment range */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="inv-min">Min Investment ($)</Label>
                <Input
                  id="inv-min"
                  type="number"
                  min="0"
                  step="1000"
                  value={form.preferredMinInvestment}
                  onChange={(e) =>
                    updateField("preferredMinInvestment", e.target.value)
                  }
                  placeholder="100000"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="inv-max">Max Investment ($)</Label>
                <Input
                  id="inv-max"
                  type="number"
                  min="0"
                  step="1000"
                  value={form.preferredMaxInvestment}
                  onChange={(e) =>
                    updateField("preferredMaxInvestment", e.target.value)
                  }
                  placeholder="1000000"
                />
              </div>
            </div>

            {/* Investment range display */}
            {(form.preferredMinInvestment || form.preferredMaxInvestment) && (
              <p className="text-xs text-muted-foreground -mt-2">
                Range: {formatCurrency(form.preferredMinInvestment || null)}
                {" - "}
                {formatCurrency(form.preferredMaxInvestment || null)}
              </p>
            )}

            {/* Notes */}
            <div className="grid gap-1.5">
              <Label htmlFor="inv-notes">Notes</Label>
              <Textarea
                id="inv-notes"
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="Additional notes about this investor..."
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Saving...
                  </>
                ) : editingInvestor ? (
                  "Update Investor"
                ) : (
                  "Add Investor"
                )}
              </Button>
              {editingInvestor && (
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => {
                    setSheetOpen(false);
                    setDeleteTarget(editingInvestor);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Expiring warning in edit mode */}
            {editingInvestor &&
              isExpiringOrExpired(editingInvestor.accreditationExpiry) && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-3">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                      Accreditation expiring soon
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                      Expires{" "}
                      {formatDate(editingInvestor.accreditationExpiry)}.
                      Update the accreditation status and dates.
                    </p>
                  </div>
                </div>
              )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete investor?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.name}
              </span>{" "}
              from your investor directory. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
