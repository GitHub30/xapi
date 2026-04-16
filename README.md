# OpenAPI for XServer API(非公式)

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://dash.cloudflare.com/?to=/:account/workers-and-pages/create/deploy-to-workers&repository=https://github.com/GitHub30/xapi)

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/1d54803f-8b05-4d88-8216-312704d72ff2" />

検証テスト環境としてお使いください

## セットアップ手順

1. お好みのパッケージマネージャーで依存関係をインストールします。
   ```bash
   npm install
   ```
2. 名前を "openapi-template-db" として [D1 データベース](https://developers.cloudflare.com/d1/get-started/) を作成します。
   ```bash
   npx wrangler d1 create openapi-template-db
   ```
   ...その後、`wrangler.json` の `database_id` フィールドを新しいデータベース ID に更新します。
3. 次の DB マイグレーションを実行してデータベースを初期化します（このプロジェクトの `migrations` ディレクトリを参照してください）。
   ```bash
   npx wrangler d1 migrations apply DB --remote
   ```
4. プロジェクトをデプロイします。
   ```bash
   npx wrangler deploy
   ```
5. Worker をモニタリングします。
   ```bash
   npx wrangler tail
   ```

## 引用

クローン元のリポジトリ https://github.com/cloudflare/templates/tree/main/chanfana-openapi-template
