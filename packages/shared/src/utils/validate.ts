/** 验证手机号 */
export function isValidPhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone);
}

/** 验证密码强度：至少6位 */
export function isValidPassword(password: string): boolean {
  return password.length >= 6;
}

/** 验证用户名：3-20位字母数字下划线 */
export function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}
