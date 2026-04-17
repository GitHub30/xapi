import { Hono } from "hono";
import { fromHono } from "chanfana";

// APIキー情報
import { MeGet } from "./me";
// サーバー情報
import { ServerInfoGet, ServerInfoUsageGet } from "./serverInfo";
// Cron設定
import { CronList, CronCreate, CronUpdate, CronDelete } from "./cron";
// WordPress
import { WpList, WpCreate, WpUpdate, WpDelete } from "./wp";
// メールアカウント
import {
	MailList,
	MailRead,
	MailCreate,
	MailUpdate,
	MailDelete,
	MailForwardingGet,
	MailForwardingUpdate,
} from "./mail";
// メール振り分け
import {
	MailFilterList,
	MailFilterCreate,
	MailFilterDelete,
} from "./mailFilter";
// FTPアカウント
import { FtpList, FtpCreate, FtpUpdate, FtpDelete } from "./ftp";
// MySQL
import {
	DbList,
	DbCreate,
	DbUpdate,
	DbDelete,
	DbUserList,
	DbUserCreate,
	DbUserUpdate,
	DbUserDelete,
	DbUserGrantGet,
	DbUserGrantCreate,
	DbUserGrantDelete,
} from "./db";
// PHPバージョン
import { PhpVersionGet, PhpVersionUpdate } from "./phpVersion";
// ドメイン設定
import {
	DomainList,
	DomainRead,
	DomainCreate,
	DomainUpdate,
	DomainDelete,
	DomainReset,
} from "./domain";
// サブドメイン
import {
	SubdomainList,
	SubdomainCreate,
	SubdomainUpdate,
	SubdomainDelete,
} from "./subdomain";
// SSL設定
import { SslList, SslCreate, SslDelete } from "./ssl";
// DNSレコード
import { DnsList, DnsCreate, DnsUpdate, DnsDelete } from "./dns";
// アクセスログ
import { AccessLogGet } from "./accessLog";
// エラーログ
import { ErrorLogGet } from "./errorLog";

export const xserverApp = new Hono();
export const xserverRouter = fromHono(xserverApp);

// サーバー情報
xserverRouter.get("/server-info", ServerInfoGet);
xserverRouter.get("/server-info/usage", ServerInfoUsageGet);

// Cron設定
xserverRouter.get("/cron", CronList);
xserverRouter.post("/cron", CronCreate);
xserverRouter.put("/cron/:cron_id", CronUpdate);
xserverRouter.delete("/cron/:cron_id", CronDelete);

// WordPress簡単インストール
xserverRouter.get("/wp", WpList);
xserverRouter.post("/wp", WpCreate);
xserverRouter.put("/wp/:wp_id", WpUpdate);
xserverRouter.delete("/wp/:wp_id", WpDelete);

// メールアカウント
xserverRouter.get("/mail", MailList);
xserverRouter.post("/mail", MailCreate);
xserverRouter.get("/mail/:mail_account", MailRead);
xserverRouter.put("/mail/:mail_account", MailUpdate);
xserverRouter.delete("/mail/:mail_account", MailDelete);
xserverRouter.get("/mail/:mail_account/forwarding", MailForwardingGet);
xserverRouter.put("/mail/:mail_account/forwarding", MailForwardingUpdate);

// メール振り分け
xserverRouter.get("/mail-filter", MailFilterList);
xserverRouter.post("/mail-filter", MailFilterCreate);
xserverRouter.delete("/mail-filter/:filter_id", MailFilterDelete);

// FTPアカウント
xserverRouter.get("/ftp", FtpList);
xserverRouter.post("/ftp", FtpCreate);
xserverRouter.put("/ftp/:ftp_account", FtpUpdate);
xserverRouter.delete("/ftp/:ftp_account", FtpDelete);

// MySQL データベース
xserverRouter.get("/db", DbList);
xserverRouter.post("/db", DbCreate);
xserverRouter.put("/db/:db_name", DbUpdate);
xserverRouter.delete("/db/:db_name", DbDelete);

// MySQL ユーザー
xserverRouter.get("/db/user", DbUserList);
xserverRouter.post("/db/user", DbUserCreate);
xserverRouter.put("/db/user/:db_user", DbUserUpdate);
xserverRouter.delete("/db/user/:db_user", DbUserDelete);

// MySQL 権限
xserverRouter.get("/db/user/:db_user/grant", DbUserGrantGet);
xserverRouter.post("/db/user/:db_user/grant", DbUserGrantCreate);
xserverRouter.delete("/db/user/:db_user/grant", DbUserGrantDelete);

// PHPバージョン
xserverRouter.get("/php-version", PhpVersionGet);
xserverRouter.put("/php-version/:domain", PhpVersionUpdate);

// ドメイン設定
xserverRouter.get("/domain", DomainList);
xserverRouter.post("/domain", DomainCreate);
xserverRouter.get("/domain/:domain", DomainRead);
xserverRouter.put("/domain/:domain", DomainUpdate);
xserverRouter.delete("/domain/:domain", DomainDelete);
xserverRouter.post("/domain/:domain/reset", DomainReset);

// サブドメイン
xserverRouter.get("/subdomain", SubdomainList);
xserverRouter.post("/subdomain", SubdomainCreate);
xserverRouter.put("/subdomain/:subdomain", SubdomainUpdate);
xserverRouter.delete("/subdomain/:subdomain", SubdomainDelete);

// SSL設定
xserverRouter.get("/ssl", SslList);
xserverRouter.post("/ssl", SslCreate);
xserverRouter.delete("/ssl/:common_name", SslDelete);

// DNSレコード
xserverRouter.get("/dns", DnsList);
xserverRouter.post("/dns", DnsCreate);
xserverRouter.put("/dns/:dns_id", DnsUpdate);
xserverRouter.delete("/dns/:dns_id", DnsDelete);

// アクセスログ
xserverRouter.get("/access-log", AccessLogGet);

// エラーログ
xserverRouter.get("/error-log", ErrorLogGet);
