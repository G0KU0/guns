const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    // Alapadatok
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    
    // Kinézet (Assets)
    bio: { type: String, default: "No bio yet." },
    avatarUrl: { type: String, default: "https://i.imgur.com/6VBx3io.png" },
    backgroundUrl: { type: String, default: "https://i.imgur.com/M8PTk5o.jpg" },
    themeColor: { type: String, default: "#ffffff" },
    
    // --- V3 ÚJ FUNKCIÓK ---
    musicUrl: { type: String, default: "" },          // Zene link (MP3)
    cursorUrl: { type: String, default: "" },         // Kurzor kép (PNG)
    clickToEnterText: { type: String, default: "Click to enter..." }, // Belépő szöveg
    
    // Social Linkek
    discord: { type: String, default: "" },
    instagram: { type: String, default: "" },
    tiktok: { type: String, default: "" },
    youtube: { type: String, default: "" },
    telegram: { type: String, default: "" },
    
    // Statisztika
    views: { type: Number, default: 0 },
    joinedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
