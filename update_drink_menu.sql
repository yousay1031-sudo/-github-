-- 既存のドリンクメニューを削除
DELETE FROM menu_items WHERE category_id = 6;

-- BEER ビール
INSERT INTO menu_items (category_id, name, description, price, display_order, is_visible) VALUES
(6, 'サッポロクラシック（生）', 'BEER ビール', 700, 1, 1),
(6, 'SORACHI1984（生）', 'BEER ビール', 800, 2, 1),
(6, 'アサヒスーパードライ（瓶）', 'BEER ビール', 750, 3, 1),
(6, 'コロナ（瓶）', 'BEER ビール', 700, 4, 1),
(6, 'ノンアルコール（ドライゼロ）', 'BEER ビール', 550, 5, 1);

-- HIGHBALL ハイボール
INSERT INTO menu_items (category_id, name, description, price, display_order, is_visible) VALUES
(6, 'デュワーズハイボール', 'HIGHBALL ハイボール', 600, 6, 1),
(6, '角ハイボール', 'HIGHBALL ハイボール', 700, 7, 1),
(6, 'ジンジャーハイボール', 'HIGHBALL ハイボール', 650, 8, 1),
(6, 'コークハイボール', 'HIGHBALL ハイボール', 650, 9, 1),
(6, 'レモンハイボール', 'HIGHBALL ハイボール', 650, 10, 1);

-- CHUHAI チューハイ
INSERT INTO menu_items (category_id, name, description, price, display_order, is_visible) VALUES
(6, 'チューハイ各種', 'ライム・レモン・ピーチ・巨峰・ゆず・梅・カルピス・グレープフルーツ・シークワーサー・ウーロン・緑茶・ジャスミン・紅茶', 600, 11, 1),
(6, '黒ウーロンハイ', 'CHUHAI チューハイ', 650, 12, 1),
(6, 'ゴロゴロレモンサワー', 'CHUHAI チューハイ', 700, 13, 1),
(6, 'おかわりゴロゴロレモンサワー', 'CHUHAI チューハイ', 400, 14, 1);

-- FRUIT WINE 梅酒
INSERT INTO menu_items (category_id, name, description, price, display_order, is_visible) VALUES
(6, '梅酒', 'ロック・ソーダ割り・水割り', 600, 15, 1);

-- WINE ワイン
INSERT INTO menu_items (category_id, name, description, price, display_order, is_visible) VALUES
(6, 'グラスワイン（赤・白）', 'WINE ワイン', 600, 16, 1),
(6, 'トカップ（十勝ワイン）ハーフボトル', 'WINE ワイン', 1600, 17, 1),
(6, 'トカップ（十勝ワイン）フルボトル', 'WINE ワイン', 2700, 18, 1),
(6, 'MOET 白（モエ）シャンパン', 'WINE ワイン', 14000, 19, 1),
(6, 'MOET ロゼ（モエ）シャンパン', 'WINE ワイン', 16000, 20, 1),
(6, 'MOET ネクターインペリアル（モエ）シャンパン', 'WINE ワイン', 19000, 21, 1);

-- COCKTAIL カクテル（ALL 600円）
INSERT INTO menu_items (category_id, name, description, price, display_order, is_visible) VALUES
(6, 'ジントニック', 'COCKTAIL カクテル', 600, 22, 1),
(6, 'ジンライム', 'COCKTAIL カクテル', 600, 23, 1),
(6, 'ジンバック', 'COCKTAIL カクテル', 600, 24, 1),
(6, 'モスコミュール', 'COCKTAIL カクテル', 600, 25, 1),
(6, 'スクリュードライバー', 'COCKTAIL カクテル', 600, 26, 1),
(6, 'ブルドック', 'COCKTAIL カクテル', 600, 27, 1),
(6, 'クーニャン', 'COCKTAIL カクテル', 600, 28, 1),
(6, 'ウォッカトニック', 'COCKTAIL カクテル', 600, 29, 1),
(6, 'テキーラトニック', 'COCKTAIL カクテル', 600, 30, 1),
(6, 'テキーラサンライズ', 'COCKTAIL カクテル', 600, 31, 1),
(6, 'テキーラコーク', 'COCKTAIL カクテル', 600, 32, 1),
(6, 'カルアミルク', 'COCKTAIL カクテル', 600, 33, 1),
(6, 'カシスオレンジ', 'COCKTAIL カクテル', 600, 34, 1),
(6, 'カシスソーダ', 'COCKTAIL カクテル', 600, 35, 1),
(6, 'カシスコーク', 'COCKTAIL カクテル', 600, 36, 1),
(6, 'カシスウーロン', 'COCKTAIL カクテル', 600, 37, 1),
(6, 'ファジーネーブル', 'COCKTAIL カクテル', 600, 38, 1),
(6, 'シャンディーガフ', 'COCKTAIL カクテル', 600, 39, 1);

-- SOFTDRINK ソフトドリンク
INSERT INTO menu_items (category_id, name, description, price, display_order, is_visible) VALUES
(6, 'コーラ', 'SOFTDRINK ソフトドリンク', 400, 40, 1),
(6, 'オレンジ', 'SOFTDRINK ソフトドリンク', 400, 41, 1),
(6, 'アップル', 'SOFTDRINK ソフトドリンク', 400, 42, 1),
(6, 'グレープフルーツ', 'SOFTDRINK ソフトドリンク', 400, 43, 1),
(6, 'カルピス', 'SOFTDRINK ソフトドリンク', 400, 44, 1),
(6, 'カルピスソーダ', 'SOFTDRINK ソフトドリンク', 400, 45, 1),
(6, 'ジンジャーエール', 'SOFTDRINK ソフトドリンク', 400, 46, 1),
(6, 'ウィルキンソン（辛口）', 'SOFTDRINK ソフトドリンク', 400, 47, 1),
(6, 'ウーロン茶', 'SOFTDRINK ソフトドリンク', 400, 48, 1),
(6, '緑茶', 'SOFTDRINK ソフトドリンク', 400, 49, 1),
(6, 'ジャスミン茶', 'SOFTDRINK ソフトドリンク', 400, 50, 1),
(6, '黒烏龍茶', 'SOFTDRINK ソフトドリンク', 500, 51, 1);
