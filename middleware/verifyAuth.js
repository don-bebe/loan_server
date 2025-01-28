const EmployeePersonalDetails = require("../models/employee_personal_details");

const verifyUser = async (req, res, next) => {
  try {
    // Validate session existence:
    if (!req.session) {
      return res.status(401).json({ message: "Please login to your account!" });
    }

    if (!req.session.userId) {
      req.session.destroy(); // Clear potentially invalid session
      return res
        .status(401)
        .json({ message: "Unauthorized: Missing user ID in session." });
    }

    const user = await EmployeePersonalDetails.findOne({
      where: {
        uuid: req.session.userId,
      },
    });

    // Handle user not found:
    if (!user) {
      return res.status(401).json({ message: "Unauthorized: User not found." });
    }

    // Set user data on request object:
    req.userId = user.uuid;
    req.role = user.role;
    req.firstName = user.firstName;
    req.lastName = user.lastName;

    // Call next middleware function:
    next();
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
};

const adminOnly = async (req, res, next) => {
  const user = await EmployeePersonalDetails.findOne({
    where: {
      uuid: req.session.userId,
    },
  });
  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.role !== "admin")
    return res
      .status(403)
      .json({ message: "Access forbidden, Administrator only!" });
  next();
};

const loanOfficerOnly = async (req, res, next) => {
  const user = await EmployeePersonalDetails.findOne({
    where: {
      uuid: req.session.userId,
    },
  });
  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.role !== "loan-officer")
    return res
      .status(403)
      .json({ message: "Access forbidden, Loan Officers only!" });
  next();
};

module.exports = { verifyUser, adminOnly, loanOfficerOnly };
