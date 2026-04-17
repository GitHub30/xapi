import { contentJson } from "chanfana";
import { z } from "zod";
import { XServerMock } from "./proxy";
import type { AppContext } from "../../types";

export class DnsList extends XServerMock {
	schema = {
		tags: ["DNSレコード"],
		summary: "DNSレコード一覧を取得",
		description:
			"ドメインに登録されたDNSレコードを一覧返却します。",
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
						records: z.array(
							z.object({
								id: z.number().int(),
								domain: z.string(),
								host: z.string(),
								type: z.string(),
								content: z.string(),
								ttl: z.number().int(),
								priority: z.number().int(),
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
		let sql = "SELECT id, domain, host, type, content, ttl, priority FROM dns_records";
		const params: string[] = [];
		if (domain) {
			sql += " WHERE domain = ?";
			params.push(domain);
		}
		const { results } = await db.prepare(sql).bind(...params).all();
		return c.json({
			records: results.map((row: any) => ({
				id: row.id,
				domain: row.domain,
				host: row.host,
				type: row.type,
				content: row.content,
				ttl: row.ttl,
				priority: row.priority ?? 0,
			})),
		});
	}
}

export class DnsCreate extends XServerMock {
	schema = {
		tags: ["DNSレコード"],
		summary: "DNSレコードを追加",
		description:
			"A, AAAA, CNAME, MX, TXT 等のレコードを追加します。",
		request: {
			body: contentJson(
				z.object({
					domain: z.string().max(253).describe("ドメイン"),
					host: z.string().max(255).describe("ホスト名（@ で apex）"),
					type: z
						.string()
						.describe("レコードタイプ"),
					content: z.string().describe("内容"),
					ttl: z
						.number()
						.int()
						.min(60)
						.max(86400)
						.optional()
						.describe("TTL（省略時 3600）"),
					priority: z
						.number()
						.int()
						.optional()
						.describe("MX レコードの優先度"),
				}),
			),
		},
		responses: {
			"200": {
				description: "成功",
				...contentJson(
					z.object({ id: z.number().int(), message: z.string() }),
				),
			},
		},
	};

	async handle(c: AppContext) {
		const db = c.env.DB;
		const body = await c.req.json();
		const result = await db
			.prepare("INSERT INTO dns_records (domain, host, type, content, ttl, priority) VALUES (?, ?, ?, ?, ?, ?)")
			.bind(body.domain, body.host, body.type, body.content, body.ttl ?? 3600, body.priority ?? null)
			.run();
		return c.json({ id: result.meta.last_row_id, message: "DNSレコードを追加しました" });
	}
}

export class DnsUpdate extends XServerMock {
	schema = {
		tags: ["DNSレコード"],
		summary: "DNSレコードを更新",
		description:
			"送信した項目のみ更新され、省略した項目は現在の設定が維持されます。",
		request: {
			params: z.object({
				dns_id: z.string().describe("DNSレコードID"),
			}),
			body: contentJson(
				z.object({
					domain: z.string().optional().describe("ドメイン"),
					host: z.string().optional().describe("ホスト名"),
					type: z.string().optional().describe("レコードタイプ"),
					content: z.string().optional().describe("内容"),
					ttl: z
						.number()
						.int()
						.min(60)
						.max(86400)
						.optional()
						.describe("TTL"),
					priority: z
						.number()
						.int()
						.optional()
						.describe("MXレコードの優先度"),
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
		const dnsId = c.req.param("dns_id");
		const body = await c.req.json();
		const fields: string[] = [];
		const values: any[] = [];
		if (body.domain !== undefined) { fields.push("domain = ?"); values.push(body.domain); }
		if (body.host !== undefined) { fields.push("host = ?"); values.push(body.host); }
		if (body.type !== undefined) { fields.push("type = ?"); values.push(body.type); }
		if (body.content !== undefined) { fields.push("content = ?"); values.push(body.content); }
		if (body.ttl !== undefined) { fields.push("ttl = ?"); values.push(body.ttl); }
		if (body.priority !== undefined) { fields.push("priority = ?"); values.push(body.priority); }
		if (fields.length > 0) {
			values.push(dnsId);
			await db.prepare(`UPDATE dns_records SET ${fields.join(", ")} WHERE id = ?`).bind(...values).run();
		}
		return c.json({ message: "DNSレコードを変更しました" });
	}
}

export class DnsDelete extends XServerMock {
	schema = {
		tags: ["DNSレコード"],
		summary: "DNSレコードを削除",
		request: {
			params: z.object({
				dns_id: z.string().describe("DNSレコードID"),
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
		const dnsId = c.req.param("dns_id");
		await db.prepare("DELETE FROM dns_records WHERE id = ?").bind(dnsId).run();
		return c.json({ message: "DNSレコードを削除しました" });
	}
}
