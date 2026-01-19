// ===========================
// NEWS CHANNEL - FRONTEND
// ===========================

// Configuration
const BACKEND_URL = 'http://localhost:5000';
let currentPage = 1;
let currentCategory = 'general';
let currentSearch = '';
let allArticles = [];
let authToken = localStorage.getItem('authToken');
let currentUserId = localStorage.getItem('userId');

// Filter history for undo
let filterHistory = [];
let previousFilter = null;

// DOM Elements
const newsGrid = document.getElementById('newsGrid');
const loader = document.getElementById('loader');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const categoryBtns = document.querySelectorAll('.category-btn');
const continentBtns = document.querySelectorAll('.continent-btn');
const loadMoreBtn = document.getElementById('loadMoreBtn');

// Event Listeners
searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        categoryBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Save previous filter state
        previousFilter = {
            category: currentCategory,
            search: currentSearch
        };
        showUndoButton(true);
        
        currentCategory = btn.dataset.category;
        
        // Handle programming category (search-based)
        if (btn.dataset.search) {
            currentSearch = btn.dataset.search;
        } else {
            currentSearch = '';
        }
        
        currentPage = 1;
        fetchNews();
    });
});

continentBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        continentBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Save previous filter state
        previousFilter = {
            category: currentCategory,
            search: currentSearch
        };
        showUndoButton(true);
        
        const continent = btn.dataset.continent;
        
        // Map continents to search terms
        const continentMap = {
            'north-america': 'USA Canada Mexico',
            'south-america': 'Brazil Argentina Colombia',
            'europe': 'UK France Germany EU Europe',
            'africa': 'Africa Nigeria South Africa',
            'asia': 'India China Japan Asia',
            'oceania': 'Australia New Zealand'
        };
        
        currentSearch = continentMap[continent] || continent;
        currentPage = 1;
        fetchNews();
    });
});

loadMoreBtn.addEventListener('click', () => {
    currentPage++;
    fetchNews(true);
});

// Fetch News from Backend
async function fetchNews(loadMore = false) {
    try {
        if (!loadMore) {
            newsGrid.innerHTML = '';
            currentPage = 1;
        }

        showLoader(true);

        let url = `${BACKEND_URL}/api/news?page=${currentPage}`;
        
        if (currentSearch) {
            url += `&search=${encodeURIComponent(currentSearch)}`;
        } else {
            url += `&category=${currentCategory}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            showError('Error: ' + (data.error || 'Failed to fetch news'));
            showLoader(false);
            return;
        }

        allArticles = data.articles || [];
        displayNews(allArticles);
        showLoader(false);

    } catch (error) {
        console.error('Error fetching news:', error);
        showError('Failed to connect to backend. Make sure server is running on http://localhost:5000');
        showLoader(false);
    }
}

// Display News Articles
function displayNews(articles) {
    if (articles.length === 0) {
        newsGrid.innerHTML = '<div class="empty-state"><h2>No articles found</h2><p>Try a different search or category</p></div>';
        return;
    }

    articles.forEach(article => {
        if (!article.title || !article.urlToImage) return; // Skip incomplete articles

        const card = createNewsCard(article);
        newsGrid.appendChild(card);
    });
}

// Create News Card
function createNewsCard(article) {
    const card = document.createElement('div');
    card.className = 'news-card';

    const publishDate = new Date(article.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    let favoriteBtn = '';
    if (authToken) {
        favoriteBtn = `<button class="favorite-btn" onclick="toggleFavorite('${article.url}', '${article.title.replace(/'/g, "\\'")}', '${article.urlToImage}')">🤍 Save</button>`;
    }

    card.innerHTML = `
        <img src="${article.urlToImage}" alt="${article.title}" class="news-card-image" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22200%22%3E%3Crect fill=%22%23e9ecef%22 width=%22300%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22%3EImage not available%3C/text%3E%3C/svg%3E'">
        <div class="news-card-content">
            <span class="news-card-category">${article.source.name}</span>
            <h3 class="news-card-title">${article.title}</h3>
            <p class="news-card-description">${article.description || 'No description available'}</p>
            <div class="news-card-meta">
                <span>${publishDate}</span>
                <span class="news-card-source">${article.source.name}</span>
            </div>
            <div style="display: flex; gap: 10px; margin-top: 10px; align-items: center;">
                <a href="${article.url}" target="_blank" class="news-card-link">Read More →</a>
                <div class="share-dropdown">
                    <button class="share-btn" onclick="toggleShareMenu(this)">📤 Share</button>
                    <div class="share-menu" style="display: none;">
                        <a onclick="shareOnTwitter('${article.title.replace(/'/g, "\\'")}', '${article.url}')" class="share-option">𝕏 Twitter</a>
                        <a onclick="shareOnFacebook('${article.url}')" class="share-option">f Facebook</a>
                        <a onclick="shareOnWhatsApp('${article.title.replace(/'/g, "\\'")}', '${article.url}')" class="share-option">💬 WhatsApp</a>
                        <a onclick="shareViaEmail('${article.title.replace(/'/g, "\\'")}', '${article.url}')" class="share-option">✉️ Email</a>
                        <a onclick="copyToClipboard('${article.url}')" class="share-option">🔗 Copy Link</a>
                    </div>
                </div>
                ${favoriteBtn}
            </div>
        </div>
    `;

    return card;
}

// Search Handler
function handleSearch() {
    currentSearch = searchInput.value.trim();
    if (!currentSearch) {
        alert('Please enter a search term');
        return;
    }
    currentPage = 1;
    fetchNews();
}

// Authentication Functions
async function register(username, email, password) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userId', data.user.id);
            authToken = data.token;
            currentUserId = data.user.id;
            alert('Registration successful!');
            location.reload();
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        alert('Registration failed: ' + error.message);
    }
}

async function login(email, password) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userId', data.user.id);
            authToken = data.token;
            currentUserId = data.user.id;
            alert('Login successful!');
            location.reload();
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    authToken = null;
    currentUserId = null;
    alert('Logged out');
    location.reload();
}

// Favorites Functions
async function toggleFavorite(url, title, image) {
    if (!authToken) {
        alert('Please login to save favorites');
        return;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/api/favorites`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ 
                article_url: url, 
                article_title: title,
                article_image: image 
            })
        });

        if (response.ok) {
            alert('Article saved to favorites! ❤️');
        } else {
            const data = await response.json();
            alert(data.error || 'Failed to save');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Show/Hide Loader
function showLoader(show) {
    loader.classList.toggle('hidden', !show);
}

// Show Error Message
function showError(message) {
    newsGrid.innerHTML = `<div class="empty-state"><h2>⚠️ Error</h2><p>${message}</p></div>`;
}

// Weather Functions
async function requestWeatherLocation() {
    const permission = await navigator.permissions.query({ name: 'geolocation' });
    
    if (permission.state === 'granted') {
        getWeather();
    } else if (permission.state === 'prompt') {
        const userAllows = confirm('📍 Allow WORLD RADIO to access your location for weather?\n\nWe use this only to show local weather forecast.');
        if (userAllows) {
            getWeather();
        }
    } else {
        alert('📍 Location access denied. Please enable location in browser settings.');
    }
}

async function getWeather() {
    try {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    await fetchWeather(latitude, longitude);
                }, 
                (error) => {
                    console.log('Location error:', error.message);
                    document.getElementById('weatherInfo').innerHTML = `
                        <div style="padding: 20px; color: #666;">
                            <p>⚠️ Using default location</p>
                            <button onclick="getWeather()" style="padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; margin-top: 10px;">🔄 Try Again</button>
                        </div>
                    `;
                    fetchWeather(40.7128, -74.0060);
                },
                { timeout: 5000 }
            );
        } else {
            fetchWeather(40.7128, -74.0060);
        }
    } catch (error) {
        console.error('Weather error:', error);
    }
}

async function fetchWeather(lat, lon) {
    try {
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code&temperature_unit=fahrenheit`
        );
        
        if (!response.ok) throw new Error('Weather API error');
        
        const data = await response.json();
        const current = data.current;
        
        const geoResponse = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
        );
        const geoData = await geoResponse.json();
        const city = geoData.address?.city || geoData.address?.town || 'Your Location';
        
        const weatherDescMap = {
            0: 'Clear', 1: 'Mostly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
            45: 'Foggy', 48: 'Foggy', 51: 'Light Drizzle', 61: 'Rainy',
            71: 'Snowy', 80: 'Rainy', 95: 'Thunderstorm'
        };
        
        const weatherEmoji = {
            0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️',
            51: '🌧️', 61: '🌧️', 71: '❄️', 80: '⛈️', 95: '⛈️'
        };
        
        const code = current.weather_code;
        const temp = Math.round(current.temperature_2m);
        const humidity = current.relative_humidity_2m;
        
        document.getElementById('weatherInfo').innerHTML = `
            <div class="weather-widget">
                <h3>${city}</h3>
                <div style="font-size: 40px; margin: 10px 0;">${weatherEmoji[code] || '🌡️'}</div>
                <div class="weather-temp">${temp}°F</div>
                <div class="weather-desc">${weatherDescMap[code] || 'Clear'}</div>
                <div class="weather-details">
                    <p>💧 Humidity: ${humidity}%</p>
                    <p>📍 Updated: ${new Date().toLocaleTimeString()}</p>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Weather fetch error:', error);
        document.getElementById('weatherInfo').innerHTML = `
            <div style="padding: 20px; color: #666;">
                <p>⚠️ Weather unavailable</p>
                <button onclick="getWeather()" style="padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; margin-top: 10px;">🔄 Retry</button>
            </div>
        `;
    }
}

// Update Auth UI
function updateAuthUI() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const adminBtn = document.getElementById('adminBtn');
    
    if (authToken) {
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
        if (currentUserId) {
            adminBtn.style.display = 'block';
        }
    } else {
        loginBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
        adminBtn.style.display = 'none';
    }
}

// Initial Load
window.addEventListener('DOMContentLoaded', () => {
    console.log('Frontend loaded');
    updateAuthUI();
    fetchNews();
    if (authToken) {
        requestWeatherLocation();
    }
});

function goToLogin() {
    window.location.href = 'login.html';
}

function goToAdmin() {
    window.location.href = 'admin.html';
}

function goToAdminPanel() {
    window.location.href = 'admin.html';
}

function handleLogout() {
    logout();
}
// Undo Filter Function
function undoFilter() {
    if (previousFilter) {
        currentCategory = previousFilter.category;
        currentSearch = previousFilter.search;
        
        // Reset active buttons
        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.continent-btn').forEach(b => b.classList.remove('active'));
        
        // Set active based on restored state
        if (!previousFilter.search) {
            document.querySelector(`[data-category="${previousFilter.category}"]`)?.classList.add('active');
        }
        
        currentPage = 1;
        fetchNews();
        
        // Hide undo button
        showUndoButton(false);
        previousFilter = null;
    }
}

function showUndoButton(show) {
    const undoBtn = document.getElementById('undoBtn');
    if (undoBtn) {
        undoBtn.style.display = show ? 'block' : 'none';
    }
}

// Select News Channel
function selectChannel(channel) {
    // Save previous filter
    previousFilter = {
        category: currentCategory,
        search: currentSearch
    };
    showUndoButton(true);
    
    currentSearch = channel;
    currentPage = 1;
    fetchNews();
    alert(`📺 Showing articles from ${channel}`);
}

// Play Live Video
function playLiveVideo(channelName, videoId) {
    const container = document.getElementById('videoPlayerContainer');
    const player = document.getElementById('videoPlayer');
    const channelNameEl = document.getElementById('currentChannelName');
    
    // Set the video player iframe src for YouTube
    player.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    
    // Update the channel name
    channelNameEl.textContent = `📺 ${channelName} Live`;
    
    // Show the player
    container.style.display = 'block';
    
    // Scroll to the player
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Close Video Player
function closeVideoPlayer() {
    const container = document.getElementById('videoPlayerContainer');
    const player = document.getElementById('videoPlayer');
    
    player.src = '';
    container.style.display = 'none';
}

// Share Functions
function toggleShareMenu(button) {
    const menu = button.nextElementSibling;
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.share-dropdown')) {
            menu.style.display = 'none';
        }
    });
}

function shareOnTwitter(title, url) {
    const text = encodeURIComponent(`${title}\n${url}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'width=550,height=420');
}

function shareOnFacebook(url) {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'width=550,height=420');
}

function shareOnWhatsApp(title, url) {
    const text = encodeURIComponent(`${title}\n${url}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
}

function shareViaEmail(title, url) {
    const subject = encodeURIComponent(`Check out: ${title}`);
    const body = encodeURIComponent(`I found this interesting article:\n\n${title}\n\n${url}\n\nRead more at WORLD RADIO`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

function copyToClipboard(url) {
    navigator.clipboard.writeText(url).then(() => {
        alert('✅ Link copied to clipboard!');
    }).catch(() => {
        alert('Failed to copy link');
    });
}