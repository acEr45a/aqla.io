import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Image as ImageIcon,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  X,
  FileCode,
  ShieldCheck,
} from "lucide-react";

/**
 * Enterprise In-App Attachment Previewer Modal
 * Supports: PDFs, Medical Imagery (PNG/JPEG), CSV / Tabular Data, Text Documents.
 */
export default function AttachmentViewerModal({ attachment, open, onClose }) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  if (!attachment || !open) return null;

  const isImage = attachment.type?.startsWith("image/") || /\.(png|jpe?g|webp|gif|svg)$/i.test(attachment.name);
  const isPdf = attachment.type === "application/pdf" || /\.pdf$/i.test(attachment.name);
  const isCsv = attachment.type === "text/csv" || /\.csv$/i.test(attachment.name);
  const isText = attachment.type?.startsWith("text/") || /\.(txt|json|md)$/i.test(attachment.name);

  const handleDownload = () => {
    if (attachment.url) {
      const a = document.createElement("a");
      a.href = attachment.url;
      a.download = attachment.name || "attachment";
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (attachment.previewText) {
      const blob = new Blob([attachment.previewText], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = attachment.name || "attachment.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Render CSV table preview if text is provided
  const renderCsvTable = (csvString) => {
    const lines = csvString.trim().split("\n");
    if (lines.length === 0) return <p className="text-muted-foreground text-xs">Empty CSV file</p>;
    const headers = lines[0].split(",");
    const rows = lines.slice(1).map((l) => l.split(","));

    return (
      <div className="overflow-x-auto rounded-xl border border-border/60 bg-black/40 p-2 max-h-[60vh]">
        <table className="w-full text-left text-xs border-collapse font-mono">
          <thead>
            <tr className="border-b border-border/80 bg-secondary/40 text-primary">
              {headers.map((h, i) => (
                <th key={i} className="p-2.5 font-semibold tracking-wider whitespace-nowrap">
                  {h.trim()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rIndex) => (
              <tr key={rIndex} className="border-b border-border/30 hover:bg-secondary/20 transition-colors">
                {row.map((cell, cIndex) => (
                  <td key={cIndex} className="p-2.5 text-foreground/90 whitespace-nowrap">
                    {cell.trim()}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[92vh] flex flex-col bg-background/95 border-border/80 p-0 overflow-hidden shadow-2xl backdrop-blur-xl">
        {/* Header Bar */}
        <DialogHeader className="px-6 py-4 border-b border-border/60 flex flex-row items-center justify-between space-y-0 shrink-0 bg-card/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              {isImage ? (
                <ImageIcon className="h-4 w-4 text-primary" />
              ) : isCsv ? (
                <FileCode className="h-4 w-4 text-primary" />
              ) : (
                <FileText className="h-4 w-4 text-primary" />
              )}
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-sm font-medium text-foreground truncate max-w-md">
                {attachment.name}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] text-muted-foreground">{formatSize(attachment.size)}</span>
                <span className="text-[11px] text-primary/80 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Encrypted Clinical Record
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isImage && (
              <div className="flex items-center gap-1 mr-2 bg-secondary/50 rounded-lg p-1 border border-border/40">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setZoom((z) => Math.max(50, z - 25))}
                  title="Zoom Out"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </Button>
                <span className="text-[10px] font-mono text-muted-foreground w-10 text-center">{zoom}%</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setZoom((z) => Math.min(250, z + 25))}
                  title="Zoom In"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  title="Rotate"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="h-8 gap-1.5 border-border/60 hover:border-primary/40 text-xs"
            >
              <Download className="h-3.5 w-3.5" /> Download
            </Button>
          </div>
        </DialogHeader>

        {/* Content Viewer Body */}
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-black/30 min-h-[400px]">
          {isImage ? (
            <div className="overflow-auto max-h-[70vh] flex items-center justify-center p-4">
              <img
                src={attachment.url}
                alt={attachment.name}
                className="max-w-full max-h-[65vh] object-contain rounded-xl shadow-lg transition-transform duration-200"
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                }}
              />
            </div>
          ) : isPdf ? (
            <div className="w-full h-full flex flex-col items-center gap-4">
              {attachment.url ? (
                <iframe
                  src={attachment.url}
                  title={attachment.name}
                  className="w-full h-[65vh] rounded-xl border border-border/60 bg-white"
                />
              ) : attachment.previewText ? (
                <div className="w-full max-w-3xl rounded-xl border border-border/60 bg-card p-6 shadow-inner font-mono text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed max-h-[65vh] overflow-y-auto">
                  {attachment.previewText}
                </div>
              ) : (
                <div className="text-center p-12">
                  <FileText className="h-12 w-12 text-primary/60 mx-auto mb-3" />
                  <p className="text-sm text-foreground font-medium">{attachment.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF ready for download and local inspection.</p>
                  <Button onClick={handleDownload} className="mt-4 bg-primary text-black font-semibold">
                    <Download className="h-4 w-4 mr-1.5" /> Download PDF
                  </Button>
                </div>
              )}
            </div>
          ) : isCsv && attachment.previewText ? (
            <div className="w-full">{renderCsvTable(attachment.previewText)}</div>
          ) : attachment.previewText || isText ? (
            <div className="w-full max-w-3xl rounded-xl border border-border/60 bg-card p-6 shadow-inner font-mono text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed max-h-[65vh] overflow-y-auto">
              {attachment.previewText || "Text document preview."}
            </div>
          ) : (
            <div className="text-center p-12">
              <FileText className="h-12 w-12 text-primary/60 mx-auto mb-3" />
              <p className="text-sm text-foreground font-medium">{attachment.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {attachment.type || "Document file"} · {formatSize(attachment.size)}
              </p>
              <Button onClick={handleDownload} className="mt-4 bg-primary text-black font-semibold">
                <Download className="h-4 w-4 mr-1.5" /> Download File
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
