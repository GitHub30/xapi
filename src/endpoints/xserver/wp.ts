import { contentJson } from "chanfana";
import { z } from "zod";
import { XServerMock } from "./proxy";
import type { AppContext } from "../../types";

export class WpList extends XServerMock {
	schema = {
		tags: ["WordPress簡単インストール"],
		summary: "WordPress一覧を取得",
		description:
			"簡単インストールでインストール済みのWordPress一覧を返します。",
		request: {
			query: z.object({
				domain: z
					.string()
					.optional()
					.describe("絞り込み対象のドメイン"),
			}),
		},
		responses: {
			"200": {
				description: "成功",
				...contentJson(
					z.object({
						wordpress: z.array(
							z.object({
								id: z.string(),
								domain: z.string(),
								url: z.string(),
								title: z.string(),
								version: z.string(),
								db_name: z.string(),
								db_user: z.string(),
								memo: z.string(),
							}),
						),
					}),
				),
			},
		},
	};

	async handle(c: AppContext) {
		const db = c.env.DB;
		const domain = c.req.query("domain");
		const bindings: string[] = [];
		let sql = "SELECT * FROM wordpress";
		if (domain) {
			sql += " WHERE domain = ?";
			bindings.push(domain);
		}
		const { results } = await db.prepare(sql).bind(...bindings).all();
		return c.json({ wordpress: results });
	}
}

export class WpCreate extends XServerMock {
	schema = {
		tags: ["WordPress簡単インストール"],
		summary: "WordPressを新規インストール",
		description:
			"指定URLにWordPressを簡単インストールします。",
		request: {
			body: contentJson(
				z.object({
					url: z.string().max(512).describe("インストール先URL"),
					title: z.string().max(255).describe("サイトタイトル"),
					admin_username: z
						.string()
						.max(255)
						.describe("管理者ユーザー名"),
					admin_password: z
						.string()
						.min(7)
						.describe("管理者パスワード"),
					admin_email: z
						.string()
						.email()
						.max(255)
						.describe("管理者メールアドレス"),
					memo: z.string().max(500).optional().describe("メモ"),
				}),
			),
		},
		responses: {
			"200": {
				description: "成功",
				...contentJson(
					z.object({ id: z.string(), message: z.string() }),
				),
			},
		},
	};

	async handle(c: AppContext) {
		const db = c.env.DB;
		const body = await c.req.json();
		const id = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
		const urlStr = body.url.replace(/^https?:\/\//, "");
		const domain = urlStr.split("/")[0];
		await db
			.prepare("INSERT INTO wordpress (id, domain, url, title, version, db_name, db_user, memo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
			.bind(id, domain, body.url, body.title, "6.4.2", "", "", body.memo ?? "")
			.run();
		return c.json({ id, message: "WordPressをインストールしました" });
	}
}

export class WpUpdate extends XServerMock {
	schema = {
		tags: ["WordPress簡単インストール"],
		summary: "WordPress設定を変更",
		request: {
			params: z.object({
				wp_id: z.string().describe("WordPressのID"),
			}),
			body: contentJson(
				z.object({
					memo: z.string().optional().describe("メモ（省略時は空文字に更新）"),
				}),
			),
		},
		responses: {
			"200": {
				description: "成功",
				...contentJson(z.object({ message: z.string() })),
			},
		},
	};

	async handle(c: AppContext) {
		const db = c.env.DB;
		const wpId = c.req.param("wp_id");
		const body = await c.req.json();
		await db.prepare("UPDATE wordpress SET memo = ? WHERE id = ?").bind(body.memo ?? "", wpId).run();
		return c.json({ message: "WordPress設定を変更しました" });
	}
}

export class WpDelete extends XServerMock {
	schema = {
		tags: ["WordPress簡単インストール"],
		summary: "WordPressを削除",
		description:
			"WordPressをアンインストールします。関連するデータベース・ユーザー・Cronの削除はオプションで制御できます。",
		request: {
			params: z.object({
				wp_id: z.string().describe("WordPressのID"),
			}),
			body: contentJson(
				z.object({
					delete_db: z
						.boolean()
						.optional()
						.describe("関連するMySQLデータベースも削除するか"),
					delete_db_user: z
						.boolean()
						.optional()
						.describe("関連するMySQLユーザーも削除するか"),
					delete_cron: z
						.boolean()
						.optional()
						.describe("キャッシュ自動削除Cronも削除するか"),
				}),
			),
		},
		responses: {
			"200": {
				description: "成功",
				...contentJson(z.object({ message: z.string() })),
			},
		},
	};

	async handle(c: AppContext) {
		const db = c.env.DB;
		const wpId = c.req.param("wp_id");
		await db.prepare("DELETE FROM wordpress WHERE id = ?").bind(wpId).run();
		return c.json({ message: "WordPressを削除しました" });
	}
}
