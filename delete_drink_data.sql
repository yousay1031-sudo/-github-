-- Delete drink category
DELETE FROM menu_categories WHERE id = 6;

-- Delete drink page texts
DELETE FROM page_texts WHERE text_key LIKE 'drink_%';

-- Delete drink page images (if any)
DELETE FROM page_images WHERE page_name = 'drink';
