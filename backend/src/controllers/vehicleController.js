const vehicleService = require('../services/vehicleService');

const listVehicles = async (_req, res, next) => {
  try {
    const vehicles = await vehicleService.listVehicles();
    return res.status(200).json({ data: vehicles });
  } catch (err) {
    return next(err);
  }
};

const getByLicensePlate = async (req, res, next) => {
  try {
    const { licensePlate } = req.params;

    const vehicle = await vehicleService.findByLicensePlate(licensePlate);
    return res.status(200).json({ data: vehicle });
  } catch (err) {
    return next(err);
  }
};

const createVehicle = async (req, res, next) => {
  try {
    const created = await vehicleService.createVehicle(req.body);
    return res.status(201).json({ data: created });
  } catch (err) {
    return next(err);
  }
};

const updateMileage = async (req, res, next) => {
  try {
    const { licensePlate } = req.params;

    const updated = await vehicleService.updateMileage({
      licensePlate,
      mileage: req.body.mileage,
    });

    return res.status(200).json({ data: updated });
  } catch (err) {
    return next(err);
  }
};

const setMaintenanceStatus = async (req, res, next) => {
  try {
    const { licensePlate } = req.params;

    const updated = await vehicleService.setMaintenanceStatus({
      licensePlate,
      status: req.body.status,
    });

    return res.status(200).json({ data: updated });
  } catch (err) {
    return next(err);
  }
};

const recordMaintenance = async (req, res, next) => {
  try {
    const { licensePlate } = req.params;

    const updated = await vehicleService.recordMaintenance({
      licensePlate,
      newNextMaintenance: req.body.newNextMaintenance,
    });

    return res.status(200).json({ data: updated });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  listVehicles,
  getByLicensePlate,
  createVehicle,
  updateMileage,
  setMaintenanceStatus,
  recordMaintenance,
};