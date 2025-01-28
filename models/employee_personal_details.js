const { DataTypes } = require("sequelize");
const db = require("../config/dbconfig");

const ROLES = ["admin", "loan-officer", "finance-team", "customer-support"];

const EmployeePersonalDetails = db.define(
  "employee_personal_details",
  {
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
      primaryKey: true, // Ensure this is the primary key
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [3, 32],
      },
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [3, 32],
      },
    },
    ID_number: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [10, 15],
      },
    },
    homeAddress: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    emailAddress: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
        notEmpty: true,
      },
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        is: /^[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/i, // Regex to validate local and international numbers
      },
    },
    role: {
      type: DataTypes.ENUM(...ROLES),
      allowNull: false,
      validate: {
        isIn: [ROLES],
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  { freezeTableName: true, timestamps: true }
);

module.exports = EmployeePersonalDetails;
