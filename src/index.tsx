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
            background: linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.55)), url('https://images.unsplash.com/photo-1544025162-d76694265947?w=1920&q=80');
            background-size: cover;
            background-position: center;
            background-attachment: fixed;
            min-height: 95vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding-top: 6rem;
          }
          
          .hero-title {
            writing-mode: vertical-rl;
            text-orientation: upright;
            font-size: 2.8rem;
            letter-spacing: 0.4em;
            color: white;
            text-shadow: 0 4px 20px rgba(0,0,0,0.7);
            animation: fadeInUp 1.5s ease-out;
            font-family: 'Noto Serif JP', serif;
            font-weight: 300;
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
                        <a href="/drink" class="nav-link text-white hover:text-yellow-500">ドリンク</a>
                        <a href="/course" class="nav-link text-white hover:text-yellow-500">コース</a>
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
                <div class="mb-16">
                    <h2 class="section-title text-white">KARINのこだわり</h2>
                    <div class="divider"></div>
                    <p class="section-subtitle">
                      お肉を最もおいしい状態で食してほしい一心から生まれたKARINの名物メニュー。<br>
                      「厳選素材」とくに数量限定の十勝若牛は当店の看板メニュー。<br>
                      産地直送ならではの特別な味わいは驚くほど繊細。
                    </p>
                </div>
                
                <div class="grid md:grid-cols-2 gap-12">
                    <a href="/course" class="card-link">
                        <img src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80" 
                             alt="コース" 
                             class="card-image">
                        <div class="card-content">
                            <h3 class="card-title text-white">コース</h3>
                            <p class="card-text">
                              各コースだけでなく、ご予算に合わせてお造りいたします。サプライズもお任せ。
                            </p>
                            <span class="card-arrow">
                              → 詳しく見る
                            </span>
                        </div>
                    </a>
                    
                    <a href="/menu" class="card-link">
                        <img src="https://images.unsplash.com/photo-1558030006-450675393462?w=800&q=80" 
                             alt="メニュー" 
                             class="card-image">
                        <div class="card-content">
                            <h3 class="card-title text-white">メニュー</h3>
                            <p class="card-text">
                              お肉だけではなく、お料理各種をご用意いたしました。お飲み物も豊富にございます。
                            </p>
                            <span class="card-arrow">
                              → 詳しく見る
                            </span>
                        </div>
                    </a>
                    
                    <a href="/commitment" class="card-link">
                        <img src="https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&q=80" 
                             alt="厳選素材" 
                             class="card-image">
                        <div class="card-content">
                            <h3 class="card-title text-white">厳選素材</h3>
                            <p class="card-text">
                              十勝若牛や希少なアイスランドラムなど、こだわりの食材を使用しております。
                            </p>
                            <span class="card-arrow">
                              → 詳しく見る
                            </span>
                        </div>
                    </a>
                    
                    <a href="/commitment" class="card-link">
                        <img src="/static/private-room.jpg" 
                             alt="上質な個室空間" 
                             class="card-image">
                        <div class="card-content">
                            <h3 class="card-title text-white">上質な個室空間</h3>
                            <p class="card-text">
                              ご家族はもちろんデートや接待、ご宴会などあらゆるシーンでゆっくりとしたひとときを。
                            </p>
                            <span class="card-arrow">
                              → 詳しく見る
                            </span>
                        </div>
                    </a>
                </div>
            </div>
        </section>

        <!-- 店名の由来セクション -->
        <section class="py-24 bg-dark">
            <div class="max-w-4xl mx-auto px-6 lg:px-8">
                <div class="message-box">
                    <h3 class="text-xl font-light tracking-widest mb-6 text-white" style="font-family: 'Noto Serif JP'">焼肉KARINの名前の由来</h3>
                    <div class="divider mx-0"></div>
                    <p class="text-gray-300 leading-loose text-sm tracking-wide">
                      「華麗（かりん）」という言葉には、美しく華やかという意味が込められています。<br><br>
                      お肉の味はもちろん、見た目に美味しい料理でお客様が日々楽しんでいただけるよう<br>
                      日々精進しております。
                    </p>
                </div>
            </div>
        </section>

        <!-- Messageセクション -->
        <section class="py-24 bg-dark-alt">
            <div class="max-w-6xl mx-auto px-6 lg:px-8">
                <div class="grid md:grid-cols-2 gap-16 items-center">
                    <div>
                        <img src="https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80" 
                             alt="TOKACHI YAKINIKU KARIN" 
                             class="w-full h-96 object-cover"
                             style="filter: brightness(0.8) contrast(1.1);">
                    </div>
                    <div>
                        <h3 class="text-2xl font-light tracking-widest mb-6 text-white" style="font-family: 'Noto Serif JP'">Message</h3>
                        <div class="divider mx-0"></div>
                        <p class="text-gray-300 leading-loose text-sm tracking-wide">
                          TOKACHI YAKINIKU KARINは十勝産を中心とした厳選素材をご提供する焼肉店です。<br><br>
                          老舗ならではの目利きと独自ルートで厳選された焼肉がいただけます。<br><br>
                          また空間にもこだわり、落ち着いた雰囲気の個室などご家族はもちろんデートや接待、<br>
                          ご宴会などあらゆるシーンでゆっくりとしたひとときを。
                        </p>
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
                        <a href="/drink" class="nav-link text-white hover:text-yellow-500">ドリンク</a>
                        <a href="/course" class="nav-link text-white hover:text-yellow-500">コース</a>
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

// アクセスページ
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
                        <a href="/drink" class="nav-link text-white hover:text-yellow-500">ドリンク</a>
                        <a href="/course" class="nav-link text-white hover:text-yellow-500">コース</a>
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
                        <a href="/drink" class="nav-link text-white hover:text-yellow-500">ドリンク</a>
                        <a href="/course" class="nav-link text-white hover:text-yellow-500">コース</a>
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

// ドリンクページ
app.get('/drink', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ドリンク | TOKACHI YAKINIKU KARIN</title>
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
          
          .drink-category {
            margin-bottom: 4rem;
          }
          
          .category-header {
            background-size: cover;
            background-position: center;
            height: 400px;
            position: relative;
            margin-bottom: 3rem;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .category-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
          }
          
          .category-header h2 {
            position: relative;
            z-index: 1;
            color: white;
            font-size: 2.5rem;
            font-weight: 300;
            letter-spacing: 0.2em;
            text-align: center;
          }
          
          .category-header .subtitle {
            font-size: 1rem;
            margin-top: 0.5rem;
            opacity: 0.8;
          }
          
          .drink-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 2rem;
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 2rem;
          }
          
          @media (max-width: 768px) {
            .drink-grid {
              grid-template-columns: 1fr;
            }
          }
          
          .drink-item {
            border-bottom: 1px solid rgba(212, 175, 55, 0.2);
            padding-bottom: 1.5rem;
          }
          
          .drink-name {
            font-size: 1rem;
            color: #e0e0e0;
            margin-bottom: 0.5rem;
            font-weight: 400;
          }
          
          .drink-name-en {
            font-size: 0.85rem;
            color: #888;
            margin-bottom: 0.5rem;
          }
          
          .drink-price {
            color: #d4af37;
            font-weight: 500;
            font-size: 1.1rem;
          }
          
          .subcategory-title {
            font-size: 1.5rem;
            color: #d4af37;
            margin-bottom: 2rem;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid rgba(212, 175, 55, 0.3);
            font-weight: 300;
            letter-spacing: 0.15em;
          }
          
          .note-text {
            color: #888;
            font-size: 0.9rem;
            margin-top: 2rem;
            padding: 1rem;
            background: rgba(212, 175, 55, 0.05);
            border-left: 2px solid #d4af37;
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
                        <a href="/drink" class="nav-link text-yellow-500">ドリンク</a>
                        <a href="/course" class="nav-link text-white hover:text-yellow-500">コース</a>
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
                <h1 class="section-title text-white text-4xl mb-6">Drink</h1>
                <div class="divider"></div>
                <p class="text-gray-400 text-sm tracking-wider">ドリンクメニュー</p>
            </div>
        </div>

        <!-- ドリンクメニュー -->
        <div class="py-16">
            <!-- おすすめ -->
            <div class="drink-category">
                <div class="category-header" style="background-image: url('https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1200');">
                    <div>
                        <h2>おすすめ</h2>
                        <div class="subtitle">RECOMMENDED</div>
                    </div>
                </div>
                <h3 class="subcategory-title text-center">美炙樂おすすめ</h3>
                <div class="drink-grid">
                    <div class="drink-item">
                        <div class="drink-name">琉球の酒 ハブ源酒（1杯）</div>
                        <div class="drink-name-en">Habu gensyu (glass)</div>
                        <div class="drink-price">550円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">獺祭 磨き三割九部（グラス）</div>
                        <div class="drink-name-en">Dassai migaki 39% (glass)</div>
                        <div class="drink-price">1,100円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">獺祭 磨き50%（グラス）</div>
                        <div class="drink-name-en">Dassai migaki 50% (glass)</div>
                        <div class="drink-price">880円</div>
                    </div>
                </div>
                <div class="note-text max-w-1200px mx-auto">
                    ※その他、各地の地酒、月替りのおすすめの地酒もございます。詳しくは店内メニューをご覧ください。
                </div>
            </div>

            <!-- ビール・ウイスキー -->
            <div class="drink-category">
                <div class="category-header" style="background-image: url('https://images.unsplash.com/photo-1608270586620-248524c67de9?w=1200');">
                    <div>
                        <h2>ビール・ウイスキー</h2>
                        <div class="subtitle">BEER & WHISKY</div>
                    </div>
                </div>
                
                <h3 class="subcategory-title text-center">ビール</h3>
                <div class="drink-grid">
                    <div class="drink-item">
                        <div class="drink-name">アサヒスーパードライ（中ジョッキ）</div>
                        <div class="drink-name-en">Asahi draft beer</div>
                        <div class="drink-price">693円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">アサヒスーパードライ（グラス）</div>
                        <div class="drink-name-en">Asahi draft beer glass</div>
                        <div class="drink-price">572円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">キリンクラシックラガー（中瓶）</div>
                        <div class="drink-name-en">Kirin bottled beer</div>
                        <div class="drink-price">715円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">アサヒスーパードライ（中瓶）</div>
                        <div class="drink-name-en">Asahi bottled beer</div>
                        <div class="drink-price">715円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">アサヒドライゼロ（Alc0.00％）（小瓶）</div>
                        <div class="drink-name-en">Non-alcohol beer</div>
                        <div class="drink-price">550円</div>
                    </div>
                </div>

                <h3 class="subcategory-title text-center mt-16">ウイスキー</h3>
                <div class="drink-grid">
                    <div class="drink-item">
                        <div class="drink-name">知多（グラス）</div>
                        <div class="drink-name-en">Chita glass</div>
                        <div class="drink-price">858円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">知多（700mlボトル）</div>
                        <div class="drink-name-en">Chita 700ml bottle</div>
                        <div class="drink-price">9,680円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">余市（グラス）</div>
                        <div class="drink-name-en">Yoichi glass</div>
                        <div class="drink-price">858円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">余市（700mlボトル）</div>
                        <div class="drink-name-en">Yoichi 700ml bottle</div>
                        <div class="drink-price">9,680円</div>
                    </div>
                </div>

                <h3 class="subcategory-title text-center mt-16">ハイボール</h3>
                <div class="drink-grid">
                    <div class="drink-item">
                        <div class="drink-name">余市スタイリッシュハイボール</div>
                        <div class="drink-name-en">Yoichi stylish highball</div>
                        <div class="drink-price">638円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">（氷点下）ブラックニッカフリージングハイボール</div>
                        <div class="drink-name-en">Black Nikka highball</div>
                        <div class="drink-price">550円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">余市ハイボール</div>
                        <div class="drink-name-en">Yoichi highball</div>
                        <div class="drink-price">858円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">コーラハイボール</div>
                        <div class="drink-name-en">Coke highball</div>
                        <div class="drink-price">528円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">トニックハイボール</div>
                        <div class="drink-name-en">Tonic highball</div>
                        <div class="drink-price">528円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">ジンジャーハイボール</div>
                        <div class="drink-name-en">Ginger highball</div>
                        <div class="drink-price">528円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">柚子ハイボール</div>
                        <div class="drink-name-en">Yuzu highball</div>
                        <div class="drink-price">528円</div>
                    </div>
                </div>
            </div>

            <!-- 日本酒・焼酎 -->
            <div class="drink-category">
                <div class="category-header" style="background-image: url('https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=1200');">
                    <div>
                        <h2>日本酒・焼酎</h2>
                        <div class="subtitle">JAPANESE SAKE & SHOCHU</div>
                    </div>
                </div>
                
                <h3 class="subcategory-title text-center">焼酎（麦）</h3>
                <div class="drink-grid">
                    <div class="drink-item">
                        <div class="drink-name">百年の孤独（宮崎）（グラス）</div>
                        <div class="drink-name-en">Hyakune-no-kodoku glass</div>
                        <div class="drink-price">1,320円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">耶馬美人（大分）（グラス）</div>
                        <div class="drink-name-en">Yaba-bijin glass</div>
                        <div class="drink-price">858円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">山猿（宮崎）（グラス）</div>
                        <div class="drink-name-en">Yama-zaru glass</div>
                        <div class="drink-price">638円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">白水 度数25°（グラス）</div>
                        <div class="drink-name-en">Haku-sui glass</div>
                        <div class="drink-price">495円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">白水 度数25°（900mlボトル）</div>
                        <div class="drink-name-en">Haku-sui 900ml bottle</div>
                        <div class="drink-price">2,750円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">栗野屋 度数25°（グラス）</div>
                        <div class="drink-name-en">Kuri-no-ya glass</div>
                        <div class="drink-price">495円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">栗野屋 度数25°（720mlボトル）</div>
                        <div class="drink-name-en">Kuri-no-ya 720ml bottle</div>
                        <div class="drink-price">2,750円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">中々 度数25°（グラス）</div>
                        <div class="drink-name-en">Naka-naka glass</div>
                        <div class="drink-price">528円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">中々 度数25°（720mlボトル）</div>
                        <div class="drink-name-en">Naka-naka 720ml bottle</div>
                        <div class="drink-price">3,300円</div>
                    </div>
                </div>

                <h3 class="subcategory-title text-center mt-16">焼酎（芋）</h3>
                <div class="drink-grid">
                    <div class="drink-item">
                        <div class="drink-name">魔王（鹿児島）（グラス）</div>
                        <div class="drink-name-en">Maou glass</div>
                        <div class="drink-price">1,320円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">伊佐美（鹿児島）（グラス）</div>
                        <div class="drink-name-en">Isami glass</div>
                        <div class="drink-price">968円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">佐藤 黒ラベル（鹿児島）（グラス）</div>
                        <div class="drink-name-en">Sato glass</div>
                        <div class="drink-price">968円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">茜 霧島（鹿児島）（グラス）</div>
                        <div class="drink-name-en">Akane-kirisima glass</div>
                        <div class="drink-price">748円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">海（鹿児島）（グラス）</div>
                        <div class="drink-name-en">Umi glass</div>
                        <div class="drink-price">638円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">池の露（熊本）（グラス）</div>
                        <div class="drink-name-en">Ike-no-kiri glass</div>
                        <div class="drink-price">660円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">もぐら（鹿児島）（グラス）</div>
                        <div class="drink-name-en">Mogura glass</div>
                        <div class="drink-price">638円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">㐂六（宮崎）（グラス）</div>
                        <div class="drink-name-en">Kiroku glass</div>
                        <div class="drink-price">572円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">黒霧島 度数25°（グラス）</div>
                        <div class="drink-name-en">Kuro-kirishima glass</div>
                        <div class="drink-price">495円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">黒霧島 度数25°（900mlボトル）</div>
                        <div class="drink-name-en">Kuro-kirishima 900ml bottle</div>
                        <div class="drink-price">2,750円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">千亀女 度数25°（グラス）</div>
                        <div class="drink-name-en">Sen-kame-jo glass</div>
                        <div class="drink-price">528円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">千亀女 度数25°（720mlボトル）</div>
                        <div class="drink-name-en">Sen-kame-jo 720ml bottle</div>
                        <div class="drink-price">3,300円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">山ねこ 度数25°（グラス）</div>
                        <div class="drink-name-en">Yama-neko glass</div>
                        <div class="drink-price">572円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">山ねこ 度数25°（720mlボトル）</div>
                        <div class="drink-name-en">Yama-neko 720ml bottle</div>
                        <div class="drink-price">3,850円</div>
                    </div>
                </div>

                <h3 class="subcategory-title text-center mt-16">焼酎（米・そば・黒糖）</h3>
                <div class="drink-grid">
                    <div class="drink-item">
                        <div class="drink-name">吟球麿 堤 度数25°（グラス）</div>
                        <div class="drink-name-en">Gin-ku-ma glass</div>
                        <div class="drink-price">495円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">吟球麿 堤 度数25°（720mlボトル）</div>
                        <div class="drink-name-en">Gin-ku-ma 720ml bottle</div>
                        <div class="drink-price">2,750円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">金砂郷 度数25°（グラス）</div>
                        <div class="drink-name-en">Kana-sago glass</div>
                        <div class="drink-price">495円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">金砂郷 度数25°（720mlボトル）</div>
                        <div class="drink-name-en">Kana-sago 720ml bottle</div>
                        <div class="drink-price">2,750円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">竜宮（鹿児島）（グラス）</div>
                        <div class="drink-name-en">Ryu-gyu glass</div>
                        <div class="drink-price">858円</div>
                    </div>
                </div>

                <h3 class="subcategory-title text-center mt-16">日本酒</h3>
                <div class="drink-grid">
                    <div class="drink-item">
                        <div class="drink-name">水戸 からくち一品【冷・燗】（辛口）（一合）</div>
                        <div class="drink-name-en">Karakuchi-ippin 180ml</div>
                        <div class="drink-price">550円</div>
                    </div>
                </div>
                <div class="note-text max-w-1200px mx-auto">
                    ※本日のオススメ地酒　店内にて別紙参照してください。全国各地のレア日本酒もあり！
                </div>

                <h3 class="subcategory-title text-center mt-16">果実酒</h3>
                <div class="drink-grid">
                    <div class="drink-item">
                        <div class="drink-name">永昌源 杏露酒</div>
                        <div class="drink-name-en">Anzu wine</div>
                        <div class="drink-price">528円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">茨城 合わせ柚子酒</div>
                        <div class="drink-name-en">Yuzu wine</div>
                        <div class="drink-price">528円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">茨城 水戸梅酒</div>
                        <div class="drink-name-en">Mito plum wine</div>
                        <div class="drink-price">528円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">茨城 百年梅酒</div>
                        <div class="drink-name-en">100years plum wine</div>
                        <div class="drink-price">528円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">栃木 鳳凰美田秘蔵梅酒</div>
                        <div class="drink-name-en">Houou-biden plum wine</div>
                        <div class="drink-price">605円</div>
                    </div>
                </div>
            </div>

            <!-- ワイン・シャンパーニュ -->
            <div class="drink-category">
                <div class="category-header" style="background-image: url('https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200');">
                    <div>
                        <h2>ワイン・シャンパーニュ</h2>
                        <div class="subtitle">WINE & CHAMPAGNE</div>
                    </div>
                </div>
                
                <h3 class="subcategory-title text-center">ワイン</h3>
                <div class="drink-grid">
                    <div class="drink-item">
                        <div class="drink-name">グラスワイン（赤・白）</div>
                        <div class="drink-name-en">Glass wine</div>
                        <div class="drink-price">550円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">ドゥルト・ボワ・ミライユ ルージュ</div>
                        <div class="drink-name-en">Bois mirail rouge</div>
                        <div class="drink-price">2,750円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">ドゥルト・ボワ・ミライユ ブラン</div>
                        <div class="drink-name-en">Bois mirail blanc</div>
                        <div class="drink-price">2,750円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">トラピチェ オークカスク マルベック2012</div>
                        <div class="drink-name-en">Trapiche oak cask malbec2012</div>
                        <div class="drink-price">4,950円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">トラピチェ オークカスク シャルドネ2012</div>
                        <div class="drink-name-en">Trapiche oak cask Chardonnay2012</div>
                        <div class="drink-price">4,950円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">バルターリ キャンティ</div>
                        <div class="drink-name-en">Barutari chianti</div>
                        <div class="drink-price">5,280円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">シャトー・メルシャン 山梨勝沼甲州2013</div>
                        <div class="drink-name-en">Chateau Mercian yamanashi-katsunuma-kousyu2013</div>
                        <div class="drink-price">5,280円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">マルティーニ・アスティ・スプマンテ（ハーフボトル）</div>
                        <div class="drink-name-en">Martini asti spumante half</div>
                        <div class="drink-price">2,079円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">マルティーニ・アスティ・スプマンテ（フルボトル）</div>
                        <div class="drink-name-en">Martini asti spumante bottle</div>
                        <div class="drink-price">3,300円</div>
                    </div>
                </div>

                <h3 class="subcategory-title text-center mt-16">シャンパーニュ</h3>
                <div class="drink-grid">
                    <div class="drink-item">
                        <div class="drink-name">コント・レミィ・ヴァリクール ブリュット【フランス】（フルボトル）</div>
                        <div class="drink-name-en">Comte remy de valicourt brut</div>
                        <div class="drink-price">11,000円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">モエ・エ・シャンドン（白）【フランス】（フルボトル）</div>
                        <div class="drink-name-en">Moët & Chandon</div>
                        <div class="drink-price">16,500円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">ヴーヴ クリコ イエローラベル ブリュット【フランス】（フルボトル）</div>
                        <div class="drink-name-en">Veuve clicquot yellow label brut</div>
                        <div class="drink-price">22,000円</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">ドン・ペリニヨン（白）【フランス】（フルボトル）</div>
                        <div class="drink-name-en">Dom pérignon</div>
                        <div class="drink-price">44,000円</div>
                    </div>
                </div>
            </div>

            <!-- カクテル・サワー -->
            <div class="drink-category">
                <div class="category-header" style="background-image: url('https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1200');">
                    <div>
                        <h2>カクテル・サワー</h2>
                        <div class="subtitle">COCKTAIL & SOUR</div>
                    </div>
                </div>
                
                <h3 class="subcategory-title text-center">カクテル</h3>
                <div class="drink-grid">
                    <div class="drink-item">
                        <div class="drink-name">モスコミュール</div>
                        <div class="drink-name-en">Moscow Mule</div>
                        <div class="drink-price">550円～</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">スクリュードライバー</div>
                        <div class="drink-name-en">Screwdriver</div>
                        <div class="drink-price">550円～</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">ソルティドック</div>
                        <div class="drink-name-en">Salty dog</div>
                        <div class="drink-price">550円～</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">ジントニック</div>
                        <div class="drink-name-en">Gin and tonic</div>
                        <div class="drink-price">550円～</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">ピーチソーダ</div>
                        <div class="drink-name-en">Peach and soda</div>
                        <div class="drink-price">550円～</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">ファジーネーブル</div>
                        <div class="drink-name-en">Fuzzy navel</div>
                        <div class="drink-price">550円～</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">カシスソーダ</div>
                        <div class="drink-name-en">Cassis and soda</div>
                        <div class="drink-price">550円～</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">カシスオレンジ</div>
                        <div class="drink-name-en">Cassis and orange</div>
                        <div class="drink-price">550円～</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">カシスウーロン</div>
                        <div class="drink-name-en">Cassis and oolong tea</div>
                        <div class="drink-price">550円～</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">レゲエパンチ</div>
                        <div class="drink-name-en">Reggae punch</div>
                        <div class="drink-price">550円～</div>
                    </div>
                </div>

                <h3 class="subcategory-title text-center mt-16">サワー</h3>
                <div class="drink-grid">
                    <div class="drink-item">
                        <div class="drink-name">生レモンサワー</div>
                        <div class="drink-name-en">Fresh lemon sour</div>
                        <div class="drink-price">550円～</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">生グレープフルーツサワー</div>
                        <div class="drink-name-en">Fresh grapefruit sour</div>
                        <div class="drink-price">550円～</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">ライムサワー</div>
                        <div class="drink-name-en">Rhyme sour</div>
                        <div class="drink-price">550円～</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">シークヮーサーサワー</div>
                        <div class="drink-name-en">Shikuwasa sour</div>
                        <div class="drink-price">550円～</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">カシスサワー</div>
                        <div class="drink-name-en">Cassis sour</div>
                        <div class="drink-price">550円～</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">レモンサワー</div>
                        <div class="drink-name-en">Lemon sour</div>
                        <div class="drink-price">550円～</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">グレープフルーツサワー</div>
                        <div class="drink-name-en">Grapefruit sour</div>
                        <div class="drink-price">550円～</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">梅サワー</div>
                        <div class="drink-name-en">Ume sour</div>
                        <div class="drink-price">550円～</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">柚子サワー</div>
                        <div class="drink-name-en">Yuzu sour</div>
                        <div class="drink-price">550円～</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">巨峰サワー</div>
                        <div class="drink-name-en">Gigantic peak sour</div>
                        <div class="drink-price">550円～</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">カルピスサワー</div>
                        <div class="drink-name-en">Calpis sour</div>
                        <div class="drink-price">550円～</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">緑茶ハイ</div>
                        <div class="drink-name-en">Japanese tea sour</div>
                        <div class="drink-price">550円～</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">ウーロンハイ</div>
                        <div class="drink-name-en">Oolong tea sour</div>
                        <div class="drink-price">550円～</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">黒ウーロンハイ</div>
                        <div class="drink-name-en">Black oolong tea sour</div>
                        <div class="drink-price">550円～</div>
                    </div>
                </div>

                <h3 class="subcategory-title text-center mt-16">ソフトドリンク</h3>
                <div class="drink-grid">
                    <div class="drink-item">
                        <div class="drink-name">コカ・コーラ</div>
                        <div class="drink-name-en">Coca cola</div>
                        <div class="drink-price">352円～</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">メロンソーダ</div>
                        <div class="drink-name-en">Melon soda</div>
                        <div class="drink-price">352円～</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">ジンジャーエール</div>
                        <div class="drink-name-en">Ginger ale</div>
                        <div class="drink-price">352円～</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">オレンジ100％ジュース</div>
                        <div class="drink-name-en">Orange juice</div>
                        <div class="drink-price">352円～</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">グレープフルーツ100％ジュース</div>
                        <div class="drink-name-en">Grapefruit juice</div>
                        <div class="drink-price">352円～</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">カルピス</div>
                        <div class="drink-name-en">Calpis</div>
                        <div class="drink-price">352円～</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">カルピスソーダ</div>
                        <div class="drink-name-en">Calpis soda</div>
                        <div class="drink-price">352円～</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">アイスウーロン茶</div>
                        <div class="drink-name-en">Oolong tea</div>
                        <div class="drink-price">352円～</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">ホットウーロン茶</div>
                        <div class="drink-name-en">Hot oolong tea</div>
                        <div class="drink-price">352円～</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">アイスコーヒー</div>
                        <div class="drink-name-en">Ice coffee</div>
                        <div class="drink-price">352円～</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">ホットコーヒー</div>
                        <div class="drink-name-en">Hot coffee</div>
                        <div class="drink-price">352円～</div>
                    </div>
                    <div class="drink-item">
                        <div class="drink-name">黒ウーロン茶</div>
                        <div class="drink-name-en">Black oolong tea</div>
                        <div class="drink-price">352円～</div>
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
                        <a href="/drink" class="nav-link text-white hover:text-yellow-500">ドリンク</a>
                        <a href="/course" class="nav-link text-yellow-500">コース</a>
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
                <h1 class="section-title text-white text-4xl mb-6">Course</h1>
                <div class="divider"></div>
                <p class="text-gray-400 text-sm tracking-wider">コースメニュー</p>
            </div>
        </div>

        <!-- コースメニュー -->
        <div class="py-16 max-w-5xl mx-auto px-6 lg:px-8">
            <!-- 匠コース -->
            <div class="course-card">
                <h2 class="course-title">匠コース</h2>
                <p class="course-subtitle">ご宴会向けプラン　3名様〜承ります</p>
                <div class="course-price">お一人様 7,500円（税込）</div>
                
                <div class="course-menu">
                    <div class="menu-item">
                        <div class="menu-item-bullet">●</div>
                        <div class="menu-item-content">
                            <div class="menu-item-name">キムチ盛り</div>
                            <div class="menu-item-name-en">Kimuchi</div>
                        </div>
                    </div>
                    <div class="menu-item">
                        <div class="menu-item-bullet">●</div>
                        <div class="menu-item-content">
                            <div class="menu-item-name">ナムル盛り</div>
                            <div class="menu-item-name-en">Namuru</div>
                        </div>
                    </div>
                    <div class="menu-item">
                        <div class="menu-item-bullet">●</div>
                        <div class="menu-item-content">
                            <div class="menu-item-name">美炙樂サラダ</div>
                            <div class="menu-item-name-en">Bishara salad</div>
                        </div>
                    </div>
                    <div class="menu-item">
                        <div class="menu-item-bullet">●</div>
                        <div class="menu-item-content">
                            <div class="menu-item-name">常陸牛の握り2種</div>
                            <div class="menu-item-name-en">Hitachi-beef sushi (2pcs./set)</div>
                        </div>
                    </div>
                    <div class="menu-item">
                        <div class="menu-item-bullet">●</div>
                        <div class="menu-item-content">
                            <div class="menu-item-name">上タン塩</div>
                            <div class="menu-item-name-en">Prime beef tongue</div>
                        </div>
                    </div>
                    <div class="menu-item">
                        <div class="menu-item-bullet">●</div>
                        <div class="menu-item-content">
                            <div class="menu-item-name">車海老</div>
                            <div class="menu-item-name-en">Japanese tiger prawn</div>
                        </div>
                    </div>
                    <div class="menu-item">
                        <div class="menu-item-bullet">●</div>
                        <div class="menu-item-content">
                            <div class="menu-item-name">上カルビ</div>
                            <div class="menu-item-name-en">Prime kalbi</div>
                        </div>
                    </div>
                    <div class="menu-item">
                        <div class="menu-item-bullet">●</div>
                        <div class="menu-item-content">
                            <div class="menu-item-name">上ロース</div>
                            <div class="menu-item-name-en">Prime loin</div>
                        </div>
                    </div>
                    <div class="menu-item">
                        <div class="menu-item-bullet">●</div>
                        <div class="menu-item-content">
                            <div class="menu-item-name">おまかせホルモンミックス</div>
                            <div class="menu-item-name-en">Mix horumon</div>
                        </div>
                    </div>
                    <div class="menu-item">
                        <div class="menu-item-bullet">●</div>
                        <div class="menu-item-content">
                            <div class="menu-item-name">本日の究極素材3点盛り</div>
                            <div class="menu-item-name-en">Assortment of prime 3 kinds</div>
                        </div>
                    </div>
                    <div class="menu-item">
                        <div class="menu-item-bullet">●</div>
                        <div class="menu-item-content">
                            <div class="menu-item-name">幸せの茶漬け</div>
                            <div class="menu-item-name-en">Ochazuke</div>
                        </div>
                    </div>
                    <div class="menu-item">
                        <div class="menu-item-bullet">●</div>
                        <div class="menu-item-content">
                            <div class="menu-item-name">本日のデザート</div>
                            <div class="menu-item-name-en">Dessert</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 極コース -->
            <div class="course-card">
                <h2 class="course-title">極コース</h2>
                <p class="course-subtitle">ご宴会向けプラン　3名様〜承ります</p>
                <div class="course-price">お一人様 9,500円（税込）</div>
                
                <div class="course-menu">
                    <div class="menu-item">
                        <div class="menu-item-bullet">●</div>
                        <div class="menu-item-content">
                            <div class="menu-item-name">本日のオードブル</div>
                            <div class="menu-item-name-en">Hors d'oeuvre</div>
                        </div>
                    </div>
                    <div class="menu-item">
                        <div class="menu-item-bullet">●</div>
                        <div class="menu-item-content">
                            <div class="menu-item-name">キムチ盛り</div>
                            <div class="menu-item-name-en">Kimuchi</div>
                        </div>
                    </div>
                    <div class="menu-item">
                        <div class="menu-item-bullet">●</div>
                        <div class="menu-item-content">
                            <div class="menu-item-name">美炙樂サラダ</div>
                            <div class="menu-item-name-en">Bishara salad</div>
                        </div>
                    </div>
                    <div class="menu-item">
                        <div class="menu-item-bullet">●</div>
                        <div class="menu-item-content">
                            <div class="menu-item-name">常陸牛の握り2種</div>
                            <div class="menu-item-name-en">Hitachi-beef sushi (2pcs./set)</div>
                        </div>
                    </div>
                    <div class="menu-item">
                        <div class="menu-item-bullet">●</div>
                        <div class="menu-item-content">
                            <div class="menu-item-name">上タン塩</div>
                            <div class="menu-item-name-en">Prime beef tongue</div>
                        </div>
                    </div>
                    <div class="menu-item">
                        <div class="menu-item-bullet">●</div>
                        <div class="menu-item-content">
                            <div class="menu-item-name">上ハラミ</div>
                            <div class="menu-item-name-en">Prime harami</div>
                        </div>
                    </div>
                    <div class="menu-item">
                        <div class="menu-item-bullet">●</div>
                        <div class="menu-item-content">
                            <div class="menu-item-name">車海老</div>
                            <div class="menu-item-name-en">Japanese tiger prawn</div>
                        </div>
                    </div>
                    <div class="menu-item">
                        <div class="menu-item-bullet">●</div>
                        <div class="menu-item-content">
                            <div class="menu-item-name">上カルビ</div>
                            <div class="menu-item-name-en">Prime kalbi</div>
                        </div>
                    </div>
                    <div class="menu-item">
                        <div class="menu-item-bullet">●</div>
                        <div class="menu-item-content">
                            <div class="menu-item-name">上ロース</div>
                            <div class="menu-item-name-en">Prime loin</div>
                        </div>
                    </div>
                    <div class="menu-item">
                        <div class="menu-item-bullet">●</div>
                        <div class="menu-item-content">
                            <div class="menu-item-name">おまかせホルモンミックス</div>
                            <div class="menu-item-name-en">Mix horumon</div>
                        </div>
                    </div>
                    <div class="menu-item">
                        <div class="menu-item-bullet">●</div>
                        <div class="menu-item-content">
                            <div class="menu-item-name">本日の究極素材5点盛り</div>
                            <div class="menu-item-name-en">Assortment of prime 5 kinds</div>
                        </div>
                    </div>
                    <div class="menu-item">
                        <div class="menu-item-bullet">●</div>
                        <div class="menu-item-content">
                            <div class="menu-item-name">お食事</div>
                            <div class="menu-item-name-en">Meal</div>
                        </div>
                    </div>
                    <div class="menu-item">
                        <div class="menu-item-bullet">●</div>
                        <div class="menu-item-content">
                            <div class="menu-item-name">本日のデザート</div>
                            <div class="menu-item-name-en">Dessert</div>
                        </div>
                    </div>
                </div>
                
                <div class="note-text">
                    ※ご宴会は3名様より承ります。<br>
                    ※季節や仕入れ状況により内容が異なる場合がございます。<br>
                    ※宴会ご予約当時のキャンセルにつきましては、お受けできない場合もございます。
                </div>
            </div>

            <!-- 2名様限定ディナーコース -->
            <div class="course-card special-course">
                <h2 class="course-title">2名様限定ディナーコース</h2>
                <p class="course-subtitle">クリスマスや誕生日、二人にとっての大切な日をもっと素敵に演出いたします</p>
                
                <img src="https://images.unsplash.com/photo-1544025162-d76694265947?w=1200" alt="Special Dinner" class="course-image">
                
                <div class="course-price">
                    お一人様 10,000円（税込）<br>
                    <span class="text-xl">または</span><br>
                    お一人様 15,000円（税込）
                </div>
                
                <div class="note-text">
                    個室対応。お気軽にお問い合わせください。<br>
                    ※コースの内容についてはお任せになります。
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
    </body>
    </html>
  `)
})

// 管理画面
app.get('/admin', (c) => {
  return c.redirect('/static/admin.html')
})

export default app
