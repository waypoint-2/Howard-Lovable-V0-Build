-- Create clauses table
CREATE TABLE IF NOT EXISTS public.clauses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  clause_number TEXT NOT NULL,
  title TEXT NOT NULL,
  original_text TEXT NOT NULL,
  plain_meaning TEXT NOT NULL,
  why_matters TEXT[] DEFAULT ARRAY[]::TEXT[],
  risk_level TEXT NOT NULL,
  favors TEXT,
  questions JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable Row Level Security
ALTER TABLE public.clauses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for clauses
CREATE POLICY "Users can view clauses of their analyses" ON public.clauses
  FOR SELECT USING (
    analysis_id IN (
      SELECT id FROM public.analyses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert clauses for their analyses" ON public.clauses
  FOR INSERT WITH CHECK (
    analysis_id IN (
      SELECT id FROM public.analyses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update clauses of their analyses" ON public.clauses
  FOR UPDATE USING (
    analysis_id IN (
      SELECT id FROM public.analyses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete clauses of their analyses" ON public.clauses
  FOR DELETE USING (
    analysis_id IN (
      SELECT id FROM public.analyses WHERE user_id = auth.uid()
    )
  );

-- Create index for faster queries
CREATE INDEX idx_clauses_analysis_id ON public.clauses(analysis_id);
