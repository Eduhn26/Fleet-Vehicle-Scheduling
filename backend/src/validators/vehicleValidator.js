const { z } = require('zod');

// NOTE: Enums are duplicated here so transport validation stays decoupled
// from Mongoose models and can fail fast before hitting persistence.
const VEHICLE_STATUS = ['available', 'maintenance'];
const TRANSMISSION_TYPE = ['manual', 'automatic'];
const FUEL_TYPE = ['gasoline', 'ethanol', 'flex', 'diesel', 'electric', 'hybrid'];

const licensePlate = z
  .string()
  .trim()
  .min(5, 'licensePlate muito curta')
  .max(10, 'licensePlate muito longa')
  .transform((v) => v.toUpperCase());

const createVehicleSchema = z.object({
  brand: z.string().trim().min(1, 'brand é obrigatória'),
  model: z.string().trim().min(1, 'model é obrigatório'),
  year: z.number().int('year deve ser inteiro').min(1900).max(new Date().getFullYear() + 1),
  licensePlate,
  color: z.string().trim().min(1, 'color é obrigatória'),
  mileage: z.number().min(0).optional().default(0),
  status: z.enum(VEHICLE_STATUS).optional().default('available'),
  transmissionType: z.enum(TRANSMISSION_TYPE),
  fuelType: z.enum(FUEL_TYPE),
  passengers: z.number().int().min(1).max(15),
  nextMaintenance: z.number().min(0),
  lastMaintenanceMileage: z.number().min(0).optional().default(0),

  // NOTE: imageUrl accepts either a valid URL or an empty string so
  // the frontend can keep optional image fields controlled without custom coercion.
  imageUrl: z
    .string()
    .trim()
    .url('imageUrl deve ser uma URL válida')
    .optional()
    .or(z.literal('')),
});

const updateMileageSchema = z.object({
  mileage: z.number().min(0, 'mileage não pode ser negativo'),
});

const setMaintenanceStatusSchema = z.object({
  status: z.enum(VEHICLE_STATUS),
});

const recordMaintenanceSchema = z.object({
  newNextMaintenance: z.number().min(0, 'newNextMaintenance não pode ser negativo'),
});

module.exports = {
  createVehicleSchema,
  updateMileageSchema,
  setMaintenanceStatusSchema,
  recordMaintenanceSchema,
};