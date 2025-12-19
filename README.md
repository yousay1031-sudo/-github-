# TOKACHI YAKINIKU KARIN - 公式ウェブサイト

十勝産の厳選素材を使用した高級焼肉店「TOKACHI YAKINIKU KARIN（トカチ ヤキニク カリン）」の公式ウェブサイトです。

## 🎯 プロジェクト概要

- **店名**: TOKACHI YAKINIKU KARIN（トカチ ヤキニク カリン）
- **目的**: 高級焼肉店のブランディングとオンラインプレゼンス強化
- **技術スタック**: Hono + Cloudflare Pages + D1 Database + TypeScript

## ✨ 主な機能

### フロントエンド
- ✅ 高級感あるレスポンシブデザイン（bishara.jpのデザインを参考）
- ✅ トップページ（店舗紹介、こだわり、おすすめメニュー）
- ✅ メニューページ（カテゴリー別メニュー表示）
- ✅ ギャラリーページ（店舗・料理の写真ギャラリー）
- ✅ アクセスページ（店舗情報、地図、営業時間）
- ✅ 管理画面（メニュー・画像の編集機能）

### バックエンド
- ✅ RESTful API（メニュー、ギャラリー、店舗情報）
- ✅ Cloudflare D1 Database（SQLiteベース）
- ✅ CRUD操作（作成、読取、更新、削除）

### 管理機能
- ✅ メニュー管理（追加、編集、削除、表示/非表示切替）
- ✅ ギャラリー管理（画像の追加、編集、削除）
- ✅ 表示順の管理
- ✅ リアルタイムプレビュー

## 🌐 公開URL

### 開発環境（Sandbox）
- **メインサイト**: https://3000-irec2c9zqhg6842dl8ge5-b9b802c4.sandbox.novita.ai
- **管理画面**: https://3000-irec2c9zqhg6842dl8ge5-b9b802c4.sandbox.novita.ai/admin

### 本番環境（Cloudflare Pages）
- デプロイ後に追加予定

## 🗂️ データベース構造

### テーブル
1. **menu_categories** - メニューカテゴリー
   - 厳選素材 厚切り焼肉
   - 上質カルビ
   - 希少部位
   - ホルモン
   - お料理
   - お飲み物

2. **menu_items** - メニューアイテム
   - 商品名、説明、価格、画像URL
   - カテゴリーID、表示順、表示/非表示

3. **gallery_images** - ギャラリー画像
   - タイトル、説明、画像URL
   - 表示順、表示/非表示

4. **store_info** - 店舗情報
   - 店名、住所、電話番号
   - 営業時間、予算、座席数など

## 📋 API エンドポイント

### 公開API
- `GET /api/menu-categories` - メニューカテゴリー一覧
- `GET /api/menu-items` - メニューアイテム一覧
- `GET /api/gallery-images` - ギャラリー画像一覧
- `GET /api/store-info` - 店舗情報

### 管理API
- `GET /api/admin/menu-items` - 全メニューアイテム（管理用）
- `POST /api/admin/menu-items` - メニューアイテム追加
- `PUT /api/admin/menu-items/:id` - メニューアイテム更新
- `DELETE /api/admin/menu-items/:id` - メニューアイテム削除
- `GET /api/admin/gallery-images` - 全ギャラリー画像（管理用）
- `POST /api/admin/gallery-images` - ギャラリー画像追加
- `PUT /api/admin/gallery-images/:id` - ギャラリー画像更新
- `DELETE /api/admin/gallery-images/:id` - ギャラリー画像削除

## 🚀 ローカル開発

### 必要なもの
- Node.js 18+
- npm

### セットアップ
```bash
# 依存関係のインストール
npm install

# データベースの初期化
node init-db.cjs

# ビルド
npm run build

# 開発サーバー起動（PM2）
pm2 start ecosystem.config.cjs

# サーバー確認
curl http://localhost:3000
```

### データベースのリセット
```bash
# .wranglerディレクトリを削除
rm -rf .wrangler

# ビルドして新しいD1を作成
npm run build
pm2 start ecosystem.config.cjs

# 停止して初期化
pm2 delete webapp
node init-db.cjs
pm2 start ecosystem.config.cjs
```

## 📦 デプロイ（Cloudflare Pages）

### 前提条件
1. Cloudflare アカウント
2. Wrangler CLI認証済み

### デプロイ手順
```bash
# ビルド
npm run build

# プロジェクト作成（初回のみ）
npx wrangler pages project create webapp --production-branch main

# デプロイ
npx wrangler pages deploy dist --project-name webapp

# 本番環境のD1データベース作成（初回のみ）
npx wrangler d1 create webapp-production
# database_id を wrangler.toml に設定

# 本番環境にマイグレーション適用（初回のみ）
npx wrangler d1 execute webapp-production --file=migrations/0001_initial_schema.sql
npx wrangler d1 execute webapp-production --file=seed.sql
```

## 🛠️ 技術スタック

- **フレームワーク**: Hono v4.10+
- **デプロイ**: Cloudflare Pages + Workers
- **データベース**: Cloudflare D1 (SQLite)
- **言語**: TypeScript
- **ビルドツール**: Vite
- **スタイリング**: Tailwind CSS (CDN)
- **アイコン**: Font Awesome
- **プロセス管理**: PM2

## 📝 店舗情報

- **店名**: TOKACHI YAKINIKU KARIN（トカチ ヤキニク カリン）
- **住所**: 北海道帯広市西一条南8-20-5
- **電話**: 050-8883-6929
- **アクセス**: 帯広駅から徒歩7分
- **営業時間**:
  - 月・土・日・祝日: 17:30-00:00 (L.O. 料理23:00 ドリンク23:30)
  - 火: 11:30-15:00 (L.O. 14:30)
  - 水・木・金: 11:30-15:00 (L.O. 14:30), 17:30-00:00 (L.O. 料理23:00 ドリンク23:30)
- **予算**:
  - ディナー: ¥5,000〜¥5,999
  - ランチ: ¥1,000〜¥1,999
- **座席**: 44席（1階テーブル20席、2階個室24席）
- **Instagram**: [@tokachi_yakiniku_karin](https://www.instagram.com/tokachi_yakiniku_karin)

## 📄 ライセンス

© 2024 TOKACHI YAKINIKU KARIN. All rights reserved.

## 🔧 今後の改善予定

- [ ] 予約システムの統合
- [ ] 多言語対応（英語、中国語、韓国語）
- [ ] 画像アップロード機能（Cloudflare R2連携）
- [ ] SEO最適化
- [ ] パフォーマンス最適化
- [ ] アクセス解析の導入
- [ ] SNS連携強化
- [ ] お客様レビューセクション

## 📧 お問い合わせ

お問い合わせは店舗まで直接お願いいたします。
- 電話: 050-8883-6929
- Instagram: [@tokachi_yakiniku_karin](https://www.instagram.com/tokachi_yakiniku_karin)

---

**最終更新**: 2024年12月11日
**バージョン**: 1.0.0
**ステータス**: ✅ 開発完了・本番環境デプロイ準備中
# Cloudflare Pages Deployment
