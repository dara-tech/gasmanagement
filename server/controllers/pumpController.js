const Pump = require('../models/Pump');

const getAllPumps = async (req, res) => {
  try {
    const pumps = await Pump.find().populate('fuelTypeId').sort({ pumpNumber: 1 });
    res.json(pumps);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPumpById = async (req, res) => {
  try {
    const pump = await Pump.findById(req.params.id).populate('fuelTypeId');
    if (!pump) {
      return res.status(404).json({ message: 'មិនឃើញស្តុកសាំង' });
    }
    res.json(pump);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createPump = async (req, res) => {
  try {
    const { pumpNumber, fuelTypeId, status, stockLiters } = req.body;
    const pump = new Pump({ 
      pumpNumber, 
      fuelTypeId, 
      status: status || 'active',
      stockLiters: stockLiters || 0
    });
    await pump.save();
    const populatedPump = await Pump.findById(pump._id).populate('fuelTypeId');
    res.status(201).json(populatedPump);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updatePump = async (req, res) => {
  try {
    const { pumpNumber, fuelTypeId, status, stockLiters } = req.body;
    const updateData = { pumpNumber, fuelTypeId, status };
    if (stockLiters !== undefined) {
      updateData.stockLiters = stockLiters;
    }
    const pump = await Pump.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('fuelTypeId');
    if (!pump) {
      return res.status(404).json({ message: 'មិនឃើញស្តុកសាំង' });
    }
    res.json(pump);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deletePump = async (req, res) => {
  try {
    const pump = await Pump.findByIdAndDelete(req.params.id);
    if (!pump) {
      return res.status(404).json({ message: 'មិនឃើញស្តុកសាំង' });
    }
    res.json({ message: 'លុបស្តុកសាំងដោយជោគជ័យ' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllPumps,
  getPumpById,
  createPump,
  updatePump,
  deletePump
};

