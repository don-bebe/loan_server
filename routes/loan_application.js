const express = require("express");
const { verifyUser, loanOfficerOnly } = require("../middleware/verifyAuth");
const { verifyClient } = require("../middleware/verifyClient");
const {
  getAllLoanApplications,
  getMyLoanApplication,
  changeLoanApplicationStatus,
  cancelMyLoanApplication,
  createLoanApplication,
  countMyLoans,
  countAllLoanApplications,
  getPastLoanApplications,
  getLoanTypeCount,
  getClientLoanCount,
  getWeeklyLoanedAmount,
  getMonthlyLoanedAmount,
  getPaymentCalender,
  getAllPaymentsCalender,
} = require("../controllers/loan_application");

const router = express.Router();

router.get("/all", verifyUser, loanOfficerOnly, getAllLoanApplications);
router.get("/count", verifyUser, loanOfficerOnly, countAllLoanApplications);
router.get("/client", verifyUser, loanOfficerOnly, getClientLoanCount);
router.get("/type", verifyUser, loanOfficerOnly, getLoanTypeCount);
router.get("/weekly", verifyUser, loanOfficerOnly, getWeeklyLoanedAmount);
router.get("/monthly", verifyUser, loanOfficerOnly, getMonthlyLoanedAmount);
router.get("/view/:uuid", verifyUser, loanOfficerOnly, getPastLoanApplications);
router.get("/cal", verifyUser, loanOfficerOnly, getAllPaymentsCalender);
router.patch(
  "/edit/:uuid",
  verifyUser,
  loanOfficerOnly,
  changeLoanApplicationStatus
);

router.get("/view", verifyClient, getMyLoanApplication);
router.get("/my", verifyClient, countMyLoans);
router.get("/calender", verifyClient, getPaymentCalender);
router.patch("/cancel/:uuid", verifyClient, cancelMyLoanApplication);
router.post("/add", verifyClient, createLoanApplication);

module.exports = router;
