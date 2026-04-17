import { ApiException, fromHono, getSwaggerUI } from "chanfana";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { xserverRouter, xserverApp } from "./endpoints/xserver/router";
import { MeGet } from "./endpoints/xserver/me";
import { ContentfulStatusCode } from "hono/utils/http-status";

// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

app.use("*", cors());

app.onError((err, c) => {
	if (err instanceof ApiException) {
		// If it's a Chanfana ApiException, let Chanfana handle the response
		return c.json(
			{ success: false, errors: err.buildResponse() },
			err.status as ContentfulStatusCode,
		);
	}

	console.error("Global error handler caught:", err); // Log the error if it's not known

	// For other errors, return a generic 500 response
	return c.json(
		{
			success: false,
			errors: [{ code: 7000, message: "Internal Server Error" }],
		},
		500,
	);
});

// Custom Swagger UI with title and GitHub ribbon
app.get("/", (c) => {
	const html = getSwaggerUI("/openapi.json")
		.replace("<title>SwaggerUI</title>", "<title>XServer API</title>")
		.replace(
			"</head>",
			`<meta property="og:title" content="XServer API"><meta property="og:description" content="XServer API(非公式)のモックとドキュメント"><meta property="og:type" content="website"><meta property="og:image" content="https://i.imgur.com/tx1Ro7f.png"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="https://i.imgur.com/tx1Ro7f.png"><style>.github-corner:hover .octo-arm{animation:octocat-wave 560ms ease-in-out}@keyframes octocat-wave{0%,100%{transform:rotate(0)}20%,60%{transform:rotate(-25deg)}40%,80%{transform:rotate(10deg)}}@media (max-width:500px){.github-corner:hover .octo-arm{animation:none}.github-corner .octo-arm{animation:octocat-wave 560ms ease-in-out}}</style></head>`,
		)
		.replace(
			"<body>",
			`<body><img src="https://i.imgur.com/c8aHyTO.png" style="position: absolute;width: 10vw;max-width: 200px;right: 0;z-index: 1;"><a href="https://github.com/GitHub30/xapi" class="github-corner" aria-label="View source on GitHub"><svg width="80" height="80" viewBox="0 0 250 250" style="fill:#151513; color:#fff; position: absolute; top: 0; border: 0; right: 0; z-index: 9999;" aria-hidden="true"><path d="M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z"></path><path d="M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2" fill="currentColor" style="transform-origin: 130px 106px;" class="octo-arm"></path><path d="M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.2,141.5 141.3,141.4 Z" fill="currentColor" class="octo-body"></path></svg></a>`,
		);
	return c.html(html);
});

// Setup OpenAPI registry
const openapi = fromHono(app, {
	docs_url: null,
	schema: {
		info: {
			title: "XServer API (非公式)",
			version: "1.0.0",
			description: 'XServer Console (非公式) <a href="https://github30.github.io/xconsole" target="_blank">https://github30.github.io/xconsole</a>',
		},
		servers: [
			{
				url: "https://cors.ix.workers.dev/api.xserver.ne.jp",
				description: "XServer API 本番",
			},
			{
				url: "/",
				description: "XServer API モックサーバー",
			},
		],
		security: [{ bearerAuth: [] }],
	},
});

openapi.registry.registerComponent("securitySchemes", "bearerAuth", {
	type: "http",
	scheme: "bearer",
	description: "XServer APIキーを入力してください",
});

// /v1/me endpoint (outside /v1/server/:servername)
openapi.get("/v1/me", MeGet);

// Register XServer API mock
openapi.route("/v1/server/:servername", xserverRouter);
app.route("/v1/server/:servername", xserverApp);


// Export the Hono app
export default app;
