const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    // Belépési adatok
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    
    // Profil kinézet
    bio: { type: String, default: "Üdv a profilomon!" },
    avatarUrl: { type: String, default: "https://i.imgur.com/6VBx3io.png" }, // Alap kép
    backgroundUrl: { type: String, default: "https://i.imgur.com/M8PTk5o.jpg" }, // Alap háttér
    themeColor: { type: String, default: "#ffffff" }, // Szöveg színe
    
    // Social Média Linkek
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
