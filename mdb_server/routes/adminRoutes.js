const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware } = require('../middleware/auth');

console.log('Admin routes loaded successfully'); // Debug log

router.post('/', adminController.createAdmin);
router.get('/:id', authMiddleware, adminController.getAdmin);
router.get('/', authMiddleware, adminController.getAllAdmins);
router.put('/:id', authMiddleware, adminController.updateAdmin);
router.delete('/:id', authMiddleware, adminController.deleteAdmin);
router.post('/login', adminController.loginAdmin);

console.log('Admin routes defined:', router.stack.map(r => `${r.route?.methods ? Object.keys(r.route.methods).join(', ').toUpperCase() : ''} ${r.route?.path || ''}`)); // Debug log

module.exports = router;