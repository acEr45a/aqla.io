import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Reply,
  Archive,
  Trash2,
  Mail,
  Star,
  Printer,
  Sparkles,
  Paperclip,
  ShieldCheck,
  Send,
  Loader2,
  Undo2,
  ChevronDown,
  ChevronUp,
  FileText,
  Image as ImageIcon,
  Check,
  Clock,
  Wand2,
  BookOpen,
  FileCode,
  HeartPulse,
  Radar,
  FileDown,
  Plus,
  X,
} from "lucide-react";
import {
  generateThreadSummary,
  generateSmartReplies,
  refineComposerContent,
  extractActionItems,
} from "@/lib/inboxAi";
import { CLINICAL_TEMPLATES } from "@/lib/clinicalEmailTemplates";
import { inboxSounds } from "@/lib/inboxSounds";
import AttachmentViewerModal from "@/components/inbox/AttachmentViewerModal";
import {
  resolvePatientByEmail,
  generatePatientDailyPlanPdfAttachment,
  generatePatientWeeklyReportPdfAttachment,
  generatePatientDomainScorecardAttachment,
  generatePatientCognitiveTelemetryCsv,
} from "@/lib/patientClinicalContext";

export default function ReadingPane({
  thread,
  onBack,
  onArchive,
  onDelete,
  onToggleStar,
  onMarkUnread,
  onSendMessage,
  currentUser,
}) {
  const [messages, setMessages] = useState([]);
  const [collapsedMsgIds, setCollapsedMsgIds] = useState(new Set());
  const [replyBody, setReplyBody] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [replyAttachments, setReplyAttachments] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [activeViewerAttachment, setActiveViewerAttachment] = useState(null);

  // Patient Clinical Context State
  const [patientContext, setPatientContext] = useState(null);
  const [loadingPatientContext, setLoadingPatientContext] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // AI Suite State
  const [aiSummary, setAiSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [showSummaryWidget, setShowSummaryWidget] = useState(true);
  const [smartReplies, setSmartReplies] = useState([]);
  const [loadingSmartReplies, setLoadingSmartReplies] = useState(false);
  const [actionItems, setActionItems] = useState([]);
  const [refiningTone, setRefiningTone] = useState(false);

  // 5-Second Undo Send State
  const [undoBanner, setUndoBanner] = useState(null);
  const countdownIntervalRef = useRef(null);

  // Template Picker State
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showPatientDataDrawer, setShowPatientDataDrawer] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!thread) return;
    const msgs = thread.messages || [];
    setMessages(msgs);

    if (msgs.length > 1) {
      const olderIds = new Set(msgs.slice(0, msgs.length - 1).map((m) => m.id));
      setCollapsedMsgIds(olderIds);
    } else {
      setCollapsedMsgIds(new Set());
    }

    const lastMsg = msgs[msgs.length - 1];
    const targetEmail = lastMsg?.sender_email || thread.participant_emails?.[0] || "";
    setRecipientEmail(targetEmail);
    setReplyBody("");
    setReplyAttachments([]);

    // Fetch Patient Clinical Profile
    setLoadingPatientContext(true);
    resolvePatientByEmail(targetEmail)
      .then((pCtx) => {
        setPatientContext(pCtx);

        // Ground AI responses in real patient data
        if (msgs.length > 0) {
          setLoadingSmartReplies(true);
          generateSmartReplies(msgs, currentUser?.full_name || "Dr. Richardson", pCtx)
            .then(setSmartReplies)
            .finally(() => setLoadingSmartReplies(false));

          extractActionItems(msgs).then(setActionItems);
        }
      })
      .finally(() => setLoadingPatientContext(false));
  }, [thread, currentUser]);

  if (!thread) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-card/10 select-none">
        <div className="h-14 w-14 rounded-2xl bg-secondary/60 border border-border/40 flex items-center justify-center mb-4">
          <Mail className="h-7 w-7 text-muted-foreground/60" />
        </div>
        <h3 className="text-sm font-medium text-foreground">Select a conversation</h3>
        <p className="text-xs text-muted-foreground max-w-sm mt-1">
          Choose a clinical email thread from the list to view patient medical history, run AI summaries, and compose responses.
        </p>
      </div>
    );
  }

  const toggleMessageCollapse = (msgId) => {
    setCollapsedMsgIds((prev) => {
      const next = new Set(prev);
      if (next.has(msgId)) next.delete(msgId);
      else next.add(msgId);
      return next;
    });
  };

  const handleGenerateSummary = async () => {
    if (loadingSummary) return;
    setLoadingSummary(true);
    try {
      const res = await generateThreadSummary(messages, patientContext);
      setAiSummary(res);
      setShowSummaryWidget(true);
    } catch {}
    setLoadingSummary(false);
  };

  const handleApplySmartReply = (replyText) => {
    setReplyBody((prev) => (prev ? `${prev}\n\n${replyText}` : replyText));
  };

  const handleRefineTone = async (mode) => {
    if (!replyBody.trim() || refiningTone) return;
    setRefiningTone(true);
    try {
      const refined = await refineComposerContent(replyBody, mode, patientContext);
      setReplyBody(refined);
    } catch {}
    setRefiningTone(false);
  };

  const handleInsertTemplate = (tmpl) => {
    let populated = tmpl.body
      .replace(/{{patient_name}}/g, patientContext?.name || "Patient")
      .replace(/{{clinician_name}}/g, currentUser?.full_name || "Dr. Richardson")
      .replace(/{{protocol_family}}/g, patientContext?.protocol?.family || "SPARK")
      .replace(/{{current_date}}/g, new Date().toLocaleDateString())
      .replace(/{{patient_id}}/g, patientContext?.id?.slice(0, 8) || "PT-8821")
      .replace(/{{dashboard_url}}/g, window.location.origin + "/dashboard");

    setReplyBody((prev) => (prev ? `${prev}\n\n${populated}` : populated));
    setShowTemplatePicker(false);
  };

  // 1-Click Patient AQLA Data Attachments
  const handleAttachPatientData = async (type) => {
    if (!patientContext || generatingPdf) return;
    setGeneratingPdf(true);

    try {
      let attachmentObj = null;
      if (type === "daily_plan") {
        attachmentObj = await generatePatientDailyPlanPdfAttachment(patientContext);
      } else if (type === "weekly_report") {
        attachmentObj = await generatePatientWeeklyReportPdfAttachment(patientContext);
      } else if (type === "brain_scorecard") {
        attachmentObj = generatePatientDomainScorecardAttachment(patientContext);
      } else if (type === "cognitive_telemetry") {
        attachmentObj = generatePatientCognitiveTelemetryCsv(patientContext);
      }

      if (attachmentObj) {
        setReplyAttachments((prev) => [...prev, attachmentObj]);
      }
    } catch (e) {
      console.warn("Failed to generate patient attachment:", e);
    }

    setGeneratingPdf(false);
    setShowPatientDataDrawer(false);
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach((file) => {
      const isImg = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf";
      const reader = new FileReader();

      reader.onload = () => {
        setReplyAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            size: file.size,
            type: file.type || "application/octet-stream",
            url: reader.result,
            previewText: !isImg && !isPdf ? (typeof reader.result === "string" ? reader.result.slice(0, 1000) : "") : undefined,
          },
        ]);
      };

      if (isImg || isPdf) reader.readAsDataURL(file);
      else reader.readAsText(file);
    });

    e.target.value = "";
  };

  const handleInitiateSend = () => {
    if (!replyBody.trim()) return;

    const messagePayload = {
      thread_id: thread.id,
      sender_email: currentUser?.email?.includes("@") ? currentUser.email : "clinician@aqla.io",
      sender_name: currentUser?.full_name || "AQLA Clinical Team",
      recipient_email: recipientEmail,
      subject: thread.subject.startsWith("Re:") ? thread.subject : `Re: ${thread.subject}`,
      body_html: replyBody.startsWith("<") ? replyBody : `<p>${replyBody.replace(/\n/g, "<br/>")}</p>`,
      attachments: replyAttachments,
      is_read: true,
      is_encrypted: true,
      created_at: new Date().toISOString(),
    };

    let countdown = 5;
    const timerId = setTimeout(() => {
      finalizeSend(messagePayload);
    }, 5000);

    setUndoBanner({ messagePayload, timerId, countdown: 5 });

    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = setInterval(() => {
      setUndoBanner((prev) => {
        if (!prev) return null;
        if (prev.countdown <= 1) {
          clearInterval(countdownIntervalRef.current);
          return null;
        }
        return { ...prev, countdown: prev.countdown - 1 };
      });
    }, 1000);
  };

  const handleCancelSend = () => {
    if (undoBanner?.timerId) clearTimeout(undoBanner.timerId);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setUndoBanner(null);
  };

  const finalizeSend = async (payload) => {
    setUndoBanner(null);
    setIsSending(true);
    try {
      await onSendMessage(payload);
      inboxSounds.playSendSound();
      setReplyBody("");
      setReplyAttachments([]);
    } catch {}
    setIsSending(false);
  };

  const getUrgencyBadge = (urgency) => {
    switch (urgency) {
      case "critical":
        return <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">Critical</span>;
      case "high":
        return <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">High Priority</span>;
      case "moderate":
        return <span className="bg-sky-500/20 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase">Moderate</span>;
      default:
        return <span className="bg-[#a3e635]/20 text-[#a3e635] border border-[#a3e635]/30 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase">Routine</span>;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden relative">
      {/* 5-Second Undo Send Banner */}
      {undoBanner && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#a3e635] text-black px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 animate-spin" />
            <span className="text-xs font-semibold">
              Sending response in {undoBanner.countdown}s…
            </span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancelSend}
            className="h-6 px-2 bg-black/15 hover:bg-black/25 text-black font-bold text-xs rounded-lg flex items-center gap-1"
          >
            <Undo2 className="h-3.5 w-3.5" /> Undo Send
          </Button>
        </div>
      )}

      {/* Sticky Header Bar */}
      <div className="p-3.5 border-b border-border/60 bg-card/60 backdrop-blur-md flex items-center justify-between gap-3 shrink-0 z-20">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-8 w-8 text-muted-foreground hover:text-foreground md:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground truncate max-w-xl">
              {thread.subject}
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
              <span>{messages.length} message{messages.length !== 1 ? "s" : ""}</span>
              <span>·</span>
              <span className="text-primary/90 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> End-to-End HIPAA Encrypted
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleStar(thread.id)}
            className={`h-8 w-8 ${thread.is_starred ? "text-amber-400" : "text-muted-foreground hover:text-foreground"}`}
            title="Star conversation"
          >
            <Star className={`h-4 w-4 ${thread.is_starred ? "fill-amber-400" : ""}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onArchive(thread.id)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Archive"
          >
            <Archive className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(thread.id)}
            className="h-8 w-8 text-destructive hover:bg-destructive/15"
            title="Move to Trash"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.print()}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Print conversation"
          >
            <Printer className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Conversation Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {/* Patient Clinical Context Card */}
        {patientContext && (
          <div className="rounded-2xl border border-border/80 bg-card/40 p-4 backdrop-blur-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
                  <HeartPulse className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-foreground">{patientContext.name}</p>
                    <span className="text-[10px] text-muted-foreground font-mono">&lt;{patientContext.email}&gt;</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                    <span>
                      Readiness: <strong className="text-[#a3e635]">{patientContext.readinessAvg}%</strong>
                    </span>
                    <span>·</span>
                    <span>
                      Protocol: <strong className="text-foreground">{patientContext.protocol?.name}</strong>
                    </span>
                    <span>·</span>
                    <span>
                      Bottleneck: <strong className="text-amber-300">{patientContext.weakestDomain?.domain_name}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* 1-Click Patient Data Attachment Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAttachPatientData("daily_plan")}
                  disabled={generatingPdf}
                  className="h-7 text-[11px] border-primary/40 text-primary hover:bg-primary/10 gap-1"
                  title="Generate & attach patient's AQLA Daily Plan PDF"
                >
                  <FileDown className="h-3 w-3" /> Attach Plan PDF
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAttachPatientData("weekly_report")}
                  disabled={generatingPdf}
                  className="h-7 text-[11px] border-border/60 hover:border-primary/40 gap-1 text-foreground"
                  title="Generate & attach patient's 7-Day Readiness PDF"
                >
                  <FileText className="h-3 w-3 text-sky-400" /> 7-Day Report
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAttachPatientData("brain_scorecard")}
                  className="h-7 text-[11px] border-border/60 hover:border-primary/40 gap-1 text-foreground"
                  title="Attach Brain Domain Radar Scorecard"
                >
                  <Radar className="h-3 w-3 text-amber-300" /> Scorecard
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* AI Thread Summarizer Widget */}
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground flex items-center gap-2">
                  AQLA Clinical Intelligence Digest
                  {aiSummary && getUrgencyBadge(aiSummary.clinical_urgency)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Grounded in patient's active protocol & biomarker telemetry
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!aiSummary && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleGenerateSummary}
                  disabled={loadingSummary}
                  className="h-7 text-xs border-primary/40 text-primary hover:bg-primary/10 gap-1.5"
                >
                  {loadingSummary ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  Generate AI Summary
                </Button>
              )}
              {aiSummary && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowSummaryWidget(!showSummaryWidget)}
                >
                  {showSummaryWidget ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              )}
            </div>
          </div>

          {/* Expanded Summary Content */}
          {aiSummary && showSummaryWidget && (
            <div className="mt-3.5 pt-3 border-t border-primary/20 space-y-3 text-xs">
              <div>
                <p className="text-[11px] font-semibold text-primary uppercase tracking-wider mb-1.5">
                  Key Findings & Observations
                </p>
                <ul className="space-y-1 text-foreground/90 pl-1">
                  {aiSummary.summary_bullets?.map((b, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary font-bold">·</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {aiSummary.patient_concerns?.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <span className="text-[11px] font-medium text-muted-foreground">Patient Symptoms:</span>
                  {aiSummary.patient_concerns.map((c, i) => (
                    <span key={i} className="bg-secondary px-2 py-0.5 rounded-full text-[10px] text-foreground">
                      {c}
                    </span>
                  ))}
                </div>
              )}

              {aiSummary.suggested_actions?.length > 0 && (
                <div className="pt-2 border-t border-primary/15">
                  <p className="text-[11px] font-semibold text-foreground mb-1">Recommended Clinician Actions:</p>
                  <div className="flex gap-2 flex-wrap">
                    {aiSummary.suggested_actions.map((act, i) => (
                      <button
                        key={i}
                        onClick={() => handleApplySmartReply(`Regarding ${act}: I have reviewed your protocol adjustments...`)}
                        className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/30 text-primary px-2.5 py-1 rounded-lg text-[11px] hover:bg-primary/20 transition-colors text-left"
                      >
                        <Check className="h-3 w-3" /> {act}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Items Bar */}
        {actionItems.length > 0 && (
          <div className="p-3 rounded-xl border border-border/60 bg-card/40 flex items-center justify-between text-xs flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#a3e635]" />
              <span className="font-semibold text-foreground">Detected Action Items:</span>
              {actionItems.map((item, i) => (
                <span key={i} className="bg-secondary/70 border border-border/40 px-2 py-0.5 rounded-md text-[11px] text-foreground/90">
                  {item.title} ({item.due_date})
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Chronological Message Timeline */}
        <div className="space-y-3">
          {messages.map((msg, index) => {
            const isCollapsed = collapsedMsgIds.has(msg.id);
            const isClinician = msg.sender_email?.includes("ndapape.resend.app") || msg.sender_email?.includes("aqla.io");
            const attachments = msg.attachments || [];

            return (
              <div
                key={msg.id || index}
                className={`rounded-2xl border transition-all ${
                  isClinician
                    ? "border-primary/30 bg-primary/5 shadow-sm"
                    : "border-border/60 bg-card/60"
                }`}
              >
                {/* Message Header */}
                <div
                  onClick={() => toggleMessageCollapse(msg.id)}
                  className="p-4 cursor-pointer flex items-center justify-between gap-3 hover:bg-secondary/20 transition-colors rounded-t-2xl"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`h-9 w-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                        isClinician
                          ? "bg-primary text-black"
                          : "bg-secondary border border-border text-foreground"
                      }`}
                    >
                      {(msg.sender_name || msg.sender_email || "P")[0].toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {msg.sender_name || msg.sender_email}
                        </p>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          &lt;{msg.sender_email}&gt;
                        </span>
                        {isClinician && (
                          <span className="text-[9px] bg-primary/20 text-primary border border-primary/30 px-1.5 py-0.2 rounded font-semibold">
                            Clinician
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                        to {msg.recipient_email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {new Date(msg.created_at).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {attachments.length > 0 && (
                      <span className="text-[10px] text-primary/80 flex items-center gap-1 font-mono">
                        <Paperclip className="h-3 w-3" /> {attachments.length}
                      </span>
                    )}
                    {isCollapsed ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Expanded Message Content */}
                {!isCollapsed && (
                  <div className="px-4 pb-4 pt-2 border-t border-border/40 text-xs leading-relaxed space-y-4">
                    <div
                      className="text-foreground/90 prose prose-invert prose-xs max-w-none break-words"
                      dangerouslySetInnerHTML={{ __html: msg.body_html }}
                    />

                    {/* Attachments Section */}
                    {attachments.length > 0 && (
                      <div className="pt-3 border-t border-border/40 space-y-2">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Paperclip className="h-3.5 w-3.5 text-primary" /> Attachments ({attachments.length})
                        </p>
                        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                          {attachments.map((att, attIdx) => {
                            const isImg = att.type?.startsWith("image/") || /\.(png|jpe?g|webp)$/i.test(att.name);
                            const isPdf = att.type === "application/pdf" || /\.pdf$/i.test(att.name);
                            const isCsv = att.type === "text/csv" || /\.csv$/i.test(att.name);

                            return (
                              <div
                                key={attIdx}
                                onClick={() => setActiveViewerAttachment(att)}
                                className="group relative rounded-xl border border-border/60 bg-secondary/40 p-3 hover:bg-secondary/70 hover:border-primary/50 transition-all cursor-pointer flex items-center justify-between gap-2"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="h-8 w-8 rounded-lg bg-card flex items-center justify-center text-primary shrink-0 border border-border/40">
                                    {isImg ? (
                                      <ImageIcon className="h-4 w-4" />
                                    ) : isCsv ? (
                                      <FileCode className="h-4 w-4" />
                                    ) : (
                                      <FileText className="h-4 w-4" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                      {att.name}
                                    </p>
                                    <span className="text-[10px] text-muted-foreground">
                                      {isPdf ? "AQLA PDF Report" : isImg ? "Medical Image" : isCsv ? "Data CSV" : "Attachment"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* AI Smart Reply Suggestions Chips */}
        {smartReplies.length > 0 && (
          <div className="pt-2 space-y-2">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> AI Smart Replies (Grounded in {patientContext?.name || 'Patient'})
            </p>
            <div className="flex gap-2 flex-wrap">
              {smartReplies.map((r, i) => (
                <button
                  key={i}
                  onClick={() => handleApplySmartReply(r.text)}
                  className="bg-secondary/60 hover:bg-primary/15 hover:border-primary/40 border border-border/60 text-xs px-3 py-1.5 rounded-full text-foreground/90 transition-all flex items-center gap-1.5 group"
                >
                  <span className="text-primary font-medium">{r.chip_title}:</span>
                  <span className="text-muted-foreground group-hover:text-foreground truncate max-w-xs">
                    {r.text.slice(0, 45)}…
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Inline Clinical Composer */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xl space-y-3 mt-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground font-medium">To:</span>
              <input
                type="text"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="bg-transparent border-none text-foreground font-mono focus:outline-none w-64"
                placeholder="patient@example.com"
              />
            </div>

            {/* Template Picker & AI Refine Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTemplatePicker(!showTemplatePicker)}
                className="h-7 text-xs border-border/60 gap-1.5"
              >
                <BookOpen className="h-3.5 w-3.5 text-primary" /> Templates
              </Button>

              <div className="relative group">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs border-primary/40 text-primary gap-1.5"
                  disabled={refiningTone}
                >
                  {refiningTone ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                  AI Assist
                </Button>
                <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border/80 rounded-xl shadow-2xl p-1 z-30 hidden group-hover:block">
                  <button
                    onClick={() => handleRefineTone("formalize")}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-secondary text-foreground"
                  >
                    Formalize Tone
                  </button>
                  <button
                    onClick={() => handleRefineTone("shorten")}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-secondary text-foreground"
                  >
                    Shorten & Direct
                  </button>
                  <button
                    onClick={() => handleRefineTone("expand")}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-secondary text-foreground"
                  >
                    Expand with Evidence
                  </button>
                  <button
                    onClick={() => handleRefineTone("clinical_note")}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-secondary text-primary font-medium"
                  >
                    Elaborate into SOAP Note
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Template Selection Dropdown Panel */}
          {showTemplatePicker && (
            <div className="p-3 rounded-xl bg-secondary/50 border border-border/60 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase">
                <span>Select Clinical Protocol Template</span>
                <button onClick={() => setShowTemplatePicker(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {CLINICAL_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => handleInsertTemplate(tmpl)}
                    className="text-left p-2 rounded-lg bg-card/80 border border-border/40 hover:border-primary/40 hover:bg-card transition-all"
                  >
                    <p className="text-xs font-medium text-foreground">{tmpl.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{tmpl.category}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Rich Message Textarea */}
          <textarea
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            placeholder="Type your clinical response or protocol instructions here…"
            rows={5}
            className="w-full bg-secondary/30 border border-border/60 rounded-xl p-3 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60 resize-y"
          />

          {/* Attached Files in Composer */}
          {replyAttachments.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {replyAttachments.map((att, i) => (
                <div
                  key={i}
                  className="bg-secondary/70 border border-border/60 rounded-lg px-2.5 py-1 text-xs flex items-center gap-2 text-foreground"
                >
                  <Paperclip className="h-3 w-3 text-primary" />
                  <span className="truncate max-w-[180px]">{att.name}</span>
                  <button
                    onClick={() => setReplyAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Bottom Toolbar & Send CTA */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                className="hidden"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5"
              >
                <Paperclip className="h-3.5 w-3.5 text-primary" /> Upload File
              </Button>

              {patientContext && (
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPatientDataDrawer(!showPatientDataDrawer)}
                    className="h-8 text-xs border-primary/30 text-primary hover:bg-primary/10 gap-1.5"
                  >
                    <HeartPulse className="h-3.5 w-3.5" /> Attach AQLA Data
                  </Button>

                  {showPatientDataDrawer && (
                    <div className="absolute left-0 bottom-full mb-2 w-64 bg-card border border-border/80 rounded-xl shadow-2xl p-2 z-30 space-y-1">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase px-2 py-1">
                        Attach for {patientContext.name}:
                      </p>
                      <button
                        onClick={() => handleAttachPatientData("daily_plan")}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-secondary text-foreground flex items-center gap-2"
                      >
                        <FileDown className="h-3.5 w-3.5 text-primary" /> Active Daily Plan PDF
                      </button>
                      <button
                        onClick={() => handleAttachPatientData("weekly_report")}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-secondary text-foreground flex items-center gap-2"
                      >
                        <FileText className="h-3.5 w-3.5 text-sky-400" /> 7-Day Readiness PDF
                      </button>
                      <button
                        onClick={() => handleAttachPatientData("brain_scorecard")}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-secondary text-foreground flex items-center gap-2"
                      >
                        <Radar className="h-3.5 w-3.5 text-amber-300" /> Brain Domain Scorecard
                      </button>
                      <button
                        onClick={() => handleAttachPatientData("cognitive_telemetry")}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-secondary text-foreground flex items-center gap-2"
                      >
                        <FileCode className="h-3.5 w-3.5 text-emerald-400" /> Paradigm Telemetry CSV
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Button
              onClick={handleInitiateSend}
              disabled={isSending || !replyBody.trim()}
              className="bg-[#a3e635] text-black font-semibold hover:bg-[#bef264] transition-all shadow-md shadow-[#a3e635]/20 rounded-xl h-9 px-5 text-xs flex items-center gap-2"
            >
              {isSending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5 stroke-[2.5]" />
              )}
              Send Response
            </Button>
          </div>
        </div>
      </div>

      {/* In-App Attachment Multi-Format Preview Modal */}
      <AttachmentViewerModal
        attachment={activeViewerAttachment}
        open={!!activeViewerAttachment}
        onClose={() => setActiveViewerAttachment(null)}
      />
    </div>
  );
}
