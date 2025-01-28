const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const db = require("./config/dbconfig");
const session = require("express-session");
const SequelizeStore = require("connect-session-sequelize")(session.Store);
const empAuthRouter = require("./routes/employee_auth");
const empRouter = require("./routes/employee");
const loanPackageRouter = require("./routes/loan_packages");
const clientRouter = require("./routes/clients");
const clientAuthRouter = require("./routes/client_auth");
const scoreRouter = require("./routes/score");
const applicationRouter = require("./routes/loan_application");
const docRouter = require("./routes/documents");
const payRouter = require("./routes/loan_payments");

db.sync()
  .then(() =>
    console.log("Database connection successful and tables synchronized.")
  )
  .catch((error) => console.error("Database connection failed:", error));

const app = express();

if (!process.env.SESS_SECRET || !process.env.CLIENT_URL) {
  console.error(
    "Missing required environment variables. Please check your .env file."
  );
  process.exit(1);
}

const store = new SequelizeStore({
  db: db,
});

app.use(
  session({
    secret: process.env.SESS_SECRET,
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: {
      secure: false,
      maxAge: 3 * 60 * 60 * 1000,
    },
  })
);

const corsOptions = {
  origin: process.env.CLIENT_URL,
  credentials: true,
};
app.use(cors(corsOptions));

app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("./uploads"));

app.use("/auth", empAuthRouter);
app.use("/emp", empRouter);
app.use("/package", loanPackageRouter);
app.use("/clients", clientRouter);
app.use("/authentic", clientAuthRouter);
app.use("/apply", applicationRouter);
app.use("/score", scoreRouter);
app.use("/doc", docRouter);
app.use("/pay", payRouter);

module.exports = app;
