const express = require('express');
const router = express.Router();
const { getAdminDashboard } = require('../controllers/adminController');

router.get('/dashboard', getAdminDashboard);

module.exports = router;
