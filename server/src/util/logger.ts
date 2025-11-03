export function log(message: string, ...args: unknown[]) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, ...args);
}

export function error(message: string, ...args: unknown[]) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR: ${message}`, ...args);
}

export function maskToken(token: string): string {
  if (token.length <= 8) return '***';
  return `${token.substring(0, 4)}...${token.substring(token.length - 4)}`;
}

