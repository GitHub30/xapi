import { contentJson } from "chanfana";
import { z } from "zod";
import { XServerMock } from "./proxy";
import type { AppContext } from "../../types";

export class DomainList extends XServerMock {
	schema = {
		tags: ["ドメイン設定"],
		summary: "ドメイン一覧を取得",
		description:
			"サーバーに追加済みのドメインの一覧を返します。",
		request: {
		},
		responses: {
			"200": {
				description: "成功",
				...contentJson(
					z.object({
						domains: z.array(
							z.object({
								domain: z.string(),
								type: z.string(),
								ssl: z.boolean(),
								memo: z.string(),
								is_awaiting: z.boolean(),
							}),
						),
					}),
				),
			},
		},
	};

	async handle(c: AppContext) {
		const db = c.env.DB;
		const { results } = await db.prepare("SELECT domain, type, ssl, memo, is_awaiting FROM domains").all();
		return c.json({
			domains: results.map((row: any) => ({
				domain: row.domain,
				type: row.type,
				ssl: Boolean(row.ssl),
				memo: row.memo,
				is_awaiting: Boolean(row.is_awaiting),
			})),
		});
	}
}

export class DomainRead extends XServerMock {
	schema = {
		tags: ["ドメイン設定"],
		summary: "ドメイン詳細を取得",
		description:
			"ドキュメントルート、PHPバージョン、SSL設定状況を含む詳細情報を返します。",
		request: {
			params: z.object({
				domain: z.string().describe("ドメイン名"),
			}),
		},
		responses: {
			"200": {
				description: "成功",
				...contentJson(
					z.object({
						domain: z.string(),
						type: z.string(),
						document_root: z.string(),
						url: z.string(),
						php_version: z.string(),
						ssl: z.boolean(),
						memo: z.string(),
						is_awaiting: z.boolean(),
						created_at: z.string(),
					}),
				),
			},
		},
	};

	async handle(c: AppContext) {
		const db = c.env.DB;
		const domainName = c.req.param("domain");
		const row = await db.prepare("SELECT * FROM domains WHERE domain = ?").bind(domainName).first<any>();
		if (!row) return c.json({ error: "Not found" }, 404);
		return c.json({
			domain: row.domain,
			type: row.type,
			document_root: row.document_root,
			url: row.url,
			php_version: row.php_version,
			ssl: Boolean(row.ssl),
			memo: row.memo,
			is_awaiting: Boolean(row.is_awaiting),
			created_at: row.created_at,
		});
	}
}

export class DomainCreate extends XServerMock {
	schema = {
		tags: ["ドメイン設定"],
		summary: "ドメインを追加",
		description:
			"追加型ドメインをサーバーに追加します。事前にサーバー情報 API で取得した domain_validation_token を TXT レコードに設定してください。",
		request: {
			body: contentJson(
				z.object({
					domain: z.string().describe("ドメイン名"),
					ssl: z.boolean().optional().describe("SSL設定（デフォルト: true）"),
					redirect_https: z.boolean().optional().describe("HTTPS転送設定（デフォルト: ssl と同じ値）"),
					ai_crawler_block_enabled: z.boolean().optional().describe("AIクローラー遮断設定（デフォルト: true）"),
					memo: z.string().optional().describe("メモ"),
				}),
			),
		},
		responses: {
			"200": {
				description: "成功",
				...contentJson(
					z.object({
						domain: z.string(),
						message: z.string(),
						ssl_status: z.string().optional(),
					}),
				),
			},
		},
	};

	async handle(c: AppContext) {
		const db = c.env.DB;
		const body = await c.req.json();
		const servername = c.req.param("servername") ?? "xs12345";
		const sslEnabled = body.ssl !== false ? 1 : 0;
		const now = new Date().toISOString().split("T")[0];
		await db
			.prepare("INSERT INTO domains (domain, type, document_root, url, php_version, ssl, memo, is_awaiting, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
			.bind(
				body.domain, "addon",
				`/home/${servername}/${body.domain}/public_html`,
				`${sslEnabled ? "https" : "http"}://${body.domain}/`,
				"8.3", sslEnabled, body.memo ?? "", 0, now,
			)
			.run();
		return c.json({ domain: body.domain, message: "ドメインを追加しました", ...(sslEnabled ? { ssl_status: "success" } : {}) });
	}
}

export class DomainUpdate extends XServerMock {
	schema = {
		tags: ["ドメイン設定"],
		summary: "ドメインのメモを更新",
		request: {
			params: z.object({
				domain: z.string().describe("ドメイン名"),
			}),
			body: contentJson(
				z.object({
					memo: z.string().describe("メモ"),
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
		const domainName = c.req.param("domain");
		const body = await c.req.json();
		await db.prepare("UPDATE domains SET memo = ? WHERE domain = ?").bind(body.memo, domainName).run();
		return c.json({ message: "ドメイン設定を変更しました" });
	}
}

export class DomainDelete extends XServerMock {
	schema = {
		tags: ["ドメイン設定"],
		summary: "ドメインを削除",
		description:
			"ドメインを削除します。delete_files を true にすると、ユーザー公開領域のドメインディレクトリも合わせて削除します。",
		request: {
			params: z.object({
				domain: z.string().describe("ドメイン名"),
			}),
			body: contentJson(
				z.object({
					delete_files: z.boolean().optional().describe("ユーザー公開領域のドメインディレクトリも削除するか（デフォルト: false）"),
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
		const domainName = c.req.param("domain");
		await db.prepare("DELETE FROM domains WHERE domain = ?").bind(domainName).run();
		return c.json({ message: "ドメインを削除しました" });
	}
}

export class DomainReset extends XServerMock {
	schema = {
		tags: ["ドメイン設定"],
		summary: "ドメイン設定を初期化",
		request: {
			params: z.object({
				domain: z.string().describe("ドメイン名"),
			}),
			body: contentJson(
				z.object({
					type: z
						.enum(["all", "web", "other"])
						.describe(
							"リセット種別（all: 全初期化 / web: Web領域のみ / other: Web以外）",
						),
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
		return c.json({ message: "ドメイン設定をリセットしました" });
	}
}
