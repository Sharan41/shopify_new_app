const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const csvWriter = require("fast-csv");

const app = express();
const DB_PATH = "database.db";

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Init DB
const db = new sqlite3.Database(DB_PATH);
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS users (name TEXT)");
});

// Routes
app.get("/", (req, res) => {
  res.render("form", { username: null });
});

app.post("/", (req, res) => {
  const username = req.body.username;
  if (username) {
    db.run("INSERT INTO users (name) VALUES (?)", [username], (err) => {
      if (err) console.error(err);
      res.render("form", { username });
    });
  } else {
    res.render("form", { username: null });
  }
});

app.get("/download", (req, res) => {
  db.all("SELECT name FROM users", [], (err, rows) => {
    if (err) return res.status(500).send("DB error");

    const filePath = path.join(__dirname, "names.csv");
    const ws = fs.createWriteStream(filePath);
    csvWriter
      .write(rows, { headers: true })
      .pipe(ws)
      .on("finish", () => {
        res.download(filePath);
      });
  });
});

// Header override (like after_request in Flask)
app.use((req, res, next) => {
  res.setHeader("X-Frame-Options", "ALLOWALL");
  next();
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
