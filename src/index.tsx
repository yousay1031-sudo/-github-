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
            background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.6)), url('https://images.unsplash.com/photo-1544025162-d76694265947?w=1920&q=80');
            background-size: cover;
            background-position: center;
            background-attachment: fixed;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .hero-title {
            writing-mode: vertical-rl;
            text-orientation: upright;
            font-size: 3rem;
            letter-spacing: 0.3em;
            color: white;
            text-shadow: 0 0 30px rgba(0,0,0,0.8);
            animation: fadeInUp 1.5s ease-out;
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
            font-size: 0.9rem;
            color: #999;
            margin-bottom: 4rem;
            letter-spacing: 0.15em;
          }
          
          .card-link {
            display: block;
            position: relative;
            overflow: hidden;
            border-radius: 0;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            background: #1a1a1a;
          }
          
          .card-link:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.6);
          }
          
          .card-link:hover .card-image {
            transform: scale(1.1);
          }
          
          .card-image {
            width: 100%;
            height: 400px;
            object-fit: cover;
            transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .card-content {
            padding: 2.5rem 2rem;
            background: #1a1a1a;
          }
          
          .card-title {
            font-size: 1.5rem;
            margin-bottom: 1rem;
            font-weight: 400;
            letter-spacing: 0.1em;
          }
          
          .card-text {
            color: #aaa;
            font-size: 0.95rem;
            line-height: 1.9;
            margin-bottom: 1.5rem;
          }
          
          .card-arrow {
            display: inline-flex;
            align-items: center;
            color: #d4af37;
            font-size: 0.9rem;
            letter-spacing: 0.1em;
            transition: gap 0.3s ease;
            gap: 0.5rem;
          }
          
          .card-link:hover .card-arrow {
            gap: 1rem;
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
            background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
            border-left: 3px solid #d4af37;
            padding: 3rem;
            margin: 4rem 0;
          }
          
          .divider {
            width: 60px;
            height: 1px;
            background: #d4af37;
            margin: 2rem auto;
          }
        </style>
    </head>
    <body class="bg-dark">
        <!-- ナビゲーション -->
        <nav class="fixed w-full top-0 z-50 text-white shadow-2xl">
            <div class="max-w-7xl mx-auto px-6 lg:px-8">
                <div class="flex justify-between items-center h-24">
                    <div class="flex-shrink-0">
                        <a href="/" class="block">
                          <div class="text-xl tracking-widest font-light">TOKACHI YAKINIKU KARIN</div>
                          <div class="text-xs text-gray-400 mt-1 tracking-wider">トカチ ヤキニク カリン</div>
                        </a>
                    </div>
                    <div class="hidden md:flex space-x-10">
                        <a href="/" class="nav-link text-white hover:text-yellow-500">ホーム</a>
                        <a href="/commitment" class="nav-link text-white hover:text-yellow-500">こだわり</a>
                        <a href="/menu" class="nav-link text-white hover:text-yellow-500">メニュー</a>
                        <a href="/gallery" class="nav-link text-white hover:text-yellow-500">ギャラリー</a>
                        <a href="/access" class="nav-link text-white hover:text-yellow-500">アクセス</a>
                        <a href="/admin" class="nav-link text-yellow-600 hover:text-yellow-500">
                          <i class="fas fa-cog text-sm"></i> 管理
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <!-- ヒーローセクション -->
        <div class="hero-section">
            <div class="flex flex-col md:flex-row items-center justify-center gap-16 px-4">
                <h1 class="hero-title text-white">十勝焼肉かりん</h1>
                <div class="text-white text-center md:text-left" style="animation: fadeInUp 1.8s ease-out">
                    <p class="text-sm tracking-widest mb-4 text-gray-300">TOKACHI YAKINIKU</p>
                    <p class="text-6xl font-light tracking-wider mb-6" style="font-family: 'Noto Serif JP'">KARIN</p>
                    <div class="divider mx-0"></div>
                    <p class="text-sm tracking-wide text-gray-300 leading-relaxed">
                      十勝産の厳選素材で<br>
                      味わう極上の焼肉体験
                    </p>
                </div>
            </div>
        </div>

        <!-- こだわりセクション -->
        <section class="py-24 bg-dark-alt">
            <div class="max-w-6xl mx-auto px-6 lg:px-8">
                <div class="mb-20">
                    <h2 class="section-title text-white">KARINのこだわり</h2>
                    <div class="divider"></div>
                    <p class="section-subtitle">
                      お肉を最もおいしい状態で食してほしい一心から生まれた<br>
                      厳選素材と上質な空間でお迎えいたします
                    </p>
                </div>
                
                <div class="grid md:grid-cols-3 gap-12">
                    <a href="/commitment" class="card-link">
                        <img src="https://images.unsplash.com/photo-1558030006-450675393462?w=800&q=80" 
                             alt="十勝若牛" 
                             class="card-image">
                        <div class="card-content">
                            <h3 class="card-title text-white">十勝若牛</h3>
                            <p class="card-text">
                              十勝清水町産の希少な「十勝若牛®」。柔らかな食感と赤身の深い旨み、ヘルシーさを兼ね備えた逸品です。
                            </p>
                            <span class="card-arrow">
                              詳しく見る <i class="fas fa-arrow-right text-xs"></i>
                            </span>
                        </div>
                    </a>
                    
                    <a href="/commitment" class="card-link">
                        <img src="https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&q=80" 
                             alt="希少なアイスランドラム" 
                             class="card-image">
                        <div class="card-content">
                            <h3 class="card-title text-white">希少なアイスランドラム</h3>
                            <p class="card-text">
                              日本輸入量わずか1%の希少なアイスランド産ラム。1100年の純血が生み出す、繊細な肉質と甘い脂が特徴です。
                            </p>
                            <span class="card-arrow">
                              詳しく見る <i class="fas fa-arrow-right text-xs"></i>
                            </span>
                        </div>
                    </a>
                    
                    <a href="/commitment" class="card-link">
                        <img src="/static/private-room.jpg" 
                             alt="個室空間" 
                             class="card-image">
                        <div class="card-content">
                            <h3 class="card-title text-white">上質な個室空間</h3>
                            <p class="card-text">
                              2名様から26名様までご利用可能。接待やご宴会、特別な日のお食事に最適な空間をご用意しております。
                            </p>
                            <span class="card-arrow">
                              詳しく見る <i class="fas fa-arrow-right text-xs"></i>
                            </span>
                        </div>
                    </a>
                </div>
            </div>
        </section>

        <!-- Messageセクション -->
        <section class="py-24 bg-dark">
            <div class="max-w-4xl mx-auto px-6 lg:px-8">
                <div class="message-box">
                    <h3 class="text-2xl font-light tracking-widest mb-6 text-white" style="font-family: 'Noto Serif JP'">Message</h3>
                    <div class="divider mx-0"></div>
                    <p class="text-gray-300 leading-loose text-sm tracking-wide">
                      TOKACHI YAKINIKU KARINでは、十勝産を中心とした厳選素材を使用しております。<br><br>
                      お肉を最もおいしい状態で食してほしい一心から、一つ一つ丁寧に仕込みを行い、<br>
                      炭火で焼き上げることで素材本来の旨みを最大限に引き出しています。<br><br>
                      また空間にもこだわり、落ち着いた雰囲気の中、ご家族はもちろん<br>
                      デートや接待、ご宴会などあらゆるシーンでゆっくりとしたひとときをお過ごしいただけます。
                    </p>
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
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2906.7741!2d143.2042831!3d42.9228212!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x5f72d1d1d1d1d1d1%3A0x1d1d1d1d1d1d1d1d!2z5YyX5rW36YGT5biv5biC6KW_5LiA5p2h5Y2X77yY5LiB55uu77yS77yQ4oiS77yV!5e0!3m2!1sja!2sjp!4v1234567890123!5m2!1sja!2sjp"
                            width="100%" 
                            height="100%" 
                            style="border:0; filter: grayscale(30%) contrast(90%);" 
                            allowfullscreen="" 
                            loading="lazy">
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
          
          .category-header {
            position: relative;
            margin-bottom: 4rem;
            overflow: hidden;
          }
          
          .category-image {
            width: 100%;
            height: 400px;
            object-fit: cover;
            filter: brightness(0.6) contrast(1.1);
          }
          
          .category-title-overlay {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            width: 100%;
            z-index: 10;
          }
          
          .category-title {
            font-size: 3rem;
            font-weight: 300;
            letter-spacing: 0.2em;
            color: white;
            text-shadow: 0 2px 20px rgba(0,0,0,0.8);
            margin-bottom: 0.5rem;
          }
          
          .category-subtitle {
            font-size: 0.9rem;
            color: #d4af37;
            letter-spacing: 0.15em;
            text-shadow: 0 1px 10px rgba(0,0,0,0.8);
          }
          
          .menu-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1.5rem 3rem;
            margin-bottom: 5rem;
          }
          
          @media (max-width: 768px) {
            .menu-grid {
              grid-template-columns: 1fr;
            }
          }
          
          .menu-item {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 1.5rem 0;
            border-bottom: 1px solid #2a2a2a;
            transition: all 0.3s ease;
          }
          
          .menu-item:hover {
            border-bottom-color: #d4af37;
            padding-left: 0.5rem;
          }
          
          .menu-item-content {
            flex: 1;
            padding-right: 1.5rem;
          }
          
          .menu-item-name {
            font-size: 1rem;
            font-weight: 400;
            color: #e0e0e0;
            margin-bottom: 0.3rem;
            letter-spacing: 0.05em;
          }
          
          .menu-item-description {
            font-size: 0.85rem;
            color: #999;
            line-height: 1.6;
            letter-spacing: 0.02em;
          }
          
          .menu-item-price {
            font-size: 1.1rem;
            font-weight: 300;
            color: #d4af37;
            white-space: nowrap;
            letter-spacing: 0.05em;
          }
        </style>
    </head>
    <body class="bg-dark">
        <!-- ナビゲーション -->
        <nav class="fixed w-full top-0 z-50 text-white shadow-2xl">
            <div class="max-w-7xl mx-auto px-6 lg:px-8">
                <div class="flex justify-between items-center h-24">
                    <div class="flex-shrink-0">
                        <a href="/" class="block">
                          <div class="text-xl tracking-widest font-light">TOKACHI YAKINIKU KARIN</div>
                          <div class="text-xs text-gray-400 mt-1 tracking-wider">トカチ ヤキニク カリン</div>
                        </a>
                    </div>
                    <div class="hidden md:flex space-x-10">
                        <a href="/" class="nav-link text-white hover:text-yellow-500">ホーム</a>
                        <a href="/commitment" class="nav-link text-white hover:text-yellow-500">こだわり</a>
                        <a href="/menu" class="nav-link text-yellow-500">メニュー</a>
                        <a href="/gallery" class="nav-link text-white hover:text-yellow-500">ギャラリー</a>
                        <a href="/access" class="nav-link text-white hover:text-yellow-500">アクセス</a>
                        <a href="/admin" class="nav-link text-yellow-600 hover:text-yellow-500">
                          <i class="fas fa-cog text-sm"></i> 管理
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <!-- ヘッダー -->
        <div class="pt-40 pb-20 bg-dark-alt">
            <div class="max-w-6xl mx-auto px-6 lg:px-8 text-center">
                <h1 class="section-title text-white text-4xl mb-6">Menu</h1>
                <div class="divider"></div>
                <p class="text-gray-400 text-sm tracking-wider">十勝産の厳選素材を使用した極上の焼肉</p>
            </div>
        </div>

        <!-- メニューコンテンツ -->
        <section class="py-20 bg-dark">
            <div class="max-w-6xl mx-auto px-6 lg:px-8">
                <div id="menu-content">
                    <!-- JavaScript で動的に読み込まれます -->
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
                <div class="mb-24">
                  <!-- カテゴリーヘッダー画像 -->
                  <div class="category-header">
                    <img src="\${category.image_url || 'https://images.unsplash.com/photo-1558030006-450675393462?w=1200&q=80'}" 
                         alt="\${category.name}" 
                         class="category-image">
                    <div class="category-title-overlay">
                      <h2 class="category-title">\${category.name}</h2>
                      <p class="category-subtitle">\${category.name.toUpperCase()}</p>
                    </div>
                  </div>
                  
                  <!-- メニューアイテム（2カラムグリッド） -->
                  <div class="menu-grid">
                    \${category.items.map(item => \`
                      <div class="menu-item">
                        <div class="menu-item-content">
                          <div class="menu-item-name">\${item.name}</div>
                          <div class="menu-item-description">\${item.description || ''}</div>
                        </div>
                        <div class="menu-item-price">¥\${(item.price || 0).toLocaleString()}</div>
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
          
          .gallery-item {
            position: relative;
            overflow: hidden;
            background: #1a1a1a;
            transition: all 0.4s ease;
          }
          
          .gallery-item:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.6);
          }
          
          .gallery-item:hover img {
            transform: scale(1.1);
          }
          
          .gallery-item img {
            transition: transform 0.6s ease;
          }
        </style>
    </head>
    <body class="bg-dark">
        <!-- ナビゲーション -->
        <nav class="fixed w-full top-0 z-50 text-white shadow-2xl">
            <div class="max-w-7xl mx-auto px-6 lg:px-8">
                <div class="flex justify-between items-center h-24">
                    <div class="flex-shrink-0">
                        <a href="/" class="block">
                          <div class="text-xl tracking-widest font-light">TOKACHI YAKINIKU KARIN</div>
                          <div class="text-xs text-gray-400 mt-1 tracking-wider">トカチ ヤキニク カリン</div>
                        </a>
                    </div>
                    <div class="hidden md:flex space-x-10">
                        <a href="/" class="nav-link text-white hover:text-yellow-500">ホーム</a>
                        <a href="/commitment" class="nav-link text-white hover:text-yellow-500">こだわり</a>
                        <a href="/menu" class="nav-link text-white hover:text-yellow-500">メニュー</a>
                        <a href="/gallery" class="nav-link text-yellow-500">ギャラリー</a>
                        <a href="/access" class="nav-link text-white hover:text-yellow-500">アクセス</a>
                        <a href="/admin" class="nav-link text-yellow-600 hover:text-yellow-500">
                          <i class="fas fa-cog text-sm"></i> 管理
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <!-- ヘッダー -->
        <div class="pt-40 pb-20 bg-dark-alt">
            <div class="max-w-6xl mx-auto px-6 lg:px-8 text-center">
                <h1 class="section-title text-white text-4xl mb-6">Gallery</h1>
                <div class="divider"></div>
                <p class="text-gray-400 text-sm tracking-wider">当店の雰囲気とお料理</p>
            </div>
        </div>

        <!-- ギャラリー -->
        <section class="py-20 bg-dark">
            <div class="max-w-6xl mx-auto px-6 lg:px-8">
                <div id="gallery-content" class="grid md:grid-cols-3 gap-8">
                    <!-- JavaScript で動的に読み込まれます -->
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
          async function loadGallery() {
            try {
              const response = await axios.get('/api/gallery-images')
              const images = response.data
              
              document.getElementById('gallery-content').innerHTML = images.map(image => \`
                <div class="gallery-item">
                  <div class="h-80 overflow-hidden">
                    <img src="\${image.image_url}" 
                         alt="\${image.title || ''}" 
                         class="w-full h-full object-cover"
                         style="filter: brightness(0.9) contrast(1.1);">
                  </div>
                  <div class="p-6">
                    <h3 class="text-lg font-light tracking-wide text-white mb-2">\${image.title || ''}</h3>
                    <p class="text-gray-400 text-sm leading-relaxed">\${image.description || ''}</p>
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
        </style>
    </head>
    <body class="bg-dark">
        <!-- ナビゲーション -->
        <nav class="fixed w-full top-0 z-50 text-white shadow-2xl">
            <div class="max-w-7xl mx-auto px-6 lg:px-8">
                <div class="flex justify-between items-center h-24">
                    <div class="flex-shrink-0">
                        <a href="/" class="block">
                          <div class="text-xl tracking-widest font-light">TOKACHI YAKINIKU KARIN</div>
                          <div class="text-xs text-gray-400 mt-1 tracking-wider">トカチ ヤキニク カリン</div>
                        </a>
                    </div>
                    <div class="hidden md:flex space-x-10">
                        <a href="/" class="nav-link text-white hover:text-yellow-500">ホーム</a>
                        <a href="/commitment" class="nav-link text-white hover:text-yellow-500">こだわり</a>
                        <a href="/menu" class="nav-link text-white hover:text-yellow-500">メニュー</a>
                        <a href="/gallery" class="nav-link text-white hover:text-yellow-500">ギャラリー</a>
                        <a href="/access" class="nav-link text-yellow-500">アクセス</a>
                        <a href="/admin" class="nav-link text-yellow-600 hover:text-yellow-500">
                          <i class="fas fa-cog text-sm"></i> 管理
                        </a>
                    </div>
                </div>
            </div>
        </nav>

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
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2906.7741!2d143.2042831!3d42.9228212!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x5f72d1d1d1d1d1d1%3A0x1d1d1d1d1d1d1d1d!2z5YyX5rW36YGT5biv5biC6KW_5LiA5p2h5Y2X77yY5LiB55uu77yS77yQ4oiS77yV!5e0!3m2!1sja!2sjp!4v1234567890123!5m2!1sja!2sjp"
                            width="100%" 
                            height="100%" 
                            style="border:0; filter: grayscale(30%) contrast(90%);" 
                            allowfullscreen="" 
                            loading="lazy">
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
    </head>
    <body class="bg-dark">
        <!-- ナビゲーション -->
        <nav class="fixed w-full top-0 z-50 text-white shadow-2xl">
            <div class="max-w-7xl mx-auto px-6 lg:px-8">
                <div class="flex justify-between items-center h-24">
                    <div class="flex-shrink-0">
                        <a href="/" class="block">
                          <div class="text-xl tracking-widest font-light">TOKACHI YAKINIKU KARIN</div>
                          <div class="text-xs text-gray-400 mt-1 tracking-wider">トカチ ヤキニク カリン</div>
                        </a>
                    </div>
                    <div class="hidden md:flex space-x-10">
                        <a href="/" class="nav-link text-white hover:text-yellow-500">ホーム</a>
                        <a href="/commitment" class="nav-link text-yellow-500">こだわり</a>
                        <a href="/menu" class="nav-link text-white hover:text-yellow-500">メニュー</a>
                        <a href="/gallery" class="nav-link text-white hover:text-yellow-500">ギャラリー</a>
                        <a href="/access" class="nav-link text-white hover:text-yellow-500">アクセス</a>
                        <a href="/admin" class="nav-link text-yellow-600 hover:text-yellow-500">
                          <i class="fas fa-cog text-sm"></i> 管理
                        </a>
                    </div>
                </div>
            </div>
        </nav>

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
                        <img src="https://images.unsplash.com/photo-1558030006-450675393462?w=1200&q=80" 
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
                        <img src="https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=1200&q=80" 
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
                        <img src="/static/private-room.jpg" 
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
    </body>
    </html>
  `)
})

// 管理画面
app.get('/admin', (c) => {
  return c.redirect('/static/admin.html')
})

export default app
