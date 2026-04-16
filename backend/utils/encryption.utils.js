const crypto = require('crypto');

const ALGORITHM = 'chacha20-poly1305';
const KEY_LENGTH = 32; // 256-bit key

/**
 * Get encryption key from env (hex string → Buffer)
 */
const getKey = () => {
  const hexKey = process.env.ENCRYPTION_KEY;
  if (!hexKey || hexKey.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
  }
  return Buffer.from(hexKey, 'hex');
};

/**
 * Encrypt plaintext using ChaCha20-Poly1305
 * Returns: { ciphertext: hex, iv: hex, authTag: hex }
 */
const encrypt = (plaintext) => {
  if (!plaintext) return null;
  
  const key = getKey();
  const iv = crypto.randomBytes(12); // 96-bit nonce for ChaCha20-Poly1305
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: 16, // 128-bit auth tag
  });
  
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  
  const authTag = cipher.getAuthTag();
  
  return {
    ciphertext: encrypted.toString('hex'),
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
};

/**
 * Decrypt ciphertext using ChaCha20-Poly1305
 * Accepts: { ciphertext: hex, iv: hex, authTag: hex }
 */
const decrypt = ({ ciphertext, iv, authTag }) => {
  if (!ciphertext || !iv || !authTag) return null;
  
  const key = getKey();
  
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(iv, 'hex'),
    { authTagLength: 16 }
  );
  
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'hex')),
    decipher.final(),
  ]);
  
  return decrypted.toString('utf8');
};

/**
 * Encrypt to a single storable string: iv:authTag:ciphertext
 */
const encryptToString = (plaintext) => {
  if (!plaintext) return null;
  const result = encrypt(plaintext);
  return `${result.iv}:${result.authTag}:${result.ciphertext}`;
};

/**
 * Decrypt from a single storable string: iv:authTag:ciphertext
 */
const decryptFromString = (encryptedString) => {
  if (!encryptedString) return null;
  const parts = encryptedString.split(':');
  if (parts.length !== 3) throw new Error('Invalid encrypted string format');
  const [iv, authTag, ciphertext] = parts;
  return decrypt({ ciphertext, iv, authTag });
};

/**
 * Generate a new random 32-byte key (helper for setup)
 */
const generateKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

module.exports = {
  encrypt,
  decrypt,
  encryptToString,
  decryptFromString,
  generateKey,
};