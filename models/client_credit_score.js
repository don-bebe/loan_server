const { DataTypes } = require("sequelize");
const db = require("../config/dbconfig");
const BusinessClientDetails = require("./client_business_details");
const IndividualClientDetails = require("./client_individual_details");

const ClientCreditScore = db.define(
  "client_credit_score",
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
    creditScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  { freezeTableName: true, timestamps: true }
);

IndividualClientDetails.hasOne(ClientCreditScore, {
  foreignKey: "client_uuid",
  constraints: false,
});

ClientCreditScore.belongsTo(IndividualClientDetails, {
  foreignKey: "client_uuid",
  constraints: false,
});

BusinessClientDetails.hasOne(ClientCreditScore, {
  foreignKey: "client_uuid",
  constraints: false,
});

ClientCreditScore.belongsTo(BusinessClientDetails, {
  foreignKey: "client_uuid",
  constraints: false,
});

module.exports = ClientCreditScore;
