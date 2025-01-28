const { DataTypes } = require("sequelize");
const db = require("../config/dbconfig");
const BusinessClientDetails = require("./client_business_details");
const IndividualClientDetails = require("./client_individual_details");

const ClientLoginDetails = db.define(
  "client_login_details",
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
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    passwordResetToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
       defaultValue: DataTypes.NOW,
    },
  },
  { freezeTableName: true, timestamps: true }
);

IndividualClientDetails.hasOne(ClientLoginDetails, {
  foreignKey: "client_uuid",
  constraints: false,
});

ClientLoginDetails.belongsTo(IndividualClientDetails, {
  foreignKey: "client_uuid",
  constraints: false,
});

BusinessClientDetails.hasOne(ClientLoginDetails, {
  foreignKey: "client_uuid",
  constraints: false,
});

ClientLoginDetails.belongsTo(BusinessClientDetails, {
  foreignKey: "client_uuid",
  constraints: false,
});

module.exports = ClientLoginDetails;
