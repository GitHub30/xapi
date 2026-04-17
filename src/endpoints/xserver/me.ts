import { contentJson, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../../types";

export class MeGet extends OpenAPIRoute {
	schema = {
		tags: ["APIキー情報"],
		summary: "認証中のAPIキー情報を取得",
		description:
			"現在認証に使用しているAPIキーの情報を返します。有効期限・紐づくサーバー名・権限種別を確認できます。",
		responses: {
			"200": {
				description: "OK",
				...contentJson(
					z.object({
						service_type: z.string().describe("APIキーのサービス種別（server）"),
						expires_at: z.string().nullable().describe("有効期限（ISO 8601形式）。無期限の場合は null"),
						servername: z.string().describe("紐づくサーバー名（初期ドメイン）"),
						permission_type: z.string().describe("権限種別（full / read / custom）"),
					}),
				),
			},
		},
	};

	async handle(c: AppContext) {
		return c.json({
			service_type: "server",
			expires_at: null,
			servername: "xs999999.xsrv.jp",
			permission_type: "full",
		});
	}
}
