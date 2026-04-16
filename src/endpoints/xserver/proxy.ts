import { OpenAPIRoute } from "chanfana";
import type { AppContext } from "../../types";

export class XServerMock extends OpenAPIRoute {
	mockResponse: Record<string, unknown> = {};

	async handle(c: AppContext) {
		return c.json(this.mockResponse);
	}
}
