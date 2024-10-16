const express = require("express");
const router = express.Router();
const {
  getAllConsultations,
  createConsultation,
  updateConsultation,
  getUserRole,
} = require("../controllers/consultationsController");

router.get("/consultations/role", getUserRole);
router.get("/consultations", getAllConsultations);
router.post("/consultations", createConsultation);
router.put("/consultations/:id", updateConsultation);

module.exports = router;
