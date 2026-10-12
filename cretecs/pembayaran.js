// ========================================
// PEMBAYARAN PAGE - JavaScript
// ========================================

// Configuration
const PHONE_NUMBER = '082261628284';
const ADMIN_WA_LINK = 'https://wa.me/6282261628284';

// ========================================
// STATE MANAGEMENT
// ========================================

let cart = [];
let selectedPaymentMethod = null;
let orderId = null;

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initializeCart();
    initializePaymentMethods();
    initializeForm();
    initializeDropZone();
    generateOrderId();
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
 * Initialize payment method selection
 */
function initializePaymentMethods() {
    const paymentOptions = document.querySelectorAll('.payment-option');
    const transferInfo = document.getElementById('transferInfo');
    const continueBtn = document.getElementById('continueBtn');
    
    paymentOptions.forEach(option => {
        const radio = option.querySelector('input[type="radio"]');
        
        radio.addEventListener('change', function() {
            // Remove active class from all options
            paymentOptions.forEach(opt => {
                opt.querySelector('.payment-card').classList.remove('ring-4', 'ring-primary/30');
            });
            
            // Add active class to selected
            if (this.checked) {
                option.querySelector('.payment-card').classList.add('ring-4', 'ring-primary/30');
                selectedPaymentMethod = this.value;
                
                // Save to localStorage
                localStorage.setItem('selectedPaymentMethod', this.value);
                
                // Show transfer info
                transferInfo.classList.remove('hidden');
                transferInfo.classList.add('animate-fade-in');
                
                // Show continue button
                if (continueBtn) {
                    continueBtn.classList.remove('hidden');
                    continueBtn.classList.add('animate-slide-up');
                }
                
                showToast('success', 'Dipilih', `Metode pembayaran: ${getMethodName(this.value)}`);
            }
        });
    });
    
    // Continue button click handler
    if (continueBtn) {
        continueBtn.addEventListener('click', () => {
            if (selectedPaymentMethod) {
                window.location.href = 'konfirmasi.html';
            } else {
                showToast('warning', 'Peringatan', 'Pilih metode pembayaran terlebih dahulu!');
            }
        });
    }
}

/**
 * Get method name
 */
function getMethodName(method) {
    const names = {
        'dana': 'DANA',
        'shopeepay': 'ShopeePay',
        'ovo': 'OVO'
    };
    return names[method] || method;
}

/**
 * Go to konfirmasi page
 */
function goToKonfirmasi() {
    if (selectedPaymentMethod) {
        localStorage.setItem('selectedPaymentMethod', selectedPaymentMethod);
        window.location.href = 'konfirmasi.html';
    } else {
        showToast('warning', 'Peringatan', 'Pilih metode pembayaran terlebih dahulu!');
    }
}

/**
 * Initialize form submission
 */
function initializeForm() {
    const form = document.getElementById('paymentForm');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        // Show loading
        showLoading(true);
        
        // Simulate processing (replace with actual API call)
        await simulateProcessing();
        
        // Generate order ID
        orderId = generateOrderId();
        
        // Show success modal
        showLoading(false);
        showSuccessModal(orderId);
        
        // Clear cart after successful submission
        clearCart();
        
        // Log form data (for debugging)
        logFormData();
    });
}

/**
 * Initialize drag and drop for file upload
 */
function initializeDropZone() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('paymentProof');
    const uploadPlaceholder = document.getElementById('uploadPlaceholder');
    const previewContainer = document.getElementById('previewContainer');
    const previewImage = document.getElementById('previewImage');
    
    // Click to upload
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });
    
    // File input change
    fileInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            handleFileUpload(this.files[0]);
        }
    });
    
    // Drag enter
    dropZone.addEventListener('dragenter', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    
    // Drag over
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    
    // Drag leave
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });
    
    // Drop
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    });
}

/**
 * Handle file upload
 */
function handleFileUpload(file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showToast('error', 'Gagal', 'File harus berupa gambar!');
        return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
        showToast('error', 'Gagal', 'Ukuran file maksimal 5MB!');
        return;
    }
    
    // Read and display preview
    const reader = new FileReader();
    reader.onload = function(e) {
        const uploadPlaceholder = document.getElementById('uploadPlaceholder');
        const previewContainer = document.getElementById('previewContainer');
        const previewImage = document.getElementById('previewImage');
        
        previewImage.src = e.target.result;
        uploadPlaceholder.classList.add('hidden');
        previewContainer.classList.remove('hidden');
        previewContainer.classList.add('animate-fade-in');
        
        showToast('success', 'Berhasil', 'Bukti pembayaran berhasil diupload!');
    };
    reader.readAsDataURL(file);
}

/**
 * Remove uploaded image
 */
function removeImage() {
    const fileInput = document.getElementById('paymentProof');
    const uploadPlaceholder = document.getElementById('uploadPlaceholder');
    const previewContainer = document.getElementById('previewContainer');
    
    fileInput.value = '';
    uploadPlaceholder.classList.remove('hidden');
    previewContainer.classList.add('hidden');
}

// ========================================
// CART FUNCTIONS
// ========================================

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
    
    cartItemsContainer.innerHTML = cart.map((item, index) => `
        <div class="cart-item flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors" data-index="${index}">
            <div class="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                <img src="${item.image}" alt="${item.title}" class="w-full h-full object-cover">
            </div>
            <div class="flex-1 min-w-0">
                <h4 class="font-semibold text-gray-800 text-sm truncate">${item.title}</h4>
                <p class="text-xs text-gray-500 mb-2">${item.seller}</p>
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <button onclick="updateQuantity(${index}, -1)" class="qty-btn w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:text-primary">
                            <i class="bi bi-dash text-xs"></i>
                        </button>
                        <span class="font-medium text-sm w-6 text-center">${item.quantity}</span>
                        <button onclick="updateQuantity(${index}, 1)" class="qty-btn w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:text-primary">
                            <i class="bi bi-plus text-xs"></i>
                        </button>
                    </div>
                    <span class="font-bold text-primary">${formatPrice(item.price * item.quantity)}</span>
                </div>
            </div>
            <button onclick="removeFromCart(${index})" class="btn-remove p-2 text-gray-400 hover:text-red-500 transition-colors">
                <i class="bi bi-trash text-sm"></i>
            </button>
        </div>
    `).join('');
}

/**
 * Update quantity
 */
function updateQuantity(index, change) {
    cart[index].quantity += change;
    
    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }
    
    saveCart();
    renderCartItems();
    updateTotals();
}

/**
 * Remove from cart
 */
function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    renderCartItems();
    updateTotals();
    showToast('info', 'Dihapus', 'Item dihapus dari keranjang');
}

/**
 * Update totals
 */
function updateTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const adminFee = 0; // Free for manual payment
    
    document.getElementById('subtotal').textContent = formatPrice(subtotal);
    document.getElementById('adminFee').textContent = formatPrice(adminFee);
    document.getElementById('total').textContent = formatPrice(subtotal + adminFee);
}

/**
 * Save cart to localStorage
 */
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
}

/**
 * Clear cart
 */
function clearCart() {
    cart = [];
    saveCart();
    renderCartItems();
}

/**
 * Update cart badge
 */
function updateCartBadge() {
    // This would update the cart badge in header if needed
    // For now, we focus on the payment page
}

// ========================================
// FORM VALIDATION
// ========================================

/**
 * Validate form
 */
function validateForm() {
    // Check if payment method selected
    if (!selectedPaymentMethod) {
        showToast('warning', 'Peringatan', 'Pilih metode pembayaran terlebih dahulu!');
        document.getElementById('paymentMethods').scrollIntoView({ behavior: 'smooth' });
        return false;
    }
    
    // Check if cart is not empty
    if (cart.length === 0) {
        showToast('warning', 'Peringatan', 'Keranjang kosong! Tambahkan produk terlebih dahulu.');
        return false;
    }
    
    // Check sender name
    const senderName = document.getElementById('senderName').value.trim();
    if (!senderName) {
        showToast('warning', 'Peringatan', 'Masukkan nama pengirim!');
        document.getElementById('senderName').focus();
        return false;
    }
    
    // Check transfer amount
    const transferAmount = document.getElementById('transferAmount').value;
    if (!transferAmount || parseInt(transferAmount) <= 0) {
        showToast('warning', 'Peringatan', 'Masukkan nominal transfer!');
        document.getElementById('transferAmount').focus();
        return false;
    }
    
    // Check payment proof
    const paymentProof = document.getElementById('paymentProof').files[0];
    if (!paymentProof) {
        showToast('warning', 'Peringatan', 'Upload bukti transfer!');
        document.getElementById('dropZone').focus();
        return false;
    }
    
    return true;
}

/**
 * Update submit button based on payment method
 */
function updateSubmitButton() {
    const btn = document.getElementById('submitBtn');
    const methodNames = {
        'dana': 'DANA',
        'shopeepay': 'ShopeePay',
        'ovo': 'OVO'
    };
    
    if (selectedPaymentMethod) {
        btn.innerHTML = `<i class="bi bi-send-check mr-2"></i>Bayar via ${methodNames[selectedPaymentMethod]}`;
    } else {
        btn.innerHTML = `<i class="bi bi-send-check mr-2"></i>Konfirmasi Pembayaran`;
    }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

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
 * Copy phone number
 */
function copyNumber() {
    const number = PHONE_NUMBER.replace(/\s/g, '');
    
    navigator.clipboard.writeText(number).then(() => {
        showToast('success', 'Berhasil', 'Nomor disalin ke clipboard!');
        
        // Visual feedback
        const btn = event.currentTarget;
        btn.classList.add('copied');
        btn.innerHTML = '<i class="bi bi-check"></i>';
        
        setTimeout(() => {
            btn.classList.remove('copied');
            btn.innerHTML = '<i class="bi bi-copy"></i>';
        }, 1500);
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = number;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        showToast('success', 'Berhasil', 'Nomor disalin ke clipboard!');
    });
}

/**
 * Simulate processing
 */
function simulateProcessing() {
    return new Promise(resolve => {
        setTimeout(resolve, 2000);
    });
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
 * Show success modal
 */
function showSuccessModal(id) {
    const modal = document.getElementById('successModal');
    const orderIdElement = document.getElementById('orderId');
    
    orderIdElement.textContent = `#${id}`;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    modal.classList.add('active');
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
}

/**
 * Close success modal
 */
function closeSuccessModal() {
    const modal = document.getElementById('successModal');
    
    modal.classList.remove('active');
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }, 300);
    
    // Restore body scroll
    document.body.style.overflow = '';
}

/**
 * Show toast notification
 */
function showToast(type, title, message) {
    const toast = document.getElementById('toast');
    const toastIcon = document.getElementById('toastIcon');
    const toastTitle = document.getElementById('toastTitle');
    const toastMessage = document.getElementById('toastMessage');
    
    // Set content
    toastTitle.textContent = title;
    toastMessage.textContent = message;
    
    // Set icon and colors based on type
    const icons = {
        'success': { icon: 'bi-check-circle-fill', bg: '#dcfce7', color: '#16a34a' },
        'error': { icon: 'bi-x-circle-fill', bg: '#fee2e2', color: '#dc2626' },
        'warning': { icon: 'bi-exclamation-circle-fill', bg: '#fef3c7', color: '#d97706' },
        'info': { icon: 'bi-info-circle-fill', bg: '#dbeafe', color: '#2563eb' }
    };
    
    const config = icons[type] || icons.info;
    
    toastIcon.innerHTML = `<i class="bi ${config.icon}" style="color: ${config.color};"></i>`;
    toast.style.borderLeftColor = config.color;
    
    // Show toast
    toast.classList.add('show');
    
    // Auto hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

/**
 * Log form data (for debugging)
 */
function logFormData() {
    const formData = {
        orderId: orderId,
        paymentMethod: selectedPaymentMethod,
        phoneNumber: PHONE_NUMBER,
        senderName: document.getElementById('senderName').value,
        senderPhone: document.getElementById('senderPhone').value,
        transferAmount: document.getElementById('transferAmount').value,
        notes: document.getElementById('notes').value,
        cart: cart,
        timestamp: new Date().toISOString()
    };
    
    console.log('📦 Order Submitted:', formData);
    console.log('🛒 Cart:', cart);
    console.log('💰 Total:', formatPrice(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)));
    
    // In production, you would send this data to your server
    // Example: sendToServer(formData);
}

/**
 * Send data to server (placeholder)
 */
async function sendToServer(data) {
    try {
        const response = await fetch('/api/payment-confirmation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Failed to send data');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error sending data:', error);
        throw error;
    }
}

// ========================================
// EXPOSE FUNCTIONS TO WINDOW
// ========================================

window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.removeImage = removeImage;
window.copyNumber = copyNumber;
window.closeSuccessModal = closeSuccessModal;
window.goToKonfirmasi = goToKonfirmasi;

// ========================================
// KEYBOARD SHORTCUTS
// ========================================

document.addEventListener('keydown', (e) => {
    // ESC to close modal
    if (e.key === 'Escape') {
        closeSuccessModal();
    }
});

// ========================================
// INITIALIZE ON LOAD
// ========================================

// Add loading state tracking
let isSubmitting = false;

// ========================================
// OFFLINE SUPPORT (OPTIONAL)
// ========================================

// Check if cart exists in localStorage, if not initialize empty
if (!localStorage.getItem('cart')) {
    localStorage.setItem('cart', '[]');
}

// Console welcome message
console.log('%c🏪 Cretects Payment System', 'color: #667eea; font-size: 20px; font-weight: bold;');
console.log('%c✨ Payment page loaded successfully!', 'color: #10b981; font-size: 14px;');
console.log('%c📝 Fill in the form and submit to confirm payment', 'color: #f59e0b; font-size: 14px;');

