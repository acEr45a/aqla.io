import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Send,
  Paperclip,
  X,
  Sparkles,
  BookOpen,
  Wand2,
  Loader2,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Clock,
  HeartPulse,
  FileDown,
  FileText,
  Radar,
  FileCode,
} from "lucide-react";
import { refineComposerContent } from "@/lib/inboxAi";
import { CLINICAL_TEMPLATES } from "@/lib/clinicalEmailTemplates";
import { inboxSounds } from "@/lib/inboxSounds";
import {
  resolvePatientByEmail,
  generatePatientDailyPlanPdfAttachment,
  generatePatientWeeklyReportPdfAttachment,
  generatePatientDomainScorecardAttachment,
  generatePatientCognitiveTelemetryCsv,
} from "@/lib/patientClinicalContext";

export default function ComposeModal({
  open,
  onClose,
  onSendMessage,
  currentUser,
  onSaveDraft,
}) {
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("Patient Care");
  const [attachments, setAttachments] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [refiningTone, setRefiningTone] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showPatientDataDrawer, setShowPatientDataDrawer] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [draftSavedTime, setDraftSavedTime] = useState(null);
  const [patientContext, setPatientContext] = useState(null);

  const fileInputRef = useRef(null);
  const draftTimerRef = useRef(null);

  // Dynamically resolve patient context when recipient email changes
  useEffect(() => {
    if (!recipient.includes("@")) {
      setPatientContext(null);
      return;
    }
    const timer = setTimeout(() => {
      resolvePatientByEmail(recipient).then(setPatientContext);
    }, 400);
    return () => clearTimeout(timer);
  }, [recipient]);

  // 3-Second Debounced Draft Auto-Saving
  useEffect(() => {
    if (!open || (!recipient && !subject && !body)) return;

    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      onSaveDraft?.({
        recipient_email: recipient,
        subject,
        body_html: body,
      });
      setDraftSavedTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    }, 3000);

    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, [recipient, subject, body, open, onSaveDraft]);

  if (!open) return null;

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const isImg = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf";
      const reader = new FileReader();

      reader.onload = () => {
        setAttachments((prev) => [
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
        setAttachments((prev) => [...prev, attachmentObj]);
      }
    } catch (e) {
      console.warn("Failed to generate patient attachment:", e);
    }

    setGeneratingPdf(false);
    setShowPatientDataDrawer(false);
  };

  const handleInsertTemplate = (tmpl) => {
    let populated = tmpl.body
      .replace(/{{patient_name}}/g, patientContext?.name || recipient.split("@")[0] || "Patient")
      .replace(/{{clinician_name}}/g, currentUser?.full_name || "Dr. Richardson")
      .replace(/{{protocol_family}}/g, patientContext?.protocol?.family || "SPARK")
      .replace(/{{current_date}}/g, new Date().toLocaleDateString())
      .replace(/{{patient_id}}/g, patientContext?.id?.slice(0, 8) || "PT-8821")
      .replace(/{{dashboard_url}}/g, window.location.origin + "/dashboard");

    setSubject(tmpl.subject);
    setBody(populated);
    setShowTemplates(false);
  };

  const handleRefine = async (mode) => {
    if (!body.trim() || refiningTone) return;
    setRefiningTone(true);
    try {
      const res = await refineComposerContent(body, mode, patientContext);
      setBody(res);
    } catch {}
    setRefiningTone(false);
  };

  const handleSend = async () => {
    if (!recipient.trim() || !body.trim() || isSending) return;
    setIsSending(true);

    const payload = {
      recipient_email: recipient.trim(),
      sender_email: currentUser?.email?.includes("@") ? currentUser.email : "clinician@aqla.io",
      sender_name: currentUser?.full_name || "AQLA Clinical Team",
      subject: subject.trim() || "(No Subject)",
      category,
      body_html: body.startsWith("<") ? body : `<p>${body.replace(/\n/g, "<br/>")}</p>`,
      attachments,
      is_read: true,
      is_encrypted: true,
      created_at: new Date().toISOString(),
    };

    try {
      await onSendMessage(payload);
      inboxSounds.playSendSound();
      onClose();
      setRecipient("");
      setSubject("");
      setBody("");
      setAttachments([]);
    } catch {}
    setIsSending(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className={`bg-background/95 border-border/80 p-0 flex flex-col overflow-hidden shadow-2xl backdrop-blur-xl transition-all duration-200 ${
          isMaximized ? "max-w-[95vw] w-[95vw] h-[92vh]" : "max-w-2xl w-[95vw] h-[78vh]"
        }`}
      >
        {/* Header */}
        <DialogHeader className="px-5 py-3.5 border-b border-border/60 bg-card/60 flex flex-row items-center justify-between space-y-0 shrink-0">
          <div className="flex items-center gap-2">
            <DialogTitle className="text-xs font-semibold uppercase tracking-wider text-foreground">
              New Clinical Message
            </DialogTitle>
            {draftSavedTime && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                <Clock className="h-3 w-3 text-primary" /> Draft saved at {draftSavedTime}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => setIsMaximized(!isMaximized)}
            >
              {isMaximized ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </DialogHeader>

        {/* Inputs */}
        <div className="p-4 space-y-2.5 shrink-0 border-b border-border/40 bg-card/20">
          <div className="flex items-center gap-3 text-xs border-b border-border/30 pb-2">
            <span className="text-muted-foreground font-medium w-12">To:</span>
            <Input
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="patient@example.com"
              className="h-7 text-xs bg-transparent border-none focus-visible:ring-0 text-foreground p-0"
            />
            {patientContext && (
              <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-medium shrink-0">
                {patientContext.name} · {patientContext.readinessAvg}% Readiness
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs border-b border-border/30 pb-2">
            <span className="text-muted-foreground font-medium w-12">Subject:</span>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Message subject…"
              className="h-7 text-xs bg-transparent border-none focus-visible:ring-0 text-foreground p-0 font-medium"
            />
          </div>

          <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">Category:</span>
              {["Patient Care", "Primary", "System Updates"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all ${
                    category === cat
                      ? "bg-primary/20 text-primary border-primary/40"
                      : "bg-secondary text-muted-foreground border-border/40 hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTemplates(!showTemplates)}
                className="h-7 text-xs border-border/60 gap-1.5"
              >
                <BookOpen className="h-3.5 w-3.5 text-primary" /> Template
              </Button>

              <div className="relative group">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={refiningTone}
                  className="h-7 text-xs border-primary/40 text-primary gap-1.5"
                >
                  {refiningTone ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                  AI Assist
                </Button>
                <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border/80 rounded-xl shadow-2xl p-1 z-30 hidden group-hover:block">
                  <button
                    onClick={() => handleRefine("formalize")}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-secondary text-foreground"
                  >
                    Formalize Tone
                  </button>
                  <button
                    onClick={() => handleRefine("shorten")}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-secondary text-foreground"
                  >
                    Shorten & Direct
                  </button>
                  <button
                    onClick={() => handleRefine("expand")}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-secondary text-foreground"
                  >
                    Expand with Evidence
                  </button>
                  <button
                    onClick={() => handleRefine("clinical_note")}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-secondary text-primary font-medium"
                  >
                    Elaborate into SOAP Note
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Template Picker Accordion */}
        {showTemplates && (
          <div className="p-3 bg-secondary/60 border-b border-border/60 max-h-48 overflow-y-auto shrink-0 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase">
              <span>Select Clinical Template</span>
              <button onClick={() => setShowTemplates(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {CLINICAL_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleInsertTemplate(t)}
                  className="text-left p-2 rounded-lg bg-card/80 border border-border/40 hover:border-primary/40 hover:bg-card transition-all"
                >
                  <p className="text-xs font-medium text-foreground">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground">{t.category}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Text Area Body */}
        <div className="flex-1 p-4 flex flex-col">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your clinical email message or insert a protocol template…"
            className="flex-1 w-full bg-transparent border-none focus:outline-none text-xs text-foreground placeholder:text-muted-foreground/50 resize-none font-sans leading-relaxed"
          />

          {/* Attached Files Chips */}
          {attachments.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-border/40">
              {attachments.map((att, i) => (
                <div
                  key={i}
                  className="bg-secondary/80 border border-border/60 rounded-lg px-2.5 py-1 text-xs flex items-center gap-2 text-foreground"
                >
                  <Paperclip className="h-3 w-3 text-primary" />
                  <span className="truncate max-w-[160px]">{att.name}</span>
                  <button
                    onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="px-5 py-3 border-t border-border/60 bg-card/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple className="hidden" />
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
                  className="h-8 text-xs border-primary/40 text-primary hover:bg-primary/10 gap-1.5"
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
            onClick={handleSend}
            disabled={isSending || !recipient.trim() || !body.trim()}
            className="bg-[#a3e635] text-black font-semibold hover:bg-[#bef264] transition-all shadow-lg shadow-[#a3e635]/20 rounded-xl h-9 px-6 text-xs flex items-center gap-2"
          >
            {isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5 stroke-[2.5]" />}
            Send Message
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
