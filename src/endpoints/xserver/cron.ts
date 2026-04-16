import { contentJson } from "chanfana";
import { z } from "zod";
import { XServerMock } from "./proxy";
import type { AppContext } from "../../types";

export class CronList extends XServerMock {
	schema = {
		tags: ["Cron設定"],
		summary: "Cron一覧を取得",
		description: "登録済みのCron設定を一覧で返します。",
		responses: {
			"200": {
				description: "成功",
				...contentJson(
					z.object({
						crons: z.array(
							z.object({
								id: z.string(),
								minute: z.string(),
								hour: z.string(),
								day: z.string(),
								month: z.string(),
								weekday: z.string(),
								command: z.string(),
								comment: z.string(),
								enabled: z.boolean(),
							}),
						),
						notification_email: z.string(),
					}),
				),
			},
		},
	};

	async handle(c: AppContext) {
		const db = c.env.DB;
		const { results: crons } = await db.prepare("SELECT * FROM crons").all();
		const settings = await db.prepare("SELECT notification_email FROM cron_settings WHERE id = 1").first<{ notification_email: string }>();
		return c.json({
			crons: crons.map((row: any) => ({
				id: row.id,
				minute: row.minute,
				hour: row.hour,
				day: row.day,
				month: row.month,
				weekday: row.weekday,
				command: row.command,
				comment: row.comment,
				enabled: Boolean(row.enabled),
			})),
			notification_email: settings?.notification_email ?? "",
		});
	}
}

export class CronCreate extends XServerMock {
	schema = {
		tags: ["Cron設定"],
		summary: "Cronを新規追加",
		description: "新しいCron設定を追加します。",
		request: {
			body: contentJson(
				z.object({
					minute: z.string().describe("分（0-59, */5 等）"),
					hour: z.string().describe("時（0-23, * 等）"),
					day: z.string().describe("日（1-31, * 等）"),
					month: z.string().describe("月（1-12, * 等）"),
					weekday: z.string().describe("曜日（0-7, * 等）"),
					command: z.string().max(1024).describe("実行コマンド"),
					comment: z.string().optional().describe("コメント"),
				}),
			),
		},
		responses: {
			"200": {
				description: "成功",
				...contentJson(
					z.object({
						id: z.string(),
						message: z.string(),
					}),
				),
			},
		},
	};

	async handle(c: AppContext) {
		const db = c.env.DB;
		const body = await c.req.json();
		const id = crypto.randomUUID().replace(/-/g, "").slice(0, 10);
		await db
			.prepare("INSERT INTO crons (id, minute, hour, day, month, weekday, command, comment) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
			.bind(id, body.minute, body.hour, body.day, body.month, body.weekday, body.command, body.comment ?? "")
			.run();
		return c.json({ id, message: "Cron設定を追加しました" });
	}
}

export class CronUpdate extends XServerMock {
	schema = {
		tags: ["Cron設定"],
		summary: "Cronを変更",
		description:
			"既存のCron設定を変更します。送信した項目のみ更新されます。",
		request: {
			params: z.object({
				cron_id: z.string().describe("CronのハッシュID"),
			}),
			body: contentJson(
				z.object({
					minute: z.string().optional().describe("分"),
					hour: z.string().optional().describe("時"),
					day: z.string().optional().describe("日"),
					month: z.string().optional().describe("月"),
					weekday: z.string().optional().describe("曜日"),
					command: z.string().optional().describe("実行コマンド"),
					comment: z.string().optional().describe("コメント"),
					enabled: z.boolean().optional().describe("有効/無効"),
				}),
			),
		},
		responses: {
			"200": {
				description: "成功",
				...contentJson(
					z.object({
						id: z.string(),
						message: z.string(),
					}),
				),
			},
		},
	};

	async handle(c: AppContext) {
		const db = c.env.DB;
		const cronId = c.req.param("cron_id");
		const body = await c.req.json();
		const fields: string[] = [];
		const values: any[] = [];
		for (const key of ["minute", "hour", "day", "month", "weekday", "command", "comment"]) {
			if (body[key] !== undefined) {
				fields.push(`${key} = ?`);
				values.push(body[key]);
			}
		}
		if (body.enabled !== undefined) {
			fields.push("enabled = ?");
			values.push(body.enabled ? 1 : 0);
		}
		if (fields.length > 0) {
			values.push(cronId);
			await db.prepare(`UPDATE crons SET ${fields.join(", ")} WHERE id = ?`).bind(...values).run();
		}
		return c.json({ id: cronId, message: "Cron設定を変更しました" });
	}
}

export class CronDelete extends XServerMock {
	schema = {
		tags: ["Cron設定"],
		summary: "Cronを削除",
		request: {
			params: z.object({
				cron_id: z.string().describe("CronのハッシュID"),
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
		const cronId = c.req.param("cron_id");
		await db.prepare("DELETE FROM crons WHERE id = ?").bind(cronId).run();
		return c.json({ message: "Cron設定を削除しました" });
	}
}
