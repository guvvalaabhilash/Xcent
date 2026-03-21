const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const User = require("../models/User");
const Otp = require("../models/Otp");
const generateToken = require("../utils/generateToken");
const { sendOtpEmail } = require("../services/emailService");

const otpValue = () => `${Math.floor(100000 + Math.random() * 900000)}`;

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { fullName, email, phone, password, role, specialization } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      fullName,
      email,
      phone,
      password: hashed,
      role: role || "patient",
      specialization,
    });

    const otp = otpValue();
    await Otp.create({
      email,
      otp,
      purpose: "verify",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    await sendOtpEmail(email, otp, "account verification");

    res.status(201).json({ message: "Registered. Verify OTP sent to email", userId: user._id });
  } catch (error) {
    next(error);
  }
};

exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const otpDoc = await Otp.findOne({ email, otp, purpose: "verify" }).sort({ createdAt: -1 });
    if (!otpDoc || otpDoc.expiresAt < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }
    await User.findOneAndUpdate({ email }, { isVerified: true });
    await Otp.deleteMany({ email, purpose: "verify" });
    return res.json({ message: "Account verified successfully" });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });
    if (!user.isVerified) return res.status(403).json({ message: "Account not verified" });

    const token = generateToken(user._id, user.role);
    res.json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Email not found" });
    const otp = otpValue();
    await Otp.create({
      email,
      otp,
      purpose: "reset",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    await sendOtpEmail(email, otp, "password reset");
    return res.json({ message: "Reset OTP sent" });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    const otpDoc = await Otp.findOne({ email, otp, purpose: "reset" }).sort({ createdAt: -1 });
    if (!otpDoc || otpDoc.expiresAt < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await User.findOneAndUpdate({ email }, { password: hashed });
    await Otp.deleteMany({ email, purpose: "reset" });
    return res.json({ message: "Password reset successful" });
  } catch (error) {
    next(error);
  }
};
