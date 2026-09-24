-- PAFUL QR — Admin Panel schema (Phase 1)
-- Safe to re-run: CREATE ... IF NOT EXISTS throughout. Seed data uses
-- INSERT IGNORE / ON DUPLICATE KEY so re-running never duplicates rows.

CREATE DATABASE IF NOT EXISTS paful_qr_admin
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE paful_qr_admin;

-- ---------------------------------------------------------------------
-- Roles / permissions / admins
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS roles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  is_system TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS permissions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INT UNSIGNED NOT NULL,
  permission_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS admins (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role_id INT UNSIGNED NOT NULL,
  status ENUM('active','disabled') NOT NULL DEFAULT 'active',
  last_login_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- Auth support: rate limiting + password resets
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS login_attempts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  success TINYINT(1) NOT NULL DEFAULT 0,
  attempted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_login_attempts_lookup (email, ip_address, attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS password_resets (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  admin_id INT UNSIGNED NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- Activity log
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  admin_id INT UNSIGNED NULL,
  admin_name_snapshot VARCHAR(120) NULL,
  action VARCHAR(60) NOT NULL,
  module VARCHAR(60) NOT NULL,
  record_id VARCHAR(60) NULL,
  description VARCHAR(255) NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_activity_admin (admin_id),
  INDEX idx_activity_module (module),
  INDEX idx_activity_created (created_at),
  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- Site settings (key/value — General, Branding, SEO, Social)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS site_settings (
  `key` VARCHAR(100) NOT NULL PRIMARY KEY,
  `value` TEXT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- Donate page
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS donate_settings (
  id TINYINT UNSIGNED NOT NULL PRIMARY KEY DEFAULT 1,
  heading VARCHAR(160) NOT NULL DEFAULT 'Support Paful Multi Services',
  description TEXT NULL,
  payment_section_title VARCHAR(120) NOT NULL DEFAULT 'we accept',
  instructions TEXT NULL,
  thank_you_message VARCHAR(255) NULL,
  ussd_code VARCHAR(40) NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS donate_payment_methods (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  method_key VARCHAR(40) NOT NULL UNIQUE,
  display_name VARCHAR(80) NOT NULL,
  account_name VARCHAR(120) NULL,
  account_number VARCHAR(80) NULL,
  description VARCHAR(255) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- FAQ
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS faqs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  question VARCHAR(255) NOT NULL,
  answer TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- QR types (mirrors the type keys already used in js/qr-generator.js)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS qr_types (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  type_key VARCHAR(30) NOT NULL UNIQUE,
  name VARCHAR(80) NOT NULL,
  description VARCHAR(255) NULL,
  icon VARCHAR(60) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- QR templates (drives templates.html's preset gallery) + global QR
-- generation defaults (drives the main generator's starting values).
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS qr_templates (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  category VARCHAR(60) NOT NULL,
  description VARCHAR(160) NULL,
  icon VARCHAR(20) NULL,
  type_key VARCHAR(30) NOT NULL,
  default_fields JSON NULL,
  fg_color VARCHAR(9) NOT NULL DEFAULT '#0b3c5d',
  bg_color VARCHAR(9) NOT NULL DEFAULT '#ffffff',
  dot_style VARCHAR(20) NOT NULL DEFAULT 'square',
  corner_square_style VARCHAR(20) NOT NULL DEFAULT 'square',
  corner_dot_style VARCHAR(20) NOT NULL DEFAULT 'square',
  error_correction ENUM('L','M','Q','H') NOT NULL DEFAULT 'M',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (type_key) REFERENCES qr_types(type_key) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS qr_settings (
  id TINYINT UNSIGNED NOT NULL PRIMARY KEY DEFAULT 1,
  default_fg_color VARCHAR(9) NOT NULL DEFAULT '#0b3c5d',
  default_bg_color VARCHAR(9) NOT NULL DEFAULT '#ffffff',
  default_error_correction ENUM('L','M','Q','H') NOT NULL DEFAULT 'M',
  default_margin INT NOT NULL DEFAULT 12,
  default_size INT NOT NULL DEFAULT 1024,
  allowed_formats VARCHAR(80) NOT NULL DEFAULT 'png,jpeg,webp,svg',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- QR generation counter — increment-only, no PII, no per-user tracking.
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS qr_generation_stats (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  stat_date DATE NOT NULL,
  type_key VARCHAR(30) NOT NULL,
  event VARCHAR(20) NOT NULL DEFAULT 'generate',
  count INT UNSIGNED NOT NULL DEFAULT 0,
  UNIQUE KEY uniq_stat (stat_date, type_key, event)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- Seed: roles
-- ---------------------------------------------------------------------

INSERT IGNORE INTO roles (slug, name, is_system) VALUES
  ('owner', 'Owner', 1),
  ('administrator', 'Administrator', 0),
  ('content_manager', 'Content Manager', 0),
  ('qr_manager', 'QR Manager', 0);

-- ---------------------------------------------------------------------
-- Seed: permissions (Phase 1 set only — extended in Phase 2)
-- ---------------------------------------------------------------------

INSERT IGNORE INTO permissions (slug, description) VALUES
  ('dashboard.view', 'View admin dashboard'),
  ('faq.view', 'View FAQ entries'),
  ('faq.create', 'Create FAQ entries'),
  ('faq.edit', 'Edit FAQ entries'),
  ('faq.delete', 'Delete FAQ entries'),
  ('qr.types.view', 'View QR types'),
  ('qr.types.edit', 'Enable/disable and reorder QR types'),
  ('qr.templates.view', 'View QR templates'),
  ('qr.templates.create', 'Create QR templates'),
  ('qr.templates.edit', 'Edit QR templates'),
  ('qr.templates.delete', 'Delete QR templates'),
  ('qr.settings.view', 'View global QR generation defaults'),
  ('qr.settings.edit', 'Edit global QR generation defaults'),
  ('donate.view', 'View donate page settings'),
  ('donate.edit', 'Edit donate page settings'),
  ('admins.view', 'View administrators'),
  ('admins.create', 'Create administrators'),
  ('admins.edit', 'Edit administrators'),
  ('admins.delete', 'Delete/disable administrators'),
  ('roles.view', 'View roles and permissions'),
  ('roles.edit', 'Edit role permission assignments'),
  ('settings.view', 'View site settings'),
  ('settings.edit', 'Edit site settings'),
  ('activity_logs.view', 'View activity logs');

-- Owner: every permission
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON r.slug = 'owner';

-- Administrator: everything except admins.* and roles.edit and settings.edit
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p
  ON r.slug = 'administrator'
 AND p.slug NOT IN ('admins.view','admins.create','admins.edit','admins.delete','roles.view','roles.edit','settings.edit');

-- Content Manager: FAQ + donate + read-only settings/dashboard
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p
  ON r.slug = 'content_manager'
 AND p.slug IN ('dashboard.view','faq.view','faq.create','faq.edit','faq.delete','donate.view','donate.edit','settings.view');

-- QR Manager: QR types, templates, and QR generation defaults + read-only settings/dashboard
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p
  ON r.slug = 'qr_manager'
 AND p.slug IN ('dashboard.view','qr.types.view','qr.types.edit',
                'qr.templates.view','qr.templates.create','qr.templates.edit','qr.templates.delete',
                'qr.settings.view','qr.settings.edit','settings.view');

-- ---------------------------------------------------------------------
-- Seed: QR types (matches js/qr-generator.js keys exactly)
-- ---------------------------------------------------------------------

INSERT IGNORE INTO qr_types (type_key, name, description, icon, is_active, sort_order) VALUES
  ('url', 'URL', 'Website link', 'bi-link-45deg', 1, 1),
  ('text', 'Text', 'Plain text', 'bi-fonts', 1, 2),
  ('whatsapp', 'WhatsApp', 'WhatsApp chat link', 'bi-whatsapp', 1, 3),
  ('phone', 'Phone', 'Phone call', 'bi-telephone', 1, 4),
  ('sms', 'SMS', 'Text message', 'bi-chat-dots', 1, 5),
  ('email', 'Email', 'Email message', 'bi-envelope', 1, 6),
  ('vcard', 'vCard', 'Contact card', 'bi-person-vcard', 1, 7),
  ('social', 'Social', 'Social profile', 'bi-share', 1, 8),
  ('wifi', 'Wi-Fi', 'Wi-Fi network login', 'bi-wifi', 1, 9),
  ('location', 'Location', 'Map location', 'bi-geo-alt', 1, 10),
  ('event', 'Event', 'Calendar event', 'bi-calendar-event', 1, 11);

-- ---------------------------------------------------------------------
-- Seed: QR templates (matches the current static js/templates.js gallery)
-- ---------------------------------------------------------------------

INSERT IGNORE INTO qr_templates (name, category, description, icon, type_key, default_fields, fg_color, dot_style, corner_square_style, sort_order) VALUES
  ('Business Website', 'Business', 'Visit our website', '🌐', 'url', '{"url":""}', '#0b3c5d', 'square', 'square', 1),
  ('WhatsApp Business', 'Business', 'Chat with us on WhatsApp', '💬', 'whatsapp', '{"message":"Hello! I have a question."}', '#0b3c5d', 'square', 'square', 2),
  ('Digital Business Card', 'Business', 'Save my contact', '🪪', 'vcard', '{}', '#0b3c5d', 'square', 'square', 3),
  ('Store Location', 'Business', 'Find our store', '📍', 'location', '{"mapsUrl":""}', '#0b3c5d', 'square', 'square', 4),

  ('Digital Menu', 'Restaurant', 'View our menu', '🍽️', 'url', '{"url":""}', '#b91c1c', 'rounded', 'extra-rounded', 1),
  ('Order Online', 'Restaurant', 'Order online', '🛍️', 'url', '{"url":""}', '#b91c1c', 'rounded', 'extra-rounded', 2),
  ('WhatsApp Orders', 'Restaurant', 'Order via WhatsApp', '💬', 'whatsapp', '{"message":"Hi, I would like to place an order."}', '#b91c1c', 'rounded', 'extra-rounded', 3),
  ('Leave a Review', 'Restaurant', 'Leave us a review', '⭐', 'url', '{"url":""}', '#b91c1c', 'rounded', 'extra-rounded', 4),

  ('Church Website', 'Church', 'Visit our website', '⛪', 'url', '{"url":""}', '#5b21b6', 'extra-rounded', 'extra-rounded', 1),
  ('Online Giving', 'Church', 'Give online', '🙏', 'url', '{"url":""}', '#5b21b6', 'extra-rounded', 'extra-rounded', 2),
  ('Church Location', 'Church', 'Get directions', '📍', 'location', '{"mapsUrl":""}', '#5b21b6', 'extra-rounded', 'extra-rounded', 3),
  ('YouTube Channel', 'Church', 'Watch our services', '▶️', 'social', '{"platform":"youtube"}', '#5b21b6', 'extra-rounded', 'extra-rounded', 4),
  ('Facebook Page', 'Church', 'Follow us on Facebook', '📘', 'social', '{"platform":"facebook"}', '#5b21b6', 'extra-rounded', 'extra-rounded', 5),
  ('Prayer Request', 'Church', 'Submit a prayer request', '🕊️', 'email', '{"subject":"Prayer Request"}', '#5b21b6', 'extra-rounded', 'extra-rounded', 6),

  ('Event Registration', 'Event', 'Register now', '📝', 'url', '{"url":""}', '#0f766e', 'dots', 'dot', 1),
  ('Event Ticket', 'Event', 'Get your ticket', '🎟️', 'url', '{"url":""}', '#0f766e', 'dots', 'dot', 2),
  ('Event Location', 'Event', 'Event location', '📍', 'location', '{"mapsUrl":""}', '#0f766e', 'dots', 'dot', 3),
  ('Add to Calendar', 'Event', 'Save the date', '📅', 'event', '{}', '#0f766e', 'dots', 'dot', 4),

  ('WhatsApp Me', 'Personal', 'Message me on WhatsApp', '💬', 'whatsapp', '{}', '#be185d', 'extra-rounded', 'dot', 1),
  ('Instagram', 'Personal', 'Follow me on Instagram', '📸', 'social', '{"platform":"instagram"}', '#be185d', 'extra-rounded', 'dot', 2),
  ('Facebook', 'Personal', 'Follow me on Facebook', '📘', 'social', '{"platform":"facebook"}', '#be185d', 'extra-rounded', 'dot', 3),
  ('TikTok', 'Personal', 'Follow me on TikTok', '🎵', 'social', '{"platform":"tiktok"}', '#be185d', 'extra-rounded', 'dot', 4),
  ('LinkedIn', 'Personal', 'Connect on LinkedIn', '💼', 'social', '{"platform":"linkedin"}', '#be185d', 'extra-rounded', 'dot', 5);

-- ---------------------------------------------------------------------
-- Seed: global QR generation defaults
-- ---------------------------------------------------------------------

INSERT IGNORE INTO qr_settings (id, default_fg_color, default_bg_color, default_error_correction, default_margin, default_size, allowed_formats) VALUES
  (1, '#0b3c5d', '#ffffff', 'M', 12, 1024, 'png,jpeg,webp,svg');

-- ---------------------------------------------------------------------
-- Seed: donate page (matches the current static donate.html content)
-- ---------------------------------------------------------------------

INSERT IGNORE INTO donate_settings (id, heading, description, payment_section_title, thank_you_message, ussd_code) VALUES
  (1, 'Support Paful Multi Services',
      'PAFUL QR is free to use. If it''s been useful to you, a donation to Paful Multi Services via mobile money helps keep it that way and supports the wider services we offer.',
      'we accept',
      'Thank you for your support!',
      '*713*6787#');

INSERT IGNORE INTO donate_payment_methods (method_key, display_name, account_name, account_number, is_active, sort_order) VALUES
  ('telecel', 'Telecel Cash', 'Paful Multi Services', '', 1, 1),
  ('momo', 'MoMo (MTN)', 'Paful Multi Services', '', 1, 2),
  ('at_money', 'AT Money', 'Paful Multi Services', '', 1, 3);

-- ---------------------------------------------------------------------
-- Seed: FAQ (matches the current static index.html FAQ content)
-- ---------------------------------------------------------------------

INSERT IGNORE INTO faqs (question, answer, sort_order, is_active) VALUES
  ('What is a QR code?', 'A QR (Quick Response) code is a two-dimensional barcode that stores text, links, or other data and can be read instantly by a smartphone camera.', 1, 1),
  ('Is PAFUL QR free?', 'Yes. Static QR generation, customization, logos and downloads are completely free, with no account required.', 2, 1),
  ('Do I need an account?', 'No. You can generate, scan and download QR codes without registering or signing in.', 3, 1),
  ('Do static QR codes expire?', 'No, a static QR code does not expire by itself. It only stops working if the destination it points to (a website, phone number, etc.) stops working or changes.', 4, 1),
  ('Can I add a logo?', 'Yes. Upload an image in the Logo panel and adjust its size, padding and background. Using a higher error correction level helps keep the code scannable.', 5, 1),
  ('Can I generate Wi-Fi QR codes?', 'Yes. Choose the Wi-Fi type, enter your network name, password and security type, and compatible phones can join the network by scanning the code.', 6, 1),
  ('Can I create QR codes in bulk?', 'Yes. The Bulk QR page turns a CSV of names and values into one QR code per row, downloadable as a single ZIP file — free for up to 100 per batch.', 7, 1),
  ('Can I scan QR codes?', 'Yes. The Scan page reads QR codes with your camera or from an uploaded image, entirely on your device.', 8, 1),
  ('Does PAFUL QR work offline?', 'Yes, after your first visit the generator is cached for offline use. Some browsers also let you install PAFUL QR as an app.', 9, 1),
  ('Are my QR codes stored online?', 'No. QR content is processed locally in your browser. If you use "Save to My QR Codes," it''s stored only in this browser''s local storage — never uploaded.', 10, 1);

-- ---------------------------------------------------------------------
-- Seed: general site settings (matches current hard-coded values)
-- ---------------------------------------------------------------------

INSERT IGNORE INTO site_settings (`key`, `value`) VALUES
  ('site_name', 'PAFUL QR'),
  ('tagline', 'Generate . Customize . Scan . Share'),
  ('contact_email', ''),
  ('contact_phone', ''),
  ('contact_address', ''),
  ('primary_color', '#0b3c5d'),
  ('meta_title', 'Free QR Code Generator — Create, Customize & Download | PAFUL QR'),
  ('meta_description', 'Create free QR codes for URLs, text, Wi-Fi, WhatsApp, contact cards, events and more. Customize, scan, download and print QR codes instantly with PAFUL QR.'),
  ('social_facebook', ''),
  ('social_instagram', ''),
  ('social_tiktok', ''),
  ('social_youtube', ''),
  ('social_linkedin', ''),
  ('social_x', '');
