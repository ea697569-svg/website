// ==========================================
// 1. DATA & STATE
// ==========================================
let cart = JSON.parse(localStorage.getItem('emmanuel_cart')) || [];
let discount = 0;
const SHIPPING_THRESHOLD = 50.00;
const DELIVERY_FEE = 5.00;
const MINIMUM_ORDER = 15.00;

// ==========================================
// 2. INITIALIZATION & ELEMENT SELECTORS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Selectors inside the loader to ensure elements exist
    const searchInput = document.getElementById('search-input');
    const voiceBtn = document.getElementById('voice-search-btn');
    const productCards = document.querySelectorAll('.product-card');

    // Initialize UI
    updateCartUI();
    
    // --- SEARCH LOGIC ---
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase().trim();
            productCards.forEach(card => {
                const title = card.querySelector('h3').innerText.toLowerCase();
                card.style.display = title.includes(term) ? "block" : "none";
            });
        });
    }

    // --- VOICE SEARCH LOGIC ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition && voiceBtn) {
        const recognition = new SpeechRecognition();
        voiceBtn.addEventListener('click', () => {
            recognition.start();
            voiceBtn.classList.add('listening');
        });
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            if (searchInput) {
                searchInput.value = transcript;
                searchInput.dispatchEvent(new Event('input')); // Trigger search
            }
            voiceBtn.classList.remove('listening');
        };
        recognition.onspeechend = () => {
            recognition.stop();
            voiceBtn.classList.remove('listening');
        };
    } else if (voiceBtn) {
        voiceBtn.style.display = 'none';
    }

    // --- CATEGORY FILTER LOGIC ---
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelector('.filter-btn.active')?.classList.remove('active');
            btn.classList.add('active');
            const filterValue = btn.getAttribute('data-filter');
            productCards.forEach(card => {
                const category = card.getAttribute('data-category');
                card.style.display = (filterValue === 'all' || filterValue === category) ? "block" : "none";
            });
        });
    });
});

// ==========================================
// 3. CART SYSTEM
// ==========================================
function toggleCart() {
    const sidebar = document.getElementById('cart-sidebar');
    if (sidebar) sidebar.classList.toggle('open');
}

function addToCart(name, price) {
    // Clean price if it comes as a string like "£29.00"
    const numericPrice = typeof price === 'string' ? parseFloat(price.replace(/[^0-9.]/g, '')) : price;
    
    const existing = cart.find(item => item.name === name);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ name, price: numericPrice, quantity: 1 });
    }
    saveAndRefresh();
    // Auto-open cart to show item was added
    document.getElementById('cart-sidebar').classList.add('open');
}

function changeQty(index, delta) {
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) cart.splice(index, 1);
    saveAndRefresh();
}

function saveAndRefresh() {
    localStorage.setItem('emmanuel_cart', JSON.stringify(cart));
    updateCartUI();
}

function updateCartUI() {
    const cartCount = document.getElementById('cart-count');
    const itemsContainer = document.getElementById('cart-items');
    const totalDisplay = document.getElementById('cart-total');

    if (!itemsContainer) return;

    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
    if (cartCount) cartCount.innerText = totalItems;

    itemsContainer.innerHTML = '';
    let subtotal = 0;

    if (cart.length === 0) {
        itemsContainer.innerHTML = '<div style="text-align:center; padding:50px; color:#888;"><p style="font-size:3rem;">🛒</p><p>Your cart is empty</p></div>';
        if (totalDisplay) totalDisplay.innerText = "0.00";
        return;
    }

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.style = "display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #eee;";
        div.innerHTML = `
            <div style="flex:1;">
                <strong>${item.name}</strong><br>
                <small>£${item.price.toFixed(2)}</small>
            </div>
            <div style="display:flex; align-items:center; gap:10px;">
                <button onclick="changeQty(${index}, -1)">-</button>
                <span>${item.quantity}</span>
                <button onclick="changeQty(${index}, 1)">+</button>
            </div>
            <div style="margin-left:15px; font-weight:bold;">£${itemTotal.toFixed(2)}</div>
        `;
        itemsContainer.appendChild(div);
    });

    const afterDiscount = subtotal * (1 - discount);
    const deliveryFee = (afterDiscount >= SHIPPING_THRESHOLD || afterDiscount === 0) ? 0 : DELIVERY_FEE;
    const finalTotal = afterDiscount + deliveryFee;

    // Summary Box
    const summary = document.createElement('div');
    summary.style = "margin-top:15px; background:#f9f9f9; padding:12px; border-radius:8px;";
    summary.innerHTML = `
        <div style="display:flex; justify-content:space-between;"><span>Subtotal:</span><span>£${subtotal.toFixed(2)}</span></div>
        <div style="display:flex; justify-content:space-between;"><span>Delivery:</span><span>${deliveryFee === 0 ? 'FREE' : '£' + deliveryFee.toFixed(2)}</span></div>
        <div style="display:flex; justify-content:space-between; font-weight:bold; border-top:1px solid #ddd; margin-top:5px; padding-top:5px;">
            <span>Total:</span><span>£${finalTotal.toFixed(2)}</span>
        </div>
    `;
    itemsContainer.appendChild(summary);
    if (totalDisplay) totalDisplay.innerText = finalTotal.toFixed(2);
}

// ==========================================
// 4. CHECKOUT & EXTERNAL SERVICES
// ==========================================
function goToOrderReview() {
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }
    // Generate Order ID for the tracking system
    const orderId = "ORD-" + Math.floor(1000 + Math.random() * 9000);
    localStorage.setItem('last_order_id', orderId);
    window.location.href = "payment.html";
}

function sendCartToWhatsApp() {
    const total = document.getElementById('cart-total').innerText;
    if (parseFloat(total) < MINIMUM_ORDER) return alert(`Minimum order is £${MINIMUM_ORDER}`);

    const phoneNumber = "447342344033";
    let message = "📦 *New Order from Emmanuel Store*\n";
    cart.forEach(item => {
        message += `- ${item.name} (x${item.quantity})\n`;
    });
    message += `*Total: £${total}*`;
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
}

// ==========================================
// 5. PAYMENT VALIDATION (Luhn Algorithm)
// ==========================================
function processPayment() {
    const cardNum = document.getElementById('card-number')?.value.replace(/\s+/g, '');
    if (!cardNum || !/^\d{13,19}$/.test(cardNum)) {
        alert("Please enter a valid card number.");
        return;
    }
    // Simple Luhn Check
    let sum = 0;
    for (let i = 0; i < cardNum.length; i++) {
        let digit = parseInt(cardNum.charAt(cardNum.length - 1 - i));
        if (i % 2 === 1) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }
        sum += digit;
    }
    if (sum % 10 === 0) {
        window.location.href = "success.html";
    } else {
        alert("Invalid card details. Please try again.");
    }
}

// ==========================================
// 6. UI HELPERS (FAQ, CHAT, SCROLL)
// ==========================================
function toggleChat() {
    const chat = document.getElementById('chat-window');
    if (chat) chat.style.display = (chat.style.display === "flex") ? "none" : "flex";
}

window.onscroll = () => {
    const btn = document.getElementById("backToTop");
    if (btn) btn.style.display = (window.scrollY > 300) ? "block" : "none";
};

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}


