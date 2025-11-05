const express = require('express');
const router = express.Router();
const {
  getAllFuelTypes,
  getFuelTypeById,
  createFuelType,
  updateFuelType,
  deleteFuelType
} = require('../controllers/fuelTypeController');
const auth = require('../middleware/auth');

router.get('/', getAllFuelTypes);
router.get('/:id', getFuelTypeById);
router.post('/', auth, createFuelType);
router.put('/:id', auth, updateFuelType);
router.delete('/:id', auth, deleteFuelType);

module.exports = router;

