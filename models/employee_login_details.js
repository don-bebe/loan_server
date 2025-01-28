const { DataTypes } = require("sequelize");
const bcrypt = require("bcrypt");
const db = require("../config/dbconfig");
const EmployeePersonalDetails = require("./employee_personal_details");

const EmployeeLoginDetails = db.define(
  "employee_login_details",
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
    emp_uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: EmployeePersonalDetails,
        key: "uuid",
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isPasswordValid(value) {
          if (
            !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
              value
            )
          ) {
            throw new Error(
              "Password must contain at least 8 characters including uppercase, lowercase, and numeric characters."
            );
          }
        },
      },
      get() {
        return this.getDataValue("password");
      },
      set(value) {
        const hashedPassword = bcrypt.hashSync(value, bcrypt.genSaltSync(12));
        this.setDataValue("password", hashedPassword);
      },
    },
  },
  { freezeTableName: true, timestamps: true }
);

// Define the relationship
EmployeePersonalDetails.hasOne(EmployeeLoginDetails, {
  foreignKey: "emp_uuid",
});

EmployeeLoginDetails.belongsTo(EmployeePersonalDetails, {
  foreignKey: "emp_uuid",
});

module.exports = EmployeeLoginDetails;
