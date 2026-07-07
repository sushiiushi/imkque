const express = require('express');
const path = require('path');
const session = require('express-session');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'kunci_rahasia_perpus_fst',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.use(express.static(__dirname));

// --- DATA: USERS ---
const usersDatabase = [
    { 
        email: 'mahasiswa@uinjkt.ac.id', 
        password: 'password123', 
        role: 'mahasiswa',
        profile: { name: "Budi" },
        borrowingData: {
            counts: { terkirim: 1, disetujui: 1, ditolak: 1 },
            details: [
                { title: "Code Complete", statusText: "Sedang Berlangsung", statusClass: "status-blue", hasButton: false },
                { title: "The Mythical Man-Month", statusText: "Disetujui", statusClass: "status-green", hasButton: false },
                { title: "The Pragmatic Programmer", statusText: "Ditolak", statusClass: "status-red", redirectUrl: "riwtol.html", hasButton: true }
            ]
        },
        borrowedBooks: [
            { title: "The Mythical Man-Month", author: "Frederick P. Brooks, Jr.", returnDate: "12/06/2026" }
        ],
        pinnedBooks: [
            { title: "Clean Code", author: "Robert C. Martin", type: "available", deadline: "08/06/2026" },
            { title: "The Joy of X", author: "Steven H. Strogatz", type: "queued", queueNumber: 3 }
        ]
    },
    { email: 'admin@uinjkt.ac.id', password: 'admin123', role: 'admin' }
];

// --- DATA: BUKU (Katalog Baru) ---
const booksDatabase = [
    { id: 1, title: "The Mathematical Universe", author: "William Dunham", category: "Matematika", year: 1997, type: "Fisik", status: "available", cover: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1348379100i/359132.jpg" },
    { id: 2, title: "Journey Through Genius", author: "William Dunham", category: "Matematika", year: 1990, type: "Fisik", status: "borrowed", cover: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1348379100i/359132.jpg" },
    { id: 3, title: "Kalkulus Purcell Jilid 1", author: "Dale Varberg", category: "Matematika", year: 2019, type: "Fisik", status: "available", cover: "matematika.png" },
    { id: 4, title: "Clean Code", author: "Robert C. Martin", category: "Informatika", year: 2008, type: "Fisik", status: "available", cover: "informatika.png" }
];

// --- ENDPOINTS ---

// 1. Root & Auth
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const user = usersDatabase.find(u => u.email === email && u.password === password);
    if (!user) return res.status(401).json({ success: false, message: 'Email atau Kata Sandi salah!' });

    req.session.currentUser = { email: user.email, role: user.role };
    res.json({ success: true, redirectTo: user.role === 'admin' ? 'welpageadmin.html' : 'welpageuser.html' });
});

// 2. Dashboard Data
app.get('/api/dashboard-data', (req, res) => {
    if (!req.session.currentUser) return res.status(401).json({ message: 'Login diperlukan' });
    const fullUserData = usersDatabase.find(u => u.email === req.session.currentUser.email);
    res.json({
        user: fullUserData.profile,
        borrowingData: fullUserData.borrowingData,
        borrowedBooks: fullUserData.borrowedBooks,
        pinnedBooks: fullUserData.pinnedBooks
    });
});

// 3. API Katalog Buku (Digunakan untuk Halaman "Buku Perpustakaan")
app.get('/api/books-catalog', (req, res) => {
    if (!req.session.currentUser) return res.status(401).json({ message: 'Login diperlukan' });
    
    res.json({
        categories: [
            { name: "Matematika", image: "matematika.png" },
            { name: "Informatika", image: "informatika.png" }
            // Tambahkan kategori lain di sini
        ],
        books: booksDatabase,
        filters: {
            categories: [...new Set(booksDatabase.map(b => b.category))],
            authors: [...new Set(booksDatabase.map(b => b.author))],
            years: [...new Set(booksDatabase.map(b => b.year))],
            types: [...new Set(booksDatabase.map(b => b.type))]
        }
    });
});

// 4. API Filter Buku per Kategori (Digunakan untuk Halaman "Detail Kategori")
app.get('/api/books-by-category', (req, res) => {
    if (!req.session.currentUser) return res.status(401).json({ message: 'Login diperlukan' });
    const cat = req.query.category || "Matematika";
    res.json({
        categoryName: cat,
        books: booksDatabase.filter(b => b.category === cat)
    });
});

// 5. Logout
app.get('/api/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/index.html');
});

app.listen(PORT, () => console.log(`Server berjalan di http://localhost:${PORT}`));