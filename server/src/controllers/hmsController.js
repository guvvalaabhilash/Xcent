const Appointment = require("../models/Appointment");
const Billing = require("../models/Billing");
const MedicalRecord = require("../models/MedicalRecord");
const Prescription = require("../models/Prescription");
const User = require("../models/User");

exports.adminAnalytics = async (req, res, next) => {
  try {
    const [doctors, patients, appointments, revenueData] = await Promise.all([
      User.countDocuments({ role: "doctor" }),
      User.countDocuments({ role: "patient" }),
      Appointment.countDocuments(),
      Billing.aggregate([{ $match: { paymentStatus: "paid" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    ]);
    res.json({
      doctors,
      patients,
      appointments,
      revenue: revenueData[0]?.total || 0,
    });
  } catch (error) {
    next(error);
  }
};

exports.listUsers = async (req, res, next) => {
  try {
    const { role, q = "", page = 1, limit = 10 } = req.query;
    const filter = {
      ...(role ? { role } : {}),
      fullName: { $regex: q, $options: "i" },
    };
    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter).select("-password").skip(skip).limit(Number(limit)),
      User.countDocuments(filter),
    ]);
    res.json({ data: users, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select("-password");
    res.json(user);
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (error) {
    next(error);
  }
};

exports.createAppointment = async (req, res, next) => {
  try {
    const patientId = req.user.role === "patient" ? req.user._id : req.body.patientId;
    const appointment = await Appointment.create({ ...req.body, patientId });
    res.status(201).json(appointment);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "Slot already booked" });
    next(error);
  }
};

exports.listAppointments = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    let filter = {};
    if (req.user.role === "doctor") filter.doctorId = req.user._id;
    if (req.user.role === "patient") filter.patientId = req.user._id;

    const [data, total] = await Promise.all([
      Appointment.find(filter)
        .populate("patientId", "fullName")
        .populate("doctorId", "fullName specialization")
        .sort({ appointmentDate: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Appointment.countDocuments(filter),
    ]);
    res.json({ data, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    next(error);
  }
};

exports.updateAppointment = async (req, res, next) => {
  try {
    const appt = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(appt);
  } catch (error) {
    next(error);
  }
};

exports.cancelAppointment = async (req, res, next) => {
  try {
    const appt = await Appointment.findByIdAndUpdate(req.params.id, { status: "cancelled" }, { new: true });
    res.json(appt);
  } catch (error) {
    next(error);
  }
};

exports.createMedicalRecord = async (req, res, next) => {
  try {
    const reportFiles = (req.files || []).map((f) => `/uploads/${f.filename}`);
    const record = await MedicalRecord.create({
      patientId: req.body.patientId,
      doctorId: req.user._id,
      diagnosis: req.body.diagnosis,
      notes: req.body.notes,
      reports: reportFiles,
    });
    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
};

exports.listMedicalRecords = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === "patient") filter.patientId = req.user._id;
    if (req.user.role === "doctor") filter.doctorId = req.user._id;
    if (req.query.patientId) filter.patientId = req.query.patientId;

    const records = await MedicalRecord.find(filter)
      .populate("patientId", "fullName")
      .populate("doctorId", "fullName specialization")
      .sort({ createdAt: -1 });
    res.json(records);
  } catch (error) {
    next(error);
  }
};

exports.createPrescription = async (req, res, next) => {
  try {
    const prescription = await Prescription.create({
      patientId: req.body.patientId,
      doctorId: req.user._id,
      appointmentId: req.body.appointmentId,
      medicines: req.body.medicines || [],
      advice: req.body.advice || "",
    });
    res.status(201).json(prescription);
  } catch (error) {
    next(error);
  }
};

exports.listPrescriptions = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === "patient") filter.patientId = req.user._id;
    if (req.user.role === "doctor") filter.doctorId = req.user._id;
    const data = await Prescription.find(filter)
      .populate("patientId", "fullName")
      .populate("doctorId", "fullName")
      .sort({ createdAt: -1 });
    res.json(data);
  } catch (error) {
    next(error);
  }
};

exports.generateBill = async (req, res, next) => {
  try {
    const invoiceNumber = `INV-${Date.now()}`;
    const bill = await Billing.create({ ...req.body, invoiceNumber });
    res.status(201).json(bill);
  } catch (error) {
    next(error);
  }
};

exports.listBills = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === "patient") filter.patientId = req.user._id;
    const bills = await Billing.find(filter).populate("patientId", "fullName").sort({ createdAt: -1 });
    res.json(bills);
  } catch (error) {
    next(error);
  }
};

exports.markBillPaid = async (req, res, next) => {
  try {
    const bill = await Billing.findByIdAndUpdate(
      req.params.id,
      { paymentStatus: "paid", paymentMethod: req.body.paymentMethod || "online" },
      { new: true }
    );
    res.json({
      ...bill.toObject(),
      paymentGateway: "Simulated Stripe/Razorpay integration success",
    });
  } catch (error) {
    next(error);
  }
};
