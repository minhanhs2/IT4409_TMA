/*
 * Đặt toàn bộ code vào trong 'DOMContentLoaded'.
 * Đảm bảo code JS chỉ chạy sau khi toàn bộ HTML đã được tải xong,
 * tránh lỗi "null" khi cố tìm các phần tử chưa tồn tại.
 */
document.addEventListener('DOMContentLoaded', function() {

    // --- 1. LOGIC MENU MOBILE ---
    // (Chức năng thêm, tương tự dự án Bánh Mì)
    const menuBtn = document.getElementById('nut-an-hien-menu');
    const nav = document.getElementById('thanh-dieu-huong');

    // Luôn kiểm tra xem phần tử có tồn tại không
    if (menuBtn && nav) {
        menuBtn.addEventListener('click', function() {
            // Thêm/xóa class 'is-open' (đã định nghĩa trong CSS Bài 2)
            nav.classList.toggle('is-open');
        });
    }

    // --- 2. LOGIC ẨN/HIỆN FORM THÊM SẢN PHẨM ---
    // 
    
    // Lấy các phần tử dựa trên ID trong HTML của bạn
    const openFormBtn = document.getElementById('nut-mo-form-them');
    const formContainer = document.getElementById('khung-form-them-moi');
    const closeFormBtn = document.getElementById('nut-dong-form');
    
    // Hàm đóng form
    function closeAddForm() {
        formContainer.style.maxHeight = "0px";
    }

    function openAddForm() {
        formContainer.style.maxHeight = formContainer.scrollHeight + "px";
    }
    
    if (openFormBtn && formContainer) {
        openFormBtn.addEventListener('click', function() {
            // Kiểm tra xem form đang mở hay đóng
            if (formContainer.style.maxHeight && formContainer.style.maxHeight !== "0px") {
                closeAddForm(); // Đang mở -> đóng
            } else {
                openAddForm(); // Đang đóng -> mở
            }
        });
    }
    if (closeFormBtn) {
        closeFormBtn.addEventListener('click', closeAddForm);
    }

    // --- 3. LOGIC TÌM KIẾM/LỌC SẢN PHẨM ---
    const productList = document.getElementById('khung-chua-san-pham');
    const addProductForm = document.getElementById('bieu-mau-them-sp');
    const errorMsg = document.getElementById('tin-nhan-loi');

    const searchInput = document.getElementById('nhap-tim-kiem');
    const searchBtn = document.getElementById('nut-tim');
    const minPriceInput = document.getElementById('gia-min');
    const maxPriceInput = document.getElementById('gia-max');
    const sortPriceAscBtn = document.getElementById('nut-sap-xep-tang');
    const sortPriceDescBtn = document.getElementById('nut-sap-xep-giam');

    let allProducts = []; 
    const LOCAL_STORAGE_KEY = 'duckyProducts';

    function saveProductsToStorage() {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allProducts));
        } catch (e) {
            console.error("Lỗi khi lưu vào localStorage:", e);
        }
    }

    function createProductElement(product) {
        const newItem = document.createElement('article');
        newItem.className = 'product-item'; 
        
        newItem.setAttribute('data-id', product.id);

        const formattedPrice = Number(product.price).toLocaleString('vi-VN');
        const desc = product.desc || "";
        const imgAlt = product.name;
        let imgSrc;

        if (product.image) {
            imgSrc = `../assets/${encodeURIComponent(product.image)}`;
        } else {
            imgSrc = `https://placehold.co/400x400?text=${encodeURIComponent(product.name)}`;
        }

        newItem.innerHTML = `
            <img src="${imgSrc}" alt="${imgAlt}" style="width:100%; height: 300px; object-fit: cover; background: #eee;">
            <h3>${product.name}</h3>
            <p>${desc}</p>
            <p class="price">Giá: ${formattedPrice} VNĐ</p>
            <button class="delete-btn">Xóa</button> 
        `; // MỚI: Thêm nút Xóa
        return newItem;
    }

    function renderProducts() {
        
        let productsToRender = [...allProducts]; // Bắt đầu với tất cả sản phẩm

        // A. Lọc (Filtering)
        const searchTerm = searchInput.value.toLowerCase();
        const minPrice = parseFloat(minPriceInput.value) || 0; // MỚI
        const maxPrice = parseFloat(maxPriceInput.value) || Infinity; // MỚI

        // Lọc theo tên
        if (searchTerm) {
            productsToRender = productsToRender.filter(p => 
                p.name.toLowerCase().includes(searchTerm)
            );
        }
        
        // Lọc theo giá (MỚI)
        productsToRender = productsToRender.filter(p => 
            p.price >= minPrice && p.price <= maxPrice
        );

        // B. Vẽ (Rendering)
        productList.innerHTML = ''; // Xóa sạch danh sách cũ
        productsToRender.forEach(product => {
            const productElement = createProductElement(product);
            productList.appendChild(productElement); 
        });
    }

    async function loadProducts() {
        let dataNeedsMigration = false;
        try {
            const storedProducts = localStorage.getItem(LOCAL_STORAGE_KEY);
            
            if (storedProducts) {
                let parsedProducts = JSON.parse(storedProducts);
                if (Array.isArray(parsedProducts)) {
                    // "Nâng cấp" dữ liệu cũ (Bài 5) không có ID
                    parsedProducts.forEach((p, index) => {
                        if (!p.id) {
                            p.id = Date.now() + index;
                            dataNeedsMigration = true;
                        }
                    });
                    allProducts = parsedProducts;
                    if (dataNeedsMigration) {
                        saveProductsToStorage();
                    }
                } else {
                    await fetchOrInitialize(); // Dữ liệu hỏng, tải lại
                }
            } else {
                // localStorage rỗng, tải từ file JSON
                await fetchOrInitialize();
            }
        } catch (e) {
            console.error("Lỗi parse localStorage, tạo lại dữ liệu:", e);
            await fetchOrInitialize(true); // Ép tạo dữ liệu mẫu
        }
        
        renderProducts(); // Vẽ ra màn hình
    }

    async function fetchOrInitialize(forceInitialize = false) {
        if (!forceInitialize) {
            try {
                // await: Chờ 'fetch' hoàn thành
                const response = await fetch('../Bai6/products.json'); 
                if (!response.ok) throw new Error('Không tìm thấy file json');
                
                const data = await response.json();
                // Gán ID cho dữ liệu tải từ file JSON
                allProducts = data.map((p, index) => ({
                    ...p,
                    id: Date.now() + index // Gán ID duy nhất
                }));
                
            } catch (fetchError) {
                console.warn("Fetch lỗi, quay về dữ liệu mẫu:", fetchError);
                initializeDefaultProducts(); // Fetch lỗi -> Dùng dữ liệu mẫu
            }
        } else {
            initializeDefaultProducts(); // Bị ép dùng dữ liệu mẫu
        }
        saveProductsToStorage(); // Lưu dữ liệu mới này
    }

    function initializeDefaultProducts() {
        // (Đây là dữ liệu 4 sản phẩm mẫu)
        allProducts = [
            { id: Date.now()+1, name: "Son 3CE Kem Velvet Lip Tint Màu Best Ever", price: 243000, desc: "...", image: "3CE.png" },
            { id: Date.now()+2, name: "Kem chống nắng nâng tông kiềm dầu INNISFREE...", price: 480000, desc: "...", image: "SPF50+.png" },
            { id: Date.now()+3, name: "Nước Tẩy Trang Garnier Làm Sạch Sâu...", price: 180000, desc: "...", image: "Garnier.jpg" },
            { id: Date.now()+4, name: "Serum Phục Hồi Da La Roche-Posay B5", price: 650000, desc: "...", image: "larocheposay-b5.jpg" }
        ];
    }

    if (addProductForm) {
        addProductForm.addEventListener('submit', function(event) {
            event.preventDefault(); 
            
            const name = document.getElementById('ten-moi').value.trim();
            const price = document.getElementById('gia-moi').value.trim();
            const desc = document.getElementById('mo-ta-moi').value.trim();

            if (!name || !price || isNaN(price) || Number(price) <= 0) {
                errorMsg.textContent = "Vui lòng nhập tên và giá hợp lệ.";
                return; 
            }
            errorMsg.textContent = "";

            const newProduct = {
                id: Date.now(), // Gán ID khi tạo
                name: name,
                price: Number(price),
                desc: desc
                // (Sản phẩm mới thêm sẽ không có 'image', 
                // createProductElement sẽ tự dùng ảnh placeholder)
            };
            
            allProducts.unshift(newProduct); // Thêm vào mảng
            saveProductsToStorage(); // Lưu
            renderProducts(); // Vẽ lại
            
            addProductForm.reset(); 
            closeAddForm(); // Đóng form (hiệu ứng trượt)
        });
    }

    if (productList) {
        productList.addEventListener('click', function(event) {
            // Kiểm tra xem có bấm trúng nút "Xóa" không
            if (event.target.classList.contains('delete-btn')) {
                // Lấy ID từ thẻ <article> cha
                const productElement = event.target.closest('.product-item');
                const productId = Number(productElement.getAttribute('data-id'));

                // Lọc mảng, BỎ sản phẩm có ID này
                allProducts = allProducts.filter(p => p.id !== productId);
                
                saveProductsToStorage(); // Lưu lại
                renderProducts(); // Vẽ lại
            }
        });
    }

    if (sortPriceAscBtn) {
        sortPriceAscBtn.addEventListener('click', function() {
            allProducts.sort((a, b) => a.price - b.price); // Sắp xếp mảng
            renderProducts(); // Vẽ lại
        });
    }
    if (sortPriceDescBtn) {
        sortPriceDescBtn.addEventListener('click', function() {
            allProducts.sort((a, b) => b.price - a.price); // Sắp xếp mảng
            renderProducts(); // Vẽ lại
        });
    }

    if (searchBtn) searchBtn.addEventListener('click', renderProducts);
    if (searchInput) searchInput.addEventListener('keyup', renderProducts);
    if (minPriceInput) minPriceInput.addEventListener('input', renderProducts);
    if (maxPriceInput) maxPriceInput.addEventListener('input', renderProducts);

    loadProducts();
});