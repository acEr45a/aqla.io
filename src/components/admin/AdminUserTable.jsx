import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Trash2 } from "lucide-react";
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

export default function AdminUserTable({ users, onDeleted }) {
  const [pendingId, setPendingId] = useState(null);
  const [error, setError] = useState("");

  const handleDelete = async (userId) => {
    setPendingId(userId);
    setError("");
    try {
      await base44.functions.invoke("deleteUserAndData", { user_id: userId });
      onDeleted?.();
    } catch (err) {
      setError(err?.message || "Could not delete this user.");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <section className="aqla-panel overflow-hidden rounded-2xl">
      <div className="p-5"><p className="font-display text-foreground">Recent users</p><p className="mt-1 text-xs text-muted-foreground">Registration and engagement overview</p></div>
      {error && <p className="px-5 pb-2 text-xs text-destructive">{error}</p>}
      <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="border-y border-border/60 text-[11px] uppercase tracking-widest text-muted-foreground"><tr><th className="px-5 py-3 font-medium">User</th><th className="px-5 py-3 font-medium">Joined</th><th className="px-5 py-3 font-medium">Assessment</th><th className="px-5 py-3 font-medium">Check-ins</th><th className="px-5 py-3 font-medium">Protocol</th><th className="px-5 py-3 font-medium text-right">Actions</th></tr></thead><tbody>{users.map((user) => <tr key={user.id} className="border-b border-border/40 last:border-0"><td className="px-5 py-4"><p className="text-foreground">{user.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{user.email}</p></td><td className="px-5 py-4 text-muted-foreground">{new Date(user.joined).toLocaleDateString()}</td><td className="px-5 py-4"><span className={user.assessmentComplete ? "text-primary" : "text-muted-foreground"}>{user.assessmentComplete ? "Complete" : "Not started"}</span></td><td className="px-5 py-4 text-foreground tabular-nums">{user.checkIns}</td><td className="px-5 py-4 text-foreground">{user.protocol}</td><td className="px-5 py-4 text-right"><AlertDialog><AlertDialogTrigger asChild><button disabled={pendingId === user.id} title="Delete user and data" className="inline-flex items-center justify-center rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:text-destructive hover:border-destructive/40 disabled:opacity-40"><Trash2 className="h-4 w-4" strokeWidth={1.75} /></button></AlertDialogTrigger><AlertDialogContent className="bg-card border-border"><AlertDialogHeader><AlertDialogTitle className="font-display font-normal">Delete {user.name}?</AlertDialogTitle><AlertDialogDescription className="text-muted-foreground">This permanently erases all of their data — assessments, check-ins, protocols, tests, games, experiments, reviews — and removes their account. This cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(user.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete forever</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></td></tr>)}</tbody></table></div>
    </section>
  );
}