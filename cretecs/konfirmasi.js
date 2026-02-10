// ========================================
// KONFIRMASI PAGE - JavaScript
// ========================================

// Configuration
const PHONE_NUMBER = '082261628284';

// ========================================
// STATE MANAGEMENT
// ========================================

let cart = [];
let selectedPaymentMethod = null;

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initializeCart();
    loadPaymentMethod();
    setupFormValidation();
});

/**
 * Initialize cart from localStorage
 */
function initializeCart() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
    renderCartItems();
    updateTotals();
}

/**
 * Load selected payment method from localStorage
 */
function loadPaymentMethod() {
    const method = localStorage.getItem('selectedPaymentMethod');
    if (method) {
        selectedPaymentMethod = method;
        updatePaymentMethodDisplay(method);
    } else {
        // Default to DANA if no method selected
        selectedPaymentMethod = 'dana';
        updatePaymentMethodDisplay('dana');
    }
}

/**
 * Update payment method display
 */
function updatePaymentMethodDisplay(method) {
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
    
    const card = document.getElementById('paymentMethodCard');
    const icon = document.getElementById('paymentIcon');
    const name = document.getElementById('paymentMethodName');
    
    // Update gradient
    card.className = `p-4 bg-gradient-to-r ${methodColors[method]} rounded-xl text-white transition-all duration-300`;
    
    // Update icon container color
    icon.className = `w-12 h-12 bg-white/20 rounded-full flex items-center justify-center`;
    icon.innerHTML = methodIcons[method];
    
    // Update name
    name.textContent = methodNames[method] || method;
}

/**
 * Render cart items
 */
function renderCartItems() {
    const cartItemsContainer = document.getElementById('cartItems');
    const emptyCartMessage = document.getElementById('emptyCart');
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '';
        emptyCartMessage.classList.remove('hidden');
        return;
    }
    
    emptyCartMessage.classList.add('hidden');
    
    cartItemsContainer.innerHTML = cart.map(item => `
        <div class="flex items-center gap-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <div class="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                <img src="${item.image}" alt="${item.title}" class="w-full h-full object-cover">
            </div>
            <div class="flex-1 min-w-0">
                <h4 class="font-semibold text-gray-800 text-sm truncate">${item.title}</h4>
                <p class="text-gray-500 text-xs">${item.seller}</p>
                <div class="flex items-center justify-between mt-2">
                    <span class="text-gray-500 text-xs">Qty: ${item.quantity}</span>
                    <span class="font-bold text-primary">${formatPrice(item.price * item.quantity)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Update totals
 */
function updateTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('totalAmount').textContent = formatPrice(subtotal);
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
 * Setup form validation
 */
function setupFormValidation() {
    const form = document.getElementById('confirmForm');
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        confirmPayment();
    });
}

/**
 * Validate form
 */
function validateForm() {
    const name = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const address = document.getElementById('shippingAddress').value.trim();
    
    if (!name) {
        showToast('warning', 'Peringatan', 'Masukkan nama lengkap!');
        document.getElementById('customerName').focus();
        return false;
    }
    
    if (!phone) {
        showToast('warning', 'Peringatan', 'Masukkan nomor WhatsApp!');
        document.getElementById('customerPhone').focus();
        return false;
    }
    
    if (!address) {
        showToast('warning', 'Peringatan', 'Masukkan alamat pengiriman!');
        document.getElementById('shippingAddress').focus();
        return false;
    }
    
    if (cart.length === 0) {
        showToast('warning', 'Peringatan', 'Keranjang kosong!');
        return false;
    }
    
    return true;
}

/**
 * Confirm payment
 */
function confirmPayment() {
    if (!validateForm()) {
        return;
    }
    
    // Show loading
    showLoading(true);
    
    // Generate order ID
    const orderId = generateOrderId();
    
    // Collect order data
    const orderData = {
        orderId: orderId,
        paymentMethod: selectedPaymentMethod,
        customerName: document.getElementById('customerName').value.trim(),
        customerPhone: document.getElementById('customerPhone').value.trim(),
        shippingAddress: document.getElementById('shippingAddress').value.trim(),
        items: cart,
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        timestamp: new Date().toISOString(),
        status: 'pending'
    };
    
    // Save order to localStorage
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.push(orderData);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Save current order for success page
    localStorage.setItem('currentOrder', JSON.stringify(orderData));
    
    // Clear cart
    localStorage.removeItem('cart');
    
    // Simulate processing delay
    setTimeout(() => {
        showLoading(false);
        
        // Redirect to success page
        window.location.href = 'sukses.html';
    }, 1500);
}

/**
 * Generate order ID
 */
function generateOrderId() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    return `ORD-${year}${month}${day}-${random}`;
}

/**
 * Go back to previous page
 */
function goBack() {
    window.history.back();
}

/**
 * Show loading overlay
 */
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    
    if (show) {
        overlay.classList.remove('hidden');
        overlay.classList.add('flex');
    } else {
        overlay.classList.add('hidden');
        overlay.classList.remove('flex');
    }
}

/**
 * Show toast notification
 */
function showToast(type, title, message) {
    const toast = document.createElement('div');
    
    const configs = {
        'success': { bg: '#dcfce7', color: '#16a34a', icon: 'bi-check-circle-fill' },
        'error': { bg: '#fee2e2', color: '#dc2626', icon: 'bi-x-circle-fill' },
        'warning': { bg: '#fef3c7', color: '#d97706', icon: 'bi-exclamation-circle-fill' },
        'info': { bg: '#dbeafe', color: '#2563eb', icon: 'bi-info-circle-fill' }
    };
    
    const config = configs[type] || configs.info;
    
    toast.className = 'fixed bottom-6 right-6 bg-white rounded-xl shadow-2xl p-4 flex items-center gap-3 transform translate-y-20 opacity-0 transition-all duration-300 z-50 border-l-4';
    toast.style.borderLeftColor = config.color;
    toast.innerHTML = `
        <div class="w-10 h-10 rounded-full flex items-center justify-center" style="background: ${config.bg}">
            <i class="bi ${config.icon}" style="color: ${config.color}"></i>
        </div>
        <div>
            <p class="font-bold text-gray-800">${title}</p>
            <p class="text-sm text-gray-500">${message}</p>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
        toast.classList.remove('translate-y-20', 'opacity-0');
    }, 10);
    
    // Auto hide
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ========================================
// EXPOSE FUNCTIONS TO WINDOW
// ========================================

window.goBack = goBack;
window.confirmPayment = confirmPayment;

// ========================================
// INITIALIZE ON LOAD
// ========================================

console.log('%c📋 Cretects Konfirmasi Page', 'color: #667eea; font-size: 20px; font-weight: bold;');
console.log('%c✨ Please confirm your order!', 'color: #10b981; font-size: 14px;');

