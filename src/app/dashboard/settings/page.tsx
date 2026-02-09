"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Loader2,
  CreditCard,
  Users,
  BarChart3,
  UserPlus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Crown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// ─── Types matching actual API responses ─────────────────────────────────────

type BillingResponse = {
  subscription: {
    plan: string;
    status: string;
    licensePaid: boolean;
    maxSeats: number;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
  usage: {
    dealsProcessed: number;
    docsGenerated: number;
    month: string;
  };
  members: {
    count: number;
    max: number;
  };
};

type Member = {
  id: string;
  clerkId: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
};

type MembersResponse = {
  members: Member[];
  maxSeats: number;
};

// ─── Plan Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    trialing: { label: "Trial", variant: "secondary" },
    active: { label: "Active", variant: "default" },
    past_due: { label: "Past Due", variant: "destructive" },
    canceled: { label: "Canceled", variant: "destructive" },
    unpaid: { label: "Unpaid", variant: "destructive" },
  };
  const { label, variant } = config[status] ?? { label: status, variant: "outline" as const };
  return <Badge variant={variant}>{label}</Badge>;
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [billing, setBilling] = useState<BillingResponse | null>(null);
  const [members, setMembers] = useState<MembersResponse | null>(null);
  const [loadingBilling, setLoadingBilling] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  // ─── Fetch billing ──────────────────────────────────────────────────────────

  const fetchBilling = useCallback(async () => {
    try {
      const res = await fetch("/api/billing");
      if (!res.ok) throw new Error("Failed to load billing data");
      const data = await res.json();
      setBilling(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load billing");
    } finally {
      setLoadingBilling(false);
    }
  }, []);

  // ─── Fetch members ─────────────────────────────────────────────────────────

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch("/api/billing/members");
      if (!res.ok) throw new Error("Failed to load team members");
      const data = await res.json();
      setMembers(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load team");
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  useEffect(() => {
    fetchBilling();
    fetchMembers();
  }, [fetchBilling, fetchMembers]);

  // ─── Billing actions ───────────────────────────────────────────────────────

  const handleCheckout = async (type: "license" | "subscription") => {
    setActionLoading(type);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create checkout session");
      }
      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelSubscription = async () => {
    setActionLoading("cancel");
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to cancel subscription");
      }
      toast.success("Subscription canceled");
      fetchBilling();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cancel failed");
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Team actions ──────────────────────────────────────────────────────────

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const res = await fetch("/api/billing/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to invite member");
      }
      toast.success(`Invited ${inviteEmail.trim()}`);
      setInviteEmail("");
      fetchMembers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invite failed");
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (userId: string, name: string) => {
    setActionLoading(`remove-${userId}`);
    try {
      const res = await fetch("/api/billing/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to remove member");
      }
      toast.success(`Removed ${name}`);
      fetchMembers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Remove failed");
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Derived values ────────────────────────────────────────────────────────

  const sub = billing?.subscription;
  const licensePaid = sub?.licensePaid ?? false;
  const subscriptionActive = sub?.status === "active";
  const seatCount = members?.members.length ?? 0;
  const maxSeats = members?.maxSeats ?? 25;
  const atSeatLimit = seatCount >= maxSeats;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage billing, team members, and view usage statistics.
        </p>
      </div>

      <Tabs defaultValue="billing" className="space-y-6">
        <TabsList>
          <TabsTrigger value="billing" className="gap-1.5">
            <CreditCard className="h-3.5 w-3.5" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Team
          </TabsTrigger>
          <TabsTrigger value="usage" className="gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            Usage
          </TabsTrigger>
        </TabsList>

        {/* ─── BILLING TAB ─────────────────────────────────────────────────────── */}
        <TabsContent value="billing">
          {loadingBilling ? (
            <div className="space-y-4">
              <Skeleton className="h-40" />
              <Skeleton className="h-32" />
            </div>
          ) : billing ? (
            <div className="space-y-6">
              {/* Plan Status */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Plan Status</CardTitle>
                      <CardDescription className="mt-1">
                        Your current subscription and license status.
                      </CardDescription>
                    </div>
                    <StatusBadge status={sub?.status ?? "none"} />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* License status */}
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center gap-2 mb-2">
                        {licensePaid ? (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        )}
                        <p className="text-sm font-medium">Platform License</p>
                      </div>
                      <Badge variant={licensePaid ? "default" : "outline"} className="text-xs">
                        {licensePaid ? "Paid" : "Unpaid"}
                      </Badge>
                      {!licensePaid && (
                        <Button
                          className="w-full mt-3"
                          size="sm"
                          disabled={actionLoading === "license"}
                          onClick={() => handleCheckout("license")}
                        >
                          {actionLoading === "license" ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                              Processing...
                            </>
                          ) : (
                            "Purchase License"
                          )}
                        </Button>
                      )}
                    </div>

                    {/* Subscription status */}
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center gap-2 mb-2">
                        {subscriptionActive ? (
                          <Crown className="h-4 w-4 text-primary" />
                        ) : (
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                        )}
                        <p className="text-sm font-medium">Monthly Subscription</p>
                      </div>
                      <Badge
                        variant={subscriptionActive ? "default" : "outline"}
                        className="text-xs"
                      >
                        {subscriptionActive ? "Active" : "Inactive"}
                      </Badge>
                      {subscriptionActive && sub?.currentPeriodEnd && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Next billing:{" "}
                          {new Date(sub.currentPeriodEnd).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      )}
                      {sub?.cancelAtPeriodEnd && (
                        <p className="text-xs text-amber-600 mt-1">
                          Cancels at end of billing period
                        </p>
                      )}
                      {subscriptionActive && !sub?.cancelAtPeriodEnd ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full mt-3 text-destructive hover:text-destructive"
                              disabled={actionLoading === "cancel"}
                            >
                              {actionLoading === "cancel" ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                  Canceling...
                                </>
                              ) : (
                                "Cancel Subscription"
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel subscription?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Your subscription will remain active until the end of the current
                                billing period. After that, you will lose access to premium features.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleCancelSubscription}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Cancel Subscription
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : !subscriptionActive && licensePaid ? (
                        <Button
                          className="w-full mt-3"
                          size="sm"
                          disabled={actionLoading === "subscription"}
                          onClick={() => handleCheckout("subscription")}
                        >
                          {actionLoading === "subscription" ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                              Processing...
                            </>
                          ) : (
                            "Start Subscription"
                          )}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick usage summary */}
              <Card>
                <CardHeader>
                  <CardTitle>This Month</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border bg-muted/30 p-4 transition-all duration-200 hover:-translate-y-px hover:shadow-sm">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Deals Processed
                      </p>
                      <p className="text-3xl font-semibold tracking-tight mt-1 tabular-nums">
                        {billing.usage.dealsProcessed}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-muted/30 p-4 transition-all duration-200 hover:-translate-y-px hover:shadow-sm">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Documents Generated
                      </p>
                      <p className="text-3xl font-semibold tracking-tight mt-1 tabular-nums">
                        {billing.usage.docsGenerated}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground text-center py-8">
                  Unable to load billing information. Please try again later.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── TEAM TAB ────────────────────────────────────────────────────────── */}
        <TabsContent value="team">
          {loadingMembers ? (
            <div className="space-y-4">
              <Skeleton className="h-16" />
              <Skeleton className="h-64" />
            </div>
          ) : members ? (
            <div className="space-y-6">
              {/* Seat counter */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Team Seats</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {seatCount} of {maxSeats} seats used
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Seat bar */}
                      <div className="w-32 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            atSeatLimit ? "bg-destructive" : "bg-primary"
                          }`}
                          style={{ width: `${Math.min((seatCount / maxSeats) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium tabular-nums">
                        {seatCount}/{maxSeats}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Invite form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Invite Member
                  </CardTitle>
                  <CardDescription>
                    Add a new team member by email address.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <form onSubmit={handleInvite} className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="colleague@company.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      disabled={inviting || atSeatLimit}
                      className="flex-1"
                      required
                    />
                    <Button
                      type="submit"
                      disabled={inviting || atSeatLimit || !inviteEmail.trim()}
                      size="sm"
                      className="px-4"
                    >
                      {inviting ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                          Inviting...
                        </>
                      ) : (
                        "Invite"
                      )}
                    </Button>
                  </form>
                  {atSeatLimit && (
                    <p className="text-xs text-destructive mt-2">
                      Seat limit reached. Remove a member to invite someone new.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Members table */}
              <Card>
                <CardHeader>
                  <CardTitle>Team Members</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="w-16" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.members.map((member) => {
                        const isInvited = member.clerkId.startsWith("invited_");
                        return (
                          <TableRow key={member.id}>
                            <TableCell className="font-medium">
                              {member.name}
                              {isInvited && (
                                <Badge variant="outline" className="ml-2 text-[10px]">
                                  Pending
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {member.email}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs capitalize">
                                {member.role.replace(/_/g, " ")}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {new Date(member.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </TableCell>
                            <TableCell>
                              {isInvited && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                      disabled={actionLoading === `remove-${member.id}`}
                                    >
                                      {actionLoading === `remove-${member.id}` ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-3.5 w-3.5" />
                                      )}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Remove team member?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Remove <strong>{member.name}</strong> ({member.email}) from
                                        your team. They will lose access to all deals and documents.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleRemoveMember(member.id, member.name)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Remove
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  {members.members.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No team members yet. Invite someone to get started.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground text-center py-8">
                  Unable to load team data. Please try again later.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── USAGE TAB ───────────────────────────────────────────────────────── */}
        <TabsContent value="usage">
          {loadingBilling ? (
            <div className="space-y-4">
              <Skeleton className="h-40" />
              <Skeleton className="h-64" />
            </div>
          ) : billing ? (
            <div className="space-y-6">
              {/* Current month stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="card-hover">
                  <CardContent className="pt-6">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Deals This Month
                    </p>
                    <p className="text-3xl font-semibold tracking-tight mt-1 tabular-nums">
                      {billing.usage.dealsProcessed}
                    </p>
                    {/* Simple bar */}
                    <div className="mt-3 w-full h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-700"
                        style={{
                          width: `${Math.min(billing.usage.dealsProcessed * 2, 100)}%`,
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-hover">
                  <CardContent className="pt-6">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Documents This Month
                    </p>
                    <p className="text-3xl font-semibold tracking-tight mt-1 tabular-nums">
                      {billing.usage.docsGenerated}
                    </p>
                    <div className="mt-3 w-full h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-chart-4 transition-all duration-700"
                        style={{
                          width: `${Math.min(billing.usage.docsGenerated, 100)}%`,
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Historical usage — fetched from dedicated endpoint */}
              <UsageHistory />
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground text-center py-8">
                  Unable to load usage data. Please try again later.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Usage History Component ─────────────────────────────────────────────────

function UsageHistory() {
  const [history, setHistory] = useState<Array<{ month: string; deals: number; docs: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch("/api/billing/usage");
        if (!res.ok) throw new Error("Failed to load usage history");
        const data = await res.json();
        setHistory(data.months ?? []);
      } catch {
        // silently fail — optional section
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  if (loading) {
    return <Skeleton className="h-64" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly History</CardTitle>
        <CardDescription>Usage over the past months.</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {history.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Deals</TableHead>
                <TableHead className="text-right">Documents</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((row) => (
                <TableRow key={row.month}>
                  <TableCell className="font-medium">{row.month}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.deals}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.docs}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            No historical usage data available yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
