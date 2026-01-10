const API_URL = '/api'; // Sunucu ile iletişim kuracağımız temel adres

// --- GÜVENLİK KONTROLÜ ---
function checkAuth() {
    try {
        // Tarayıcı hafızasından (localStorage) kullanıcı bilgisini al
        const user = localStorage.getItem('user');
        // Şu anki sayfanın adresini al
        const path = window.location.pathname;
        // Dosya adını bul (örn: /index.html -> index.html)
        let page = path.split("/").pop();
        // Eğer boşsa veya sadece / ise index.html varsay
        if (page === "" || page === "/") page = "index.html";

        // Giriş yapmadan erişilebilecek sayfalar
        const publicPages = ['index.html', 'register.html'];

        if (!user) {
            // Kullanıcı giriş yapmamışsa ve korumalı bir sayfadaysa -> index.html'e at
            if (!publicPages.includes(page)) window.location.href = 'index.html';
        } else {
            // Kullanıcı zaten giriş yapmışsa ve login/register'a girmeye çalışıyorsa -> home.html'e at
            if (publicPages.includes(page)) window.location.href = 'home.html';
        }
    } catch (e) { console.error(e); }
}

// --- ÇIKIŞ YAPMA FONKSİYONU ---
function logout() {
    localStorage.removeItem('user'); // Kullanıcı bilgisini sil
    window.location.href = 'index.html'; // Giriş sayfasına yönlendir
}

// --- KİTAP ARAMA (Sarı Efekt & Otomatik Kaydırma) ---
function searchBook() {
    // Kullanıcıdan kitap adını sor
    let query = prompt("🔎 Aramak istediğiniz kitabın adını girin:");

    if (!query) return; // İptal ederse çık
    query = query.toLocaleLowerCase('tr'); // Türkçe karakter uyumlu küçük harfe çevir

    // Ekrandaki tüm kitap kartlarını bul
    const cols = document.querySelectorAll('#book-grid > div');
    let firstMatch = null; // İlk eşleşen kitabı tutacak değişken
    let foundAny = false; // Hiç bulundu mu kontrolü

    cols.forEach(col => {
        const card = col.querySelector('.book-card'); // Kart elementi
        // Kartın içindeki başlığı al ve küçük harfe çevir
        const title = col.querySelector('.book-title').innerText.toLocaleLowerCase('tr');

        // Önceki sarı vurguları temizle
        card.classList.remove('card-highlight-yellow');

        // Aranan kelime başlıkta geçiyor mu?
        if (title.includes(query)) {
            foundAny = true;

            // Varsa sarı vurgu sınıfını ekle
            card.classList.add('card-highlight-yellow');

            // Eğer bu ilk bulunan ise, firstMatch değişkenine kaydet
            if (!firstMatch) {
                firstMatch = col;
            }

            // 5 Saniye sonra sarı vurguyu kaldır
            setTimeout(() => {
                card.classList.remove('card-highlight-yellow');
            }, 5000);
        }
    });

    if (firstMatch) {
        // İlk bulunan kitabın olduğu yere sayfayı yumuşakça kaydır
        firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        alert("😔 Aradığınız isme uygun kitap bulunamadı.");
    }
}

// --- KAYIT OLMA FONKSİYONU ---
async function register(e) {
    e.preventDefault(); // Sayfanın yenilenmesini engelle
    // Formdaki verileri al
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('passwordConfirm').value;

    // Şifreler uyuşuyor mu kontrol et
    if (password !== passwordConfirm) {
        alert("⚠️ Şifreler eşleşmiyor!");
        return;
    }

    try {
        // Sunucuya POST isteği gönder
        const res = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ firstName, lastName, username, password })
        });
        const data = await res.json();

        if (res.ok) {
            alert("✅ Kayıt başarılı! Giriş yapabilirsiniz.");
            window.location.href = 'index.html';
        } else {
            alert("❌ Hata: " + data.error);
        }
    } catch (error) { alert("Sunucu hatası."); }
}

// --- GİRİŞ YAPMA FONKSİYONU ---
async function login(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        // Sunucuya giriş bilgilerini gönder
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();

        if (res.ok) {
            // Başarılıysa kullanıcı bilgisini kaydet ve ana sayfaya git
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = 'home.html';
        } else {
            alert("❌ " + data.error);
        }
    } catch (error) { alert("Sunucu hatası."); }
}

// --- KİTAPLARI YÜKLEME VE SAYIM ---
async function loadBooks() {
    checkAuth(); // Giriş kontrolü yap
    try {
        // Sunucudan kitapları iste
        const res = await fetch(`${API_URL}/books`);
        const books = await res.json();

        // --- Toplam Kitap Sayısını Güncelle ---
        const countBtn = document.getElementById('total-books-btn');
        if (countBtn) {
            countBtn.innerText = `📚 Toplam Kitap: ${books.length}`;
        }

        // Kitapların ekleneceği alanı seç
        const gridContainer = document.getElementById('book-grid');
        gridContainer.innerHTML = ''; // Önceki içeriği temizle

        // Her bir kitap için HTML oluştur
        books.forEach(book => {
            // Resim URL yoksa varsayılan resim kullan
            const imageSrc = book.imageUrl ? book.imageUrl : 'https://via.placeholder.com/300x400?text=Resim+Yok';

            const cardHTML = `
                <div class="col-12 col-sm-6 col-md-4 col-lg-3 mb-4">
                    <div class="book-card fade-in">
                        <div class="book-img-container">
                            <!-- onerror: Resim yüklenemezse çalışır -->
                            <img src="${imageSrc}" class="book-img" alt="${book.title}" onerror="this.src='https://via.placeholder.com/300x400?text=Hatalı+URL'">
                        </div>
                        <div class="book-body">
                            <h5 class="book-title" title="${book.title}">${book.title}</h5>
                            <p class="book-author">✍️ ${book.author}</p>
                            <div>
                                <span class="book-meta">📄 ${book.pageCount} Sayfa</span>
                            </div>
                            <div class="book-actions">
                                <!-- Düzenle Butonu -->
                                <a href="edit.html?id=${book.id}" class="btn-card btn-edit text-center text-decoration-none">Düzenle</a>
                                <!-- Sil Butonu -->
                                <button onclick="deleteBook(${book.id})" class="btn-card btn-delete">Sil</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            // HTML'i sayfaya ekle
            gridContainer.innerHTML += cardHTML;
        });
    } catch (error) {
        console.error(error);
    }
}

// --- YENİ KİTAP EKLEME ---
async function addBook(e) {
    e.preventDefault();
    const title = document.getElementById('title').value;
    const author = document.getElementById('author').value;
    const pageCount = document.getElementById('pageCount').value;
    const imageUrl = document.getElementById('imageUrl').value;

    // Sunucuya kaydet
    await fetch(`${API_URL}/books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, author, pageCount, imageUrl })
    });

    alert("✅ Kitap eklendi!");
    window.location.href = 'home.html';
}

// --- DÜZENLEME SAYFASINI DOLDURMA ---
async function loadEditPage() {
    checkAuth();
    // URL'den id parametresini al (?id=5 gibi)
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    // Sunucudan o kitabın bilgilerini çek
    const res = await fetch(`${API_URL}/books/${id}`);
    const book = await res.json();

    // Form alanlarını doldur
    document.getElementById('edit-id').value = book.id;
    document.getElementById('title').value = book.title;
    document.getElementById('author').value = book.author;
    document.getElementById('pageCount').value = book.pageCount;
    document.getElementById('imageUrl').value = book.imageUrl || '';
}

// --- GÜNCELLEME İŞLEMİ ---
async function updateBook(e) {
    e.preventDefault();
    const id = document.getElementById('edit-id').value;
    const title = document.getElementById('title').value;
    const author = document.getElementById('author').value;
    const pageCount = document.getElementById('pageCount').value;
    const imageUrl = document.getElementById('imageUrl').value;

    // Sunucuya güncellenmiş veriyi gönder (PUT)
    await fetch(`${API_URL}/books/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, author, pageCount, imageUrl })
    });

    alert("✅ Güncellendi!");
    window.location.href = 'home.html';
}

// --- SİLME İŞLEMİ ---
async function deleteBook(id) {
    if (confirm("Bu kitabı silmek istediğinize emin misiniz?")) {
        await fetch(`${API_URL}/books/${id}`, { method: 'DELETE' });
        loadBooks(); // Listeyi yenile (silinen gitsin)
    }
}