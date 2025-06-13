// js/tickets.js

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('myTicketsList')) {
        loadMyTickets();
    }
});

async function loadMyTickets() {
    const myTicketsListDiv = document.getElementById('myTicketsList');
    if (!myTicketsListDiv) return;

    if (!isLoggedIn()) {
        myTicketsListDiv.innerHTML = '<p class="error-message">Biletlerinizi görmek için lütfen <a href="login.html">giriş yapınız</a>.</p>';
        return;
    }

    myTicketsListDiv.innerHTML = '<p class="loading-message">Biletleriniz yükleniyor...</p>';

    try {
        const response = await fetchApi('/api/tickets/my');

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Failed to load tickets:', response.status, errorData);
            myTicketsListDiv.innerHTML = `<p class="error-message">Biletler yüklenirken bir hata oluştu. Durum: ${response.status}</p>`;
            return;
        }

        const tickets = await response.json();

        if (tickets && tickets.length > 0) {
            renderMyTickets(tickets);
        } else {
            myTicketsListDiv.innerHTML = '<p class="no-concerts-message">Henüz satın alınmış biletiniz bulunmamaktadır.</p>';
        }
    } catch (error) {
        console.error('Error loading tickets:', error);
        myTicketsListDiv.innerHTML = '<p class="error-message">Biletler yüklenirken bir hata oluştu. Lütfen konsolu kontrol edin.</p>';
    }
}

function renderMyTickets(tickets) {
    const myTicketsListDiv = document.getElementById('myTicketsList');
    myTicketsListDiv.innerHTML = ''; // Önceki içerikleri temizle

    tickets.forEach(ticket => {
        const ticketItem = document.createElement('div');
        ticketItem.classList.add('ticket-item'); // Bu class'ı CSS'te güncelledik

        const concertDate = new Date(ticket.concertDate);
        const formattedConcertDate = concertDate.toLocaleDateString('tr-TR', {
            day: '2-digit', month: 'short', year: 'numeric' // Örn: 10 TEM 2021
        }).toUpperCase(); // Büyük harf yapalım
        const formattedConcertTime = concertDate.toLocaleTimeString('tr-TR', {
            hour: '2-digit', minute: '2-digit'
        });

        // Satın alma tarihi artık stub kısmında gösterilmiyor, istersen eklenebilir.
        // const purchaseDate = new Date(ticket.purchaseDate);
        // const formattedPurchaseDate = purchaseDate.toLocaleDateString('tr-TR', {
        //     year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        // });

        // Gate, Seat, Row gibi bilgiler API'den gelmiyorsa, bunları demo olarak ekleyebiliriz.
        const demoGate = "05";
        const demoSeat = "A15";
        const demoRow = "07";

        ticketItem.innerHTML = `
            <div class="ticket-main">
                <h3 class="ticket-title">${ticket.concertTitle || 'FESTIVAL TICKET'}</h3>
                <p class="ticket-subtitle">${ticket.concertVenue || 'NATIONAL STADIUM'}</p>
                
                <div class="ticket-details-grid">
                    <p><strong>SANATÇI:</strong> <span>${ticket.concertArtist || 'N/A'}</span></p>
                    <p><strong>TARİH:</strong> <span>${formattedConcertDate}</span></p>
                    <p><strong>SAAT:</strong> <span>${formattedConcertTime}</span></p>
                    <p><strong>MEKAN:</strong> <span>${ticket.concertVenue || 'N/A'}</span></p>
                    <p><strong>KAPI:</strong> <span>${demoGate}</span></p>
                    <p><strong>KOLTUK:</strong> <span>${demoSeat}</span></p>
                    <p><strong>SIRA:</strong> <span>${demoRow}</span></p>
                </div>

                <div class="barcode-area">
                    <div class="barcode-placeholder"></div>
                    <div class="ticket-id-label">#${String(ticket.id).padStart(7, '0')} / USER: ${ticket.username || 'N/A'}</div>
                </div>
            </div>
            <div class="ticket-stub">
                <div class="info-block">
                    <strong>FESTIVAL TICKET</strong>
                    <span>${ticket.concertVenue || 'NATIONAL STADIUM'}</span>
                </div>
                <div class="info-block">
                    <strong>TARİH / SAAT</strong>
                    <span>${formattedConcertDate} / ${formattedConcertTime}</span>
                </div>
                <div class="info-block">
                    <strong>GATE</strong> <span>${demoGate}</span>
                    <strong>SEAT</strong> <span>${demoSeat}</span>
                    <strong>ROW</strong> <span>${demoRow}</span>
                </div>
                <div class="barcode-area barcode-area-stub">
                    <div class="barcode-placeholder"></div>
                    <div class="ticket-id-label">#${String(ticket.id).padStart(7, '0')}</div>
                </div>
            </div>
        `;
        myTicketsListDiv.appendChild(ticketItem);
    });
}