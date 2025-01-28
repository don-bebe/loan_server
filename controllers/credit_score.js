const ClientCreditScore = require("../models/client_credit_score");

const getMyCreditScore = async (req, res) => {
  try {
    const credit = await ClientCreditScore.findOne({
      where: {
        client_uuid: req.clientId,
      },
      attributes: ['creditScore']
    });

    if (credit) {
      return res.status(200).json(credit);
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
};

module.exports = { getMyCreditScore };
