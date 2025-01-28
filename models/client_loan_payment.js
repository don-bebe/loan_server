const { DataTypes } = require("sequelize");
const db = require("../config/dbconfig");
const ClientLoanApplication = require("./client_loan_application");

const ClientLoanPayment = db.define(
  "client_loan_payment",
  {
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    loan_uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: ClientLoanApplication,
        key: "uuid",
      },
    },
    totalInterest: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        notEmpty: true,
      },
    },
    totalPayment: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        notEmpty: true,
      },
    },
    loanEMI: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        notEmpty: true,
      },
    },
    totalEMIPaid: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        isDecimal: true,
        notEmpty: true,
      },
    },
    status: {
      type: DataTypes.ENUM(
        "pending",
        "cancelled",
        "partial",
        "paid"
      ),
      allowNull: false,
      defaultValue: "pending",
    },
  },
  { freezeTableName: true, timestamps: true }
);

ClientLoanApplication.hasOne(ClientLoanPayment, {
  foreignKey: "loan_uuid",
});

ClientLoanPayment.belongsTo(ClientLoanApplication, {
  foreignKey: "loan_uuid",
});

module.exports = ClientLoanPayment;
