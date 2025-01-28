const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Get the document type from the form data

    const documentIndex = parseInt(file.fieldname.match(/\d+/)[0], 10); // Extract index from the field name
    const documentType =
      req.body.documents &&
      req.body.documents[documentIndex] &&
      req.body.documents[documentIndex].type;
    let folder = "";

    switch (documentType) {
      case "ID":
        folder = "uploads/ID";
        break;
      case "proof of income":
        folder = "uploads/Income";
        break;
      case "proof of residence":
        folder = "uploads/Residence";
        break;
      default:
        return cb(new Error("Invalid document type"), false);
    }

    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const clientUuid = req.body.client_uuid || "unknown";
    const timestamp = Date.now();
    cb(null, `${req.clientId}_${timestamp}${path.extname(file.originalname)}`);
  },
});

const uploadDocuments = multer({
  storage: storage,
  limits: { fileSize: 10000000 }, // Limit file size to 1MB
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|gif|pdf/; // Added support for PDF
    const mimeType = fileTypes.test(file.mimetype);
    const extname = fileTypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimeType && extname) {
      return cb(null, true);
    }
    cb(new Error("Invalid file format. Only images and PDFs are allowed."));
  },
});

const uploadMiddleware = (req, res, next) => {
  uploadDocuments.fields([
    { name: "documents[0][file]", maxCount: 1 },
    { name: "documents[1][file]", maxCount: 1 },
    { name: "documents[2][file]", maxCount: 1 },
  ])(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    const files = req.files;
    const documents = req.body.documents.map((doc, index) => {
      const file = files[`documents[${index}][file]`]?.[0]; // Added safe access to the file array
      return {
        type: doc.type,
        filePath: file ? file.path.replace(/\\/g, "/") : null, // Normalize file path for cross-platform compatibility
      };
    });

    req.body.documents = documents;
    next();
  });
};

module.exports = { uploadMiddleware };
