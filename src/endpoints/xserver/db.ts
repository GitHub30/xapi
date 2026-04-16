import { contentJson } from "chanfana";
import { z } from "zod";
import { XServerMock } from "./proxy";
import type { AppContext } from "../../types";

// --- データベース ---

export class DbList extends XServerMock {
	schema = {
		tags: ["MySQL"],
		summary: "データベース一覧を取得",
		request: {
		},
		responses: {
			"200": {
				description: "成功",
				...contentJson(
					z.object({
						databases: z.array(
							z.object({
								db_name: z.string(),
								version_name: z.string(),
								size_mb: z.number(),
								granted_users: z.array(z.string()),
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
		const { results: databases } = await db.prepare("SELECT * FROM mysql_databases").all();
		const { results: grants } = await db.prepare("SELECT * FROM mysql_grants").all();
		const grantMap: Record<string, string[]> = {};
		for (const g of grants as any[]) {
			if (!grantMap[g.db_name]) grantMap[g.db_name] = [];
			grantMap[g.db_name].push(g.db_user);
		}
		return c.json({
			databases: databases.map((row: any) => ({
				db_name: row.db_name,
				version_name: row.version_name,
				size_mb: row.size_mb,
				granted_users: grantMap[row.db_name] ?? [],
				memo: row.memo,
			})),
		});
	}
}

export class DbCreate extends XServerMock {
	schema = {
		tags: ["MySQL"],
		summary: "データベースを作成",
		request: {
			body: contentJson(
				z.object({
					name_suffix: z
						.string()
						.describe("データベース名のサフィックス"),
					character_set: z
						.string()
						.optional()
						.describe(
							"文字コード（utf8mb4 / UTF-8 / EUC-JP / SHIFT-JIS / Binary）",
						),
					memo: z.string().optional().describe("メモ"),
				}),
			),
		},
		responses: {
			"200": {
				description: "成功",
				...contentJson(
					z.object({ db_name: z.string(), message: z.string() }),
				),
			},
		},
	};

	async handle(c: AppContext) {
		const db = c.env.DB;
		const body = await c.req.json();
		const servername = c.req.param("servername") ?? "xs12345";
		const dbName = `${servername}_${body.name_suffix}`;
		await db
			.prepare("INSERT INTO mysql_databases (db_name, character_set, memo) VALUES (?, ?, ?)")
			.bind(dbName, body.character_set ?? "utf8mb4", body.memo ?? "")
			.run();
		return c.json({ db_name: dbName, message: "データベースを作成しました" });
	}
}

export class DbUpdate extends XServerMock {
	schema = {
		tags: ["MySQL"],
		summary: "データベースのメモを更新",
		request: {
			params: z.object({
				db_name: z.string().describe("データベース名"),
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
		const dbName = c.req.param("db_name");
		const body = await c.req.json();
		await db.prepare("UPDATE mysql_databases SET memo = ? WHERE db_name = ?").bind(body.memo, dbName).run();
		return c.json({ message: "データベース設定を変更しました" });
	}
}

export class DbDelete extends XServerMock {
	schema = {
		tags: ["MySQL"],
		summary: "データベースを削除",
		request: {
			params: z.object({
				db_name: z.string().describe("データベース名"),
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
		const dbName = c.req.param("db_name");
		await db.prepare("DELETE FROM mysql_grants WHERE db_name = ?").bind(dbName).run();
		await db.prepare("DELETE FROM mysql_databases WHERE db_name = ?").bind(dbName).run();
		return c.json({ message: "データベースを削除しました" });
	}
}

// --- MySQLユーザー ---

export class DbUserList extends XServerMock {
	schema = {
		tags: ["MySQL"],
		summary: "MySQLユーザー一覧を取得",
		request: {
		},
		responses: {
			"200": {
				description: "成功",
				...contentJson(
					z.object({
						users: z.array(
							z.object({
								db_user: z.string(),
								version_name: z.string(),
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
		const { results } = await db.prepare("SELECT db_user, version_name, memo FROM mysql_users").all();
		return c.json({ users: results });
	}
}

export class DbUserCreate extends XServerMock {
	schema = {
		tags: ["MySQL"],
		summary: "MySQLユーザーを作成",
		request: {
			body: contentJson(
				z.object({
					name_suffix: z
						.string()
						.describe("ユーザー名のサフィックス"),
					password: z.string().min(6).describe("パスワード"),
					memo: z.string().optional().describe("メモ"),
				}),
			),
		},
		responses: {
			"200": {
				description: "成功",
				...contentJson(
					z.object({ db_user: z.string(), message: z.string() }),
				),
			},
		},
	};

	async handle(c: AppContext) {
		const db = c.env.DB;
		const body = await c.req.json();
		const servername = c.req.param("servername") ?? "xs12345";
		const dbUser = `${servername}_${body.name_suffix}`;
		await db
			.prepare("INSERT INTO mysql_users (db_user, password, memo) VALUES (?, ?, ?)")
			.bind(dbUser, body.password, body.memo ?? "")
			.run();
		return c.json({ db_user: dbUser, message: "MySQLユーザーを作成しました" });
	}
}

export class DbUserUpdate extends XServerMock {
	schema = {
		tags: ["MySQL"],
		summary: "MySQLユーザーを変更",
		description:
			"送信した項目のみ更新され、省略した項目は現在の設定が維持されます。",
		request: {
			params: z.object({
				db_user: z.string().describe("MySQLユーザー名"),
			}),
			body: contentJson(
				z.object({
					password: z.string().optional().describe("パスワード"),
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
		const dbUser = c.req.param("db_user");
		const body = await c.req.json();
		const fields: string[] = [];
		const values: any[] = [];
		if (body.password !== undefined) { fields.push("password = ?"); values.push(body.password); }
		if (body.memo !== undefined) { fields.push("memo = ?"); values.push(body.memo); }
		if (fields.length > 0) {
			values.push(dbUser);
			await db.prepare(`UPDATE mysql_users SET ${fields.join(", ")} WHERE db_user = ?`).bind(...values).run();
		}
		return c.json({ message: "MySQLユーザー設定を変更しました" });
	}
}

export class DbUserDelete extends XServerMock {
	schema = {
		tags: ["MySQL"],
		summary: "MySQLユーザーを削除",
		request: {
			params: z.object({
				db_user: z.string().describe("MySQLユーザー名"),
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
		const dbUser = c.req.param("db_user");
		await db.prepare("DELETE FROM mysql_grants WHERE db_user = ?").bind(dbUser).run();
		await db.prepare("DELETE FROM mysql_users WHERE db_user = ?").bind(dbUser).run();
		return c.json({ message: "MySQLユーザーを削除しました" });
	}
}

// --- データベース権限 ---

export class DbUserGrantGet extends XServerMock {
	schema = {
		tags: ["MySQL"],
		summary: "データベース権限を取得",
		description:
			"指定したMySQLユーザーがアクセス権限を持つデータベースの一覧を返します。",
		request: {
			params: z.object({
				db_user: z.string().describe("MySQLユーザー名"),
			}),
		},
		responses: {
			"200": {
				description: "成功",
				...contentJson(
					z.object({
						databases: z.array(z.string()),
					}),
				),
			},
		},
	};

	async handle(c: AppContext) {
		const db = c.env.DB;
		const dbUser = c.req.param("db_user");
		const { results } = await db.prepare("SELECT db_name FROM mysql_grants WHERE db_user = ?").bind(dbUser).all();
		return c.json({ databases: results.map((r: any) => r.db_name) });
	}
}

export class DbUserGrantCreate extends XServerMock {
	schema = {
		tags: ["MySQL"],
		summary: "データベース権限を付与",
		description:
			"指定したMySQLユーザーにデータベースへのアクセス権限を付与します。",
		request: {
			params: z.object({
				db_user: z.string().describe("MySQLユーザー名"),
			}),
			body: contentJson(
				z.object({
					db_name: z.string().describe("データベース名"),
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
		const dbUser = c.req.param("db_user");
		const body = await c.req.json();
		await db.prepare("INSERT INTO mysql_grants (db_user, db_name) VALUES (?, ?)").bind(dbUser, body.db_name).run();
		return c.json({ message: "権限を付与しました" });
	}
}

export class DbUserGrantDelete extends XServerMock {
	schema = {
		tags: ["MySQL"],
		summary: "データベース権限を削除",
		description:
			"指定したMySQLユーザーからデータベースへのアクセス権限を削除します。",
		request: {
			params: z.object({
				db_user: z.string().describe("MySQLユーザー名"),
			}),
			body: contentJson(
				z.object({
					db_name: z.string().describe("データベース名"),
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
		const dbUser = c.req.param("db_user");
		const body = await c.req.json();
		await db.prepare("DELETE FROM mysql_grants WHERE db_user = ? AND db_name = ?").bind(dbUser, body.db_name).run();
		return c.json({ message: "権限を削除しました" });
	}
}
