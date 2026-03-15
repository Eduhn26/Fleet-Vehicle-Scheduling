/*
ENGINEERING NOTE:
IP resolution uses a priority chain to handle reverse proxy setups correctly.
X-Forwarded-For is checked first (set by load balancers and CDNs), followed by
X-Real-IP, then Express's req.ip (which respects trust proxy), and finally the
raw socket address as a last resort. IPv6 loopback and IPv4-mapped addresses
are normalised so logs always contain a clean IPv4 string.
*/

const normalizeIp = (value) => {
  const ip = String(value || '').trim();

  if (!ip) return '';

  if (ip === '::1') return '127.0.0.1';

  if (ip.startsWith('::ffff:')) {
    return ip.slice(7);
  }

  return ip;
};

const extractForwardedIp = (headerValue) => {
  const forwarded = String(headerValue || '').trim();
  if (!forwarded) return '';

  // NOTE: X-Forwarded-For may contain a comma-separated chain — the first entry is the original client.
  const firstIp = forwarded.split(',')[0]?.trim();
  return normalizeIp(firstIp);
};

const getClientIp = (req) => {
  const forwardedIp = extractForwardedIp(req.headers['x-forwarded-for']);
  if (forwardedIp) return forwardedIp;

  const realIp = normalizeIp(req.headers['x-real-ip']);
  if (realIp) return realIp;

  const expressIp = normalizeIp(req.ip);
  if (expressIp) return expressIp;

  const socketIp = normalizeIp(req.socket?.remoteAddress);
  if (socketIp) return socketIp;

  return 'unknown-client';
};

module.exports = getClientIp;