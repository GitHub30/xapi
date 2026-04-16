import { contentJson } from "chanfana";
import { z } from "zod";
import { XServerMock } from "./proxy";
import type { AppContext } from "../../types";

export class FtpList extends XServerMock {
	schema = {
		tags: ["FTPアカウント"],
		summary: "FTPアカウント一覧を取得",
		description:
			"登録済みFTPアカウントを一覧返却します。メインアカウントは含まれません。",
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
						accounts: z.array(
							z.object({
								ftp_account: z.string(),
								directory: z.string(),
								quota_mb: z.number().int(),
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
		let sql = "SELECT ftp_account, directory, quota_mb, memo FROM ftp_accounts";
		if (domain) {
			sql += " WHERE ftp_account LIKE ?";
			bindings.push(`%@${domain}`);
		}
		const { results } = await db.prepare(sql).bind(...bindings).all();
		return c.json({ accounts: results });
	}
}

export class FtpCreate extends XServerMock {
	schema = {
		tags: ["FTPアカウント"],
		summary: "FTPアカウントを追加",
		request: {
			body: contentJson(
				z.object({
					ftp_account: z
						.string()
						.describe("FTPアカウント（user@domain 形式）"),
					password: z.string().min(8).describe("パスワード"),
					directory: z.string().optional().describe("ディレクトリ"),
					quota_mb: z
						.number()
						.int()
						.optional()
						.describe("容量(MB)"),
					memo: z.string().optional().describe("メモ"),
				}),
			),
		},
		responses: {
			"200": {
				description: "成功",
				...contentJson(
					z.object({
						ftp_account: z.string(),
						message: z.string(),
					}),
				),
			},
		},
	};

	async handle(c: AppContext) {
		const db = c.env.DB;
		const body = await c.req.json();
		await db
			.prepare("INSERT INTO ftp_accounts (ftp_account, password, directory, quota_mb, memo) VALUES (?, ?, ?, ?, ?)")
			.bind(body.ftp_account, body.password, body.directory ?? "/", body.quota_mb ?? 0, body.memo ?? "")
			.run();
		return c.json({ ftp_account: body.ftp_account, message: "FTPアカウントを作成しました" });
	}
}

export class FtpUpdate extends XServerMock {
	schema = {
		tags: ["FTPアカウント"],
		summary: "FTPアカウントを変更",
		description:
			"送信した項目のみ更新され、省略した項目は現在の設定が維持されます。",
		request: {
			params: z.object({
				ftp_account: z.string().describe("FTPアカウント"),
			}),
			body: contentJson(
				z.object({
					password: z.string().optional().describe("パスワード"),
					directory: z.string().optional().describe("ディレクトリ"),
					quota_mb: z
						.number()
						.int()
						.optional()
						.describe("容量(MB)"),
					memo: z.string().optional().describe("メモ"),
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
		const ftpAccount = c.req.param("ftp_account");
		const body = await c.req.json();
		const fields: string[] = [];
		const values: any[] = [];
		if (body.password !== undefined) { fields.push("password = ?"); values.push(body.password); }
		if (body.directory !== undefined) { fields.push("directory = ?"); values.push(body.directory); }
		if (body.quota_mb !== undefined) { fields.push("quota_mb = ?"); values.push(body.quota_mb); }
		if (body.memo !== undefined) { fields.push("memo = ?"); values.push(body.memo); }
		if (fields.length > 0) {
			values.push(ftpAccount);
			await db.prepare(`UPDATE ftp_accounts SET ${fields.join(", ")} WHERE ftp_account = ?`).bind(...values).run();
		}
		return c.json({ message: "FTPアカウント設定を変更しました" });
	}
}

export class FtpDelete extends XServerMock {
	schema = {
		tags: ["FTPアカウント"],
		summary: "FTPアカウントを削除",
		request: {
			params: z.object({
				ftp_account: z.string().describe("FTPアカウント"),
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
		const ftpAccount = c.req.param("ftp_account");
		await db.prepare("DELETE FROM ftp_accounts WHERE ftp_account = ?").bind(ftpAccount).run();
		return c.json({ message: "FTPアカウントを削除しました" });
	}
}
