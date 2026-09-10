-- ============================================================================
-- AQLA KNOWLEDGE BASE & VECTOR RAG TABLES
-- Migration: knowledge_documents, match_knowledge_documents RPC, seed articles
-- ============================================================================

-- 1. Ensure pgvector extension is enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Knowledge documents table
CREATE TABLE IF NOT EXISTS public.knowledge_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('platform_faq', 'cognitive_protocols', 'architecture_tech')),
  title text NOT NULL,
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  embedding vector(768),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. RLS Security
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;

-- Public/Members can read platform FAQs and cognitive protocols
CREATE POLICY "knowledge_read_public_and_members" ON public.knowledge_documents
  FOR SELECT USING (
    category IN ('platform_faq', 'cognitive_protocols')
    OR public.is_admin()
  );

-- Only admins can insert, update, or delete knowledge documents
CREATE POLICY "knowledge_admin_modify" ON public.knowledge_documents
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4. Vector and text indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_category ON public.knowledge_documents(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_created_at ON public.knowledge_documents(created_at DESC);

-- HNSW Cosine Index for vector search (supported in pgvector 0.5.0+)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_knowledge_embedding_hnsw'
  ) THEN
    CREATE INDEX idx_knowledge_embedding_hnsw
      ON public.knowledge_documents USING hnsw (embedding vector_cosine_ops);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Fallback gracefully if HNSW is unavailable
    RAISE NOTICE 'HNSW index creation deferred or unsupported in current environment.';
END $$;

-- 5. Semantic Vector Search RPC Function
CREATE OR REPLACE FUNCTION public.match_knowledge_documents(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.4,
  match_count int DEFAULT 5,
  filter_category text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  category text,
  title text,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kd.id,
    kd.category,
    kd.title,
    kd.content,
    kd.metadata,
    1 - (kd.embedding <=> query_embedding) AS similarity
  FROM public.knowledge_documents kd
  WHERE
    (filter_category IS NULL OR kd.category = filter_category)
    AND kd.embedding IS NOT NULL
    AND (1 - (kd.embedding <=> query_embedding)) > match_threshold
  ORDER BY kd.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.match_knowledge_documents TO authenticated, anon, service_role;

-- 6. Baseline Seed Knowledge Articles (Platform FAQs, Cognitive Protocols, Tech Architecture)
INSERT INTO public.knowledge_documents (category, title, content, metadata)
VALUES
  (
    'platform_faq',
    'How to Complete the Daily Voice Check-In',
    'The AQLA Daily Voice Check-In is designed to be completed every morning within 60 minutes of waking. The session takes 60-90 seconds and evaluates verbal fluency, acoustic markers, cognitive fatigue, and emotional valence. Ensure you are in a quiet room, click "Start Check-In" on your dashboard, and speak naturally in response to the prompts.',
    '{"tags": ["check-in", "voice", "daily-routine"], "audience": "all_members"}'
  ),
  (
    'platform_faq',
    'Understanding Your Brain Map & Cognitive Domains',
    'The AQLA Brain Map visualizes five core cognitive domains: Working Memory, Executive Processing Speed, Sustained Attention, Cognitive Flexibility, and Stress Resilience. Scores range from 0-100 and are calibrated against demographic normative baselines. Scores above 75 indicate optimal peak performance, 50-75 indicate baseline function, and below 50 suggest recovery protocols may be beneficial.',
    '{"tags": ["brain-map", "scores", "domains"], "audience": "all_members"}'
  ),
  (
    'cognitive_protocols',
    'Protocol: Non-Sleep Deep Rest (NSDR) for Cognitive Fatigue',
    'Evidence Grade: A (High Consistency in Clinical Trials). NSDR involves 10-20 minutes of guided somatic body scanning combined with physiological sighs (two quick inhales through the nose followed by a long, slow exhale through the mouth). Induces alpha and theta brain wave dominance, accelerates acetylcholine restoration in the prefrontal cortex, and reduces cortisol spikes following intense cognitive exertion.',
    '{"tags": ["nsdr", "fatigue", "recovery", "protocol"], "evidence_grade": "A"}'
  ),
  (
    'cognitive_protocols',
    'Protocol: Working Memory Enhancement via Dual N-Back',
    'Evidence Grade: B+ (Robust Neuroplasticity Data). 15 minutes of adaptive Dual N-Back cognitive training, 4 sessions per week for 6 weeks. Improves fluid intelligence and increases frontoparietal blood oxygen level-dependent (BOLD) signals. Recommended to be performed mid-morning before peak caffeine crash.',
    '{"tags": ["working-memory", "n-back", "neuroplasticity"], "evidence_grade": "B+"}'
  ),
  (
    'architecture_tech',
    'AQLA System Architecture & Security Boundary',
    'AQLA uses a single-page React 18 application hosted on Vercel with a Supabase PostgreSQL 17 backend. Security enforcement relies strictly on Row Level Security (RLS) policies in Postgres rather than client-side checks. Edge Functions (`ai-run`, `agent-message`, `send-email`) utilize the service_role key strictly server-side. Direct database access from the client occurs via `src/api/apiClient.js` using the Supabase anonymous key with user JWT validation.',
    '{"tags": ["architecture", "security", "rls", "edge-functions"], "role_required": "admin"}'
  ),
  (
    'architecture_tech',
    'AI Model Gateway & Runtime Configuration',
    'All AI operations run through the Vercel AI Gateway (https://ai-gateway.vercel.sh/v1) and Google Gemini endpoints. The agent runtime supports multi-step function calling up to 5 iterations. Mutating operations (email re-sending, onboarding resets) require human-in-the-loop interactive confirmation in the frontend console.',
    '{"tags": ["ai-gateway", "gemini", "tool-calling", "runtime"], "role_required": "admin"}'
  )
ON CONFLICT DO NOTHING;
