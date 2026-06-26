require('dns').setDefaultResultOrder('ipv4first');
const { Pool } = require('pg');

// プールを遅延生成（DNS解決後に process.env.DATABASE_URL が確定してから作る）
let _pool;

function getPool() {
  if (!_pool) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    });
    _pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });
  }
  return _pool;
}

// 既存コードが pool.query() / pool.connect() をそのまま使えるようにプロキシ
module.exports = {
  query: (...args) => getPool().query(...args),
  connect: (...args) => getPool().connect(...args),
};
