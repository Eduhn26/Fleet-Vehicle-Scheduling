const express = require('express');

const validate = require('../middleware/validate');
const { loginSchema } = require('../validators/authValidator');
const authController = require('../controllers/authController');

const router = express.Router();

/*
ENGINEERING NOTE:
This is the only public route module in the API.
Authentication must remain accessible before JWT protection, while
all fleet and rental routes stay behind auth middleware.
*/
router.post('/login', validate(loginSchema), authController.login);

module.exports = router;