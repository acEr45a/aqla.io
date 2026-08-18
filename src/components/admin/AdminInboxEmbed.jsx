import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Mail,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Maximize2,
  Inbox,
  Send,
  Plus,
} from "lucide-react";
import ClinicalInboxPage from "@/pages/ClinicalInboxPage";

export default function AdminInboxEmbed({ isSuperAdmin }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="aqla-panel rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              Clinical Email Inbox & Conversation Persistence
              <span className="text-[10px] bg-[#a3e635]/20 text-[#a3e635] border border-[#a3e635]/30 px-2 py-0.5 rounded-full font-mono font-bold">
                LIVE SYNC ACTIVE
              </span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Gmail-inspired workspace for clinical patient communications, multi-format attachment previews, AI intelligence suite, and Super Admin audit logging.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs gap-1.5 border-border/60"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            {isExpanded ? "Collapse View" : "Expand in Dashboard"}
          </Button>

          <Link to="/inbox">
            <Button
              size="sm"
              className="bg-[#a3e635] text-black font-semibold hover:bg-[#bef264] text-xs gap-1.5 shadow-md shadow-[#a3e635]/20"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Open Full-Screen Inbox
            </Button>
          </Link>
        </div>
      </div>

      {/* Embedded Inbox Container */}
      <div
        className={`rounded-2xl border border-border/80 overflow-hidden shadow-2xl transition-all duration-300 ${
          isExpanded ? "h-[85vh]" : "h-[620px]"
        }`}
      >
        <ClinicalInboxPage />
      </div>
    </div>
  );
}
