const express = require('express');
const router = express.Router();

// Placeholder route - will be implemented later
router.get('/', (req, res) => {
  res.json({
    message: 'Employees module is active',
    routes: 'Employee routes will be added here'
  });
});

module.exports = router;

