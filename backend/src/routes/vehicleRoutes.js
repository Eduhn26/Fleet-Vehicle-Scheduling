const express = require('express');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const vehicleController = require('../controllers/vehicleController');

const {
  createVehicleSchema,
  updateMileageSchema,
  setMaintenanceStatusSchema,
  recordMaintenanceSchema,
} = require('../validators/vehicleValidator');

const assertFn = (fn, name) => {
  if (typeof fn !== 'function') {
    throw new Error(`Handler inválido: vehicleController.${name} não é função`);
  }
};

assertFn(vehicleController.listVehicles, 'listVehicles');
assertFn(vehicleController.getByLicensePlate, 'getByLicensePlate');
assertFn(vehicleController.getAvailability, 'getAvailability');
assertFn(vehicleController.createVehicle, 'createVehicle');
assertFn(vehicleController.updateMileage, 'updateMileage');
assertFn(vehicleController.setMaintenanceStatus, 'setMaintenanceStatus');
assertFn(vehicleController.recordMaintenance, 'recordMaintenance');

const router = express.Router();

// Public
router.get('/', vehicleController.listVehicles);
router.get('/:licensePlate', vehicleController.getByLicensePlate);
router.get('/:licensePlate/availability', vehicleController.getAvailability);

// Admin only
router.post(
  '/',
  auth,
  requireRole('admin'),
  validate(createVehicleSchema),
  vehicleController.createVehicle
);

router.patch(
  '/:licensePlate/mileage',
  auth,
  requireRole('admin'),
  validate(updateMileageSchema),
  vehicleController.updateMileage
);

router.patch(
  '/:licensePlate/status',
  auth,
  requireRole('admin'),
  validate(setMaintenanceStatusSchema),
  vehicleController.setMaintenanceStatus
);

router.patch(
  '/:licensePlate/maintenance',
  auth,
  requireRole('admin'),
  validate(recordMaintenanceSchema),
  vehicleController.recordMaintenance
);

router.delete(
  '/:licensePlate',
  auth,
  requireRole('admin'),
  vehicleController.deleteVehicle
);

module.exports = router;