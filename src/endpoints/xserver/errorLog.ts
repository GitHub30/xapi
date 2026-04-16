import { contentJson } from "chanfana";
import { z } from "zod";
import { XServerMock } from "./proxy";
import type { AppContext } from "../../types";

function apacheDate(d: Date): string {
	const us = String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
	const [dow, mon, dd, year] = d.toDateString().split(" ");
	const time = d.toTimeString().slice(0, 8);
	return `${dow} ${mon} ${dd} ${time}.${us} ${year}`;
}

export class ErrorLogGet extends XServerMock {

	async handle(c: AppContext) {
		const domain = c.req.query("domain") ?? "example.com";
		const keyword = c.req.query("keyword");
		const lines = Number(c.req.query("lines") ?? 5);

		const now = new Date();
		const base = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 8);

		const allLines = [
			`[${apacheDate(new Date(base.getTime() + 0))}] [fcgid:warn] [pid 2598001:tid 2598039] [client 14.246.0.23:51058] mod_fcgid: stderr: PHP Warning:  Attempt to read property "error_code" on null in /home/xs123456/xs123456.xsrv.jp/public_html/zalo/index.php on line 37`,
			`[${apacheDate(new Date(base.getTime() + 47))}] [fcgid:warn] [pid 2598001:tid 2598039] [client 14.246.0.23:51058] mod_fcgid: stderr: PHP Warning:  Attempt to read property "data" on null in /home/xs123456/xs123456.xsrv.jp/public_html/zalo/index.php on line 42`,
			`[${apacheDate(new Date(base.getTime() + 51))}] [fcgid:warn] [pid 2598001:tid 2598039] [client 14.246.0.23:51058] mod_fcgid: stderr: PHP Warning:  Attempt to read property "url" on null in /home/xs123456/xs123456.xsrv.jp/public_html/zalo/index.php on line 42`,
			`[${apacheDate(new Date(base.getTime() + 52))}] [fcgid:warn] [pid 2598001:tid 2598039] [client 14.246.0.23:51058] mod_fcgid: stderr: PHP Warning:  readfile(0c33484765c9513fc0ef06627e1ac9ba.mp3): Failed to open stream: No such file or directory in /home/xs123456/xs123456.xsrv.jp/public_html/zalo/index.php on line 74`,
			`[${apacheDate(new Date(base.getTime() + 1301))}] [fcgid:warn] [pid 2598001:tid 2598128] [client 14.246.0.23:51078] mod_fcgid: stderr: PHP Warning:  Attempt to read property "error_code" on null in /home/xs123456/xs123456.xsrv.jp/public_html/zalo/index.php on line 37`,
		];

		let filtered = keyword
			? allLines.filter((l) => l.includes(keyword))
			: allLines;
		filtered = filtered.slice(-lines);

		return c.json({ domain, log: filtered.join("\n") });
	}

	schema = {
		tags: ["エラーログ"],
		summary: "エラーログを取得",
		description:
			"指定ドメインのエラーログを取得します。",
		request: {
			query: z.object({
				domain: z.string().describe("ドメイン"),
				lines: z
					.coerce.number()
					.int()
					.optional()
					.describe("取得行数（末尾から）"),
				keyword: z
					.string()
					.optional()
					.describe("絞り込みキーワード"),
			}),
		},
		responses: {
			"200": {
				description: "成功",
				...contentJson(
					z.object({
						domain: z.string(),
						log: z.string(),
					}).openapi({
						example: {
							domain: "example.com",
							log: '[Tue Apr 14 09:00:08.553760 2026] [fcgid:warn] [pid 2598001:tid 2598039] [client 14.246.0.23:51058] mod_fcgid: stderr: PHP Warning:  Attempt to read property "error_code" on null in /home/xs123456/xs123456.xsrv.jp/public_html/zalo/index.php on line 37\n[Tue Apr 14 09:00:08.553807 2026] [fcgid:warn] [pid 2598001:tid 2598039] [client 14.246.0.23:51058] mod_fcgid: stderr: PHP Warning:  Attempt to read property "data" on null in /home/xs123456/xs123456.xsrv.jp/public_html/zalo/index.php on line 42\n[Tue Apr 14 09:00:08.553811 2026] [fcgid:warn] [pid 2598001:tid 2598039] [client 14.246.0.23:51058] mod_fcgid: stderr: PHP Warning:  Attempt to read property "url" on null in /home/xs123456/xs123456.xsrv.jp/public_html/zalo/index.php on line 42\n[Tue Apr 14 09:00:08.553812 2026] [fcgid:warn] [pid 2598001:tid 2598039] [client 14.246.0.23:51058] mod_fcgid: stderr: PHP Warning:  readfile(0c33484765c9513fc0ef06627e1ac9ba.mp3): Failed to open stream: No such file or directory in /home/xs123456/xs123456.xsrv.jp/public_html/zalo/index.php on line 74\n[Tue Apr 14 09:00:09.855074 2026] [fcgid:warn] [pid 2598001:tid 2598128] [client 14.246.0.23:51078] mod_fcgid: stderr: PHP Warning:  Attempt to read property "error_code" on null in /home/xs123456/xs123456.xsrv.jp/public_html/zalo/index.php on line 37',
						},
					}),
				),
			},
		},
	};
}
