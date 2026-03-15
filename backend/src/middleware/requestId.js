const crypto = require('crypto');

const REQUEST_ID_HEADER = 'X-Request-Id';

/*
ENGINEERING NOTE:
Every request receives a correlation identifier.
This id links logs from middleware, controllers, and services
during debugging and incident investigation.

If the client, proxy, or gateway already sends an X-Request-Id header,
the value is preserved to maintain upstream tracing continuity.
*/
const generateRequestId = () => {
  // NOTE: native randomUUID is preferred when available — it is more robust.
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // COMPAT: fallback for environments without randomUUID support.
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const requestId = (req, res, next) => {
  const incomingHeader = req.get(REQUEST_ID_HEADER);
  const incomingId = String(incomingHeader || '').trim();

  // NOTE: preserves upstream correlation id when already present.
  const id = incomingId || generateRequestId();

  req.id = id;
  res.setHeader(REQUEST_ID_HEADER, id);

  next();
};

module.exports = requestId;