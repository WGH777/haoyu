/**
 * ensure-system-wallets.js
 * 
 * 幂等创建系统钱包和系统用户
 * 重复运行安全
 */
const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, '..', 'prisma', 'dev.db');
const db = new Database(DB_PATH);

console.log('🔗 系统钱包初始化...');

// ═══ System User ═══
const SYSTEM_EMAIL = 'system@haoyu.local';
let systemUser = db.prepare('SELECT id FROM User WHERE email = ?').get(SYSTEM_EMAIL);

if (!systemUser) {
  const hash = crypto.randomBytes(32).toString('hex');
  const now = new Date().toISOString();
  const result = db.prepare(
    'INSERT INTO User (email, password, nickname, role, updatedAt) VALUES (?, ?, ?, ?, ?)'
  ).run(SYSTEM_EMAIL, hash, '系统', 'ADMIN', now);
  systemUser = { id: result.lastInsertRowid };
  console.log(`  ✅ 系统用户已创建: id=${systemUser.id}`);
} else {
  console.log(`  ⏭ 系统用户已存在: id=${systemUser.id}`);
}

// ═══ System Wallets ═══
const wallets = [
  { id: 'wallet_platform_fee', code: 'SYSTEM_PLATFORM_FEE', desc: '平台费收款' },
  { id: 'wallet_risk_reserve', code: 'SYSTEM_RISK_RESERVE', desc: '风控预留金' },
];

for (const w of wallets) {
  const exists = db.prepare('SELECT id FROM Wallet WHERE code = ?').get(w.code);
  if (!exists) {
    const now = new Date().toISOString();
    db.prepare(
      'INSERT INTO Wallet (id, ownerType, userId, currency, available, frozen, code, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(w.id, 'SYSTEM', systemUser.id, 'CNY', 0, 0, w.code, now, now);
    console.log(`  ✅ ${w.desc}钱包已创建: code=${w.code}`);
  } else {
    console.log(`  ⏭ ${w.desc}钱包已存在: code=${w.code}`);
  }
}

// ═══ Verification ═══
console.log('\n📊 系统钱包状态:');
const rows = db.prepare(
  'SELECT id, ownerType, code, currency, available, frozen FROM Wallet WHERE ownerType = ?'
).all('SYSTEM');
for (const r of rows) {
  console.log(`  ${r.code || r.id}: available=${r.available} frozen=${r.frozen}`);
}

db.close();
console.log('\n✅ 系统钱包初始化完毕');
