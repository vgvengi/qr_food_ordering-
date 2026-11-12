-- QR Food Order schema (MySQL 8)
-- Money is stored in paise (INT) to avoid floating-point rounding.

CREATE DATABASE IF NOT EXISTS qr_food_order CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE qr_food_order;

DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS menu_items;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS dining_tables;

CREATE TABLE dining_tables (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  label       VARCHAR(20)  NOT NULL UNIQUE,      -- e.g. "T1", printed next to the QR
  qr_token    CHAR(12)     NOT NULL UNIQUE,      -- opaque token in the QR URL, so table ids aren't guessable
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(60)  NOT NULL,
  sort_order  INT          NOT NULL DEFAULT 0
);

CREATE TABLE menu_items (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  category_id   INT          NOT NULL,
  name          VARCHAR(100) NOT NULL,
  description   VARCHAR(255),
  price_paise   INT UNSIGNED NOT NULL,
  is_veg        BOOLEAN      NOT NULL DEFAULT TRUE,
  is_available  BOOLEAN      NOT NULL DEFAULT TRUE,
  image_url     VARCHAR(500),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE orders (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  table_id             INT          NOT NULL,
  status               ENUM('pending_payment','paid','preparing','ready','served','cancelled')
                                    NOT NULL DEFAULT 'pending_payment',
  total_paise          INT UNSIGNED NOT NULL,
  razorpay_order_id    VARCHAR(40)  UNIQUE,
  razorpay_payment_id  VARCHAR(40)  UNIQUE,
  customer_note        VARCHAR(255),
  created_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (table_id) REFERENCES dining_tables(id),
  INDEX idx_orders_status (status, created_at)
);

-- Snapshot name and price at order time, so later menu edits don't rewrite history.
CREATE TABLE order_items (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  order_id      INT          NOT NULL,
  menu_item_id  INT          NOT NULL,
  name          VARCHAR(100) NOT NULL,
  price_paise   INT UNSIGNED NOT NULL,
  quantity      INT UNSIGNED NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
);
