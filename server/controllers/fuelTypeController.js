const FuelType = require('../models/FuelType');

const getAllFuelTypes = async (req, res) => {
  try {
    const fuelTypes = await FuelType.find().sort({ createdAt: -1 });
    res.json(fuelTypes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getFuelTypeById = async (req, res) => {
  try {
    const fuelType = await FuelType.findById(req.params.id);
    if (!fuelType) {
      return res.status(404).json({ message: 'មិនឃើញប្រភេទសាំង' });
    }
    res.json(fuelType);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createFuelType = async (req, res) => {
  try {
    const { name, price, unit, litersPerTon } = req.body;
    
    // Set default litersPerTon based on fuel type name
    let defaultLitersPerTon = 1390; // Default for regular and super
    if (name && (name.toLowerCase().includes('ម៉ាស៊ូត') || name.toLowerCase().includes('diesel'))) {
      defaultLitersPerTon = 1190;
    }
    
    const fuelType = new FuelType({ 
      name, 
      price: price || 0, // Optional, defaults to 0
      unit: unit || 'liter',
      litersPerTon: litersPerTon || defaultLitersPerTon
    });
    await fuelType.save();
    res.status(201).json(fuelType);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateFuelType = async (req, res) => {
  try {
    const { name, price, unit, litersPerTon } = req.body;
    const updateData = { name, price: price || 0, unit: unit || 'liter' };
    if (litersPerTon !== undefined) {
      updateData.litersPerTon = litersPerTon;
    }
    const fuelType = await FuelType.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!fuelType) {
      return res.status(404).json({ message: 'មិនឃើញប្រភេទសាំង' });
    }
    res.json(fuelType);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteFuelType = async (req, res) => {
  try {
    const fuelType = await FuelType.findByIdAndDelete(req.params.id);
    if (!fuelType) {
      return res.status(404).json({ message: 'មិនឃើញប្រភេទសាំង' });
    }
    res.json({ message: 'លុបប្រភេទសាំងដោយជោគជ័យ' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllFuelTypes,
  getFuelTypeById,
  createFuelType,
  updateFuelType,
  deleteFuelType
};

