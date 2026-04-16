-- Migration number: 0002 	 2025-06-20T00:00:00.000Z

-- Cron設定
CREATE TABLE IF NOT EXISTS crons (
    id TEXT PRIMARY KEY NOT NULL,
    minute TEXT NOT NULL,
    hour TEXT NOT NULL,
    day TEXT NOT NULL,
    month TEXT NOT NULL,
    weekday TEXT NOT NULL,
    command TEXT NOT NULL,
    comment TEXT NOT NULL DEFAULT '',
    enabled INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS cron_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    notification_email TEXT NOT NULL DEFAULT ''
);

-- WordPress簡単インストール
CREATE TABLE IF NOT EXISTS wordpress (
    id TEXT PRIMARY KEY NOT NULL,
    domain TEXT NOT NULL,
    url TEXT NOT NULL,
    title TEXT NOT NULL,
    version TEXT NOT NULL DEFAULT '6.4.2',
    db_name TEXT NOT NULL DEFAULT '',
    db_user TEXT NOT NULL DEFAULT '',
    memo TEXT NOT NULL DEFAULT ''
);

-- メールアカウント
CREATE TABLE IF NOT EXISTS mail_accounts (
    mail_address TEXT PRIMARY KEY NOT NULL,
    password TEXT NOT NULL,
    quota_mb INTEGER NOT NULL DEFAULT 2000,
    used_mb REAL NOT NULL DEFAULT 0,
    memo TEXT NOT NULL DEFAULT ''
);

-- メール転送設定
CREATE TABLE IF NOT EXISTS mail_forwarding (
    mail_address TEXT PRIMARY KEY NOT NULL,
    forwarding_addresses TEXT NOT NULL DEFAULT '[]',
    keep_in_mailbox INTEGER NOT NULL DEFAULT 1
);

-- メール振り分け
CREATE TABLE IF NOT EXISTS mail_filters (
    id TEXT PRIMARY KEY NOT NULL,
    domain TEXT NOT NULL,
    priority INTEGER NOT NULL,
    conditions TEXT NOT NULL DEFAULT '[]',
    action_type TEXT NOT NULL,
    action_target TEXT NOT NULL DEFAULT '',
    action_method TEXT NOT NULL
);

-- FTPアカウント
CREATE TABLE IF NOT EXISTS ftp_accounts (
    ftp_account TEXT PRIMARY KEY NOT NULL,
    password TEXT NOT NULL,
    directory TEXT NOT NULL DEFAULT '/',
    quota_mb INTEGER NOT NULL DEFAULT 0,
    memo TEXT NOT NULL DEFAULT ''
);

-- MySQLデータベース
CREATE TABLE IF NOT EXISTS mysql_databases (
    db_name TEXT PRIMARY KEY NOT NULL,
    version_name TEXT NOT NULL DEFAULT 'MariaDB10.5',
    size_mb REAL NOT NULL DEFAULT 0,
    character_set TEXT NOT NULL DEFAULT 'utf8mb4',
    memo TEXT NOT NULL DEFAULT ''
);

-- MySQLユーザー
CREATE TABLE IF NOT EXISTS mysql_users (
    db_user TEXT PRIMARY KEY NOT NULL,
    version_name TEXT NOT NULL DEFAULT 'MariaDB10.5',
    password TEXT NOT NULL,
    memo TEXT NOT NULL DEFAULT ''
);

-- MySQL権限
CREATE TABLE IF NOT EXISTS mysql_grants (
    db_user TEXT NOT NULL,
    db_name TEXT NOT NULL,
    PRIMARY KEY (db_user, db_name)
);

-- PHPバージョン設定
CREATE TABLE IF NOT EXISTS php_versions (
    domain TEXT PRIMARY KEY NOT NULL,
    current_version TEXT NOT NULL DEFAULT '8.2'
);

-- ドメイン設定
CREATE TABLE IF NOT EXISTS domains (
    domain TEXT PRIMARY KEY NOT NULL,
    type TEXT NOT NULL DEFAULT 'addon',
    document_root TEXT NOT NULL DEFAULT '',
    url TEXT NOT NULL DEFAULT '',
    php_version TEXT NOT NULL DEFAULT '8.3',
    ssl INTEGER NOT NULL DEFAULT 1,
    memo TEXT NOT NULL DEFAULT '',
    is_awaiting INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT ''
);

-- サブドメイン
CREATE TABLE IF NOT EXISTS subdomains (
    subdomain TEXT PRIMARY KEY NOT NULL,
    domain TEXT NOT NULL,
    document_root TEXT NOT NULL DEFAULT '',
    ssl INTEGER NOT NULL DEFAULT 1,
    memo TEXT NOT NULL DEFAULT ''
);

-- SSL設定
CREATE TABLE IF NOT EXISTS ssl_certificates (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    common_name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'letsencrypt',
    expires_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active'
);

-- DNSレコード
CREATE TABLE IF NOT EXISTS dns_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    domain TEXT NOT NULL,
    host TEXT NOT NULL DEFAULT '@',
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    ttl INTEGER NOT NULL DEFAULT 3600,
    priority INTEGER
);
