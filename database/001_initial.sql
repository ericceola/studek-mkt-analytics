-- Banco já provisionado no EasyPanel. Esta migration instala somente a estrutura.
USE `db-mkt-analytics`;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, name VARCHAR(120) NOT NULL, email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL, role ENUM('admin','user') NOT NULL DEFAULT 'user', is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS instagram_profiles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, username VARCHAR(100) NOT NULL UNIQUE, internal_name VARCHAR(120), instagram_profile_id VARCHAR(100),
  full_name VARCHAR(180), biography TEXT, profile_url VARCHAR(500), profile_picture_url TEXT, external_url TEXT, category VARCHAR(120),
  is_verified BOOLEAN NOT NULL DEFAULT FALSE, is_private BOOLEAN NOT NULL DEFAULT FALSE, is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_collected_at DATETIME, created_by BIGINT UNSIGNED, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS profile_snapshots (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, profile_id BIGINT UNSIGNED NOT NULL, followers_count INT UNSIGNED DEFAULT 0,
  follows_count INT UNSIGNED DEFAULT 0, posts_count INT UNSIGNED DEFAULT 0, average_likes DECIMAL(14,2) DEFAULT 0,
  average_comments DECIMAL(14,2) DEFAULT 0, average_engagement DECIMAL(14,2) DEFAULT 0, engagement_rate DECIMAL(10,4) DEFAULT 0,
  collected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (profile_id) REFERENCES instagram_profiles(id) ON DELETE CASCADE,
  INDEX idx_snapshot_profile_date(profile_id,collected_at)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS instagram_posts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, profile_id BIGINT UNSIGNED NOT NULL, instagram_post_id VARCHAR(120), shortcode VARCHAR(80),
  post_type ENUM('Video','Image','Sidecar','Reel','Other') DEFAULT 'Other', content_surface ENUM('Feed','Reel','Story') NOT NULL DEFAULT 'Feed', caption TEXT, post_url TEXT, display_url TEXT, video_url TEXT,
  published_at DATETIME, duration_seconds DECIMAL(10,2), is_paid_partnership BOOLEAN DEFAULT FALSE, comments_disabled BOOLEAN DEFAULT FALSE,
  raw_data JSON, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id) REFERENCES instagram_profiles(id) ON DELETE CASCADE, UNIQUE KEY uq_profile_post(profile_id,instagram_post_id),
  UNIQUE KEY uq_profile_shortcode(profile_id,shortcode), INDEX idx_posts_date(profile_id,published_at)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS post_metrics (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, post_id BIGINT UNSIGNED NOT NULL, apify_run_id BIGINT UNSIGNED,
  likes_count INT UNSIGNED DEFAULT 0, comments_count INT UNSIGNED DEFAULT 0, views_count BIGINT UNSIGNED DEFAULT 0,
  plays_count BIGINT UNSIGNED DEFAULT 0, engagement_count INT UNSIGNED DEFAULT 0, engagement_rate DECIMAL(10,4),
  collected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (post_id) REFERENCES instagram_posts(id) ON DELETE CASCADE,
  INDEX idx_metrics_post_date(post_id,collected_at), UNIQUE KEY uq_metric_run(post_id,apify_run_id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS hashtags (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, name VARCHAR(190) NOT NULL UNIQUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS post_hashtags (
  post_id BIGINT UNSIGNED NOT NULL, hashtag_id BIGINT UNSIGNED NOT NULL, PRIMARY KEY(post_id,hashtag_id),
  FOREIGN KEY(post_id) REFERENCES instagram_posts(id) ON DELETE CASCADE, FOREIGN KEY(hashtag_id) REFERENCES hashtags(id) ON DELETE CASCADE
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS instagram_comments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, post_id BIGINT UNSIGNED NOT NULL, instagram_comment_id VARCHAR(150), text TEXT,
  owner_username VARCHAR(100), owner_full_name VARCHAR(180), owner_profile_picture_url TEXT, likes_count INT UNSIGNED DEFAULT 0,
  replies_count INT UNSIGNED DEFAULT 0, commented_at DATETIME, raw_data JSON, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(post_id) REFERENCES instagram_posts(id) ON DELETE CASCADE, UNIQUE KEY uq_comment_id(instagram_comment_id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS collection_batches (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, profile_id BIGINT UNSIGNED NOT NULL,
  status ENUM('pending','running','succeeded','failed','aborted','timed_out') DEFAULT 'pending',
  started_at DATETIME, finished_at DATETIME, error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY(profile_id) REFERENCES instagram_profiles(id) ON DELETE CASCADE,
  INDEX idx_batches_profile(profile_id,created_at), INDEX idx_batches_status(status)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS apify_runs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, profile_id BIGINT UNSIGNED NOT NULL, apify_run_id VARCHAR(100), apify_dataset_id VARCHAR(100),
  batch_id BIGINT UNSIGNED,
  collection_type ENUM('profile_details','posts','stories','comments','full') NOT NULL, status ENUM('pending','running','succeeded','failed','aborted','timed_out') DEFAULT 'pending',
  requested_posts_limit INT UNSIGNED DEFAULT 100, only_posts_newer_than VARCHAR(50), started_at DATETIME, finished_at DATETIME,
  only_posts_older_than DATE NULL,
  error_message TEXT, request_payload JSON, result_summary JSON, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY(profile_id) REFERENCES instagram_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY(batch_id) REFERENCES collection_batches(id) ON DELETE SET NULL,
  INDEX idx_runs_status(status), INDEX idx_runs_profile(profile_id,created_at), INDEX idx_runs_batch(batch_id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS comparison_groups (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, name VARCHAR(150) NOT NULL, description TEXT, created_by BIGINT UNSIGNED,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS comparison_group_profiles (
  comparison_group_id BIGINT UNSIGNED NOT NULL, profile_id BIGINT UNSIGNED NOT NULL, display_order INT DEFAULT 0,
  PRIMARY KEY(comparison_group_id,profile_id), FOREIGN KEY(comparison_group_id) REFERENCES comparison_groups(id) ON DELETE CASCADE,
  FOREIGN KEY(profile_id) REFERENCES instagram_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS workspace_settings (
  id TINYINT UNSIGNED NOT NULL PRIMARY KEY DEFAULT 1,
  base_profile_id BIGINT UNSIGNED NULL,
  collection_results_limit INT UNSIGNED NOT NULL DEFAULT 100,
  collection_only_posts_newer_than VARCHAR(50) NOT NULL DEFAULT '30 days',
  collection_posts_until DATE NULL,
  ai_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ai_provider ENUM('openai','anthropic') NOT NULL DEFAULT 'openai',
  openai_model VARCHAR(100) NOT NULL DEFAULT 'gpt-5.6-sol',
  anthropic_model VARCHAR(100) NOT NULL DEFAULT 'claude-sonnet-4-6',
  openai_api_key_encrypted TEXT NULL,
  anthropic_api_key_encrypted TEXT NULL,
  ai_last_tested_at DATETIME NULL,
  updated_by BIGINT UNSIGNED NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY(base_profile_id) REFERENCES instagram_profiles(id) ON DELETE SET NULL,
  FOREIGN KEY(updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS ai_profile_analyses (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, profile_id BIGINT UNSIGNED NOT NULL, provider ENUM('openai','anthropic') NOT NULL,
  model VARCHAR(100) NOT NULL, analysis_json JSON NOT NULL, source_snapshot JSON NOT NULL, created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(profile_id) REFERENCES instagram_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL, INDEX idx_ai_analysis_profile(profile_id,created_at)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS ai_analysis_jobs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, profile_id BIGINT UNSIGNED NOT NULL, provider ENUM('openai','anthropic') NOT NULL,
  model VARCHAR(100) NOT NULL, status ENUM('queued','running','succeeded','failed') NOT NULL DEFAULT 'queued',
  analysis_id BIGINT UNSIGNED NULL, error_message TEXT NULL, created_by BIGINT UNSIGNED NULL, started_at DATETIME NULL, finished_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY(profile_id) REFERENCES instagram_profiles(id) ON DELETE CASCADE, FOREIGN KEY(analysis_id) REFERENCES ai_profile_analyses(id) ON DELETE SET NULL,
  FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL, INDEX idx_ai_jobs_status(status,created_at), INDEX idx_ai_jobs_profile(profile_id,created_at)
) ENGINE=InnoDB;
