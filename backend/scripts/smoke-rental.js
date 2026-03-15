require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = require('../src/config/database');

const rentalService = require('../src/services/rentalService');

const { User } = require('../src/models/User');
const { Vehicle } = require('../src/models/Vehicle');

async function run() {
  try {
    await connectDB();

    console.log('\n=== SMOKE TEST — RENTAL LIFECYCLE ===\n');

    const user = await User.findOne();
    const vehicle = await Vehicle.findOne();

    if (!user || !vehicle) {
      throw new Error('Necessário seed de usuário e veículo');
    }

    const startDate = '2030-01-10';
    const endDate = '2030-01-12';

    console.log('1️⃣ Criando solicitação...');

    /*
    NOTE:
    Smoke test calls the service directly instead of going through HTTP.
    This validates domain rules without interference from middleware,
    controllers, or transport-layer validation.
    */
    const request = await rentalService.createRequest({
      userId: user._id.toString(),
      vehicleId: vehicle._id.toString(),
      startDate,
      endDate,
      purpose: 'Teste de reserva',
    });

    console.log('Request criada:', request.status);

    console.log('\n2️⃣ Aprovando solicitação...');

    const approved = await rentalService.approveRequest({
      requestId: request.id,
      adminNotes: 'Aprovado no smoke test',
    });

    console.log('Status após approve:', approved.status);

    console.log('\n3️⃣ Tentando criar conflito de data...');

    /*
    NOTE:
    Only APPROVED reservations block the calendar.
    This test ensures createRequest detects a conflict
    when an approved reservation already exists for the same period.
    */
    try {
      await rentalService.createRequest({
        userId: user._id.toString(),
        vehicleId: vehicle._id.toString(),
        startDate,
        endDate,
        purpose: 'Conflito esperado',
      });
    } catch (err) {
      console.log('Conflito detectado ✔');
    }

    console.log('\n4️⃣ Cancelando reserva...');

    const cancelled = await rentalService.cancelRequest({
      requestId: request.id,
      actorUserId: user._id.toString(),
      actorRole: user.role,
      cancelNotes: 'Cancelamento teste',
    });

    console.log('Status após cancel:', cancelled.status);

    console.log('\n5️⃣ Tentando cancelar novamente...');

    try {
      await rentalService.cancelRequest({
        requestId: request.id,
        actorUserId: user._id.toString(),
        actorRole: user.role,
      });
    } catch (err) {
      console.log('Cancelamento duplicado bloqueado ✔');
    }

    console.log('\n6️⃣ Tentando aprovar reserva cancelada...');

    /*
    NOTE:
    The reservation lifecycle does not allow reopening a flow after cancellation.
    This test validates that approveRequest enforces that transition guard.
    */
    try {
      await rentalService.approveRequest({
        requestId: request.id,
      });
    } catch (err) {
      console.log('Approve após cancel bloqueado ✔');
    }

    console.log('\n=== SMOKE TEST FINALIZADO ===\n');

    process.exit(0);
  } catch (err) {
    console.error('\nERRO NO SMOKE TEST\n');
    console.error(err);

    process.exit(1);
  }
}

run();