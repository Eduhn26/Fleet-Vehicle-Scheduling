const crypto = require('crypto');

const REQUEST_ID_HEADER = 'X-Request-Id';

const generateRequestId = () => {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const requestId = (req, res, next) => {
  const incomingHeader = req.get(REQUEST_ID_HEADER);
  const incomingId = String(incomingHeader || '').trim();

  const id = incomingId || generateRequestId();

  req.id = id;
  res.setHeader(REQUEST_ID_HEADER, id);

  next();
};

module.exports = requestId;