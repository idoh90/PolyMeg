import bcrypt from "bcryptjs";

// Account password handling (bcrypt). Also used for optional group passwords.

export function isValidUsername(u: string): boolean {
  return /^[a-zA-Z0-9_.]{3,20}$/.test(u);
}

export function isValidPassword(p: string): boolean {
  return typeof p === "string" && p.length >= 4;
}

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10);
}

export async function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}
