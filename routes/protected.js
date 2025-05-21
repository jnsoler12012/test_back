const express = require('express');
const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/secret', authenticateToken, (req, res) => {
    res.json({ message: `Hello ${req.user.username}, this is protected data.` });
});

module.exports = router;