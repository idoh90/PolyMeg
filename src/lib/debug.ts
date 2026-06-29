/**
 * Passwordless debug login (the 1234 / 0000 shortcuts and the /login/quick
 * avatar picker). OFF by default — only enabled when ALLOW_DEBUG_LOGIN="true".
 *
 * NEVER set ALLOW_DEBUG_LOGIN=true on the public production deployment: it lets
 * anyone sign in as any account without a password. Use it on local/preview only.
 */
export function debugLoginEnabled(): boolean {
  return process.env.ALLOW_DEBUG_LOGIN === "true";
}
