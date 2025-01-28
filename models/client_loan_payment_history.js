const { DataTypes } = require("sequelize");
const db = require("../config/dbconfig");
const ClientLoanPayment = require("./client_loan_payment");

const ClientLoanPaymentHistory = db.define(
  "client_loan_payment_history",
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
    payment_uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: ClientLoanPayment,
        key: "uuid",
      },
    },
    paidAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    amountPaid: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        notEmpty: true,
      },
    },
    remainingAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        notEmpty: true,
      },
    },
    doneBy: {
      type: DataTypes.ENUM("client", "loan-officer"),
      allowNull: false,
    },
  },
  { freezeTableName: true, timestamps: true }
);

ClientLoanPayment.hasMany(ClientLoanPaymentHistory, {
  foreignKey: "payment_uuid",
});

ClientLoanPaymentHistory.belongsTo(ClientLoanPayment, {
  foreignKey: "payment_uuid",
});

module.exports = ClientLoanPaymentHistory;
