import React, { useState, useEffect } from "react";
import { apiClient } from "@/api/apiClient";
import {
  BookOpen,
  Search,
  Plus,
  Sparkles,
  Database,
  Trash2,
  Edit3,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  ArrowRight,
} from "lucide-react";

const CATEGORIES = [
  { key: "all", label: "All Documents" },
  { key: "platform_faq", label: "Platform FAQs", color: "#6C9EFF" },
  { key: "cognitive_protocols", label: "Cognitive Protocols", color: "#C9F24E" },
  { key: "architecture_tech", label: "Architecture & Tech", color: "#E8A28F" },
];

export default function KnowledgeManagerTab({ accent = "#C9F24E" }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Editor Modal State
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState("platform_faq");
  const [formContent, setFormContent] = useState("");
  const [formTags, setFormTags] = useState("");
  const [saving, setSaving] = useState(false);

  // Simulator Drawer State
  const [simQuery, setSimQuery] = useState("");
  const [simResults, setSimResults] = useState(null);
  const [simLoading, setSimLoading] = useState(false);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const docs = await apiClient.knowledge.listDocuments({
        category: activeCategory,
        search: searchQuery,
      });
      setDocuments(docs || []);
    } catch (err) {
      console.error("[KnowledgeManager] Failed to load documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [activeCategory]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadDocuments();
  };

  const openNewDoc = () => {
    setEditingDoc(null);
    setFormTitle("");
    setFormCategory(activeCategory === "all" ? "platform_faq" : activeCategory);
    setFormContent("");
    setFormTags("");
    setEditorOpen(true);
  };

  const openEditDoc = (doc) => {
    setEditingDoc(doc);
    setFormTitle(doc.title);
    setFormCategory(doc.category);
    setFormContent(doc.content);
    setFormTags(doc.metadata?.tags ? doc.metadata.tags.join(", ") : "");
    setEditorOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this knowledge document?")) return;
    try {
      await apiClient.knowledge.deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      alert("Failed to delete document: " + err.message);
    }
  };

  const handleSaveDocument = async (e) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) return;

    setSaving(true);
    try {
      const tagsArray = formTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        id: editingDoc?.id,
        title: formTitle.trim(),
        category: formCategory,
        content: formContent.trim(),
        metadata: {
          tags: tagsArray,
          updated_by: "admin",
        },
      };

      const saved = await apiClient.knowledge.upsertDocument(payload);
      if (saved) {
        setEditorOpen(false);
        await loadDocuments();
      }
    } catch (err) {
      alert("Failed to save and vectorize document: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRunSimulation = async (e) => {
    e.preventDefault();
    if (!simQuery.trim() || simLoading) return;

    setSimLoading(true);
    try {
      const matches = await apiClient.knowledge.testSimilarity({
        query: simQuery.trim(),
        category: activeCategory === "all" ? null : activeCategory,
        limit: 4,
      });
      setSimResults(matches || []);
    } catch (err) {
      alert("Simulator error: " + err.message);
    } finally {
      setSimLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/40">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" style={{ color: accent }} />
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Knowledge Base & Vector RAG
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-primary/30 bg-primary/10 text-primary font-medium">
              pgvector(768)
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage vectorized documents referenced by Help Agent, AQLA Coach, and Backend Ops.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openNewDoc}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-background transition-all hover:opacity-90 shadow-sm"
            style={{ backgroundColor: accent }}
          >
            <Plus className="h-3.5 w-3.5" />
            New Document
          </button>
        </div>
      </div>

      {/* Category Pills & Search */}
      <div className="px-4 py-3 border-b border-border/40 flex flex-col md:flex-row md:items-center justify-between gap-2.5 bg-background/50">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeCategory === cat.key
                  ? "bg-secondary text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative w-full sm:w-60">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border/60 bg-secondary/30 pl-8 pr-3 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg border border-border/60 bg-secondary/40 px-2.5 py-1 text-xs font-medium text-foreground hover:bg-secondary/70 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Main Content Layout (Documents List + Vector Simulator) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Document List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
              <p className="text-xs">Loading indexed documents…</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground border border-dashed border-border/60 rounded-2xl p-8">
              <Database className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm font-medium text-foreground">No documents found</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                No indexed documents match this category. Click &quot;New Document&quot; to seed knowledge into the vector store.
              </p>
            </div>
          ) : (
            documents.map((doc) => {
              const catConfig = CATEGORIES.find((c) => c.key === doc.category) || CATEGORIES[1];
              return (
                <div
                  key={doc.id}
                  className="rounded-xl border border-border/60 bg-card/40 p-4 transition-all hover:border-border hover:bg-card/70 flex flex-col justify-between gap-3 group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-foreground tracking-tight">
                        {doc.title}
                      </h3>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className="text-[10px] font-medium px-2 py-0.5 rounded-md border"
                          style={{
                            borderColor: `${catConfig.color}40`,
                            backgroundColor: `${catConfig.color}15`,
                            color: catConfig.color,
                          }}
                        >
                          {catConfig.label}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 text-emerald-400">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          Vectorized
                        </span>
                      </div>
                    </div>

                    <p className="mt-2 text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {doc.content}
                    </p>

                    {doc.metadata?.tags && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {doc.metadata.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary/60 text-muted-foreground"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-border/30 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Updated {new Date(doc.updated_at || doc.created_at).toLocaleDateString()}</span>
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditDoc(doc)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-secondary text-foreground text-xs"
                      >
                        <Edit3 className="h-3 w-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-destructive/10 text-destructive text-xs"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Vector Search Simulator Drawer */}
        <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-border/50 bg-card/20 p-4 flex flex-col overflow-y-auto">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              RAG Retrieval Simulator
            </h3>
          </div>
          <p className="text-[11px] text-muted-foreground mb-3 leading-normal">
            Test cosine-similarity ranking in real-time using AI Gateway <code>text-embedding-3-small</code> (768-dim).
          </p>

          <form onSubmit={handleRunSimulation} className="space-y-2 mb-4">
            <textarea
              rows={2}
              placeholder="e.g., how to do daily check-in or reduce cognitive fatigue..."
              value={simQuery}
              onChange={(e) => setSimQuery(e.target.value)}
              className="w-full rounded-lg border border-border/70 bg-secondary/40 p-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none"
            />
            <button
              type="submit"
              disabled={simLoading || !simQuery.trim()}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium bg-secondary hover:bg-secondary/80 text-foreground transition-colors disabled:opacity-50"
            >
              {simLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Layers className="h-3.5 w-3.5" />}
              Simulate RAG Retrieval
            </button>
          </form>

          {simResults && (
            <div className="space-y-2 flex-1">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                <span>Top Matches</span>
                <span className="text-[10px] font-mono">{simResults.length} returned</span>
              </div>

              {simResults.length === 0 ? (
                <div className="rounded-lg border border-border/40 p-3 text-center text-xs text-muted-foreground">
                  No matches found above similarity threshold.
                </div>
              ) : (
                simResults.map((match, i) => (
                  <div
                    key={match.id || i}
                    className="rounded-lg border border-border/60 bg-secondary/20 p-2.5 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-foreground truncate text-[11px]">
                        #{i + 1} {match.title}
                      </span>
                      <span className="font-mono text-[10px] font-bold text-emerald-400 shrink-0">
                        {Math.round((match.similarity || 0.5) * 100)}%
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-2">
                      {match.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* New / Edit Document Modal */}
      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border/70 bg-card p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" style={{ color: accent }} />
                <h3 className="text-sm font-semibold text-foreground">
                  {editingDoc ? "Edit Document" : "Create Knowledge Document"}
                </h3>
              </div>
              <button
                onClick={() => setEditorOpen(false)}
                className="text-muted-foreground hover:text-foreground rounded p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDocument} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Protocol: Non-Sleep Deep Rest (NSDR)"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full rounded-lg border border-border/60 bg-secondary/30 px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full rounded-lg border border-border/60 bg-secondary/30 px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="platform_faq">Platform FAQs</option>
                    <option value="cognitive_protocols">Cognitive Protocols</option>
                    <option value="architecture_tech">Architecture & Tech</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="sleep, recovery, fatigue"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    className="w-full rounded-lg border border-border/60 bg-secondary/30 px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Content (Markdown)
                </label>
                <textarea
                  required
                  rows={8}
                  placeholder="Write authoritative protocol or platform guide text here..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full rounded-lg border border-border/60 bg-secondary/30 p-3 text-xs text-foreground focus:outline-none focus:border-primary font-mono leading-relaxed"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold text-background transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: accent }}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Vectorizing (768d)…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      Save &amp; Vectorize
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
