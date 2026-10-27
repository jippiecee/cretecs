// ========================================
// SUKSES PAGE - JavaScript
// ========================================

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    loadOrderData();
    createConfetti();
});

/**
 * Load order data from localStorage
 */
function loadOrderData() {
    const orderData = localStorage.getItem('currentOrder');
    
    if (!orderData) {
        // Redirect to home if no order data
        window.location.href = 'index.html';
        return;
    }
    
    const order = JSON.parse(orderData);
    
    // Update order ID
    document.getElementById('orderId').textContent = `#${order.orderId}`;
    
    // Update payment method
    updatePaymentMethod(order.paymentMethod);
    
    // Update customer info
    document.getElementById('customerName').textContent = order.customerName;
    document.getElementById('customerPhone').textContent = order.customerPhone;
    document.getElementById('shippingAddress').textContent = order.shippingAddress;
    
    // Format and update date
    const date = new Date(order.timestamp);
    const formattedDate = date.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    document.getElementById('orderDate').textContent = formattedDate;
    
    // Update total
    document.getElementById('totalAmount').textContent = formatPrice(order.total);
    
    // Render order items
    renderOrderItems(order.items);
}

/**
 * Update payment method display
 */
function updatePaymentMethod(method) {
    const methodNames = {
        'dana': 'DANA',
        'shopeepay': 'ShopeePay',
        'ovo': 'OVO'
    };
    
    const methodIcons = {
        'dana': '<i class="bi bi-wallet2"></i>',
        'shopeepay': '<i class="bi bi-shop"></i>',
        'ovo': '<i class="bi bi-credit-card"></i>'
    };
    
    const methodColors = {
        'dana': 'from-cyan-400 to-blue-500',
        'shopeepay': 'from-orange-400 to-pink-500',
        'ovo': 'from-purple-600 to-indigo-600'
    };
    
    const icon = document.getElementById('paymentIcon');
    const name = document.getElementById('paymentMethod');
    
    // Update icon
    icon.className = `w-8 h-8 bg-gradient-to-r ${methodColors[method]} rounded-full flex items-center justify-center`;
    icon.innerHTML = methodIcons[method];
    
    // Update name
    name.textContent = methodNames[method] || method;
}

/**
 * Render order items
 */
function renderOrderItems(items) {
    const container = document.getElementById('orderItems');
    
    if (!items || items.length === 0) {
        container.innerHTML = `
            <p class="text-gray-500 text-center py-4">Tidak ada item</p>
        `;
        return;
    }
    
    container.innerHTML = items.map(item => `
        <div class="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
            <div class="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                <img src="${item.image}" alt="${item.title}" class="w-full h-full object-cover">
            </div>
            <div class="flex-1 min-w-0">
                <h4 class="font-semibold text-gray-800 text-sm truncate">${item.title}</h4>
                <p class="text-gray-500 text-xs">${item.seller}</p>
                <div class="flex items-center justify-between mt-1">
                    <span class="text-gray-500 text-xs">Qty: ${item.quantity}</span>
                    <span class="font-bold text-primary">${formatPrice(item.price * item.quantity)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Format price to Indonesian Rupiah
 */
function formatPrice(price) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(price);
}

/**
 * Create confetti animation
 */
function createConfetti() {
    const container = document.getElementById('confettiContainer');
    const colors = ['#667eea', '#764ba2', '#f093fb', '#10b981', '#f59e0b', '#ef4444'];
    
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.bottom = '0';
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
        confetti.style.animation = `confetti ${1 + Math.random() * 2}s ease-out ${Math.random() * 0.5}s forwards`;
        container.appendChild(confetti);
    }
    
    // Clean up confetti after animation
    setTimeout(() => {
        container.innerHTML = '';
    }, 3000);
}

/**
 * Create additional celebration elements
 */
function celebrate() {
    // Create floating hearts
    for (let i = 0; i < 10; i++) {
        setTimeout(() => {
            const heart = document.createElement('div');
            heart.innerHTML = '❤️';
            heart.style.cssText = `
                position: fixed;
                left: ${Math.random() * 100}%;
                bottom: -50px;
                font-size: ${20 + Math.random() * 20}px;
                animation: floatUp ${3 + Math.random() * 2}s ease-out forwards;
                pointer-events: none;
                z-index: 1000;
            `;
            document.body.appendChild(heart);
            
            setTimeout(() => heart.remove(), 5000);
        }, i * 200);
    }
}

// Add floating animation for hearts
const style = document.createElement('style');
style.textContent = `
    @keyframes floatUp {
        0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
        }
        100% {
            transform: translateY(-100vh) rotate(${Math.random() * 360}deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Trigger celebration after page load
setTimeout(() => {
    celebrate();
}, 500);

// ========================================
// INITIALIZE ON LOAD
// ========================================

console.log('%c🎉 Cretects - Pembayaran Berhasil!', 'color: #10b981; font-size: 24px; font-weight: bold;');
console.log('%c✨ Thank you for your order!', 'color: #667eea; font-size: 14px;');
console.log('%c📦 Your order is being processed!', 'color: #f59e0b; font-size: 14px;');

