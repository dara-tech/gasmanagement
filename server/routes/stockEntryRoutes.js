const express = require('express');
const router = express.Router();
const {
  getAllStockEntries,
  getStockEntryById,
  createStockEntry,
  updateStockEntry,
  deleteStockEntry
} = require('../controllers/stockEntryController');
const auth = require('../middleware/auth');

router.get('/', auth, getAllStockEntries);
router.get('/:id', auth, getStockEntryById);
router.post('/', auth, createStockEntry);
router.put('/:id', auth, updateStockEntry);
router.delete('/:id', auth, deleteStockEntry);

module.exports = router;

