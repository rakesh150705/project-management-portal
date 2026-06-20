const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();

app.use(cors());
app.use(express.json());

const SECRET = "mysecret123";

// ================= DB =================
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "2005",
    database: "projectdb"
});

db.connect(err => {
    if (err) throw err;
    console.log("MySQL Connected...");
});

// ================= AUTH =================
function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];

    if (!authHeader) return res.status(401).send("Token Required");

    if (!authHeader.startsWith("Bearer "))
        return res.status(401).send("Invalid Token Format");

    const token = authHeader.split(" ")[1];

    jwt.verify(token, SECRET, (err, user) => {
        if (err) return res.status(403).send("Invalid Token");

        req.user = user;
        next();
    });
}

// ================= REGISTER =================
app.post("/register", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password)
        return res.status(400).send("Fields required");

    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = "INSERT INTO users (username, password) VALUES (?, ?)";

    db.query(sql, [username, hashedPassword], (err) => {
        if (err) return res.status(500).send("User exists or DB error");
        res.send("User Registered");
    });
});

// ================= LOGIN =================
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    const sql = "SELECT * FROM users WHERE username = ?";

    db.query(sql, [username], async (err, results) => {
        if (err) return res.status(500).send(err);

        if (results.length === 0)
            return res.status(404).json({ message: "User not found" });

        const user = results[0];

        const match = await bcrypt.compare(password, user.password);

        if (!match)
            return res.status(401).json({ message: "Wrong password" });

        const token = jwt.sign({ id: user.id }, SECRET, {
            expiresIn: "1h"
        });

        res.json({ token });
    });
});

// ================= GET TASKS =================
app.get("/tasks", authenticateToken, (req, res) => {
    const sql = "SELECT * FROM tasks WHERE user_id = ?";

    db.query(sql, [req.user.id], (err, results) => {
        if (err) return res.status(500).send(err);

        // Convert status → boolean
        const tasks = results.map(t => ({
            ...t,
            completed: t.status === "Completed"
        }));

        res.json(tasks);
    });
});

// ================= ADD TASK =================
app.post("/tasks", authenticateToken, (req, res) => {
    const { title, description } = req.body;

    if (!title)
        return res.status(400).send("Title required");

    const sql = `
        INSERT INTO tasks (title, description, status, user_id)
        VALUES (?, ?, 'Pending', ?)
    `;

    db.query(sql, [title, description, req.user.id], (err) => {
        if (err) return res.status(500).send(err);
        res.send("Task Added");
    });
});

// ================= TOGGLE TASK =================
app.put("/tasks/:id", authenticateToken, (req, res) => {
    const getSql = "SELECT status FROM tasks WHERE id = ? AND user_id = ?";

    db.query(getSql, [req.params.id, req.user.id], (err, results) => {
        if (err) return res.status(500).send(err);

        if (results.length === 0)
            return res.status(404).send("Task not found");

        const current = results[0].status;
        const newStatus = current === "Pending" ? "Completed" : "Pending";

        const updateSql = `
            UPDATE tasks SET status = ? 
            WHERE id = ? AND user_id = ?
        `;

        db.query(updateSql, [newStatus, req.params.id, req.user.id], (err) => {
            if (err) return res.status(500).send(err);
            res.send("Task Updated");
        });
    });
});

// ================= EDIT TASK =================
app.patch("/tasks/:id", authenticateToken, (req, res) => {
    const { title, description } = req.body;

    const sql = `
        UPDATE tasks 
        SET title = ?, description = ?
        WHERE id = ? AND user_id = ?
    `;

    db.query(sql, [title, description, req.params.id, req.user.id], (err, result) => {
        if (err) return res.status(500).send(err);

        if (result.affectedRows === 0)
            return res.status(404).send("Task not found");

        res.send("Task Updated");
    });
});

// ================= DELETE TASK =================
app.delete("/tasks/:id", authenticateToken, (req, res) => {
    const sql = `
        DELETE FROM tasks 
        WHERE id = ? AND user_id = ?
    `;

    db.query(sql, [req.params.id, req.user.id], (err, result) => {
        if (err) return res.status(500).send(err);

        if (result.affectedRows === 0)
            return res.status(404).send("Task not found");

        res.send("Task Deleted");
    });
});

// ================= START =================
app.listen(5000, () => console.log("Server running on port 5000"));