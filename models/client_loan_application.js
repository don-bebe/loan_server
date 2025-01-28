const { DataTypes } = require("sequelize");
const db = require("../config/dbconfig");
const BusinessClientDetails = require("./client_business_details");
const IndividualClientDetails = require("./client_individual_details");

const ClientLoanApplication = db.define(
  "client_loan_application",
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
    client_uuid: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    loanType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    loanAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        notEmpty: true,
      },
    },
    netLoanAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        notEmpty: true,
      },
    },
    loanTerm: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: true,
        notEmpty: true,
      },
    },
    interestRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        notEmpty: true,
      },
    },
    originationFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        notEmpty: true,
      },
    },
    latePaymentFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        notEmpty: true,
      },
    },
    status: {
      type: DataTypes.ENUM("cancelled", "pending", "approved", "rejected"),
      allowNull: false,
      defaultValue: "pending",
    },
  },
  {
    freezeTableName: true,
    timestamps: true,
  }
);

IndividualClientDetails.hasMany(ClientLoanApplication, {
  foreignKey: "client_uuid",
  constraints: false,
});

ClientLoanApplication.belongsTo(IndividualClientDetails, {
  foreignKey: "client_uuid",
  constraints: false,
});

BusinessClientDetails.hasMany(ClientLoanApplication, {
  foreignKey: "client_uuid",
  constraints: false,
});

ClientLoanApplication.belongsTo(BusinessClientDetails, {
  foreignKey: "client_uuid",
  constraints: false,
});

module.exports = ClientLoanApplication;
