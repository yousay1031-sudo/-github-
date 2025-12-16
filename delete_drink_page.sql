-- 1. お飲み物カテゴリのメニューアイテムを削除
DELETE FROM menu_items WHERE category_id = 6;

-- 2. お飲み物カテゴリを削除
DELETE FROM menu_categories WHERE id = 6;

-- 3. drinkページ関連のテキストデータを削除
DELETE FROM page_texts WHERE text_key LIKE 'drink_%';

-- 4. drinkページ関連の画像データを削除（存在する場合）
DELETE FROM page_images WHERE page_name = 'drink';
