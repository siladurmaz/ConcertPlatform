// js/admin.js

document.addEventListener('DOMContentLoaded', () => {
    // updateNav(); // main.js zaten yapıyor, bu satıra gerek yok.

    checkAdminAuth(); // Yetki kontrolünü her admin sayfasında yap

    if (document.getElementById('adminConcertTableBody')) {
        // Admin konser listeleme sayfasındayız (admin-concerts.html)
        loadAdminConcerts();
    } else if (document.getElementById('concertForm')) {
        // Admin konser ekleme/düzenleme form sayfasındayız (admin-concert-form.html)
        initializeConcertForm();
        loadCategoriesForDropdown(); // Kategorileri dropdown için yükle
    }
});

function checkAdminAuth() {
    if (!isLoggedIn()) { // main.js'den
        alert('Bu sayfayı görüntülemek için giriş yapmalısınız.');
        window.location.href = 'login.html';
        return false;
    }
    const userInfo = getUserInfo(); // main.js'den
    if (!userInfo || userInfo.role !== 'Admin') {
        alert('Bu sayfayı görüntüleme yetkiniz yok.');
        window.location.href = 'index.html';
        return false;
    }
    return true;
}


async function loadAdminConcerts() {
    // if (!checkAdminAuth()) return; // Zaten DOMContentLoaded içinde çağrılıyor.

    const tableBody = document.getElementById('adminConcertTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="8" class="loading-message">Konserler yükleniyor...</td></tr>';

    try {
        const response = await fetchApi('/api/concerts'); // main.js'den

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to load concerts for admin:', response.status, errorText);
            tableBody.innerHTML = `<tr><td colspan="8" class="error-message">Konserler yüklenirken bir hata oluştu. Durum: ${response.status}</td></tr>`;
            return;
        }

        const concerts = await response.json();

        if (concerts && concerts.length > 0) {
            renderAdminConcerts(concerts);
        } else {
            tableBody.innerHTML = '<tr><td colspan="8" class="no-concerts-message">Yönetilecek konser bulunamadı.</td></tr>';
        }
    } catch (error) {
        console.error('Error loading concerts for admin:', error);
        tableBody.innerHTML = '<tr><td colspan="8" class="error-message">Konserler yüklenirken bir hata oluştu. Lütfen konsolu kontrol edin.</td></tr>';
    }
}

function renderAdminConcerts(concerts) {
    const tableBody = document.getElementById('adminConcertTableBody');
    tableBody.innerHTML = '';

    concerts.forEach(concert => {
        const row = tableBody.insertRow();

        const eventDate = new Date(concert.date);
        const formattedDate = eventDate.toLocaleDateString('tr-TR', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        row.insertCell().textContent = concert.id;
        row.insertCell().textContent = concert.title;
        row.insertCell().textContent = concert.artist;
        row.insertCell().textContent = formattedDate;
        row.insertCell().textContent = concert.venue;
        row.insertCell().textContent = `${concert.price.toFixed(2)} TL`;
        row.insertCell().textContent = concert.categoryName || '-';

        const actionsCell = row.insertCell();
        actionsCell.classList.add('actions-cell');
        // Dikkat: concert.title içindeki tırnak işaretleri HTML'i bozabilir, escape etmek gerekebilir.
        // Basitlik için şimdilik bırakıyorum ama production'da dikkat edilmeli.
        actionsCell.innerHTML = `
            <button class="btn btn-edit" onclick="editConcert(${concert.id})">Düzenle</button>
            <button class="btn btn-delete" onclick="confirmDeleteConcert(${concert.id}, '${escapeSingleQuotes(concert.title)}')">Sil</button>
        `;
    });
}

// HTML attribute'larında tek tırnak sorununu çözmek için yardımcı fonksiyon
function escapeSingleQuotes(str) {
    return str.replace(/'/g, "\\'");
}

function editConcert(concertId) {
    window.location.href = `admin-concert-form.html?id=${concertId}`;
    // console.log(`Edit concert ID: ${concertId}`); // Artık gerek yok
}

async function confirmDeleteConcert(concertId, concertTitle) {
    // if (!checkAdminAuth()) return; // Zaten butona tıklanınca bu sayfada olunacak

    // concertTitle'daki escape edilmiş tırnağı geri alalım (alert için)
    const unescapedTitle = concertTitle.replace(/\\'/g, "'");

    if (confirm(`"${unescapedTitle}" başlıklı konseri silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
        try {
            const response = await fetchApi(`/api/concerts/${concertId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                alert(`"${unescapedTitle}" konseri başarıyla silindi.`);
                loadAdminConcerts(); // Listeyi yenile
            } else {
                const errorData = await response.json().catch(() => ({ message: `Konser silinemedi. Sunucu hatası: ${response.status}` }));
                alert(`Konser silinirken bir hata oluştu: ${errorData.message || errorData.title || response.statusText}`);
                console.error('Failed to delete concert:', response.status, errorData);
            }
        } catch (error) {
            alert('Konser silinirken bir ağ hatası oluştu. Lütfen tekrar deneyin.');
            console.error('Error deleting concert:', error);
        }
    }
}


// --- YENİ EKLENEN KISIM: Kategori Yükleme ve Form İşlemleri ---

// js/admin.js içindeki loadCategoriesForDropdown fonksiyonunu GÜNCELLE

async function loadCategoriesForDropdown() {
    const categorySelect = document.getElementById('categoryId');
    if (!categorySelect) return;

    categorySelect.innerHTML = '<option value="">Kategoriler yükleniyor...</option>'; // Yükleniyor mesajı

    try {
        const response = await fetchApi('/api/concerts/categories'); // YENİ API ENDPOINT'İMİZ

        if (!response.ok) {
            console.error('Failed to load categories for dropdown. Status:', response.status);
            const errorText = await response.text();
            console.error('Error details:', errorText);
            categorySelect.innerHTML = '<option value="">Kategoriler yüklenemedi</option>';
            return;
        }

        const categoriesFromApi = await response.json();

        if (categoriesFromApi && categoriesFromApi.length > 0) {
            categorySelect.innerHTML = '<option value="">Kategori Seçiniz...</option>'; // Başlangıç seçeneği
            categoriesFromApi.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id; // API'den gelen 'id' (veya 'Id')
                option.textContent = category.name; // API'den gelen 'name' (veya 'Name')
                categorySelect.appendChild(option);
            });
        } else {
            categorySelect.innerHTML = '<option value="">Kategori bulunamadı</option>';
        }

    } catch (error) {
        console.error('Error loading categories for dropdown:', error);
        if(categorySelect) categorySelect.innerHTML = '<option value="">Kategoriler yüklenirken hata</option>';
    }
}
// async function initializeConcertForm() {
//     // if (!checkAdminAuth()) return; // Zaten DOMContentLoaded içinde çağrılıyor.

//     const form = document.getElementById('concertForm');
//     const formTitle = document.getElementById('formTitle');
//     const submitButton = document.getElementById('submitButton');
//     const concertIdInput = document.getElementById('concertId');

//     const params = new URLSearchParams(window.location.search);
//     const concertIdFromUrl = params.get('id');

//     if (concertIdFromUrl) {
//         // Düzenleme Modu
//         formTitle.textContent = 'Konseri Düzenle';
//         submitButton.textContent = 'Güncelle';
//         concertIdInput.value = concertIdFromUrl;

//         try {
//             const response = await fetchApi(`/api/concerts/${concertIdFromUrl}`);
//             if (response.ok) {
//                 const concert = await response.json();
//                 form.title.value = concert.title;
//                 form.artist.value = concert.artist;
//                 form.date.value = concert.date ? new Date(concert.date).toISOString().substring(0, 16) : '';
//                 form.venue.value = concert.venue;
//                 form.price.value = concert.price;
//                 form.categoryId.value = concert.categoryId || "";
//             } else {
//                 displayFormMessage('Konser bilgileri yüklenemedi.', true);
//                 console.error('Failed to load concert for editing:', response.status);
//             }
//         } catch (error) {
//             displayFormMessage('Konser bilgileri yüklenirken bir hata oluştu.', true);
//             console.error('Error loading concert for editing:', error);
//         }
//     } else {
//         // Ekleme Modu
//         formTitle.textContent = 'Yeni Konser Ekle';
//         submitButton.textContent = 'Kaydet';
//     }

//     form.addEventListener('submit', async (event) => {
//         event.preventDefault();
//         // if (!checkAdminAuth()) return; // Zaten butona tıklanınca bu sayfada olunacak

//         hideFormMessage();
//         const formData = {
//             title: form.title.value.trim(),
//             artist: form.artist.value.trim(),
//             date: form.date.value,
//             venue: form.venue.value.trim(),
//             price: parseFloat(form.price.value),
//             categoryId: form.categoryId.value ? parseInt(form.categoryId.value) : null,
//         };

//         // Basit validasyonlar
//         if (!formData.title || !formData.artist || !formData.date || !formData.venue || isNaN(formData.price) || formData.price <= 0) {
//             displayFormMessage('Lütfen tüm zorunlu alanları doğru bir şekilde doldurun.', true);
//             return;
//         }


//         let response;
//         let successMessage = '';
//         const currentConcertId = concertIdInput.value; // Formdaki gizli ID'yi kullan

//         try {
//             if (currentConcertId) { // Düzenleme için ID varsa
//                 response = await fetchApi(`/api/concerts/${currentConcertId}`, {
//                     method: 'PUT',
//                     body: JSON.stringify(formData)
//                 });
//                 successMessage = 'Konser başarıyla güncellendi!';
//             } else { // Ekleme için
//                 response = await fetchApi('/api/concerts', {
//                     method: 'POST',
//                     body: JSON.stringify(formData)
//                 });
//                 successMessage = 'Konser başarıyla eklendi!';
//             }

//             if (response.ok) {
//                 displayFormMessage(successMessage, false);
//                 setTimeout(() => {
//                     window.location.href = 'admin-concerts.html';
//                 }, 1500);
//             } else {
//                 const errorData = await response.json().catch(() => ({ message: `İşlem başarısız. Sunucu hatası: ${response.status}` }));
//                 displayFormMessage(`Hata: ${errorData.message || errorData.title || 'Bilinmeyen bir hata oluştu.'}`, true);
//                 console.error('Form submission error:', response.status, errorData);
//             }
//         } catch (error) {
//             displayFormMessage('İşlem sırasında bir ağ hatası oluştu.', true);
//             console.error('Form submission network error:', error);
//         }
//     });
// }
async function initializeConcertForm() {
    const form = document.getElementById('concertForm');
    const formTitle = document.getElementById('formTitle');
    const submitButton = document.getElementById('submitButton');
    const concertIdInput = document.getElementById('concertId');
    // ImageUrl input'unu al
    const imageUrlInput = document.getElementById('imageUrl');


    const params = new URLSearchParams(window.location.search);
    const concertIdFromUrl = params.get('id');

    if (concertIdFromUrl) {
        // Düzenleme Modu
        formTitle.textContent = 'Konseri Düzenle';
        submitButton.textContent = 'Güncelle';
        concertIdInput.value = concertIdFromUrl;

        try {
            const response = await fetchApi(`/api/concerts/${concertIdFromUrl}`);
            if (response.ok) {
                const concert = await response.json();
                form.title.value = concert.title;
                form.artist.value = concert.artist;
                form.date.value = concert.date ? new Date(concert.date).toISOString().substring(0, 16) : '';
                form.venue.value = concert.venue;
                form.price.value = concert.price;
                form.categoryId.value = concert.categoryId || "";
                if (imageUrlInput) imageUrlInput.value = concert.imageUrl || ""; // ImageUrl'i doldur
            } else {
                displayFormMessage('Konser bilgileri yüklenemedi.', true);
                console.error('Failed to load concert for editing:', response.status);
            }
        } catch (error) {
            displayFormMessage('Konser bilgileri yüklenirken bir hata oluştu.', true);
            console.error('Error loading concert for editing:', error);
        }
    } else {
        // Ekleme Modu
        formTitle.textContent = 'Yeni Konser Ekle';
        submitButton.textContent = 'Kaydet';
        if (imageUrlInput) imageUrlInput.value = ""; // Ekleme modunda boş olsun
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        hideFormMessage();

        const formData = {
            title: form.title.value.trim(),
            artist: form.artist.value.trim(),
            date: form.date.value,
            venue: form.venue.value.trim(),
            price: parseFloat(form.price.value),
            categoryId: form.categoryId.value ? parseInt(form.categoryId.value) : null,
            imageUrl: imageUrlInput ? imageUrlInput.value.trim() || null : null 
        };

        if (!formData.title || !formData.artist || !formData.date || !formData.venue || isNaN(formData.price) || formData.price <= 0) {
            displayFormMessage('Lütfen tüm zorunlu alanları (Başlık, Sanatçı, Tarih, Mekan, Fiyat) doğru bir şekilde doldurun.', true);
            return;
        }

        let response;
        let successMessage = '';
        const currentConcertId = concertIdInput.value;

        try {
            if (currentConcertId) {
                response = await fetchApi(`/api/concerts/${currentConcertId}`, {
                    method: 'PUT',
                    body: JSON.stringify(formData)
                });
                successMessage = 'Konser başarıyla güncellendi!';
            } else {
                response = await fetchApi('/api/concerts', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });
                successMessage = 'Konser başarıyla eklendi!';
            }

            if (response.ok) {
                displayFormMessage(successMessage, false);
                setTimeout(() => {
                    window.location.href = 'admin-concerts.html';
                }, 1500);
            } else {
                const errorData = await response.json().catch(() => ({ message: `İşlem başarısız. Sunucu hatası: ${response.status}` }));
                displayFormMessage(`Hata: ${errorData.message || errorData.title || 'Bilinmeyen bir hata oluştu.'}`, true);
                console.error('Form submission error:', response.status, errorData);
            }
        } catch (error) {
            displayFormMessage('İşlem sırasında bir ağ hatası oluştu.', true);
            console.error('Form submission network error:', error);
        }
    });
}
function displayFormMessage(message, isError) {
    const messageElement = document.getElementById('formMessage');
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.style.display = 'block';
        messageElement.className = 'message';
        if (isError) {
            messageElement.classList.add('error-message');
        } else {
            messageElement.classList.add('success-message');
        }
    }
}

function hideFormMessage() {
    const messageElement = document.getElementById('formMessage');
    if (messageElement) {
        messageElement.style.display = 'none';
        messageElement.textContent = '';
    }
}