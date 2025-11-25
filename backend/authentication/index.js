const express = require('express');
const router = express.Router();

// Placeholder route - will be implemented later
router.get('/', (req, res) => {
  res.json({
    message: 'Authentication module is active',
    routes: 'Authentication routes will be added here'
  });
});

module.exports = router;

