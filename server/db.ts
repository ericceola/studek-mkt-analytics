import mysql, { PoolConnection, RowDataPacket } from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { env } from './config.js';

const databaseConfig = env.DATABASE_URL
  ? { uri: env.DATABASE_URL }
  : { host: env.DB_HOST, port: env.DB_PORT, user: env.DB_USER, password: env.DB_PASSWORD, database: env.DB_NAME };

export const db = mysql.createPool({ ...databaseConfig, charset: 'utf8mb4', waitForConnections: true,
  connectionLimit: 10, queueLimit: 0, multipleStatements: true });

export async function initializeDatabase() {
  const migration = await readFile(resolve('database/001_initial.sql'), 'utf8');
  await db.query(migration);
  const [batchColumns] = await db.execute<RowDataPacket[]>(`SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='apify_runs' AND COLUMN_NAME='batch_id'`);
  if (!batchColumns.length) {
    await db.query(`ALTER TABLE apify_runs ADD COLUMN batch_id BIGINT UNSIGNED NULL AFTER profile_id, ADD INDEX idx_runs_batch(batch_id), ADD CONSTRAINT fk_runs_batch FOREIGN KEY(batch_id) REFERENCES collection_batches(id) ON DELETE SET NULL`);
  }
  const [runRangeColumns] = await db.execute<RowDataPacket[]>(`SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='apify_runs' AND COLUMN_NAME='only_posts_older_than'`);
  if (!runRangeColumns.length) await db.query(`ALTER TABLE apify_runs ADD COLUMN only_posts_older_than DATE NULL AFTER only_posts_newer_than`);
  const [settingsColumns] = await db.execute<RowDataPacket[]>(`SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='workspace_settings' AND COLUMN_NAME IN ('collection_results_limit','collection_only_posts_newer_than')`);
  const existingSettings = new Set(settingsColumns.map(column => String(column.COLUMN_NAME)));
  if (!existingSettings.has('collection_results_limit')) await db.query(`ALTER TABLE workspace_settings ADD COLUMN collection_results_limit INT UNSIGNED NOT NULL DEFAULT 100 AFTER base_profile_id`);
  if (!existingSettings.has('collection_only_posts_newer_than')) await db.query(`ALTER TABLE workspace_settings ADD COLUMN collection_only_posts_newer_than VARCHAR(50) NOT NULL DEFAULT '30 days' AFTER collection_results_limit`);
  const [settingsRangeColumns] = await db.execute<RowDataPacket[]>(`SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='workspace_settings' AND COLUMN_NAME='collection_posts_until'`);
  if (!settingsRangeColumns.length) await db.query(`ALTER TABLE workspace_settings ADD COLUMN collection_posts_until DATE NULL AFTER collection_only_posts_newer_than`);
  const [accessProfileColumns] = await db.execute<RowDataPacket[]>(`SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='access_profile_id'`);
  if (!accessProfileColumns.length) await db.query(`ALTER TABLE users ADD COLUMN access_profile_id BIGINT UNSIGNED NULL AFTER role, ADD INDEX idx_users_access_profile(access_profile_id), ADD CONSTRAINT fk_users_access_profile FOREIGN KEY(access_profile_id) REFERENCES access_profiles(id) ON DELETE SET NULL`);
  const [accessProfileConstraints] = await db.execute<RowDataPacket[]>(`SELECT CONSTRAINT_NAME FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='users' AND CONSTRAINT_NAME='fk_users_access_profile'`);
  if (!accessProfileConstraints.length) await db.query(`ALTER TABLE users ADD CONSTRAINT fk_users_access_profile FOREIGN KEY(access_profile_id) REFERENCES access_profiles(id) ON DELETE SET NULL`);
  const aiColumns=['ai_enabled','ai_provider','openai_model','anthropic_model','openai_api_key_encrypted','anthropic_api_key_encrypted','ai_last_tested_at'];
  const [existingAiRows]=await db.execute<RowDataPacket[]>(`SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='workspace_settings' AND COLUMN_NAME IN (${aiColumns.map(()=>'?').join(',')})`,aiColumns);
  const existingAi=new Set(existingAiRows.map(row=>String(row.COLUMN_NAME)));
  if(!existingAi.has('ai_enabled'))await db.query(`ALTER TABLE workspace_settings ADD COLUMN ai_enabled BOOLEAN NOT NULL DEFAULT FALSE`);
  if(!existingAi.has('ai_provider'))await db.query(`ALTER TABLE workspace_settings ADD COLUMN ai_provider ENUM('openai','anthropic') NOT NULL DEFAULT 'openai'`);
  if(!existingAi.has('openai_model'))await db.query(`ALTER TABLE workspace_settings ADD COLUMN openai_model VARCHAR(100) NOT NULL DEFAULT 'gpt-5.6-sol'`);
  if(!existingAi.has('anthropic_model'))await db.query(`ALTER TABLE workspace_settings ADD COLUMN anthropic_model VARCHAR(100) NOT NULL DEFAULT 'claude-sonnet-4-6'`);
  if(!existingAi.has('openai_api_key_encrypted'))await db.query(`ALTER TABLE workspace_settings ADD COLUMN openai_api_key_encrypted TEXT NULL`);
  if(!existingAi.has('anthropic_api_key_encrypted'))await db.query(`ALTER TABLE workspace_settings ADD COLUMN anthropic_api_key_encrypted TEXT NULL`);
  if(!existingAi.has('ai_last_tested_at'))await db.query(`ALTER TABLE workspace_settings ADD COLUMN ai_last_tested_at DATETIME NULL`);
  const emailColumns=[
    ['email_enabled','BOOLEAN NOT NULL DEFAULT FALSE'],['smtp_host','VARCHAR(255) NULL'],['smtp_port','SMALLINT UNSIGNED NOT NULL DEFAULT 587'],
    ['smtp_secure','BOOLEAN NOT NULL DEFAULT FALSE'],['smtp_require_tls','BOOLEAN NOT NULL DEFAULT TRUE'],['smtp_user','VARCHAR(255) NULL'],
    ['smtp_password_encrypted','TEXT NULL'],['email_from_name','VARCHAR(120) NULL'],['email_from_address','VARCHAR(190) NULL'],
    ['email_reply_to','VARCHAR(190) NULL'],['email_notify_passwords','BOOLEAN NOT NULL DEFAULT TRUE'],['email_notify_reports','BOOLEAN NOT NULL DEFAULT TRUE'],
    ['email_notify_system','BOOLEAN NOT NULL DEFAULT TRUE'],['email_last_tested_at','DATETIME NULL']
  ] as const;
  const [existingEmailRows]=await db.execute<RowDataPacket[]>(`SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='workspace_settings' AND COLUMN_NAME IN (${emailColumns.map(()=>'?').join(',')})`,emailColumns.map(([name])=>name));
  const existingEmail=new Set(existingEmailRows.map(row=>String(row.COLUMN_NAME)));
  for(const [name,definition] of emailColumns)if(!existingEmail.has(name))await db.query(`ALTER TABLE workspace_settings ADD COLUMN ${name} ${definition}`);
  await db.execute(`UPDATE ai_analysis_jobs SET status='queued',started_at=NULL WHERE status='running'`);
  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);
  await db.execute(`INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,'admin')
    ON DUPLICATE KEY UPDATE name=VALUES(name)`, [env.ADMIN_NAME, env.ADMIN_EMAIL.toLowerCase(), passwordHash]);
}
export async function rows<T extends RowDataPacket[]>(sql: string, values: any[] = []) { const [result] = await db.execute<T>(sql, values); return result; }
export async function transaction<T>(fn: (connection: PoolConnection) => Promise<T>) {
  const connection = await db.getConnection();
  try { await connection.beginTransaction(); const result = await fn(connection); await connection.commit(); return result; }
  catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
}
