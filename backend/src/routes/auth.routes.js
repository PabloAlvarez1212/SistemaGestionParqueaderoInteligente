const { Router } = require('express');
const { me } = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = Router();

router.get('/me', authMiddleware, me);

module.exports = router;

