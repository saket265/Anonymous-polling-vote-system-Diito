-- ─────────────────────────────────────────────────────────
-- Ditto Poll System — MySQL Setup
-- Run this ONCE before starting the backend
-- ─────────────────────────────────────────────────────────

CREATE DATABASE IF NOT EXISTS dittodb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dittodb;

CREATE TABLE IF NOT EXISTS users (
  id                   VARCHAR(36) PRIMARY KEY,
  name                 VARCHAR(100) NOT NULL,
  email                VARCHAR(150) NOT NULL UNIQUE,
  password_hash        VARCHAR(255) NOT NULL,
  role                 ENUM('USER','ADMIN') DEFAULT 'USER',
  email_verified       BOOLEAN DEFAULT FALSE,
  email_verify_token   VARCHAR(64),
  password_reset_token VARCHAR(64),
  password_reset_expiry DATETIME,
  created_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login_at        DATETIME,
  INDEX idx_email (email)
);

CREATE TABLE IF NOT EXISTS polls (
  id               VARCHAR(36) PRIMARY KEY,
  question         VARCHAR(500) NOT NULL,
  owner_id         VARCHAR(36),
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at       DATETIME,
  aadhaar_required BOOLEAN DEFAULT TRUE,
  multi_choice     BOOLEAN DEFAULT FALSE,
  results_public   BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_owner (owner_id)
);

CREATE TABLE IF NOT EXISTS poll_options (
  id      BIGINT AUTO_INCREMENT PRIMARY KEY,
  text    VARCHAR(300) NOT NULL,
  poll_id VARCHAR(36) NOT NULL,
  FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS votes (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  poll_id     VARCHAR(36) NOT NULL,
  option_id   BIGINT NOT NULL,
  token_hash  VARCHAR(64) NOT NULL,
  voted_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_poll_token (poll_id, token_hash),
  FOREIGN KEY (option_id) REFERENCES poll_options(id) ON DELETE CASCADE,
  FOREIGN KEY (poll_id)   REFERENCES polls(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS meetings (
  id               VARCHAR(36) PRIMARY KEY,
  title            VARCHAR(500) NOT NULL,
  description      VARCHAR(1000),
  time_slots_json  TEXT,
  aadhaar_required BOOLEAN DEFAULT FALSE,
  owner_id         VARCHAR(36),
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  active           BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ── Default admin user ────────────────────────────────────
-- Email: admin@ditto.app   Password: Admin@1234
INSERT IGNORE INTO users (id, name, email, password_hash, role, email_verified, created_at) VALUES (
  'admin-0001', 'Ditto Admin', 'admin@ditto.app',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'ADMIN', TRUE, NOW()
);

-- ── Demo polls ────────────────────────────────────────────
INSERT IGNORE INTO polls (id, question, owner_id, aadhaar_required, expires_at)
VALUES ('demo-poll-1','Should India adopt a 4-day work week?','admin-0001',TRUE, DATE_ADD(NOW(), INTERVAL 7 DAY));

INSERT IGNORE INTO poll_options (id, text, poll_id) VALUES
  (1001,'Yes, immediately','demo-poll-1'),
  (1002,'Yes, but gradually','demo-poll-1'),
  (1003,'No, keep 5 days','demo-poll-1'),
  (1004,'Let companies decide','demo-poll-1');

INSERT IGNORE INTO polls (id, question, owner_id, aadhaar_required, results_public, expires_at)
VALUES ('demo-poll-3','Which is your favourite fruit of all time?','admin-0001',TRUE, TRUE, DATE_ADD(NOW(), INTERVAL 1 DAY));

INSERT IGNORE INTO poll_options (id, text, poll_id) VALUES
  (3001,'Strawberries','demo-poll-3'),
  (3002,'Mango','demo-poll-3'),
  (3003,'Bananas','demo-poll-3'),
  (3004,'Grapes','demo-poll-3'),
  (3005,'Lemon','demo-poll-3');

-- Seed some votes for demo
INSERT IGNORE INTO votes (poll_id, option_id, token_hash) VALUES
  ('demo-poll-3',3001,'h001'),('demo-poll-3',3001,'h002'),('demo-poll-3',3001,'h003'),
  ('demo-poll-3',3001,'h004'),('demo-poll-3',3001,'h005'),('demo-poll-3',3001,'h006'),
  ('demo-poll-3',3001,'h007'),('demo-poll-3',3001,'h008'),('demo-poll-3',3001,'h009'),
  ('demo-poll-3',3002,'h010'),('demo-poll-3',3002,'h011'),('demo-poll-3',3002,'h012'),
  ('demo-poll-3',3003,'h013'),('demo-poll-3',3003,'h014'),
  ('demo-poll-3',3004,'h015');

SELECT 'Database setup complete!' AS status;
SELECT 'Admin: admin@ditto.app / Admin@1234' AS credentials;
