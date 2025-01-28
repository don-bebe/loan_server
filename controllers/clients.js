const bcrypt = require("bcrypt");
const db = require("../config/dbconfig");
const IndividualClientDetails = require("../models/client_individual_details");
const BusinessClientDetails = require("../models/client_business_details");
const ClientAddress = require("../models/clients_addresses");
const ClientLoginDetails = require("../models/client_login_details");
const ClientCreditScore = require("../models/client_credit_score");
const DocumentProofs = require("../models/client_proof_documents");

const createIndividualClient = async (req, res) => {
  const transaction = await db.transaction();
  try {
    const {
      firstName,
      lastName,
      ID_number,
      dateOfBirth,
      gender,
      phoneNumber,
      emailAddress,
      addressLine1,
      addressLine2,
      city,
      country,
      password,
      confirmPassword,
    } = req.body;

    const creditScore = 10;
    const individual = await IndividualClientDetails.findOne({
      where: {
        emailAddress,
      },
      transaction,
    });

    if (individual) {
      await transaction.rollback();
      return res
        .status(409)
        .json({ message: "Email is already in use by another user" });
    }

    //create new individual client
    const client = await IndividualClientDetails.create(
      {
        firstName,
        lastName,
        ID_number,
        dateOfBirth,
        gender,
        phoneNumber,
        emailAddress,
      },
      { transaction }
    );

    if (!client) {
      await transaction.rollback();
      return res.status(400).json({ message: "Failed to create account" });
    }

    //now create user address in address table
    const clientAdd = await ClientAddress.findOne({
      where: {
        client_uuid: client.uuid,
      },
      transaction,
    });

    if (clientAdd) {
      await transaction.rollback();
      return res
        .status(409)
        .json({ message: "It seems like client address already exists" });
    }

    await ClientAddress.create(
      {
        client_uuid: client.uuid,
        addressLine1,
        addressLine2,
        city,
        country,
      },
      {
        transaction,
      }
    );

    //signup client
    if (password !== confirmPassword)
      return res.status(400).json({ message: "Password entered don`t match" });

    if (password.length < 8 || password.length > 16) {
      return res
        .status(401)
        .json({ message: "Password must be between 8 and 12 characters" });
    }

    const loginDetails = await ClientLoginDetails.findOne(
      {
        where: {
          client_uuid: client.uuid,
        },
      },
      transaction
    );

    if (loginDetails) {
      await transaction.rollback();
      return res.status(400).json({ message: "Account already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await ClientLoginDetails.create(
      {
        client_uuid: client.uuid,
        password: hashedPassword,
      },
      { transaction }
    );

    await ClientCreditScore.create(
      {
        client_uuid: client.uuid,
        creditScore: creditScore,
      },
      { transaction }
    );

    await transaction.commit();
    return res
      .status(201)
      .json({ message: "New client registered into the system" });
  } catch (error) {
    await transaction.rollback();
    return res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
};

const updateIndividualClient = async (req, res) => {
  const transaction = await db.transaction();
  try {
    const updates = req.body;

    const client = await IndividualClientDetails.findByPk(req.params.uuid, {
      include: {
        model: ClientAddress,
        as: "address",
      },
      transaction,
    });

    if (!client) {
      await transaction.rollback();
      return res.status(404).json({ message: "Client not found" });
    }

    for (const field in updates) {
      if (
        Object.prototype.hasOwnProperty.call(updates, field) &&
        field !== "address" &&
        updates[field] !== client[field]
      ) {
        client[field] = updates[field];
      }
    }

    if (updates.address) {
      const addressUpdates = updates.address;

      if (client.address) {
        for (const field in addressUpdates) {
          if (
            Object.prototype.hasOwnProperty.call(addressUpdates, field) &&
            addressUpdates[field] !== client.address[field]
          ) {
            client.address[field] = addressUpdates[field];
          }
        }

        await client.address.save({ transaction });
      }
    }

    await client.save({ transaction });
    await transaction.commit();

    return res
      .status(200)
      .json({ message: "Client details updated successfully!" });
  } catch (error) {
    await transaction.rollback();
    return res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
};

const getAllIndividualClient = async (req, res) => {
  try {
    const client = await IndividualClientDetails.findAll({
      include: [
        {
          model: ClientAddress,
          as: "address",
        },
        {
          model: DocumentProofs,
        },
      ],
    });
    if (client && client.length > 0) {
      return res.status(200).json(client);
    } else {
      return res.status(404).json({ message: "No clients found" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
};

const createBusinessClient = async (req, res) => {
  const transaction = await db.transaction();
  try {
    const {
      businessName,
      registrationNumber,
      companyPhone,
      contactPerson,
      emailAddress,
      phoneNumber,
      addressLine1,
      addressLine2,
      city,
      country,
      password,
      confirmPassword,
    } = req.body;

    const creditScore = 20;
    const business = await BusinessClientDetails.findOne({
      where: { registrationNumber },
      transaction,
    });

    if (business) {
      await transaction.rollback();
      return res
        .status(409)
        .json({ message: "Business is already in the system" });
    }

    const client = await BusinessClientDetails.create(
      {
        businessName,
        registrationNumber,
        companyPhone,
        contactPerson,
        emailAddress,
        phoneNumber,
      },
      { transaction }
    );

    if (!client) {
      await transaction.rollback();
      return res.status(400).json({ message: "Failed to create account" });
    }

    //now create user address in address table
    const clientAdd = await ClientAddress.findOne({
      where: {
        client_uuid: client.uuid,
      },
      transaction,
    });

    if (clientAdd) {
      await transaction.rollback();
      return res
        .status(409)
        .json({ message: "It seems like client address already exists" });
    }

    await ClientAddress.create(
      {
        client_uuid: client.uuid,
        addressLine1,
        addressLine2,
        city,
        country,
      },
      {
        transaction,
      }
    );

    //signup client
    if (password !== confirmPassword)
      return res.status(400).json({ message: "Password entered don`t match" });

    if (password.length < 8 || password.length > 16) {
      return res
        .status(401)
        .json({ message: "Password must be between 8 and 12 characters" });
    }

    const loginDetails = await ClientLoginDetails.findOne(
      {
        where: {
          client_uuid: client.uuid,
        },
      },
      transaction
    );

    if (loginDetails) {
      await transaction.rollback();
      return res.status(400).json({ message: "Account already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await ClientLoginDetails.create(
      {
        client_uuid: client.uuid,
        password: hashedPassword,
      },
      { transaction }
    );

    await ClientCreditScore.create(
      {
        client_uuid: client.uuid,
        creditScore: creditScore,
      },
      { transaction }
    );

    await transaction.commit();
    return res
      .status(201)
      .json({ message: "New client registered into the system" });
  } catch (error) {
    await transaction.rollback();
    return res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
};

const updateBusinessClient = async (req, res) => {
  const transaction = await db.transaction();
  try {
    const updates = req.body;

    const client = await BusinessClientDetails.findByPk(req.params.uuid, {
      include: {
        model: ClientAddress,
        as: "address",
      },
      transaction,
    });

    if (!client) {
      await transaction.rollback();
      return res.status(404).json({ message: "Client not found" });
    }

    for (const field in updates) {
      if (
        Object.prototype.hasOwnProperty.call(updates, field) &&
        field !== "address" &&
        updates[field] !== client[field]
      ) {
        client[field] = updates[field];
      }
    }

    if (updates.address) {
      const addressUpdates = updates.address;

      if (client.address) {
        for (const field in addressUpdates) {
          if (
            Object.prototype.hasOwnProperty.call(addressUpdates, field) &&
            addressUpdates[field] !== client.address[field]
          ) {
            client.address[field] = addressUpdates[field];
          }
        }

        await client.address.save({ transaction });
      }
    }

    await client.save({ transaction });
    await transaction.commit();

    return res
      .status(200)
      .json({ message: "Client details updated successfully!" });
  } catch (error) {
    await transaction.rollback();
    return res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
};

const getAllBusinessClient = async (req, res) => {
  try {
    const client = await BusinessClientDetails.findAll({
      include: [
        {
          model: ClientAddress,
          as: "address",
        },
      ],
    });
    if (client && client.length > 0) {
      return res.status(200).json(client);
    } else {
      return res.status(404).json({ message: "No clients found" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
};

const getTotalClientCount = async (req, res) => {
  try {
    const individualClientCount = await IndividualClientDetails.count();
    const businessClientCount = await BusinessClientDetails.count();

    const totalClientCount  = individualClientCount + businessClientCount;

    return res.status(200).json(totalClientCount);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
};

module.exports = {
  createIndividualClient,
  updateIndividualClient,
  createBusinessClient,
  updateBusinessClient,
  getAllIndividualClient,
  getAllBusinessClient,
  getTotalClientCount
};
