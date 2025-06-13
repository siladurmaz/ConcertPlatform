// js/concerts.js

// Sayfalama için global değişkenler
let currentPage = 1;
const pageSize = 6; // Bir seferde yüklenecek konser sayısı (API'deki varsayılan pageSize ile aynı olmalı)
let isLoadingMore = false; // Birden fazla "daha fazla yükle" isteğini engellemek için
let currentFilters = { // Mevcut filtre ve sıralama durumunu saklamak için
    categoryId: '',
    searchTerm: '',
    sortBy: 'date',
    sortOrder: 'desc'
};

document.addEventListener('DOMContentLoaded', () => {
    const concertListDiv = document.getElementById('concertList');
    const concertDetailSection = document.getElementById('concertDetailSection');

    if (concertListDiv) { // Anasayfadaysak (index.html)
        initializeConcertListPage();
    } else if (concertDetailSection) { // Konser detay sayfasındaysak
        loadConcertDetail();
    }
});

function initializeConcertListPage() {
    const categoryFilterSelect = document.getElementById('categoryFilter');
    const searchTermInput = document.getElementById('searchTermInput');
    const sortBySelect = document.getElementById('sortBySelect');
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    const loadMoreBtn = document.getElementById('loadMoreBtn'); // "Daha Fazla Yükle" butonu

    // Filtreler değiştiğinde veya sayfa ilk yüklendiğinde burası çağrılacak
    function handleFilterOrSortChange() {
        currentPage = 1; // Sayfayı başa sar
        document.getElementById('concertList').innerHTML = ''; // Mevcut konserleri temizle
        currentFilters.categoryId = categoryFilterSelect?.value || "";
        currentFilters.searchTerm = searchTermInput?.value || "";
        const sortByValue = sortBySelect?.value || "date";
        const parts = sortByValue.split('_');
        currentFilters.sortBy = parts[0];
        if (parts.length > 1) {
            currentFilters.sortOrder = parts[1];
        } else if (currentFilters.sortBy === "date") {
            currentFilters.sortOrder = "desc";
        } else {
            currentFilters.sortOrder = "asc";
        }
        loadConcerts(); // Yeni filtrelerle ilk sayfayı yükle
    }

    loadCategoriesForFilterDropdown(); // İlk yüklemede kategorileri doldur
    handleFilterOrSortChange();      // Sayfa ilk yüklendiğinde konserleri yükle

    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', handleFilterOrSortChange);
    }

    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', () => {
            if (categoryFilterSelect) categoryFilterSelect.value = "";
            if (searchTermInput) searchTermInput.value = "";
            if (sortBySelect) sortBySelect.value = "date";
            handleFilterOrSortChange();
        });
    }

    if (searchTermInput) {
        searchTermInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                handleFilterOrSortChange();
            }
        });
    }

    // "Daha Fazla Yükle" butonu için event listener
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            if (!isLoadingMore) {
                currentPage++; // Bir sonraki sayfaya geç
                loadConcerts();  // Yeni sayfayı yükle
            }
        });
    }
}

// applyAllFiltersAndSorting fonksiyonu artık handleFilterOrSortChange içinde birleşti, bu yüzden kaldırılabilir
// veya handleFilterOrSortChange'in adı applyAllFiltersAndSorting olarak değiştirilebilir.
// Şimdilik handleFilterOrSortChange adını koruyalım.

// loadConcerts fonksiyonunu GÜNCELLE (sayfalama parametrelerini kullanacak şekilde)
async function loadConcerts() { // Fonksiyon imzası sadeleşti, global değişkenleri kullanacak
    const concertListDiv = document.getElementById('concertList');
    const loadMoreContainer = document.getElementById('loadMoreContainer'); // HTML'e eklediğimiz container
    const loadMoreBtn = document.getElementById('loadMoreBtn');

    if (!concertListDiv || isLoadingMore) return;

    isLoadingMore = true;
    if (currentPage === 1) { // Sadece ilk sayfa yüklenirken veya filtreler değiştiğinde
        concertListDiv.innerHTML = '<p class="loading-message">Konserler yükleniyor...</p>';
    }
    if (loadMoreBtn) loadMoreBtn.textContent = "Yükleniyor...";


    try {
        const params = new URLSearchParams();
        if (currentFilters.categoryId) params.append('categoryId', currentFilters.categoryId);
        if (currentFilters.searchTerm.trim()) params.append('searchTerm', currentFilters.searchTerm.trim());
        params.append('sortBy', currentFilters.sortBy);
        params.append('sortOrder', currentFilters.sortOrder);
        params.append('pageNumber', currentPage.toString()); // Mevcut sayfa numarasını gönder
        params.append('pageSize', pageSize.toString());     // Sabit sayfa boyutunu gönder

        const endpoint = `/api/concerts?${params.toString()}`;
        console.log("Requesting concerts with endpoint:", endpoint);

        const response = await fetchApi(endpoint);

        if (currentPage === 1 && response.ok) {
             // Eğer ilk sayfa yükleniyorsa ve istek başarılıysa, eski "yükleniyor" mesajını temizle
             // veya renderConcerts içinde zaten temizleniyor.
             // Eğer ilk yükleme değilse ve liste append ediliyorsa burası önemli.
             // "Daha Fazla Yükle" için, eski mesajları temizlemiyoruz.
        }
        if (concertListDiv.querySelector('.loading-message') && currentPage === 1) {
             concertListDiv.innerHTML = ''; // Sadece ilk yüklemede yükleniyor mesajını temizle
        }


        if (!response.ok) {
            const errorData = await response.text();
            console.error('Failed to load concerts:', response.status, errorData);
            if (currentPage === 1) concertListDiv.innerHTML = `<p class="error-message">Konserler yüklenirken bir hata oluştu. Durum: ${response.status}</p>`;
            if (loadMoreContainer) loadMoreContainer.style.display = 'none';
            return;
        }

        const newConcerts = await response.json(); // API artık PagedResult değil, doğrudan liste dönüyor

        if (newConcerts && newConcerts.length > 0) {
            renderConcerts(newConcerts, currentPage > 1); // append: true eğer daha fazla yükleniyorsa (yani currentPage > 1 ise)
            if (newConcerts.length < pageSize) { // Gelen konser sayısı pageSize'dan azsa, bu son sayfa demektir
                if (loadMoreContainer) loadMoreContainer.style.display = 'none'; // "Daha Fazla Yükle" butonunu gizle
            } else {
                if (loadMoreContainer) loadMoreContainer.style.display = 'block'; // Daha fazla olabilir, butonu göster
            }
        } else {
            if (currentPage === 1) { // İlk sayfada hiç sonuç yoksa
                concertListDiv.innerHTML = '<p class="no-concerts-message">Bu kriterlere uygun konser bulunamadı.</p>';
            }
            if (loadMoreContainer) loadMoreContainer.style.display = 'none'; // Daha fazla yüklenecek bir şey yok
        }
    } catch (error) {
        console.error('Error loading concerts:', error);
        if (currentPage === 1) concertListDiv.innerHTML = '<p class="error-message">Konserler yüklenirken bir hata oluştu.</p>';
    } finally {
        isLoadingMore = false;
        if(loadMoreBtn) loadMoreBtn.textContent = "Daha Fazla Yükle";
    }
}

// renderConcerts fonksiyonunu GÜNCELLE (append parametresi alacak şekilde)
function renderConcerts(concerts, append = false) {
    const concertListDiv = document.getElementById('concertList');
    if (!append) { // Eğer append false ise (ilk yükleme veya filtre/sıralama değişimi)
        concertListDiv.innerHTML = ''; // Önceki içerikleri temizle
    }

    concerts.forEach(concert => {
        const concertCard = document.createElement('div');
        concertCard.classList.add('concert-card');

        const eventDate = new Date(concert.date);
        const day = eventDate.toLocaleDateString('tr-TR', { day: '2-digit' });
        const month = eventDate.toLocaleDateString('tr-TR', { month: 'short' }).toUpperCase().replace('.', '');
        const dayName = eventDate.toLocaleDateString('tr-TR', { weekday: 'short' }).toUpperCase();
        const time = eventDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        const imageUrl = concert.imageUrl || 'https://dummyimage.com/400x250/222/fff.png&text=Konser';

        concertCard.innerHTML = `
            <div class="concert-card-image-container">
                <img src="${imageUrl}" alt="${concert.title}" class="concert-card-image">
                <div class="concert-card-date-badge">
                    <span class="day">${day}</span>
                    <span class="month-year">${month}</span>
                    <span class="month-year">${dayName}</span>
                    <span class="time">${time}</span>
                </div>
            </div>
            <div class="concert-card-info">
                <h3>${concert.title}</h3>
                <p class="artist-venue">${concert.artist} • ${concert.venue}</p>
                <p class="concert-card-price">Fiyat: <strong>${concert.price.toFixed(2)} TL</strong></p>
                <div class="concert-card-actions">
                    <button class="btn btn-details-card" onclick="viewConcertDetails(${concert.id})">DETAYLAR</button>
                    <button class="btn btn-buy-ticket-card" onclick="addTicketToCart(${concert.id})">BİLET AL</button>
                </div>
            </div>
        `;
        concertListDiv.appendChild(concertCard); // Her zaman appendChild ile ekle
    });
}


// --- Diğer Fonksiyonlar (Aynı Kalacak) ---
// viewConcertDetails, addTicketToCart, loadConcertDetail, renderConcertDetail, loadCategoriesForFilterDropdown
// Bu fonksiyonlar bir önceki versiyondaki gibi kalabilir.
// Sadece loadCategoriesForFilterDropdown'ı referans için tekrar ekliyorum:

async function loadCategoriesForFilterDropdown() {
    const categorySelect = document.getElementById('categoryFilter');
    if (!categorySelect) return;
    try {
        const response = await fetchApi('/api/concerts/categories');
        if (!response.ok) {
            console.error('Failed to load categories for filter dropdown. Status:', response.status);
            return;
        }
        const categoriesFromApi = await response.json();
        if (categoriesFromApi && categoriesFromApi.length > 0) {
            for (let i = categorySelect.options.length - 1; i >= 0; i--) {
                if (categorySelect.options[i].value !== "") { // "Tüm Kategoriler" seçeneğini koru
                    categorySelect.remove(i);
                }
            }
            categoriesFromApi.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categorySelect.appendChild(option);
            });
        } else {
            console.log('No categories found for filter dropdown.');
        }
    } catch (error) {
        console.error('Error loading categories for filter dropdown:', error);
    }
}

function viewConcertDetails(concertId) {
    window.location.href = `concert-detail.html?id=${concertId}`;
}

async function addTicketToCart(concertId) {
    if (!isLoggedIn()) {
        showGlobalMessage('Bilet alabilmek için lütfen giriş yapınız.', 'warning');
        // alert('Bilet alabilmek için lütfen giriş yapınız.');
        setTimeout(() => { window.location.href = 'login.html'; }, 2000);
        return;
    }
    try {
        const response = await fetchApi('/api/tickets', {
            method: 'POST',
            body: JSON.stringify({ concertId: concertId })
        });
        if (response.ok) {
            const ticketData = await response.json();
            showGlobalMessage(`"${ticketData.concertTitle}" konseri için biletiniz başarıyla oluşturuldu!`, 'success');
            // alert(`"${ticketData.concertTitle}" konseri için biletiniz başarıyla oluşturuldu!`);
            setTimeout(() => { window.location.href = 'my-tickets.html'; }, 2000);
            console.log('Ticket purchased:', ticketData);
        } else {
            const errorData = await response.json().catch(() => response.text());
            const errorMessage = errorData.message || errorData.title || errorData || response.statusText;
            showGlobalMessage(`Bilet alınırken bir hata oluştu: ${errorMessage}`, 'error');
            // alert(`Bilet alınırken bir hata oluştu: ${errorMessage}`);
            console.error('Failed to purchase ticket:', errorData);
        }
    } catch (error) {
        showGlobalMessage('Bilet alınırken bir ağ hatası oluştu. Lütfen tekrar deneyin.', 'error');
        // alert('Bilet alınırken bir ağ hatası oluştu. Lütfen tekrar deneyin.');
        console.error('Error purchasing ticket:', error);
    }
}

async function loadConcertDetail() {
    const concertDetailSection = document.getElementById('concertDetailSection');
    if (!concertDetailSection) return;
    const params = new URLSearchParams(window.location.search);
    const concertId = params.get('id');
    if (!concertId) {
        concertDetailSection.innerHTML = '<p class="error-message">Konser ID bulunamadı.</p>';
        return;
    }
    concertDetailSection.innerHTML = '<p class="loading-message">Konser detayları yükleniyor...</p>';
    try {
        const response = await fetchApi(`/api/concerts/${concertId}`);
        if (!response.ok) {
            const errorData = await response.text();
            console.error('Failed to load concert details:', response.status, errorData);
            concertDetailSection.innerHTML = `<p class="error-message">Konser detayları yüklenirken bir hata oluştu. Durum: ${response.status}</p>`;
            return;
        }
        const concert = await response.json();
        renderConcertDetail(concert);
    } catch (error) {
        console.error('Error loading concert details:', error);
        concertDetailSection.innerHTML = '<p class="error-message">Konser detayları yüklenirken bir hata oluştu. Lütfen konsolu kontrol edin.</p>';
    }
}

function renderConcertDetail(concert) {
    const concertDetailSection = document.getElementById('concertDetailSection');
    concertDetailSection.innerHTML = '';

    const eventDate = new Date(concert.date);
    const formattedDate = eventDate.toLocaleDateString('tr-TR', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    concertDetailSection.innerHTML = `
        <div class="concert-card">
            <div class="concert-image-container">
                <img src="${concert.imageUrl || 'img/default-concert.jpg'}" alt="${concert.title}" class="concert-image">
            </div>
            <div class="concert-info">
                <h2 class="concert-title">${concert.title}</h2>
                <p><strong>Sanatçı:</strong> ${concert.artist}</p>
                <p><strong>Tarih:</strong> ${formattedDate}</p>
                <p><strong>Mekan:</strong> ${concert.venue}</p>
                ${concert.categoryName ? `<p><strong>Kategori:</strong> ${concert.categoryName}</p>` : ''}
                <p class="concert-price"><strong>Fiyat:</strong> <span>${concert.price.toFixed(2)} TL</span></p>
                <button class="btn btn-primary" onclick="addTicketToCart(${concert.id})">Bu Konsere Bilet Al</button>
            </div>
        </div>
    `;
}