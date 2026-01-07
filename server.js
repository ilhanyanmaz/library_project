// Gerekli kütüphaneleri çağırıyoruz
const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Uygulamayı başlatıyoruz
const app = express();
const PORT = 3000;

// Gelen verileri (JSON) okuyabilmek için ayar
app.use(bodyParser.json());

// "public" klasöründeki dosyaları (HTML, CSS, JS) dışarıya açıyoruz
app.use(express.static(path.join(__dirname, 'public')));

// --- VERİTABANI BAĞLANTISI ---
// kutuphane.db adında bir dosya oluşturur veya varsa açar
const db = new sqlite3.Database('./kutuphane.db', (err) => {
    if (err) console.error(err.message);
    else console.log('✅ Veritabanına başarıyla bağlanıldı.');
});

// Tabloları oluşturuyoruz (Eğer yoksa)
db.serialize(() => {
    // 1. Kullanıcılar Tablosu (Giriş işlemleri için)
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )`);

    // 2. Kitaplar Tablosu (Kütüphane işlemleri için)
    db.run(`CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        author TEXT,
        pageCount INTEGER
    )`);
});

// --- API İŞLEMLERİ (Frontend ile haberleşme) ---

// 1. KAYIT OLMA İŞLEMİ
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    // Kullanıcıyı veritabanına ekle
    db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, password], function (err) {
        if (err) {
            // Hata varsa (muhtemelen aynı isimde kullanıcı var)
            return res.status(400).json({ error: "Bu kullanıcı adı zaten alınmış." });
        }
        res.json({ message: "Kayıt başarılı!" });
    });
});

// 2. GİRİŞ YAPMA İŞLEMİ
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    // Kullanıcı adı ve şifresi uyuşan var mı diye bak
    db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });

        if (row) {
            // Kullanıcı bulundu
            res.json({ message: "Giriş başarılı", user: row });
        } else {
            // Kullanıcı bulunamadı
            res.status(401).json({ error: "Kullanıcı adı veya şifre hatalı." });
        }
    });
});

// 3. KİTAP EKLEME (Create)
app.post('/api/books', (req, res) => {
    const { title, author, pageCount } = req.body;
    db.run("INSERT INTO books (title, author, pageCount) VALUES (?, ?, ?)",
        [title, author, pageCount], function (err) {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ id: this.lastID, message: "Kitap eklendi" });
        });
});

// 4. KİTAPLARI LİSTELEME (Read)
app.get('/api/books', (req, res) => {
    db.all("SELECT * FROM books", [], (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json(rows); // Bulunan tüm kitapları gönder
    });
});

// 5. TEK BİR KİTABI GETİRME (Düzenleme sayfası için)
app.get('/api/books/:id', (req, res) => {
    db.get("SELECT * FROM books WHERE id = ?", [req.params.id], (err, row) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json(row);
    });
});

// 6. KİTAP GÜNCELLEME (Update)
app.put('/api/books/:id', (req, res) => {
    const { title, author, pageCount } = req.body;
    db.run("UPDATE books SET title = ?, author = ?, pageCount = ? WHERE id = ?",
        [title, author, pageCount, req.params.id], function (err) {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ message: "Kitap güncellendi" });
        });
});

// 7. KİTAP SİLME (Delete)
app.delete('/api/books/:id', (req, res) => {
    db.run("DELETE FROM books WHERE id = ?", req.params.id, function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "Kitap silindi" });
    });
});

// Sunucuyu 3000 portunda başlat
app.listen(PORT, () => {
    console.log(`🚀 Sunucu çalışıyor: http://localhost:${PORT}`);
});