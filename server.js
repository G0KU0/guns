require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3000;

// Adatbázis
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Csatlakoztatva'))
  .catch(err => console.error('❌ MongoDB Hiba:', err));

// Middleware
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

const requireLogin = (req, res, next) => {
    if (!req.session.userId) return res.redirect('/login');
    next();
};

// Útvonalak
app.get('/', (req, res) => res.render('index', { loggedIn: !!req.session.userId }));

app.get('/register', (req, res) => res.render('register'));
app.post('/register', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const newUser = new User({ username: req.body.username, password: hashedPassword });
        await newUser.save();
        req.session.userId = newUser._id;
        res.redirect('/dashboard');
    } catch (e) { res.send("Hiba: Foglalt felhasználónév vagy hibás adatok."); }
});

app.get('/login', (req, res) => res.render('login'));
app.post('/login', async (req, res) => {
    const user = await User.findOne({ username: req.body.username });
    if (user && await bcrypt.compare(req.body.password, user.password)) {
        req.session.userId = user._id;
        res.redirect('/dashboard');
    } else { res.send("Hibás adatok."); }
});

app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/'); });

// DASHBOARD (Szerkesztés és Mentés)
app.get('/dashboard', requireLogin, async (req, res) => {
    const user = await User.findById(req.session.userId);
    res.render('dashboard', { user });
});

app.post('/dashboard', requireLogin, async (req, res) => {
    // Minden új mező mentése
    await User.findByIdAndUpdate(req.session.userId, req.body);
    res.redirect('/dashboard');
});

// PROFIL (Publikus oldal)
app.get('/:username', async (req, res) => {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).send("User not found");
    user.views += 1;
    await user.save();
    res.render('profile', { user });
});

app.listen(PORT, () => console.log(`🚀 Szerver fut: http://localhost:${PORT}`));
