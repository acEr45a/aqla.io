import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/inbox/Sidebar";
import ThreadList from "@/components/inbox/ThreadList";
import ReadingPane from "@/components/inbox/ReadingPane";
import ComposeModal from "@/components/inbox/ComposeModal";
import SuperAdminAuditFeed from "@/components/inbox/SuperAdminAuditFeed";
import CustomInboxSettings from "@/components/settings/CustomInboxSettings";
import { STARTER_THREADS } from "@/lib/clinicalSeedData";
import { inboxSounds } from "@/lib/inboxSounds";

export default function ClinicalInboxPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [threads, setThreads] = useState([]);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeFolder, setActiveFolder] = useState("inbox");
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeTag, setActiveTag] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [globalAuditMode, setGlobalAuditMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load User & Role
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle();

        const u = { id: session.user.id, email: session.user.email, ...profile };
        setCurrentUser(u);
        const isSuper = profile?.role === "super_admin" || profile?.role === "admin";
        setIsSuperAdmin(isSuper);
      }
    });
  }, []);

  // Load Threads & Messages from Supabase with Local Storage / Starter Seed Fallback
  const loadMailbox = useCallback(async () => {
    setLoading(true);
    try {
      const { data: dbThreads, error: threadErr } = await supabase
        .from("threads")
        .select(`
          *,
          messages (*)
        `)
        .order("updated_at", { ascending: false });

      if (!threadErr && dbThreads && dbThreads.length > 0) {
        // Sort messages chronologically inside each thread
        const formatted = dbThreads.map((t) => ({
          ...t,
          messages: (t.messages || []).sort(
            (a, b) => new Date(a.created_at) - new Date(b.created_at)
          ),
        }));
        setThreads(formatted);
        if (!selectedThreadId && formatted.length > 0) {
          setSelectedThreadId(formatted[0].id);
        }
      } else {
        // Fallback to rich starter seed threads
        const stored = localStorage.getItem("aqla_clinical_threads_cache");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setThreads(parsed);
            if (!selectedThreadId && parsed.length > 0) {
              setSelectedThreadId(parsed[0].id);
            }
          } catch {
            setThreads(STARTER_THREADS);
            if (!selectedThreadId) setSelectedThreadId(STARTER_THREADS[0].id);
          }
        } else {
          setThreads(STARTER_THREADS);
          localStorage.setItem("aqla_clinical_threads_cache", JSON.stringify(STARTER_THREADS));
          if (!selectedThreadId) setSelectedThreadId(STARTER_THREADS[0].id);
        }
      }
    } catch {
      setThreads(STARTER_THREADS);
      if (!selectedThreadId) setSelectedThreadId(STARTER_THREADS[0].id);
    }
    setLoading(false);
  }, [selectedThreadId]);

  useEffect(() => {
    loadMailbox();
  }, [loadMailbox]);

  // Supabase Realtime Subscription for Live Live Updates
  useEffect(() => {
    const channel = supabase
      .channel("clinical-inbox-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        (payload) => {
          console.log("[ClinicalInbox] Realtime Message Event:", payload.eventType);
          if (payload.eventType === "INSERT") {
            inboxSounds.playInboundChime();
          }
          loadMailbox();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "threads" },
        () => {
          loadMailbox();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadMailbox]);

  // Keyboard Shortcuts (Superhuman / Gmail style)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if typing in an input or textarea
      if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;

      if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        setComposeOpen(true);
      } else if (e.key === "e") {
        if (selectedThreadId) {
          handleBulkAction("archive", selectedThreadId);
        }
      } else if (e.key === "#") {
        if (selectedThreadId) {
          handleBulkAction("delete", selectedThreadId);
        }
      } else if (e.key === "j") {
        // Next thread
        const currentIndex = threads.findIndex((t) => t.id === selectedThreadId);
        if (currentIndex < threads.length - 1) {
          setSelectedThreadId(threads[currentIndex + 1].id);
        }
      } else if (e.key === "k") {
        // Prev thread
        const currentIndex = threads.findIndex((t) => t.id === selectedThreadId);
        if (currentIndex > 0) {
          setSelectedThreadId(threads[currentIndex - 1].id);
        }
      } else if (e.key === "/") {
        e.preventDefault();
        const searchInput = document.querySelector("input[placeholder*='Search']");
        searchInput?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedThreadId, threads]);

  // Bulk Actions
  const handleBulkAction = async (action, singleId) => {
    const targetIds = singleId ? [singleId] : selectedIds;
    if (targetIds.length === 0) return;

    setThreads((prev) => {
      const updated = prev.map((th) => {
        if (!targetIds.includes(th.id)) return th;
        if (action === "archive") return { ...th, is_archived: true };
        if (action === "delete") return { ...th, is_trashed: true };
        if (action === "star") return { ...th, is_starred: true };
        if (action === "toggleStar") return { ...th, is_starred: !th.is_starred };
        if (action === "markRead") {
          return {
            ...th,
            messages: (th.messages || []).map((m) => ({ ...m, is_read: true })),
          };
        }
        if (action === "markUnread") {
          return {
            ...th,
            messages: (th.messages || []).map((m, i) => (i === 0 ? { ...m, is_read: false } : m)),
          };
        }
        return th;
      });

      localStorage.setItem("aqla_clinical_threads_cache", JSON.stringify(updated));
      return updated;
    });

    setSelectedIds([]);

    // Persist to Supabase in background
    try {
      if (action === "archive") {
        await supabase.from("threads").update({ is_archived: true }).in("id", targetIds);
      } else if (action === "delete") {
        await supabase.from("threads").update({ is_trashed: true }).in("id", targetIds);
      } else if (action === "markRead") {
        await supabase.from("messages").update({ is_read: true }).in("thread_id", targetIds);
      }
    } catch { }
  };

  // Send Message Routine
  const handleSendMessage = async (messagePayload) => {
    let threadId = messagePayload.thread_id;

    if (!threadId) {
      // New thread creation
      const newThread = {
        id: `th-${Date.now()}`,
        subject: messagePayload.subject || "New Clinical Message",
        participant_emails: [messagePayload.recipient_email, messagePayload.sender_email],
        category: messagePayload.category || "Patient Care",
        is_starred: false,
        is_archived: false,
        is_spam: false,
        is_trashed: false,
        tags: ["Patient Care"],
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        messages: [],
      };

      threadId = newThread.id;
      messagePayload.thread_id = threadId;

      try {
        await supabase.from("threads").insert([
          {
            id: newThread.id,
            subject: newThread.subject,
            participant_emails: newThread.participant_emails,
            category: newThread.category,
          },
        ]);
      } catch { }
    }

    const newMessage = {
      id: `msg-${Date.now()}`,
      email_id: `em-${Date.now()}`,
      ...messagePayload,
    };

    setThreads((prev) => {
      const exists = prev.some((t) => t.id === threadId);
      let updated;
      if (exists) {
        updated = prev.map((t) =>
          t.id === threadId
            ? {
              ...t,
              updated_at: new Date().toISOString(),
              messages: [...(t.messages || []), newMessage],
            }
            : t
        );
      } else {
        updated = [
          {
            id: threadId,
            subject: messagePayload.subject,
            participant_emails: [messagePayload.recipient_email, messagePayload.sender_email],
            category: messagePayload.category || "Patient Care",
            is_starred: false,
            is_archived: false,
            is_spam: false,
            is_trashed: false,
            updated_at: new Date().toISOString(),
            messages: [newMessage],
          },
          ...prev,
        ];
      }

      localStorage.setItem("aqla_clinical_threads_cache", JSON.stringify(updated));
      return updated;
    });

    setSelectedThreadId(threadId);

    // Save to Supabase
    try {
      await supabase.from("messages").insert([
        {
          thread_id: threadId,
          email_id: newMessage.email_id,
          sender_email: newMessage.sender_email,
          sender_name: newMessage.sender_name,
          recipient_email: newMessage.recipient_email,
          subject: newMessage.subject,
          body_html: newMessage.body_html,
          attachments: newMessage.attachments || [],
          is_read: true,
          is_encrypted: true,
        },
      ]);
    } catch { }

    // Dispatch via send-email edge function if configured
    try {
      supabase.functions.invoke("send-email", {
        body: {
          to: messagePayload.recipient_email,
          subject: messagePayload.subject,
          html: messagePayload.body_html,
        },
      }).catch(() => { });
    } catch { }
  };

  // Draft Auto-Save
  const handleSaveDraft = async (draftPayload) => {
    if (!currentUser?.id) return;
    try {
      await supabase.from("draft_history").insert([
        {
          user_id: currentUser.id,
          recipient_email: draftPayload.recipient_email,
          subject: draftPayload.subject,
          body_html: draftPayload.body_html,
          updated_at: new Date().toISOString(),
        },
      ]);
    } catch { }
  };

  // Filtered threads for current folder/category/tag view
  const visibleThreads = threads.filter((th) => {
    if (activeFolder === "starred" && !th.is_starred) return false;
    if (activeFolder === "archive" && !th.is_archived) return false;
    if (activeFolder === "trash" && !th.is_trashed) return false;
    if (activeFolder === "spam" && !th.is_spam) return false;
    if (activeFolder === "sent") {
      const msgs = th.messages || [];
      const hasSent = msgs.some(
        (m) => m.sender_email?.includes("ndapape.resend.app") || m.sender_email === currentUser?.email
      );
      if (!hasSent) return false;
    }
    if (activeFolder === "inbox") {
      if (th.is_archived || th.is_trashed || th.is_spam) return false;
    }

    if (activeCategory && th.category !== activeCategory) return false;
    if (activeTag && !th.tags?.includes(activeTag)) return false;

    return true;
  });

  const selectedThread = threads.find((t) => t.id === selectedThreadId) || visibleThreads[0] || null;

  // Folder Counts
  const counts = {
    inbox: threads.filter((t) => !t.is_archived && !t.is_trashed && !t.is_spam && t.messages?.some((m) => !m.is_read)).length,
    starred: threads.filter((t) => t.is_starred).length,
    sent: threads.filter((t) => t.messages?.some((m) => m.sender_email?.includes("ndapape.resend.app"))).length,
    drafts: 0,
    archive: threads.filter((t) => t.is_archived).length,
    spam: threads.filter((t) => t.is_spam).length,
    trash: threads.filter((t) => t.is_trashed).length,
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-background text-foreground flex flex-col antialiased">
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeFolder={activeFolder}
          setActiveFolder={setActiveFolder}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          activeTag={activeTag}
          setActiveTag={setActiveTag}
          counts={counts}
          onCompose={() => setComposeOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          isSuperAdmin={isSuperAdmin}
          globalAuditMode={globalAuditMode}
          setGlobalAuditMode={setGlobalAuditMode}
        />

        {/* Dynamic Main Workspace: Global Audit Stream vs. Gmail Split-Pane */}
        {globalAuditMode ? (
          <SuperAdminAuditFeed
            threads={threads}
            onRefresh={loadMailbox}
            loading={loading}
          />
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* Thread List Pane */}
            <ThreadList
              threads={visibleThreads}
              selectedThreadId={selectedThreadId}
              onSelectThread={(th) => {
                setSelectedThreadId(th.id);
                // Mark thread as read
                handleBulkAction("markRead", th.id);
              }}
              selectedIds={selectedIds}
              onToggleSelect={(id) =>
                setSelectedIds((prev) =>
                  prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                )
              }
              onSelectAll={() =>
                setSelectedIds(
                  selectedIds.length === visibleThreads.length ? [] : visibleThreads.map((t) => t.id)
                )
              }
              onBulkAction={handleBulkAction}
              onRefresh={loadMailbox}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              loading={loading}
            />

            {/* Reading Pane */}
            <ReadingPane
              thread={selectedThread}
              onBack={() => setSelectedThreadId(null)}
              onArchive={(id) => handleBulkAction("archive", id)}
              onDelete={(id) => handleBulkAction("delete", id)}
              onToggleStar={(id) => handleBulkAction("toggleStar", id)}
              onMarkUnread={(id) => handleBulkAction("markUnread", id)}
              onSendMessage={handleSendMessage}
              currentUser={currentUser}
            />
          </div>
        )}
      </div>

      {/* Floating Standalone Compose Modal */}
      <ComposeModal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        onSendMessage={handleSendMessage}
        currentUser={currentUser}
        onSaveDraft={handleSaveDraft}
      />

      {/* Settings & Governance Modal */}
      <CustomInboxSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        currentUser={currentUser}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  );
}
