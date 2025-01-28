const db = require("../config/dbconfig");
const DocumentProofs = require("../models/client_proof_documents");

const addMyDocuments = async (req, res) => {
  const transaction = await db.transaction();
  try {
    const { documents } = req.body;

    // Ensure required fields are provided
    if (!documents || documents.length === 0) {
      return res.status(400).json({ message: "Documents are required." });
    }

    const client_uuid = req.clientId;
    // Fetch existing document types for the client
    const existingDocuments = await DocumentProofs.findAll(
      {
        where: { client_uuid },
        attributes: ["documentType"],
      },
      { transaction }
    );

    // Extract existing document types
    const existingDocumentTypes = existingDocuments.map(
      (doc) => doc.documentType
    );

    // Filter out documents that already exist
    const newDocuments = documents.filter(
      (doc) => !existingDocumentTypes.includes(doc.type)
    );

    // If no new documents, return a message
    if (newDocuments.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        message: "All provided document types have already been added.",
      });
    }

    // Map new documents to the expected format for bulk insertion
    const documentRecords = newDocuments.map((doc) => ({
      client_uuid,
      documentType: doc.type,
      documentFile: doc.filePath,
    }));

    // Save new documents to the database
    const job = await DocumentProofs.bulkCreate(documentRecords, {
      transaction,
    });

    if (!job) {
      await transaction.rollback();
      return res
        .status(400)
        .json({ message: "Something went wrong, failed to add documents" });
    }

    await transaction.commit();
    return res
      .status(201)
      .json({ message: "Documents successfully uploaded and saved." });
  } catch (error) {
    await transaction.rollback();
    return res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
};

const getAllMyDocuments = async (req, res) => {
  try {
    const response = await DocumentProofs.findAll({
      where: {
        client_uuid: req.clientId,
      },
    });

    if (response && response.length > 0) return res.status(200).json(response);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
};

const getDocumentsByClientID = async (req, res) => {
  try {
    const response = await DocumentProofs.findAll({
      where: {
        client_uuid: req.params.uuid,
      },
    });

    if (response && response.length > 0) return res.status(200).json(response);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
};

module.exports = { addMyDocuments, getAllMyDocuments, getDocumentsByClientID };
