import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

type Bindings = {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS設定
app.use('/api/*', cors())

// 静的ファイルの提供
app.use('/static/*', serveStatic({ root: './' }))

// SEO: robots.txt
app.get('/robots.txt', (c) => {
  return c.text(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: https://tokachi-yakiniku-karin.com/sitemap.xml`, 200, {
    'Content-Type': 'text/plain'
  })
})

// SEO: sitemap.xml
app.get('/sitemap.xml', (c) => {
  return c.text(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://tokachi-yakiniku-karin.com/</loc>
    <lastmod>2025-12-18</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://tokachi-yakiniku-karin.com/menu</loc>
    <lastmod>2025-12-18</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://tokachi-yakiniku-karin.com/lunch</loc>
    <lastmod>2025-12-18</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://tokachi-yakiniku-karin.com/course</loc>
    <lastmod>2025-12-18</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://tokachi-yakiniku-karin.com/commitment</loc>
    <lastmod>2025-12-18</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://tokachi-yakiniku-karin.com/access</loc>
    <lastmod>2025-12-18</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://tokachi-yakiniku-karin.com/news</loc>
    <lastmod>2025-12-18</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>`, 200, {
    'Content-Type': 'application/xml'
  })
})

// データベース初期化（page_textsテーブル）
async function initPageTextsTable(DB: D1Database) {
  try {
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS page_texts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text_key TEXT UNIQUE NOT NULL,
        text_value TEXT NOT NULL,
        page_name TEXT NOT NULL,
        section_name TEXT,
        description TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run()
    
    await DB.prepare(`CREATE INDEX IF NOT EXISTS idx_page_texts_key ON page_texts(text_key)`).run()
    await DB.prepare(`CREATE INDEX IF NOT EXISTS idx_page_texts_page ON page_texts(page_name)`).run()
    
    // デフォルトテキストを挿入
    const defaultTexts = [
      // Home page
      ['home_ground_menu_title', 'GROUND MENU', 'home', 'ground_menu', 'Ground Menuセクションのタイトル'],
      ['home_ground_menu_description', '本物の食作法で選りすぐりのときをる��<br>ここでしか食べられない「極至」上質のよさとご期待くださったみなさん。<br>～時間中の全ての食、お飲、デザートまでここならではKARINの宴。<br>ファカが付き続きうろん、ご堪念、まだ引用付のコーテブランとなる実営業り時をますます。', 'home', 'ground_menu', 'Ground Menuセクションの説明文'],
      ['home_commitment_title', 'KARINのこだわり', 'home', 'commitment', 'こだわりセクションのタイトル'],
      ['home_commitment_description', 'お肉を最もおいしい状態で楽しんでいただきたい一心から生まれた厳選素材を使った豪快メニューの数々。十勝若牛のもつ繊細な旨味、希少価値の高いアイスランドラムの芳醇な香り、一つひとつの料理にシェフの技術とこだわりが凝縮されております。産地直送ならではの新鮮さと品質をお約束いたします。', 'home', 'commitment', 'こだわりセクションの説明文'],
      ['home_message_title', 'Message', 'home', 'message', 'Messageセクションのタイトル'],
      ['home_message_content', '焼肉KARINは(お勝手の年中居ばえを有所感「肉の大塚」の直営焼肉店です。老舗ならではの目利きと独自ルートで厳選された無肉がいただけます。また空間にもこだわり、デザイナー設計の落ち着いた雰囲気の個室などご家族はもちろんデートや接待、ご宴会などあらゆるシーンでゆっくりとしたひとときを。', 'home', 'message', 'Messageセクションの本文'],
      ['home_card1_title', '厳選常陸牛ギフト', 'home', 'cards', 'カード1のタイトル'],
      ['home_card1_description', '口溶け香り高いなめらかな食感と高級感が、あなたのギフトの心をより一層伝えます。', 'home', 'cards', 'カード1の説明'],
      ['home_card2_title', 'ディナーコース', 'home', 'cards', 'カード2のタイトル'],
      ['home_card2_description', 'お肉だけではなく、お料理各種をご用意いたしました。お飲み物も豊富にございます。', 'home', 'cards', 'カード2の説明'],
      ['home_card3_title', '美味しいお肉の焼き方', 'home', 'cards', 'カード3のタイトル'],
      ['home_card3_description', '実はよくお肉料理を素晴らしく楽しく食べてきたいと、本当に各種焼き方をお教えいたします。', 'home', 'cards', 'カード3の説明'],
      
      // Menu page
      ['menu_page_title', 'メニュー', 'menu', 'header', 'メニューページのタイトル'],
      ['menu_page_subtitle', 'Menu', 'menu', 'header', 'メニューページのサブタイトル'],
      ['menu_page_description', '厳選された上質なお肉と、新鮮な食材を使った逸品の数々。KARINこだわりのメニューをご堪能ください。', 'menu', 'header', 'メニューページの説明'],
      
      // Course page
      ['course_page_title', 'コース', 'course', 'header', 'コースページのタイトル'],
      ['course_page_subtitle', 'Course', 'course', 'header', 'コースページのサブタイトル'],
      ['course_page_description', '特別な日のお食事や、大切な方とのひとときに。KARINが誇る贅沢なコースをご用意しております。', 'course', 'header', 'コースページの説明'],
      
      // Commitment page
      ['commitment_page_title', 'こだわり', 'commitment', 'header', 'こだわりページのタイトル'],
      ['commitment_page_subtitle', 'Our Commitment', 'commitment', 'header', 'こだわりページのサブタイトル'],
      ['commitment_page_description', 'KARINのこだわりは、食材の選定から調理法、そしておもてなしの心まで。すべてにおいて妥協を許しません。', 'commitment', 'header', 'こだわりページの説明'],
      
      // Access page
      ['access_page_title', '店舗情報・アクセス', 'access', 'header', 'アクセスページのタイトル'],
      ['access_page_subtitle', 'Access', 'access', 'header', 'アクセスページのサブタイトル'],
      ['access_page_description', '十勝焼肉かりんへのアクセス方法と、店舗情報をご案内いたします。', 'access', 'header', 'アクセスページの説明'],
      
      // Common
      ['store_name', 'TOKACHI YAKINIKU KARIN', 'common', 'header', '店舗名（英語）'],
      ['store_name_ja', 'トカチ ヤキニク カリン', 'common', 'header', '店舗名（日本語読み）'],
      ['store_name_kanji', '十勝焼肉かりん', 'common', 'header', '店舗名（漢字）']
    ]
    
    for (const [key, value, page, section, desc] of defaultTexts) {
      await DB.prepare(`
        INSERT OR IGNORE INTO page_texts (text_key, text_value, page_name, section_name, description)
        VALUES (?, ?, ?, ?, ?)
      `).bind(key, value, page, section, desc).run()
    }
  } catch (error) {
    console.error('Failed to initialize page_texts table:', error)
  }
}

// データベース初期化（page_imagesテーブル）
// === API Routes ===

// ニュース一覧取得（公開中のみ）
app.get('/api/news', async (c) => {
  const { DB } = c.env
  const { results } = await DB.prepare(`
    SELECT * FROM news 
    WHERE is_visible = 1
    ORDER BY published_date DESC
  `).all()
  return c.json(results)
})

// 管理用ニュース一覧取得（全件）
app.get('/api/admin/news', async (c) => {
  const { DB } = c.env
  const { results } = await DB.prepare(`
    SELECT * FROM news 
    ORDER BY published_date DESC
  `).all()
  return c.json(results)
})

// ニュース作成
app.post('/api/admin/news', async (c) => {
  const { DB } = c.env
  const { title, content, image_url, published_date, is_visible } = await c.req.json()
  
  const result = await DB.prepare(`
    INSERT INTO news (title, content, image_url, published_date, is_visible)
    VALUES (?, ?, ?, ?, ?)
  `).bind(title, content, image_url || '', published_date, is_visible ? 1 : 0).run()
  
  return c.json({ id: result.meta.last_row_id, success: true })
})

// ニュース更新
app.put('/api/admin/news/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  const { title, content, image_url, published_date, is_visible } = await c.req.json()
  
  await DB.prepare(`
    UPDATE news 
    SET title = ?, content = ?, image_url = ?, published_date = ?, is_visible = ?
    WHERE id = ?
  `).bind(title, content, image_url || '', published_date, is_visible ? 1 : 0, id).run()
  
  return c.json({ success: true })
})

// ニュース削除
app.delete('/api/admin/news/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  
  await DB.prepare(`DELETE FROM news WHERE id = ?`).bind(id).run()
  
  return c.json({ success: true })
})

// === Instagram連携API ===

// Instagram投稿を取得（テスト用）
app.get('/api/instagram/posts', async (c) => {
  const INSTAGRAM_ACCESS_TOKEN = c.env.INSTAGRAM_ACCESS_TOKEN
  
  if (!INSTAGRAM_ACCESS_TOKEN) {
    return c.json({ error: 'Instagram access token not configured' }, 500)
  }
  
  try {
    const response = await fetch(
      `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&access_token=${INSTAGRAM_ACCESS_TOKEN}`
    )
    
    const data = await response.json()
    
    if (!response.ok) {
      return c.json({ 
        error: 'Instagram API error', 
        details: data.error 
      }, 400)
    }
    
    return c.json({
      success: true,
      posts: data.data || [],
      count: data.data?.length || 0
    })
  } catch (error) {
    return c.json({ 
      error: 'Failed to fetch Instagram posts',
      details: error.message 
    }, 500)
  }
})

// Instagram投稿をNewsテーブルに同期
app.post('/api/admin/sync-instagram', async (c) => {
  const { DB } = c.env
  const INSTAGRAM_ACCESS_TOKEN = c.env.INSTAGRAM_ACCESS_TOKEN
  
  if (!INSTAGRAM_ACCESS_TOKEN) {
    return c.json({ 
      error: 'Instagram access token not configured',
      message: 'Please set INSTAGRAM_ACCESS_TOKEN in Cloudflare Secrets'
    }, 500)
  }
  
  try {
    // Instagram APIから最新の投稿を取得（最大25件）
    const response = await fetch(
      `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=25&access_token=${INSTAGRAM_ACCESS_TOKEN}`
    )
    
    const data = await response.json()
    
    if (!response.ok) {
      return c.json({ 
        error: 'Instagram API error', 
        details: data.error 
      }, 400)
    }
    
    const posts = data.data || []
    let syncedCount = 0
    let skippedCount = 0
    const syncedPosts = []
    
    // 各投稿をNewsテーブルに追加
    for (const post of posts) {
      // Instagram投稿IDで既に同期済みかチェック
      const existing = await DB.prepare(
        'SELECT id FROM news WHERE title LIKE ?'
      ).bind(`%Instagram%${post.id}%`).first()
      
      if (existing) {
        skippedCount++
        continue
      }
      
      // キャプションから最初の50文字をタイトルに
      let title = post.caption 
        ? post.caption.substring(0, 50).replace(/\n/g, ' ') 
        : 'Instagram投稿'
      
      // Instagram投稿IDを含める（重複チェック用）
      title = `${title} [Instagram: ${post.id}]`
      
      // 本文（全文）
      const content = post.caption || ''
      
      // 画像URL（画像/動画の場合）
      let imageUrl = ''
      if (post.media_type === 'IMAGE' || post.media_type === 'CAROUSEL_ALBUM') {
        imageUrl = post.media_url || ''
      } else if (post.media_type === 'VIDEO') {
        imageUrl = post.thumbnail_url || ''
      }
      
      // 投稿日
      const publishedDate = new Date(post.timestamp).toISOString().split('T')[0]
      
      // Newsテーブルに挿入
      const result = await DB.prepare(`
        INSERT INTO news (title, content, image_url, published_date, is_visible)
        VALUES (?, ?, ?, ?, 1)
      `).bind(title, content, imageUrl, publishedDate).run()
      
      syncedPosts.push({
        id: result.meta.last_row_id,
        instagram_id: post.id,
        title,
        published_date: publishedDate
      })
      
      syncedCount++
    }
    
    return c.json({ 
      success: true, 
      syncedCount,
      skippedCount,
      totalPosts: posts.length,
      syncedPosts,
      message: `${syncedCount}件の新しい投稿を同期しました（${skippedCount}件はスキップ）`
    })
  } catch (error) {
    return c.json({ 
      error: 'Sync failed',
      details: error.message 
    }, 500)
  }
})

// Instagram同期ステータス確認
app.get('/api/admin/instagram-status', async (c) => {
  const { DB } = c.env
  const INSTAGRAM_ACCESS_TOKEN = c.env.INSTAGRAM_ACCESS_TOKEN
  
  // トークン設定チェック
  const hasToken = !!INSTAGRAM_ACCESS_TOKEN
  
  // 最新のInstagram同期記事を取得
  const { results } = await DB.prepare(`
    SELECT * FROM news 
    WHERE title LIKE '%Instagram%'
    ORDER BY created_at DESC
    LIMIT 5
  `).all()
  
  return c.json({
    configured: hasToken,
    lastSyncedPosts: results,
    message: hasToken 
      ? 'Instagram連携が設定されています' 
      : 'INSTAGRAM_ACCESS_TOKENが設定されていません'
  })
})

// === ランチメニューAPI ===

// ランチメニュー一覧取得（公開中のみ）
app.get('/api/lunch-menu', async (c) => {
  const { DB } = c.env
  const { results } = await DB.prepare(`
    SELECT * FROM lunch_menu 
    WHERE is_visible = 1
    ORDER BY display_order ASC
  `).all()
  return c.json(results)
})

// 管理用ランチメニュー一覧取得（全件）
app.get('/api/admin/lunch-menu', async (c) => {
  const { DB } = c.env
  const { results } = await DB.prepare(`
    SELECT * FROM lunch_menu 
    ORDER BY display_order ASC
  `).all()
  return c.json(results)
})

// ランチメニュー作成
app.post('/api/admin/lunch-menu', async (c) => {
  const { DB } = c.env
  const { name, name_en, price, description, image_url, display_order, is_visible } = await c.req.json()
  
  const result = await DB.prepare(`
    INSERT INTO lunch_menu (name, name_en, price, description, image_url, display_order, is_visible)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(name, name_en || '', price, description || '', image_url, display_order || 0, is_visible ? 1 : 0).run()
  
  return c.json({ id: result.meta.last_row_id, success: true })
})

// ランチメニュー更新
app.put('/api/admin/lunch-menu/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  const { name, name_en, price, description, image_url, display_order, is_visible } = await c.req.json()
  
  await DB.prepare(`
    UPDATE lunch_menu 
    SET name = ?, name_en = ?, price = ?, description = ?, image_url = ?, display_order = ?, is_visible = ?
    WHERE id = ?
  `).bind(name, name_en || '', price, description || '', image_url, display_order || 0, is_visible ? 1 : 0, id).run()
  
  return c.json({ success: true })
})

// ランチメニュー削除
app.delete('/api/admin/lunch-menu/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  
  await DB.prepare(`DELETE FROM lunch_menu WHERE id = ?`).bind(id).run()
  
  return c.json({ success: true })
})

// メニューカテゴリー一覧取得
app.get('/api/menu-categories', async (c) => {
  const { DB } = c.env
  const { results } = await DB.prepare(`
    SELECT * FROM menu_categories 
    ORDER BY display_order ASC
  `).all()
  return c.json(results)
})

// メニューアイテム一覧取得（カテゴリーごと）
app.get('/api/menu-items', async (c) => {
  const { DB } = c.env
  const categoryId = c.req.query('category_id')
  
  let query = `
    SELECT mi.*, mc.name as category_name 
    FROM menu_items mi 
    LEFT JOIN menu_categories mc ON mi.category_id = mc.id 
    WHERE mi.is_visible = 1
  `
  
  if (categoryId) {
    query += ` AND mi.category_id = ${categoryId}`
  }
  
  query += ` ORDER BY mi.display_order ASC`
  
  const { results } = await DB.prepare(query).all()
  return c.json(results)
})

// 全メニューアイテム取得（管理画面用）
app.get('/api/admin/menu-items', async (c) => {
  const { DB } = c.env
  const { results } = await DB.prepare(`
    SELECT mi.*, mc.name as category_name 
    FROM menu_items mi 
    LEFT JOIN menu_categories mc ON mi.category_id = mc.id 
    ORDER BY mc.display_order ASC, mi.display_order ASC
  `).all()
  return c.json(results)
})

// メニューアイテム作成
app.post('/api/admin/menu-items', async (c) => {
  const { DB } = c.env
  const data = await c.req.json()
  
  const result = await DB.prepare(`
    INSERT INTO menu_items (category_id, name, description, price, image_url, display_order, is_visible)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    data.category_id,
    data.name,
    data.description || null,
    data.price || null,
    data.image_url || null,
    data.display_order || 0,
    data.is_visible !== undefined ? data.is_visible : 1
  ).run()
  
  return c.json({ success: true, id: result.meta.last_row_id })
})

// メニューアイテム更新
app.put('/api/admin/menu-items/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  const data = await c.req.json()
  
  await DB.prepare(`
    UPDATE menu_items 
    SET category_id = ?, name = ?, description = ?, price = ?, 
        image_url = ?, display_order = ?, is_visible = ?
    WHERE id = ?
  `).bind(
    data.category_id,
    data.name,
    data.description || null,
    data.price || null,
    data.image_url || null,
    data.display_order || 0,
    data.is_visible !== undefined ? data.is_visible : 1,
    id
  ).run()
  
  return c.json({ success: true })
})

// メニューアイテム削除
app.delete('/api/admin/menu-items/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  
  await DB.prepare(`DELETE FROM menu_items WHERE id = ?`).bind(id).run()
  return c.json({ success: true })
})

// 画像アップロード（Base64形式）
app.post('/api/admin/upload-image', async (c) => {
  try {
    const data = await c.req.json()
    const { imageData } = data
    
    if (!imageData || !imageData.startsWith('data:image/')) {
      return c.json({ error: 'Invalid image data' }, 400)
    }
    
    // Base64画像をそのまま返す（データベースに保存可能な形式）
    return c.json({ 
      success: true, 
      imageUrl: imageData 
    })
  } catch (error) {
    return c.json({ error: 'Failed to upload image' }, 500)
  }
})

// カテゴリー画像更新
app.put('/api/admin/menu-categories/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  const data = await c.req.json()
  
  await DB.prepare(`
    UPDATE menu_categories 
    SET image_url = ?
    WHERE id = ?
  `).bind(data.image_url || null, id).run()
  
  return c.json({ success: true })
})

// ページ画像一覧取得
app.get('/api/page-images', async (c) => {
  const { DB } = c.env
  await initPageImagesTable(DB)
  
  const { results } = await DB.prepare(`
    SELECT * FROM page_images 
    ORDER BY page_name ASC, section_name ASC
  `).all()
  return c.json(results)
})

// ページ画像取得（キー指定）
app.get('/api/page-images/:key', async (c) => {
  const { DB } = c.env
  const key = c.req.param('key')
  
  const result = await DB.prepare(`
    SELECT * FROM page_images WHERE image_key = ?
  `).bind(key).first()
  
  return c.json(result || { image_url: '' })
})

// ページ画像更新（管理画面用）
// ページ画像追加（管理画面用）
app.post('/api/admin/page-images', async (c) => {
  const { DB } = c.env
  const data = await c.req.json()
  
  await DB.prepare(`
    INSERT INTO page_images (image_key, image_url, page_name, section_name, description, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).bind(
    data.image_key,
    data.image_url,
    data.page_name,
    data.section_name || '',
    data.description || ''
  ).run()
  
  return c.json({ success: true })
})

app.put('/api/admin/page-images/:key', async (c) => {
  const { DB } = c.env
  const key = c.req.param('key')
  const data = await c.req.json()
  
  await DB.prepare(`
    UPDATE page_images 
    SET image_url = ?, updated_at = CURRENT_TIMESTAMP
    WHERE image_key = ?
  `).bind(data.image_url, key).run()
  
  return c.json({ success: true })
})

// ページテキスト一覧取得
app.get('/api/page-texts', async (c) => {
  const { DB } = c.env
  await initPageTextsTable(DB)
  
  const { results } = await DB.prepare(`
    SELECT * FROM page_texts 
    ORDER BY page_name ASC, section_name ASC
  `).all()
  return c.json(results)
})

// ページテキスト取得（キー指定）
app.get('/api/page-texts/:key', async (c) => {
  const { DB } = c.env
  const key = c.req.param('key')
  
  const result = await DB.prepare(`
    SELECT * FROM page_texts WHERE text_key = ?
  `).bind(key).first()
  
  return c.json(result || { text_value: '' })
})

// ページテキスト更新（管理画面用）
app.put('/api/admin/page-texts/:key', async (c) => {
  const { DB } = c.env
  const key = c.req.param('key')
  const data = await c.req.json()
  
  await DB.prepare(`
    UPDATE page_texts 
    SET text_value = ?, updated_at = CURRENT_TIMESTAMP
    WHERE text_key = ?
  `).bind(data.text_value, key).run()
  
  return c.json({ success: true })
})

// ページ画像テーブル初期化
async function initPageImagesTable(DB: any) {
  await DB.prepare(`
    CREATE TABLE IF NOT EXISTS page_images (
      image_key TEXT PRIMARY KEY,
      image_url TEXT NOT NULL,
      page_name TEXT NOT NULL,
      section_name TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run()
  
  await DB.prepare(`
    CREATE INDEX IF NOT EXISTS idx_page_images_page ON page_images(page_name)
  `).run()
  
  // 初期データ挿入
  const defaultImages = [
    // Home - Hero section
    ['hero_slide_1', '/hero-slide-1.jpg', 'home', 'hero', 'ヒーロースライド1 - 焼肉テーブル'],
    ['hero_slide_2', '/hero-slide-2.jpg', 'home', 'hero', 'ヒーロースライド2 - ワイン乾杯'],
    ['hero_slide_3', '/hero-slide-3.jpg', 'home', 'hero', 'ヒーロースライド3 - 個室'],
    ['hero_logo', '/logo-hero.png', 'home', 'hero', 'ヒーローセクションロゴ'],
    // Home - Ground menu section
    ['ground_menu_bg', '/ground-menu-main.jpg', 'home', 'ground_menu', 'GROUND MENUセクション背景'],
    // Home - Commitment section
    ['home_commitment_wagyu', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1920&q=80', 'home', 'commitment', 'こだわりセクション - 和牛メイン画像'],
    ['home_commitment_card1', 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&q=80', 'home', 'commitment', 'こだわりセクション - カード1（厳選常陸牛ギフト）'],
    ['home_commitment_card2', 'https://images.unsplash.com/photo-1558030006-450675393462?w=600&q=80', 'home', 'commitment', 'こだわりセクション - カード2（ディナーコース）'],
    ['home_commitment_card3', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80', 'home', 'commitment', 'こだわりセクション - カード3（オンライン注文）'],
    // Home - Message section
    ['home_message_photo', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80', 'home', 'message', 'メッセージセクション - 店舗写真'],
    // Commitment page
    ['commitment_image_1', 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=800&q=80', 'commitment', 'main', 'こだわり画像1'],
    ['commitment_image_2', 'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=800&q=80', 'commitment', 'main', 'こだわり画像2']
  ]
  
  for (const [key, url, page, section, desc] of defaultImages) {
    await DB.prepare(`
      INSERT OR IGNORE INTO page_images (image_key, image_url, page_name, section_name, description)
      VALUES (?, ?, ?, ?, ?)
    `).bind(key, url, page, section, desc).run()
  }
}

// ページ画像一覧取得
app.get('/api/page-images', async (c) => {
  const { DB } = c.env
  await initPageImagesTable(DB)
  
  const { results } = await DB.prepare(`
    SELECT * FROM page_images 
    ORDER BY page_name ASC, section_name ASC
  `).all()
  return c.json(results)
})

// ページ画像取得（キー指定）
app.get('/api/page-images/:key', async (c) => {
  const { DB } = c.env
  const key = c.req.param('key')
  
  const result = await DB.prepare(`
    SELECT * FROM page_images WHERE image_key = ?
  `).bind(key).first()
  
  return c.json(result || { image_url: '' })
})

// ページ画像更新（管理画面用）
app.put('/api/admin/page-images/:key', async (c) => {
  const { DB } = c.env
  const key = c.req.param('key')
  const data = await c.req.json()
  
  await DB.prepare(`
    UPDATE page_images 
    SET image_url = ?, updated_at = CURRENT_TIMESTAMP
    WHERE image_key = ?
  `).bind(data.image_url, key).run()
  
  return c.json({ success: true })
})

// ページ画像追加（管理画面用）
app.post('/api/admin/page-images', async (c) => {
  const { DB } = c.env
  const data = await c.req.json()
  
  await DB.prepare(`
    INSERT INTO page_images (image_key, image_url, page_name, section_name, description, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).bind(
    data.image_key,
    data.image_url,
    data.page_name,
    data.section_name || '',
    data.description || ''
  ).run()
  
  return c.json({ success: true })
})

// 店舗情報取得
app.get('/api/store-info', async (c) => {
  const { DB } = c.env
  const { results } = await DB.prepare(`SELECT * FROM store_info`).all()
  
  const storeInfo: Record<string, string> = {}
  results.forEach((row: any) => {
    storeInfo[row.key] = row.value
  })
  
  return c.json(storeInfo)
})

// === Frontend Pages ===

// トップページ
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>帯広の高級焼肉 TOKACHI YAKINIKU KARIN | 十勝若牛・オーガニックラム・個室完備</title>
        <meta name="description" content="帯広の高級焼肉店TOKACHI YAKINIKU KARIN。十勝若牛、希少なオーガニックラム、新鮮なレバー刺身をご堪能。デート・宴会に最適な個室完備。ワイン・日本酒・サッポロクラシックなど豊富なドリンクメニュー。">
        <meta name="keywords" content="焼肉,帯広,ディナー,デート,宴会,個室,高級,オーガニック,オーガニックラム,十勝若牛,レバー,もつ鍋,ちりとり鍋,刺身,ワイン,日本酒,サッポロビール,クラシック,ソラチ,ビール">
        <meta name="author" content="TOKACHI YAKINIKU KARIN">
        <link rel="canonical" href="https://tokachi-yakiniku-karin.com/">
        
        <!-- Open Graph / Facebook -->
        <meta property="og:type" content="restaurant">
        <meta property="og:url" content="https://tokachi-yakiniku-karin.com/">
        <meta property="og:title" content="帯広の高級焼肉 TOKACHI YAKINIKU KARIN | 十勝若牛・オーガニックラム">
        <meta property="og:description" content="十勝若牛、希少なオーガニックラム、新鮮なレバー刺身をご堪能。デート・宴会に最適な個室完備。">
        <meta property="og:image" content="https://tokachi-yakiniku-karin.com/logo-hero.png">
        <meta property="og:locale" content="ja_JP">
        <meta property="og:site_name" content="TOKACHI YAKINIKU KARIN">
        
        <!-- Twitter -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="帯広の高級焼肉 TOKACHI YAKINIKU KARIN">
        <meta name="twitter:description" content="十勝若牛、オーガニックラム、レバー刺身。個室完備の高級焼肉店。">
        <meta name="twitter:image" content="https://tokachi-yakiniku-karin.com/logo-hero.png">
        
        <!-- Geo Tags -->
        <meta name="geo.region" content="JP-01">
        <meta name="geo.placename" content="帯広市">
        <meta name="geo.position" content="42.9236;143.1947">
        <meta name="ICBM" content="42.9236, 143.1947">
        
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@200;300;400;600;700;900&family=Noto+Sans+JP:wght@100;300;400;500;700&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Noto Sans JP', sans-serif;
            background: #0a0a0a;
            color: #e0e0e0;
            line-height: 1.8;
          }
          
          h1, h2, h3, h4 {
            font-family: 'Noto Serif JP', serif;
            font-weight: 300;
            letter-spacing: 0.1em;
          }
          
          .hero-section {
            position: relative;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }
          
          .hero-slider {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 0;
          }
          
          .hero-slide {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0;
            transition: opacity 1.5s ease-in-out;
            background-size: cover;
            background-position: center;
          }
          
          .hero-slide.active {
            opacity: 1;
          }
          
          .hero-slide::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.4));
          }
          
          .hero-content {
            position: relative;
            z-index: 10;
          }
          
          .news-panel {
            position: absolute;
            bottom: 60px;
            right: 60px;
            background: rgba(40, 30, 20, 0.95);
            backdrop-filter: blur(10px);
            padding: 2rem 2.5rem;
            max-width: 400px;
            border-left: 3px solid #c9a961;
            box-shadow: 0 10px 40px rgba(0,0,0,0.6);
          }
          
          @media (max-width: 768px) {
            .news-panel {
              bottom: 30px;
              right: 20px;
              left: 20px;
              max-width: none;
              padding: 1.5rem;
            }
          }
          
          .ground-menu-section {
            position: relative;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }
          
          .ground-menu-bg-layer {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            z-index: 1;
          }
          
          .ground-menu-image {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            z-index: 0;
            filter: brightness(1.3) contrast(1.05) saturate(1.1);
            image-rendering: -webkit-optimize-contrast;
            image-rendering: crisp-edges;
            backface-visibility: hidden;
            -webkit-font-smoothing: antialiased;
          }
          
          .ground-menu-content {
            position: relative;
            z-index: 2;
          }
          
          .ground-menu-btn {
            background: #9d8b6a;
            border: none;
            color: #2a2115;
            padding: 0.9rem 2.5rem;
            font-size: 1rem;
            letter-spacing: 0.2em;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            font-family: 'Noto Serif JP', serif;
            font-weight: 400;
            text-transform: lowercase;
          }
          
          .ground-menu-btn:hover {
            background: rgba(0, 0, 0, 0.9);
            color: white;
            transform: translateY(-3px);
            box-shadow: 0 12px 35px rgba(0, 0, 0, 0.6);
          }
          
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .section-title {
            font-size: 2rem;
            text-align: center;
            margin-bottom: 1rem;
            font-weight: 300;
            letter-spacing: 0.2em;
          }
          
          .section-subtitle {
            text-align: center;
            font-size: 0.85rem;
            color: #999;
            margin-bottom: 4rem;
            letter-spacing: 0.1em;
            line-height: 1.9;
          }
          
          .card-link {
            display: block;
            position: relative;
            overflow: hidden;
            border-radius: 0;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            background: #1a1a1a;
            border: 1px solid rgba(255,255,255,0.05);
          }
          
          .card-link:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 35px rgba(0,0,0,0.5);
            border-color: rgba(212, 175, 55, 0.2);
          }
          
          .card-link:hover .card-image {
            transform: scale(1.05);
            filter: brightness(1.1);
          }
          
          .card-image {
            width: 100%;
            height: 320px;
            object-fit: cover;
            transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
            filter: brightness(0.85);
          }
          
          .card-content {
            padding: 2rem 1.8rem;
            background: #1a1a1a;
          }
          
          .card-title {
            font-size: 1.3rem;
            margin-bottom: 1rem;
            font-weight: 300;
            letter-spacing: 0.15em;
            font-family: 'Noto Serif JP', serif;
          }
          
          .card-text {
            color: #999;
            font-size: 0.85rem;
            line-height: 1.9;
            margin-bottom: 1.5rem;
            letter-spacing: 0.05em;
          }
          
          .card-arrow {
            display: inline-block;
            color: #d4af37;
            font-size: 0.85rem;
            letter-spacing: 0.15em;
            transition: all 0.3s ease;
          }
          
          .card-link:hover .card-arrow {
            letter-spacing: 0.2em;
            padding-left: 0.5rem;
          }
          
          .bg-dark {
            background: #0a0a0a;
          }
          
          .bg-dark-alt {
            background: #141414;
          }
          
          nav {
            background: rgba(10, 10, 10, 0.95);
            backdrop-filter: blur(10px);
          }
          
          .nav-link {
            position: relative;
            font-size: 0.9rem;
            letter-spacing: 0.1em;
            transition: color 0.3s ease;
          }
          
          .nav-link:after {
            content: '';
            position: absolute;
            bottom: -4px;
            left: 0;
            width: 0;
            height: 1px;
            background: #d4af37;
            transition: width 0.3s ease;
          }
          
          .nav-link:hover:after {
            width: 100%;
          }
          
          .message-box {
            background: rgba(26, 26, 26, 0.5);
            border-left: 2px solid #d4af37;
            padding: 2.5rem 2rem;
            margin: 0;
          }
          
          .divider {
            width: 60px;
            height: 1px;
            background: #d4af37;
            margin: 2rem auto;
          }
          
          /* ハンバーガーメニュー */
          .hamburger {
            display: none;
            flex-direction: column;
            cursor: pointer;
            padding: 0.5rem;
          }
          
          @media (max-width: 768px) {
            .hamburger {
              display: flex;
            }
          }
          
          .hamburger span {
            width: 25px;
            height: 2px;
            background: white;
            margin: 3px 0;
            transition: all 0.3s ease;
          }
          
          .hamburger.active span:nth-child(1) {
            transform: rotate(45deg) translate(6px, 6px);
          }
          
          .hamburger.active span:nth-child(2) {
            opacity: 0;
          }
          
          .hamburger.active span:nth-child(3) {
            transform: rotate(-45deg) translate(7px, -7px);
          }
          
          .mobile-menu {
            display: none;
            position: fixed;
            top: 96px;
            left: 0;
            right: 0;
            background: rgba(10, 10, 10, 0.98);
            backdrop-filter: blur(10px);
            padding: 2rem;
            z-index: 40;
            border-top: 1px solid rgba(212, 175, 55, 0.2);
          }
          
          .mobile-menu.active {
            display: block;
            animation: slideDown 0.3s ease;
          }
          
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .mobile-menu a {
            display: block;
            padding: 1rem 0;
            color: white;
            text-decoration: none;
            font-size: 1.1rem;
            letter-spacing: 0.1em;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
          }
          
          .mobile-menu a:hover {
            color: #d4af37;
            padding-left: 1rem;
          }
          
          .mobile-menu a:last-child {
            border-bottom: none;
          }
        </style>
        
        <!-- Structured Data (JSON-LD) -->
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Restaurant",
          "name": "TOKACHI YAKINIKU KARIN",
          "alternateName": "トカチ ヤキニク カリン",
          "image": "https://tokachi-yakiniku-karin.com/logo-hero.png",
          "description": "帯広の高級焼肉店。十勝若牛、希少なオーガニックラム、新鮮なレバー刺身をご堪能。デート・宴会に最適な個室完備。",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "西一条南8-20-5",
            "addressLocality": "帯広市",
            "addressRegion": "北海道",
            "postalCode": "080-0011",
            "addressCountry": "JP"
          },
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": 42.9236,
            "longitude": 143.1947
          },
          "telephone": "+81-50-8883-6929",
          "url": "https://tokachi-yakiniku-karin.com/",
          "priceRange": "¥¥¥",
          "servesCuisine": ["焼肉", "Japanese", "Yakiniku"],
          "acceptsReservations": "True",
          "menu": "https://tokachi-yakiniku-karin.com/menu",
          "hasMenu": "https://tokachi-yakiniku-karin.com/menu",
          "openingHoursSpecification": [
            {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
              "opens": "17:00",
              "closes": "23:00"
            },
            {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": ["Saturday", "Sunday"],
              "opens": "17:00",
              "closes": "23:00"
            }
          ],
          "sameAs": [
            "https://www.instagram.com/tokachi_yakiniku_karin"
          ],
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "reviewCount": "120"
          }
        }
        </script>
    </head>
    <body class="bg-dark">
        <!-- ナビゲーション -->
        <nav class="fixed w-full top-0 z-50 text-white shadow-2xl">
            <div class="max-w-7xl mx-auto px-6 lg:px-8">
                <div class="flex justify-between items-center h-24">
                    <div class="flex-shrink-0">
                        <a href="/" class="flex items-center">
                          <img src="/logo-header.png" alt="TOKACHI YAKINIKU KARIN Logo" class="h-16 w-auto">
                        </a>
                    </div>
                    <!-- デスクトップメニュー -->
                    <div class="hidden md:flex space-x-10">
                        <a href="/news" class="nav-link text-white hover:text-yellow-500">news</a>
                        <a href="/menu" class="nav-link text-white hover:text-yellow-500">dinner</a>
                        <a href="/course" class="nav-link text-white hover:text-yellow-500">course</a>
                        <a href="/commitment" class="nav-link text-white hover:text-yellow-500">preference</a>
                        <a href="/lunch" class="nav-link text-white hover:text-yellow-500">lunch</a>
                        <a href="/access" class="nav-link text-white hover:text-yellow-500">access</a>
                        <a href="/admin" class="nav-link text-yellow-600 hover:text-yellow-500">
                          <i class="fas fa-cog text-sm"></i> 管理
                        </a>
                    </div>
                    <!-- ハンバーガーメニューボタン -->
                    <div class="hamburger md:hidden" onclick="toggleMobileMenu()">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        </nav>
        
        <!-- モバイルメニュー -->
        <div class="mobile-menu" id="mobileMenu">
            <a href="/news">news</a>
            <a href="/menu">dinner</a>
            <a href="/course">course</a>
            <a href="/commitment">preference</a>
            <a href="/lunch">lunch</a>
            <a href="/access">access</a>
            <a href="/admin"><i class="fas fa-cog"></i> 管理</a>
        </div>

        <!-- ヒーローセクション with Slideshow & News Overlay -->
        <div class="hero-section">
            <!-- Slider Background -->
            <div class="hero-slider">
                <div class="hero-slide active" style="background-image: url('/hero-slide-1.jpg')"></div>
                <div class="hero-slide" style="background-image: url('/hero-slide-2.jpg')"></div>
                <div class="hero-slide" style="background-image: url('/hero-slide-3.jpg')"></div>
            </div>
            
            <!-- Hero Content -->
            <div class="hero-content flex flex-col items-center justify-center px-4">
                <div class="text-center" style="animation: fadeInUp 1.5s ease-out">
                    <img src="/logo-hero.png" alt="十勝焼肉かりん" class="mx-auto" style="max-width: 800px; width: 90%; height: auto; filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.7));">
                </div>
            </div>
            
            <!-- News Panel -->
            <div class="news-panel">
                <div class="flex items-center mb-3">
                    <i class="fas fa-bullhorn text-yellow-600 mr-3"></i>
                    <h3 class="text-yellow-600 text-sm tracking-widest" style="font-family: 'Noto Serif JP'">NEWS</h3>
                </div>
                <div id="heroNewsList" class="space-y-3">
                    <div class="border-l-2 border-gray-700 pl-3">
                        <p class="text-gray-400 text-xs mb-1">読み込み中...</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Ground Menu Section -->
        <section class="ground-menu-section">
            <!-- レイヤー1: 画像 (z-index: 0) -->
            <img src="/ground-menu-main.jpg" alt="十勝焼肉" class="ground-menu-image">
            
            <!-- レイヤー2: 黒背景 60% (z-index: 1) -->
            <div class="ground-menu-bg-layer"></div>
            
            <!-- レイヤー3: コンテンツ (z-index: 2) -->
            <div class="ground-menu-content w-full max-w-7xl mx-auto px-6 lg:px-8">
                <div class="text-center">
                    <h2 class="text-5xl md:text-6xl lg:text-7xl text-white mb-8 font-light tracking-widest" style="font-family: 'Noto Serif JP'; letter-spacing: 0.5em;" data-text="home_ground_menu_title">GROUND MENU</h2>
                    <div class="max-w-4xl mx-auto mb-16">
                        <p class="text-gray-100 text-sm md:text-base leading-relaxed" style="line-height: 2.2;" data-text="home_ground_menu_description">
                          本物の食作法で選りすぐりのときをる。<br>
                          ここでしか食べられない「極至」上質のよさとご期待くださったみなさん。<br>
                          ～時間中の全ての食、お飲、デザートまでここならではKARINの宴。<br>
                          ファカが付き続きうろん、ご堪念、まだ引用付のコーテブランとなる実営業り時をますます。
                        </p>
                    </div>
                    
                    <!-- 3つのボタン -->
                    <div class="flex flex-col md:flex-row justify-center items-center gap-5 max-w-2xl mx-auto" style="margin-top: 389px;">
                        <a href="/menu" class="ground-menu-btn w-full md:w-auto">
                            dinner
                        </a>
                        
                        <a href="/course" class="ground-menu-btn w-full md:w-auto">
                            course
                        </a>
                    </div>
                </div>
            </div>
        </section>
        
        <!-- こだわりセクション (Features) - Redesigned -->
        <section class="relative" style="height: 100vh; background: #000;">
            <!-- 上半分: 50vh -->
            <div class="relative" style="height: 50vh;">
                <!-- レイヤー1: 和牛の写真（全幅1920px、45vh） z-index: 1 -->
                <div class="absolute top-0 left-1/2 transform -translate-x-1/2" style="width: 1920px; max-width: 100%; height: 45vh; z-index: 1;">
                    <img src="https://images.unsplash.com/photo-1544025162-d76694265947?w=1920&q=80" 
                         alt="和牛" 
                         class="w-full h-full object-cover"
                         style="filter: brightness(1.1) contrast(1.05) saturate(1.1);">
                </div>
                
                <!-- レイヤー2: 黒透過ボックス（右側、W500 H350、透過率60%） z-index: 2 -->
                <div class="absolute" 
                     style="top: 50%; right: 10%; transform: translateY(-50%); width: 500px; height: 350px; max-width: 90%; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(5px); padding: 3rem; z-index: 2;">
                    <div class="flex h-full">
                        <!-- 左半分: タイトルとボタン -->
                        <div class="w-1/2 flex flex-col justify-between pr-4 border-r border-gray-700">
                            <div>
                                <h2 class="text-white text-4xl font-light tracking-wider mb-8" style="font-family: 'Noto Serif JP'; line-height: 1.6;" data-text="home_commitment_title">
                                    KARINの<br>こだわり
                                </h2>
                            </div>
                            <a href="/commitment" 
                               class="inline-block bg-transparent border border-yellow-700 text-yellow-700 px-6 py-2 text-sm tracking-widest hover:bg-yellow-700 hover:text-black transition-all duration-300"
                               style="width: fit-content;">
                                read more
                            </a>
                        </div>
                        
                        <!-- 右半分: テキスト -->
                        <div class="w-1/2 pl-4 flex items-center">
                            <p class="text-gray-300 text-xs leading-loose" data-text="home_commitment_description">
                                お肉を最もおいしい状態で楽しんでいただきたい一心から生まれた厳選素材を使った豪快メニューの数々。十勝若牛のもつ繊細な旨味、希少価値の高いアイスランドラムの芳醇な香り、一つひとつの料理にシェフの技術とこだわりが凝縮されております。産地直送ならではの新鮮さと品質をお約束いたします。
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 下半分: 50vh - 3つのカード -->
            <div class="absolute bottom-0 left-0 right-0 flex justify-center items-center gap-6 px-8" style="height: 50vh;">
                <!-- カード1: 十勝若牛 -->
                <div class="relative overflow-hidden group" style="width: 280px; height: 420px; background: #1a1a1a;">
                    <img src="https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&q=80" 
                         alt="十勝若牛" 
                         class="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                         style="filter: brightness(0.9);">
                    <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
                    <div class="p-6 bg-gradient-to-b from-transparent to-black/80 absolute bottom-0 left-0 right-0">
                        <h3 class="text-white text-xl font-light mb-3 tracking-wider" style="font-family: 'Noto Serif JP'; writing-mode: horizontal-tb;" data-text="home_card1_title">
                            厳選常陸牛<br>ギフト
                        </h3>
                        <p class="text-gray-400 text-xs leading-relaxed mb-4" data-text="home_card1_description">
                            口溶け香り高いなめらかな食感と高級感が、あなたのギフトの心をより一層伝えます。
                        </p>
                        <a href="/menu" class="text-yellow-600 text-xs tracking-wider hover:text-yellow-500 transition-colors">
                            詳しく見る →
                        </a>
                    </div>
                </div>
                
                <!-- カード2: アイスランドラム -->
                <div class="relative overflow-hidden group" style="width: 280px; height: 420px; background: #1a1a1a;">
                    <img src="https://images.unsplash.com/photo-1558030006-450675393462?w=600&q=80" 
                         alt="アイスランドラム" 
                         class="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                         style="filter: brightness(0.9);">
                    <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
                    <div class="p-6 bg-gradient-to-b from-transparent to-black/80 absolute bottom-0 left-0 right-0">
                        <h3 class="text-white text-xl font-light mb-3 tracking-wider" style="font-family: 'Noto Serif JP';" data-text="home_card2_title">
                            ディナー<br>コース
                        </h3>
                        <p class="text-gray-400 text-xs leading-relaxed mb-4" data-text="home_card2_description">
                            お肉だけではなく、お料理各種をご用意いたしました。お飲み物も豊富にございます。
                        </p>
                        <a href="/course" class="text-yellow-600 text-xs tracking-wider hover:text-yellow-500 transition-colors">
                            詳しく見る →
                        </a>
                    </div>
                </div>
                
                <!-- カード3: 年末オードブル -->
                <div class="relative overflow-hidden group" style="width: 280px; height: 420px; background: #1a1a1a;">
                    <img src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80" 
                         alt="年末オードブル" 
                         class="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                         style="filter: brightness(0.9);">
                    <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
                    <div class="p-6 bg-gradient-to-b from-transparent to-black/80 absolute bottom-0 left-0 right-0">
                        <h3 class="text-white text-xl font-light mb-3 tracking-wider" style="font-family: 'Noto Serif JP';" data-text="home_card3_title">
                            年末<br>オードブル
                        </h3>
                        <p class="text-gray-400 text-xs leading-relaxed mb-4" data-text="home_card3_description">
                            実はよくお肉料理を素晴らしく楽しく食べてきたいと、本当に各種焼き方をお教えいたします。
                        </p>
                        <a href="/osechi" class="text-yellow-600 text-xs tracking-wider hover:text-yellow-500 transition-colors">
                            詳しく見る →
                        </a>
                    </div>
                </div>
            </div>
        </section>

        <!-- Messageセクション - Redesigned -->
        <section class="relative" style="background: linear-gradient(135deg, #b8915f 0%, #9d7444 25%, #85603a 50%, #6d4c2e 75%, #4a3220 100%); min-height: 70vh;">
            <div class="max-w-7xl mx-auto px-6 lg:px-8 py-20">
                <div class="grid md:grid-cols-2 gap-16 items-center">
                    <!-- 左側: 店舗の写真 -->
                    <div class="relative">
                        <div class="relative overflow-hidden shadow-2xl" style="border: 8px solid rgba(0, 0, 0, 0.8);">
                            <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80" 
                                 alt="TOKACHI YAKINIKU KARIN 店舗" 
                                 class="w-full h-[400px] md:h-[500px] object-cover"
                                 style="filter: brightness(0.95) contrast(1.1);">
                        </div>
                    </div>
                    
                    <!-- 右側: Messageテキスト -->
                    <div class="text-white">
                        <h2 class="text-5xl md:text-6xl font-light mb-12 tracking-widest" 
                            style="font-family: 'Noto Serif JP'; letter-spacing: 0.3em;">
                            Message
                        </h2>
                        <div class="space-y-6">
                            <p class="text-white text-sm md:text-base leading-loose" style="line-height: 2.2;">
                                焼肉KARINは(お勝手の年中居ばえを有所感「肉の大塚」の直営焼肉店です。老舗ならではの目利きと独自ルートで厳選された無肉がいただけます。また空間にもこだわり、デザイナー設計の落ち着いた雰囲気の個室などご家族はもちろんデートや接待、ご宴会などあらゆるシーンでゆっくりとしたひとときを。
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- アクセス情報 -->
        <section class="py-24 bg-dark-alt">
            <div class="max-w-6xl mx-auto px-6 lg:px-8">
                <div class="mb-20">
                    <h2 class="section-title text-white">店舗情報・アクセス</h2>
                    <div class="divider"></div>
                    <p class="section-subtitle">お気軽にお問い合わせください</p>
                </div>
                
                <div class="grid md:grid-cols-2 gap-16">
                    <div id="store-info" class="space-y-8 text-gray-300">
                        <!-- JavaScript で動的に読み込まれます -->
                    </div>
                    
                    <div class="relative overflow-hidden" style="height: 500px;">
                        <iframe 
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2916.1868372669383!2d143.19065057637704!3d42.918409502068455!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x5f0b4eb4a88a888b%3A0x5f0b4eb4a88a888b!2z44CSMDgwLTAwMTEg5YyX5rW36YGT5biv5bqD5biC6KW_77yR5p2h5Y2X77yY5LiB55uu77yS77yQ4oiS77yV!5e0!3m2!1sja!2sjp!4v1703123456789!5m2!1sja!2sjp"
                            width="100%" 
                            height="100%" 
                            style="border:0; filter: grayscale(30%) contrast(90%);" 
                            allowfullscreen="" 
                            loading="lazy"
                            referrerpolicy="no-referrer-when-downgrade">
                        </iframe>
                    </div>
                </div>
            </div>
        </section>

        <!-- フッター - Redesigned -->
        <footer class="relative py-20" style="background: #f5f5f5;">
            <div class="max-w-4xl mx-auto px-6 lg:px-8">
                <!-- 上部: ナビゲーションリンク -->
                <div class="flex justify-center items-center space-x-6 md:space-x-8 mb-12 flex-wrap gap-y-3">
                    <a href="/news" class="text-gray-800 text-xs tracking-widest hover:text-gray-600 transition">news</a>
                    <a href="/menu" class="text-gray-800 text-xs tracking-widest hover:text-gray-600 transition">dinner</a>
                    <a href="/course" class="text-gray-800 text-xs tracking-widest hover:text-gray-600 transition">course</a>
                    <a href="/commitment" class="text-gray-800 text-xs tracking-widest hover:text-gray-600 transition">preference</a>
                    <a href="/lunch" class="text-gray-800 text-xs tracking-widest hover:text-gray-600 transition">lunch</a>
                    <a href="/access" class="text-gray-800 text-xs tracking-widest hover:text-gray-600 transition">access</a>
                </div>
                
                <!-- 中央: ロゴとメインコンテンツ -->
                <div class="text-center mb-12">
                    <!-- ロゴ（横書き） -->
                    <div class="mb-8">
                        <h3 class="text-2xl md:text-3xl font-light tracking-widest text-gray-900" 
                            style="font-family: 'Noto Serif JP'; letter-spacing: 0.3em;">
                            TOKACHI YAKINIKU KARIN
                        </h3>
                    </div>
                    
                    <!-- 住所 -->
                    <p class="text-gray-700 text-xs mb-4 tracking-wide">北海道帯広市西一条南8-20-5</p>
                    
                    <!-- 営業時間 -->
                    <div class="text-gray-700 text-xs leading-relaxed mb-6 max-w-2xl mx-auto" style="line-height: 1.8;">
                        <p class="mb-2">月・土・日・祝日 17:30 - 00:00 L.O. 料理23:00 ドリンク23:30</p>
                        <p class="mb-2">火 11:30 - 15:00 L.O. 14:30</p>
                        <p>水・木・金 11:30 - 15:00 L.O. 14:30 / 17:30 - 00:00 L.O. 料理23:00 ドリンク23:30</p>
                    </div>
                    
                    <!-- 電話番号 -->
                    <p class="text-gray-900 text-base font-light tracking-widest mb-8">TEL 050-8883-6929</p>
                    
                    <!-- SNSアイコン -->
                    <div class="flex justify-center space-x-6 mb-10">
                        <a href="tel:0508836929" class="text-gray-700 hover:text-gray-900 transition text-lg">
                            <i class="fas fa-phone"></i>
                        </a>
                        <a href="https://twitter.com" target="_blank" class="text-gray-700 hover:text-gray-900 transition text-lg">
                            <i class="fab fa-twitter"></i>
                        </a>
                        <a href="https://www.instagram.com/tokachi_yakiniku_karin" target="_blank" class="text-gray-700 hover:text-gray-900 transition text-lg">
                            <i class="fab fa-instagram"></i>
                        </a>
                    </div>
                </div>
                
                <!-- 下部: コピーライト -->
                <div class="text-center pt-8 border-t border-gray-300">
                    <p class="text-gray-600 text-xs tracking-wide">Copyright © 2024 TOKACHI YAKINIKU KARIN. All rights reserved.</p>
                </div>
                
                <!-- トップに戻るボタン -->
                <div class="absolute bottom-8 right-8">
                    <a href="#" onclick="window.scrollTo({top: 0, behavior: 'smooth'}); return false;" 
                       class="flex items-center justify-center w-10 h-10 rounded-full bg-gray-600 text-white hover:bg-gray-800 transition">
                        <i class="fas fa-chevron-up text-sm"></i>
                    </a>
                </div>
            </div>
        </footer>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
          // ページテキストのキャッシュ
          let pageTextsCache = {}
          
          // ページテキストを取得
          async function loadPageTexts() {
            try {
              const response = await fetch('/api/page-texts')
              const texts = await response.json()
              texts.forEach(text => {
                pageTextsCache[text.text_key] = text.text_value
              })
              updatePageTexts()
            } catch (error) {
              console.error('Failed to load page texts:', error)
            }
          }
          
          // ページのテキストを更新
          function updatePageTexts() {
            // 改行を<br>タグに変換する関数
            function nl2br(text) {
              return text.replace(/\\n/g, '<br>')
            }
            
            // Ground Menu
            const groundMenuTitle = document.querySelector('[data-text="home_ground_menu_title"]')
            if (groundMenuTitle && pageTextsCache.home_ground_menu_title) {
              groundMenuTitle.innerHTML = nl2br(pageTextsCache.home_ground_menu_title)
            }
            
            const groundMenuDesc = document.querySelector('[data-text="home_ground_menu_description"]')
            if (groundMenuDesc && pageTextsCache.home_ground_menu_description) {
              groundMenuDesc.innerHTML = nl2br(pageTextsCache.home_ground_menu_description)
            }
            
            // Commitment
            const commitmentTitle = document.querySelector('[data-text="home_commitment_title"]')
            if (commitmentTitle && pageTextsCache.home_commitment_title) {
              commitmentTitle.innerHTML = nl2br(pageTextsCache.home_commitment_title)
            }
            
            const commitmentDesc = document.querySelector('[data-text="home_commitment_description"]')
            if (commitmentDesc && pageTextsCache.home_commitment_description) {
              commitmentDesc.innerHTML = nl2br(pageTextsCache.home_commitment_description)
            }
            
            // Message
            const messageTitle = document.querySelector('[data-text="home_message_title"]')
            if (messageTitle && pageTextsCache.home_message_title) {
              messageTitle.textContent = pageTextsCache.home_message_title
            }
            
            const messageContent = document.querySelector('[data-text="home_message_content"]')
            if (messageContent && pageTextsCache.home_message_content) {
              messageContent.innerHTML = nl2br(pageTextsCache.home_message_content)
            }
            
            // Card 1
            const card1Title = document.querySelector('[data-text="home_card1_title"]')
            if (card1Title && pageTextsCache.home_card1_title) {
              card1Title.innerHTML = nl2br(pageTextsCache.home_card1_title)
            }
            
            const card1Desc = document.querySelector('[data-text="home_card1_description"]')
            if (card1Desc && pageTextsCache.home_card1_description) {
              card1Desc.innerHTML = nl2br(pageTextsCache.home_card1_description)
            }
            
            // Card 2
            const card2Title = document.querySelector('[data-text="home_card2_title"]')
            if (card2Title && pageTextsCache.home_card2_title) {
              card2Title.innerHTML = nl2br(pageTextsCache.home_card2_title)
            }
            
            const card2Desc = document.querySelector('[data-text="home_card2_description"]')
            if (card2Desc && pageTextsCache.home_card2_description) {
              card2Desc.innerHTML = nl2br(pageTextsCache.home_card2_description)
            }
            
            // Card 3
            const card3Title = document.querySelector('[data-text="home_card3_title"]')
            if (card3Title && pageTextsCache.home_card3_title) {
              card3Title.innerHTML = nl2br(pageTextsCache.home_card3_title)
            }
            
            const card3Desc = document.querySelector('[data-text="home_card3_description"]')
            if (card3Desc && pageTextsCache.home_card3_description) {
              card3Desc.innerHTML = nl2br(pageTextsCache.home_card3_description)
            }
          }
          
          // ハンバーガーメニューの切り替え
          function toggleMobileMenu() {
            const menu = document.getElementById('mobileMenu')
            const hamburger = document.querySelector('.hamburger')
            menu.classList.toggle('active')
            hamburger.classList.toggle('active')
          }
          
          // ヒーロースライドショー
          // ページ画像を動的に読み込む
          async function loadPageImages() {
            try {
              const response = await fetch('/api/page-images')
              const images = await response.json()
              
              // ヒーロースライド画像
              const heroSlide1 = images.find(img => img.image_key === 'hero_slide_1')
              const heroSlide2 = images.find(img => img.image_key === 'hero_slide_2')
              const heroSlide3 = images.find(img => img.image_key === 'hero_slide_3')
              
              if (heroSlide1) {
                const slide1 = document.querySelector('.hero-slide:nth-child(1)')
                if (slide1) slide1.style.backgroundImage = \`url('\${heroSlide1.image_url}')\`
              }
              if (heroSlide2) {
                const slide2 = document.querySelector('.hero-slide:nth-child(2)')
                if (slide2) slide2.style.backgroundImage = \`url('\${heroSlide2.image_url}')\`
              }
              if (heroSlide3) {
                const slide3 = document.querySelector('.hero-slide:nth-child(3)')
                if (slide3) slide3.style.backgroundImage = \`url('\${heroSlide3.image_url}')\`
              }
              
              // ヒーローロゴ
              const heroLogo = images.find(img => img.image_key === 'hero_logo')
              if (heroLogo) {
                const logoImg = document.querySelector('.hero-content img')
                if (logoImg) logoImg.src = heroLogo.image_url
              }
              
              // GROUND MENUセクション背景
              const groundMenuBg = images.find(img => img.image_key === 'ground_menu_bg')
              if (groundMenuBg) {
                const bgImg = document.querySelector('.ground-menu-image')
                if (bgImg) bgImg.src = groundMenuBg.image_url
              }
              
              // こだわりセクション - 和牛メイン画像
              const commitmentWagyu = images.find(img => img.image_key === 'home_commitment_wagyu')
              if (commitmentWagyu) {
                const wagyuImg = document.querySelector('section.relative img[alt="和牛"]')
                if (wagyuImg) wagyuImg.src = commitmentWagyu.image_url
              }
              
              // こだわりセクション - カード1
              const commitmentCard1 = images.find(img => img.image_key === 'home_commitment_card1')
              if (commitmentCard1) {
                const card1Img = document.querySelector('img[alt="十勝若牛"]')
                if (card1Img) card1Img.src = commitmentCard1.image_url
              }
              
              // こだわりセクション - カード2
              const commitmentCard2 = images.find(img => img.image_key === 'home_commitment_card2')
              if (commitmentCard2) {
                const card2Img = document.querySelector('img[alt="アイスランドラム"]')
                if (card2Img) card2Img.src = commitmentCard2.image_url
              }
              
              // こだわりセクション - カード3
              const commitmentCard3 = images.find(img => img.image_key === 'home_commitment_card3')
              if (commitmentCard3) {
                const card3Img = document.querySelector('img[alt="美味しいお肉の焼き方"]')
                if (card3Img) card3Img.src = commitmentCard3.image_url
              }
              
              // メッセージセクション - 店舗写真
              const messagePhoto = images.find(img => img.image_key === 'home_message_photo')
              if (messagePhoto) {
                const photoImg = document.querySelector('[alt="TOKACHI YAKINIKU KARIN 店舗"]')
                if (photoImg) photoImg.src = messagePhoto.image_url
              }
            } catch (error) {
              console.error('Failed to load page images:', error)
            }
          }
          
          function initHeroSlider() {
            const slides = document.querySelectorAll('.hero-slide')
            let currentSlide = 0
            
            function showNextSlide() {
              slides[currentSlide].classList.remove('active')
              currentSlide = (currentSlide + 1) % slides.length
              slides[currentSlide].classList.add('active')
            }
            
            // 5秒ごとにスライドを切り替え
            setInterval(showNextSlide, 5000)
          }
          
          // ページ読み込み時にスライダーを初期化
          document.addEventListener('DOMContentLoaded', () => {
            loadPageImages()
            initHeroSlider()
            loadPageTexts()
          })
          
          // 店舗情報の読み込み
          async function loadStoreInfo() {
            try {
              const response = await axios.get('/api/store-info')
              const info = response.data
              
              document.getElementById('store-info').innerHTML = \`
                <div class="space-y-8">
                  <div class="border-l-2 border-yellow-700 pl-6">
                    <h4 class="text-sm text-gray-500 mb-2 tracking-widest">ADDRESS</h4>
                    <p class="text-gray-200 mb-1">\${info.address || ''}</p>
                    <p class="text-sm text-gray-400">\${info.access || ''}</p>
                  </div>
                  
                  <div class="border-l-2 border-yellow-700 pl-6">
                    <h4 class="text-sm text-gray-500 mb-2 tracking-widest">PHONE</h4>
                    <p class="text-gray-200">\${info.phone || ''}</p>
                  </div>
                  
                  <div class="border-l-2 border-yellow-700 pl-6">
                    <h4 class="text-sm text-gray-500 mb-2 tracking-widest">HOURS</h4>
                    <p class="text-sm text-gray-300 leading-loose">\${info.hours_weekday || ''}</p>
                    <p class="text-sm text-gray-300 leading-loose mt-2">\${info.hours_weekend || ''}</p>
                    <p class="text-sm text-gray-300 leading-loose mt-2">\${info.hours_tuesday || ''}</p>
                  </div>
                  
                  <div class="border-l-2 border-yellow-700 pl-6">
                    <h4 class="text-sm text-gray-500 mb-2 tracking-widest">SEATS</h4>
                    <p class="text-gray-300">\${info.seats || ''}</p>
                  </div>
                  
                  <div class="border-l-2 border-yellow-700 pl-6">
                    <h4 class="text-sm text-gray-500 mb-2 tracking-widest">PARKING</h4>
                    <p class="text-gray-300">\${info.parking || ''}</p>
                  </div>
                </div>
              \`
            } catch (error) {
              console.error('Failed to load store info:', error)
            }
          }
          
          // おすすめメニューの読み込み（最初の3件）
          async function loadFeaturedMenu() {
            try {
              const menuElement = document.getElementById('featured-menu')
              if (!menuElement) return
              
              const response = await axios.get('/api/menu-items')
              const items = response.data.slice(0, 3)
              
              menuElement.innerHTML = items.map(item => \`
                <div class="bg-white rounded-lg shadow-lg overflow-hidden hover-scale">
                  <div class="h-64 bg-gray-200 overflow-hidden">
                    <img src="\${item.image_url || 'https://images.unsplash.com/photo-1558030006-450675393462?w=800'}" 
                         alt="\${item.name}" 
                         class="w-full h-full object-cover">
                  </div>
                  <div class="p-6">
                    <h3 class="text-2xl font-bold mb-2">\${item.name}</h3>
                    <p class="text-gray-600 mb-4">\${item.description || ''}</p>
                    <p class="text-amber-600 text-2xl font-bold">¥\${(item.price || 0).toLocaleString()}</p>
                  </div>
                </div>
              \`).join('')
            } catch (error) {
              console.error('Failed to load menu:', error)
            }
          }
          
          // ヒーローセクションのニュース読み込み（最新2件）
          async function loadHeroNews() {
            try {
              const response = await axios.get('/api/news')
              const newsList = response.data.slice(0, 2)
              const heroNewsEl = document.getElementById('heroNewsList')
              
              if (!heroNewsEl) return
              
              if (newsList.length === 0) {
                heroNewsEl.innerHTML = \`
                  <div class="border-l-2 border-gray-700 pl-3">
                    <p class="text-gray-400 text-xs mb-1">お知らせはありません</p>
                  </div>
                \`
                return
              }
              
              heroNewsEl.innerHTML = newsList.map(news => {
                const date = new Date(news.published_date)
                const formattedDate = \`\${date.getFullYear()}.\${String(date.getMonth() + 1).padStart(2, '0')}.\${String(date.getDate()).padStart(2, '0')}\`
                
                return \`
                  <div class="border-l-2 border-gray-700 pl-3">
                    <p class="text-gray-400 text-xs mb-1">\${formattedDate}</p>
                    <p class="text-gray-200 text-sm leading-relaxed">\${news.title}</p>
                  </div>
                \`
              }).join('')
            } catch (error) {
              console.error('Failed to load hero news:', error)
            }
          }
          
          // ページ読み込み時に実行
          document.addEventListener('DOMContentLoaded', () => {
            loadStoreInfo()
            loadFeaturedMenu()
            loadHeroNews()
          })
        </script>
    </body>
    </html>
  `)
})

// メニューページ
app.get('/menu', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>メニュー | TOKACHI YAKINIKU KARIN</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@200;300;400;600;700;900&family=Noto+Sans+JP:wght@100;300;400;500;700&display=swap');
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Noto Sans JP', sans-serif;
        background: #0a0a0a;
        color: #e0e0e0;
        line-height: 1.8;
      }
      
      h1, h2, h3, h4 {
        font-family: 'Noto Serif JP', serif;
        font-weight: 300;
        letter-spacing: 0.1em;
      }
      
      nav {
        background: rgba(10, 10, 10, 0.95);
        backdrop-filter: blur(10px);
      }
      
      .nav-link {
        position: relative;
        font-size: 0.9rem;
        letter-spacing: 0.1em;
        transition: color 0.3s ease;
      }
      
      .nav-link:after {
        content: '';
        position: absolute;
        bottom: -4px;
        left: 0;
        width: 0;
        height: 1px;
        background: #d4af37;
        transition: width 0.3s ease;
      }
      
      .nav-link:hover:after {
        width: 100%;
      }
      
      /* ハンバーガーメニュー */
      .hamburger {
        display: none;
        flex-direction: column;
        cursor: pointer;
        padding: 0.5rem;
      }
      
      @media (max-width: 768px) {
        .hamburger {
          display: flex;
        }
      }
      
      .hamburger span {
        width: 25px;
        height: 2px;
        background: white;
        margin: 3px 0;
        transition: all 0.3s ease;
      }
      
      .hamburger.active span:nth-child(1) {
        transform: rotate(45deg) translate(6px, 6px);
      }
      
      .hamburger.active span:nth-child(2) {
        opacity: 0;
      }
      
      .hamburger.active span:nth-child(3) {
        transform: rotate(-45deg) translate(7px, -7px);
      }
      
      .mobile-menu {
        display: none;
        position: fixed;
        top: 96px;
        left: 0;
        right: 0;
        background: rgba(10, 10, 10, 0.98);
        backdrop-filter: blur(10px);
        padding: 2rem;
        z-index: 40;
        border-top: 1px solid rgba(212, 175, 55, 0.2);
      }
      
      .mobile-menu.active {
        display: block;
        animation: slideDown 0.3s ease;
      }
      
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .mobile-menu a {
        display: block;
        padding: 1rem 0;
        color: white;
        text-decoration: none;
        font-size: 1.1rem;
        letter-spacing: 0.1em;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        transition: all 0.3s ease;
      }
      
      .mobile-menu a:hover {
        color: #d4af37;
        padding-left: 1rem;
      }
      
      .mobile-menu a:last-child {
        border-bottom: none;
      }
      
      /* カテゴリーセクション */
      .category-section {
        position: relative;
        margin-bottom: 0;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
      }
      
      .category-hero {
        position: relative;
        width: 100%;
        height: 600px;
        overflow: hidden;
      }
      
      .category-hero img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        filter: brightness(0.6);
      }
      
      .category-hero-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: white;
        text-align: center;
      }
      
      .category-title {
        font-size: 5rem;
        font-weight: 300;
        letter-spacing: 0.2em;
        margin-bottom: 1rem;
        text-shadow: 0 2px 20px rgba(0,0,0,0.8);
      }
      
      .category-subtitle {
        font-size: 1.5rem;
        letter-spacing: 0.3em;
        color: #d4af37;
        text-transform: uppercase;
      }
      
      /* メニューコンテンツ */
      .menu-content {
        background: #0a0a0a;
        padding: 4rem 2rem;
      }
      
      .menu-grid {
        max-width: 900px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 2rem 4rem;
      }
      
      @media (max-width: 768px) {
        .menu-grid {
          grid-template-columns: 1fr;
          gap: 2rem;
        }
        
        .category-title {
          font-size: 2.5rem;
        }
        
        .category-subtitle {
          font-size: 1rem;
        }
      }
      
      .menu-item {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        border-bottom: 1px solid rgba(212, 175, 55, 0.2);
        padding-bottom: 1.5rem;
      }
      
      .menu-item-info {
        flex: 1;
      }
      
      .menu-item-name {
        font-size: 1rem;
        color: #e0e0e0;
        margin-bottom: 0.5rem;
        letter-spacing: 0.05em;
      }
      
      .menu-item-description {
        font-size: 0.85rem;
        color: #999;
        line-height: 1.6;
      }
      
      .menu-item-price {
        font-size: 1.1rem;
        color: #d4af37;
        font-weight: 500;
        white-space: nowrap;
        margin-left: 1.5rem;
      }
      
      .category-note {
        max-width: 900px;
        margin: 3rem auto 0;
        padding: 1.5rem;
        background: rgba(212, 175, 55, 0.1);
        border-left: 3px solid #d4af37;
        color: #d4af37;
        font-size: 0.9rem;
      }
    </style>
</head>
<body>
    <!-- ナビゲーション -->
    <nav class="fixed w-full top-0 z-50 text-white shadow-2xl">
        <div class="max-w-7xl mx-auto px-6 lg:px-8">
            <div class="flex justify-between items-center h-24">
                <div class="flex-shrink-0">
                    <a href="/" class="flex items-center -space-x-8">
                      <img src="/logo-karin.png" alt="KARIN Logo" class="h-16 w-auto">
                      <img src="/logo-tokachi.png" alt="TOKACHI YAKINIKU Logo" class="h-16 w-auto">
                    </a>
                </div>
                <!-- デスクトップメニュー -->
                <div class="hidden md:flex space-x-10">
                    <a href="/news" class="nav-link text-white hover:text-yellow-500">news</a>
                    <a href="/menu" class="nav-link text-white hover:text-yellow-500">dinner</a>
                    <a href="/course" class="nav-link text-white hover:text-yellow-500">course</a>
                    <a href="/commitment" class="nav-link text-white hover:text-yellow-500">preference</a>
                    <a href="/lunch" class="nav-link text-white hover:text-yellow-500">lunch</a>
                    <a href="/access" class="nav-link text-white hover:text-yellow-500">access</a>
                    <a href="/admin" class="nav-link text-yellow-600 hover:text-yellow-500">
                      <i class="fas fa-cog text-sm"></i> 管理
                    </a>
                </div>
                <!-- ハンバーガーメニューボタン -->
                <div class="hamburger md:hidden" onclick="toggleMobileMenu()">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </div>
    </nav>
    
    <!-- モバイルメニュー -->
    <div class="mobile-menu" id="mobileMenu">
        <a href="/news">news</a>
        <a href="/menu">dinner</a>
        <a href="/course">course</a>
        <a href="/commitment">preference</a>
        <a href="/lunch">lunch</a>
        <a href="/access">access</a>
        <a href="/admin"><i class="fas fa-cog"></i> 管理</a>
    </div>

    <!-- メニューカテゴリ動的表示 -->
    <div id="menu-categories-container" style="padding-top: 96px;">
        <!-- カテゴリーとメニューアイテムがここに動的に挿入されます -->
    </div>

    <!-- フッター -->
    <footer class="bg-black text-white py-16">
        <div class="max-w-7xl mx-auto px-6 lg:px-8">
            <div class="text-center">
                <h3 class="text-2xl font-light tracking-widest mb-4">TOKACHI YAKINIKU KARIN</h3>
                <p class="text-sm text-gray-400 tracking-wider mb-8">トカチ ヤキニク カリン</p>
                
                <div class="flex justify-center space-x-8 mb-8">
                    <a href="#" class="text-gray-400 hover:text-white transition">
                        <i class="fab fa-facebook-f"></i>
                    </a>
                    <a href="#" class="text-gray-400 hover:text-white transition">
                        <i class="fab fa-twitter"></i>
                    </a>
                    <a href="#" class="text-gray-400 hover:text-white transition">
                        <i class="fab fa-instagram"></i>
                    </a>
                </div>
                <p class="text-gray-600 mt-12 text-xs tracking-wider">© 2024 TOKACHI YAKINIKU KARIN. All rights reserved.</p>
            </div>
        </div>
    </footer>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
      async function loadMenu() {
        try {
          const [categoriesRes, itemsRes] = await Promise.all([
            axios.get('/api/menu-categories'),
            axios.get('/api/menu-items')
          ])
          
          const categories = categoriesRes.data
          const items = itemsRes.data
          
          const container = document.getElementById('menu-categories-container')
          
          categories.forEach(category => {
            const categoryItems = items.filter(item => item.category_id === category.id)
            
            if (categoryItems.length === 0) return
            
            // カテゴリ名から英語サブタイトルを生成
            const subtitles = {
              '牛': 'BEEF',
              '牛ホルモン': 'BEEF HORMONE',
              'ラム': 'LAMB',
              '豚・鶏': 'PORK & CHICKEN',
              '海鮮・野菜': 'SEAFOOD & VEGETABLES',
              'お飲み物': 'DRINK',
              '肉料理': 'MEAT DISHES',
              '他一品': 'OTHER DISHES'
            }
            
            const subtitle = subtitles[category.name] || category.name.toUpperCase()
            
            // カテゴリーセクション
            const section = document.createElement('div')
            section.className = 'category-section'
            
            // ヒーロー画像とタイトル
            section.innerHTML = \`
              <div class="category-hero">
                <img src="\${category.image_url || 'https://images.unsplash.com/photo-1558030006-450675393462?w=1920&q=80'}" 
                     alt="\${category.name}">
                <div class="category-hero-overlay">
                  <h2 class="category-title">\${category.name}</h2>
                  <p class="category-subtitle">\${subtitle}</p>
                </div>
              </div>
              
              <div class="menu-content">
                <div class="menu-grid">
                  \${categoryItems.map(item => \`
                    <div class="menu-item">
                      <div class="menu-item-info">
                        <div class="menu-item-name">\${item.name}</div>
                        \${item.description ? \`<div class="menu-item-description">\${item.description}</div>\` : ''}
                      </div>
                      <div class="menu-item-price">¥\${item.price.toLocaleString()}</div>
                    </div>
                  \`).join('')}
                </div>
                
                \${category.id === 2 ? '<div class="category-note">当店のホルモンはすべて北海道産です。<br>～ 味はタレ ・ ミソ ・ 塩 ・ ピリ辛 ・ ネギ塩 （+100 円） からお選びください。 ～</div>' : ''}
                \${category.id === 3 ? '<div class="category-note">当店のラムはアイスランド産のオーガニックラムを使用しております。</div>' : ''}
                \${category.id === 1 ? '<div class="category-note">+300円でトリュフソースをご用意できます。</div>' : ''}
              </div>
            \`
            
            container.appendChild(section)
          })
        } catch (error) {
          console.error('Failed to load menu:', error)
          document.getElementById('menu-categories-container').innerHTML = \`
            <div class="text-center text-red-600 py-20">
              <p>メニューの読み込みに失敗しました。</p>
            </div>
          \`
        }
      }
      
      document.addEventListener('DOMContentLoaded', loadMenu)
      
      // ハンバーガーメニューの切り替え
      function toggleMobileMenu() {
        const menu = document.getElementById('mobileMenu')
        const hamburger = document.querySelector('.hamburger')
        menu.classList.toggle('active')
        hamburger.classList.toggle('active')
      }
    </script>
</body>
</html>
  `)
})

// ランチページ
app.get('/lunch', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ランチメニュー | TOKACHI YAKINIKU KARIN</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@200;300;400;600;700;900&family=Noto+Sans+JP:wght@100;300;400;500;700&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Noto Sans JP', sans-serif;
            background: #0a0a0a;
            color: #e0e0e0;
            line-height: 1.8;
          }
          
          h1, h2, h3, h4 {
            font-family: 'Noto Serif JP', serif;
            font-weight: 300;
            letter-spacing: 0.1em;
          }
          
          nav {
            background: rgba(10, 10, 10, 0.95);
            backdrop-filter: blur(10px);
          }
          
          .nav-link {
            position: relative;
            font-size: 0.9rem;
            letter-spacing: 0.1em;
            transition: color 0.3s ease;
          }
          
          .nav-link:after {
            content: '';
            position: absolute;
            bottom: -4px;
            left: 0;
            width: 0;
            height: 1px;
            background: #d4af37;
            transition: width 0.3s ease;
          }
          
          .nav-link:hover:after {
            width: 100%;
          }
          
          /* ハンバーガーメニュー */
          .hamburger {
            display: none;
            flex-direction: column;
            cursor: pointer;
            padding: 0.5rem;
          }
          
          @media (max-width: 768px) {
            .hamburger {
              display: flex;
            }
          }
          
          .hamburger span {
            width: 25px;
            height: 2px;
            background: white;
            margin: 3px 0;
            transition: all 0.3s ease;
          }
          
          .hamburger.active span:nth-child(1) {
            transform: rotate(45deg) translate(6px, 6px);
          }
          
          .hamburger.active span:nth-child(2) {
            opacity: 0;
          }
          
          .hamburger.active span:nth-child(3) {
            transform: rotate(-45deg) translate(7px, -7px);
          }
          
          .mobile-menu {
            display: none;
            position: fixed;
            top: 96px;
            left: 0;
            right: 0;
            background: rgba(10, 10, 10, 0.98);
            backdrop-filter: blur(10px);
            padding: 2rem;
            z-index: 40;
            border-top: 1px solid rgba(212, 175, 55, 0.2);
          }
          
          .mobile-menu.active {
            display: block;
            animation: slideDown 0.3s ease;
          }
          
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .mobile-menu a {
            display: block;
            padding: 1rem 0;
            color: white;
            text-decoration: none;
            font-size: 1.1rem;
            letter-spacing: 0.1em;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
          }
          
          .mobile-menu a:hover {
            color: #d4af37;
            padding-left: 1rem;
          }
          
          .mobile-menu a:last-child {
            border-bottom: none;
          }

          /* ヒーローセクション */
          .lunch-hero {
            position: relative;
            padding-top: 96px;
            min-height: 60vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, rgba(10, 10, 10, 0.95) 0%, rgba(30, 20, 10, 0.95) 100%);
          }

          .lunch-hero-content {
            text-align: center;
            padding: 3rem 2rem;
          }

          .lunch-hero-title {
            font-size: 4rem;
            font-weight: 300;
            letter-spacing: 0.2em;
            color: #d4af37;
            margin-bottom: 1rem;
          }

          .lunch-hero-subtitle {
            font-size: 1.2rem;
            letter-spacing: 0.4em;
            color: #a0a0a0;
            text-transform: uppercase;
            margin-bottom: 2rem;
          }

          .lunch-hero-description {
            font-size: 1rem;
            color: #c0c0c0;
            max-width: 600px;
            margin: 0 auto;
            line-height: 1.8;
          }

          /* ランチメニューグリッド */
          .lunch-menu-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 4rem 2rem;
          }

          .lunch-menu-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 3rem;
          }

          .lunch-menu-item {
            background: #1a1a1a;
            border-radius: 8px;
            overflow: hidden;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            border: 1px solid rgba(212, 175, 55, 0.2);
          }

          .lunch-menu-item:hover {
            transform: translateY(-8px);
            box-shadow: 0 12px 40px rgba(212, 175, 55, 0.2);
          }

          .lunch-item-image {
            width: 100%;
            height: 280px;
            object-fit: cover;
            border-bottom: 2px solid rgba(212, 175, 55, 0.3);
          }

          .lunch-item-content {
            padding: 2rem;
          }

          .lunch-item-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1rem;
          }

          .lunch-item-name {
            font-size: 1.5rem;
            font-weight: 500;
            color: #e0e0e0;
            letter-spacing: 0.05em;
          }

          .lunch-item-name-en {
            font-size: 0.85rem;
            color: #888;
            margin-top: 0.25rem;
            letter-spacing: 0.05em;
          }

          .lunch-item-price {
            font-size: 1.8rem;
            color: #d4af37;
            font-weight: 600;
            white-space: nowrap;
          }

          .lunch-item-description {
            font-size: 0.95rem;
            color: #b0b0b0;
            line-height: 1.7;
            letter-spacing: 0.05em;
          }

          /* フッター */
          footer {
            background: #000;
            color: #fff;
            padding: 4rem 2rem;
            text-align: center;
            border-top: 1px solid rgba(212, 175, 55, 0.2);
          }

          /* モバイル対応 */
          @media (max-width: 768px) {
            .lunch-hero-title {
              font-size: 2.5rem;
            }

            .lunch-hero-subtitle {
              font-size: 0.9rem;
            }

            .lunch-menu-grid {
              grid-template-columns: 1fr;
              gap: 2rem;
            }

            .lunch-item-image {
              height: 220px;
            }

            .lunch-item-content {
              padding: 1.5rem;
            }

            .lunch-item-name {
              font-size: 1.25rem;
            }

            .lunch-item-price {
              font-size: 1.5rem;
            }
          }
        </style>
    </head>
    <body>
        <!-- ナビゲーション -->
        <nav class="fixed w-full top-0 z-50 text-white shadow-2xl">
            <div class="max-w-7xl mx-auto px-6 lg:px-8">
                <div class="flex justify-between items-center h-24">
                    <div class="flex-shrink-0">
                        <a href="/" class="flex items-center">
                          <img src="/logo-header.png" alt="TOKACHI YAKINIKU KARIN Logo" class="h-16 w-auto">
                        </a>
                    </div>
                    <!-- デスクトップメニュー -->
                    <div class="hidden md:flex space-x-10">
                        <a href="/news" class="nav-link text-white hover:text-yellow-500">news</a>
                        <a href="/menu" class="nav-link text-white hover:text-yellow-500">dinner</a>
                        <a href="/course" class="nav-link text-white hover:text-yellow-500">course</a>
                        <a href="/commitment" class="nav-link text-white hover:text-yellow-500">preference</a>
                        <a href="/lunch" class="nav-link text-yellow-500">lunch</a>
                        <a href="/access" class="nav-link text-white hover:text-yellow-500">access</a>
                        <a href="/admin" class="nav-link text-yellow-600 hover:text-yellow-500">
                          <i class="fas fa-cog text-sm"></i> 管理
                        </a>
                    </div>
                    <!-- ハンバーガーメニューボタン -->
                    <div class="hamburger md:hidden" onclick="toggleMobileMenu()">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        </nav>
        
        <!-- モバイルメニュー -->
        <div class="mobile-menu" id="mobileMenu">
            <a href="/news">news</a>
            <a href="/menu">dinner</a>
            <a href="/course">course</a>
            <a href="/commitment">preference</a>
            <a href="/lunch">lunch</a>
            <a href="/access">access</a>
            <a href="/admin"><i class="fas fa-cog"></i> 管理</a>
        </div>

        <!-- ヒーローセクション -->
        <div class="lunch-hero">
            <div class="lunch-hero-content">
                <h1 class="lunch-hero-title">ランチメニュー</h1>
                <p class="lunch-hero-subtitle">Lunch Menu</p>
                <p class="lunch-hero-description">
                  厳選された十勝産の食材を使用した、ボリューム満点のランチメニュー。<br>
                  焼肉の旨味を気軽にお楽しみいただけます。
                </p>
            </div>
        </div>

        <!-- ランチメニュー一覧 -->
        <div class="lunch-menu-container">
            <div class="lunch-menu-grid" id="lunchMenuGrid">
                <!-- JavaScriptで動的に読み込まれます -->
                <div style="grid-column: 1/-1; text-align: center; color: #a0a0a0; padding: 3rem 0;">
                    読み込み中...
                </div>
            </div>
        </div>

        <!-- フッター -->
        <footer>
            <div class="max-w-7xl mx-auto">
                <h3 class="text-2xl font-light tracking-widest mb-4">TOKACHI YAKINIKU KARIN</h3>
                <p class="text-sm text-gray-400 tracking-wider mb-8">トカチ ヤキニク カリン</p>
                
                <div class="flex justify-center space-x-8 mb-8">
                    <a href="#" class="text-gray-400 hover:text-white transition">
                        <i class="fab fa-facebook-f"></i>
                    </a>
                    <a href="#" class="text-gray-400 hover:text-white transition">
                        <i class="fab fa-twitter"></i>
                    </a>
                    <a href="#" class="text-gray-400 hover:text-white transition">
                        <i class="fab fa-instagram"></i>
                    </a>
                </div>
                <p class="text-gray-600 mt-12 text-xs tracking-wider">© 2024 TOKACHI YAKINIKU KARIN. All rights reserved.</p>
            </div>
        </footer>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
          // ハンバーガーメニュー
          function toggleMobileMenu() {
            const hamburger = document.querySelector('.hamburger');
            const mobileMenu = document.getElementById('mobileMenu');
            hamburger.classList.toggle('active');
            mobileMenu.classList.toggle('active');
          }

          // ランチメニューデータ読み込み
          async function loadLunchMenu() {
            try {
              const response = await axios.get('/api/lunch-menu');
              const lunchMenu = response.data;
              const grid = document.getElementById('lunchMenuGrid');
              
              if (lunchMenu.length === 0) {
                grid.innerHTML = \`
                  <div style="grid-column: 1/-1; text-align: center; color: #a0a0a0; padding: 3rem 0;">
                    現在ランチメニューはありません
                  </div>
                \`;
                return;
              }

              grid.innerHTML = lunchMenu.map(item => \`
                <div class="lunch-menu-item">
                  <img src="\${item.image_url}" alt="\${item.name}" class="lunch-item-image">
                  <div class="lunch-item-content">
                    <div class="lunch-item-header">
                      <div>
                        <h3 class="lunch-item-name">\${item.name}</h3>
                        <p class="lunch-item-name-en">\${item.name_en || ''}</p>
                      </div>
                      <div class="lunch-item-price">¥\${item.price.toLocaleString()}</div>
                    </div>
                    <p class="lunch-item-description">\${item.description || ''}</p>
                  </div>
                </div>
              \`).join('');
            } catch (error) {
              console.error('ランチメニューの読み込みに失敗しました:', error);
              const grid = document.getElementById('lunchMenuGrid');
              grid.innerHTML = \`
                <div style="grid-column: 1/-1; text-align: center; color: #ff6b6b; padding: 3rem 0;">
                  ランチメニューの読み込みに失敗しました
                </div>
              \`;
            }
          }

          // ページ読み込み時にランチメニューを表示
          loadLunchMenu();
        </script>
    </body>
    </html>
  `)
})

// ニュースページ
app.get('/news', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>新着情報 | TOKACHI YAKINIKU KARIN</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@200;300;400;600;700;900&family=Noto+Sans+JP:wght@100;300;400;500;700&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Noto Sans JP', sans-serif;
            background: #0a0a0a;
            color: #e0e0e0;
            line-height: 1.8;
          }
          
          h1, h2, h3, h4 {
            font-family: 'Noto Serif JP', serif;
            font-weight: 300;
            letter-spacing: 0.1em;
          }
          
          nav {
            background: rgba(10, 10, 10, 0.95);
            backdrop-filter: blur(10px);
          }
          
          .nav-link {
            position: relative;
            font-size: 0.9rem;
            letter-spacing: 0.1em;
            transition: color 0.3s ease;
          }
          
          .nav-link:after {
            content: '';
            position: absolute;
            bottom: -4px;
            left: 0;
            width: 0;
            height: 1px;
            background: #d4af37;
            transition: width 0.3s ease;
          }
          
          .nav-link:hover:after {
            width: 100%;
          }
          
          /* ハンバーガーメニュー */
          .hamburger {
            display: none;
            flex-direction: column;
            cursor: pointer;
            padding: 0.5rem;
          }
          
          @media (max-width: 768px) {
            .hamburger {
              display: flex;
            }
          }
          
          .hamburger span {
            width: 25px;
            height: 2px;
            background: white;
            margin: 3px 0;
            transition: all 0.3s ease;
          }
          
          .hamburger.active span:nth-child(1) {
            transform: rotate(45deg) translate(6px, 6px);
          }
          
          .hamburger.active span:nth-child(2) {
            opacity: 0;
          }
          
          .hamburger.active span:nth-child(3) {
            transform: rotate(-45deg) translate(7px, -7px);
          }
          
          .mobile-menu {
            display: none;
            position: fixed;
            top: 96px;
            left: 0;
            right: 0;
            background: rgba(10, 10, 10, 0.98);
            backdrop-filter: blur(10px);
            padding: 2rem;
            z-index: 40;
            border-top: 1px solid rgba(212, 175, 55, 0.2);
          }
          
          .mobile-menu.active {
            display: block;
            animation: slideDown 0.3s ease;
          }
          
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .mobile-menu a {
            display: block;
            padding: 1rem 0;
            color: white;
            text-decoration: none;
            font-size: 1.1rem;
            letter-spacing: 0.1em;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
          }
          
          .mobile-menu a:hover {
            color: #d4af37;
            padding-left: 1rem;
          }
          
          .mobile-menu a:last-child {
            border-bottom: none;
          }

          /* ニュースページ専用スタイル */
          .news-page-container {
            padding-top: 96px;
            min-height: 100vh;
            background: #0a0a0a;
          }

          .news-hero {
            background: linear-gradient(135deg, rgba(10, 10, 10, 0.95) 0%, rgba(30, 20, 10, 0.95) 100%);
            padding: 5rem 2rem 3rem;
            text-align: center;
            border-bottom: 1px solid rgba(212, 175, 55, 0.3);
          }

          .news-hero-title {
            font-size: 3.5rem;
            font-weight: 300;
            letter-spacing: 0.2em;
            color: #d4af37;
            margin-bottom: 1rem;
          }

          .news-hero-subtitle {
            font-size: 1rem;
            letter-spacing: 0.4em;
            color: #a0a0a0;
            text-transform: uppercase;
          }

          /* ニュース一覧 */
          .news-container {
            max-width: 900px;
            margin: 0 auto;
            padding: 4rem 2rem;
          }

          .news-list {
            list-style: none;
          }

          .news-item {
            border-bottom: 1px solid rgba(212, 175, 55, 0.2);
            padding: 2.5rem 0;
            transition: all 0.3s ease;
          }

          .news-item:hover {
            background: rgba(212, 175, 55, 0.03);
            padding-left: 1rem;
            padding-right: 1rem;
          }

          .news-date {
            display: inline-block;
            font-size: 0.85rem;
            color: #d4af37;
            letter-spacing: 0.15em;
            margin-bottom: 1rem;
            font-weight: 500;
            padding: 0.25rem 0.75rem;
            background: rgba(212, 175, 55, 0.1);
            border-radius: 2px;
          }

          .news-title {
            font-size: 1.4rem;
            font-weight: 400;
            letter-spacing: 0.05em;
            color: #e0e0e0;
            margin-bottom: 0.75rem;
            line-height: 1.6;
          }

          .news-content {
            font-size: 1rem;
            color: #b0b0b0;
            line-height: 1.9;
            letter-spacing: 0.05em;
          }

          /* フッター */
          footer {
            background: #000;
            color: #fff;
            padding: 4rem 2rem;
            text-align: center;
            border-top: 1px solid rgba(212, 175, 55, 0.2);
          }

          /* モバイル対応 */
          @media (max-width: 768px) {
            .news-hero-title {
              font-size: 2rem;
            }

            .news-hero-subtitle {
              font-size: 0.8rem;
            }

            .news-container {
              padding: 2rem 1.5rem;
            }

            .news-title {
              font-size: 1.15rem;
            }

            .news-content {
              font-size: 0.95rem;
            }
          }
        </style>
    </head>
    <body>
        <!-- ナビゲーション -->
        <nav class="fixed w-full top-0 z-50 text-white shadow-2xl">
            <div class="max-w-7xl mx-auto px-6 lg:px-8">
                <div class="flex justify-between items-center h-24">
                    <div class="flex-shrink-0">
                        <a href="/" class="flex items-center">
                          <img src="/logo-header.png" alt="TOKACHI YAKINIKU KARIN Logo" class="h-16 w-auto">
                        </a>
                    </div>
                    <!-- デスクトップメニュー -->
                    <div class="hidden md:flex space-x-10">
                        <a href="/news" class="nav-link text-white hover:text-yellow-500">news</a>
                        <a href="/menu" class="nav-link text-white hover:text-yellow-500">dinner</a>
                        <a href="/course" class="nav-link text-white hover:text-yellow-500">course</a>
                        <a href="/commitment" class="nav-link text-white hover:text-yellow-500">preference</a>
                        <a href="/lunch" class="nav-link text-white hover:text-yellow-500">lunch</a>
                        <a href="/access" class="nav-link text-white hover:text-yellow-500">access</a>
                        <a href="/admin" class="nav-link text-yellow-600 hover:text-yellow-500">
                          <i class="fas fa-cog text-sm"></i> 管理
                        </a>
                    </div>
                    <!-- ハンバーガーメニューボタン -->
                    <div class="hamburger md:hidden" onclick="toggleMobileMenu()">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        </nav>
        
        <!-- モバイルメニュー -->
        <div class="mobile-menu" id="mobileMenu">
            <a href="/news">news</a>
            <a href="/menu">dinner</a>
            <a href="/course">course</a>
            <a href="/commitment">preference</a>
            <a href="/lunch">lunch</a>
            <a href="/access">access</a>
            <a href="/admin"><i class="fas fa-cog"></i> 管理</a>
        </div>

        <!-- ニュースページコンテンツ -->
        <div class="news-page-container">
            <!-- ヒーローセクション -->
            <div class="news-hero">
                <h1 class="news-hero-title">新着情報</h1>
                <p class="news-hero-subtitle">News</p>
            </div>

            <!-- ニュース一覧 -->
            <div class="news-container">
                <ul class="news-list" id="newsList">
                    <li style="text-align: center; color: #a0a0a0; padding: 3rem 0;">
                        読み込み中...
                    </li>
                </ul>
            </div>
        </div>

        <!-- フッター -->
        <footer>
            <div class="max-w-7xl mx-auto">
                <h3 class="text-2xl font-light tracking-widest mb-4">TOKACHI YAKINIKU KARIN</h3>
                <p class="text-sm text-gray-400 tracking-wider mb-8">トカチ ヤキニク カリン</p>
                
                <div class="flex justify-center space-x-8 mb-8">
                    <a href="#" class="text-gray-400 hover:text-white transition">
                        <i class="fab fa-facebook-f"></i>
                    </a>
                    <a href="#" class="text-gray-400 hover:text-white transition">
                        <i class="fab fa-twitter"></i>
                    </a>
                    <a href="#" class="text-gray-400 hover:text-white transition">
                        <i class="fab fa-instagram"></i>
                    </a>
                </div>
                <p class="text-gray-600 mt-12 text-xs tracking-wider">© 2024 TOKACHI YAKINIKU KARIN. All rights reserved.</p>
            </div>
        </footer>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
          // ハンバーガーメニュー
          function toggleMobileMenu() {
            const hamburger = document.querySelector('.hamburger');
            const mobileMenu = document.getElementById('mobileMenu');
            hamburger.classList.toggle('active');
            mobileMenu.classList.toggle('active');
          }

          // ニュースデータ読み込み
          async function loadNews() {
            try {
              const response = await axios.get('/api/news');
              const newsList = document.getElementById('newsList');
              
              if (response.data.length === 0) {
                newsList.innerHTML = \`
                  <li style="text-align: center; color: #a0a0a0; padding: 3rem 0;">
                    現在お知らせはありません
                  </li>
                \`;
                return;
              }

              newsList.innerHTML = response.data.map(news => {
                const date = new Date(news.published_date);
                const formattedDate = \`\${date.getFullYear()}年\${date.getMonth() + 1}月\${date.getDate()}日\`;
                
                return \`
                  <li class="news-item">
                    <div class="news-date">\${formattedDate}</div>
                    <h2 class="news-title">\${news.title}</h2>
                    <p class="news-content">\${news.content}</p>
                  </li>
                \`;
              }).join('');
            } catch (error) {
              console.error('ニュースの読み込みに失敗しました:', error);
              const newsList = document.getElementById('newsList');
              newsList.innerHTML = \`
                <li style="text-align: center; color: #ff6b6b; padding: 3rem 0;">
                  ニュースの読み込みに失敗しました
                </li>
              \`;
            }
          }

          // ページ読み込み時にニュースを表示
          loadNews();
        </script>
    </body>
    </html>
  `)
})

// アクセスページ
app.get('/access', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>アクセス | TOKACHI YAKINIKU KARIN</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@200;300;400;600;700;900&family=Noto+Sans+JP:wght@100;300;400;500;700&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Noto Sans JP', sans-serif;
            background: #0a0a0a;
            color: #e0e0e0;
            line-height: 1.8;
          }
          
          h1, h2, h3, h4 {
            font-family: 'Noto Serif JP', serif;
            font-weight: 300;
            letter-spacing: 0.1em;
          }
          
          .bg-dark {
            background: #0a0a0a;
          }
          
          .bg-dark-alt {
            background: #141414;
          }
          
          nav {
            background: rgba(10, 10, 10, 0.95);
            backdrop-filter: blur(10px);
          }
          
          .nav-link {
            position: relative;
            font-size: 0.9rem;
            letter-spacing: 0.1em;
            transition: color 0.3s ease;
          }
          
          .nav-link:after {
            content: '';
            position: absolute;
            bottom: -4px;
            left: 0;
            width: 0;
            height: 1px;
            background: #d4af37;
            transition: width 0.3s ease;
          }
          
          .nav-link:hover:after {
            width: 100%;
          }
          
          .section-title {
            font-size: 2rem;
            text-align: center;
            margin-bottom: 1rem;
            font-weight: 300;
            letter-spacing: 0.2em;
          }
          
          .divider {
            width: 60px;
            height: 1px;
            background: #d4af37;
            margin: 2rem auto;
          }
          
          /* ハンバーガーメニュー */
          .hamburger {
            display: none;
            flex-direction: column;
            cursor: pointer;
            padding: 0.5rem;
          }
          
          @media (max-width: 768px) {
            .hamburger {
              display: flex;
            }
          }
          
          .hamburger span {
            width: 25px;
            height: 2px;
            background: white;
            margin: 3px 0;
            transition: all 0.3s ease;
          }
          
          .hamburger.active span:nth-child(1) {
            transform: rotate(45deg) translate(6px, 6px);
          }
          
          .hamburger.active span:nth-child(2) {
            opacity: 0;
          }
          
          .hamburger.active span:nth-child(3) {
            transform: rotate(-45deg) translate(7px, -7px);
          }
          
          .mobile-menu {
            display: none;
            position: fixed;
            top: 96px;
            left: 0;
            right: 0;
            background: rgba(10, 10, 10, 0.98);
            backdrop-filter: blur(10px);
            padding: 2rem;
            z-index: 40;
            border-top: 1px solid rgba(212, 175, 55, 0.2);
          }
          
          .mobile-menu.active {
            display: block;
            animation: slideDown 0.3s ease;
          }
          
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .mobile-menu a {
            display: block;
            padding: 1rem 0;
            color: white;
            text-decoration: none;
            font-size: 1.1rem;
            letter-spacing: 0.1em;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
          }
          
          .mobile-menu a:hover {
            color: #d4af37;
            padding-left: 1rem;
          }
          
          .mobile-menu a:last-child {
            border-bottom: none;
          }
        </style>
        
        <!-- Structured Data (JSON-LD) -->
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Restaurant",
          "name": "TOKACHI YAKINIKU KARIN",
          "alternateName": "トカチ ヤキニク カリン",
          "image": "https://tokachi-yakiniku-karin.com/logo-hero.png",
          "description": "帯広の高級焼肉店。十勝若牛、希少なオーガニックラム、新鮮なレバー刺身をご堪能。デート・宴会に最適な個室完備。",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "西一条南8-20-5",
            "addressLocality": "帯広市",
            "addressRegion": "北海道",
            "postalCode": "080-0011",
            "addressCountry": "JP"
          },
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": 42.9236,
            "longitude": 143.1947
          },
          "telephone": "+81-50-8883-6929",
          "url": "https://tokachi-yakiniku-karin.com/",
          "priceRange": "¥¥¥",
          "servesCuisine": ["焼肉", "Japanese", "Yakiniku"],
          "acceptsReservations": "True",
          "menu": "https://tokachi-yakiniku-karin.com/menu",
          "hasMenu": "https://tokachi-yakiniku-karin.com/menu",
          "openingHoursSpecification": [
            {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
              "opens": "17:00",
              "closes": "23:00"
            },
            {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": ["Saturday", "Sunday"],
              "opens": "17:00",
              "closes": "23:00"
            }
          ],
          "sameAs": [
            "https://www.instagram.com/tokachi_yakiniku_karin"
          ],
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "reviewCount": "120"
          }
        }
        </script>
    </head>
    <body class="bg-dark">
        <!-- ナビゲーション -->
        <nav class="fixed w-full top-0 z-50 text-white shadow-2xl">
            <div class="max-w-7xl mx-auto px-6 lg:px-8">
                <div class="flex justify-between items-center h-24">
                    <div class="flex-shrink-0">
                        <a href="/" class="flex items-center">
                          <img src="/logo-header.png" alt="TOKACHI YAKINIKU KARIN Logo" class="h-16 w-auto">
                        </a>
                    </div>
                    <!-- デスクトップメニュー -->
                    <div class="hidden md:flex space-x-10">
                        <a href="/news" class="nav-link text-white hover:text-yellow-500">news</a>
                        <a href="/menu" class="nav-link text-white hover:text-yellow-500">dinner</a>
                        <a href="/course" class="nav-link text-white hover:text-yellow-500">course</a>
                        <a href="/commitment" class="nav-link text-white hover:text-yellow-500">preference</a>
                        <a href="/lunch" class="nav-link text-white hover:text-yellow-500">lunch</a>
                        <a href="/access" class="nav-link text-yellow-500">access</a>
                        <a href="/admin" class="nav-link text-yellow-600 hover:text-yellow-500">
                          <i class="fas fa-cog text-sm"></i> 管理
                        </a>
                    </div>
                    <!-- ハンバーガーメニューボタン -->
                    <div class="hamburger md:hidden" onclick="toggleMobileMenu()">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        </nav>
        
        <!-- モバイルメニュー -->
        <div class="mobile-menu" id="mobileMenu">
            <a href="/news">news</a>
            <a href="/menu">dinner</a>
            <a href="/course">course</a>
            <a href="/commitment">preference</a>
            <a href="/lunch">lunch</a>
            <a href="/access">access</a>
            <a href="/admin"><i class="fas fa-cog"></i> 管理</a>
        </div>

        <!-- ヘッダー -->
        <div class="pt-40 pb-20 bg-dark-alt">
            <div class="max-w-6xl mx-auto px-6 lg:px-8 text-center">
                <h1 class="section-title text-white text-4xl mb-6">Access</h1>
                <div class="divider"></div>
                <p class="text-gray-400 text-sm tracking-wider">店舗情報・アクセス</p>
            </div>
        </div>

        <!-- アクセス情報 -->
        <section class="py-24 bg-dark">
            <div class="max-w-6xl mx-auto px-6 lg:px-8">
                <div class="grid md:grid-cols-2 gap-16">
                    <div id="store-info" class="space-y-8 text-gray-300">
                        <!-- JavaScript で動的に読み込まれます -->
                    </div>
                    
                    <div class="relative overflow-hidden" style="height: 500px;">
                        <iframe 
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2916.1868372669383!2d143.19065057637704!3d42.918409502068455!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x5f0b4eb4a88a888b%3A0x5f0b4eb4a88a888b!2z44CSMDgwLTAwMTEg5YyX5rW36YGT5biv5bqD5biC6KW_77yR5p2h5Y2X77yY5LiB55uu77yS77yQ4oiS77yV!5e0!3m2!1sja!2sjp!4v1703123456789!5m2!1sja!2sjp"
                            width="100%" 
                            height="100%" 
                            style="border:0; filter: grayscale(30%) contrast(90%);" 
                            allowfullscreen="" 
                            loading="lazy"
                            referrerpolicy="no-referrer-when-downgrade">
                        </iframe>
                    </div>
                </div>
            </div>
        </section>

        <!-- フッター -->
        <footer class="bg-dark text-white py-16 border-t border-gray-800">
            <div class="max-w-6xl mx-auto px-6 lg:px-8">
                <div class="text-center">
                    <h3 class="text-xl font-light tracking-widest mb-3">TOKACHI YAKINIKU KARIN</h3>
                    <p class="text-gray-500 text-sm mb-6 tracking-wider">トカチ ヤキニク カリン</p>
                    <div class="divider"></div>
                    <p class="text-gray-400 text-sm mb-2">北海道帯広市西一条南8-20-5</p>
                    <p class="text-gray-400 text-sm mb-6">TEL: 050-8883-6929</p>
                    <div class="flex justify-center space-x-8 mt-8">
                        <a href="https://www.instagram.com/tokachi_yakiniku_karin" target="_blank" class="text-gray-400 hover:text-yellow-500 transition text-xl">
                            <i class="fab fa-instagram"></i>
                        </a>
                    </div>
                    <p class="text-gray-600 mt-12 text-xs tracking-wider">© 2024 TOKACHI YAKINIKU KARIN. All rights reserved.</p>
                </div>
            </div>
        </footer>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
          async function loadStoreInfo() {
            try {
              const response = await axios.get('/api/store-info')
              const info = response.data
              
              document.getElementById('store-info').innerHTML = \`
                <div class="space-y-8">
                  <div class="border-l-2 border-yellow-700 pl-6">
                    <h4 class="text-sm text-gray-500 mb-2 tracking-widest">STORE NAME</h4>
                    <p class="text-gray-200 mb-1">\${info.store_name || ''}</p>
                    <p class="text-sm text-gray-400">\${info.store_name_ja || ''}</p>
                  </div>
                  
                  <div class="border-l-2 border-yellow-700 pl-6">
                    <h4 class="text-sm text-gray-500 mb-2 tracking-widest">ADDRESS</h4>
                    <p class="text-gray-200 mb-1">\${info.address || ''}</p>
                    <p class="text-sm text-gray-400">\${info.access || ''}</p>
                  </div>
                  
                  <div class="border-l-2 border-yellow-700 pl-6">
                    <h4 class="text-sm text-gray-500 mb-2 tracking-widest">PHONE</h4>
                    <p class="text-gray-200">\${info.phone || ''}</p>
                  </div>
                  
                  <div class="border-l-2 border-yellow-700 pl-6">
                    <h4 class="text-sm text-gray-500 mb-2 tracking-widest">HOURS</h4>
                    <p class="text-sm text-gray-300 leading-loose">\${info.hours_weekday || ''}</p>
                    <p class="text-sm text-gray-300 leading-loose mt-2">\${info.hours_weekend || ''}</p>
                    <p class="text-sm text-gray-300 leading-loose mt-2">\${info.hours_tuesday || ''}</p>
                  </div>
                  
                  <div class="border-l-2 border-yellow-700 pl-6">
                    <h4 class="text-sm text-gray-500 mb-2 tracking-widest">SEATS</h4>
                    <p class="text-gray-300">\${info.seats || ''}</p>
                  </div>
                  
                  <div class="border-l-2 border-yellow-700 pl-6">
                    <h4 class="text-sm text-gray-500 mb-2 tracking-widest">PARKING</h4>
                    <p class="text-gray-300">\${info.parking || ''}</p>
                  </div>
                  
                  <div class="border-l-2 border-yellow-700 pl-6">
                    <h4 class="text-sm text-gray-500 mb-2 tracking-widest">INSTAGRAM</h4>
                    <a href="\${info.instagram || ''}" target="_blank" class="text-yellow-600 hover:text-yellow-500 text-sm transition">
                      @tokachi_yakiniku_karin
                    </a>
                  </div>
                </div>
              \`
            } catch (error) {
              console.error('Failed to load store info:', error)
            }
          }
          
          document.addEventListener('DOMContentLoaded', loadStoreInfo)
          
          // ハンバーガーメニューの切り替え
          function toggleMobileMenu() {
            const menu = document.getElementById('mobileMenu')
            const hamburger = document.querySelector('.hamburger')
            menu.classList.toggle('active')
            hamburger.classList.toggle('active')
          }
        </script>
    </body>
    </html>
  `)
})

// こだわりページ
app.get('/commitment', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>こだわり | TOKACHI YAKINIKU KARIN</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@200;300;400;600;700;900&family=Noto+Sans+JP:wght@100;300;400;500;700&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Noto Sans JP', sans-serif;
            background: #0a0a0a;
            color: #e0e0e0;
            line-height: 1.8;
          }
          
          h1, h2, h3, h4 {
            font-family: 'Noto Serif JP', serif;
            font-weight: 300;
            letter-spacing: 0.1em;
          }
          
          .bg-dark {
            background: #0a0a0a;
          }
          
          .bg-dark-alt {
            background: #141414;
          }
          
          nav {
            background: rgba(10, 10, 10, 0.95);
            backdrop-filter: blur(10px);
          }
          
          .nav-link {
            position: relative;
            font-size: 0.9rem;
            letter-spacing: 0.1em;
            transition: color 0.3s ease;
          }
          
          .nav-link:after {
            content: '';
            position: absolute;
            bottom: -4px;
            left: 0;
            width: 0;
            height: 1px;
            background: #d4af37;
            transition: width 0.3s ease;
          }
          
          .nav-link:hover:after {
            width: 100%;
          }
          
          .section-title {
            font-size: 2rem;
            text-align: center;
            margin-bottom: 1rem;
            font-weight: 300;
            letter-spacing: 0.2em;
          }
          
          .divider {
            width: 60px;
            height: 1px;
            background: #d4af37;
            margin: 2rem auto;
          }
          
          /* ハンバーガーメニュー */
          .hamburger {
            display: none;
            flex-direction: column;
            cursor: pointer;
            padding: 0.5rem;
          }
          
          @media (max-width: 768px) {
            .hamburger {
              display: flex;
            }
          }
          
          .hamburger span {
            width: 25px;
            height: 2px;
            background: white;
            margin: 3px 0;
            transition: all 0.3s ease;
          }
          
          .hamburger.active span:nth-child(1) {
            transform: rotate(45deg) translate(6px, 6px);
          }
          
          .hamburger.active span:nth-child(2) {
            opacity: 0;
          }
          
          .hamburger.active span:nth-child(3) {
            transform: rotate(-45deg) translate(7px, -7px);
          }
          
          .mobile-menu {
            display: none;
            position: fixed;
            top: 96px;
            left: 0;
            right: 0;
            background: rgba(10, 10, 10, 0.98);
            backdrop-filter: blur(10px);
            padding: 2rem;
            z-index: 40;
            border-top: 1px solid rgba(212, 175, 55, 0.2);
          }
          
          .mobile-menu.active {
            display: block;
            animation: slideDown 0.3s ease;
          }
          
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .mobile-menu a {
            display: block;
            padding: 1rem 0;
            color: white;
            text-decoration: none;
            font-size: 1.1rem;
            letter-spacing: 0.1em;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
          }
          
          .mobile-menu a:hover {
            color: #d4af37;
            padding-left: 1rem;
          }
          
          .mobile-menu a:last-child {
            border-bottom: none;
          }
          
          .commitment-section {
            position: relative;
          }
          
          .commitment-image {
            width: 100%;
            height: 400px;
            object-fit: cover;
            filter: brightness(0.8) contrast(1.1);
          }
          
          .commitment-content {
            padding: 3rem;
            background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
            border-left: 3px solid #d4af37;
          }
          
          .commitment-title {
            font-size: 2rem;
            margin-bottom: 2rem;
            color: white;
            font-weight: 300;
            letter-spacing: 0.15em;
          }
          
          .commitment-text {
            color: #bbb;
            line-height: 2;
            font-size: 1rem;
            margin-bottom: 1.5rem;
          }
          
          .highlight {
            color: #d4af37;
            font-weight: 500;
          }
        </style>
        
        <!-- Structured Data (JSON-LD) -->
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Restaurant",
          "name": "TOKACHI YAKINIKU KARIN",
          "alternateName": "トカチ ヤキニク カリン",
          "image": "https://tokachi-yakiniku-karin.com/logo-hero.png",
          "description": "帯広の高級焼肉店。十勝若牛、希少なオーガニックラム、新鮮なレバー刺身をご堪能。デート・宴会に最適な個室完備。",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "西一条南8-20-5",
            "addressLocality": "帯広市",
            "addressRegion": "北海道",
            "postalCode": "080-0011",
            "addressCountry": "JP"
          },
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": 42.9236,
            "longitude": 143.1947
          },
          "telephone": "+81-50-8883-6929",
          "url": "https://tokachi-yakiniku-karin.com/",
          "priceRange": "¥¥¥",
          "servesCuisine": ["焼肉", "Japanese", "Yakiniku"],
          "acceptsReservations": "True",
          "menu": "https://tokachi-yakiniku-karin.com/menu",
          "hasMenu": "https://tokachi-yakiniku-karin.com/menu",
          "openingHoursSpecification": [
            {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
              "opens": "17:00",
              "closes": "23:00"
            },
            {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": ["Saturday", "Sunday"],
              "opens": "17:00",
              "closes": "23:00"
            }
          ],
          "sameAs": [
            "https://www.instagram.com/tokachi_yakiniku_karin"
          ],
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "reviewCount": "120"
          }
        }
        </script>
    </head>
    <body class="bg-dark">
        <!-- ナビゲーション -->
        <nav class="fixed w-full top-0 z-50 text-white shadow-2xl">
            <div class="max-w-7xl mx-auto px-6 lg:px-8">
                <div class="flex justify-between items-center h-24">
                    <div class="flex-shrink-0">
                        <a href="/" class="flex items-center">
                          <img src="/logo-header.png" alt="TOKACHI YAKINIKU KARIN Logo" class="h-16 w-auto">
                        </a>
                    </div>
                    <!-- デスクトップメニュー -->
                    <div class="hidden md:flex space-x-10">
                        <a href="/news" class="nav-link text-white hover:text-yellow-500">news</a>
                        <a href="/menu" class="nav-link text-white hover:text-yellow-500">dinner</a>
                        <a href="/course" class="nav-link text-white hover:text-yellow-500">course</a>
                        <a href="/commitment" class="nav-link text-yellow-500">preference</a>
                        <a href="/lunch" class="nav-link text-white hover:text-yellow-500">lunch</a>
                        <a href="/access" class="nav-link text-white hover:text-yellow-500">access</a>
                        <a href="/admin" class="nav-link text-yellow-600 hover:text-yellow-500">
                          <i class="fas fa-cog text-sm"></i> 管理
                        </a>
                    </div>
                    <!-- ハンバーガーメニューボタン -->
                    <div class="hamburger md:hidden" onclick="toggleMobileMenu()">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        </nav>
        
        <!-- モバイルメニュー -->
        <div class="mobile-menu" id="mobileMenu">
            <a href="/news">news</a>
            <a href="/menu">dinner</a>
            <a href="/course">course</a>
            <a href="/commitment">preference</a>
            <a href="/lunch">lunch</a>
            <a href="/access">access</a>
            <a href="/admin"><i class="fas fa-cog"></i> 管理</a>
        </div>

        <!-- ヘッダー -->
        <div class="pt-40 pb-20 bg-dark-alt">
            <div class="max-w-6xl mx-auto px-6 lg:px-8 text-center">
                <h1 class="section-title text-white text-4xl mb-6">KARINのこだわり</h1>
                <div class="divider"></div>
                <p class="text-gray-400 text-sm tracking-wider">厳選された素材と空間への想い</p>
            </div>
        </div>

        <!-- こだわり1: 十勝若牛 -->
        <section class="py-20 bg-dark commitment-section">
            <div class="max-w-6xl mx-auto px-6 lg:px-8">
                <div class="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <img id="commitment-image-1" 
                             src="https://images.unsplash.com/photo-1558030006-450675393462?w=1200&q=80" 
                             alt="十勝若牛" 
                             class="commitment-image">
                    </div>
                    <div class="commitment-content">
                        <h2 class="commitment-title">十勝若牛®</h2>
                        <div class="divider mx-0"></div>
                        <p class="commitment-text">
                          北海道十勝清水町が誇る<span class="highlight">「十勝若牛®」</span>は、わずか14ヶ月の飼育期間で仕上げられる希少な牛肉です。
                        </p>
                        <p class="commitment-text">
                          一般的な肥育牛よりも短い飼育期間により、<span class="highlight">柔らかな食感と赤身本来の深い旨み</span>を実現。
                          低脂肪・低カロリーでヘルシーな味わいは、特に女性のお客様に高い評価をいただいております。
                        </p>
                        <p class="commitment-text">
                          「牛肉サミット2012」での受賞や「ニューご当地グルメグランプリ北海道」の殿堂入りなど、
                          その品質は全国で高く評価されています。
                        </p>
                        <p class="commitment-text">
                          十勝の雄大な自然の中で育まれた若牛は、<span class="highlight">赤身の美味しさ</span>を追求したKARINの看板食材です。
                          生産から加工まで徹底した品質管理のもと、最高の状態でご提供いたします。
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <!-- こだわり2: アイスランドラム -->
        <section class="py-20 bg-dark-alt commitment-section">
            <div class="max-w-6xl mx-auto px-6 lg:px-8">
                <div class="grid md:grid-cols-2 gap-12 items-center">
                    <div class="commitment-content">
                        <h2 class="commitment-title">希少なアイスランドラム</h2>
                        <div class="divider mx-0"></div>
                        <p class="commitment-text">
                          当店が自信を持ってお届けする<span class="highlight">アイスランド産ラム</span>は、
                          日本への輸入量がわずか1%という超希少食材です。
                        </p>
                        <p class="commitment-text">
                          その歴史は9〜10世紀のヴァイキング時代に遡ります。アイスランドに持ち込まれた羊は、
                          <span class="highlight">1100年以上もの間、一度も他の品種と交配されることなく</span>
                          純血を保ち続けてきました。世界最古・最も純粋な羊種として知られています。
                        </p>
                        <p class="commitment-text">
                          生後4〜5ヶ月の若い仔羊のみを使用し、その肉質は驚くほど繊細で優しい味わい。
                          ラム特有の臭みは一切なく、<span class="highlight">繊細な肉質と甘い脂</span>が特徴です。
                        </p>
                        <p class="commitment-text">
                          5月から放牧が始まり、アイスランドの大自然の中で、天然のハーブや花、ベリーのみを食べて育ちます。
                          人工的な穀物飼料やホルモン剤は一切使用されていません。
                        </p>
                        <p class="commitment-text">
                          日本ではほとんど味わうことのできない、<span class="highlight">究極のラム肉</span>をぜひご賞味ください。
                        </p>
                    </div>
                    <div>
                        <img id="commitment-image-2" 
                             src="https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=1200&q=80" 
                             alt="アイスランドラム" 
                             class="commitment-image">
                    </div>
                </div>
            </div>
        </section>

        <!-- こだわり3: 個室空間 -->
        <section class="py-20 bg-dark commitment-section">
            <div class="max-w-6xl mx-auto px-6 lg:px-8">
                <div class="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <img id="commitment-image-3" 
                             src="/static/private-room.jpg" 
                             alt="個室空間" 
                             class="commitment-image">
                    </div>
                    <div class="commitment-content">
                        <h2 class="commitment-title">上質な個室空間</h2>
                        <div class="divider mx-0"></div>
                        <p class="commitment-text">
                          KARINでは、お料理だけでなく<span class="highlight">空間</span>にもこだわりを持っております。
                        </p>
                        <p class="commitment-text">
                          2階には2名様から26名様までご利用いただける個室をご用意。
                          落ち着いた雰囲気の中、プライベートな時間をお過ごしいただけます。
                        </p>
                        <p class="commitment-text">
                          <span class="highlight">接待やビジネスシーン</span>はもちろん、
                          ご家族でのお祝い、大切な方との記念日、ご友人とのご宴会など、
                          あらゆるシーンに対応いたします。
                        </p>
                        <p class="commitment-text">
                          1階のテーブル席は20席、2階の個室は24席の合計44席をご用意。
                          貸切は20名様から50名様まで承っております。
                        </p>
                        <p class="commitment-text">
                          Wi-Fi完備、バースデープレートなどのサプライズ対応も可能です。
                          特別な日を彩る<span class="highlight">上質な空間</span>で、極上の焼肉体験をお楽しみください。
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <!-- フッター -->
        <footer class="bg-dark text-white py-16 border-t border-gray-800">
            <div class="max-w-6xl mx-auto px-6 lg:px-8">
                <div class="text-center">
                    <h3 class="text-xl font-light tracking-widest mb-3">TOKACHI YAKINIKU KARIN</h3>
                    <p class="text-gray-500 text-sm mb-6 tracking-wider">トカチ ヤキニク カリン</p>
                    <div class="divider"></div>
                    <p class="text-gray-400 text-sm mb-2">北海道帯広市西一条南8-20-5</p>
                    <p class="text-gray-400 text-sm mb-6">TEL: 050-8883-6929</p>
                    <div class="flex justify-center space-x-8 mt-8">
                        <a href="https://www.instagram.com/tokachi_yakiniku_karin" target="_blank" class="text-gray-400 hover:text-yellow-500 transition text-xl">
                            <i class="fab fa-instagram"></i>
                        </a>
                    </div>
                    <p class="text-gray-600 mt-12 text-xs tracking-wider">© 2024 TOKACHI YAKINIKU KARIN. All rights reserved.</p>
                </div>
            </div>
        </footer>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
          // ハンバーガーメニューの切り替え
          function toggleMobileMenu() {
            const menu = document.getElementById('mobileMenu')
            const hamburger = document.querySelector('.hamburger')
            menu.classList.toggle('active')
            hamburger.classList.toggle('active')
          }
          
          // こだわりページの画像を読み込み
          async function loadCommitmentImages() {
            try {
              const response = await axios.get('/api/page-images');
              const images = response.data.filter(img => img.page_name === 'commitment');
              
              images.forEach(img => {
                if (img.image_key === 'commitment_image_1') {
                  const el = document.getElementById('commitment-image-1');
                  if (el) el.src = img.image_url;
                } else if (img.image_key === 'commitment_image_2') {
                  const el = document.getElementById('commitment-image-2');
                  if (el) el.src = img.image_url;
                } else if (img.image_key === 'commitment_image_3') {
                  const el = document.getElementById('commitment-image-3');
                  if (el) el.src = img.image_url;
                }
              });
            } catch (error) {
              console.error('画像の読み込みエラー:', error);
            }
          }
          
          // ページ読み込み時に実行
          document.addEventListener('DOMContentLoaded', loadCommitmentImages);
        </script>
    </body>
    </html>
  `)
})

// 年末オードブルページ
app.get('/osechi', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>年末オードブル | TOKACHI YAKINIKU KARIN</title>
        <meta name="description" content="TOKACHI YAKINIKU KARINの年末特別オードブル。ご予約受付中。">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Noto Sans JP', sans-serif;
            background: #0a0a0a;
            color: #e0e0e0;
            overflow: hidden;
          }
          
          .iframe-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100vh;
            border: none;
          }
          
          .back-button {
            position: fixed;
            top: 20px;
            left: 20px;
            z-index: 9999;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 24px;
            border-radius: 50px;
            text-decoration: none;
            font-size: 14px;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          .back-button:hover {
            background: rgba(212, 175, 55, 0.9);
            color: black;
            transform: translateX(-5px);
          }
        </style>
    </head>
    <body>
        <a href="/" class="back-button">
            <i class="fas fa-arrow-left"></i> トップに戻る
        </a>
        
        <iframe 
            src="https://diomovxr.gensparkspace.com/" 
            class="iframe-container"
            title="年末オードブル"
            frameborder="0"
            allowfullscreen>
        </iframe>
    </body>
    </html>
  `)
})

// コースページ
app.get('/course', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>コース | TOKACHI YAKINIKU KARIN</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@200;300;400;600;700;900&family=Noto+Sans+JP:wght@100;300;400;500;700&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Noto Sans JP', sans-serif;
            background: #0a0a0a;
            color: #e0e0e0;
            line-height: 1.8;
          }
          
          .bg-dark {
            background: #0a0a0a;
          }
          
          .bg-dark-alt {
            background: linear-gradient(to bottom, #1a1a1a, #0a0a0a);
          }
          
          nav {
            background: rgba(10, 10, 10, 0.95);
            backdrop-filter: blur(10px);
          }
          
          .nav-link {
            position: relative;
            font-weight: 300;
            letter-spacing: 0.1em;
            transition: all 0.3s ease;
          }
          
          .section-title {
            font-size: 2rem;
            text-align: center;
            margin-bottom: 1rem;
            font-weight: 300;
            letter-spacing: 0.2em;
          }
          
          .divider {
            width: 60px;
            height: 1px;
            background: #d4af37;
            margin: 2rem auto;
          }
          
          /* ハンバーガーメニュー */
          .hamburger {
            display: none;
            flex-direction: column;
            cursor: pointer;
            padding: 0.5rem;
          }
          
          @media (max-width: 768px) {
            .hamburger {
              display: flex;
            }
          }
          
          .hamburger span {
            width: 25px;
            height: 2px;
            background: white;
            margin: 3px 0;
            transition: all 0.3s ease;
          }
          
          .hamburger.active span:nth-child(1) {
            transform: rotate(45deg) translate(6px, 6px);
          }
          
          .hamburger.active span:nth-child(2) {
            opacity: 0;
          }
          
          .hamburger.active span:nth-child(3) {
            transform: rotate(-45deg) translate(7px, -7px);
          }
          
          .mobile-menu {
            display: none;
            position: fixed;
            top: 96px;
            left: 0;
            right: 0;
            background: rgba(10, 10, 10, 0.98);
            backdrop-filter: blur(10px);
            padding: 2rem;
            z-index: 40;
            border-top: 1px solid rgba(212, 175, 55, 0.2);
          }
          
          .mobile-menu.active {
            display: block;
            animation: slideDown 0.3s ease;
          }
          
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .mobile-menu a {
            display: block;
            padding: 1rem 0;
            color: white;
            text-decoration: none;
            font-size: 1.1rem;
            letter-spacing: 0.1em;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
          }
          
          .mobile-menu a:hover {
            color: #d4af37;
            padding-left: 1rem;
          }
          
          .mobile-menu a:last-child {
            border-bottom: none;
          }
          
          .course-card {
            background: rgba(26, 26, 26, 0.8);
            border: 1px solid rgba(212, 175, 55, 0.2);
            border-radius: 8px;
            padding: 3rem;
            margin-bottom: 3rem;
            transition: all 0.3s ease;
          }
          
          .course-card:hover {
            border-color: rgba(212, 175, 55, 0.5);
            transform: translateY(-5px);
          }
          
          .course-title {
            font-size: 2rem;
            color: #d4af37;
            margin-bottom: 1rem;
            font-weight: 300;
            letter-spacing: 0.15em;
            text-align: center;
          }
          
          .course-subtitle {
            font-size: 0.9rem;
            color: #888;
            margin-bottom: 2rem;
            text-align: center;
          }
          
          .course-price {
            font-size: 1.8rem;
            color: #d4af37;
            text-align: center;
            margin-bottom: 2rem;
            font-weight: 500;
          }
          
          .course-menu {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1.5rem;
          }
          
          @media (max-width: 768px) {
            .course-menu {
              grid-template-columns: 1fr;
            }
          }
          
          .menu-item {
            display: flex;
            align-items: flex-start;
            padding: 1rem 0;
            border-bottom: 1px solid rgba(212, 175, 55, 0.1);
          }
          
          .menu-item-bullet {
            color: #d4af37;
            margin-right: 0.8rem;
            margin-top: 0.3rem;
          }
          
          .menu-item-content {
            flex: 1;
          }
          
          .menu-item-name {
            font-size: 1rem;
            color: #e0e0e0;
            margin-bottom: 0.3rem;
          }
          
          .menu-item-name-en {
            font-size: 0.85rem;
            color: #888;
          }
          
          .note-text {
            color: #888;
            font-size: 0.9rem;
            margin-top: 2rem;
            padding: 1rem;
            background: rgba(212, 175, 55, 0.05);
            border-left: 2px solid #d4af37;
            text-align: center;
          }
          
          .special-course {
            background: linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(26, 26, 26, 0.9) 100%);
            border: 2px solid rgba(212, 175, 55, 0.3);
          }
          
          .special-course:hover {
            border-color: rgba(212, 175, 55, 0.6);
          }
          
          .course-image {
            width: 100%;
            height: 300px;
            object-fit: cover;
            border-radius: 8px;
            margin-bottom: 2rem;
          }
        </style>
        
        <!-- Structured Data (JSON-LD) -->
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Restaurant",
          "name": "TOKACHI YAKINIKU KARIN",
          "alternateName": "トカチ ヤキニク カリン",
          "image": "https://tokachi-yakiniku-karin.com/logo-hero.png",
          "description": "帯広の高級焼肉店。十勝若牛、希少なオーガニックラム、新鮮なレバー刺身をご堪能。デート・宴会に最適な個室完備。",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "西一条南8-20-5",
            "addressLocality": "帯広市",
            "addressRegion": "北海道",
            "postalCode": "080-0011",
            "addressCountry": "JP"
          },
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": 42.9236,
            "longitude": 143.1947
          },
          "telephone": "+81-50-8883-6929",
          "url": "https://tokachi-yakiniku-karin.com/",
          "priceRange": "¥¥¥",
          "servesCuisine": ["焼肉", "Japanese", "Yakiniku"],
          "acceptsReservations": "True",
          "menu": "https://tokachi-yakiniku-karin.com/menu",
          "hasMenu": "https://tokachi-yakiniku-karin.com/menu",
          "openingHoursSpecification": [
            {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
              "opens": "17:00",
              "closes": "23:00"
            },
            {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": ["Saturday", "Sunday"],
              "opens": "17:00",
              "closes": "23:00"
            }
          ],
          "sameAs": [
            "https://www.instagram.com/tokachi_yakiniku_karin"
          ],
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "reviewCount": "120"
          }
        }
        </script>
    </head>
    <body class="bg-dark">
        <!-- ナビゲーション -->
        <nav class="fixed w-full top-0 z-50 text-white shadow-2xl">
            <div class="max-w-7xl mx-auto px-6 lg:px-8">
                <div class="flex justify-between items-center h-24">
                    <div class="flex-shrink-0">
                        <a href="/" class="flex items-center">
                          <img src="/logo-header.png" alt="TOKACHI YAKINIKU KARIN Logo" class="h-16 w-auto">
                        </a>
                    </div>
                    <!-- デスクトップメニュー -->
                    <div class="hidden md:flex space-x-10">
                        <a href="/news" class="nav-link text-white hover:text-yellow-500">news</a>
                        <a href="/menu" class="nav-link text-white hover:text-yellow-500">dinner</a>
                        <a href="/course" class="nav-link text-white hover:text-yellow-500">course</a>
                        <a href="/commitment" class="nav-link text-white hover:text-yellow-500">preference</a>
                        <a href="/lunch" class="nav-link text-white hover:text-yellow-500">lunch</a>
                        <a href="/access" class="nav-link text-white hover:text-yellow-500">access</a>
                        <a href="/admin" class="nav-link text-yellow-600 hover:text-yellow-500">
                          <i class="fas fa-cog text-sm"></i> 管理
                        </a>
                    </div>
                    <!-- ハンバーガーメニューボタン -->
                    <div class="hamburger md:hidden" onclick="toggleMobileMenu()">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        </nav>
        
        <!-- モバイルメニュー -->
        <div class="mobile-menu" id="mobileMenu">
            <a href="/news">news</a>
            <a href="/menu">dinner</a>
            <a href="/course">course</a>
            <a href="/commitment">preference</a>
            <a href="/lunch">lunch</a>
            <a href="/access">access</a>
            <a href="/admin"><i class="fas fa-cog"></i> 管理</a>
        </div>

        <!-- ヘッダー -->
        <div class="pt-40 pb-20 bg-dark-alt">
            <div class="max-w-6xl mx-auto px-6 lg:px-8 text-center">
                <h1 class="section-title text-white text-4xl mb-6">Course</h1>
                <div class="divider"></div>
                <p class="text-gray-400 text-sm tracking-wider">コースメニュー</p>
            </div>
        </div>

        <!-- コースメニュー -->
        <div class="py-16 max-w-5xl mx-auto px-6 lg:px-8">
            <!-- 匠コース -->
            <div class="course-card">
                <h2 class="course-title">12/24,25限定クリスマスコース</h2>
                <p class="course-subtitle">Christmas Special Course</p>
                <div class="course-price">お一人様 6,500円（税込）</div>
                
                <div class="course-menu">
                    <div class="menu-item">
                        <div class="menu-item-bullet">●</div>
                        <div class="menu-item-content">
                            <div class="menu-item-name">前菜三点盛り合わせ</div>
                            <div class="menu-item-name-en">Assortment of 3 appetizers</div>
                        </div>
                    </div>
                    <div class="menu-item">
                        <div class="menu-item-bullet">●</div>
                        <div class="menu-item-content">
                            <div class="menu-item-name">本日のサラダ</div>
                            <div class="menu-item-name-en">Today's salad</div>
                        </div>
                    </div>
                    <div class="menu-item">
                        <div class="menu-item-bullet">●</div>
                        <div class="menu-item-content">
                            <div class="menu-item-name">霜降りタン（塩）</div>
                            <div class="menu-item-name-en">Marbled beef tongue (salt)</div>
                        </div>
                    </div>
                    <div class="menu-item">
                        <div class="menu-item-bullet">●</div>
                        <div class="menu-item-content">
                            <div class="menu-item-name">上ヒレ（塩）</div>
                            <div class="menu-item-name-en">Prime fillet (salt)</div>
                        </div>
                    </div>
                    <div class="menu-item">
                        <div class="menu-item-bullet">●</div>
                        <div class="menu-item-content">
                            <div class="menu-item-name">上赤身（タレ）</div>
                            <div class="menu-item-name-en">Prime lean meat (sauce)</div>
                        </div>
                    </div>
                    <div class="menu-item">
                        <div class="menu-item-bullet">●</div>
                        <div class="menu-item-content">
                            <div class="menu-item-name">ハラミ（タレ）</div>
                            <div class="menu-item-name-en">Skirt steak (sauce)</div>
                        </div>
                    </div>
                    <div class="menu-item">
                        <div class="menu-item-bullet">●</div>
                        <div class="menu-item-content">
                            <div class="menu-item-name">オーガニックラムロース</div>
                            <div class="menu-item-name-en">Organic lamb loin</div>
                        </div>
                    </div>
                    <div class="menu-item">
                        <div class="menu-item-bullet">●</div>
                        <div class="menu-item-content">
                            <div class="menu-item-name">ビーフシチュー</div>
                            <div class="menu-item-name-en">Beef stew</div>
                        </div>
                    </div>
                    <div class="menu-item">
                        <div class="menu-item-bullet">●</div>
                        <div class="menu-item-content">
                            <div class="menu-item-name">かりん自家製スイーツ</div>
                            <div class="menu-item-name-en">KARIN's homemade sweets</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 宴会コース -->
            <div class="course-card">
                <h2 class="course-title">宴会コース</h2>
                <p class="course-subtitle">Banquet Course</p>
                <div class="course-price">お一人様 7,000円（税込）</div>
                
                <div class="course-menu">
                    <div class="menu-item">
                        <div class="menu-item-bullet">●</div>
                        <div class="menu-item-content">
                            <div class="menu-item-name">前菜2点盛り</div>
                            <div class="menu-item-name-en">Assortment of 2 appetizers</div>
                        </div>
                    </div>
                    <div class="menu-item">
                        <div class="menu-item-bullet">●</div>
                        <div class="menu-item-content">
                            <div class="menu-item-name">鮮菜</div>
                            <div class="menu-item-name-en">Fresh vegetables</div>
                        </div>
                    </div>
                    <div class="menu-item">
                        <div class="menu-item-bullet">●</div>
                        <div class="menu-item-content">
                            <div class="menu-item-name">葱塩上牛タン（塩）</div>
                            <div class="menu-item-name-en">Prime beef tongue with green onion salt</div>
                        </div>
                    </div>
                    <div class="menu-item">
                        <div class="menu-item-bullet">●</div>
                        <div class="menu-item-content">
                            <div class="menu-item-name">塩ラム（塩）</div>
                            <div class="menu-item-name-en">Salted lamb</div>
                        </div>
                    </div>
                    <div class="menu-item">
                        <div class="menu-item-bullet">●</div>
                        <div class="menu-item-content">
                            <div class="menu-item-name">牛ヒレ（塩）</div>
                            <div class="menu-item-name-en">Beef fillet (salt)</div>
                        </div>
                    </div>
                    <div class="menu-item">
                        <div class="menu-item-bullet">●</div>
                        <div class="menu-item-content">
                            <div class="menu-item-name">上サガリ（タレ）</div>
                            <div class="menu-item-name-en">Prime sagari (sauce)</div>
                        </div>
                    </div>
                    <div class="menu-item">
                        <div class="menu-item-bullet">●</div>
                        <div class="menu-item-content">
                            <div class="menu-item-name">和牛カルビ（タレ）</div>
                            <div class="menu-item-name-en">Wagyu kalbi (sauce)</div>
                        </div>
                    </div>
                    <div class="menu-item">
                        <div class="menu-item-bullet">●</div>
                        <div class="menu-item-content">
                            <div class="menu-item-name">上ミノ（タレ）</div>
                            <div class="menu-item-name-en">Prime mino (sauce)</div>
                        </div>
                    </div>
                    <div class="menu-item">
                        <div class="menu-item-bullet">●</div>
                        <div class="menu-item-content">
                            <div class="menu-item-name">テールスープ</div>
                            <div class="menu-item-name-en">Tail soup</div>
                        </div>
                    </div>
                    <div class="menu-item">
                        <div class="menu-item-bullet">●</div>
                        <div class="menu-item-content">
                            <div class="menu-item-name">道産サガリご飯</div>
                            <div class="menu-item-name-en">Hokkaido sagari rice</div>
                        </div>
                    </div>
                    <div class="menu-item">
                        <div class="menu-item-bullet">●</div>
                        <div class="menu-item-content">
                            <div class="menu-item-name">ソルベ（りんご or ゆず）</div>
                            <div class="menu-item-name-en">Sorbet (apple or yuzu)</div>
                        </div>
                    </div>
                </div>
            </div>


        </div>

        <!-- フッター -->
        <footer class="bg-dark text-white py-16 border-t border-gray-800">
            <div class="max-w-6xl mx-auto px-6 lg:px-8">
                <div class="text-center">
                    <h3 class="text-xl font-light tracking-widest mb-3">TOKACHI YAKINIKU KARIN</h3>
                    <p class="text-gray-500 text-sm mb-6 tracking-wider">トカチ ヤキニク カリン</p>
                    <div class="divider"></div>
                    <p class="text-gray-400 text-sm mb-2">北海道帯広市西一条南8-20-5</p>
                    <p class="text-gray-400 text-sm mb-6">TEL: 050-8883-6929</p>
                    <div class="flex justify-center space-x-8 mt-8">
                        <a href="https://www.instagram.com/tokachi_yakiniku_karin" target="_blank" class="text-gray-400 hover:text-yellow-500 transition text-xl">
                            <i class="fab fa-instagram"></i>
                        </a>
                    </div>
                    <p class="text-gray-600 mt-12 text-xs tracking-wider">© 2024 TOKACHI YAKINIKU KARIN. All rights reserved.</p>
                </div>
            </div>
        </footer>
        
        <script>
          // ハンバーガーメニューの切り替え
          function toggleMobileMenu() {
            const menu = document.getElementById('mobileMenu')
            const hamburger = document.querySelector('.hamburger')
            menu.classList.toggle('active')
            hamburger.classList.toggle('active')
          }
        </script>
    </body>
    </html>
  `)
})

// 管理画面
app.get('/admin', (c) => {
  return c.redirect('/static/admin')
})

// Cloudflare Workers の型定義
interface Env {
  DB: D1Database
  INSTAGRAM_ACCESS_TOKEN?: string
}

// Export default object with fetch and scheduled handlers
export default {
  // HTTP リクエストハンドラ
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return app.fetch(request, env, ctx)
  },
  
  // Cron Trigger ハンドラ（6時間ごとに実行）
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log('Instagram auto-sync triggered at:', new Date(event.scheduledTime).toISOString())
    
    try {
      // Instagram同期APIを内部的に呼び出す
      const syncRequest = new Request('http://localhost/api/admin/sync-instagram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      // 同期実行
      const response = await app.fetch(syncRequest, env, ctx)
      const result = await response.json()
      
      console.log('Instagram sync completed:', result)
      
      if (result.success) {
        console.log(`✅ Synced ${result.syncedCount} new posts, skipped ${result.skippedCount}`)
      } else {
        console.error('❌ Instagram sync failed:', result.error)
      }
    } catch (error) {
      console.error('❌ Instagram auto-sync error:', error)
    }
  }
}
