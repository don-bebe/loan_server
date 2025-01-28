const { DataTypes } = require("sequelize");
const db = require("../config/dbconfig");
const ClientLoanApplication = require("./client_loan_application");

const ClientLoanApplicationHistory = db.define(
  "client_loan_application_history",
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
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    doneBy: {
      type: DataTypes.ENUM("client", "loan-officer"),
      allowNull: false,
    },
    changeDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  },
  { freezeTableName: true, timestamps: true }
);

ClientLoanApplication.hasMany(ClientLoanApplicationHistory, {
  foreignKey: "loan_uuid",
});

ClientLoanApplicationHistory.belongsTo(ClientLoanApplication, {
  foreignKey: "loan_uuid",
});

module.exports = ClientLoanApplicationHistory;
