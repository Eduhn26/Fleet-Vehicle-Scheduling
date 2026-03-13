const expectAppError = async (promise, expected) => {
  try {
    await promise;
    throw new Error('Expected promise to reject, but it resolved.');
  } catch (error) {
    if (expected?.statusCode !== undefined && error.statusCode !== undefined) {
      expect(error.statusCode).toBe(expected.statusCode);
    }

    if (expected?.messageIncludes) {
      expect(String(error.message || '')).toContain(expected.messageIncludes);
    }

    return error;
  }
};

module.exports = {
  expectAppError
};