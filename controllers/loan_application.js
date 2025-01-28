const db = require("../config/dbconfig");
const LoanPackages = require("../models/loan_packages");
const ClientLoanApplication = require("../models/client_loan_application");
const ClientLoanApplicationHistory = require("../models/client_loan_application_history");
const ClientLoanPayment = require("../models/client_loan_payment");
const DocumentProofs = require("../models/client_proof_documents");
const { Op, Sequelize } = require("sequelize");
const IndividualClientDetails = require("../models/client_individual_details");
const BusinessClientDetails = require("../models/client_business_details");
const ClientLoanPaymentHistory = require("../models/client_loan_payment_history");

const createLoanApplication = async (req, res) => {
  const transaction = await db.transaction();
  try {
    const { packageID, loanAmount, loanTerm } = req.body;
    const package = await LoanPackages.findByPk(packageID.id, { transaction });

    if (!package) {
      await transaction.rollback();
      return res.status(404).json({ message: "Package not found" });
    } else {
      const documents = await DocumentProofs.findAll({
        where: {
          client_uuid: req.clientId,
        },
        transaction,
      });

      if (documents.length === 0) {
        await transaction.rollback();
        return res.status(404).json({
          message:
            "Sorry could not find any document of yours that is proof of residence or proof of income. Please provide those if you want to apply for loan",
        });
      }

      if (documents.length < 2) {
        await transaction.rollback();
        return res.status(404).json({
          message:
            "We require at least to documents to proof your existance so that we can process your application",
        });
      }
      const term = parseInt(loanTerm);
      const loansAmount = parseFloat(loanAmount);
      const packageMinAmount = parseFloat(package.minLoanAmount);
      const packageMaxAmount = parseFloat(package.maxLoanAmount);

      if (
        !(loansAmount >= packageMinAmount && loansAmount <= packageMaxAmount)
      ) {
        await transaction.rollback();
        return res.status(400).json({
          message:
            "Loan amount should not be less than " +
            packageMinAmount +
            " and should not be greater than " +
            packageMaxAmount,
        });
      }

      if (
        !(
          term >= package.minRepaymentPeriod &&
          term <= package.maxRepaymentPeriod
        )
      ) {
        await transaction.rollback();
        return res.status(400).json({
          message:
            "Loan repayment should not be less than " +
            package.minRepaymentPeriod +
            "and should not be greater than " +
            package.maxRepaymentPeriod +
            " months!",
        });
      }

      const packageMaxOg = parseFloat(package.maxOriginationFee);
      const packageMinOg = parseFloat(package.minOriginationFee);
      const packageMaxRate = parseFloat(package.maxInterestRate);
      const packageMinRate = parseFloat(package.minInterestRate);

      // Interpolate the interest rate based on the loan amount
      const loanRange = packageMaxAmount - packageMinAmount;
      const interestRange = packageMaxRate - packageMinRate;
      const loanDifference = loansAmount - packageMinAmount;

      const interestRate = parseFloat(
        packageMaxRate - (loanDifference / loanRange) * interestRange
      );

      const actualRate = parseFloat(interestRate / 12 / 100);
      const loanEMI =
        loansAmount *
        actualRate *
        (Math.pow(1 + actualRate, term) / (Math.pow(1 + actualRate, term) - 1));

      const totalInterest = parseFloat(loanEMI * term - loansAmount).toFixed(2);
      const totalPayment = parseFloat(loanEMI * term).toFixed(2);

      // Interpolate the origination fee based on the loan amount
      const feeRange = packageMaxOg - packageMinOg;
      const originationFee = parseFloat(
        packageMaxOg - (loanDifference / loanRange) * feeRange
      );

      const latePaymentFee = parseFloat(package.latePaymentFee).toFixed(2);
      const loanType = package.packageName;

      // Calculate net loan value
      const netLoanAmount = parseFloat(
        loansAmount - (loansAmount * originationFee) / 100
      ).toFixed(2);

      // Create the loan application in the database
      const application = await ClientLoanApplication.create(
        {
          client_uuid: req.clientId,
          loanType,
          loanAmount: loansAmount,
          netLoanAmount,
          loanTerm: term,
          interestRate,
          originationFee,
          latePaymentFee,
          status: "pending",
        },
        { transaction }
      );

      if (!application) {
        await transaction.rollback();
        return res
          .status(400)
          .json({ message: "Something went wrong during application" });
      }

      const pay = await ClientLoanPayment.create(
        {
          loan_uuid: application.uuid,
          totalInterest,
          totalPayment,
          loanEMI,
        },
        { transaction }
      );

      if (!pay) {
        await transaction.rollback();
        return res
          .status(400)
          .json({ message: "Something went wrong during application" });
      }

      await ClientLoanApplicationHistory.create(
        {
          loan_uuid: application.uuid,
          status: "pending",
          doneBy: "client",
        },
        { transaction }
      );

      await transaction.commit();
      return res.status(201).json({
        message: "Loan application created successfully",
      });
    }
  } catch (error) {
    await transaction.rollback();
    return res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
};

const cancelMyLoanApplication = async (req, res) => {
  const transaction = await db.transaction();
  try {
    const status = "cancelled";
    const loan = await ClientLoanApplication.findByPk(req.params.uuid, {
      transaction,
    });

    if (!loan) {
      await transaction.rollback();
      return res.status(404).json({ message: "Loan application not found" });
    }

    if (loan.client_uuid !== req.clientId) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Access denied, your are forbidden from accessing this record",
      });
    } else {
      if (loan.status !== "pending") {
        await transaction.rollback();
        return res
          .status(400)
          .json({ message: "Failed to cancel the loan due to its new status" });
      }

      const update = await ClientLoanApplication.update(
        {
          status: status,
        },
        {
          where: {
            [Op.and]: [{ uuid: loan.uuid }, { client_uuid: req.clientId }],
          },
        },
        { transaction }
      );

      if (!update) {
        await transaction.rollback();
        return res
          .status(400)
          .json({ message: "Something went wrong, failed to cancel" });
      }

      const pay = await ClientLoanPayment.update(
        {
          status: status,
        },
        {
          where: {
            loan_uuid: loan.uuid,
          },
        },
        { transaction }
      );

      if (!pay) {
        await transaction.rollback();
        return res
          .status(400)
          .json({ message: "Something went wrong, failed to cancel" });
      }

      await ClientLoanApplicationHistory.create(
        {
          loan_uuid: loan.uuid,
          status,
          doneBy: "client",
        },
        { transaction }
      );

      await transaction.commit();
      return res.status(201).json({
        message: "Loan application updated successfully",
      });
    }
  } catch (error) {
    await transaction.rollback();
    return res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
};

const changeLoanApplicationStatus = async (req, res) => {
  const transaction = await db.transaction();
  try {
    const loan = await ClientLoanApplication.findByPk(req.params.uuid, {
      transaction,
    });

    if (!loan) {
      await transaction.rollback();
      return res.status(404).json({ message: "Loan application not found" });
    }

    if (loan.status !== "pending") {
      await transaction.rollback();
      return res
        .status(400)
        .json({ message: "Loan status can not be changed at this stage." });
    }

    const { status } = req.body;
    const update = await ClientLoanApplication.update(
      {
        status: status,
      },
      { where: { uuid: loan.uuid } },
      { transaction }
    );

    if (!update) {
      await transaction.rollback();
      return res.status(400).json({ message: "Failed to update" });
    }

    if (status !== "approved") {
      await ClientLoanPayment.update(
        {
          status: "cancelled",
        },
        {
          where: {
            loan_uuid: loan.uuid,
          },
        },
        { transaction }
      );
    }

    await ClientLoanApplicationHistory.create(
      {
        loan_uuid: loan.uuid,
        status: status,
        doneBy: "loan-officer",
      },
      { transaction }
    );

    await transaction.commit();
    return res.status(201).json({
      message: "Loan application updated successfully",
    });
  } catch (error) {
    await transaction.rollback();
    return res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
};

const getAllLoanApplications = async (req, res) => {
  try {
    const response = await ClientLoanApplication.findAll({
      include: [
        {
          model: IndividualClientDetails,
          required: false,
        },
        {
          model: BusinessClientDetails,
          required: false,
        },
        {
          model: ClientLoanApplicationHistory,
        },
        { model: ClientLoanPayment },
      ],
      order: [["createdAt", "DESC"]],
    });

    if (response) return res.status(200).json(response);

    return res.status(404).json({ message: "Something went wrong" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
};

const getMyLoanApplication = async (req, res) => {
  try {
    const response = await ClientLoanApplication.findAll({
      where: {
        client_uuid: req.clientId,
      },
      include: [
        {
          model: ClientLoanApplicationHistory,
        },
        {
          model: ClientLoanPayment,
          include: [{ model: ClientLoanPaymentHistory }],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    if (response && response.length > 0) {
      // Send a response if loans are found
      return res.status(200).json(response);
    }

    return res.status(404).json({ message: "Something went wrong" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
};

const countMyLoans = async (req, res) => {
  try {
    const { count } = await ClientLoanApplication.findAndCountAll({
      where: {
        client_uuid: req.clientId,
      },
    });

    return res.status(200).json(count);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
};

const countAllLoanApplications = async (req, res) => {
  try {
    const { count } = await ClientLoanApplication.findAndCountAll();
    return res.status(200).json(count);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
};

const getPastLoanApplications = async (req, res) => {
  try {
    const loan = await ClientLoanApplication.findByPk(req.params.uuid);

    if (loan) {
      const response = await ClientLoanApplication.findAll({
        where: {
          [Op.and]: [
            { client_uuid: loan.client_uuid },
            { uuid: { [Op.ne]: loan.uuid } },
          ],
        },
        include: [
          {
            model: ClientLoanPayment,
          },
        ],
      });

      if (response && response.length > 0) {
        return res.status(200).json(response);
      } else {
        return res
          .status(404)
          .json({ message: "No other loan applications found." });
      }
    } else {
      return res.status(404).json({ message: "Loan application not found." });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
};

const getLoanTypeCount = async (req, res) => {
  try {
    const response = await ClientLoanApplication.findAll({
      attributes: [
        "loanType",
        [Sequelize.fn("COUNT", Sequelize.col("loanType")), "loanCount"],
      ],
      group: ["loanType"],
    });

    return res.status(200).json(response);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
};

const getClientLoanCount = async (req, res) => {
  try {
    const response = await ClientLoanApplication.findAll({
      attributes: [
        [
          Sequelize.fn("COUNT", Sequelize.col(`client_loan_application.uuid`)),
          "loanCount",
        ],
        [
          Sequelize.literal(
            "COALESCE(`client_business_detail`.`businessName`, `client_individual_detail`.`lastName`)"
          ),
          "clientName",
        ],
      ],
      include: [
        {
          model: BusinessClientDetails,
          attributes: [],
        },
        {
          model: IndividualClientDetails,
          attributes: [],
        },
      ],
      where: {
        status: "approved",
      },
      group: [Sequelize.literal("clientName")], // Match alias "clientName"
    });

    return res.status(200).json(response);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
};

const getWeeklyLoanedAmount = async (req, res) => {
  try {
    const total = await ClientLoanApplication.findAll({
      attributes: [
        [
          Sequelize.fn("DATE_FORMAT", Sequelize.col("createdAt"), "%Y-%u"),
          "week",
        ],
        [
          Sequelize.fn("AVG", Sequelize.col("netLoanAmount")),
          "averageLoanedAmount",
        ],
      ],
      where: {
        status: "approved",
      },
      group: [Sequelize.fn("DATE_FORMAT", Sequelize.col("createdAt"), "%Y-%u")],
      order: [
        [
          Sequelize.fn("DATE_FORMAT", Sequelize.col("createdAt"), "%Y-%u"),
          "ASC",
        ],
      ],
    });

    return res.status(200).json(total);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
};

const getMonthlyLoanedAmount = async (req, res) => {
  try {
    const total = await ClientLoanApplication.findAll({
      attributes: [
        [
          Sequelize.fn("DATE_FORMAT", Sequelize.col("createdAt"), "%Y-%m"),
          "month",
        ],
        [
          Sequelize.fn("AVG", Sequelize.col("netLoanAmount")),
          "averageLoanedAmount",
        ],
      ],
      where: {
        status: "approved",
      },
      group: [Sequelize.fn("DATE_FORMAT", Sequelize.col("createdAt"), "%Y-%m")],
      order: [
        [
          Sequelize.fn("DATE_FORMAT", Sequelize.col("createdAt"), "%Y-%m"),
          "ASC",
        ],
      ],
    });
    return res.status(200).json(total);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
};

const getPaymentCalender = async (req, res) => {
  try {
    const loanApplications = await ClientLoanApplication.findAll({
      where: {
        client_uuid: req.clientId,
        status: "approved",
      },
      include: [
        {
          model: ClientLoanPayment,
          where: {
            status: { [Op.notIn]: ["cancelled", "paid"] },
          },
        },
      ],
    });

    const paymentCalendar = [];

    for (const loan of loanApplications) {
      const loanHistory = await ClientLoanApplicationHistory.findOne({
        where: {
          loan_uuid: loan.uuid,
          status: "approved",
        },
      });

      if (!loanHistory) {
        continue;
      }

      const approvalDate = new Date(loanHistory.createdAt);
      const firstInstallmentDate = new Date(approvalDate);
      firstInstallmentDate.setMonth(firstInstallmentDate.getMonth() + 1);
      const loanTerm = loan.loanTerm;
      const installmentAmount = loan.client_loan_payment?.loanEMI;

      for (let i = 0; i < loanTerm; i++) {
        const installmentDate = new Date(
          firstInstallmentDate.getTime() + i * 4 * 7 * 24 * 60 * 60 * 1000
        );

        const paymentStart = new Date(installmentDate);
        paymentStart.setDate(paymentStart.getDate() - 1);

        const paymentEnd = new Date(installmentDate);
        paymentEnd.setDate(paymentEnd.getDate() + 1);

        paymentCalendar.push({
          installmentNumber: i + 1,
          amount: parseFloat(installmentAmount).toFixed(2),
          dueDate: installmentDate.toISOString().split("T")[0],
          paymentRange: {
            start: paymentStart.toISOString().split("T")[0],
            end: paymentEnd.toISOString().split("T")[0],
          },
        });
      }
    }

    return res.status(200).json({ paymentCalendar });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
};

const getAllPaymentsCalender = async (req, res) => {
  try {
    const loanApplications = await ClientLoanApplication.findAll({
      where: {
        status: "approved",
      },
      include: [
        {
          model: ClientLoanPayment,
          where: {
            status: { [Op.notIn]: ["cancelled", "paid"] },
          },
        },
        {
          model: BusinessClientDetails,
          required: false,
        },
        {
          model: IndividualClientDetails,
          required: false,
        },
      ],
    });

    const paymentCalendar = [];

    for (const loan of loanApplications) {
      const loanHistory = await ClientLoanApplicationHistory.findOne({
        where: {
          loan_uuid: loan.uuid,
          status: "approved",
        },
      });

      if (!loanHistory) {
        continue;
      }

      const approvalDate = new Date(loanHistory.createdAt);
      const firstInstallmentDate = new Date(approvalDate);
      firstInstallmentDate.setMonth(firstInstallmentDate.getMonth() + 1);
      const loanTerm = loan.loanTerm;
      const installmentAmount = loan.client_loan_payment?.loanEMI;
      const client =
        loan.client_individual_detail?.lastName ||
        loan.client_business_detail?.businessName;

      for (let i = 0; i < loanTerm; i++) {
        const installmentDate = new Date(
          firstInstallmentDate.getTime() + i * 4 * 7 * 24 * 60 * 60 * 1000
        );

        const paymentStart = new Date(installmentDate);
        paymentStart.setDate(paymentStart.getDate() - 1);

        const paymentEnd = new Date(installmentDate);
        paymentEnd.setDate(paymentEnd.getDate() + 1);

        paymentCalendar.push({
          client: client,
          installmentNumber: i + 1,
          amount: parseFloat(installmentAmount).toFixed(2),
          dueDate: installmentDate.toISOString().split("T")[0],
          paymentRange: {
            start: paymentStart.toISOString().split("T")[0],
            end: paymentEnd.toISOString().split("T")[0],
          },
        });
      }
    }

    return res.status(200).json({ paymentCalendar });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
};

module.exports = {
  createLoanApplication,
  cancelMyLoanApplication,
  getMyLoanApplication,
  getAllLoanApplications,
  getPastLoanApplications,
  getWeeklyLoanedAmount,
  getMonthlyLoanedAmount,
  getLoanTypeCount,
  getClientLoanCount,
  getPaymentCalender,
  getAllPaymentsCalender,
  countMyLoans,
  countAllLoanApplications,
  changeLoanApplicationStatus,
};
