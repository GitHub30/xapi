import { OpenAPIRoute } from "chanfana";
import type { OpenAPIRouteSchema } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../../types";

export class XServerMock extends OpenAPIRoute {
	mockResponse: Record<string, unknown> = {};

	getSchemaZod(): OpenAPIRouteSchema {
		const schema = super.getSchemaZod();
		// /v1/server/:servername 配下のルートに servername パスパラメータを自動追加
		const servernameParam = z.string().default("xs999999.xsrv.jp").describe("サーバー名（初期ドメイン）");
		if (schema.request?.params) {
			schema.request.params = (schema.request.params as z.ZodObject<any>).extend({
				servername: servernameParam,
			});
		} else {
			schema.request = {
				...schema.request,
				params: z.object({
					servername: servernameParam,
				}),
			};
		}
		return schema;
	}

	async handle(c: AppContext) {
		return c.json(this.mockResponse);
	}
}
