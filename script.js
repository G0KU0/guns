// API Configuration
const API_URL = 'http://localhost:3000/api';

// Current User State
let currentUser = null;

// =====================================================
// INITIALIZATION
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

// Check if user is logged in
async function checkAuth() {
    const token = localStorage.getItem('auth_token');
    if (token) {
        try {
            const response = await fetch(`${API_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                currentUser = data.user;
                showDashboard();
            } else {
                localStorage.removeItem('auth_token');
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            localStorage.removeItem('auth_token');
        }
    }
}

// =====================================================
// AUTH FUNCTIONS
// =====================================================

async function register() {
    const email = document.getElementById('register-email').value.trim();
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;
    const passwordConfirm = document.getElementById('register-password-confirm').value;
    
    // Validation
    if (!email || !username || !password) {
        showNotification('Kérlek töltsd ki az összes mezőt!', 'error');
        return;
    }
    
    if (!email.includes('@')) {
        showNotification('Kérlek adj meg érvényes email címet!', 'error');
        return;
    }
    
    if (username.length < 3) {
        showNotification('A felhasználónév legalább 3 karakter legyen!', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('A jelszó legalább 6 karakter legyen!', 'error');
        return;
    }
    
    if (password !== passwordConfirm) {
        showNotification('A jelszavak nem egyeznek!', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('auth_token', data.token);
            currentUser = data.user;
            hideModal();
            showDashboard();
            showNotification('Sikeres regisztráció! Üdv a LinkHub-on!', 'success');
        } else {
            showNotification(data.message || 'Regisztráció sikertelen!', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Hálózati hiba történt!', 'error');
    }
}

async function login() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    
    if (!username || !password) {
        showNotification('Kérlek töltsd ki az összes mezőt!', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('auth_token', data.token);
            currentUser = data.user;
            hideModal();
            showDashboard();
            showNotification(`Üdv újra, ${data.user.displayName}!`, 'success');
        } else {
            showNotification(data.message || 'Bejelentkezés sikertelen!', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Hálózati hiba történt!', 'error');
    }
}

function logout() {
    localStorage.removeItem('auth_token');
    currentUser = null;
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('landing-page').classList.remove('hidden');
    document.getElementById('nav-buttons').style.display = 'flex';
    document.getElementById('nav-user').classList.add('hidden');
    showNotification('Sikeresen kijelentkeztél!', 'success');
}

// =====================================================
// DASHBOARD FUNCTIONS
// =====================================================

function showDashboard() {
    document.getElementById('landing-page').classList.add('hidden');
    document.getElementById('demo-view').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    document.getElementById('nav-buttons').style.display = 'none';
    document.getElementById('nav-user').classList.remove('hidden');
    
    updateDashboard();
}

function updateDashboard() {
    if (!currentUser) return;
    
    document.getElementById('nav-username').textContent = `@${currentUser.username}`;
    document.getElementById('profile-username').textContent = `@${currentUser.username}`;
    document.getElementById('profile-bio').textContent = currentUser.bio || 'Nincs még bio beállítva';
    document.getElementById('avatar-letter').textContent = currentUser.username[0].toUpperCase();
    document.getElementById('settings-displayname').value = currentUser.displayName || '';
    document.getElementById('settings-bio').value = currentUser.bio || '';
    
    renderLinks();
}

function renderLinks() {
    const container = document.getElementById('links-list');
    const links = currentUser.links || [];
    
    if (links.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                <i class="fas fa-link" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                <p>Még nincsenek linkjeid. Add hozzá az elsőt!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = links.map((link, index) => `
        <div class="link-item">
            <div class="link-icon ${getIconClass(link.url)}">
                <i class="${getIconForLink(link.url)}"></i>
            </div>
            <div class="link-content">
                <div class="link-title">${escapeHtml(link.title)}</div>
                <div class="link-url">${escapeHtml(link.url)}</div>
            </div>
            <button onclick="deleteLink(${index})" class="link-delete">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

function getIconForLink(url) {
    const lower = url.toLowerCase();
    if (lower.includes('instagram')) return 'fab fa-instagram';
    if (lower.includes('twitter') || lower.includes('x.com')) return 'fab fa-twitter';
    if (lower.includes('facebook')) return 'fab fa-facebook';
    if (lower.includes('youtube')) return 'fab fa-youtube';
    if (lower.includes('tiktok')) return 'fab fa-tiktok';
    if (lower.includes('discord')) return 'fab fa-discord';
    if (lower.includes('spotify')) return 'fab fa-spotify';
    if (lower.includes('twitch')) return 'fab fa-twitch';
    if (lower.includes('github')) return 'fab fa-github';
    if (lower.includes('linkedin')) return 'fab fa-linkedin';
    return 'fas fa-link';
}

function getIconClass(url) {
    const lower = url.toLowerCase();
    if (lower.includes('instagram')) return 'instagram';
    if (lower.includes('twitter') || lower.includes('x.com')) return 'twitter';
    if (lower.includes('discord')) return 'discord';
    if (lower.includes('youtube')) return 'youtube';
    if (lower.includes('github')) return 'github';
    if (lower.includes('spotify')) return 'spotify';
    return 'default';
}

async function addLink() {
    const title = document.getElementById('new-link-title').value.trim();
    const url = document.getElementById('new-link-url').value.trim();
    
    if (!title || !url) {
        showNotification('Kérlek add meg a címet és az URL-t!', 'error');
        return;
    }
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        showNotification('Az URL-nek http:// vagy https:// -sel kell kezdődnie!', 'error');
        return;
    }
    
    try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_URL}/links`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title, url })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser.links = data.links;
            document.getElementById('new-link-title').value = '';
            document.getElementById('new-link-url').value = '';
            renderLinks();
            showNotification('Link sikeresen hozzáadva!', 'success');
        } else {
            showNotification(data.message || 'Hiba történt!', 'error');
        }
    } catch (error) {
        console.error('Add link error:', error);
        showNotification('Hálózati hiba történt!', 'error');
    }
}

async function deleteLink(index) {
    try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_URL}/links/${index}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser.links = data.links;
            renderLinks();
            showNotification('Link törölve!', 'success');
        } else {
            showNotification(data.message || 'Hiba történt!', 'error');
        }
    } catch (error) {
        console.error('Delete link error:', error);
        showNotification('Hálózati hiba történt!', 'error');
    }
}

async function saveSettings() {
    const displayName = document.getElementById('settings-displayname').value.trim();
    const bio = document.getElementById('settings-bio').value.trim();
    
    try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_URL}/user/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ displayName, bio })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser.displayName = data.user.displayName;
            currentUser.bio = data.user.bio;
            updateDashboard();
            showNotification('Beállítások mentve!', 'success');
        } else {
            showNotification(data.message || 'Hiba történt!', 'error');
        }
    } catch (error) {
        console.error('Save settings error:', error);
        showNotification('Hálózati hiba történt!', 'error');
    }
}

function copyProfileLink() {
    const link = `${window.location.origin}/@${currentUser.username}`;
    navigator.clipboard.writeText(link);
    showNotification('Link másolva a vágólapra!', 'success');
}

function switchTab(tab) {
    document.getElementById('links-content').classList.toggle('hidden', tab !== 'links');
    document.getElementById('settings-content').classList.toggle('hidden', tab !== 'settings');
    
    document.getElementById('tab-links').classList.toggle('active', tab === 'links');
    document.getElementById('tab-settings').classList.toggle('active', tab === 'settings');
}

// =====================================================
// MODAL FUNCTIONS
// =====================================================

function showModal(type) {
    document.getElementById('auth-modal').classList.remove('hidden');
    document.getElementById('login-form').classList.toggle('hidden', type !== 'login');
    document.getElementById('register-form').classList.toggle('hidden', type !== 'register');
}

function hideModal() {
    document.getElementById('auth-modal').classList.add('hidden');
    // Clear inputs
    document.querySelectorAll('#auth-modal input').forEach(input => input.value = '');
}

// =====================================================
// DEMO FUNCTIONS
// =====================================================

function showDemo() {
    document.getElementById('landing-page').classList.add('hidden');
    document.getElementById('demo-view').classList.remove('hidden');
}

function hideDemo() {
    document.getElementById('demo-view').classList.add('hidden');
    document.getElementById('landing-page').classList.remove('hidden');
}

// =====================================================
// NOTIFICATION SYSTEM
// =====================================================

function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    const notification = document.createElement('div');
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };
    
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span>${escapeHtml(message)}</span>
    `;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        hideModal();
    }
});
