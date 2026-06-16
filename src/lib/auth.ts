import bcrypt from "bcryptjs";

// 4-digit PIN handling. PINs are hashed with bcrypt before storage; we never
// store the raw PIN.

export function isValidPin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}
