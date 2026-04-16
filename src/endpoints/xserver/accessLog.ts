import { contentJson } from "chanfana";
import { z } from "zod";
import { XServerMock } from "./proxy";
import type { AppContext } from "../../types";

const fmt = new Intl.DateTimeFormat("en-GB", {
	day: "2-digit", month: "short", year: "numeric",
	hour: "2-digit", minute: "2-digit", second: "2-digit",
	hour12: false, timeZone: "Asia/Tokyo",
});

function apacheDate(d: Date): string {
	const parts = Object.fromEntries(fmt.formatToParts(d).map(({ type, value }) => [type, value]));
	return `${parts.day}/${parts.month}/${parts.year}:${parts.hour}:${parts.minute}:${parts.second} +0900`;
}

export class AccessLogGet extends XServerMock {

	async handle(c: AppContext) {
		const domain = c.req.query("domain") ?? "example.com";
		const keyword = c.req.query("keyword");
		const lines = Number(c.req.query("lines") ?? 7);

		const now = new Date();
		const d = (h: number, m: number, s: number) =>
			new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, s);

		const allLines = [
			`www.${domain} 44.209.43.227 - - [${apacheDate(d(4, 58, 13))}] "GET / HTTP/1.1" 200 1989 "-" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"`,
			`${domain} 46.228.199.158 - - [${apacheDate(d(5, 3, 44))}] "GET / HTTP/1.1" 200 1989 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36 Edg/91.0.864.54"`,
			`www.${domain} 210.156.22.190 - - [${apacheDate(d(6, 24, 52))}] "GET /6830853 HTTP/2.0" 200 326 "https://nihonkai.app.toribiz.digi-syacho.com/" "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.3 Mobile/15E148 Safari/604.1"`,
			`www.${domain} 210.156.22.190 - - [${apacheDate(d(6, 24, 52))}] "GET /6830853 HTTP/2.0" 200 326 "https://nihonkai.app.toribiz.digi-syacho.com/" "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.3 Mobile/15E148 Safari/604.1"`,
			`${domain} 20.63.103.29 - - [${apacheDate(d(7, 19, 29))}] "GET /wp-content/plugins/hellopress/wp_filemanager.php HTTP/1.1" 404 157 "-" "-"`,
			`${domain} 20.63.103.29 - - [${apacheDate(d(7, 19, 29))}] "GET /rip.php HTTP/1.1" 404 157 "-" "-"`,
			`${domain} 20.63.103.29 - - [${apacheDate(d(7, 19, 30))}] "GET /index.php HTTP/1.1" 404 157 "-" "-"`,
		];

		let filtered = keyword
			? allLines.filter((l) => l.includes(keyword))
			: allLines;
		filtered = filtered.slice(-lines);

		return c.json({ domain, log: filtered.join("\n") });
	}

	schema = {
		tags: ["アクセスログ"],
		summary: "アクセスログを取得",
		description:
			"指定ドメインのアクセスログを取得します。",
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
							log: 'www.example.com 44.209.43.227 - - [14/Apr/2026:04:58:13 +0900] "GET / HTTP/1.1" 200 1989 "-" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"\nexample.com 46.228.199.158 - - [14/Apr/2026:05:03:44 +0900] "GET / HTTP/1.1" 200 1989 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36 Edg/91.0.864.54"\nwww.example.com 210.156.22.190 - - [14/Apr/2026:06:24:52 +0900] "GET /6830853 HTTP/2.0" 200 326 "https://nihonkai.app.toribiz.digi-syacho.com/" "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.3 Mobile/15E148 Safari/604.1"\nwww.example.com 210.156.22.190 - - [14/Apr/2026:06:24:52 +0900] "GET /6830853 HTTP/2.0" 200 326 "https://nihonkai.app.toribiz.digi-syacho.com/" "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.3 Mobile/15E148 Safari/604.1"\nexample.com 20.63.103.29 - - [14/Apr/2026:07:19:29 +0900] "GET /wp-content/plugins/hellopress/wp_filemanager.php HTTP/1.1" 404 157 "-" "-"\nexample.com 20.63.103.29 - - [14/Apr/2026:07:19:29 +0900] "GET /rip.php HTTP/1.1" 404 157 "-" "-"\nexample.com 20.63.103.29 - - [14/Apr/2026:07:19:30 +0900] "GET /index.php HTTP/1.1" 404 157 "-" "-"',
						},
					}),
				),
			},
		},
	};
}
