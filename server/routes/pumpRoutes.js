const express = require('express');
const router = express.Router();
const {
  getAllPumps,
  getPumpById,
  createPump,
  updatePump,
  deletePump
} = require('../controllers/pumpController');
const auth = require('../middleware/auth');

router.get('/', getAllPumps);
router.get('/:id', getPumpById);
router.post('/', auth, createPump);
router.put('/:id', auth, updatePump);
router.delete('/:id', auth, deletePump);

module.exports = router;

