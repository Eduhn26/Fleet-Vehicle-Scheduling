const express = require('express');

const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const analyticsController = require('../controllers/analyticsController');

const router = express.Router();

// Analytics exposes operational summaries, so it starts as admin-only.
router.get('/health', auth, requireRole('admin'), analyticsController.health);

module.exports = router;