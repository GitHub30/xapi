import { contentJson } from "chanfana";
import { z } from "zod";
import { XServerMock } from "./proxy";

export class ServerInfoGet extends XServerMock {
	mockResponse = {
		server_id: "xs123456",
		hostname: "sv12345.xserver.jp",
		ip_address: "123.45.67.89",
		os: "Linux",
		cpu: "AMD EPYC 9534( 2.45GHz ) x 2",
		memory: "1536GB",
		apache_version: "2.4.x",
		perl_versions: ["5.26", "5.16"],
		php_versions: ["8.5.2", "8.4.12", "8.3.21", "8.2.28", "7.4.33", "7.3.33"],
		db_versions: ["mariadb10.5.x"],
		name_servers: ["ns1.xserver.jp", "ns2.xserver.jp", "ns3.xserver.jp", "ns4.xserver.jp", "ns5.xserver.jp"],
		domain_validation_token: "a1b2c3d4e5f6...",
	};

	schema = {
		tags: ["サーバー情報"],
		summary: "サーバー情報を取得",
		description:
			"サーバーのスペック・ソフトウェアバージョン・ネームサーバーなどの基本情報を返します。",
		responses: {
			"200": {
				description: "成功",
				...contentJson(
					z.object({
						server_id: z.string(),
						hostname: z.string(),
						ip_address: z.string(),
						os: z.string(),
						cpu: z.string().nullable(),
						memory: z.string().nullable(),
						apache_version: z.string(),
						perl_versions: z.array(z.string()),
						php_versions: z.array(z.string()),
						db_versions: z.array(z.string()),
						name_servers: z.array(z.string()),
						domain_validation_token: z.string(),
					}),
				),
			},
		},
	};
}

export class ServerInfoUsageGet extends XServerMock {
	mockResponse = {
		disk: {
			quota_gb: 500,
			used_gb: 200,
			file_limit: 0,
			file_count: 12345,
		},
		counts: {
			domains: 3,
			subdomains: 2,
			mail_accounts: 5,
			ftp_accounts: 2,
			mysql_databases: 4,
		},
	};

	schema = {
		tags: ["サーバー情報"],
		summary: "サーバー利用状況を取得",
		description:
			"ディスク使用量・ファイル数・各種設定件数を返します。",
		responses: {
			"200": {
				description: "成功",
				...contentJson(
					z.object({
						disk: z.object({
							quota_gb: z.number(),
							used_gb: z.number(),
							file_limit: z.number().int(),
							file_count: z.number().int(),
						}),
						counts: z.object({
							domains: z.number().int(),
							subdomains: z.number().int(),
							mail_accounts: z.number().int(),
							ftp_accounts: z.number().int(),
							mysql_databases: z.number().int(),
						}),
					}),
				),
			},
		},
	};
}
