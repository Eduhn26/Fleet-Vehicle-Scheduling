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

/*
ENGINEERING NOTE:
This router exposes read-only fleet endpoints to authenticated users,
while mutation endpoints remain restricted to admin roles.

The assertFn guard ensures that controller handlers exist at module
load time, preventing silent runtime failures caused by missing exports.
*/
const assertFn = (fn, name) => {
  if (typeof fn !== 'function') {
    throw new Error(`Invalid handler: vehicleController.${name} is not a function`);
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

// Public fleet visibility endpoints
router.get('/', vehicleController.listVehicles);
router.get('/:licensePlate', vehicleController.getByLicensePlate);
router.get('/:licensePlate/availability', vehicleController.getAvailability);

// Admin-only fleet mutation endpoints
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