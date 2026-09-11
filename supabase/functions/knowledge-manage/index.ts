// @ts-nocheck
// supabase/functions/knowledge-manage/index.ts
// Knowledge Management Edge Function for Admin Ops Console
// Handles: list_documents, upsert_document (with auto-vectorization), delete_document, test_similarity

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateEmbedding } from "../_shared/embeddings.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. Authenticate caller and ensure Admin role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden: Admin role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Parse request body
    const body = await req.json();
    const { action } = body;

    switch (action) {
      // -------------------------------------------------------------
      // List Documents
      // -------------------------------------------------------------
      case "list_documents": {
        const { category, search } = body;
        let queryBuilder = adminClient
          .from("knowledge_documents")
          .select("id, category, title, content, metadata, created_at, updated_at, embedding")
          .order("updated_at", { ascending: false });

        if (category && category !== "all") {
          queryBuilder = queryBuilder.eq("category", category);
        }
        if (search) {
          queryBuilder = queryBuilder.ilike("title", `%${search}%`);
        }

        const { data: docs, error } = await queryBuilder;
        if (error) throw error;

        const formatted = (docs || []).map((d: any) => ({
          id: d.id,
          category: d.category,
          title: d.title,
          content: d.content,
          metadata: d.metadata,
          has_embedding: Boolean(d.embedding),
          created_at: d.created_at,
          updated_at: d.updated_at,
        }));

        return new Response(JSON.stringify({ documents: formatted }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // -------------------------------------------------------------
      // Upsert Document (Auto-vectorizes via text-embedding-004)
      // -------------------------------------------------------------
      case "upsert_document": {
        const { id, category, title, content, metadata = {} } = body;
        if (!category || !title || !content) {
          return new Response(
            JSON.stringify({ error: "category, title, and content are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Generate embedding vector
        let embeddingVector: number[] | null = null;
        try {
          const textToEmbed = `${title}\n\n${content}`;
          embeddingVector = await generateEmbedding(textToEmbed);
        } catch (embedErr: any) {
          console.warn("[knowledge-manage] Embedding generation warning:", embedErr.message);
        }

        const docPayload: Record<string, any> = {
          category,
          title,
          content,
          metadata,
          updated_at: new Date().toISOString(),
        };

        if (embeddingVector) {
          docPayload.embedding = embeddingVector;
        }

        let savedDoc;
        if (id) {
          const { data, error } = await adminClient
            .from("knowledge_documents")
            .update(docPayload)
            .eq("id", id)
            .select()
            .single();
          if (error) throw error;
          savedDoc = data;
        } else {
          docPayload.created_by = user.id;
          const { data, error } = await adminClient
            .from("knowledge_documents")
            .insert(docPayload)
            .select()
            .single();
          if (error) throw error;
          savedDoc = data;
        }

        return new Response(
          JSON.stringify({
            success: true,
            document: {
              ...savedDoc,
              has_embedding: Boolean(savedDoc.embedding),
              embedding: undefined,
            },
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // -------------------------------------------------------------
      // Delete Document
      // -------------------------------------------------------------
      case "delete_document": {
        const { id } = body;
        if (!id) {
          return new Response(JSON.stringify({ error: "Missing document id" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { error } = await adminClient
          .from("knowledge_documents")
          .delete()
          .eq("id", id);
        if (error) throw error;

        return new Response(JSON.stringify({ success: true, id }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // -------------------------------------------------------------
      // Test Similarity (Vector Search Simulator)
      // -------------------------------------------------------------
      case "test_similarity": {
        const { query, category = null, limit = 5 } = body;
        if (!query) {
          return new Response(JSON.stringify({ error: "Missing query" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const queryEmbedding = await generateEmbedding(query);

        const { data: matches, error } = await adminClient.rpc(
          "match_knowledge_documents",
          {
            query_embedding: queryEmbedding,
            match_threshold: 0.1,
            match_count: limit,
            filter_category: category || null,
          }
        );

        if (error) {
          // Fallback to text matching
          const { data: fallback } = await adminClient
            .from("knowledge_documents")
            .select("id, category, title, content")
            .ilike("content", `%${query}%`)
            .limit(limit);

          return new Response(
            JSON.stringify({
              mode: "keyword_fallback",
              matches: (fallback || []).map((d: any) => ({ ...d, similarity: 0.5 })),
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({
            mode: "vector_similarity",
            matches: (matches || []).map((m: any) => ({
              ...m,
              similarity: Number((m.similarity || 0).toFixed(4)),
            })),
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action '${action}'` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error: any) {
    console.error("[knowledge-manage] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
