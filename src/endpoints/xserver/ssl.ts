import { contentJson } from "chanfana";
import { z } from "zod";
import { XServerMock } from "./proxy";
import type { AppContext } from "../../types";

export class SslList extends XServerMock {
	schema = {
		tags: ["SSL設定"],
		summary: "SSL設定一覧を取得",
		description:
			"無料SSL（Let's Encrypt）およびオプションSSLの一覧を返します。",
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
						ssl_list: z.array(
							z.object({
								id: z.number().int(),
								common_name: z.string(),
							type: z.string(),
							expires_at: z.string(),
							status: z.string(),
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
		let sql = "SELECT id, common_name, type, expires_at, status FROM ssl_certificates";
		const params: string[] = [];
		if (domain) {
			sql += " WHERE common_name = ?";
			params.push(domain);
		}
		const { results } = await db.prepare(sql).bind(...params).all();
		return c.json({
			ssl_list: results.map((row: any) => ({
				id: row.id,
				common_name: row.common_name,
				type: row.type,
				expires_at: row.expires_at,
				status: row.status,
			})),
		});
	}
}

export class SslCreate extends XServerMock {
	schema = {
		tags: ["SSL設定"],
		summary: "無料SSLをインストール",
		description:
			"指定ドメインに対して無料SSL証明書（Let's Encrypt）を発行・インストールします。",
		request: {
			body: contentJson(
				z.object({
					common_name: z.string().describe("コモンネーム（ドメイン名）"),
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
		const body = await c.req.json();
		const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
		await db
			.prepare("INSERT INTO ssl_certificates (common_name, type, expires_at, status) VALUES (?, ?, ?, ?)")
			.bind(body.common_name, "letsencrypt", expiresAt, "active")
			.run();
		return c.json({ message: "無料SSLを設定しました" });
	}
}

export class SslDelete extends XServerMock {
	schema = {
		tags: ["SSL設定"],
		summary: "無料SSLをアンインストール",
		request: {
			params: z.object({
				common_name: z.string().describe("Common Name"),
			}),
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
		const commonName = c.req.param("common_name");
		await db.prepare("DELETE FROM ssl_certificates WHERE common_name = ?").bind(commonName).run();
		return c.json({ message: "無料SSLを削除しました" });
	}
}
