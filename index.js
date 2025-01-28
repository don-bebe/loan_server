require("dotenv").config();
const http = require("http");
const app = require("./server");

// Defining APP_PORT 
const port = process.env.APP_PORT || 5050; 

const server = http.createServer(app);

// Start the server
server.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});

// Handle server errors
server.on("error", (err) => {
  console.error("Server error:", err.message);
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use.`);
  }
});
