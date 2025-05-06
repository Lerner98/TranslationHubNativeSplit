const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authMiddleware } = require('../middleware/auth');

router.post('/', reportController.submitReport);
router.get('/:id', authMiddleware, reportController.getReport);
router.get('/', authMiddleware, reportController.getAllReports);
router.put('/:id', authMiddleware, reportController.updateReport);
router.delete('/:id', authMiddleware, reportController.deleteReport);
router.get('/statistics/errors-by-day', authMiddleware, reportController.getErrorsByDay);
router.get('/statistics/most-reported', authMiddleware, reportController.getMostReported);

module.exports = router;