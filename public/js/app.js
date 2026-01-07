const API_URL = '/api'; // Sunucu adresi kısayolu

// --- GÜVENLİK KONTROLÜ ---
// Sayfa yüklendiğinde çalışır. Kullanıcı giriş yapmamışsa ana sayfaya atar.
function checkAuth() {
    const user = localStorage.getItem('user'); // Tarayıcı hafızasına bak
    const path = window.location.pathname; // Hangi sayfadayız?

    // Eğer kullanıcı yoksa VE şu an giriş/kayıt sayfasında değilsek
    if (!user && !path.includes('index.html') && !path.includes('register.html')) {
        window.location.href = 'index.html'; // Girişe yönlendir
    }
}

// --- ÇIKIŞ YAPMA ---
function logout() {
    localStorage.removeItem('user'); // Hafızayı temizle
    window.location.href = 'index.html'; // Giriş sayfasına dön
}

// --- KAYIT OLMA (Register) ---
async function register(e) {
    e.preventDefault(); // Sayfanın yenilenmesini engelle

    // Formdaki bilgileri al
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Sunucuya gönder
    const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    if (res.ok) {
        alert("Kayıt Başarılı! Şimdi giriş yapabilirsiniz.");
        window.location.href = 'index.html';
    } else {
        alert("Hata: Bu kullanıcı adı kullanılıyor olabilir.");
    }
}

// --- GİRİŞ YAPMA (Login) ---
async function login(e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (res.ok) {
        // Başarılıysa kullanıcı bilgisini hafızaya kaydet
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = 'home.html'; // Ana sayfaya git
    } else {
        alert("Hata: " + data.error);
    }
}

// --- KİTAPLARI LİSTELEME (Home Sayfası) ---
async function loadBooks() {
    checkAuth(); // Önce giriş yapmış mı kontrol et

    const list = document.getElementById('book-list');

    // Sunucudan kitapları iste
    const res = await fetch(`${API_URL}/books`);
    const books = await res.json();

    list.innerHTML = ''; // Listeyi temizle

    // Eğer hiç kitap yoksa uyarı göster
    if (books.length === 0) {
        list.innerHTML = '<tr><td colspan="4" class="text-center">Henüz kitap eklenmemiş.</td></tr>';
        return;
    }

    // Her kitap için tabloya bir satır ekle
    books.forEach(book => {
        const row = `
            <tr>
                <td>${book.title}</td>
                <td>${book.author}</td>
                <td>${book.pageCount}</td>
                <!-- DEĞİŞİKLİK BURADA: text-center ekledik ki butonlar ortalansın -->
                <td class="text-center">
                    <button class="btn btn-warning btn-sm" onclick="window.location.href='edit.html?id=${book.id}'">Düzenle</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteBook(${book.id})">Sil</button>
                </td>
            </tr>
        `;
        list.insertAdjacentHTML('beforeend', row);
    });
}

// --- KİTAP EKLEME (Add Sayfası) ---
async function addBook(e) {
    e.preventDefault();

    // Form verilerini al
    const title = document.getElementById('title').value;
    const author = document.getElementById('author').value;
    const pageCount = document.getElementById('pageCount').value;

    // Sunucuya gönder
    const res = await fetch(`${API_URL}/books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, author, pageCount })
    });

    if (res.ok) {
        alert("Kitap Başarıyla Eklendi!");
        window.location.href = 'home.html';
    } else {
        alert("Bir hata oluştu.");
    }
}

// --- KİTAP SİLME ---
async function deleteBook(id) {
    if (confirm("Bu kitabı silmek istediğinize emin misiniz?")) {
        await fetch(`${API_URL}/books/${id}`, { method: 'DELETE' });
        loadBooks(); // Listeyi yenile (silinen gitsin)
    }
}

// --- DÜZENLEME SAYFASI YÜKLENİRKEN ---
async function loadEditPage() {
    checkAuth();

    // Adres çubuğundaki ID'yi al (örn: edit.html?id=5)
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    // O kitabın bilgilerini sunucudan çek
    const res = await fetch(`${API_URL}/books/${id}`);
    const book = await res.json();

    // Kutucukları doldur
    document.getElementById('edit-id').value = book.id;
    document.getElementById('title').value = book.title;
    document.getElementById('author').value = book.author;
    document.getElementById('pageCount').value = book.pageCount;
}

// --- KİTAP GÜNCELLEME (Edit Sayfası) ---
async function updateBook(e) {
    e.preventDefault();

    const id = document.getElementById('edit-id').value;
    const title = document.getElementById('title').value;
    const author = document.getElementById('author').value;
    const pageCount = document.getElementById('pageCount').value;

    // Sunucuya güncellenmiş veriyi gönder (PUT metodu ile)
    const res = await fetch(`${API_URL}/books/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, author, pageCount })
    });

    if (res.ok) {
        alert("Kitap Güncellendi!");
        window.location.href = 'home.html';
    }
}