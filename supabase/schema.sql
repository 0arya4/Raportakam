-- Users table (extends Supabase auth)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  plan TEXT DEFAULT 'free', -- free, pro, team
  generations_used INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generations history
CREATE TABLE generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  output_type TEXT NOT NULL, -- pptx or word
  theme TEXT,
  slides INT,
  tone TEXT,
  file_url TEXT,
  status TEXT DEFAULT 'pending', -- pending, done, failed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  currency TEXT DEFAULT 'IQD',
  plan TEXT NOT NULL, -- pro, team
  status TEXT DEFAULT 'pending', -- pending, confirmed, failed
  reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Row Level Security (users can only see their own data)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can view own generations" ON generations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own payments" ON payments
  FOR ALL USING (auth.uid() = user_id);

-- RPC function to get user generation statistics split by type
CREATE OR REPLACE FUNCTION get_user_gen_stats()
RETURNS TABLE(
  user_id UUID,
  total_tokens BIGINT,
  total_gens BIGINT,
  ai_detect_gens BIGINT,
  other_gens BIGINT,
  total_cost NUMERIC
) AS $$
SELECT
  g.user_id,
  COALESCE(SUM(CAST(g.tokens_used AS BIGINT)), 0)::BIGINT as total_tokens,
  COALESCE(COUNT(*) FILTER (WHERE g.deleted IS NOT TRUE), 0)::BIGINT as total_gens,
  COALESCE(COUNT(*) FILTER (WHERE g.output_type = 'ai-detect' AND g.deleted IS NOT TRUE), 0)::BIGINT as ai_detect_gens,
  COALESCE(COUNT(*) FILTER (WHERE g.output_type != 'ai-detect' AND g.deleted IS NOT TRUE), 0)::BIGINT as other_gens,
  COALESCE(SUM(CAST(g.cost_usd AS NUMERIC)), 0)::NUMERIC as total_cost
FROM generations g
GROUP BY g.user_id;
$$ LANGUAGE SQL STABLE;
