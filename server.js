// Express kütüphanesini çağır (Web sunucusu için)
const express = require('express');
// Body-Parser kütüphanesini çağır (Form verilerini okumak için)
const bodyParser = require('body-parser');
// SQLite3 kütüphanesini çağır (Veritabanı işlemleri için)
const sqlite3 = require('sqlite3').verbose();
// Path kütüphanesini çağır (Dosya yollarını yönetmek için)
const path = require('path');

// Express uygulamasını başlat
const app = express();
// Sunucunun çalışacağı port numarası (3000)
const PORT = 3000;

// Gelen JSON formatındaki verileri otomatik olarak ayrıştır
app.use(bodyParser.json());
// İstemciye (tarayıcıya) statik dosyaları (HTML, CSS, JS, Resimler) bu klasörden sun
// __dirname: Şu anki klasör yolunu temsil eder
app.use(express.static(__dirname));

// --- VERİTABANI BAĞLANTISI ---
// 'kutuphane.db' adında bir dosya veritabanı oluştur veya varsa bağlan
const db = new sqlite3.Database('./kutuphane.db', (err) => {
    // Bağlantıda hata olursa konsola yazdır
    if (err) console.error("Veritabanı hatası:", err.message);
    // Başarılı olursa konsola bilgi ver
    else console.log('✅ Veritabanına bağlanıldı.');
});

// Veritabanı tablolarını sırayla oluştur (Serialize: İşlemleri sıraya koyar)
db.serialize(() => {
    // 1. Kullanıcılar Tablosunu Oluştur (Eğer yoksa)
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT, /* Otomatik artan benzersiz ID */
        firstName TEXT, /* Kullanıcının adı */
        lastName TEXT, /* Kullanıcının soyadı */
        username TEXT UNIQUE, /* Kullanıcı adı (Benzersiz olmalı) */
        password TEXT /* Şifre */
    )`);

    // 2. Kitaplar Tablosunu Oluştur (Eğer yoksa)
    db.run(`CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT, /* Otomatik artan Kitap ID */
        title TEXT, /* Kitap Başlığı */
        author TEXT, /* Yazar Adı */
        pageCount INTEGER, /* Sayfa Sayısı */
        imageUrl TEXT /* Kitap Kapak Resmi URL'si */
    )`);
});

// --- API YOLLARI (Endpoints) ---

// 1. KAYIT OLMA İŞLEMİ (POST İsteği)
app.post('/api/register', (req, res) => {
    // İstekten gelen verileri değişkenlere ata
    const { firstName, lastName, username, password } = req.body;
    
    // Veritabanına yeni kullanıcı ekle
    db.run(`INSERT INTO users (firstName, lastName, username, password) VALUES (?, ?, ?, ?)`, 
    [firstName, lastName, username, password], function(err) {
        // Eğer hata varsa (örneğin kullanıcı adı zaten varsa)
        if (err) return res.status(400).json({ error: "Bu kullanıcı adı kullanımda." });
        // Başarılıysa mesaj ve yeni ID'yi döndür
        res.json({ message: "Kayıt başarılı", id: this.lastID });
    });
});

// 2. GİRİŞ YAPMA İŞLEMİ (POST İsteği)
app.post('/api/login', (req, res) => {
    // İstekten kullanıcı adı ve şifreyi al
    const { username, password } = req.body;
    
    // Veritabanında bu kullanıcı adı ve şifreye sahip kayıt var mı kontrol et
    db.get(`SELECT * FROM users WHERE username = ? AND password = ?`, [username, password], (err, row) => {
        // Sunucu hatası varsa
        if (err) return res.status(500).json({ error: err.message });
        // Kullanıcı bulunduysa giriş başarılı mesajı ver
        if (row) res.json({ message: "Giriş başarılı", user: row });
        // Bulunamadıysa hata mesajı ver
        else res.status(401).json({ error: "Hatalı kullanıcı adı veya şifre" });
    });
});

// 3. KİTAPLARI LİSTELEME (GET İsteği)
app.get('/api/books', (req, res) => {
    // Veritabanındaki tüm kitapları seç
    db.all("SELECT * FROM books", [], (err, rows) => {
        // Hata varsa bildir
        if (err) return res.status(500).json({ error: err.message });
        // Kitap listesini (dizi olarak) gönder
        res.json(rows);
    });
});

// 4. YENİ KİTAP EKLEME (POST İsteği)
app.post('/api/books', (req, res) => {
    // İstekten kitap bilgilerini al
    const { title, author, pageCount, imageUrl } = req.body;
    
    // Veritabanına yeni kitap ekle
    db.run(`INSERT INTO books (title, author, pageCount, imageUrl) VALUES (?, ?, ?, ?)`, 
        [title, author, pageCount, imageUrl], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        // Başarılıysa eklenen kitabın ID'sini gönder
        res.json({ id: this.lastID });
    });
});

// 5. TEK BİR KİTABI GETİRME (Düzenleme sayfası için - GET İsteği)
app.get('/api/books/:id', (req, res) => {
    // ID'ye göre kitabı bul
    db.get("SELECT * FROM books WHERE id = ?", [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        // Kitap verisini gönder
        res.json(row);
    });
});

// 6. KİTAP GÜNCELLEME (PUT İsteği)
app.put('/api/books/:id', (req, res) => {
    // Güncel bilgileri al
    const { title, author, pageCount, imageUrl } = req.body;
    
    // Veritabanındaki kaydı güncelle
    db.run("UPDATE books SET title = ?, author = ?, pageCount = ?, imageUrl = ? WHERE id = ?", 
        [title, author, pageCount, imageUrl, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        // Başarılı mesajı gönder
        res.json({ message: "Güncellendi" });
    });
});

// 7. KİTAP SİLME (DELETE İsteği)
app.delete('/api/books/:id', (req, res) => {
    // ID'ye göre kaydı sil
    db.run("DELETE FROM books WHERE id = ?", req.params.id, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Silindi" });
    });
});

// Ana sayfaya yönlendirme (http://localhost:3000/ girildiğinde index.html'i aç)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Sunucuyu belirtilen portta dinlemeye başla
app.listen(PORT, () => {
    console.log(`🚀 Sunucu çalışıyor: http://localhost:${PORT}`);
});