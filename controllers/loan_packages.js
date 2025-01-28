const db = require("../config/dbconfig");
const LoanPackages = require("../models/loan_packages");

const createLoanPackage = async (req, res) => {
  const transaction = await db.transaction();
  try {
    const {
      packageName,
      description,
      minLoanAmount,
      maxLoanAmount,
      minRepaymentPeriod,
      maxRepaymentPeriod,
      minInterestRate,
      maxInterestRate,
      minOriginationFee,
      maxOriginationFee,
      latePaymentFee,
      isActive,
    } = req.body;

    const package = await LoanPackages.findOne({
      where: { packageName },
      transaction,
    });

    if (package) {
      await transaction.rollback();
      return res
        .status(409)
        .json({ message: "Name already in use by another package" });
    }

    await LoanPackages.create(
      {
        packageName,
        description,
        minLoanAmount,
        maxLoanAmount,
        minRepaymentPeriod,
        maxRepaymentPeriod,
        minInterestRate,
        maxInterestRate,
        minOriginationFee,
        maxOriginationFee,
        latePaymentFee,
        isActive: isActive || true,
      },
      {
        transaction,
      }
    );

    await transaction.commit();
    return res
      .status(201)
      .json({ message: "New loan package registered into the system" });
  } catch (error) {
    await transaction.rollback();
    return res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
};

const updateLoanPackage = async (req, res) => {
  const transaction = await db.transaction();
  try {
    const updates = req.body;

    const package = await LoanPackages.findByPk(req.params.id, {
      transaction,
    });

    if (!package) {
      await transaction.rollback();
      return res.status(404).json({ message: "Package not found" });
    }

    // Update fields if they are different
    for (const field in updates) {
      if (
        Object.prototype.hasOwnProperty.call(updates, field) &&
        updates[field] !== package[field]
      ) {
        package[field] = updates[field];
      }
    }

    await package.save({ transaction });
    await transaction.commit();

    return res
      .status(200)
      .json({ message: "Loan package details updated successfully!" });
  } catch (error) {
    await transaction.rollback();
    return res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
};

const getAllLoanPackages = async (req, res) => {
  try {
    const package = await LoanPackages.findAll();

    if (package && package.length > 0) {
      return res.status(200).json(package);
    } else {
      return res.status(404).json({ message: "No loan packages found" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
};

const getAllActiveLoanPackages = async (req, res) => {
  try {
    const package = await LoanPackages.findAll({
      where: {
        isActive: 1,
      },
    });

    if (package && package.length > 0) {
      return res.status(200).json(package);
    } else {
      return res.status(404).json({ message: "No loan packages found" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
};

const getPackagesCount = async (req, res) => {
  try {
    const count  = await LoanPackages.count();
    return res.status(200).json(count);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
};

module.exports = {
  createLoanPackage,
  updateLoanPackage,
  getAllLoanPackages,
  getAllActiveLoanPackages,
  getPackagesCount
};
