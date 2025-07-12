const eventContainer = document.getElementById('eventContainer');
const modal = document.getElementById('modal');
const paymentModal = document.getElementById('paymentModal');
const form = document.getElementById('ticketForm');
const cancelBtn = document.getElementById('cancelModal');
const cancelPaymentBtn = document.getElementById('cancelPayment');
const loaderOverlay = document.getElementById('loaderOverlay');
const loaderText = document.getElementById('loaderText');
const iframe = document.getElementById('pesapalIframe');
const quantityInput = document.getElementById('quantity');
const priceInfo = document.getElementById('priceInfo');
const email = document.getElementById('email').value.trim();
const incrementBtn = document.getElementById('increment');
const decrementBtn = document.getElementById('decrement');

let selectedEvent = null;
let currentUnitPrice = 0;

function updatePriceDisplay() {
  const qty = parseInt(quantityInput.value) || 1;
  const total = (currentUnitPrice * qty).toFixed(2);
  priceInfo.innerText = `Total: KES ${total}`;
}

// Fetch and render events
fetch('/api/events')
  .then(res => res.json())
  .then(data => {
    if (data.success && data.events.length) {
      data.events.forEach(event => {
        const price = parseFloat(event.price).toFixed(2);
        const card = document.createElement('div');
        card.className = 'event-card';
        card.innerHTML = `
          <h3>${event.title}</h3>
          <p><strong>Category:</strong> ${event.category}</p>
          <p><strong>Location:</strong> ${event.location}</p>
          <p><strong>Date:</strong> ${new Date(event.eventDate).toLocaleString()}</p>
          <p><strong>Price:</strong> KES ${price}</p>
          <button>Buy Ticket</button>
        `;

        card.querySelector('button').addEventListener('click', () => {
          selectedEvent = event;
          currentUnitPrice = parseFloat(event.price || 0);
          quantityInput.value = 1;
          updatePriceDisplay();
          modal.classList.remove('hidden');
        });

        eventContainer.appendChild(card);
      });
    } else {
      eventContainer.innerHTML = '<p style="color:#aaa;">No events found.</p>';
    }
  })
  .catch(err => {
    console.error('❌ Error fetching events:', err);
    eventContainer.innerHTML = '<p style="color:red;">Failed to load events.</p>';
  });

// Quantity controls
incrementBtn.onclick = () => {
  let val = parseInt(quantityInput.value);
  quantityInput.value = isNaN(val) ? 1 : val + 1;
  updatePriceDisplay();
};

decrementBtn.onclick = () => {
  let val = parseInt(quantityInput.value);
  quantityInput.value = val > 1 ? val - 1 : 1;
  updatePriceDisplay();
};

// Cancel modals
cancelBtn.onclick = () => modal.classList.add('hidden');
cancelPaymentBtn.onclick = () => {
  paymentModal.classList.add('hidden');
  loaderOverlay.classList.add('hidden');
  iframe.src = '';
};

// Submit form
form.onsubmit = async (e) => {
  e.preventDefault();

  const name = document.getElementById('customerName').value.trim();
  const phone = document.getElementById('phoneNumber').value.trim();
  const quantity = parseInt(quantityInput.value);

  if (!selectedEvent) return alert('No event selected.');
  if (!name.match(/^[A-Za-z ]{3,}$/)) return alert('Please enter a valid name.');
  if (!phone.match(/^07\d{8}$/)) return alert('Phone must be 07XXXXXXXX.');

  loaderText.innerText = 'Processing payment...';
  loaderOverlay.classList.remove('hidden');
  modal.classList.add('hidden');

  try {
    const res = await fetch('/api/tickets/make-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: selectedEvent.eventId,
        customerName: name,
        phoneNumber: phone,
        email,
        quantity
      })
    });

    const result = await res.json();

    if (result.success && result.redirectUrl) {
      setTimeout(() => {
        loaderOverlay.classList.add('hidden');
        iframe.src = result.redirectUrl;
        paymentModal.classList.remove('hidden');
      }, 1000);
    } else {
      loaderOverlay.classList.add('hidden');
      alert('Payment failed: ' + result.error);
    }
  } catch (err) {
    console.error('❌ Payment initiation error:', err);
    loaderOverlay.classList.add('hidden');
    alert('Something went wrong.');
  }
};
