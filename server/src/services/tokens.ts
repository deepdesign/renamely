import crypto from 'crypto';

const SECRET = crypto.randomBytes(32);

export function sign(fileId: string, expUnix: number): string {
  const payload = `${fileId}.${expUnix}`;
  const h = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  return `${h}.${expUnix}`;
}

export function verify(fileId: string, token: string): boolean {
  try {
    const [sig, expStr] = token.split('.');
    const exp = Number(expStr);
    
    if (!exp || isNaN(exp) || Date.now() / 1000 > exp) {
      return false;
    }

    const expected = crypto.createHmac('sha256', SECRET)
      .update(`${fileId}.${exp}`)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(sig),
      Buffer.from(expected)
    );
  } catch {
    return false;
  }
}

