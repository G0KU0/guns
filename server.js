const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB csatlakozva'))
.catch(err => console.error('❌ MongoDB hiba:', err));

// User Schema
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        minlength: 3
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    displayName: {
        type: String,
        default: ''
    },
    bio: {
        type: String,
        default: ''
    },
    links: [{
        title: String,
        url: String,
        clicks: {
            type: Number,
            default: 0
        }
    }],
    views: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('User', userSchema);

// Auth Middleware
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: 'Nincs token!' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return res.status(401).json({ message: 'Érvénytelen token!' });
        }
        
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Hitelesítés sikertelen!' });
    }
};

// =====================================================
// AUTH ROUTES
// =====================================================

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, username, password } = req.body;
        
        // Check if user exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username: username.toLowerCase() }]
        });
        
        if (existingUser) {
            if (existingUser.email === email) {
                return res.status(400).json({ message: 'Ez az email cím már regisztrálva van!' });
            }
            return res.status(400).json({ message: 'Ez a felhasználónév már foglalt!' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
        const user = new User({
            email,
            username: username.toLowerCase(),
            password: hashedPassword,
            displayName: username
        });
        
        await user.save();
        
        // Generate token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );
        
        res.status(201).json({
            message: 'Sikeres regisztráció!',
            token,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                displayName: user.displayName,
                bio: user.bio,
                links: user.links,
                views: user.views
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Szerver hiba!' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Find user
        const user = await User.findOne({ username: username.toLowerCase() });
        
        if (!user) {
            return res.status(401).json({ message: 'Hibás felhasználónév vagy jelszó!' });
        }
        
        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Hibás felhasználónév vagy jelszó!' });
        }
        
        // Generate token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );
        
        res.json({
            message: 'Sikeres bejelentkezés!',
            token,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                displayName: user.displayName,
                bio: user.bio,
                links: user.links,
                views: user.views
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Szerver hiba!' });
    }
});

// Get current user
app.get('/api/auth/me', authMiddleware, async (req, res) => {
    res.json({
        user: {
            id: req.user._id,
            email: req.user.email,
            username: req.user.username,
            displayName: req.user.displayName,
            bio: req.user.bio,
            links: req.user.links,
            views: req.user.views
        }
    });
});

// =====================================================
// USER ROUTES
// =====================================================

// Update profile
app.put('/api/user/profile', authMiddleware, async (req, res) => {
    try {
        const { displayName, bio } = req.body;
        
        req.user.displayName = displayName || req.user.username;
        req.user.bio = bio || '';
        
        await req.user.save();
        
        res.json({
            message: 'Profil frissítve!',
            user: {
                id: req.user._id,
                email: req.user.email,
                username: req.user.username,
                displayName: req.user.displayName,
                bio: req.user.bio,
                links: req.user.links,
                views: req.user.views
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Szerver hiba!' });
    }
});

// =====================================================
// LINK ROUTES
// =====================================================

// Add link
app.post('/api/links', authMiddleware, async (req, res) => {
    try {
        const { title, url } = req.body;
        
        if (!title || !url) {
            return res.status(400).json({ message: 'Cím és URL megadása kötelező!' });
        }
        
        req.user.links.push({ title, url, clicks: 0 });
        await req.user.save();
        
        res.json({
            message: 'Link hozzáadva!',
            links: req.user.links
        });
    } catch (error) {
        console.error('Add link error:', error);
        res.status(500).json({ message: 'Szerver hiba!' });
    }
});

// Delete link
app.delete('/api/links/:index', authMiddleware, async (req, res) => {
    try {
        const index = parseInt(req.params.index);
        
        if (index < 0 || index >= req.user.links.length) {
            return res.status(400).json({ message: 'Érvénytelen index!' });
        }
        
        req.user.links.splice(index, 1);
        await req.user.save();
        
        res.json({
            message: 'Link törölve!',
            links: req.user.links
        });
    } catch (error) {
        console.error('Delete link error:', error);
        res.status(500).json({ message: 'Szerver hiba!' });
    }
});

// =====================================================
// PUBLIC PROFILE ROUTE
// =====================================================

// Get public profile
app.get('/api/profile/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username.toLowerCase() });
        
        if (!user) {
            return res.status(404).json({ message: 'Felhasználó nem található!' });
        }
        
        // Increment views
        user.views += 1;
        await user.save();
        
        res.json({
            username: user.username,
            displayName: user.displayName,
            bio: user.bio,
            links: user.links
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Szerver hiba!' });
    }
});

// =====================================================
// START SERVER
// =====================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Szerver fut a http://localhost:${PORT} címen`);
});
