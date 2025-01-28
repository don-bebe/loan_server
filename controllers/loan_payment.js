const ClientLoanApplication = require("../models/client_loan_application");
const ClientLoanPayment = require("../models/client_loan_payment");
const IndividualClientDetails = require("../models/client_individual_details");
const BusinessClientDetails = require("../models/client_business_details");
const ClientLoanPaymentHistory = require("../models/client_loan_payment_history");
const ClientLatePayment = require("../models/client_late_payment");
const ClientCreditScore = require("../models/client_credit_score");
const { Op, Sequelize } = require("sequelize");
const db = require("../config/dbconfig");

const getMyPaymentHistory = async (req, res) => {
  try {
    const loan = await ClientLoanPayment.findOne({
      where: {
        loan_uuid: req.params.uuid,
      },
    });

    if (!loan) {
      return res.status(400).json({ message: "Loan payment not found" });
    }

    const response = await ClientLoanPaymentHistory.findAll({
      where: {
        payment_uuid: loan.uuid,
      },
    });

    if (response && response.length > 0) {
      return res.status(200).json(response);
    } else {
      return res.status(404).json({ message: "No payment history found." });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
};

const calculateBalance = async (req, res) => {
  try {
    const loan = await ClientLoanApplication.findAll({
      where: {
        [Op.and]: [{ client_uuid: req.clientId }, { status: "approved" }],
      },
    });

    if (!loan && loan.length === 0) {
      return res.status(404).json({ message: "No loan found" });
    }

    const loanIds = loan.map((loans) => loans.uuid);

    const payments = await ClientLoanPayment.findAll({
      where: {
        loan_uuid: { [Op.in]: loanIds },
        status: { [Op.notIn]: ["cancelled", "paid"] },
      },
    });

    const totalBalance = payments.reduce((sum, payment) => {
      const balance = payment.totalPayment - payment.totalEMIPaid;
      return sum + balance;
    }, 0);

    return res.status(200).json({ balance: totalBalance });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
};

const getAllPayments = async (req, res) => {
  try {
    const response = await ClientLoanPayment.findAll({
      where: {
        status: { [Op.ne]: "cancelled" },
      },
      include: [
        {
          model: ClientLoanPaymentHistory,
        },
        {
          model: ClientLoanApplication,
          include: [
            {
              model: IndividualClientDetails,
              required: false,
            },
            {
              model: BusinessClientDetails,
              required: false,
            },
          ],
        },
      ],
    });

    if (response && response.length > 0) return res.status(200).json(response);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
};

const getWeeklyPaidLoan = async (req, res) => {
  try {
    const weeklyAverage = await ClientLoanPaymentHistory.findAll({
      attributes: [
        [Sequelize.fn("DATE_FORMAT", Sequelize.col("paidAt"), "%Y-%u"), "week"],
        [Sequelize.fn("AVG", Sequelize.col("amountPaid")), "averageAmountPaid"],
      ],
      group: [Sequelize.fn("DATE_FORMAT", Sequelize.col("paidAt"), "%Y-%u")],
      order: [
        [Sequelize.fn("DATE_FORMAT", Sequelize.col("paidAt"), "%Y-%u"), "ASC"],
      ],
    });
    return res.status(200).json(weeklyAverage);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
};

const getMonthlyPaidLoan = async (req, res) => {
  try {
    const monthlyAverage = await ClientLoanPaymentHistory.findAll({
      attributes: [
        [
          Sequelize.fn("DATE_FORMAT", Sequelize.col("paidAt"), "%Y-%m"),
          "month",
        ],
        [Sequelize.fn("AVG", Sequelize.col("amountPaid")), "averageAmountPaid"],
      ],
      group: [Sequelize.fn("DATE_FORMAT", Sequelize.col("paidAt"), "%Y-%m")],
      order: [
        [Sequelize.fn("DATE_FORMAT", Sequelize.col("paidAt"), "%Y-%m"), "ASC"],
      ],
    });
    return res.status(200).json(monthlyAverage);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
};

const makePayment = async (req, res) => {
  const transaction = await db.transaction();
  try {
    const { amountPaid, payment_uuid } = req.body;
    const response = await ClientLoanPayment.findByPk(payment_uuid, {
      transaction,
    });

    if (!response) {
      await transaction.rollback();
      return res.status(404).json({ message: "Not found" });
    }

    if (response.status === "cancelled" || response.status === "paid") {
      await transaction.rollback();
      return res.status(400).json({
        message:
          "Payment can not be made for these loans, consult loan officer",
      });
    }

    const EMIPaid = response.totalEMIPaid;
    const totalPayment = response.totalPayment;
    const paid = parseFloat(amountPaid);
    const newEMIPaid = EMIPaid + paid;
    const balance = totalPayment - newEMIPaid;

    const feedback = await ClientLoanPaymentHistory.create(
      {
        payment_uuid: response.uuid,
        amountPaid: paid,
        remainingAmount: balance,
        doneBy: "loan-officer"
      },
      { transaction }
    );

    if (!feedback) {
      await transaction.rollback();
      return res.status(400).json({ message: "Failed to make the payment" });
    }

    if (newEMIPaid === totalPayment) {
      await ClientLoanPayment.update(
        { totalEMIPaid: newEMIPaid, status: "paid" },
        { where: { uuid: payment_uuid }, transaction }
      );

      const loanApplication = await ClientLoanApplication.findOne({
        where: { uuid: response.loan_uuid },
        transaction,
      });

      if (!loanApplication) {
        await transaction.rollback();
        return res.status(404).json({ message: "Loan application not found" });
      }

      const loanTerm = parseInt(loanApplication.loanTerm);
      const lateFees = loanApplication.latePaymentFee;
      const loanEMI = response.loanEMI;

      const latePaymentFee = parseFloat(lateFees / 12 / 100);

      const finalLatePaymentValue = loanEMI * latePaymentFee;

      const paymentHistory = await ClientLoanPaymentHistory.findAll({
        where: { payment_uuid: payment_uuid },
        order: [["createdAt", "ASC"]],
        transaction,
      });

      const firstPaymentDate = paymentHistory[0]?.createdAt;
      const lastPaymentDate =
        paymentHistory[paymentHistory.length - 1]?.createdAt;

      const monthsTaken = Math.ceil(
        (new Date(lastPaymentDate) - new Date(firstPaymentDate)) /
          (1000 * 60 * 60 * 24 * 30)
      );

      if (monthsTaken > loanTerm) {
        const lateMonths = monthsTaken - loanTerm;
        const lateFee = parseFloat(lateMonths * finalLatePaymentValue);

        await ClientLatePayment.create(
          {
            payment_uuid: response.uuid,
            lateMonths: monthsTaken,
            paymentFee: lateFee,
          },
          { transaction }
        );
      }

      const creditScoreAdjustment = calculateCreditScore(
        loanTerm,
        monthsTaken,
        totalPayment
      );

      await ClientCreditScore.update(
        {
          creditScore: Sequelize.literal(
            `creditScore + ${creditScoreAdjustment}`
          ),
        },
        { where: { client_uuid: loanApplication.client_uuid }, transaction }
      );
    } else {
      await ClientLoanPayment.update(
        { totalEMIPaid: newEMIPaid, status: "partial" },
        { where: { uuid: payment_uuid }, transaction }
      );
    }

    await transaction.commit();
    return res.status(200).json({ message: "Payment successful" });
  } catch (error) {
    await transaction.rollback();
    return res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
};

function calculateCreditScore(loanTerm, monthsTaken, totalPayment) {
  let scoreAdjustment = 0;
  if (monthsTaken <= loanTerm) {
    scoreAdjustment = Math.min(totalPayment / 1000, 50);
  } else {
    scoreAdjustment = -Math.min((monthsTaken - loanTerm) * 5, 50);
  }
  return scoreAdjustment;
}

module.exports = {
  getMyPaymentHistory,
  calculateBalance,
  getAllPayments,
  makePayment,
  getMonthlyPaidLoan,
  getWeeklyPaidLoan,
};
