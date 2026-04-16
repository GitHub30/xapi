import { contentJson } from "chanfana";
import { z } from "zod";
import { XServerMock } from "./proxy";
import type { AppContext } from "../../types";

const AVAILABLE_VERSIONS: Record<string, string> = {
	"8.5": "PHP8.5.2",
	"8.4": "PHP8.4.12",
	"8.3": "PHP8.3.21（推奨）",
	"8.2": "PHP8.2.28（非推奨）",
	"8.1": "PHP8.1.32（非推奨）",
	"8.0": "PHP8.0.30（非推奨）",
	"7.4": "PHP7.4.33（非推奨）",
	"7.3": "PHP7.3.33（非推奨）",
	"7.2": "PHP7.2.34（非推奨）",
	"7.1": "PHP7.1.33（非推奨）",
	"7.0": "PHP7.0.33（非推奨）",
	"5.6": "PHP5.6.40（非推奨）",
	"5.5": "PHP5.5.38（非推奨）",
	"5.4": "PHP5.4.16（非推奨）",
	"5.3": "PHP5.3.3（非推奨）",
	"5.1": "PHP5.1.6（非推奨）",
};

export class PhpVersionGet extends XServerMock {
	schema = {
		tags: ["PHPバージョン"],
		summary: "PHPバージョン設定を取得",
		description:
			"選択可能なPHPバージョン一覧と、ドメインごとの現在のバージョンを返します。",
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
						available_versions: z.record(z.string(), z.string()).describe("選択可能なPHPバージョン。キーがバージョン番号、値が表示名称"),
						domains: z.array(
							z.object({
								domain: z.string(),
								current_version: z.string(),
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
		let sql = "SELECT domain, current_version FROM php_versions";
		if (domain) {
			sql += " WHERE domain = ?";
			bindings.push(domain);
		}
		const { results } = await db.prepare(sql).bind(...bindings).all();
		return c.json({
			available_versions: AVAILABLE_VERSIONS,
			domains: results,
		});
	}
}

export class PhpVersionUpdate extends XServerMock {
	schema = {
		tags: ["PHPバージョン"],
		summary: "PHPバージョンを変更",
		description:
			"指定ドメインのPHPバージョンを変更します。",
		request: {
			params: z.object({
				domain: z.string().describe("ドメイン名"),
			}),
			body: contentJson(
				z.object({
					version: z.string().describe("PHPバージョン（例: 8.2）"),
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
		const domain = c.req.param("domain");
		const body = await c.req.json();
		await db
			.prepare("INSERT INTO php_versions (domain, current_version) VALUES (?, ?) ON CONFLICT(domain) DO UPDATE SET current_version = excluded.current_version")
			.bind(domain, body.version)
			.run();
		return c.json({ message: "PHPバージョンを変更しました" });
	}
}
