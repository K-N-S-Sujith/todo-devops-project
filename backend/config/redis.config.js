const Redis = require('ioredis');

let redis = null;

const getRedisClient = () => {
  if (redis) return redis;

  if (!process.env.REDIS_URL) {
    console.warn('⚠️  REDIS_URL not set. Redis features disabled.');
    return null;
  }

  try {
    redis = new Redis(process.env.REDIS_URL, {
      tls: process.env.REDIS_URL.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      lazyConnect: true,
    });

    redis.on('connect', () => console.log('✅ Redis Connected'));
    redis.on('error', (err) => console.error('❌ Redis Error:', err.message));

    return redis;
  } catch (err) {
    console.error('❌ Redis Init Error:', err.message);
    return null;
  }
};

// ─── Helper Wrappers (gracefully degrade if Redis down) ───────────────────────

const redisGet = async (key) => {
  const client = getRedisClient();
  if (!client) return null;
  try {
    return await client.get(key);
  } catch { return null; }
};

const redisSet = async (key, value, ttlSeconds = null) => {
  const client = getRedisClient();
  if (!client) return false;
  try {
    if (ttlSeconds) {
      await client.setex(key, ttlSeconds, value);
    } else {
      await client.set(key, value);
    }
    return true;
  } catch { return false; }
};

const redisDel = async (key) => {
  const client = getRedisClient();
  if (!client) return false;
  try {
    await client.del(key);
    return true;
  } catch { return false; }
};

const redisIncr = async (key) => {
  const client = getRedisClient();
  if (!client) return null;
  try {
    return await client.incr(key);
  } catch { return null; }
};

const redisExpire = async (key, ttlSeconds) => {
  const client = getRedisClient();
  if (!client) return false;
  try {
    await client.expire(key, ttlSeconds);
    return true;
  } catch { return false; }
};

const redisTTL = async (key) => {
  const client = getRedisClient();
  if (!client) return -1;
  try {
    return await client.ttl(key);
  } catch { return -1; }
};

module.exports = {
  getRedisClient,
  redisGet,
  redisSet,
  redisDel,
  redisIncr,
  redisExpire,
  redisTTL,
};