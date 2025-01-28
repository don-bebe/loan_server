const express = require("express");
const {
  addMyDocuments,
  getAllMyDocuments, getDocumentsByClientID
} = require("../controllers/client_documents");

const { verifyClient } = require("../middleware/verifyClient");
const { verifyUser, loanOfficerOnly } = require("../middleware/verifyAuth");
const { uploadMiddleware } = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/all", verifyClient, getAllMyDocuments);
router.get("/view/:uuid", verifyUser, loanOfficerOnly, getDocumentsByClientID);
router.post("/add", verifyClient, uploadMiddleware, addMyDocuments);

module.exports = router;
