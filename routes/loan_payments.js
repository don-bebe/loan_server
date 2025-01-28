const express = require("express");
const {
  getMyPaymentHistory,
  calculateBalance,
  getWeeklyPaidLoan,
  getMonthlyPaidLoan,
  makePayment,
  getAllPayments,
} = require("../controllers/loan_payment");
const { verifyClient } = require("../middleware/verifyClient");
const { verifyUser, loanOfficerOnly } = require("../middleware/verifyAuth");

const router = express.Router();

router.get("/view/:uuid", verifyClient, getMyPaymentHistory);
router.get("/balance", verifyClient, calculateBalance);
router.get("/weekly", verifyUser, loanOfficerOnly, getWeeklyPaidLoan);
router.get("/monthly", verifyUser, loanOfficerOnly, getMonthlyPaidLoan);
router.get("/pay", verifyUser, loanOfficerOnly, getAllPayments);
router.post("/pay", verifyUser, loanOfficerOnly, makePayment);

module.exports = router;
