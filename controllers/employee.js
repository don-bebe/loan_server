const EmployeePersonalDetails = require("../models/employee_personal_details");
const db = require("../config/dbconfig");

const createEmployee = async (req, res) => {
  const transaction = await db.transaction();
  try {
    // Validate request body
    const {
      firstName,
      lastName,
      ID_number,
      homeAddress,
      emailAddress,
      phoneNumber,
      role,
      isActive,
    } = req.body;
    if (
      !firstName ||
      !lastName ||
      !ID_number ||
      !homeAddress ||
      !emailAddress ||
      !phoneNumber ||
      !role
    ) {
      await transaction.rollback();
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if email is already used
    const employee = await EmployeePersonalDetails.findOne({
      where: { emailAddress },
      transaction,
    });

    // Display error message if email is already in use
    if (employee) {
      await transaction.rollback();
      return res
        .status(409)
        .json({ message: "Email is already in use by another user" });
    }

    // Proceed to save once email is not used
    await EmployeePersonalDetails.create(
      {
        firstName,
        lastName,
        ID_number,
        homeAddress,
        emailAddress,
        phoneNumber,
        role,
        isActive: isActive || false,
      },
      { transaction }
    );

    await transaction.commit();
    return res
      .status(201)
      .json({ message: "New employee registered into the system" });
  } catch (error) {
    await transaction.rollback();
    return res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
};

const updateEmployee = async (req, res) => {
  const transaction = await db.transaction();
  try {
    // Validate request body
    const updates = req.body;

    // Find the user by UUID
    const employee = await EmployeePersonalDetails.findByPk(req.params.uuid, {
      transaction,
    });

    if (!employee) {
      await transaction.rollback();
      return res.status(404).json({ message: "Employee not found" });
    }

    // Update fields if they are different
    for (const field in updates) {
      if (
        Object.prototype.hasOwnProperty.call(updates, field) &&
        updates[field] !== employee[field]
      ) {
        employee[field] = updates[field];
      }
    }

    await employee.save({ transaction });
    await transaction.commit();

    return res
      .status(200)
      .json({ message: "Employee details updated successfully!" });
  } catch (error) {
    await transaction.rollback();
    return res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
};

const getAllEmployee = async (req, res) => {
  try {
    const employees = await EmployeePersonalDetails.findAll();

    if (employees && employees.length > 0) {
      return res.status(200).json(employees);
    } else {
      return res.status(404).json({ message: "No employees found" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
};

module.exports = { createEmployee, updateEmployee, getAllEmployee };
