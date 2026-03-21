const express = require("express");
const multer = require("multer");
const path = require("path");
const { protect, authorize } = require("../middleware/auth");
const c = require("../controllers/hmsController");

const router = express.Router();
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.resolve("server/uploads")),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

router.get("/admin/analytics", protect, authorize("admin"), c.adminAnalytics);
router.get("/users", protect, authorize("admin", "receptionist"), c.listUsers);
router.put("/users/:id", protect, authorize("admin", "receptionist"), c.updateUser);
router.delete("/users/:id", protect, authorize("admin"), c.deleteUser);

router.post("/appointments", protect, c.createAppointment);
router.get("/appointments", protect, c.listAppointments);
router.put("/appointments/:id", protect, authorize("admin", "doctor", "receptionist"), c.updateAppointment);
router.patch("/appointments/:id/cancel", protect, c.cancelAppointment);

router.post("/records", protect, authorize("doctor"), upload.array("reports", 5), c.createMedicalRecord);
router.get("/records", protect, c.listMedicalRecords);

router.post("/prescriptions", protect, authorize("doctor"), c.createPrescription);
router.get("/prescriptions", protect, c.listPrescriptions);

router.post("/billing", protect, authorize("admin", "receptionist"), c.generateBill);
router.get("/billing", protect, c.listBills);
router.patch("/billing/:id/pay", protect, c.markBillPaid);

module.exports = router;
