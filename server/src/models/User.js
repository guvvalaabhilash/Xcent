const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "doctor", "patient", "receptionist"],
      default: "patient",
    },
    specialization: { type: String, trim: true },
    experienceYears: { type: Number, default: 0 },
    availabilitySlots: [
      {
        day: String,
        startTime: String,
        endTime: String,
      },
    ],
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
