const express = require("express");
const { verifyUser, loanOfficerOnly } = require("../middleware/verifyAuth");
const {
  getAllLoanPackages,
  createLoanPackage,
  updateLoanPackage,
  getAllActiveLoanPackages,
  getPackagesCount,
} = require("../controllers/loan_packages");

const router = express.Router();

router.get("/view", getAllActiveLoanPackages);
router.get("/all", verifyUser, loanOfficerOnly, getAllLoanPackages);
router.get("/count", verifyUser, loanOfficerOnly, getPackagesCount);
router.post("/add", verifyUser, loanOfficerOnly, createLoanPackage);
router.patch("/update/:id", verifyUser, loanOfficerOnly, updateLoanPackage);

module.exports = router;
