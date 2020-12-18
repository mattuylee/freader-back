const crypto = require("crypto");
const jwt = require("jsonwebtoken");

/**
 * 生成jwt密钥
 * @param uid 用户ID
 * @param password 用户密码
 * @param salt 加密用的“盐”
 */
function jwtSecret(uid, password, salt) {
  return crypto
    .createHash("md5")
    .update(uid + password + salt)
    .digest("hex");
}
function jwtCreateToken(uid, secret) {
  return jwt.sign({ uid }, secret, { expiresIn: "30d", noTimestamp: true });
}
function jwtTokenToUserID(token) {
  const payload = jwt.decode(token);
  if (!payload) {
    return null;
  }
  return payload["uid"] || null;
}
/** 判断token是否应该更新。注意，并不会验证token */
function jwtShouldUpdate(token) {
  const payload = jwt.decode(token);
  if (!payload) {
    return true;
  }
  const expiration = payload["exp"] * 1000;
  return !(expiration - Date.now() > 7 * 86400000);
}

module.exports = {
  jwtCreateToken,
  jwtSecret,
  jwtShouldUpdate,
  jwtTokenToUserID,
  jwtVerify: jwt.verify,
};
