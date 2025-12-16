# Instagram連携セットアップガイド

## 📱 概要

TOKACHI YAKINIKU KARINウェブサイトでは、Instagram投稿を自動的にニュースページに同期する機能を実装しています。

### 主な機能
- ✅ Instagram投稿の自動取得（最新25件）
- ✅ 6時間ごとの自動同期（Cloudflare Cron Triggers）
- ✅ 管理画面から手動同期
- ✅ 重複チェック（同じ投稿は複数回同期されない）
- ✅ 画像・動画サムネイル対応

---

## 🚀 セットアップ手順

### ステップ1: Meta for Developersでアプリを作成

1. **Meta for Developers にアクセス**
   - URL: https://developers.facebook.com/
   - Facebookアカウントでログイン

2. **新しいアプリを作成**
   - 「マイアプリ」→「アプリを作成」をクリック
   - アプリタイプ: **ビジネス** を選択
   - アプリ名: `TOKACHI YAKINIKU KARIN News` （任意）
   - アプリの連絡先メールアドレスを入力
   - 「アプリを作成」をクリック

3. **アプリIDとアプリシークレットを記録**
   - アプリダッシュボードの「設定」→「ベーシック」
   - `アプリID` と `app secret` をコピーして保存

---

### ステップ2: Instagram Basic Display APIを設定

1. **製品を追加**
   - アプリダッシュボード→「製品を追加」
   - **Instagram Basic Display** を選択して「設定」

2. **リダイレクトURIを設定**
   - Instagram Basic Display 設定ページで以下を入力:
   
   ```
   Valid OAuth Redirect URIs:
   https://webapp.pages.dev/api/instagram/callback
   
   Deauthorize Callback URL:
   https://webapp.pages.dev/api/instagram/deauth
   
   Data Deletion Request URL:
   https://webapp.pages.dev/api/instagram/delete
   ```
   
   ⚠️ **注意**: `webapp.pages.dev` は実際のCloudflare PagesのURLに置き換えてください

3. **Instagram テスターを追加**
   - 「Instagram テスター」タブで自分のInstagramアカウントを追加
   - Instagramアプリで承認リクエストを確認して承認

---

### ステップ3: アクセストークンを取得

#### 3-1. 認証URLにアクセス

ブラウザで以下のURLを開く（`{app-id}` と `{redirect-uri}` を置き換え）:

```
https://api.instagram.com/oauth/authorize?client_id={app-id}&redirect_uri={redirect-uri}&scope=user_profile,user_media&response_type=code
```

**例**:
```
https://api.instagram.com/oauth/authorize?client_id=123456789&redirect_uri=https://webapp.pages.dev/api/instagram/callback&scope=user_profile,user_media&response_type=code
```

#### 3-2. 認証後にcodeを取得

リダイレクトされたURLから `code` パラメータをコピー:
```
https://webapp.pages.dev/api/instagram/callback?code=AQABC123XYZ...
```

#### 3-3. 短期トークンを取得

ターミナルで以下を実行（値を置き換え）:

```bash
curl -X POST https://api.instagram.com/oauth/access_token \
  -F client_id=YOUR_APP_ID \
  -F client_secret=YOUR_APP_SECRET \
  -F grant_type=authorization_code \
  -F redirect_uri=https://webapp.pages.dev/api/instagram/callback \
  -F code=AQABC123XYZ...
```

**レスポンス例**:
```json
{
  "access_token": "IGQVJ...",
  "user_id": 123456789
}
```

#### 3-4. 長期トークンに交換（60日間有効）

```bash
curl -X GET "https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=YOUR_APP_SECRET&access_token=SHORT_LIVED_TOKEN"
```

**レスポンス例**:
```json
{
  "access_token": "IGQVJ...",
  "token_type": "bearer",
  "expires_in": 5183944
}
```

この `access_token` を保存します（これがINSTAGRAM_ACCESS_TOKEN）

---

### ステップ4: Cloudflare Secretsに設定

#### 開発環境（ローカル）

`.dev.vars` ファイルを作成（gitignoreに含まれています）:

```bash
cd /home/user/webapp
echo "INSTAGRAM_ACCESS_TOKEN=IGQVJxxxxxxxxxxxxxxxx" > .dev.vars
```

#### 本番環境（Cloudflare Pages）

Wranglerコマンドでシークレットを設定:

```bash
npx wrangler pages secret put INSTAGRAM_ACCESS_TOKEN --project-name webapp
# プロンプトが表示されたらトークンを貼り付け
```

または、Cloudflare Dashboardから設定:

1. Cloudflare Dashboard → Pages → webapp プロジェクト
2. 「設定」→「環境変数」
3. 「変数を追加」をクリック
4. 変数名: `INSTAGRAM_ACCESS_TOKEN`
5. 値: 長期トークンを貼り付け
6. 「暗号化」にチェック
7. 「保存」

---

### ステップ5: デプロイと動作確認

#### 本番環境にデプロイ

```bash
cd /home/user/webapp
npm run build
npx wrangler pages deploy dist --project-name webapp
```

#### 動作確認

1. **管理画面にアクセス**
   - URL: `https://webapp.pages.dev/admin`
   - 「Instagram連携」タブをクリック

2. **ステータス確認**
   - 緑色のチェックマーク = 設定完了 ✅
   - 黄色の警告 = トークン未設定 ⚠️

3. **手動同期テスト**
   - 「Instagramから投稿を同期」ボタンをクリック
   - 同期結果が表示される

4. **ニュースページで確認**
   - URL: `https://webapp.pages.dev/news`
   - Instagram投稿が表示されていることを確認

---

## 🔄 自動同期の仕組み

### Cron Triggers（6時間ごと）

`wrangler.toml` で設定済み:

```toml
[triggers]
crons = ["0 */6 * * *"]
```

- **実行タイミング**: 毎日 0:00, 6:00, 12:00, 18:00（UTC）
- **処理内容**: `/api/admin/sync-instagram` を自動実行
- **ログ確認**: Cloudflare Dashboard → Workers & Pages → Logs

### 同期処理の流れ

1. Instagram Graph API から最新25件の投稿を取得
2. 各投稿のInstagram IDでデータベースをチェック（重複確認）
3. 新しい投稿のみをNewsテーブルに挿入
4. 画像/動画のサムネイルURLを保存
5. 投稿日時を記録

---

## 🛠️ トラブルシューティング

### 1. 「Instagram APIが未設定です」と表示される

**原因**: `INSTAGRAM_ACCESS_TOKEN` が設定されていない

**解決方法**:
```bash
# 本番環境
npx wrangler pages secret put INSTAGRAM_ACCESS_TOKEN --project-name webapp

# ローカル環境
echo "INSTAGRAM_ACCESS_TOKEN=your_token_here" > .dev.vars
```

### 2. 「Instagram API error」が表示される

**原因**: トークンが無効または期限切れ

**解決方法**:
1. 長期トークン（60日間有効）を再取得
2. Cloudflare Secretsを更新
3. トークンの有効期限を確認:
   ```bash
   curl "https://graph.instagram.com/me?fields=id,username&access_token=YOUR_TOKEN"
   ```

### 3. 同期されない

**確認ポイント**:
- Instagramアカウントがビジネスまたはクリエイターアカウントか
- テスターとして追加されているか
- トークンのスコープに `user_profile` と `user_media` が含まれているか

### 4. 重複した投稿が表示される

**原因**: Instagram IDの抽出ロジックに問題がある可能性

**解決方法**:
管理画面で重複投稿を手動削除してください

---

## 📊 API エンドポイント

### 公開API

#### Instagram投稿を取得（テスト用）
```
GET /api/instagram/posts
```

**レスポンス**:
```json
{
  "success": true,
  "posts": [...],
  "count": 25
}
```

### 管理者API

#### Instagram同期ステータス確認
```
GET /api/admin/instagram-status
```

**レスポンス**:
```json
{
  "configured": true,
  "lastSyncedPosts": [...],
  "message": "Instagram連携が設定されています"
}
```

#### Instagram投稿を手動同期
```
POST /api/admin/sync-instagram
```

**レスポンス**:
```json
{
  "success": true,
  "syncedCount": 5,
  "skippedCount": 20,
  "totalPosts": 25,
  "syncedPosts": [...],
  "message": "5件の新しい投稿を同期しました（20件はスキップ）"
}
```

---

## 🔐 セキュリティ

### トークンの保護

- ✅ Cloudflare Secrets に暗号化して保存
- ✅ `.dev.vars` は `.gitignore` に含まれている
- ✅ APIエンドポイントは `/api/admin/*` で保護
- ❌ フロントエンドにトークンを露出しない

### トークンの更新

長期トークンは60日間有効です。期限切れ前に更新してください:

```bash
# 現在のトークンで長期トークンを再取得
curl -X GET "https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=CURRENT_TOKEN"
```

---

## 📚 参考リンク

- [Instagram Basic Display API ドキュメント](https://developers.facebook.com/docs/instagram-basic-display-api)
- [Instagram Graph API リファレンス](https://developers.facebook.com/docs/instagram-api)
- [Cloudflare Workers Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
- [Cloudflare Pages環境変数](https://developers.cloudflare.com/pages/platform/functions/bindings/#environment-variables)

---

## 💡 今後の改善案

- [ ] トークン自動更新機能
- [ ] 同期履歴の保存
- [ ] Instagram Webhooksでリアルタイム同期
- [ ] 投稿のフィルタリング機能（ハッシュタグ別など）
- [ ] 管理画面でのニュース編集機能強化

---

## 📞 サポート

問題が発生した場合は、以下を確認してください:

1. Cloudflare Pages ログ
2. ブラウザのコンソールログ
3. Instagram Basic Display API のステータスページ

それでも解決しない場合は、開発者にお問い合わせください。
