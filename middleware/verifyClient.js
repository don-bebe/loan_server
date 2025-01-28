const IndividualClientDetails = require("../models/client_individual_details");
const BusinessClientDetails = require("../models/client_business_details");

const verifyClient = async (req, res, next) => {
  if (!req.session.clientId) {
    return res.status(401).json({ message: "Please login to your account!" });
  }

  try {
    const client = await IndividualClientDetails.findByPk(req.session.clientId);
    req.clientId = null;
    req.emailAddress = null;
    if (!client) {
      const business = await BusinessClientDetails.findByPk(
        req.session.clientId
      );
      if (!business) return res.status(404).json({ message: "User not found" });
      req.clientId = business.uuid;
      req.emailAddress = business.emailAddress;
    } else {
      req.clientId = client.uuid;
      req.emailAddress = client.emailAddress;
    }
    next();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { verifyClient };
