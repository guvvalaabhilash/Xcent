const mongoose = require("mongoose");

const billingSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
    amount: { type: Number, required: true },
    paymentStatus: { type: String, enum: ["pending", "paid"], default: "pending" },
    paymentMethod: { type: String, default: "online" },
    invoiceNumber: { type: String, unique: true, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Billing", billingSchema);
