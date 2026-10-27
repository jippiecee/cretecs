// ========================================
// DATA STRUCTURE - READY FOR LOCALSTORAGE
// ========================================

// Sample products data - Minimal products for cleaner UI
const sampleProducts = [
    {
        id: 1,
        title: "Vintage Levi's 501 Jeans",
        category: "fashion",
        price: 450000,
        condition: "Excellent",
        image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&h=800&fit=crop",
        badge: "vintage",
        seller: "ThriftKing",
        rating: 4.9,
        description: "Original Levi's 501 dari tahun 90an, kondisi masih sangat bagus"
    },
    {
        id: 2,
        title: "Nike Air Jordan 1 Retro",
        category: "sneakers",
        price: 2500000,
        condition: "Like New",
        image: "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=600&h=800&fit=crop",
        badge: "new",
        seller: "SneakerHead",
        rating: 5.0,
        description: "Jordan 1 retro high, size 42, no box"
    },
    {
        id: 3,
        title: "Vintage Leather Jacket",
        category: "fashion",
        price: 850000,
        condition: "Very Good",
        image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&h=800&fit=crop",
        badge: "vintage",
        seller: "RetroStyle",
        rating: 4.8,
        description: "Jaket kulit asli, vintage vibes, size M"
    },
    {
        id: 4,
        title: "Casio G-Shock DW-5600",
        category: "accessories",
        price: 350000,
        condition: "Good",
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=800&fit=crop",
        badge: "sale",
        seller: "WatchCollector",
        rating: 4.7,
        description: "G-Shock klasik, kondisi normal, battery baru"
    },
    {
        id: 5,
        title: "Adidas Yeezy Boost 350",
        category: "sneakers",
        price: 1800000,
        condition: "Excellent",
        image: "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=600&h=800&fit=crop",
        badge: "new",
        seller: "KicksOnly",
        rating: 5.0,
        description: "Yeezy 350 v2, size 43, full tag"
    },
    {
        id: 6,
        title: "Supreme Box Logo Tee",
        category: "fashion",
        price: 950000,
        condition: "Like New",
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=800&fit=crop",
        badge: "new",
        seller: "Hypebeast",
        rating: 4.9,
        description: "Supreme tee authentic, size L, never worn"
    }
];

// ========================================
// STATE MANAGEMENT - FOUNDATION FOR LOCALSTORAGE
// ========================================

let currentProducts = [...sampleProducts];
let cart = []; // Nanti dari localStorage.getItem('cart')
let favorites = []; // Nanti dari localStorage.getItem('favorites')
let currentCategory = 'all';
let currentView = 'grid';

// ========================================
// UTILITY FUNCTIONS
// ========================================

// Format currency
function formatPrice(price) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(price);
}

// Get category icon
function getCategoryIcon(category) {
    const icons = {
        fashion: 'bi-bag-fill',
        sneakers: 'bi-lightning-fill',
        accessories: 'bi-watch',
        bags: 'bi-handbag-fill',
        vintage: 'bi-award-fill'
    };
    return icons[category] || 'bi-star-fill';
}

// Get condition color
function getConditionColor(condition) {
    const colors = {
        'Like New': '#10b981',
        'Excellent': '#10b981',
        'Very Good': '#3b82f6',
        'Good': '#f59e0b'
    };
    return colors[condition] || '#10b981';
}

// ========================================
// RENDER FUNCTIONS - ENHANCED
// ========================================

// Render products with enhanced animations
function renderProducts(products = currentProducts) {
    const grid = document.getElementById('productsGrid');
    
    if (products.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 80px 20px;">
                <i class="bi bi-inbox" style="font-size: 80px; color: var(--text-tertiary); opacity: 0.3; animation: emptyState 2s ease-in-out infinite;"></i>
                <p style="font-size: 20px; font-weight: 700; color: var(--text-secondary); margin-top: 20px;">
                    Produk tidak ditemukan
                </p>
                <p style="color: var(--text-tertiary);">Coba kategori atau pencarian lain</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = products.map(product => `
        <div class="product-card" data-id="${product.id}">
            <div class="product-image">
                <img src="${product.image}" alt="${product.title}" loading="lazy">
                ${product.badge ? `<div class="product-badge ${product.badge}">${product.badge}</div>` : ''}
                <div class="product-actions">
                    <button class="action-btn btn-favorite ${favorites.includes(product.id) ? 'active' : ''}" data-id="${product.id}" title="Tambah ke favorit">
                        <i class="bi bi-heart${favorites.includes(product.id) ? '-fill' : ''}"></i>
                    </button>
                    <button class="action-btn btn-quick-view" data-id="${product.id}" title="Quick view">
                        <i class="bi bi-eye-fill"></i>
                    </button>
                </div>
            </div>
            <div class="product-info">
                <div class="product-category">
                    <i class="${getCategoryIcon(product.category)}"></i>
                    ${product.category}
                </div>
                <h3 class="product-title">${product.title}</h3>
                <div class="product-seller">
                    <i class="bi bi-shop"></i>
                    ${product.seller}
                    <span class="seller-rating">
                        <i class="bi bi-star-fill"></i>
                        ${product.rating}
                    </span>
                </div>
                <div class="product-condition" style="color: ${getConditionColor(product.condition)}">
                    <i class="bi bi-check-circle-fill"></i>
                    ${product.condition}
                </div>
                <div class="product-footer">
                    <span class="product-price">${formatPrice(product.price)}</span>
                    <button class="btn-add-cart" data-id="${product.id}">
                        <i class="bi bi-cart-plus"></i>
                        Tambah
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    // Add staggered animation to cards
    document.querySelectorAll('.product-card').forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
    });
    
    attachProductEvents();
}

// ========================================
// EVENT HANDLERS - ENHANCED
// ========================================

// Attach events to product cards
function attachProductEvents() {
    // Add to cart with animation
    document.querySelectorAll('.btn-add-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            addToCart(id);
            
            // Animate button
            btn.style.transform = 'scale(0.85)';
            setTimeout(() => {
                btn.style.transform = '';
            }, 200);
        });
    });
    
    // Favorite button
    document.querySelectorAll('.btn-favorite').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            toggleFavorite(id);
        });
    });
    
    // Quick view
    document.querySelectorAll('.btn-quick-view').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            showQuickView(id);
        });
    });
    
    // Product card click
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = parseInt(card.dataset.id);
            showProductDetail(id);
        });
    });
}

// Add to cart function
function addToCart(productId) {
    const product = sampleProducts.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
        showNotification(`${product.title} ditambah (${existingItem.quantity}x) 🛒`);
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
        showNotification(`${product.title} ditambahkan ke keranjang! 🎉`);
    }
    
    updateCartBadge();
    saveCart();
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Load cart from localStorage
function loadCart() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartBadge();
        renderCartItems();
    }
}

// ========================================
// CHECKOUT FUNCTIONALITY - PEMBAYARAN
// ========================================

// Checkout function - redirect to pembayaran page
function checkout() {
    if (cart.length === 0) {
        showNotification('Keranjang kosong! Tambahkan produk terlebih dahulu 🛒', 'warning');
        return;
    }
    
    // Save cart to localStorage
    saveCart();
    
    // Calculate totals
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Show confirmation notification
    showNotification('Mengalihkan ke halaman pembayaran... 💳', 'info');
    
    // Redirect to pembayaran page after short delay
    setTimeout(() => {
        window.location.href = 'pembayaran.html';
    }, 1000);
}

// Proceed to payment from cart sidebar
function proceedToPayment() {
    checkout();
}

// Toggle favorite with enhanced animation
function toggleFavorite(productId) {
    const index = favorites.indexOf(productId);
    const product = sampleProducts.find(p => p.id === productId);
    
    if (index > -1) {
        favorites.splice(index, 1);
        showNotification(`${product.title} dihapus dari favorit`);
    } else {
        favorites.push(productId);
        showNotification(`${product.title} ditambahkan ke favorit! ❤️`);
        
        // Add floating heart animation
        createFloatingHearts();
    }
    
    renderProducts(getFilteredProducts());
    
    // Nanti: localStorage.setItem('favorites', JSON.stringify(favorites));
}

// Create floating hearts animation
function createFloatingHearts() {
    for (let i = 0; i < 5; i++) {
        const heart = document.createElement('div');
        heart.innerHTML = '❤️';
        heart.style.cssText = `
            position: fixed;
            left: ${Math.random() * window.innerWidth}px;
            bottom: -50px;
            font-size: ${20 + Math.random() * 20}px;
            animation: floatHeart ${2 + Math.random() * 2}s ease-out forwards;
            pointer-events: none;
            z-index: 10000;
        `;
        document.body.appendChild(heart);
        
        setTimeout(() => heart.remove(), 4000);
    }
}

// Update cart badge with animation
function updateCartBadge() {
    const badge = document.querySelector('.cart-badge');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    const oldValue = parseInt(badge.textContent) || 0;
    badge.textContent = totalItems;
    
    if (totalItems > 0) {
        badge.style.display = 'flex';
        
        // Animate if value changed
        if (oldValue !== totalItems) {
            badge.style.animation = 'none';
            setTimeout(() => {
                badge.style.animation = 'badgePop 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            }, 10);
        }
    } else {
        badge.style.display = 'none';
    }
}

// Enhanced notification system
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    
    const icons = {
        success: 'bi-check-circle-fill',
        error: 'bi-x-circle-fill',
        info: 'bi-info-circle-fill',
        warning: 'bi-exclamation-circle-fill'
    };
    
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#667eea',
        warning: '#f59e0b'
    };
    
    notification.innerHTML = `
        <i class="bi ${icons[type] || icons.success}"></i>
        <span>${message}</span>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 24px;
        background: var(--glass-bg);
        backdrop-filter: blur(20px);
        padding: 16px 24px;
        border-radius: 16px;
        box-shadow: var(--shadow-lg);
        border: 2px solid ${colors[type] || colors.success}40;
        display: flex;
        align-items: center;
        gap: 12px;
        font-weight: 600;
        color: var(--text-primary);
        z-index: 10000;
        animation: slideInRight 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        max-width: 400px;
    `;
    
    notification.querySelector('i').style.color = colors[type] || colors.success;
    
    document.body.appendChild(notification);
    
    // Remove after 3s with animation
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.4s ease';
        setTimeout(() => notification.remove(), 400);
    }, 3000);
}

// Quick view function (placeholder with better UX)
function showQuickView(productId) {
    const product = sampleProducts.find(p => p.id === productId);
    if (!product) return;
    
    showNotification(`Quick view: ${product.title} - Coming soon! 👀`, 'info');
}

// Product detail function (placeholder)
function showProductDetail(productId) {
    const product = sampleProducts.find(p => p.id === productId);
    if (!product) return;
    
    showNotification(`Detail produk coming soon! 📦`, 'info');
}

// ========================================
// FILTER & SEARCH - ENHANCED
// ========================================

// Filter by category with smooth transition
function filterByCategory(category) {
    currentCategory = category;
    
    // Update active category with animation
    document.querySelectorAll('.category-chip').forEach(chip => {
        chip.classList.remove('active');
        if (chip.dataset.category === category) {
            chip.classList.add('active');
        }
    });
    
    // Fade out current products
    const grid = document.getElementById('productsGrid');
    grid.style.opacity = '0';
    grid.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        renderProducts(getFilteredProducts());
        grid.style.opacity = '1';
        grid.style.transform = 'translateY(0)';
    }, 200);
}

// Get filtered products
function getFilteredProducts() {
    let filtered = [...sampleProducts];
    
    // Filter by category
    if (currentCategory !== 'all') {
        filtered = filtered.filter(p => p.category === currentCategory);
    }
    
    // Filter by search
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(p => 
            p.title.toLowerCase().includes(searchTerm) ||
            p.category.toLowerCase().includes(searchTerm) ||
            p.seller.toLowerCase().includes(searchTerm) ||
            p.description.toLowerCase().includes(searchTerm)
        );
    }
    
    return filtered;
}

// Search products with debounce
let searchTimeout;
function searchProducts(query) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const grid = document.getElementById('productsGrid');
        grid.style.transition = 'all 0.3s ease';
        grid.style.opacity = '0.5';
        
        setTimeout(() => {
            renderProducts(getFilteredProducts());
            grid.style.opacity = '1';
        }, 150);
    }, 300);
}

// ========================================
// CART SIDEBAR - ENHANCED
// ========================================

// Toggle cart sidebar with animation
function toggleCart() {
    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('overlay');
    
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
    
    // Prevent body scroll when cart is open
    if (sidebar.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
}

// Close cart
function closeCart() {
    document.getElementById('cartSidebar').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
    document.body.style.overflow = '';
}

// ========================================
// CART RENDER FUNCTIONS
// ========================================

// Render cart items in sidebar
function renderCartItems() {
    const cartItemsContainer = document.getElementById('cartItems');
    
    if (!cartItemsContainer) return;
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart">
                <div class="empty-cart-icon">
                    <i class="bi bi-cart3"></i>
                </div>
                <p>Keranjang masih kosong</p>
                <span>Yuk mulai belanja!</span>
                <button class="browse-btn" onclick="closeCart()">
                    <i class="bi bi-bag"></i>
                    Belanja Sekarang
                </button>
            </div>
        `;
        return;
    }
    
    cartItemsContainer.innerHTML = `
        <div class="cart-items-container">
            ${cart.map((item, index) => `
                <div class="cart-item" data-index="${index}">
                    <div class="cart-item-image">
                        <img src="${item.image}" alt="${item.title}" loading="lazy">
                    </div>
                    <div class="cart-item-details">
                        <h4 class="cart-item-title">${item.title}</h4>
                        <p class="cart-item-seller">${item.seller}</p>
                        <div class="cart-item-bottom">
                            <div class="cart-quantity">
                                <button class="qty-btn" onclick="updateQuantity(${index}, -1)">
                                    <i class="bi bi-dash"></i>
                                </button>
                                <span class="qty-value">${item.quantity}</span>
                                <button class="qty-btn" onclick="updateQuantity(${index}, 1)">
                                    <i class="bi bi-plus"></i>
                                </button>
                            </div>
                            <span class="cart-item-price">${formatPrice(item.price * item.quantity)}</span>
                        </div>
                    </div>
                    <button class="cart-item-remove" onclick="removeFromCart(${index})">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            `).join('')}
        </div>
    `;
}

// Update quantity from cart sidebar
function updateQuantity(index, change) {
    cart[index].quantity += change;
    
    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }
    
    saveCart();
    renderCartItems();
    updateCartTotals();
}

// Remove from cart
function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    renderCartItems();
    updateCartTotals();
    showNotification('Item dihapus dari keranjang 🗑️', 'info');
}

// Update cart totals in sidebar
function updateCartTotals() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const badge = document.querySelector('.cart-badge');
    const totalElement = document.querySelector('.total-price');
    const subtotalElement = document.querySelector('.subtotal .amount');
    const checkoutBtn = document.querySelector('.btn-checkout');
    
    // Update subtotal
    if (subtotalElement) {
        subtotalElement.textContent = formatPrice(total);
    }
    
    // Update total
    if (totalElement) {
        totalElement.textContent = formatPrice(total);
    }
    
    // Update badge
    if (badge) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        badge.textContent = totalItems;
        badge.style.display = totalItems > 0 ? 'flex' : 'none';
    }
    
    // Enable/disable checkout button
    if (checkoutBtn) {
        checkoutBtn.disabled = cart.length === 0;
    }
}

// ========================================
// SCROLL ANIMATIONS
// ========================================

// Animate elements on scroll
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    // Observe product cards
    document.querySelectorAll('.product-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        observer.observe(card);
    });
}

// ========================================
// PARALLAX EFFECT
// ========================================

function initParallax() {
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const parallaxElements = document.querySelectorAll('.hero-content');
        
        parallaxElements.forEach(el => {
            el.style.transform = `translateY(${scrolled * 0.3}px)`;
            el.style.opacity = 1 - (scrolled / 500);
        });
    });
}

// ========================================
// SMOOTH HOVER EFFECTS
// ========================================

function initHoverEffects() {
    // Smooth follow cursor effect for cards
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;
            
            card.style.transform = `
                perspective(1000px) 
                rotateX(${rotateX}deg) 
                rotateY(${rotateY}deg) 
                translateY(-8px) 
                scale(1.02)
            `;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });
}

// ========================================
// INITIALIZATION - ENHANCED
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // Render initial products
    renderProducts();
    
    // Load cart from localStorage - FIX LOCALSTORAGE
    loadCart();
    updateCartTotals();
    
    // Category filters
    document.querySelectorAll('.category-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            filterByCategory(chip.dataset.category);
        });
    });
    
    // Search with smooth animation
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchProducts(e.target.value);
        });
        
        // Add focus animations
        searchInput.addEventListener('focus', () => {
            searchInput.parentElement.style.transform = 'scale(1.02)';
        });
        
        searchInput.addEventListener('blur', () => {
            searchInput.parentElement.style.transform = '';
        });
    }
    
    // View toggle
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentView = btn.dataset.view;
            // Toggle grid/list view (nanti implementasi)
        });
    });
    
    // Cart button
    document.getElementById('cartBtn')?.addEventListener('click', toggleCart);
    document.getElementById('closeCart')?.addEventListener('click', closeCart);
    document.getElementById('overlay')?.addEventListener('click', closeCart);
    
    // Sell button (placeholder)
    document.getElementById('sellBtn')?.addEventListener('click', () => {
        showNotification('Fitur jual produk coming soon! 💼', 'info');
    });
    
    // User button (placeholder)
    document.getElementById('userBtn')?.addEventListener('click', () => {
        showNotification('Login/Register coming soon! 👤', 'info');
    });
    
    // Load more button with animation
    const loadMoreBtn = document.querySelector('.btn-load-more');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            loadMoreBtn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                loadMoreBtn.style.transform = '';
                showNotification('Semua produk sudah ditampilkan! ✨', 'info');
            }, 200);
        });
    }
    
    // Add dynamic CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
        
        @keyframes floatHeart {
            to {
                bottom: 100vh;
                opacity: 0;
                transform: translateX(${Math.random() * 100 - 50}px) rotate(${Math.random() * 360}deg);
            }
        }
        
        @keyframes emptyState {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        
        .product-seller {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            font-weight: 600;
            color: var(--text-tertiary);
            margin-bottom: 8px;
        }
        
        .product-seller i {
            font-size: 14px;
            color: var(--primary);
        }
        
        .seller-rating {
            margin-left: auto;
            display: flex;
            align-items: center;
            gap: 4px;
            color: var(--warning);
            font-weight: 700;
        }
        
        .seller-rating i {
            font-size: 12px;
        }
        
        .products-grid {
            transition: all 0.3s ease;
        }
    `;
    document.head.appendChild(style);
    
    // Initialize advanced features
    setTimeout(() => {
        initScrollAnimations();
        initParallax();
    }, 100);
    
    // Initialize cart badge and render items
    updateCartBadge();
    renderCartItems();
    
    // Welcome message
    console.log('%c🎉 Cretects - Thrift Shop Terpercaya', 'color: #667eea; font-size: 20px; font-weight: bold;');
    console.log('%c✨ UI Enhanced with smooth animations!', 'color: #10b981; font-size: 14px;');
    console.log('%c📦 Cart loaded from localStorage!', 'color: #f59e0b; font-size: 14px;');
    console.log('%cMade with ❤️ by @ERLAND', 'color: #764ba2; font-size: 14px; font-weight: bold;');
});

// ========================================
// KEYBOARD SHORTCUTS
// ========================================

// Add keyboard navigation
document.addEventListener('keydown', (e) => {
    // ESC to close cart
    if (e.key === 'Escape') {
        closeCart();
    }
    
    // Ctrl/Cmd + K for search focus
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('searchInput')?.focus();
    }
});

// ========================================
// PERFORMANCE OPTIMIZATIONS
// ========================================

// Lazy load images
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src || img.src;
                img.classList.add('loaded');
                imageObserver.unobserve(img);
            }
        });
    });
    
    document.querySelectorAll('.product-image img').forEach(img => {
        imageObserver.observe(img);
    });
}

// Debounce scroll events
let scrollTimeout;
window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        // Add scroll-based effects here
    }, 100);
}, { passive: true });

// ========================================
// LOCALSTORAGE FUNCTIONS (FOUNDATION)
// ========================================

// Nanti bisa uncomment untuk localStorage
/*
function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

function loadFromLocalStorage(key, defaultValue = []) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        return defaultValue;
    }
}

function initializeFromLocalStorage() {
    cart = loadFromLocalStorage('cart', []);
    favorites = loadFromLocalStorage('favorites', []);
    updateCartBadge();
    renderProducts();
}

// Auto-save to localStorage on changes
function autoSave() {
    saveToLocalStorage('cart', cart);
    saveToLocalStorage('favorites', favorites);
}
*/
// ========================================
// SELL MODAL FUNCTIONALITY
// ========================================

// Open sell modal
function openSellModal() {
    const modal = document.getElementById('sellModal');
    modal.classList.add('active');
    document.body.style.overaflow = 'hidden';
}

// Close sell modal
function closeSellModal() {
    const modal = document.getElementById('sellModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Contact admin - redirect to linktree
function contactAdmin() {
    // Redirect ke halaman linktree
    window.open('linktree.html', '_blank');
    closeSellModal();
}

// Event listener for sell button
document.getElementById('sellBtn').addEventListener('click', openSellModal);

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('sellModal');
    if (e.target === modal) {
        closeSellModal();
    }
});

// Close modal with ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeSellModal();
    }
});