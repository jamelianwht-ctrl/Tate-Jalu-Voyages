document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Cart Controls
    initCartUIControls();
    loadCartFromStorage();
    setAccountReturnPageHandler();

    // 2. Initialize Takeoff Controller (Home page specific)
    const exploreBtn = document.getElementById('exploreBtn');
    const welcomeHeader = document.getElementById('welcomeHeader');
    const airplane = document.getElementById('airplane');

    if (exploreBtn && welcomeHeader && airplane) {
        exploreBtn.addEventListener('click', () => {
            exploreBtn.classList.add('fade-out-hidden');
            welcomeHeader.classList.add('fade-out-hidden');
            airplane.classList.add('takeoff-active');
            
            setTimeout(() => {
                window.location.href = "ExplorePage.html"; 
            }, 4800); 
        });
    }

    // 3. Initialize Resorts Directory Renderer (Resorts pages specific)
    if (window.listings && document.getElementById('cards-grid')) {
        // Initialize state for listings
        window.resortState = { filter: 'all', imgIdx: {}, liked: {} };
        window.listings.forEach(l => { 
            window.resortState.imgIdx[l.id] = 0; 
            window.resortState.liked[l.id] = false; 
        });
        renderResorts();
    }

    // 4. Initialize Events Catalog Renderer (Events pages specific)
    if (window.products && document.getElementById('contentTab')) {
        window.eventsCurrentPage = 'home';
        window.eventsActiveDetailProductId = null;
        renderEventsView();

        const homeLink = document.getElementById('homeLink');
        if (homeLink) {
            homeLink.addEventListener('click', (e) => {
                e.preventDefault();
                navigateEventsTo('home');
            });
        }
    }
});

/* ==========================================================================
   1. GLOBAL CART MANAGEMENT
   ========================================================================== */
let cart = [];

const initCartUIControls = () => {
    const navCart = document.querySelector('.nav-cart');
    const closeBtn = document.querySelector('.close');
    const body = document.querySelector('body');

    if (navCart) {
        navCart.addEventListener('click', (e) => {
            e.preventDefault();
            body.classList.toggle('activeTabCart');
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            body.classList.remove('activeTabCart');
        });
    }

    // Capture dynamic plus, minus, and add to cart buttons
    window.addEventListener('click', (event) => {
        let target = event.target;
        if (target.classList.contains('addCart') || target.classList.contains('plus') || target.classList.contains('minus')) {
            let product_id = target.dataset.id;
            let type = target.classList.contains('minus') ? 'minus' : 'plus';
            changeCartQuantity(product_id, type);
        }
    });
};

const changeCartQuantity = (product_id, type) => {
    let positionItemInCart = cart.findIndex((value) => value.product_id == product_id);
    
    if (positionItemInCart >= 0) {
        if (type === 'plus') {
            cart[positionItemInCart].quantity += 1;
        } else {
            let valueChange = cart[positionItemInCart].quantity - 1;
            if (valueChange > 0) {
                cart[positionItemInCart].quantity = valueChange;
            } else {
                cart.splice(positionItemInCart, 1);
            }
        }
    } else if (type === 'plus') {
        cart.push({ product_id: product_id, quantity: 1 });
    }
    
    saveCartToStorage();
    refreshCartHTML();
};

// Unified helper to locate item data in listings or products
const getProductOrListingInfo = (id) => {
    // Check global products registry
    if (window.products) {
        const prod = window.products.find(p => p.id == id);
        if (prod) return { name: prod.name, price: prod.price, image: prod.image };
    }
    // Check global listings registry
    if (window.listings) {
        const list = window.listings.find(l => l.id == id);
        if (list) return { name: list.name, price: list.priceVal, image: list.imgs?.[0] };
    }
    // Check fallback products lookup (in case this is capetown/durban/joburg page rendering generic events)
    const fallbackEvents = [
        { id: 1, name: "The Johannesburg Zoo", price: 50, image: "images/jo1.png" },
        { id: 2, name: "Sun Eagle Adventures", price: 50, image: "images/jo2.png" },
        { id: 3, name: "Wits Sterkfontein Caves", price: 100, image: "images/jo3.png" },
        { id: 4, name: "Kingsmead Book Fair", price: 90, image: "images/jo4.png" },
        { id: 5, name: "RUN FOR CHARITY walk", price: 200, image: "images/dbn1.png" },
        { id: 6, name: "DURBAN CITY FC soccer", price: 50, image: "images/dbn2.png" },
        { id: 7, name: "Sip & Paint Fortunes", price: 360, image: "images/dbn3.png" },
        { id: 8, name: "Syakuzwa Gqom Festival", price: 250, image: "images/dbn4.png" },
        { id: 9, name: "Sky-Hi Ride", price: 150, image: "images/cape1.png" },
        { id: 10, name: "Iziko Planetarium", price: 250, image: "images/cape2.png" },
        { id: 11, name: "Sport Helicopters", price: 2000, image: "images/cape3.png" },
        { id: 12, name: "Rallycross Raceway", price: 180, image: "images/cape4.png" }
    ];
    const fallbackListings = [
        { id: 1, name: "The Hidden Lookout (Green Room)", price: 4120, image: "https://a0.muscache.com/im/pictures/101a8476-56f6-4f77-b007-4453e5a7ab55.jpg?im_w=960" },
        { id: 2, name: "1501 Oyster Schelles", price: 13595, image: "https://a0.muscache.com/im/pictures/hosting/Hosting-1598543732703745574/original/d8e18065-c240-47e4-9337-ac504ada9526.jpeg?im_w=960" },
        { id: 3, name: "262 Florida Road", price: 5405, image: "https://a0.muscache.com/im/pictures/miso/Hosting-1377232436342373497/original/27b9f64b-702b-408b-b4a9-50849c129c33.jpeg?im_w=960" },
        { id: 4, name: "Luxury Spa unit, Ballito", price: 2600, image: "https://a0.muscache.com/im/pictures/hosting/Hosting-1565233328857519928/original/656ecaa0-d702-48d6-9d21-efab2d5136e4.jpeg?im_w=960" },
        { id: 5, name: "Apartment in Sandton", price: 4150, image: "https://a0.muscache.com/im/pictures/hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6MTQ3ODk4OTQ0ODA0NjExNDU2NQ==/original/e7def023-a8a7-4751-ae54-f8d8038c8aec.jpeg?im_w=960" },
        { id: 6, name: "Rental unit in Sandton", price: 4011, image: "https://a0.muscache.com/im/pictures/hosting/Hosting-1644793949533558991/original/8cf1f648-fcc4-40fb-90ac-d6bcd974a162.jpeg?im_w=1200" },
        { id: 7, name: "Rental unit in Midrand", price: 1931, image: "https://a0.muscache.com/im/pictures/hosting/Hosting-1663881222892676877/original/c146238c-5214-4439-bb8d-ec4362a841ee.jpeg?im_w=720" },
        { id: 8, name: "Sandton Skye Luxury", price: 2732, image: "https://a0.muscache.com/im/pictures/hosting/Hosting-1643627082460260396/original/434e4e43-3bab-445b-8113-8d309afcb9f9.jpeg?im_w=1200" },
        { id: 9, name: "Beachfront bliss, Table View", price: 4069, image: "https://a0.muscache.com/im/pictures/hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6MTMzMDM4ODQ5NzgxMTAyMTAzOQ==/original/5f771a84-d344-4919-9b66-d4e56c7919a7.jpeg?im_w=960" },
        { id: 10, name: "180° Exclusive Splendor", price: 5638, image: "https://a0.muscache.com/im/pictures/hosting/Hosting-1359926367168831212/original/118fdf70-42f0-4163-9bd4-9c3920f14621.jpeg?im_w=960" },
        { id: 11, name: "Ferndale court 2-Bed", price: 5444, image: "https://a0.muscache.com/im/pictures/miso/Hosting-1304122960137378523/original/30019681-e96b-40d3-a659-5e26a3a708ae.jpeg?im_w=960" },
        { id: 12, name: "Ferndale court 3-Bed", price: 5444, image: "https://a0.muscache.com/im/pictures/miso/Hosting-1304122960137378523/original/a820f9e8-a325-4ca8-be21-94347afd7af8.jpeg?im_w=960" }
    ];

    const match = fallbackEvents.find(e => e.id == id) || fallbackListings.find(l => l.id == id);
    if (match) return match;

    return { name: `Product #${id}`, price: 100, image: "images/placeholder.jpg" };
};

const refreshCartHTML = () => {
    let listCartHTML = document.querySelector('.listCart');
    let totalQuantityHTML = document.querySelectorAll('.totalQuantity');
    let totalQuantity = 0;
    
    if (!listCartHTML) return;
    
    listCartHTML.innerHTML = '';

    cart.forEach(item => {
        totalQuantity += item.quantity;
        let info = getProductOrListingInfo(item.product_id);
        
        let newItem = document.createElement('div');
        newItem.classList.add('item');
        newItem.innerHTML = `
            <div class="image"><img src="${info.image}" alt="${info.name}"></div>
            <div class="name">${info.name}</div>
            <div class="totalPrice">R${(info.price * item.quantity).toLocaleString('en-ZA')}</div>
            <div class="quantity">
                <span class="minus" data-id="${item.product_id}">-</span>
                <span>${item.quantity}</span>
                <span class="plus" data-id="${item.product_id}">+</span>
            </div>
        `;
        listCartHTML.appendChild(newItem);
    });
    
    totalQuantityHTML.forEach(el => el.innerText = totalQuantity);
};

const saveCartToStorage = () => {
    localStorage.setItem('cart', JSON.stringify(cart));
};

const loadCartFromStorage = () => {
    if (localStorage.getItem('cart')) {
        cart = JSON.parse(localStorage.getItem('cart'));
        refreshCartHTML();
    }
};

const setAccountReturnPageHandler = () => {
    document.querySelectorAll('a[href="SignUP&Login.html"]').forEach(link => {
        link.addEventListener('click', () => {
            sessionStorage.setItem('accountReturnPage', window.location.href);
        });
    });
};

/* ==========================================================================
   2. RESORTS DIRECTORY MODULE
   ========================================================================== */
const fmtResortPrice = (n) => { 
    return 'R' + n.toLocaleString('en-ZA') + ' ZAR'; 
};

const buildResortCard = (l) => {
    const idx = window.resortState.imgIdx[l.id];
    const liked = window.resortState.liked[l.id];
    const dots = l.imgs.map((_, i) =>
        `<div class="dot${i===idx?' active':''}" onclick="setResortImg(event,${l.id},${i})"></div>`
    ).join('');

    return `
    <a class="card" href="${l.url}" target="_blank" rel="noopener" id="card-${l.id}">
        <div class="card-img-wrap">
            ${l.badge ? `<div class="guest-badge"><span class="badge-trophy">🏆</span> Guest favourite</div>` : ''}
            <button class="heart-btn${liked?' liked':''}" onclick="toggleResortHeart(event,${l.id})" aria-label="Save to wishlist">
                <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
            </button>
            <img src="${l.imgs[idx]}" alt="${l.name}" loading="lazy" id="img-${l.id}"/>
            <div class="dots-row" id="dots-${l.id}">${dots}</div>
        </div>
        <div class="card-body">
            <div class="card-row1">
                <div class="card-type">${l.type}</div>
                <div class="rating-box">
                    <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <span class="rating-num">${l.rating}</span>
                    <span class="rating-ct">(${l.reviews})</span>
                </div>
            </div>
            <div class="card-name">${l.name}</div>
            <div class="card-detail">${l.detail}</div>
            <div class="card-price"><strong>${fmtResortPrice(l.priceVal)}</strong> <span>for ${l.nights} nights</span></div>
        </div>
    </a>`;
};

const renderResorts = () => {
    const grid = document.getElementById('cards-grid');
    if (!grid) return;

    const filtered = window.listings.filter(l =>
        window.resortState.filter === 'all' || l.tags.includes(window.resortState.filter)
    );
    
    if (!filtered.length) {
        grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#717171;padding:40px 0;font-size:15px;">No stays match this filter. Try another category.</p>';
        return;
    }
    
    // Check if the listings contains city info (like All Resorts which groups them)
    const hasCityInfo = filtered.some(l => l.city);
    if (hasCityInfo) {
        const cities = ['Durban', 'Johannesburg', 'Cape Town'];
        let html = '';
        cities.forEach(city => {
            const cityListings = filtered.filter(l => l.city === city);
            if (cityListings.length > 0) {
                html += `<div class="location-section" style="grid-column:1/-1"><h2 class="location-title">${city}</h2></div>`;
                html += cityListings.map(buildResortCard).join('');
            }
        });
        grid.innerHTML = html;
    } else {
        grid.innerHTML = filtered.map(buildResortCard).join('');
    }
};

// Expose resort event handlers globally
window.setResortFilter = (btn) => {
    document.querySelectorAll('.f-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    window.resortState.filter = btn.dataset.filter;
    renderResorts();
};

window.toggleResortHeart = (e, id) => {
    e.preventDefault(); e.stopPropagation();
    window.resortState.liked[id] = !window.resortState.liked[id];
    const btn = document.querySelector(`#card-${id} .heart-btn`);
    if (btn) btn.classList.toggle('liked', window.resortState.liked[id]);
};

window.setResortImg = (e, id, idx) => {
    e.preventDefault(); e.stopPropagation();
    window.resortState.imgIdx[id] = idx;
    const img = document.getElementById(`img-${id}`);
    if (img) { 
        img.style.opacity = '0.6'; 
        img.src = window.listings.find(l=>l.id===id).imgs[idx]; 
        img.onload = () => img.style.opacity = '1'; 
    }
    const dotsWrap = document.getElementById(`dots-${id}`);
    if (dotsWrap) {
        dotsWrap.querySelectorAll('.dot').forEach((d,i) => d.classList.toggle('active', i===idx));
    }
};

/* ==========================================================================
   3. EVENTS CATALOG MODULE
   ========================================================================== */
const navigateEventsTo = (page, productId = null) => {
    window.eventsCurrentPage = page;
    window.eventsActiveDetailProductId = productId;
    renderEventsView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

const renderEventsView = () => {
    const displayStage = document.getElementById('contentTab');
    if (!displayStage) return;

    displayStage.innerHTML = '';

    if (window.eventsCurrentPage === 'home') {
        displayStage.innerHTML = `<div class="listProduct"></div>`;
        renderEventsGrid();
    } else if (window.eventsCurrentPage === 'detail') {
        renderEventDetailsPage(displayStage);
    }
};

const renderEventsGrid = () => {
    let gridContainer = document.querySelector('.listProduct');
    if (!gridContainer) return;

    const cities = [...new Set(window.products.map(product => product.city).filter(Boolean))];

    if (cities.length > 0) {
        cities.forEach(cityName => {
            let sectionTitle = document.createElement('div');
            sectionTitle.classList.add('citySubtitle');
            sectionTitle.textContent = cityName;
            gridContainer.appendChild(sectionTitle);

            window.products.filter(product => product.city === cityName).forEach(product => {
                let card = document.createElement('div');
                card.classList.add('item');
                card.innerHTML = `
                    <img src="${product.image}" alt="${product.name}" onclick="handleEventDetailClick(${product.id})">
                    <h2>${product.name}</h2>
                    <div class="city">${product.city}</div>
                    <div class="location">${product.location}</div>
                    <div class="price">R${product.price}</div>
                    <button class="addCart" data-id="${product.id}">Add To Cart</button>
                `;
                gridContainer.appendChild(card);
            });
        });
    } else {
        // If there's no city tags (like in page-specific Capetown.html), just render flat list
        window.products.forEach(product => {
            let card = document.createElement('div');
            card.classList.add('item');
            card.innerHTML = `
                <img src="${product.image}" alt="${product.name}" onclick="handleEventDetailClick(${product.id})">
                <h2>${product.name}</h2>
                <div class="location">${product.location}</div>
                <div class="price">R${product.price}</div>
                <button class="addCart" data-id="${product.id}">Add To Cart</button>
            `;
            gridContainer.appendChild(card);
        });
    }
};

const renderEventDetailsPage = (stage) => {
    let targetProduct = window.products.find(p => p.id == window.eventsActiveDetailProductId);
    if (!targetProduct) { navigateEventsTo('home'); return; }

    stage.innerHTML = `
        <div class="detail">
            <div class="image"><img src="${targetProduct.image}" alt="${targetProduct.name}"></div>
            <div class="content">
                <h1>${targetProduct.name}</h1>
                ${targetProduct.city ? `<div class="city">${targetProduct.city}</div>` : ''}
                <div class="location">${targetProduct.location}</div>
                <div class="price">R${targetProduct.price}</div>
                <div class="description">${targetProduct.description}</div>
                <div class="buttons">
                    <button class="checkout-btn-event" onclick="triggerCheckoutAlert()">Check Out</button>
                    <button class="addCart" data-id="${targetProduct.id}">Add To Cart 
                        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" style="margin-left:5px; vertical-align:middle;">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
        <h2 class="sectionTitle">Similar Events</h2>
        <div class="listProductRelated listProduct"></div>
    `;

    let relatedContainer = document.querySelector('.listProductRelated');
    window.products.filter(p => p.id != targetProduct.id).forEach(product => {
        let relatedCard = document.createElement('div');
        relatedCard.classList.add('item');
        relatedCard.innerHTML = `
            <img src="${product.image}" alt="${product.name}" onclick="handleEventDetailClick(${product.id})">
            <h2>${product.name}</h2>
            ${product.city ? `<div class="city">${product.city}</div>` : ''}
            <div class="location">${product.location}</div>
            <div class="price">R${product.price}</div>
            <button class="addCart" data-id="${product.id}">Add To Cart</button>
        `;
        relatedContainer.appendChild(relatedCard);
    });
};

// Global handlers for event detailed view triggers
window.handleEventDetailClick = (id) => {
    navigateEventsTo('detail', id);
};

window.triggerCheckoutAlert = () => {
    alert("Proceeding to checkout with your selected event!");
};

// Global aliases to support existing inline HTML event handlers
window.setFilter = window.setResortFilter;
window.toggleHeart = window.toggleResortHeart;
window.setImg = window.setResortImg;
