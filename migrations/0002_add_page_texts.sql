-- Page texts table for editable content
CREATE TABLE IF NOT EXISTS page_texts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text_key TEXT UNIQUE NOT NULL,
  text_value TEXT NOT NULL,
  page_name TEXT NOT NULL,
  section_name TEXT,
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_page_texts_key ON page_texts(text_key);
CREATE INDEX IF NOT EXISTS idx_page_texts_page ON page_texts(page_name);

-- Insert default texts
INSERT OR IGNORE INTO page_texts (text_key, text_value, page_name, section_name, description) VALUES
  ('hero_title', '十勝焼肉かりん', 'home', 'hero', 'ヒーローセクションのタイトル（現在はロゴ画像で非表示）'),
  ('hero_subtitle', 'TOKACHI YAKINIKU KARIN', 'home', 'hero', 'ヒーローセクションのサブタイトル（現在はロゴ画像で非表示）'),
  ('ground_menu_title', 'GROUND MENU', 'home', 'ground_menu', 'Ground Menuセクションのタイトル'),
  ('ground_menu_description', '本物の食作法で選りすぐりのときをる��<br>ここでしか食べられない「極至」上質のよさとご期待くださったみなさん。<br>～時間中の全ての食、お飲、デザートまでここならではKARINの宴。<br>ファカが付き続きうろん、ご堪念、まだ引用付のコーテブランとなる実営業り時をますます。', 'home', 'ground_menu', 'Ground Menuセクションの説明文'),
  ('commitment_title', 'KARINのこだわり', 'home', 'commitment', 'こだわりセクションのタイトル'),
  ('commitment_description', 'お肉を最もおいしい状態で楽しんでいただきたい一心から生まれた厳選素材を使った豪快メニューの数々。十勝若牛のもつ繊細な旨味、希少価値の高いアイスランドラムの芳醇な香り、一つひとつの料理にシェフの技術とこだわりが凝縮されております。産地直送ならではの新鮮さと品質をお約束いたします。', 'home', 'commitment', 'こだわりセクションの説明文'),
  ('message_title', 'Message', 'home', 'message', 'Messageセクションのタイトル'),
  ('message_content', '焼肉KARINは(お勝手の年中居ばえを有所感「肉の大塚」の直営焼肉店です。老舗ならではの目利きと独自ルートで厳選された無肉がいただけます。また空間にもこだわり、デザイナー設計の落ち着いた雰囲気の個室などご家族はもちろんデートや接待、ご宴会などあらゆるシーンでゆっくりとしたひとときを。', 'home', 'message', 'Messageセクションの本文'),
  ('store_name', 'TOKACHI YAKINIKU KARIN', 'common', 'header', '店舗名'),
  ('store_name_ja', 'トカチ ヤキニク カリン', 'common', 'header', '店舗名（日本語）');
