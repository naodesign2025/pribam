-- =============================================
-- プリバム データベーススキーマ
-- Supabase (PostgreSQL) 用
-- =============================================

-- ユーザーテーブル
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(30)  NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- プロフィールテーブル
CREATE TABLE IF NOT EXISTS profiles (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER      NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- アイコン
  icon_url      TEXT,

  -- 基本情報
  nickname      VARCHAR(30)  NOT NULL,
  birthday      DATE,
  blood_type    VARCHAR(4),           -- A / B / O / AB / 不明

  -- 好きなもの
  favorite_food VARCHAR(100),
  favorite_type VARCHAR(100),

  -- たからもの
  treasure      VARCHAR(150),
  want_now      VARCHAR(150),

  -- マイBEST3 (JSON配列: ["item1","item2","item3"])
  best3         JSONB        NOT NULL DEFAULT '["","",""]',

  -- もしもコーナー (JSON配列: [{"question":"...","answer":"..."}])
  moshimo       JSONB        NOT NULL DEFAULT '[{"question":"","answer":""}]',

  -- FREE SPACE
  free_space    VARCHAR(500),

  -- LOVE LOVEコーナー
  love_status   VARCHAR(10),          -- 彼氏いる / 彼女いる / いない / ひみつ
  love_comment  VARCHAR(100),

  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
