import { contentJson } from "chanfana";
import { z } from "zod";
import { XServerMock } from "./proxy";
import type { AppContext } from "../../types";

export class MailFilterList extends XServerMock {
	schema = {
		tags: ["メール振り分け"],
		summary: "振り分け設定一覧を取得",
		description:
			"条件とアクションで定義された振り分けルールの一覧を返します。",
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
						filters: z.array(
							z.object({
								id: z.string(),
								domain: z.string(),
								priority: z.number().int(),
								conditions: z.array(
									z.object({
										keyword: z.string(),
										field: z.enum([
											"subject",
											"from",
											"to",
											"body",
											"header",
										]),
										match_type: z.enum([
											"contain",
											"match",
											"start_from",
										]),
									}),
								),
								action: z.object({
									type: z.enum([
										"mail_address",
										"spam_folder",
										"trash",
										"delete",
									]),
									target: z.string(),
									method: z.enum(["move", "copy"]),
								}),
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
		let sql = "SELECT * FROM mail_filters ORDER BY domain, priority";
		if (domain) {
			sql = "SELECT * FROM mail_filters WHERE domain = ? ORDER BY priority";
			bindings.push(domain);
		}
		const { results } = await db.prepare(sql).bind(...bindings).all();
		return c.json({
			filters: results.map((row: any) => ({
				id: row.id,
				domain: row.domain,
				priority: row.priority,
				conditions: JSON.parse(row.conditions),
				action: {
					type: row.action_type,
					target: row.action_target,
					method: row.action_method,
				},
			})),
		});
	}
}

export class MailFilterCreate extends XServerMock {
	schema = {
		tags: ["メール振り分け"],
		summary: "振り分け設定を追加",
		description:
			"条件を1つ以上、アクションを必須で指定します。複数条件はすべてANDで評価されます。",
		request: {
			body: contentJson(
				z.object({
					domain: z.string().max(253).describe("ドメイン"),
					conditions: z
						.array(
							z.object({
								keyword: z
									.string()
									.describe("マッチさせるキーワード"),
								field: z
									.enum([
										"subject",
										"from",
										"to",
										"body",
										"header",
									])
									.describe("対象フィールド"),
								match_type: z
									.enum(["contain", "match", "start_from"])
									.describe("一致条件"),
							}),
						)
						.min(1)
						.describe("条件の配列"),
					action: z.object({
						type: z
							.enum([
								"mail_address",
								"spam_folder",
								"trash",
								"delete",
							])
							.describe("転送先種別"),
						target: z
							.string()
							.optional()
							.describe("転送先メールアドレス"),
						method: z
							.enum(["move", "copy"])
							.describe("処理方法"),
					}),
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
		const id = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
		const maxPriority = await db.prepare("SELECT COALESCE(MAX(priority), 0) as max_p FROM mail_filters WHERE domain = ?").bind(body.domain).first<any>();
		const priority = (maxPriority?.max_p ?? 0) + 1;
		await db
			.prepare("INSERT INTO mail_filters (id, domain, priority, conditions, action_type, action_target, action_method) VALUES (?, ?, ?, ?, ?, ?, ?)")
			.bind(id, body.domain, priority, JSON.stringify(body.conditions), body.action.type, body.action.target ?? "", body.action.method)
			.run();
		return c.json({ id, message: "メール振り分けルールを追加しました" });
	}
}

export class MailFilterDelete extends XServerMock {
	schema = {
		tags: ["メール振り分け"],
		summary: "振り分け設定を削除",
		request: {
			params: z.object({
				filter_id: z.string().describe("振り分けルールのID"),
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
		const filterId = c.req.param("filter_id");
		await db.prepare("DELETE FROM mail_filters WHERE id = ?").bind(filterId).run();
		return c.json({ message: "メール振り分けルールを削除しました" });
	}
}
