-- ページ画像管理テーブル
CREATE TABLE IF NOT EXISTS page_images (
  image_key TEXT PRIMARY KEY,
  image_url TEXT NOT NULL,
  page_name TEXT NOT NULL,
  section_name TEXT,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_page_images_page ON page_images(page_name);

-- 初期データ
INSERT OR REPLACE INTO page_images (image_key, image_url, page_name, section_name, description) VALUES
  ('hero_slide_1', '/hero-slide-1.jpg', 'home', 'hero', 'ヒーロースライド1 - 焼肉テーブル'),
  ('hero_slide_2', '/hero-slide-2.jpg', 'home', 'hero', 'ヒーロースライド2 - ワイン乾杯'),
  ('hero_slide_3', '/hero-slide-3.jpg', 'home', 'hero', 'ヒーロースライド3 - 個室'),
  ('hero_logo', '/logo-hero.png', 'home', 'hero', 'ヒーローセクションロゴ'),
  ('ground_menu_bg', '/ground-menu-main.jpg', 'home', 'ground_menu', 'GROUND MENUセクション背景'),
  ('commitment_image_1', 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=800&q=80', 'commitment', 'main', 'こだわり画像1'),
  ('commitment_image_2', 'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=800&q=80', 'commitment', 'main', 'こだわり画像2');
