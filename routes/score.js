const express = require("express");
const { verifyClient } = require("../middleware/verifyClient");
const { getMyCreditScore } = require("../controllers/credit_score");

const router = express.Router();

router.get("/my", verifyClient, getMyCreditScore);

module.exports = router;
