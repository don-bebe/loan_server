const bcrypt = require("bcrypt");
const EmployeePersonalDetails = require("../models/employee_personal_details");
const EmployeeLoginDetails = require("../models/employee_login_details");
const db = require("../config/dbconfig");

const signUpEmployee = async (req, res) => {
  const transaction = await db.transaction();
  try {
    //check if passwords match
    if (req.body.password !== req.body.confirmPassword)
      return res.status(400).json({ message: "Passwords does not match" });

    //check if user is in the system
    const emailAddress = req.body.emailAddress;
    const employee = await EmployeePersonalDetails.findOne({
      where: { emailAddress },
      transaction,
    });

    if (!employee) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Invalid emailAddress, user not found in the system!",
      });
    } else {
      //proceed to find if user did not sign up before
      const emp = await EmployeeLoginDetails.findOne({
        where: {
          emp_uuid: employee.uuid,
        },
        transaction,
      });
      if (emp) {
        await transaction.rollback();
        return res.status(409).json({
          message: "Employee already signed up, please proceed to login",
        });
      } else {
        //save the new employee login details
        await EmployeeLoginDetails.create(
          {
            emp_uuid: employee.uuid,
            password: req.body.password,
          },
          {
            transaction,
          }
        );

        await transaction.commit();
        return res
          .status(201)
          .json({ message: "You have successfully created your account" });
      }
    }
  } catch (error) {
    await transaction.rollback();
    return res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
};

const signInEmployee = async (req, res) => {
  const transaction = await db.transaction();
  try {
    const { emailAddress, password } = req.body;
    const employee = await EmployeePersonalDetails.findOne({
      where: {
        emailAddress,
      },
      transaction,
    });

    if (!employee) {
      await transaction.rollback();
      return res
        .status(404)
        .json({ message: "Invalid emailAddress or password" });
    } else {
      const emp = await EmployeeLoginDetails.findOne({
        where: {
          emp_uuid: employee.uuid,
        },
        transaction,
      });

      if (!emp) {
        await transaction.rollback();
        return res.status(401).json({
          message: "Not yet signed up, please proceed to signup",
        });
      }

      //verify is passwords match
      const match = await bcrypt.compare(password, emp.password);

      if (!match) {
        return res.status(404).json({ message: "Wrong emailAddress/password!!" });
      }

      // If user is inactive (status === false), prompt user to contact admin for activation
      if (employee.isActive === false) {
        await transaction.rollback();
        return res.status(401).json({
          message: "Please contact administrator to activate your account",
        });
      }
      
      req.session.userId = employee.uuid;
      const uuid = employee.uuid;
      const firstName = employee.firstName;
      const lastName = employee.lastName;
      const email = employee.emailAddress;
      const role = employee.role;
      await transaction.commit();
      res.status(200).json({ uuid, firstName, lastName, role, email });
    }
  } catch (error) {
    await transaction.rollback();
    return res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
};

const signOutEmployee = async (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(400).json({ message: "Can not logout" });
    res.status(200).json({ message: "You have logout" });
  });
};

module.exports = { signUpEmployee, signInEmployee, signOutEmployee };
