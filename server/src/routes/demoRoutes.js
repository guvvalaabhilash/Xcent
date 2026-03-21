const express = require("express");

const router = express.Router();

const store = {
  users: [
    { _id: "u1", fullName: "Admin User", email: "admin@demo.com", role: "admin" },
    { _id: "u2", fullName: "Reception User", email: "reception@demo.com", role: "receptionist" },
    { _id: "u3", fullName: "Doctor User", email: "doctor@demo.com", role: "doctor" },
  ],
  appointments: [],
  records: [{ _id: "r1", diagnosis: "Demo diagnosis", createdAt: new Date().toISOString() }],
  billing: [{ _id: "b1", invoiceNumber: "INV-DEMO-001", amount: 0, paymentStatus: "pending" }],
};

const createDemoToken = (role) => `demo-${role}-${Date.now()}`;

const getRoleFromToken = (req) => {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  if (!token.startsWith("demo-")) return null;
  const parts = token.split("-");
  return parts[1] || null;
};

const requireAuth = (req, res, next) => {
  const role = getRoleFromToken(req);
  if (!role) return res.status(401).json({ message: "Unauthorized (demo token required)" });
  req.user = { role, _id: `demo-${role}` };
  next();
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden: role not allowed" });
  }
  next();
};

router.post("/auth/register", (req, res) => {
  const { fullName, email, role = "patient" } = req.body || {};
  if (!fullName || !email) return res.status(400).json({ message: "fullName and email are required" });
  store.users.push({ _id: `u${Date.now()}`, fullName, email, role });
  return res.status(201).json({ message: "Registered in demo mode. OTP auto-verified." });
});

router.post("/auth/verify-otp", (req, res) => {
  res.json({ message: "OTP verified (demo mode)." });
});

router.post("/auth/login", (req, res) => {
  const email = (req.body?.email || "").toLowerCase();
  const selectedUser = store.users.find((u) => u.email.toLowerCase() === email) || {
    _id: `u${Date.now()}`,
    fullName: "Demo Patient",
    email: req.body?.email || "patient@demo.com",
    role: "patient",
  };
  const token = createDemoToken(selectedUser.role);
  return res.json({ token, user: { id: selectedUser._id, role: selectedUser.role, fullName: selectedUser.fullName } });
});

router.get("/admin/analytics", requireAuth, requireRole("admin"), (req, res) => {
  res.json({
    doctors: store.users.filter((u) => u.role === "doctor").length,
    patients: store.users.filter((u) => u.role === "patient").length,
    appointments: store.appointments.length,
    revenue: store.billing.reduce((sum, b) => sum + Number(b.amount || 0), 0),
  });
});

router.get("/users", requireAuth, requireRole("admin", "receptionist"), (req, res) => {
  res.json({ data: store.users });
});

router.get("/appointments", requireAuth, (req, res) => {
  res.json({ data: store.appointments });
});

router.post("/appointments", requireAuth, (req, res) => {
  const { doctorId, appointmentDate, slot, reason } = req.body || {};
  if (!doctorId || !appointmentDate || !slot) {
    return res.status(400).json({ message: "doctorId, appointmentDate and slot are required" });
  }
  const appt = {
    _id: `a${Date.now()}`,
    doctorId,
    patientId: req.user._id,
    appointmentDate,
    slot,
    reason: reason || "",
    status: "scheduled",
  };
  store.appointments.unshift(appt);
  return res.status(201).json(appt);
});

router.get("/records", requireAuth, (req, res) => {
  res.json(store.records);
});

router.get("/billing", requireAuth, (req, res) => {
  res.json(store.billing);
});

module.exports = router;
