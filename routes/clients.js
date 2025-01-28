const express = require("express");
const {
  createIndividualClient,
  createBusinessClient,
  updateIndividualClient,
  updateBusinessClient,
  getAllIndividualClient,
  getAllBusinessClient,
  getTotalClientCount,
} = require("../controllers/clients");
const { verifyUser, loanOfficerOnly } = require("../middleware/verifyAuth");

const router = express.Router();

router.post("/add", createIndividualClient);
router.post("/addNew", createBusinessClient);
router.patch(
  "/update/:uuid",
  verifyUser,
  loanOfficerOnly,
  updateIndividualClient
);
router.patch("/edit/:uuid", verifyUser, loanOfficerOnly, updateBusinessClient);
router.get("/all", verifyUser, loanOfficerOnly, getAllIndividualClient);
router.get("/viewAll", verifyUser, loanOfficerOnly, getAllBusinessClient);
router.get("/count", verifyUser, loanOfficerOnly, getTotalClientCount);

module.exports = router;
