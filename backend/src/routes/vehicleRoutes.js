const express = require('express');
const validate = require('../middleware/validate');
const vehicleController = require('../controllers/vehicleController');

const {
  createVehicleSchema,
  updateMileageSchema,
  setMaintenanceStatusSchema,
  recordMaintenanceSchema,
} = require('../validators/vehicleValidator');

const assertFn = (fn, name) => {
  if (typeof fn !== 'function') {
    throw new Error(`Handler inválido: vehicleController.${name} não é função (export/import quebrado)`);
  }
};

assertFn(vehicleController.listVehicles, 'listVehicles');
assertFn(vehicleController.getByLicensePlate, 'getByLicensePlate');
assertFn(vehicleController.createVehicle, 'createVehicle');
assertFn(vehicleController.updateMileage, 'updateMileage');
assertFn(vehicleController.setMaintenanceStatus, 'setMaintenanceStatus');
assertFn(vehicleController.recordMaintenance, 'recordMaintenance');

const router = express.Router();

router.get('/', vehicleController.listVehicles);
router.get('/:licensePlate', vehicleController.getByLicensePlate);

router.post('/', validate(createVehicleSchema), vehicleController.createVehicle);

router.patch('/:licensePlate/mileage', validate(updateMileageSchema), vehicleController.updateMileage);

router.patch('/:licensePlate/status', validate(setMaintenanceStatusSchema), vehicleController.setMaintenanceStatus);

router.patch('/:licensePlate/maintenance', validate(recordMaintenanceSchema), vehicleController.recordMaintenance);

module.exports = router;