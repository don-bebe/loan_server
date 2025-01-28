const { DataTypes } = require("sequelize");
const db = require("../config/dbconfig");
const BusinessClientDetails = require("./client_business_details");
const IndividualClientDetails = require("./client_individual_details");

const DocumentProofs = db.define(
  "client_proof_documents",
  {
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
      primaryKey: true,
    },
    client_uuid: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    documentType: {
      type: DataTypes.ENUM("ID", "proof of income", "proof of residence"),
      allowNull: false,
    },
    documentFile: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  { freezeTableName: true, timestamps: true }
);

IndividualClientDetails.hasMany(DocumentProofs, {
  foreignKey: "client_uuid",
  constraints: false,
});

DocumentProofs.belongsTo(IndividualClientDetails, {
  foreignKey: "client_uuid",
  constraints: false,
});

BusinessClientDetails.hasMany(DocumentProofs, {
  foreignKey: "client_uuid",
  constraints: false,
});

DocumentProofs.belongsTo(BusinessClientDetails, {
  foreignKey: "client_uuid",
  constraints: false,
});

module.exports = DocumentProofs;
