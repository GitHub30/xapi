import { contentJson } from "chanfana";
import { z } from "zod";
import { XServerMock } from "./proxy";
import type { AppContext } from "../../types";

export class MailList extends XServerMock {
	schema = {
		tags: ["メールアカウント"],
		summary: "メールアカウント一覧を取得",
		description:
			"サーバーに登録済みのメールアカウントを一覧返却します。",
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
								mail_address: z.string(),
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
		let sql = "SELECT mail_address, quota_mb, memo FROM mail_accounts";
		if (domain) {
			sql += " WHERE mail_address LIKE ?";
			bindings.push(`%@${domain}`);
		}
		const { results } = await db.prepare(sql).bind(...bindings).all();
		return c.json({ accounts: results });
	}
}

export class MailRead extends XServerMock {
	schema = {
		tags: ["メールアカウント"],
		summary: "メールアカウント詳細を取得",
		description:
			"指定したメールアカウントの詳細情報を返します。",
		request: {
			params: z.object({
				mail_account: z.string().describe("メールアドレス"),
			}),
		},
		responses: {
			"200": {
				description: "成功",
				...contentJson(
					z.object({
						mail_address: z.string(),
						quota_mb: z.number().int(),
						used_mb: z.number(),
						memo: z.string(),
					}),
				),
			},
		},
	};

	async handle(c: AppContext) {
		const db = c.env.DB;
		const mailAccount = c.req.param("mail_account");
		const row = await db.prepare("SELECT mail_address, quota_mb, used_mb, memo FROM mail_accounts WHERE mail_address = ?").bind(mailAccount).first();
		if (!row) return c.json({ error: "Not found" }, 404);
		return c.json(row);
	}
}

export class MailCreate extends XServerMock {
	schema = {
		tags: ["メールアカウント"],
		summary: "メールアカウントを作成",
		request: {
			body: contentJson(
				z.object({
					mail_address: z.string().describe("メールアドレス"),
					password: z.string().min(6).describe("パスワード"),
					quota_mb: z
						.number()
						.int()
						.min(1)
						.max(50000)
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
						mail_address: z.string(),
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
			.prepare("INSERT INTO mail_accounts (mail_address, password, quota_mb, memo) VALUES (?, ?, ?, ?)")
			.bind(body.mail_address, body.password, body.quota_mb ?? 2000, body.memo ?? "")
			.run();
		return c.json({ mail_address: body.mail_address, message: "メールアカウントを作成しました" });
	}
}

export class MailUpdate extends XServerMock {
	schema = {
		tags: ["メールアカウント"],
		summary: "メールアカウントを変更",
		description:
			"送信した項目のみ更新され、省略した項目は現在の設定が維持されます。",
		request: {
			params: z.object({
				mail_account: z.string().describe("メールアドレス"),
			}),
			body: contentJson(
				z.object({
					password: z.string().optional().describe("パスワード"),
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
		const mailAccount = c.req.param("mail_account");
		const body = await c.req.json();
		const fields: string[] = [];
		const values: any[] = [];
		if (body.password !== undefined) { fields.push("password = ?"); values.push(body.password); }
		if (body.quota_mb !== undefined) { fields.push("quota_mb = ?"); values.push(body.quota_mb); }
		if (body.memo !== undefined) { fields.push("memo = ?"); values.push(body.memo); }
		if (fields.length > 0) {
			values.push(mailAccount);
			await db.prepare(`UPDATE mail_accounts SET ${fields.join(", ")} WHERE mail_address = ?`).bind(...values).run();
		}
		return c.json({ message: "メールアカウント設定を変更しました" });
	}
}

export class MailDelete extends XServerMock {
	schema = {
		tags: ["メールアカウント"],
		summary: "メールアカウントを削除",
		request: {
			params: z.object({
				mail_account: z.string().describe("メールアドレス"),
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
		const mailAccount = c.req.param("mail_account");
		await db.prepare("DELETE FROM mail_forwarding WHERE mail_address = ?").bind(mailAccount).run();
		await db.prepare("DELETE FROM mail_accounts WHERE mail_address = ?").bind(mailAccount).run();
		return c.json({ message: "メールアカウントを削除しました" });
	}
}

export class MailForwardingGet extends XServerMock {
	schema = {
		tags: ["メールアカウント"],
		summary: "メール転送設定を取得",
		request: {
			params: z.object({
				mail_account: z.string().describe("メールアドレス"),
			}),
		},
		responses: {
			"200": {
				description: "成功",
				...contentJson(
					z.object({
						forwarding_addresses: z.array(z.string()),
						keep_in_mailbox: z.boolean(),
					}),
				),
			},
		},
	};

	async handle(c: AppContext) {
		const db = c.env.DB;
		const mailAccount = c.req.param("mail_account");
		const row = await db.prepare("SELECT forwarding_addresses, keep_in_mailbox FROM mail_forwarding WHERE mail_address = ?").bind(mailAccount).first<any>();
		return c.json({
			forwarding_addresses: row ? JSON.parse(row.forwarding_addresses) : [],
			keep_in_mailbox: row ? Boolean(row.keep_in_mailbox) : true,
		});
	}
}

export class MailForwardingUpdate extends XServerMock {
	schema = {
		tags: ["メールアカウント"],
		summary: "メール転送設定を更新",
		description:
			"転送先アドレスは上書きで設定されます。空配列を送ると転送先をクリアできます。",
		request: {
			params: z.object({
				mail_account: z.string().describe("メールアドレス"),
			}),
			body: contentJson(
				z.object({
					forwarding_addresses: z
						.array(z.string())
						.optional()
						.describe("転送先メールアドレスの配列"),
					keep_in_mailbox: z
						.boolean()
						.optional()
						.describe("転送後もメールボックスに残すか"),
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
		const mailAccount = c.req.param("mail_account");
		const body = await c.req.json();
		const addresses = JSON.stringify(body.forwarding_addresses ?? []);
		const keep = body.keep_in_mailbox !== undefined ? (body.keep_in_mailbox ? 1 : 0) : 1;
		await db
			.prepare("INSERT INTO mail_forwarding (mail_address, forwarding_addresses, keep_in_mailbox) VALUES (?, ?, ?) ON CONFLICT(mail_address) DO UPDATE SET forwarding_addresses = excluded.forwarding_addresses, keep_in_mailbox = excluded.keep_in_mailbox")
			.bind(mailAccount, addresses, keep)
			.run();
		return c.json({ message: "メール転送設定を変更しました" });
	}
}
