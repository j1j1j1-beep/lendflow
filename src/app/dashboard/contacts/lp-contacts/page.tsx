"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Plus,
  Search,
  X,
  Users,
  Loader2,
  Pencil,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type LPContact = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  investorType: string | null;
  accreditationStatus: string;
  accreditationDate: string | null;
  accreditationExpiry: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  taxId: string | null;
  notes: string | null;
  createdAt: string;
};

type FormData = {
  name: string;
  email: string;
  phone: string;
  company: string;
  investorType: string;
  accreditationStatus: string;
  accreditationDate: string;
  accreditationExpiry: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  taxId: string;
  notes: string;
};

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const INVESTOR_TYPE_LABELS: Record<string, string> = {
  ACCREDITED_INDIVIDUAL: "Accredited Individual",
  ACCREDITED_ENTITY: "Accredited Entity",
  QUALIFIED_PURCHASER: "Qualified Purchaser",
  INSTITUTIONAL: "Institutional",
  NON_ACCREDITED: "Non-Accredited",
};

const ACCREDITATION_STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  VERIFIED: { label: "Verified", variant: "default" },
  PENDING: { label: "Pending", variant: "secondary" },
  EXPIRED: { label: "Expired", variant: "destructive" },
  FAILED: { label: "Failed", variant: "destructive" },
};

const EMPTY_FORM: FormData = {
  name: "",
  email: "",
  phone: "",
  company: "",
  investorType: "",
  accreditationStatus: "PENDING",
  accreditationDate: "",
  accreditationExpiry: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  taxId: "",
  notes: "",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function maskTaxId(taxId: string | null): string {
  if (!taxId) return "--";
  if (taxId.length <= 4) return taxId;
  return "***-**-" + taxId.slice(-4);
}

function isAccreditationExpired(contact: LPContact): boolean {
  if (contact.accreditationStatus === "EXPIRED") return true;
  if (!contact.accreditationExpiry) return false;
  return new Date(contact.accreditationExpiry) < new Date();
}

function contactToForm(contact: LPContact): FormData {
  return {
    name: contact.name,
    email: contact.email ?? "",
    phone: contact.phone ?? "",
    company: contact.company ?? "",
    investorType: contact.investorType ?? "",
    accreditationStatus: contact.accreditationStatus,
    accreditationDate: contact.accreditationDate
      ? contact.accreditationDate.slice(0, 10)
      : "",
    accreditationExpiry: contact.accreditationExpiry
      ? contact.accreditationExpiry.slice(0, 10)
      : "",
    address: contact.address ?? "",
    city: contact.city ?? "",
    state: contact.state ?? "",
    zip: contact.zip ?? "",
    taxId: contact.taxId ?? "",
    notes: contact.notes ?? "",
  };
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function LPContactsPage() {
  const [contacts, setContacts] = useState<LPContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const isInitialLoad = useRef(true);

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<LPContact | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<LPContact | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ---------- Fetch ---------- */

  const fetchContacts = useCallback(
    async (cursor?: string) => {
      try {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (cursor) params.set("cursor", cursor);

        const res = await fetch(`/api/contacts/lp-contacts?${params}`);
        if (!res.ok) throw new Error("Failed to load contacts");
        const data = await res.json();

        if (cursor) {
          setContacts((prev) => [...prev, ...(data.contacts ?? [])]);
        } else {
          setContacts(data.contacts ?? []);
        }
        setNextCursor(data.nextCursor ?? null);
        setFetchError(null);
      } catch {
        setFetchError("Unable to load LP contacts. Please try again.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
        isInitialLoad.current = false;
      }
    },
    [debouncedSearch],
  );

  useEffect(() => {
    setLoading(true);
    fetchContacts();
  }, [fetchContacts]);

  /* ---------- Debounced search (300ms) ---------- */

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  /* ---------- Load more ---------- */

  const handleLoadMore = () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    fetchContacts(nextCursor);
  };

  /* ---------- Sheet open / close ---------- */

  const openAddSheet = () => {
    setEditingContact(null);
    setForm(EMPTY_FORM);
    setSheetOpen(true);
  };

  const openEditSheet = (contact: LPContact) => {
    setEditingContact(contact);
    setForm(contactToForm(contact));
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setEditingContact(null);
    setForm(EMPTY_FORM);
  };

  /* ---------- Save (create or update) ---------- */

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
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        zip: form.zip.trim() || null,
        taxId: form.taxId.trim() || null,
        notes: form.notes.trim() || null,
      };

      if (editingContact) {
        const res = await fetch(`/api/contacts/lp-contacts/${editingContact.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Update failed" }));
          throw new Error(err.error);
        }
        const data = await res.json();
        setContacts((prev) =>
          prev.map((c) => (c.id === editingContact.id ? data.contact : c)),
        );
        toast.success("Contact updated");
      } else {
        const res = await fetch("/api/contacts/lp-contacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Create failed" }));
          throw new Error(err.error);
        }
        const data = await res.json();
        setContacts((prev) => [data.contact, ...prev]);
        toast.success("Contact added");
      }
      closeSheet();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Delete ---------- */

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/contacts/lp-contacts/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      setContacts((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      toast.success("Contact deleted");
    } catch {
      toast.error("Failed to delete contact");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  /* ---------- Form field updater ---------- */

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  /* ---------- Render ---------- */

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">LP Contacts</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Manage limited partner contacts for capital calls, distributions, K-1
          reporting, and investor communications.
        </p>
      </div>

      {/* Search + Add */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-foreground" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-9 w-64 rounded-lg border border-border bg-background pl-9 pr-8 text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button size="sm" className="shadow-sm" onClick={openAddSheet}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add LP
        </Button>
      </div>

      {/* Content */}
      {loading && isInitialLoad.current ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : fetchError ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-destructive">{fetchError}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => fetchContacts()}
          >
            Retry
          </Button>
        </div>
      ) : contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">No LP contacts yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            Add limited partner contacts to manage capital calls, distributions,
            K-1 reporting, and investor communications.
          </p>
          <Button className="mt-6 shadow-sm" onClick={openAddSheet}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add LP
          </Button>
        </div>
      ) : (
        <>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead className="hidden md:table-cell">Company</TableHead>
                  <TableHead className="hidden lg:table-cell">Type</TableHead>
                  <TableHead>Accreditation</TableHead>
                  <TableHead className="hidden xl:table-cell">Tax ID</TableHead>
                  <TableHead className="hidden md:table-cell">Added</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => {
                  const expired = isAccreditationExpired(contact);
                  const statusCfg =
                    ACCREDITATION_STATUS_CONFIG[contact.accreditationStatus] ?? {
                      label: contact.accreditationStatus,
                      variant: "outline" as const,
                    };

                  return (
                    <TableRow
                      key={contact.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => openEditSheet(contact)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {contact.name}
                          {expired && contact.accreditationStatus !== "EXPIRED" && (
                            <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {contact.email ?? "--"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {contact.company ?? "--"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {contact.investorType
                          ? INVESTOR_TYPE_LABELS[contact.investorType] ?? contact.investorType
                          : "--"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={expired && contact.accreditationStatus !== "EXPIRED"
                            ? "destructive"
                            : statusCfg.variant}
                          className="text-[11px]"
                        >
                          {expired && contact.accreditationStatus !== "EXPIRED"
                            ? "Expired"
                            : statusCfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell text-muted-foreground font-mono text-xs">
                        {maskTaxId(contact.taxId)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-xs">
                        {formatDate(contact.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditSheet(contact);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(contact);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
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
      <Sheet open={sheetOpen} onOpenChange={(open) => !open && closeSheet()}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {editingContact ? "Edit LP Contact" : "Add LP Contact"}
            </SheetTitle>
            <SheetDescription>
              {editingContact
                ? "Update the limited partner's information."
                : "Add a new limited partner contact."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-4 px-4 pb-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="lp-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lp-name"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="John Doe"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="lp-email">Email</Label>
              <Input
                id="lp-email"
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="john@example.com"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="lp-phone">Phone</Label>
              <Input
                id="lp-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>

            {/* Company */}
            <div className="space-y-1.5">
              <Label htmlFor="lp-company">Company</Label>
              <Input
                id="lp-company"
                value={form.company}
                onChange={(e) => updateField("company", e.target.value)}
                placeholder="Acme Capital LLC"
              />
            </div>

            {/* Investor Type */}
            <div className="space-y-1.5">
              <Label>Investor Type</Label>
              <Select
                value={form.investorType}
                onValueChange={(v) => updateField("investorType", v)}
              >
                <SelectTrigger>
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

            {/* Accreditation Status */}
            <div className="space-y-1.5">
              <Label>Accreditation Status</Label>
              <Select
                value={form.accreditationStatus}
                onValueChange={(v) => updateField("accreditationStatus", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ACCREDITATION_STATUS_CONFIG).map(
                    ([value, { label }]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Accreditation Date */}
            <div className="space-y-1.5">
              <Label htmlFor="lp-accred-date">Accreditation Date</Label>
              <Input
                id="lp-accred-date"
                type="date"
                value={form.accreditationDate}
                onChange={(e) => updateField("accreditationDate", e.target.value)}
              />
            </div>

            {/* Accreditation Expiry */}
            <div className="space-y-1.5">
              <Label htmlFor="lp-accred-expiry">Accreditation Expiry</Label>
              <Input
                id="lp-accred-expiry"
                type="date"
                value={form.accreditationExpiry}
                onChange={(e) =>
                  updateField("accreditationExpiry", e.target.value)
                }
              />
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <Label htmlFor="lp-address">Address</Label>
              <Input
                id="lp-address"
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder="123 Main St"
              />
            </div>

            {/* City / State / Zip */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="lp-city">City</Label>
                <Input
                  id="lp-city"
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lp-state">State</Label>
                <Input
                  id="lp-state"
                  value={form.state}
                  onChange={(e) => updateField("state", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lp-zip">Zip</Label>
                <Input
                  id="lp-zip"
                  value={form.zip}
                  onChange={(e) => updateField("zip", e.target.value)}
                />
              </div>
            </div>

            {/* Tax ID */}
            <div className="space-y-1.5">
              <Label htmlFor="lp-taxid">Tax ID (SSN / EIN)</Label>
              <Input
                id="lp-taxid"
                value={form.taxId}
                onChange={(e) => updateField("taxId", e.target.value)}
                placeholder="XXX-XX-XXXX"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="lp-notes">Notes</Label>
              <Textarea
                id="lp-notes"
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="Internal notes..."
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                className="flex-1"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Saving...
                  </>
                ) : editingContact ? (
                  "Save Changes"
                ) : (
                  "Add Contact"
                )}
              </Button>
              <Button variant="outline" onClick={closeSheet} disabled={saving}>
                Cancel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete LP Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.name}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
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
