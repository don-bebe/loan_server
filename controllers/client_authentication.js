const bcrypt = require("bcrypt");
const db = require("../config/dbconfig");
const IndividualClientDetails = require("../models/client_individual_details");
const BusinessClientDetails = require("../models/client_business_details");
const ClientLoginDetails = require("../models/client_login_details");
const ClientLoanApplication = require("../models/client_loan_application");
const ClientLoanPayment = require("../models/client_loan_payment");
const ClientAddress = require("../models/clients_addresses");

const signinClient = async (req, res) => {
  const transaction = await db.transaction();
  try {
    const { emailAddress, password } = req.body;

    const client = await IndividualClientDetails.findOne({
      where: { emailAddress },
      transaction,
    });

    let loginDetails, role, uuid, nameDetails;

    if (!client) {
      const business = await BusinessClientDetails.findOne({
        where: { emailAddress },
        transaction,
      });

      if (!business) {
        return res
          .status(404)
          .json({ message: "Invalid emailAddress or password" });
      }

      loginDetails = await ClientLoginDetails.findOne({
        where: { client_uuid: business.uuid },
        transaction,
      });

      if (!loginDetails) {
        return res.status(401).json({ message: "Something went wrong" });
      }

      const match = await bcrypt.compare(password, loginDetails.password);
      if (!match) {
        return res
          .status(404)
          .json({ message: "Wrong emailAddress/password!!" });
      }

      if (business.isApproved === false) {
        return res.status(401).json({
          message: "Please contact administrator to activate your account",
        });
      }

      uuid = business.uuid;
      nameDetails = {
        businessName: business.businessName,
        contactPerson: business.contactPerson,
        email: business.emailAddress,
      };

      role = "business";
    } else {
      loginDetails = await ClientLoginDetails.findOne({
        where: { client_uuid: client.uuid },
        transaction,
      });

      if (!loginDetails) {
        return res.status(401).json({ message: "Something went wrong" });
      }

      const match = await bcrypt.compare(password, loginDetails.password);
      if (!match) {
        return res
          .status(404)
          .json({ message: "Wrong emailAddress/password!!" });
      }

      if (client.isApproved === false) {
        return res.status(401).json({
          message: "Please contact administrator to activate your account",
        });
      }

      uuid = client.uuid;
      nameDetails = {
        firstName: client.firstName,
        lastName: client.lastName,
        phoneNumber: client.phoneNumber,
        email: client.emailAddress,
      };
      role = "individual";
    }

    loginDetails.lastLogin = new Date(Date.now());
    await loginDetails.save({ transaction });

    req.session.clientId = uuid;

    await transaction.commit();

    return res
      .status(200)
      .json({ message: "Welcome to MicroLend!", uuid, role, ...nameDetails });
  } catch (error) {
    await transaction.rollback();
    return res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
};

const signOutClient = async (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(400).json({ message: "Can not logout" });
    res.status(200).json({ message: "You have logout" });
  });
};

const getClientDetails = async (req, res) => {
  try {
    const client = await IndividualClientDetails.findByPk(req.clientId, {
      include: [
        {
          model: ClientLoanApplication,
          include: [
            {
              model: ClientLoanPayment,
            },
          ],
        },
        {
          model: ClientAddress,
          as: "address",
        },
      ],
    });

    if (!client) {
      const response = await BusinessClientDetails.findByPk(req.clientId, {
        include: [
          {
            model: ClientLoanApplication,
            include: [
              {
                model: ClientLoanPayment,
              },
            ],
          },
          {
            model: ClientAddress,
            as: "address",
          },
        ],
      });

      if (!response) {
        return res.status(404).json({ message: "No client found" });
      } else {
        return res.status(200).json(response);
      }
    } else {
      return res.status(200).json(client);
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
};

module.exports = { signinClient, signOutClient, getClientDetails };
