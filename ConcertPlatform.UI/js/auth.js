// js/auth.js

document.addEventListener('DOMContentLoaded', () => {
    // Login Formu İşlemleri
    const loginForm = document.getElementById('loginForm');
    const loginMessageElement = document.getElementById('loginMessage');

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Formun varsayılan submit davranışını engelle

            const username = loginForm.username.value.trim();
            const password = loginForm.password.value; // Şifrede başta/sonda boşluk olabilir, trim yapmayalım.

            if (!username || !password) {
                displayMessage(loginMessageElement, 'Kullanıcı adı ve şifre boş bırakılamaz.', true);
                return;
            }
            hideMessage(loginMessageElement); // Önceki mesajları temizle

            try {
                const response = await fetchApi('/api/auth/login', { // fetchApi main.js'den geliyor
                    method: 'POST',
                    body: JSON.stringify({ username: username, password: password })
                });

                const responseData = await response.json();

                if (response.ok) {
                    saveToken(responseData.token); // main.js'den
                    saveUserInfo({ // main.js'den
                        username: responseData.username,
                        role: responseData.role
                    });
                    updateNav(); // main.js'den
                    window.location.href = 'index.html';
                } else {
                    const errorMessage = responseData.message || responseData.title || 'Kullanıcı adı veya şifre hatalı.';
                    displayMessage(loginMessageElement, errorMessage, true);
                    console.error('Login failed:', responseData);
                }
            } catch (error) {
                displayMessage(loginMessageElement, 'Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.', true);
                console.error('Login request error:', error);
            }
        });
    }

    // Register (Kayıt) Formu İşlemleri
    const registerForm = document.getElementById('registerForm');
    const registerMessageElement = document.getElementById('registerMessage');

    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const firstName = registerForm.firstName.value.trim();
            const lastName = registerForm.lastName.value.trim();
            const username = registerForm.username.value.trim();
            const password = registerForm.password.value;
            const confirmPassword = registerForm.confirmPassword.value;

            hideMessage(registerMessageElement); // Önceki mesajları temizle

            // Client-side validasyonlar
            if (!firstName || !lastName || !username || !password || !confirmPassword) {
                displayMessage(registerMessageElement, 'Lütfen tüm alanları doldurun.', true);
                return;
            }
            if (password !== confirmPassword) {
                displayMessage(registerMessageElement, 'Şifreler eşleşmiyor.', true);
                return;
            }
            // API'deki UserRegisterDto'daki şifre kurallarına benzer bir regex
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
            if (!passwordRegex.test(password)) {
                displayMessage(registerMessageElement, 'Şifre yeterince güçlü değil. En az 6 karakter olmalı, büyük/küçük harf, rakam ve özel karakter içermelidir.', true);
                return;
            }

            const registerDto = {
                firstName: firstName,
                lastName: lastName,
                username: username,
                password: password
            };

            try {
                const response = await fetchApi('/api/auth/register', { // fetchApi main.js'den geliyor
                    method: 'POST',
                    body: JSON.stringify(registerDto)
                });

                // API'den dönen yanıt JSON olmayabilir (örn: sadece metin bir mesaj "User registered successfully...")
                // Bu yüzden response.ok kontrolünden sonra responseData'yı okuyalım.
                if (response.ok) {
                    // Başarılı kayıt sonrası API'den gelen mesajı alalım (eğer varsa)
                    const responseData = await response.json().catch(async () => {
                        // JSON parse edilemezse metin olarak oku
                        const textResponse = await response.text();
                        return { message: textResponse || 'Kayıt başarılı! Lütfen giriş yapın.' };
                    });
                    displayMessage(registerMessageElement, responseData.message || 'Kayıt başarılı! Lütfen giriş yapın.', false);
                    setTimeout(() => {
                        window.location.href = 'login.html'; // Kayıt sonrası login'e yönlendir
                    }, 2500); // 2.5 saniye sonra
                } else {
                    // API'den hata mesajı geldi (örn: kullanıcı adı zaten var)
                    const errorData = await response.json().catch(async () => {
                         const textResponse = await response.text();
                         return { message: textResponse || `Sunucu hatası: ${response.status}` };
                    });
                    const errorMessage = errorData.message || errorData.title || errorData || 'Kayıt sırasında bir hata oluştu.';
                    displayMessage(registerMessageElement, errorMessage, true);
                    console.error('Registration failed:', response.status, errorData);
                }
            } catch (error) {
                displayMessage(registerMessageElement, 'Kayıt sırasında bir ağ hatası oluştu. Lütfen tekrar deneyin.', true);
                console.error('Registration request error:', error);
            }
        });
    }
});

/**
 * Belirtilen element içinde mesaj gösterir. (Genelleştirilmiş fonksiyon)
 * @param {HTMLElement} messageElement Mesajın gösterileceği HTML elementi.
 * @param {string} message Gösterilecek mesaj.
 * @param {boolean} isError Mesaj bir hata mesajı mı? (Stil için)
 */
function displayMessage(messageElement, message, isError) {
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.style.display = 'block';
        messageElement.className = 'message'; // Önceki stil class'larını temizle
        if (isError) {
            messageElement.classList.add('error-message');
        } else {
            messageElement.classList.add('success-message');
        }
    }
}

/**
 * Belirtilen elementteki mesajı gizler. (Genelleştirilmiş fonksiyon)
 * @param {HTMLElement} messageElement Mesajın gizleneceği HTML elementi.
 */
function hideMessage(messageElement) {
    if (messageElement) {
        messageElement.textContent = '';
        messageElement.style.display = 'none';
    }
}