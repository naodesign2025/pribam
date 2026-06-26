-- =============================================
-- canvas_positions テーブル追加
-- Supabase SQL Editor で実行してください
-- =============================================

CREATE TABLE IF NOT EXISTS canvas_positions (
  id          SERIAL PRIMARY KEY,
  owner_id    INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_id   INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  x           INTEGER      NOT NULL DEFAULT 20,
  y           INTEGER      NOT NULL DEFAULT 20,
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE(owner_id, target_id)
);

CREATE INDEX IF NOT EXISTS idx_canvas_owner ON canvas_positions(owner_id);
