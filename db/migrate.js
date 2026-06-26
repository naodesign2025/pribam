const pool = require('./index');

async function migrate() {
  const client = await pool.connect();
  try {
    // users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            SERIAL PRIMARY KEY,
        username      VARCHAR(30)  NOT NULL,
        email         VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);

    // profiles
    await client.query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id            SERIAL PRIMARY KEY,
        user_id       INTEGER      NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        icon_url      TEXT,
        nickname      VARCHAR(30)  NOT NULL,
        birthday      DATE,
        blood_type    VARCHAR(4),
        favorite_food VARCHAR(100),
        favorite_type VARCHAR(100),
        treasure      VARCHAR(150),
        want_now      VARCHAR(150),
        best3         JSONB        NOT NULL DEFAULT '["","",""]',
        moshimo       JSONB        NOT NULL DEFAULT '[{"question":"","answer":""}]',
        free_space    VARCHAR(500),
        love_status   VARCHAR(10),
        love_comment  VARCHAR(100),
        created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
    `);

    // canvas_positions
    await client.query(`
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
    `);

    // exchanges
    await client.query(`
      CREATE TABLE IF NOT EXISTS exchanges (
        id           SERIAL PRIMARY KEY,
        user_a       INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        user_b       INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        exchanged_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        UNIQUE(user_a, user_b)
      );
      CREATE INDEX IF NOT EXISTS idx_exchanges_user_a ON exchanges(user_a);
      CREATE INDEX IF NOT EXISTS idx_exchanges_user_b ON exchanges(user_b);
    `);

    // updated_at トリガー
    await client.query(`
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
    `);

    console.log('DB migration 完了');
  } catch (err) {
    console.error('DB migration エラー:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = migrate;
