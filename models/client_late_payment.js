const { DataTypes } = require("sequelize");
const db = require("../config/dbconfig");
const ClientLoanPayment = require("./client_loan_payment");

const ClientLatePayment = db.define(
  "client_late_payment",
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
    lateMonths: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    paymentFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        notEmpty: true,
      },
    },
  },
  { freezeTableName: true, timestamps: true }
);

ClientLoanPayment.hasOne(ClientLatePayment, {
  foreignKey: "payment_uuid",
});

ClientLatePayment.belongsTo(ClientLoanPayment, {
  foreignKey: "payment_uuid",
});

module.exports = ClientLatePayment;
