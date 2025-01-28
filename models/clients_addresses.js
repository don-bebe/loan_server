const { DataTypes } = require("sequelize");
const db = require("../config/dbconfig");
const BusinessClientDetails = require("./client_business_details");
const IndividualClientDetails = require("./client_individual_details");

const ClientAddress = db.define(
  "clients_addresses",
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
    addressLine1: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    addressLine2: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  { freezeTableName: true, timestamps: true }
);

IndividualClientDetails.hasOne(ClientAddress, {
  foreignKey: "client_uuid",
  as: "address",
  constraints: false,
});

ClientAddress.belongsTo(IndividualClientDetails, {
  foreignKey: "client_uuid",
  constraints: false,
});

BusinessClientDetails.hasOne(ClientAddress, {
  foreignKey: "client_uuid",
  as: "address",
  constraints: false,
});

ClientAddress.belongsTo(BusinessClientDetails, {
  foreignKey: "client_uuid",
  constraints: false,
});

module.exports = ClientAddress;
