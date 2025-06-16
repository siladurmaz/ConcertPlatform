// js/main.js

// API'nin base URL'i. API projen hangi portta çalışıyorsa onu yazmalısın.
const API_BASE_URL = 'http://localhost:5197'; // HTTP OLARAK AYARLI OLDUĞUNDAN EMİN OL

// JWT token'ını ve kullanıcı bilgilerini Local Storage'da saklamak için anahtarlar
const TOKEN_KEY = 'concert_platform_token';
const USER_INFO_KEY = 'concert_platform_user_info';

/**
 
 * @returns {string|null} Saklanmış token veya token yoksa null.
 */
function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

/**
 * Token'ı Local Storage'a kaydeder.
 * @param {string} token Kaydedilecek JWT token'ı.
 */
function saveToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Kullanıcı bilgilerini (username, role) Local Storage'a kaydeder.
 * @param {object} userInfo Kaydedilecek kullanıcı bilgileri objesi (örn: { username: 'admin', role: 'Admin' }).
 */
function saveUserInfo(userInfo) {
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
}

/**
 * Kullanıcı bilgilerini Local Storage'dan alır.
 * @returns {object|null} Saklanmış kullanıcı bilgileri objesi veya bilgi yoksa null.
 */
function getUserInfo() {
    const userInfoJson = localStorage.getItem(USER_INFO_KEY);
    return userInfoJson ? JSON.parse(userInfoJson) : null;
}

/**
 * Local Storage'dan token ve kullanıcı bilgilerini temizler (Logout işlemi için).
 */
function clearAuthData() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_INFO_KEY);
}

/**
 * Kullanıcının giriş yapıp yapmadığını kontrol eder.
 * @returns {boolean} Kullanıcı giriş yapmışsa true, aksi halde false.
 */
function isLoggedIn() {
    return !!getToken(); // Token varsa true, yoksa false döner
}

/**
 * Navigasyon barındaki linkleri ve kullanıcı bilgilerini günceller.
 */
function updateNav() {
    const loginNav = document.getElementById('loginNav');
    const registerNav = document.getElementById('registerNav');
    const userInfoNav = document.getElementById('userInfoNav');
    const logoutNav = document.getElementById('logoutNav');
    const myTicketsNav = document.getElementById('myTicketsNav');
    const adminConcertsNav = document.getElementById('adminConcertsNav'); // Admin linkini al

    if (isLoggedIn()) {
        const user = getUserInfo();
        if (loginNav) loginNav.style.display = 'none';
        if (registerNav) registerNav.style.display = 'none';

        if (userInfoNav && user) {
            userInfoNav.textContent = `Hoşgeldin, ${user.username} (${user.role})`;
            userInfoNav.style.display = 'inline';
        }
        if (logoutNav) logoutNav.style.display = 'inline';
        if (myTicketsNav) myTicketsNav.style.display = 'inline';

        // Admin linkini sadece Admin rolündeki kullanıcılar için göster
        if (adminConcertsNav) {
            if (user && user.role === 'Admin') {
                adminConcertsNav.style.display = 'inline';
            } else {
                adminConcertsNav.style.display = 'none';
            }
        }

    } else {
        if (loginNav) loginNav.style.display = 'inline';
        if (registerNav) registerNav.style.display = 'inline';

        if (userInfoNav) userInfoNav.style.display = 'none';
        if (logoutNav) logoutNav.style.display = 'none';
        if (myTicketsNav) myTicketsNav.style.display = 'none';
        if (adminConcertsNav) adminConcertsNav.style.display = 'none'; // Giriş yapılmamışsa admin linkini de gizle
    }
}

/**
 * Çıkış yapma işlemini gerçekleştirir.
 */
function handleLogout() {
    clearAuthData();
    updateNav();
    if (!window.location.pathname.endsWith('login.html') && !window.location.pathname.endsWith('register.html')) {
        window.location.href = 'login.html';
    }
}

/**
 * API'ye istek göndermek için genel bir yardımcı fonksiyon.
 */
async function fetchApi(endpoint, options = {}) {
    const token = getToken();
    const defaultHeaders = {
        'Content-Type': 'application/json',
    };

    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
    const headers = { ...defaultHeaders, ...options.headers };

    const requestUrl = `${API_BASE_URL}${endpoint}`;
    console.log('--- API Request ---');
    console.log('URL:', requestUrl);
    console.log('Method:', options.method || 'GET');
    if (options.body) {
        console.log('Body:', options.body);
    }
    console.log('Headers:', headers);
    console.log('--------------------');


    try {
        const response = await fetch(requestUrl, {
            ...options,
            headers: headers
        });

        console.log('--- API Response ---');
        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);
        console.log('---------------------');


        if (response.status === 401) {
            console.warn('Unauthorized request or token expired. Status:', response.status);
        }
        return response;
    } catch (error) {
        console.error('--- FETCH API FAILED ---');
        console.error('Error Name:', error.name);
        console.error('Error Message:', error.message);
        console.error('-------------------------');
        throw error;
    }
}

// Sayfa yüklendiğinde DOM tamamen hazır olduğunda çalışacak kodlar
document.addEventListener('DOMContentLoaded', () => {
    updateNav(); // Sayfa ilk yüklendiğinde navigasyonu ayarla.

    const logoutLink = document.getElementById('logoutNav');
    if (logoutLink) {
        logoutLink.addEventListener('click', (event) => {
            event.preventDefault();
            handleLogout();
        });
    }
});