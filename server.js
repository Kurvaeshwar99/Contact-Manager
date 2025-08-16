const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const db = new sqlite3.Database("contacts.db", (err) => {
  if (err) {
    console.error("Error opening database:", err);
  } else {
    console.log("Connected to SQLite database");
    // Create contacts table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
  }
});

// API Routes

// Get all contacts
app.get("/api/contacts", (req, res) => {
  db.all("SELECT * FROM contacts ORDER BY name ASC", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Add a new contact
app.post("/api/contacts", (req, res) => {
  const { name, phone, email } = req.body;
  if (!name || !phone || !email) {
    res.status(400).json({ error: "All fields are required" });
    return;
  }

  const sql = "INSERT INTO contacts (name, phone, email) VALUES (?, ?, ?)";
  db.run(sql, [name, phone, email], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({
      id: this.lastID,
      name,
      phone,
      email,
    });
  });
});

// Update a contact
app.put("/api/contacts/:id", (req, res) => {
  const { name, phone, email } = req.body;
  if (!name || !phone || !email) {
    res.status(400).json({ error: "All fields are required" });
    return;
  }

  const sql = "UPDATE contacts SET name = ?, phone = ?, email = ? WHERE id = ?";
  db.run(sql, [name, phone, email, req.params.id], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: "Contact not found" });
      return;
    }
    res.json({
      id: req.params.id,
      name,
      phone,
      email,
    });
  });
});

// Delete a contact
app.delete("/api/contacts/:id", (req, res) => {
  const sql = "DELETE FROM contacts WHERE id = ?";
  db.run(sql, req.params.id, function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: "Contact not found" });
      return;
    }
    res.json({ message: "Contact deleted successfully" });
  });
});

// Search contacts
app.get("/api/contacts/search", (req, res) => {
  const searchTerm = req.query.q || "";
  const sql = "SELECT * FROM contacts WHERE name LIKE ? ORDER BY name ASC";
  db.all(sql, [`%${searchTerm}%`], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Start server
const startServer = (port) => {
  try {
    app
      .listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
      })
      .on("error", (err) => {
        if (err.code === "EADDRINUSE") {
          console.log(`Port ${port} is busy, trying port ${port + 1}`);
          startServer(port + 1);
        } else {
          console.error("Server error:", err);
        }
      });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

startServer(port);
