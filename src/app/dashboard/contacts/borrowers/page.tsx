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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Borrower = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  entityType: string | null;
  einOrSsn: string | null;
  creditScore: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

const ENTITY_TYPES = [
  { label: "Individual", value: "individual" },
  { label: "LLC", value: "llc" },
  { label: "Corporation", value: "corporation" },
  { label: "Partnership", value: "partnership" },
  { label: "Trust", value: "trust" },
] as const;

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  company: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  entityType: "",
  einOrSsn: "",
  creditScore: "",
  notes: "",
};

export default function BorrowersPage() {
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Search
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingBorrower, setEditingBorrower] = useState<Borrower | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Borrower | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Cursor pagination
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const isInitialLoad = useRef(true);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchBorrowers = useCallback(
    async (cursor?: string) => {
      try {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (cursor) params.set("cursor", cursor);

        const res = await fetch(`/api/contacts/borrowers?${params}`);
        if (!res.ok) throw new Error("Failed to load borrowers");
        const data = await res.json();

        if (cursor) {
          setBorrowers((prev) => [...prev, ...data.borrowers]);
        } else {
          setBorrowers(data.borrowers ?? []);
        }
        setNextCursor(data.nextCursor ?? null);
        setFetchError(null);
      } catch {
        setFetchError("Unable to load borrowers. Please try again.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
        isInitialLoad.current = false;
      }
    },
    [debouncedSearch]
  );

  // Initial load + search changes
  useEffect(() => {
    setLoading(true);
    fetchBorrowers();
  }, [fetchBorrowers]);

  const handleLoadMore = () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    fetchBorrowers(nextCursor);
  };

  // Open sheet for creating
  const handleAdd = () => {
    setEditingBorrower(null);
    setForm(EMPTY_FORM);
    setSheetOpen(true);
  };

  // Open sheet for editing
  const handleEdit = (borrower: Borrower) => {
    setEditingBorrower(borrower);
    setForm({
      name: borrower.name,
      email: borrower.email ?? "",
      phone: borrower.phone ?? "",
      company: borrower.company ?? "",
      address: borrower.address ?? "",
      city: borrower.city ?? "",
      state: borrower.state ?? "",
      zip: borrower.zip ?? "",
      entityType: borrower.entityType ?? "",
      einOrSsn: borrower.einOrSsn ?? "",
      creditScore: borrower.creditScore != null ? String(borrower.creditScore) : "",
      notes: borrower.notes ?? "",
    });
    setSheetOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        company: form.company || null,
        address: form.address || null,
        city: form.city || null,
        state: form.state || null,
        zip: form.zip || null,
        entityType: form.entityType || null,
        einOrSsn: form.einOrSsn || null,
        creditScore: form.creditScore ? Number(form.creditScore) : null,
        notes: form.notes || null,
      };

      if (editingBorrower) {
        // Update
        const res = await fetch(`/api/contacts/borrowers/${editingBorrower.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to update borrower");
        }
        const { borrower } = await res.json();
        setBorrowers((prev) =>
          prev.map((b) => (b.id === borrower.id ? borrower : b))
        );
        toast.success("Borrower updated");
      } else {
        // Create
        const res = await fetch("/api/contacts/borrowers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to create borrower");
        }
        const { borrower } = await res.json();
        setBorrowers((prev) => [borrower, ...prev]);
        toast.success("Borrower added");
      }

      setSheetOpen(false);
      setEditingBorrower(null);
      setForm(EMPTY_FORM);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong", {
        duration: 8000,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/contacts/borrowers/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete borrower");
      }
      setBorrowers((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      toast.success("Borrower deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong", {
        duration: 8000,
      });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const updateField = (field: keyof typeof EMPTY_FORM, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const formatEntityType = (type: string | null) => {
    if (!type) return null;
    const found = ENTITY_TYPES.find((e) => e.value === type);
    return found ? found.label : type;
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Borrowers</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your borrower contacts. Add, edit, and organize borrower information across all your deals.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, or company..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-9 w-80 rounded-lg border border-border bg-background pl-9 pr-8 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button size="sm" onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add Borrower
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
            className="mt-4"
            onClick={() => fetchBorrowers()}
          >
            Retry
          </Button>
        </div>
      ) : borrowers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">No borrowers yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            {debouncedSearch
              ? "No borrowers match your search. Try a different query or clear the search."
              : "Add your first borrower to get started. Borrower contacts can be reused across deals."}
          </p>
          {!debouncedSearch && (
            <Button className="mt-6" onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-1.5" />
              Add Borrower
            </Button>
          )}
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
                  <TableHead>Entity Type</TableHead>
                  <TableHead>Credit Score</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {borrowers.map((borrower) => (
                  <TableRow key={borrower.id}>
                    <TableCell className="font-medium">
                      {borrower.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {borrower.email || "--"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {borrower.company || "--"}
                    </TableCell>
                    <TableCell>
                      {borrower.entityType ? (
                        <Badge variant="secondary">
                          {formatEntityType(borrower.entityType)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {borrower.creditScore != null ? (
                        <span
                          className={
                            borrower.creditScore >= 740
                              ? "text-green-600 font-medium"
                              : borrower.creditScore >= 670
                                ? "text-yellow-600 font-medium"
                                : "text-red-600 font-medium"
                          }
                        >
                          {borrower.creditScore}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(borrower.createdAt).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric", year: "numeric" }
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEdit(borrower)}
                          title="Edit borrower"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(borrower)}
                          title="Delete borrower"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Load more */}
          {nextCursor && (
            <div className="flex justify-center pt-2">
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
                  "Load More"
                )}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {editingBorrower ? "Edit Borrower" : "Add Borrower"}
            </SheetTitle>
            <SheetDescription>
              {editingBorrower
                ? "Update borrower information."
                : "Add a new borrower contact to your directory."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-4 px-4 pb-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="John Smith"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 555-1234"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
              />
            </div>

            {/* Company */}
            <div className="space-y-1.5">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                placeholder="Acme Corp"
                value={form.company}
                onChange={(e) => updateField("company", e.target.value)}
              />
            </div>

            {/* Entity Type */}
            <div className="space-y-1.5">
              <Label htmlFor="entityType">Entity Type</Label>
              <Select
                value={form.entityType}
                onValueChange={(value) => updateField("entityType", value)}
              >
                <SelectTrigger id="entityType">
                  <SelectValue placeholder="Select entity type" />
                </SelectTrigger>
                <SelectContent>
                  {ENTITY_TYPES.map((et) => (
                    <SelectItem key={et.value} value={et.value}>
                      {et.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* EIN / SSN */}
            <div className="space-y-1.5">
              <Label htmlFor="einOrSsn">EIN / SSN</Label>
              <Input
                id="einOrSsn"
                placeholder="XX-XXXXXXX"
                value={form.einOrSsn}
                onChange={(e) => updateField("einOrSsn", e.target.value)}
              />
            </div>

            {/* Credit Score */}
            <div className="space-y-1.5">
              <Label htmlFor="creditScore">Credit Score</Label>
              <Input
                id="creditScore"
                type="number"
                min={300}
                max={850}
                placeholder="300 - 850"
                value={form.creditScore}
                onChange={(e) => updateField("creditScore", e.target.value)}
              />
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="123 Main St"
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
              />
            </div>

            {/* City / State / Zip */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="City"
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  placeholder="ST"
                  value={form.state}
                  onChange={(e) => updateField("state", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="zip">Zip</Label>
                <Input
                  id="zip"
                  placeholder="12345"
                  value={form.zip}
                  onChange={(e) => updateField("zip", e.target.value)}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes..."
                rows={3}
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
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
                ) : editingBorrower ? (
                  "Update Borrower"
                ) : (
                  "Add Borrower"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setSheetOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
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
            <AlertDialogTitle>Delete Borrower</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.name}
              </span>
              ? This action can be undone by an administrator.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
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
