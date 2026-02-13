"use client";

import { useEffect, useState, useCallback, useRef, FormEvent } from "react";
import {
  Plus,
  Search,
  X,
  Users,
  Loader2,
  Pencil,
  Trash2,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
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

/* ---------- Types ---------- */

type BuyerSeller = {
  id: string;
  name: string;
  role: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  entityName: string | null;
  counsel: string | null;
  industry: string | null;
  stateOfIncorp: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type FormData = {
  name: string;
  role: string;
  email: string;
  phone: string;
  company: string;
  entityName: string;
  counsel: string;
  industry: string;
  stateOfIncorp: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes: string;
};

const EMPTY_FORM: FormData = {
  name: "",
  role: "buyer",
  email: "",
  phone: "",
  company: "",
  entityName: "",
  counsel: "",
  industry: "",
  stateOfIncorp: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  notes: "",
};

/* ---------- Constants ---------- */

const ROLE_TABS = [
  { label: "All", value: "all" },
  { label: "Buyers", value: "buyer" },
  { label: "Sellers", value: "seller" },
  { label: "Both", value: "both" },
] as const;

const ROLE_BADGE: Record<string, { label: string; className: string }> = {
  buyer: { label: "Buyer", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800" },
  seller: { label: "Seller", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200 dark:border-orange-800" },
  both: { label: "Both", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800" },
};

/* ---------- Helpers ---------- */

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function contactFromForm(form: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, val] of Object.entries(form)) {
    if (val.trim()) out[key] = val.trim();
  }
  // role always present
  out.role = form.role;
  return out;
}

/* ---------- Page ---------- */

export default function BuyerSellersPage() {
  const [contacts, setContacts] = useState<BuyerSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const isInitialLoad = useRef(true);

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<BuyerSeller | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<BuyerSeller | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* Debounce search */
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  /* Fetch contacts */
  const fetchContacts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/contacts/buyer-sellers?${params}`);
      if (!res.ok) throw new Error("Failed to load contacts");
      const data = await res.json();
      setContacts(data.contacts ?? []);
      setFetchError(null);
    } catch {
      setFetchError("Unable to load contacts. Please try again.");
    } finally {
      setLoading(false);
      isInitialLoad.current = false;
    }
  }, [roleFilter, debouncedSearch]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  /* Open add sheet */
  function openAdd() {
    setEditingContact(null);
    setForm(EMPTY_FORM);
    setSheetOpen(true);
  }

  /* Open edit sheet */
  function openEdit(contact: BuyerSeller) {
    setEditingContact(contact);
    setForm({
      name: contact.name,
      role: contact.role,
      email: contact.email ?? "",
      phone: contact.phone ?? "",
      company: contact.company ?? "",
      entityName: contact.entityName ?? "",
      counsel: contact.counsel ?? "",
      industry: contact.industry ?? "",
      stateOfIncorp: contact.stateOfIncorp ?? "",
      address: contact.address ?? "",
      city: contact.city ?? "",
      state: contact.state ?? "",
      zip: contact.zip ?? "",
      notes: contact.notes ?? "",
    });
    setSheetOpen(true);
  }

  /* Save (create or update) */
  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }

    setSaving(true);
    try {
      const payload = contactFromForm(form);

      if (editingContact) {
        // PATCH
        const res = await fetch(`/api/contacts/buyer-sellers/${editingContact.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Update failed" }));
          throw new Error(err.error ?? "Update failed");
        }
        toast.success("Contact updated");
      } else {
        // POST
        const res = await fetch("/api/contacts/buyer-sellers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Create failed" }));
          throw new Error(err.error ?? "Create failed");
        }
        toast.success("Contact added");
      }

      setSheetOpen(false);
      fetchContacts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  /* Delete */
  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/contacts/buyer-sellers/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Contact deleted");
      setDeleteTarget(null);
      fetchContacts();
    } catch {
      toast.error("Failed to delete contact");
    } finally {
      setDeleting(false);
    }
  }

  /* Form field updater */
  function updateField(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Buyer & Seller Contacts</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Manage buyer and seller contacts for your M&A transactions.
        </p>
      </div>

      {/* Filters + Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          {ROLE_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setRoleFilter(tab.value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                roleFilter === tab.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-9 w-64 rounded-lg border border-border bg-background pl-9 pr-8 text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
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
          <Button size="sm" className="gap-1.5 shadow-sm" onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading && isInitialLoad.current ? (
        /* Skeleton loading */
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      ) : fetchError ? (
        /* Error state */
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-destructive">{fetchError}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={fetchContacts}
          >
            Retry
          </Button>
        </div>
      ) : contacts.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">No contacts yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            {debouncedSearch || roleFilter !== "all"
              ? "No contacts match your current filters."
              : "Add your first buyer or seller contact to get started."}
          </p>
          {!debouncedSearch && roleFilter === "all" && (
            <Button className="mt-6 gap-1.5" onClick={openAdd}>
              <Plus className="h-4 w-4" />
              Add Contact
            </Button>
          )}
        </div>
      ) : (
        /* Table */
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="hidden md:table-cell">Company</TableHead>
                <TableHead className="hidden lg:table-cell">Entity Name</TableHead>
                <TableHead className="hidden lg:table-cell">Counsel</TableHead>
                <TableHead className="hidden xl:table-cell">Industry</TableHead>
                <TableHead className="hidden sm:table-cell">Added</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => {
                const badge = ROLE_BADGE[contact.role] ?? ROLE_BADGE.buyer;
                return (
                  <TableRow
                    key={contact.id}
                    className="cursor-pointer"
                    onClick={() => openEdit(contact)}
                  >
                    <TableCell className="font-medium">
                      <div>
                        <span className="block truncate max-w-[200px]">{contact.name}</span>
                        {contact.email && (
                          <span className="block text-xs text-muted-foreground truncate max-w-[200px]">
                            {contact.email}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[11px] ${badge.className}`}>
                        {badge.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {contact.company || "--"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {contact.entityName || "--"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {contact.counsel || "--"}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-muted-foreground">
                      {contact.industry || "--"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(contact.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(contact);
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
      )}

      {/* Add / Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingContact ? "Edit Contact" : "Add Contact"}</SheetTitle>
            <SheetDescription>
              {editingContact
                ? "Update the contact details below."
                : "Fill in the details for a new buyer or seller contact."}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSave} className="flex flex-col gap-4 px-1 mt-4">
            {/* Name (required) */}
            <div className="space-y-1.5">
              <Label htmlFor="bs-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="bs-name"
                placeholder="Jane Doe or Acme Corp"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                required
              />
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => updateField("role", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buyer">Buyer</SelectItem>
                  <SelectItem value="seller">Seller</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Email + Phone row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="bs-email">Email</Label>
                <Input
                  id="bs-email"
                  type="email"
                  placeholder="jane@acme.com"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bs-phone">Phone</Label>
                <Input
                  id="bs-phone"
                  placeholder="(555) 555-1234"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                />
              </div>
            </div>

            {/* Company + Entity Name */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="bs-company">Company</Label>
                <Input
                  id="bs-company"
                  placeholder="Acme Corp"
                  value={form.company}
                  onChange={(e) => updateField("company", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bs-entityName">Entity Name</Label>
                <Input
                  id="bs-entityName"
                  placeholder="Acme Holdings LLC"
                  value={form.entityName}
                  onChange={(e) => updateField("entityName", e.target.value)}
                />
              </div>
            </div>

            {/* Counsel */}
            <div className="space-y-1.5">
              <Label htmlFor="bs-counsel">Counsel</Label>
              <Input
                id="bs-counsel"
                placeholder="Smith & Wesson LLP"
                value={form.counsel}
                onChange={(e) => updateField("counsel", e.target.value)}
              />
            </div>

            {/* Industry + State of Incorp */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="bs-industry">Industry</Label>
                <Input
                  id="bs-industry"
                  placeholder="Technology"
                  value={form.industry}
                  onChange={(e) => updateField("industry", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bs-stateOfIncorp">State of Incorp.</Label>
                <Input
                  id="bs-stateOfIncorp"
                  placeholder="Delaware"
                  value={form.stateOfIncorp}
                  onChange={(e) => updateField("stateOfIncorp", e.target.value)}
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <Label htmlFor="bs-address">Address</Label>
              <Input
                id="bs-address"
                placeholder="123 Main St"
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
              />
            </div>

            {/* City + State + Zip */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="bs-city">City</Label>
                <Input
                  id="bs-city"
                  placeholder="New York"
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bs-state">State</Label>
                <Input
                  id="bs-state"
                  placeholder="NY"
                  value={form.state}
                  onChange={(e) => updateField("state", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bs-zip">Zip</Label>
                <Input
                  id="bs-zip"
                  placeholder="10001"
                  value={form.zip}
                  onChange={(e) => updateField("zip", e.target.value)}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="bs-notes">Notes</Label>
              <Textarea
                id="bs-notes"
                placeholder="Additional notes..."
                rows={3}
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
              />
            </div>

            <SheetFooter className="mt-2">
              <Button type="submit" disabled={saving} className="gap-1.5">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingContact ? "Save Changes" : "Add Contact"}
              </Button>
            </SheetFooter>
          </form>
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
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">{deleteTarget?.name}</span>?
              This action can be undone by an administrator.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5"
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
