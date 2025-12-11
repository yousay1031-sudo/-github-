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
app.use('/static/*', serveStatic({ root: './public' }))

// === API Routes ===

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

// ギャラリー画像一覧取得
app.get('/api/gallery-images', async (c) => {
  const { DB } = c.env
  const { results } = await DB.prepare(`
    SELECT * FROM gallery_images 
    WHERE is_visible = 1 
    ORDER BY display_order ASC
  `).all()
  return c.json(results)
})

// 全ギャラリー画像取得（管理画面用）
app.get('/api/admin/gallery-images', async (c) => {
  const { DB } = c.env
  const { results } = await DB.prepare(`
    SELECT * FROM gallery_images 
    ORDER BY display_order ASC
  `).all()
  return c.json(results)
})

// ギャラリー画像作成
app.post('/api/admin/gallery-images', async (c) => {
  const { DB } = c.env
  const data = await c.req.json()
  
  const result = await DB.prepare(`
    INSERT INTO gallery_images (title, description, image_url, display_order, is_visible)
    VALUES (?, ?, ?, ?, ?)
  `).bind(
    data.title || null,
    data.description || null,
    data.image_url,
    data.display_order || 0,
    data.is_visible !== undefined ? data.is_visible : 1
  ).run()
  
  return c.json({ success: true, id: result.meta.last_row_id })
})

// ギャラリー画像更新
app.put('/api/admin/gallery-images/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  const data = await c.req.json()
  
  await DB.prepare(`
    UPDATE gallery_images 
    SET title = ?, description = ?, image_url = ?, display_order = ?, is_visible = ?
    WHERE id = ?
  `).bind(
    data.title || null,
    data.description || null,
    data.image_url,
    data.display_order || 0,
    data.is_visible !== undefined ? data.is_visible : 1,
    id
  ).run()
  
  return c.json({ success: true })
})

// ギャラリー画像削除
app.delete('/api/admin/gallery-images/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  
  await DB.prepare(`DELETE FROM gallery_images WHERE id = ?`).bind(id).run()
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
        <title>TOKACHI YAKINIKU KARIN | トカチ ヤキニク カリン</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;600;700&family=Noto+Sans+JP:wght@300;400;500&display=swap');
          
          body {
            font-family: 'Noto Sans JP', sans-serif;
          }
          
          h1, h2, h3, h4 {
            font-family: 'Noto Serif JP', serif;
          }
          
          .hero-section {
            background: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('https://images.unsplash.com/photo-1544025162-d76694265947?w=1600');
            background-size: cover;
            background-position: center;
            min-height: 70vh;
          }
          
          .text-shadow {
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
          }
          
          .hover-scale {
            transition: transform 0.3s ease;
          }
          
          .hover-scale:hover {
            transform: scale(1.05);
          }
          
          .menu-category {
            border-left: 4px solid #8B4513;
            padding-left: 1rem;
          }
          
          .bg-luxury {
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          }
        </style>
    </head>
    <body class="bg-gray-50">
        <!-- ナビゲーション -->
        <nav class="bg-luxury text-white shadow-lg sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center h-20">
                    <div class="flex-shrink-0">
                        <a href="/" class="text-2xl font-bold tracking-wider">TOKACHI YAKINIKU KARIN</a>
                        <div class="text-xs text-gray-300 mt-1">トカチ ヤキニク カリン</div>
                    </div>
                    <div class="hidden md:flex space-x-8">
                        <a href="/" class="hover:text-amber-500 transition">ホーム</a>
                        <a href="/menu" class="hover:text-amber-500 transition">メニュー</a>
                        <a href="/gallery" class="hover:text-amber-500 transition">ギャラリー</a>
                        <a href="/access" class="hover:text-amber-500 transition">アクセス</a>
                        <a href="/admin" class="text-amber-500 hover:text-amber-400 transition">
                          <i class="fas fa-cog"></i> 管理画面
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <!-- ヒーローセクション -->
        <div class="hero-section flex items-center justify-center">
            <div class="text-center text-white px-4">
                <h1 class="text-5xl md:text-7xl font-bold mb-4 text-shadow">TOKACHI YAKINIKU KARIN</h1>
                <p class="text-xl md:text-2xl mb-8 text-shadow">十勝産の厳選素材で味わう極上の焼肉</p>
                <a href="/menu" class="inline-block bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition shadow-lg">
                    メニューを見る
                </a>
            </div>
        </div>

        <!-- こだわりセクション -->
        <section class="py-20 bg-white">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center mb-16">
                    <h2 class="text-4xl font-bold text-gray-800 mb-4">KARINのこだわり</h2>
                    <div class="w-24 h-1 bg-amber-600 mx-auto"></div>
                </div>
                
                <div class="grid md:grid-cols-3 gap-8">
                    <div class="text-center p-6 hover-scale">
                        <div class="text-5xl text-amber-600 mb-4">
                            <i class="fas fa-meat"></i>
                        </div>
                        <h3 class="text-2xl font-bold mb-4">厳選素材</h3>
                        <p class="text-gray-600">
                            十勝産を中心とした最高級の素材を使用。特に数量限定のシャトーブリアンは当店の看板メニューです。
                        </p>
                    </div>
                    
                    <div class="text-center p-6 hover-scale">
                        <div class="text-5xl text-amber-600 mb-4">
                            <i class="fas fa-fire"></i>
                        </div>
                        <h3 class="text-2xl font-bold mb-4">炭火焼き</h3>
                        <p class="text-gray-600">
                            炭火で丁寧に焼き上げることで、お肉本来の旨みを最大限に引き出します。
                        </p>
                    </div>
                    
                    <div class="text-center p-6 hover-scale">
                        <div class="text-5xl text-amber-600 mb-4">
                            <i class="fas fa-door-open"></i>
                        </div>
                        <h3 class="text-2xl font-bold mb-4">個室完備</h3>
                        <p class="text-gray-600">
                            2名様から26名様までご利用可能な個室をご用意。接待や宴会にも最適です。
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <!-- おすすめメニュー -->
        <section class="py-20 bg-gray-100" id="menu-preview">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center mb-16">
                    <h2 class="text-4xl font-bold text-gray-800 mb-4">おすすめメニュー</h2>
                    <div class="w-24 h-1 bg-amber-600 mx-auto"></div>
                </div>
                
                <div id="featured-menu" class="grid md:grid-cols-3 gap-8">
                    <!-- JavaScript で動的に読み込まれます -->
                </div>
                
                <div class="text-center mt-12">
                    <a href="/menu" class="inline-block bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-8 rounded-lg transition">
                        全メニューを見る
                    </a>
                </div>
            </div>
        </section>

        <!-- アクセス情報 -->
        <section class="py-20 bg-white">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center mb-16">
                    <h2 class="text-4xl font-bold text-gray-800 mb-4">店舗情報</h2>
                    <div class="w-24 h-1 bg-amber-600 mx-auto"></div>
                </div>
                
                <div class="grid md:grid-cols-2 gap-12">
                    <div id="store-info">
                        <!-- JavaScript で動的に読み込まれます -->
                    </div>
                    
                    <div>
                        <iframe 
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2906.7741!2d143.2042831!3d42.9228212!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x5f72d1d1d1d1d1d1%3A0x1d1d1d1d1d1d1d1d!2z5YyX5rW36YGT5biv5biv5biC6KW_5LiA5p2h5Y2X77yY5LiB55uu77yS77yQ4oiS77yV!5e0!3m2!1sja!2sjp!4v1234567890123!5m2!1sja!2sjp"
                            width="100%" 
                            height="400" 
                            style="border:0;" 
                            allowfullscreen="" 
                            loading="lazy">
                        </iframe>
                    </div>
                </div>
            </div>
        </section>

        <!-- フッター -->
        <footer class="bg-luxury text-white py-12">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center">
                    <h3 class="text-2xl font-bold mb-4">TOKACHI YAKINIKU KARIN</h3>
                    <p class="text-gray-300 mb-2">トカチ ヤキニク カリン</p>
                    <p class="text-gray-400 mb-4">北海道帯広市西一条南8-20-5</p>
                    <p class="text-gray-400 mb-4">TEL: 050-8883-6929</p>
                    <div class="flex justify-center space-x-6 mt-6">
                        <a href="https://www.instagram.com/tokachi_yakiniku_karin" target="_blank" class="text-2xl hover:text-amber-500 transition">
                            <i class="fab fa-instagram"></i>
                        </a>
                    </div>
                    <p class="text-gray-500 mt-8 text-sm">© 2024 TOKACHI YAKINIKU KARIN. All rights reserved.</p>
                </div>
            </div>
        </footer>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
          // 店舗情報の読み込み
          async function loadStoreInfo() {
            try {
              const response = await axios.get('/api/store-info')
              const info = response.data
              
              document.getElementById('store-info').innerHTML = \`
                <div class="space-y-4">
                  <div class="flex items-start">
                    <i class="fas fa-map-marker-alt text-amber-600 text-xl mt-1 mr-4"></i>
                    <div>
                      <h4 class="font-bold text-lg mb-1">住所</h4>
                      <p class="text-gray-600">\${info.address || ''}</p>
                      <p class="text-gray-600 text-sm mt-1">\${info.access || ''}</p>
                    </div>
                  </div>
                  
                  <div class="flex items-start">
                    <i class="fas fa-phone text-amber-600 text-xl mt-1 mr-4"></i>
                    <div>
                      <h4 class="font-bold text-lg mb-1">電話</h4>
                      <p class="text-gray-600">\${info.phone || ''}</p>
                    </div>
                  </div>
                  
                  <div class="flex items-start">
                    <i class="fas fa-clock text-amber-600 text-xl mt-1 mr-4"></i>
                    <div>
                      <h4 class="font-bold text-lg mb-1">営業時間</h4>
                      <p class="text-gray-600 text-sm">\${info.hours_weekday || ''}</p>
                      <p class="text-gray-600 text-sm mt-1">\${info.hours_weekend || ''}</p>
                      <p class="text-gray-600 text-sm mt-1">\${info.hours_tuesday || ''}</p>
                    </div>
                  </div>
                  
                  <div class="flex items-start">
                    <i class="fas fa-yen-sign text-amber-600 text-xl mt-1 mr-4"></i>
                    <div>
                      <h4 class="font-bold text-lg mb-1">予算</h4>
                      <p class="text-gray-600 text-sm">ディナー: \${info.budget_dinner || ''}</p>
                      <p class="text-gray-600 text-sm">ランチ: \${info.budget_lunch || ''}</p>
                    </div>
                  </div>
                  
                  <div class="flex items-start">
                    <i class="fas fa-chair text-amber-600 text-xl mt-1 mr-4"></i>
                    <div>
                      <h4 class="font-bold text-lg mb-1">座席数</h4>
                      <p class="text-gray-600">\${info.seats || ''}</p>
                    </div>
                  </div>
                  
                  <div class="flex items-start">
                    <i class="fas fa-parking text-amber-600 text-xl mt-1 mr-4"></i>
                    <div>
                      <h4 class="font-bold text-lg mb-1">駐車場</h4>
                      <p class="text-gray-600">\${info.parking || ''}</p>
                    </div>
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
              const response = await axios.get('/api/menu-items')
              const items = response.data.slice(0, 3)
              
              document.getElementById('featured-menu').innerHTML = items.map(item => \`
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
          
          // ページ読み込み時に実行
          document.addEventListener('DOMContentLoaded', () => {
            loadStoreInfo()
            loadFeaturedMenu()
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
          @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;600;700&family=Noto+Sans+JP:wght@300;400;500&display=swap');
          
          body {
            font-family: 'Noto Sans JP', sans-serif;
          }
          
          h1, h2, h3, h4 {
            font-family: 'Noto Serif JP', serif;
          }
          
          .bg-luxury {
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          }
          
          .menu-category {
            border-left: 4px solid #8B4513;
            padding-left: 1.5rem;
          }
        </style>
    </head>
    <body class="bg-gray-50">
        <!-- ナビゲーション -->
        <nav class="bg-luxury text-white shadow-lg">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center h-20">
                    <div class="flex-shrink-0">
                        <a href="/" class="text-2xl font-bold tracking-wider">TOKACHI YAKINIKU KARIN</a>
                        <div class="text-xs text-gray-300 mt-1">トカチ ヤキニク カリン</div>
                    </div>
                    <div class="hidden md:flex space-x-8">
                        <a href="/" class="hover:text-amber-500 transition">ホーム</a>
                        <a href="/menu" class="text-amber-500">メニュー</a>
                        <a href="/gallery" class="hover:text-amber-500 transition">ギャラリー</a>
                        <a href="/access" class="hover:text-amber-500 transition">アクセス</a>
                        <a href="/admin" class="hover:text-amber-500 transition">
                          <i class="fas fa-cog"></i> 管理画面
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <!-- ヘッダー -->
        <div class="bg-gradient-to-r from-amber-800 to-amber-600 text-white py-20">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h1 class="text-5xl font-bold mb-4">Menu</h1>
                <p class="text-xl">十勝産の厳選素材を使用した極上の焼肉</p>
            </div>
        </div>

        <!-- メニューコンテンツ -->
        <section class="py-16">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div id="menu-content">
                    <!-- JavaScript で動的に読み込まれます -->
                </div>
            </div>
        </section>

        <!-- フッター -->
        <footer class="bg-luxury text-white py-12">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center">
                    <h3 class="text-2xl font-bold mb-4">TOKACHI YAKINIKU KARIN</h3>
                    <p class="text-gray-300 mb-2">トカチ ヤキニク カリン</p>
                    <p class="text-gray-400 mb-4">北海道帯広市西一条南8-20-5</p>
                    <p class="text-gray-400 mb-4">TEL: 050-8883-6929</p>
                    <p class="text-gray-500 mt-8 text-sm">© 2024 TOKACHI YAKINIKU KARIN. All rights reserved.</p>
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
              
              const menuByCategory = categories.map(category => ({
                ...category,
                items: items.filter(item => item.category_id === category.id)
              }))
              
              document.getElementById('menu-content').innerHTML = menuByCategory.map(category => \`
                <div class="mb-16">
                  <h2 class="text-3xl font-bold mb-8 menu-category">\${category.name}</h2>
                  <div class="grid md:grid-cols-2 gap-8">
                    \${category.items.map(item => \`
                      <div class="flex bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                        <div class="w-32 h-32 flex-shrink-0 bg-gray-200">
                          <img src="\${item.image_url || 'https://images.unsplash.com/photo-1558030006-450675393462?w=400'}" 
                               alt="\${item.name}" 
                               class="w-full h-full object-cover">
                        </div>
                        <div class="p-4 flex-1">
                          <div class="flex justify-between items-start mb-2">
                            <h3 class="text-xl font-bold">\${item.name}</h3>
                            <span class="text-amber-600 font-bold text-lg whitespace-nowrap ml-4">
                              ¥\${(item.price || 0).toLocaleString()}
                            </span>
                          </div>
                          <p class="text-gray-600 text-sm">\${item.description || ''}</p>
                        </div>
                      </div>
                    \`).join('')}
                  </div>
                </div>
              \`).join('')
            } catch (error) {
              console.error('Failed to load menu:', error)
              document.getElementById('menu-content').innerHTML = \`
                <div class="text-center text-red-600">
                  <p>メニューの読み込みに失敗しました。</p>
                </div>
              \`
            }
          }
          
          document.addEventListener('DOMContentLoaded', loadMenu)
        </script>
    </body>
    </html>
  `)
})

// ギャラリーページ
app.get('/gallery', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ギャラリー | TOKACHI YAKINIKU KARIN</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;600;700&family=Noto+Sans+JP:wght@300;400;500&display=swap');
          
          body {
            font-family: 'Noto Sans JP', sans-serif;
          }
          
          h1, h2, h3, h4 {
            font-family: 'Noto Serif JP', serif;
          }
          
          .bg-luxury {
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          }
          
          .hover-scale {
            transition: transform 0.3s ease;
          }
          
          .hover-scale:hover {
            transform: scale(1.05);
          }
        </style>
    </head>
    <body class="bg-gray-50">
        <!-- ナビゲーション -->
        <nav class="bg-luxury text-white shadow-lg">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center h-20">
                    <div class="flex-shrink-0">
                        <a href="/" class="text-2xl font-bold tracking-wider">TOKACHI YAKINIKU KARIN</a>
                        <div class="text-xs text-gray-300 mt-1">トカチ ヤキニク カリン</div>
                    </div>
                    <div class="hidden md:flex space-x-8">
                        <a href="/" class="hover:text-amber-500 transition">ホーム</a>
                        <a href="/menu" class="hover:text-amber-500 transition">メニュー</a>
                        <a href="/gallery" class="text-amber-500">ギャラリー</a>
                        <a href="/access" class="hover:text-amber-500 transition">アクセス</a>
                        <a href="/admin" class="hover:text-amber-500 transition">
                          <i class="fas fa-cog"></i> 管理画面
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <!-- ヘッダー -->
        <div class="bg-gradient-to-r from-amber-800 to-amber-600 text-white py-20">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h1 class="text-5xl font-bold mb-4">Gallery</h1>
                <p class="text-xl">当店の雰囲気とお料理</p>
            </div>
        </div>

        <!-- ギャラリー -->
        <section class="py-16">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div id="gallery-content" class="grid md:grid-cols-3 gap-8">
                    <!-- JavaScript で動的に読み込まれます -->
                </div>
            </div>
        </section>

        <!-- フッター -->
        <footer class="bg-luxury text-white py-12">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center">
                    <h3 class="text-2xl font-bold mb-4">TOKACHI YAKINIKU KARIN</h3>
                    <p class="text-gray-300 mb-2">トカチ ヤキニク カリン</p>
                    <p class="text-gray-400 mb-4">北海道帯広市西一条南8-20-5</p>
                    <p class="text-gray-400 mb-4">TEL: 050-8883-6929</p>
                    <p class="text-gray-500 mt-8 text-sm">© 2024 TOKACHI YAKINIKU KARIN. All rights reserved.</p>
                </div>
            </div>
        </footer>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
          async function loadGallery() {
            try {
              const response = await axios.get('/api/gallery-images')
              const images = response.data
              
              document.getElementById('gallery-content').innerHTML = images.map(image => \`
                <div class="bg-white rounded-lg shadow-lg overflow-hidden hover-scale">
                  <div class="h-64 bg-gray-200">
                    <img src="\${image.image_url}" 
                         alt="\${image.title || ''}" 
                         class="w-full h-full object-cover">
                  </div>
                  <div class="p-4">
                    <h3 class="text-xl font-bold mb-2">\${image.title || ''}</h3>
                    <p class="text-gray-600 text-sm">\${image.description || ''}</p>
                  </div>
                </div>
              \`).join('')
            } catch (error) {
              console.error('Failed to load gallery:', error)
            }
          }
          
          document.addEventListener('DOMContentLoaded', loadGallery)
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
          @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;600;700&family=Noto+Sans+JP:wght@300;400;500&display=swap');
          
          body {
            font-family: 'Noto Sans JP', sans-serif;
          }
          
          h1, h2, h3, h4 {
            font-family: 'Noto Serif JP', serif;
          }
          
          .bg-luxury {
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          }
        </style>
    </head>
    <body class="bg-gray-50">
        <!-- ナビゲーション -->
        <nav class="bg-luxury text-white shadow-lg">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center h-20">
                    <div class="flex-shrink-0">
                        <a href="/" class="text-2xl font-bold tracking-wider">TOKACHI YAKINIKU KARIN</a>
                        <div class="text-xs text-gray-300 mt-1">トカチ ヤキニク カリン</div>
                    </div>
                    <div class="hidden md:flex space-x-8">
                        <a href="/" class="hover:text-amber-500 transition">ホーム</a>
                        <a href="/menu" class="hover:text-amber-500 transition">メニュー</a>
                        <a href="/gallery" class="hover:text-amber-500 transition">ギャラリー</a>
                        <a href="/access" class="text-amber-500">アクセス</a>
                        <a href="/admin" class="hover:text-amber-500 transition">
                          <i class="fas fa-cog"></i> 管理画面
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <!-- ヘッダー -->
        <div class="bg-gradient-to-r from-amber-800 to-amber-600 text-white py-20">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h1 class="text-5xl font-bold mb-4">Access</h1>
                <p class="text-xl">店舗情報・アクセス</p>
            </div>
        </div>

        <!-- アクセス情報 -->
        <section class="py-16">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="grid md:grid-cols-2 gap-12">
                    <div id="store-info" class="bg-white p-8 rounded-lg shadow-lg">
                        <!-- JavaScript で動的に読み込まれます -->
                    </div>
                    
                    <div>
                        <iframe 
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2906.7741!2d143.2042831!3d42.9228212!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x5f72d1d1d1d1d1d1%3A0x1d1d1d1d1d1d1d1d!2z5YyX5rW36YGT5biv5biC6KW_5LiA5p2h5Y2X77yY5LiB55uu77yS77yQ4oiS77yV!5e0!3m2!1sja!2sjp!4v1234567890123!5m2!1sja!2sjp"
                            width="100%" 
                            height="500" 
                            style="border:0;" 
                            allowfullscreen="" 
                            loading="lazy"
                            class="rounded-lg shadow-lg">
                        </iframe>
                    </div>
                </div>
            </div>
        </section>

        <!-- フッター -->
        <footer class="bg-luxury text-white py-12">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center">
                    <h3 class="text-2xl font-bold mb-4">TOKACHI YAKINIKU KARIN</h3>
                    <p class="text-gray-300 mb-2">トカチ ヤキニク カリン</p>
                    <p class="text-gray-400 mb-4">北海道帯広市西一条南8-20-5</p>
                    <p class="text-gray-400 mb-4">TEL: 050-8883-6929</p>
                    <p class="text-gray-500 mt-8 text-sm">© 2024 TOKACHI YAKINIKU KARIN. All rights reserved.</p>
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
                <div class="space-y-6">
                  <div>
                    <h2 class="text-3xl font-bold mb-6 border-b-2 border-amber-600 pb-2">店舗情報</h2>
                  </div>
                  
                  <div class="flex items-start">
                    <i class="fas fa-store text-amber-600 text-2xl mt-1 mr-4 w-8"></i>
                    <div>
                      <h4 class="font-bold text-lg mb-1">店名</h4>
                      <p class="text-gray-700">\${info.store_name || ''}</p>
                      <p class="text-gray-600 text-sm">\${info.store_name_ja || ''}</p>
                    </div>
                  </div>
                  
                  <div class="flex items-start">
                    <i class="fas fa-map-marker-alt text-amber-600 text-2xl mt-1 mr-4 w-8"></i>
                    <div>
                      <h4 class="font-bold text-lg mb-1">住所</h4>
                      <p class="text-gray-700">\${info.address || ''}</p>
                      <p class="text-gray-600 text-sm mt-1">\${info.access || ''}</p>
                    </div>
                  </div>
                  
                  <div class="flex items-start">
                    <i class="fas fa-phone text-amber-600 text-2xl mt-1 mr-4 w-8"></i>
                    <div>
                      <h4 class="font-bold text-lg mb-1">電話</h4>
                      <p class="text-gray-700">\${info.phone || ''}</p>
                    </div>
                  </div>
                  
                  <div class="flex items-start">
                    <i class="fas fa-clock text-amber-600 text-2xl mt-1 mr-4 w-8"></i>
                    <div>
                      <h4 class="font-bold text-lg mb-2">営業時間</h4>
                      <div class="space-y-1 text-sm">
                        <p class="text-gray-700">\${info.hours_weekday || ''}</p>
                        <p class="text-gray-700">\${info.hours_weekend || ''}</p>
                        <p class="text-gray-700">\${info.hours_tuesday || ''}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div class="flex items-start">
                    <i class="fas fa-yen-sign text-amber-600 text-2xl mt-1 mr-4 w-8"></i>
                    <div>
                      <h4 class="font-bold text-lg mb-1">予算</h4>
                      <p class="text-gray-700 text-sm">ディナー: \${info.budget_dinner || ''}</p>
                      <p class="text-gray-700 text-sm">ランチ: \${info.budget_lunch || ''}</p>
                    </div>
                  </div>
                  
                  <div class="flex items-start">
                    <i class="fas fa-chair text-amber-600 text-2xl mt-1 mr-4 w-8"></i>
                    <div>
                      <h4 class="font-bold text-lg mb-1">座席数</h4>
                      <p class="text-gray-700">\${info.seats || ''}</p>
                    </div>
                  </div>
                  
                  <div class="flex items-start">
                    <i class="fas fa-parking text-amber-600 text-2xl mt-1 mr-4 w-8"></i>
                    <div>
                      <h4 class="font-bold text-lg mb-1">駐車場</h4>
                      <p class="text-gray-700">\${info.parking || ''}</p>
                    </div>
                  </div>
                  
                  <div class="flex items-start">
                    <i class="fab fa-instagram text-amber-600 text-2xl mt-1 mr-4 w-8"></i>
                    <div>
                      <h4 class="font-bold text-lg mb-1">Instagram</h4>
                      <a href="\${info.instagram || ''}" target="_blank" class="text-amber-600 hover:text-amber-700 text-sm">
                        @tokachi_yakiniku_karin
                      </a>
                    </div>
                  </div>
                </div>
              \`
            } catch (error) {
              console.error('Failed to load store info:', error)
            }
          }
          
          document.addEventListener('DOMContentLoaded', loadStoreInfo)
        </script>
    </body>
    </html>
  `)
})

// 管理画面
app.get('/admin', (c) => {
  return c.redirect('/static/admin.html')
})

export default app
