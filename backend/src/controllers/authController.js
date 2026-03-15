const authService = require('../services/authService');

/*
ENGINEERING NOTE:
Controllers are intentionally thin — they own HTTP concerns only.
Request parsing, response formatting, and error forwarding happen here.
All authentication logic lives exclusively in authService.
*/
const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    return res.status(200).json({ data: result });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  login,
};