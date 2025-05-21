// server.js
require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const db = require("./db");

const app = express();
const cors = require("cors");

app.use(cors());
app.use(bodyParser.json());

app.post("/signup", async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  }

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save to the database
    db.query(
      "INSERT INTO users (email, password) VALUES (?, ?)",
      [email, hashedPassword],
      (err, result) => {
        if (err) {
          console.error(err);
          return res
            .status(500)
            .json({ message: "User already exists or database error." });
        }
        res.status(201).json({ message: "User registered successfully." });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
});

app.post("/signin", async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  }

  try {
    // Fetch the user
    db.query(
      "SELECT * FROM users WHERE email = ?",
      [email],
      async (err, results) => {
        if (err || results.length === 0) {
          return res
            .status(401)
            .json({ message: "Invalid email or password." });
        }

        const user = results[0];

        // Compare passwords
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
          return res
            .status(401)
            .json({ message: "Invalid email or password." });
        }

        // Generate JWT
        const token = jwt.sign(
          { userId: user.id, email: user.email },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES }
        );

        res.json({ token });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
