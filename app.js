// Brew & Bloom Cafe - Interactive Functionality

// 1. Menu Data
let menuItems = [];

// 2. Global App State
let cart = [];
let selectedTable = null;
let currentReviewIndex = 0;

// 3. DOM Elements Cache
const elements = {
    body: document.body,
    header: document.getElementById('header'),
    themeToggleBtn: document.getElementById('theme-toggle'),
    themeIcon: document.querySelector('#theme-toggle i'),
    hamburger: document.getElementById('hamburger'),
    navMenu: document.getElementById('nav-menu'),
    menuGrid: document.getElementById('menu-grid'),
    searchField: document.getElementById('search-input'),
    categoryButtons: document.querySelectorAll('.category-btn'),
    cartBtn: document.getElementById('cart-btn'),
    cartDrawer: document.getElementById('cart-drawer'),
    cartDrawerOverlay: document.getElementById('cart-overlay'),
    cartCloseBtn: document.getElementById('cart-close'),
    cartCountBadge: document.querySelector('.cart-count'),
    cartItemsContainer: document.getElementById('cart-items'),
    cartTotalPrice: document.getElementById('cart-total-price'),
    checkoutBtn: document.getElementById('checkout-btn'),
    tableNodes: document.querySelectorAll('.table-node'),
    reservationForm: document.getElementById('reservation-form'),
    reservationModal: document.getElementById('reservation-modal'),
    modalDetails: document.getElementById('modal-details'),
    closeModalBtn: document.getElementById('close-modal'),
    slidesWrapper: document.getElementById('slides-wrapper'),
    sliderDots: document.getElementById('slider-dots'),
    contactForm: document.getElementById('contact-form')
};

// 4. Initial Setup & Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    // Theme setup
    initTheme();
    
    // Fetch menu from backend API
    try {
        const response = await fetch('/api/menu');
        if (!response.ok) throw new Error('Failed to fetch menu');
        
        const data = await response.json();
        
        if (data && data.length > 0) {
            menuItems = data;
        } else {
            console.warn('No menu items found.');
        }
    } catch (err) {
        console.error('Error fetching menu:', err.message);
    }
    
    // Render initial menu
    renderMenu(menuItems);
    
    // Set up navbar scroll effect
    window.addEventListener('scroll', handleNavbarScroll);
    
    // Toggle Mobile Navigation
    elements.hamburger.addEventListener('click', toggleMobileNav);
    
    // Close nav on click outside
    document.addEventListener('click', handleOutsideNavClick);
    
    // Filter and Search Menu
    elements.searchField.addEventListener('input', handleMenuSearch);
    elements.categoryButtons.forEach(btn => {
        btn.addEventListener('click', handleCategoryFilter);
    });
    
    // Cart Drawer Operations
    elements.cartBtn.addEventListener('click', openCartDrawer);
    elements.cartCloseBtn.addEventListener('click', closeCartDrawer);
    elements.cartDrawerOverlay.addEventListener('click', closeCartDrawer);
    
    // Table Selection logic
    elements.tableNodes.forEach(node => {
        node.addEventListener('click', handleTableSelection);
    });
    
    // Reservation Submission
    elements.reservationForm.addEventListener('submit', handleReservationSubmit);
    elements.closeModalBtn.addEventListener('click', closeReservationModal);
    
    // Testimonial Dots & Slider
    initSlider();
    
    // Contact Form submission
    if(elements.contactForm) {
        elements.contactForm.addEventListener('submit', handleContactSubmit);
    }
});

// 5. Theme Operations
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        elements.body.classList.add('dark-mode');
        elements.themeIcon.className = 'fas fa-sun';
    } else {
        elements.body.classList.remove('dark-mode');
        elements.themeIcon.className = 'fas fa-moon';
    }
    
    elements.themeToggleBtn.addEventListener('click', () => {
        elements.body.classList.toggle('dark-mode');
        const isDark = elements.body.classList.contains('dark-mode');
        elements.themeIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
}

// 6. Navigation Operations
function handleNavbarScroll() {
    if (window.scrollY > 50) {
        elements.header.classList.add('scrolled');
    } else {
        elements.header.classList.remove('scrolled');
    }
}

function toggleMobileNav() {
    elements.hamburger.classList.toggle('active');
    elements.navMenu.classList.toggle('active');
}

function handleOutsideNavClick(e) {
    if (!elements.header.contains(e.target) && elements.navMenu.classList.contains('active')) {
        elements.hamburger.classList.remove('active');
        elements.navMenu.classList.remove('active');
    }
}

// 7. Menu Rendering & Filtering
function renderMenu(items) {
    elements.menuGrid.innerHTML = '';
    
    if (items.length === 0) {
        elements.menuGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
                <i class="fas fa-search" style="font-size: 2.5rem; margin-bottom: 15px; opacity: 0.5;"></i>
                <p>No matching delicacies found. Try checking another category!</p>
            </div>
        `;
        return;
    }
    
    items.forEach(item => {
        const menuCard = document.createElement('div');
        menuCard.className = 'menu-card no-image';
        menuCard.innerHTML = `
            <div class="menu-info">
                <div class="menu-title-row">
                    <div class="menu-title-group">
                        <h3 class="menu-card-title">${item.title}</h3>
                        ${item.badge ? `<span class="menu-card-badge">${item.badge}</span>` : ''}
                    </div>
                    <span class="menu-price">₹${item.price}</span>
                </div>
                <p class="menu-desc">${item.description}</p>
                <div class="menu-footer">
                    <div class="rating">
                        <i class="fas fa-star"></i>
                        <span>${item.rating}</span>
                    </div>
                    <button class="add-cart-btn" data-id="${item.id}" aria-label="Add ${item.title} to cart">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
        `;
        elements.menuGrid.appendChild(menuCard);
    });
    
    // Re-attach add to cart listeners
    const addBtns = elements.menuGrid.querySelectorAll('.add-cart-btn');
    addBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const itemId = parseInt(e.currentTarget.getAttribute('data-id'));
            addToCart(itemId);
        });
    });
}

function handleMenuSearch() {
    const query = elements.searchField.value.toLowerCase().trim();
    const activeCategory = document.querySelector('.category-btn.active').getAttribute('data-category');
    
    const filtered = menuItems.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(query) || item.description.toLowerCase().includes(query);
        const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
        return matchesSearch && matchesCategory;
    });
    
    renderMenu(filtered);
}

function handleCategoryFilter(e) {
    elements.categoryButtons.forEach(btn => btn.classList.remove('active'));
    e.currentTarget.classList.add('active');
    
    const category = e.currentTarget.getAttribute('data-category');
    const query = elements.searchField.value.toLowerCase().trim();
    
    const filtered = menuItems.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(query) || item.description.toLowerCase().includes(query);
        const matchesCategory = category === 'all' || item.category === category;
        return matchesSearch && matchesCategory;
    });
    
    renderMenu(filtered);
}

// 8. Shopping Cart Operations
function openCartDrawer() {
    elements.cartDrawer.classList.add('active');
    elements.cartDrawerOverlay.classList.add('active');
}

function closeCartDrawer() {
    elements.cartDrawer.classList.remove('active');
    elements.cartDrawerOverlay.classList.remove('active');
}

function addToCart(itemId) {
    const item = menuItems.find(i => i.id === itemId);
    const existing = cart.find(c => c.item.id === itemId);
    
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ item, quantity: 1 });
    }
    
    updateCartUI();
    openCartDrawer();
    
    // Visual micro-animation on floating cart button
    elements.cartBtn.style.transform = 'scale(1.15)';
    setTimeout(() => {
        elements.cartBtn.style.transform = 'none';
    }, 200);
}

function updateCartUI() {
    // Update Badge
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    elements.cartCountBadge.textContent = totalItems;
    elements.cartCountBadge.style.display = totalItems > 0 ? 'flex' : 'none';
    
    // Update Items Container
    elements.cartItemsContainer.innerHTML = '';
    
    if (cart.length === 0) {
        elements.cartItemsContainer.innerHTML = `
            <div class="cart-empty-state">
                <div class="cart-empty-icon"><i class="fas fa-shopping-basket"></i></div>
                <p>Your basket is looking lonely. Add some freshly brewed delights!</p>
            </div>
        `;
        elements.cartTotalPrice.textContent = '₹0';
        elements.checkoutBtn.disabled = true;
        elements.checkoutBtn.style.opacity = 0.5;
        elements.checkoutBtn.style.cursor = 'not-allowed';
        return;
    }
    
    elements.checkoutBtn.disabled = false;
    elements.checkoutBtn.style.opacity = 1;
    elements.checkoutBtn.style.cursor = 'pointer';
    
    let totalVal = 0;
    
    cart.forEach(cartItem => {
        const itemTotal = cartItem.item.price * cartItem.quantity;
        totalVal += itemTotal;
        
        const itemEl = document.createElement('div');
        itemEl.className = 'cart-item';
        itemEl.innerHTML = `
            <img src="${cartItem.item.image}" alt="${cartItem.item.title}" class="cart-item-img">
            <div class="cart-item-info">
                <h4 class="cart-item-title">${cartItem.item.title}</h4>
                <span class="cart-item-price">₹${cartItem.item.price}</span>
                <div class="cart-item-qty-row">
                    <button class="qty-btn minus-btn" data-id="${cartItem.item.id}"><i class="fas fa-minus"></i></button>
                    <span class="qty-val">${cartItem.quantity}</span>
                    <button class="qty-btn plus-btn" data-id="${cartItem.item.id}"><i class="fas fa-plus"></i></button>
                </div>
            </div>
            <button class="cart-item-remove" data-id="${cartItem.item.id}" aria-label="Remove item">
                <i class="far fa-trash-alt"></i>
            </button>
        `;
        elements.cartItemsContainer.appendChild(itemEl);
    });
    
    elements.cartTotalPrice.textContent = `₹${totalVal}`;
    
    // Attach Quantity Listeners
    elements.cartItemsContainer.querySelectorAll('.minus-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.getAttribute('data-id'));
            changeQty(id, -1);
        });
    });
    
    elements.cartItemsContainer.querySelectorAll('.plus-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.getAttribute('data-id'));
            changeQty(id, 1);
        });
    });
    
    elements.cartItemsContainer.querySelectorAll('.cart-item-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.getAttribute('data-id'));
            removeFromCart(id);
        });
    });
}

function changeQty(itemId, amt) {
    const cartItem = cart.find(c => c.item.id === itemId);
    if (cartItem) {
        cartItem.quantity += amt;
        if (cartItem.quantity <= 0) {
            removeFromCart(itemId);
        } else {
            updateCartUI();
        }
    }
}

function removeFromCart(itemId) {
    cart = cart.filter(c => c.item.id !== itemId);
    updateCartUI();
}

// 9. Table Selection Logic
function handleTableSelection(e) {
    const node = e.currentTarget;
    if (node.classList.contains('reserved')) return;
    
    elements.tableNodes.forEach(t => t.classList.remove('selected'));
    
    node.classList.add('selected');
    selectedTable = node.getAttribute('data-table');
}

// 10. Reservation Form & Modal
async function handleReservationSubmit(e) {
    e.preventDefault();
    
    if (!selectedTable) {
        alert("Please select a table layout node from the interactive floor plan!");
        return;
    }
    
    const name = document.getElementById('reserve-name').value;
    const guests = parseInt(document.getElementById('reserve-guests').value, 10);
    const date = document.getElementById('reserve-date').value;
    const time = document.getElementById('reserve-time').value;
    const submitBtn = document.getElementById('submit-reserve-btn');
    
    // Disable button to prevent double submission
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Confirming... <i class="fas fa-spinner fa-spin"></i>';
    }
    
    try {
        // Save to backend API
        const response = await fetch('/api/reservations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                guests,
                date,
                time,
                table_number: selectedTable
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error saving reservation:', errorData.error);
            alert('Failed to save reservation. Make sure the backend is running.');
            throw new Error(errorData.error);
        }

        // Populate modal details
        elements.modalDetails.innerHTML = `
            <div style="text-align: left; margin: 0 auto; max-width: 320px; display: flex; flex-direction: column; gap: 10px;">
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Date:</strong> ${date}</p>
                <p><strong>Time:</strong> ${time}</p>
                <p><strong>Guests:</strong> ${guests} Guests</p>
                <p><strong>Selected Table:</strong> Table #${selectedTable}</p>
                <p><strong>Location:</strong> Brew & Bloom, Bhosari, Pune</p>
            </div>
        `;
        
        // Open Modal
        elements.reservationModal.classList.add('active');
        
        // Reset selection and form
        elements.reservationForm.reset();
        elements.tableNodes.forEach(t => {
            if (t.getAttribute('data-table') === selectedTable) {
                t.classList.remove('selected');
                t.classList.add('reserved');
                t.classList.remove('available');
            }
        });
        selectedTable = null;
    } catch (err) {
        console.error("Reservation failed:", err);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Confirm Reservation <i class="far fa-calendar-check"></i>';
        }
    }
}

function closeReservationModal() {
    elements.reservationModal.classList.remove('active');
}

// 11. Testimonials / Slider
const reviews = [
    {
        text: "The ambiance is absolutely dream-like. Sipping a Hazelnut Latte surrounded by fresh flowers is the perfect weekend escape. Truly a gem in Bhosari!",
        author: "Priya Sharma",
        role: "Local Food Blogger"
    },
    {
        text: "The Peri Peri Paneer Burger is out of this world! Perfect balance of spice, and the service was quick. The table reservation feature online saved us a lot of wait time.",
        author: "Rahul Deshmukh",
        role: "Tech Professional"
    },
    {
        text: "Brew & Bloom has become my go-to remote workspace. High-speed internet, beautiful visual greenery, and outstanding Belgian waffles. Love the dark mode theme too!",
        author: "Amit Patel",
        role: "Freelance Designer"
    }
];

function initSlider() {
    // Generate Dots
    elements.sliderDots.innerHTML = '';
    reviews.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.className = `dot ${index === 0 ? 'active' : ''}`;
        dot.setAttribute('data-index', index);
        dot.addEventListener('click', () => {
            goToSlide(index);
        });
        elements.sliderDots.appendChild(dot);
    });
    
    // Auto Scroll every 5 seconds
    setInterval(() => {
        let nextIndex = (currentReviewIndex + 1) % reviews.length;
        goToSlide(nextIndex);
    }, 5000);
}

function goToSlide(index) {
    currentReviewIndex = index;
    
    // Translate slides
    elements.slidesWrapper.style.transform = `translateX(-${index * 100}%)`;
    
    // Update active dot
    const dots = elements.sliderDots.querySelectorAll('.dot');
    dots.forEach((dot, idx) => {
        dot.className = `dot ${idx === index ? 'active' : ''}`;
    });
}

// 12. Contact Form
function handleContactSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('contact-name').value;
    const email = document.getElementById('contact-email').value;
    
    alert(`Thank you for reaching out, ${name}! We have received your message and will get back to you at ${email} shortly.`);
    elements.contactForm.reset();
}
