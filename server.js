const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Database Connection ---
const db = new sqlite3.Database('./kutuphane.db', (err) => {
    if (err) console.error("DB Connection Error:", err.message);
    else console.log('✅ Veritabanına bağlanıldı.');
});

db.serialize(() => {
    // Users Table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firstName TEXT,
        lastName TEXT,
        username TEXT UNIQUE,
        password TEXT
    )`);

    // Books Table
    db.run(`CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        author TEXT,
        pageCount INTEGER,
        imageUrl TEXT
    )`);
});

// --- API Endpoints ---

// 1. Register
app.post('/api/register', (req, res) => {
    const { firstName, lastName, username, password } = req.body;

    db.run(`INSERT INTO users (firstName, lastName, username, password) VALUES (?, ?, ?, ?)`,
        [firstName, lastName, username, password], function (err) {
            if (err) return res.status(400).json({ error: "Bu kullanıcı adı kullanımda." });
            res.json({ message: "Kayıt başarılı", id: this.lastID });
        });
});

// 2. Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    db.get(`SELECT * FROM users WHERE username = ? AND password = ?`, [username, password], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) res.json({ message: "Giriş başarılı", user: row });
        else res.status(401).json({ error: "Hatalı kullanıcı adı veya şifre" });
    });
});

// 3. List Books
app.get('/api/books', (req, res) => {
    db.all("SELECT * FROM books", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 4. Add Book
app.post('/api/books', (req, res) => {
    const { title, author, pageCount, imageUrl } = req.body;

    // Basic validation
    if (!title || !author) {
        return res.status(400).json({ error: "Kitap adı ve yazar zorunludur." });
    }

    db.run(`INSERT INTO books (title, author, pageCount, imageUrl) VALUES (?, ?, ?, ?)`,
        [title, author, pageCount, imageUrl], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: this.lastID });
        });
});

// 5. Get Single Book
app.get('/api/books/:id', (req, res) => {
    db.get("SELECT * FROM books WHERE id = ?", [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "Kitap bulunamadı" });
        res.json(row);
    });
});

// 6. Update Book
app.put('/api/books/:id', (req, res) => {
    // Güncel bilgileri al
    const { title, author, pageCount, imageUrl } = req.body;

    db.run("UPDATE books SET title = ?, author = ?, pageCount = ?, imageUrl = ? WHERE id = ?",
        [title, author, pageCount, imageUrl, req.params.id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Güncellendi" });
        });
});

// 7. Delete Book
app.delete('/api/books/:id', (req, res) => {
    db.run("DELETE FROM books WHERE id = ?", req.params.id, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Silindi" });
    });
});

// Serve Frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Sunucu çalışıyor: http://localhost:${PORT}`);
});