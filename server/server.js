const express = require("express");
const path = require("path");
const routes = require("./routes");

const app = express();

// API routes
app.use("/api", routes);

// Serve React build
app.use(express.static(path.join(__dirname, "../client/build")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build", "index.html"));
});

// CF_ACCESS_CLIENT_SECRET=f6b4480418755f91ed709f51f94722066fa28645389582a990041c85b544b659

// app.use(express.static(path.join(__dirname, "public")));
// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "public", "index.html"));
// });

// app.use(express.static("public"));

// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "public", "index.html"));
// });

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
