-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  icon TEXT DEFAULT '',
  sort_order INT DEFAULT 0
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_repo TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'NEW'
    CHECK (status IN ('NEW', 'ANALYZING', 'PENDING', 'APPROVED', 'REJECTED')),
  tech_stack TEXT[] DEFAULT '{}',
  demo_url TEXT,
  github_url TEXT NOT NULL,
  last_updated TIMESTAMPTZ,
  activity TEXT DEFAULT 'aktif'
    CHECK (activity IN ('aktif', 'arsiv', 'bakimda')),
  ai_trailer TEXT DEFAULT '',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Screenshots table
CREATE TABLE screenshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT DEFAULT '',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default categories
INSERT INTO categories (name, display_name, icon, sort_order) VALUES
  ('sap-erp', 'SAP / ERP Entegrasyonlari', '🏢', 1),
  ('finans', 'Finans & Yonetim', '💰', 2),
  ('ai-araclar', 'AI Araclari', '🤖', 3),
  ('web-app', 'Web Uygulamalari', '🌐', 4),
  ('utility', 'Utility & Araclar', '🔧', 5),
  ('mobile', 'Mobil Uygulamalar', '📱', 6);

-- Indexes
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_category ON projects(category);
CREATE INDEX idx_projects_slug ON projects(slug);
CREATE INDEX idx_screenshots_project ON screenshots(project_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
