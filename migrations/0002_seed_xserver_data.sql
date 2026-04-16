-- Migration number: 0003 	 2025-06-20T00:00:01.000Z

-- Cron seed
INSERT INTO cron_settings (id, notification_email) VALUES (1, 'admin@example.com');

INSERT INTO crons (id, minute, hour, day, month, weekday, command, comment, enabled)
VALUES ('a1b2c3d4e5', '*/5', '*', '*', '*', '*', '/usr/bin/php /home/user/cron.php', '5分毎のバッチ処理', 1);

-- WordPress seed
INSERT INTO wordpress (id, domain, url, title, version, db_name, db_user, memo)
VALUES ('a1b2c3d4e5f6g7h8', 'example.com', 'http://example.com/blog', 'My Blog', '6.4.2', 'xs_db01', 'xs_user01', 'ブログ用');

-- メールアカウント seed
INSERT INTO mail_accounts (mail_address, password, quota_mb, used_mb, memo)
VALUES ('info@example.com', 'SecurePass123', 2000, 12.5, '問い合わせ用');

INSERT INTO mail_forwarding (mail_address, forwarding_addresses, keep_in_mailbox)
VALUES ('info@example.com', '["forward1@example.com","forward2@example.com"]', 1);

-- メール振り分け seed
INSERT INTO mail_filters (id, domain, priority, conditions, action_type, action_target, action_method)
VALUES ('f1a2b3c4', 'example.com', 1, '[{"keyword":"aaa","field":"from","match_type":"match"}]', 'spam_folder', '', 'copy');

INSERT INTO mail_filters (id, domain, priority, conditions, action_type, action_target, action_method)
VALUES ('e5f67890', 'example.com', 2, '[{"keyword":"test","field":"from","match_type":"match"},{"keyword":"info","field":"to","match_type":"match"}]', 'spam_folder', '', 'copy');

-- FTPアカウント seed
INSERT INTO ftp_accounts (ftp_account, password, directory, quota_mb, memo)
VALUES ('ftpuser@example.com', 'FtpPass123!', '/public_html', 5000, '開発用');

-- MySQL seed
INSERT INTO mysql_databases (db_name, version_name, size_mb, memo)
VALUES ('xs12345_db01', 'MariaDB10.5', 128.5, '本番用DB');

INSERT INTO mysql_users (db_user, version_name, password, memo)
VALUES ('xs12345_user01', 'MariaDB10.5', 'DbPass123!', 'WP用ユーザー');

INSERT INTO mysql_grants (db_user, db_name)
VALUES ('xs12345_user01', 'xs12345_db01');

-- PHPバージョン seed
INSERT INTO php_versions (domain, current_version)
VALUES ('example.com', '8.2');

-- ドメイン seed
INSERT INTO domains (domain, type, document_root, url, php_version, ssl, memo, is_awaiting, created_at)
VALUES ('example.com', 'addon', '/home/xs12345/example.com/public_html', 'https://example.com/', '8.3', 1, '', 0, '2024-01-15');

-- サブドメイン seed
INSERT INTO subdomains (subdomain, domain, document_root, ssl, memo)
VALUES ('blog.example.com', 'example.com', '/home/user/blog.example.com/public_html', 1, 'ブログ用');

-- SSL seed
INSERT INTO ssl_certificates (common_name, type, expires_at, status)
VALUES ('example.com', 'letsencrypt', '2024-12-31T23:59:59+09:00', 'active');

-- DNS seed
INSERT INTO dns_records (domain, host, type, content, ttl, priority)
VALUES ('example.com', '@', 'A', '123.45.67.89', 3600, NULL);
