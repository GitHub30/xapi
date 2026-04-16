import { contentJson } from "chanfana";
import { z } from "zod";
import { XServerMock } from "./proxy";
import type { AppContext } from "../../types";

export class SubdomainList extends XServerMock {
	schema = {
		tags: ["サブドメイン"],
		summary: "サブドメイン一覧を取得",
		description:
			"登録済みサブドメインの一覧を返します。",
		request: {
			query: z.object({
				domain: z
					.string()
					.optional()
					.describe("絞り込み対象の親ドメイン"),
			}),
		},
		responses: {
			"200": {
				description: "成功",
				...contentJson(
					z.object({
						subdomains: z.array(
							z.object({
								subdomain: z.string(),
								domain: z.string(),
								document_root: z.string(),
								ssl: z.boolean(),
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
		let sql = "SELECT subdomain, domain, document_root, ssl, memo FROM subdomains";
		const params: string[] = [];
		if (domain) {
			sql += " WHERE domain = ?";
			params.push(domain);
		}
		const { results } = await db.prepare(sql).bind(...params).all();
		return c.json({
			subdomains: results.map((row: any) => ({
				subdomain: row.subdomain,
				domain: row.domain,
				document_root: row.document_root,
				ssl: Boolean(row.ssl),
				memo: row.memo,
			})),
		});
	}
}

export class SubdomainCreate extends XServerMock {
	schema = {
		tags: ["サブドメイン"],
		summary: "サブドメインを追加",
		request: {
			body: contentJson(
				z.object({
					subdomain: z
						.string()
						.describe("サブドメイン（例: blog.example.com）"),
					ssl: z.boolean().optional().describe("SSL設定（デフォルト: true）"),
					memo: z.string().optional().describe("メモ"),
				}),
			),
		},
		responses: {
			"200": {
				description: "成功",
				...contentJson(
					z.object({
						subdomain: z.string(),
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
		const parts = body.subdomain.split(".");
		const parentDomain = parts.slice(1).join(".");
		const sslEnabled = body.ssl !== false ? 1 : 0;
		await db
			.prepare("INSERT INTO subdomains (subdomain, domain, document_root, ssl, memo) VALUES (?, ?, ?, ?, ?)")
			.bind(
				body.subdomain, parentDomain,
				`/home/${servername}/${body.subdomain}/public_html`,
				sslEnabled, body.memo ?? "",
			)
			.run();
		return c.json({ subdomain: body.subdomain, message: "サブドメインを追加しました", ...(sslEnabled ? { ssl_status: "success" } : {}) });
	}
}

export class SubdomainUpdate extends XServerMock {
	schema = {
		tags: ["サブドメイン"],
		summary: "サブドメインのメモを更新",
		request: {
			params: z.object({
				subdomain: z.string().describe("サブドメイン"),
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
		const subdomainName = c.req.param("subdomain");
		const body = await c.req.json();
		await db.prepare("UPDATE subdomains SET memo = ? WHERE subdomain = ?").bind(body.memo, subdomainName).run();
		return c.json({ message: "サブドメイン設定を変更しました" });
	}
}

export class SubdomainDelete extends XServerMock {
	schema = {
		tags: ["サブドメイン"],
		summary: "サブドメインを削除",
		description:
			"サブドメインを削除します。delete_files を true にすると、ユーザー公開領域のサブドメインディレクトリも合わせて削除します。",
		request: {
			params: z.object({
				subdomain: z.string().describe("サブドメイン"),
			}),
			body: contentJson(
				z.object({
					delete_files: z.boolean().optional().describe("ユーザー公開領域のサブドメインディレクトリも削除するか（デフォルト: false）"),
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
		const subdomainName = c.req.param("subdomain");
		await db.prepare("DELETE FROM subdomains WHERE subdomain = ?").bind(subdomainName).run();
		return c.json({ message: "サブドメインを削除しました" });
	}
}
