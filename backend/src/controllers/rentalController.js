const rentalService = require('../services/rentalService');

const listRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    const requests = await rentalService.listRequests({ status });
    return res.status(200).json({ data: requests });
  } catch (err) {
    return next(err);
  }
};

const listMyRequests = async (req, res, next) => {
  try {
    const requests = await rentalService.listRequests({
      userId: req.user.userId,
    });

    return res.status(200).json({ data: requests });
  } catch (err) {
    return next(err);
  }
};

const createRequest = async (req, res, next) => {
  try {
    const created = await rentalService.createRequest({
      userId: req.user.userId,
      vehicleId: req.body.vehicleId,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      purpose: req.body.purpose,
    });

    return res.status(201).json({ data: created });
  } catch (err) {
    return next(err);
  }
};

const approveRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const approved = await rentalService.approveRequest({
      requestId: id,
      adminNotes: req.body.adminNotes,
    });

    return res.status(200).json({ data: approved });
  } catch (err) {
    return next(err);
  }
};

const rejectRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const rejected = await rentalService.rejectRequest({
      requestId: id,
      adminNotes: req.body.adminNotes,
    });

    return res.status(200).json({ data: rejected });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  listRequests,
  listMyRequests,
  createRequest,
  approveRequest,
  rejectRequest,
};