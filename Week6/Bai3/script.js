document.addEventListener('DOMContentLoaded', function() {

    // Toggle menu mobile khi bấm nút hamburger
    const menuBtn = document.getElementById('nut-an-hien-menu');
    const nav = document.getElementById('thanh-dieu-huong');
    if (menuBtn && nav) {
        menuBtn.addEventListener('click', () => nav.classList.toggle('is-open'));
    }

    // Hiệu ứng trượt cho form thêm sản phẩm
    const openFormBtn = document.getElementById('nut-mo-form-them');
    const formContainer = document.getElementById('khung-form-them-moi');
    const closeFormBtn = document.getElementById('nut-dong-form');

    // Hàm đóng form (đặt max-height về 0)
    function closeAddForm() {
        formContainer.style.maxHeight = "0px";
    }

    // Hàm mở form (đặt max-height bằng chiều cao nội dung)
    function openAddForm() {
        formContainer.style.maxHeight = formContainer.scrollHeight + "px";
    }

    // Gắn sự kiện bật/tắt form
    if (openFormBtn && formContainer) {
        openFormBtn.addEventListener('click', () => {
            const isOpen = formContainer.style.maxHeight && formContainer.style.maxHeight !== "0px";
            isOpen ? closeAddForm() : openAddForm();
        });
    }
    // Nút Hủy luôn đóng form
    if (closeFormBtn) {
        closeFormBtn.addEventListener('click', closeAddForm);
    }

    // Lấy các phần tử DOM liên quan đến sản phẩm
    const productList = document.getElementById('khung-chua-san-pham');
    const addProductForm = document.getElementById('bieu-mau-them-sp');
    const errorMsg = document.getElementById('tin-nhan-loi');
    const searchInput = document.getElementById('nhap-tim-kiem');
    const searchBtn = document.getElementById('nut-tim'); // Nút Tìm (không thực sự cần thiết nếu dùng keyup)
    const minPriceInput = document.getElementById('gia-min');
    const maxPriceInput = document.getElementById('gia-max');
    const sortPriceAscBtn = document.getElementById('nut-sap-xep-tang');
    const sortPriceDescBtn = document.getElementById('nut-sap-xep-giam');

    // Mảng lưu trữ toàn bộ dữ liệu sản phẩm ("source of truth")
    let allProducts = [];
    const LOCAL_STORAGE_KEY = 'duckyProducts'; // Key để lưu trong localStorage

    // Lưu danh sách sản phẩm hiện tại vào localStorage
    function saveProductsToStorage() {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allProducts));
        } catch (e) {
            console.error("Lỗi lưu localStorage:", e);
        }
    }

    // Tạo HTML cho một thẻ sản phẩm
    function createProductElement(product) {
        const newItem = document.createElement('article');
        newItem.className = 'product-item';
        newItem.setAttribute('data-id', product.id); // Gắn ID để dùng khi xóa

        const formattedPrice = Number(product.price).toLocaleString('vi-VN');
        const desc = product.desc || "";
        const imgAlt = product.name;
        let imgSrc;

        // Ưu tiên ảnh local, nếu không có thì dùng placeholder
        if (product.image) {
            imgSrc = `../assets/${encodeURIComponent(product.image)}`; // Encode tên file phòng trường hợp có dấu cách
        } else {
            imgSrc = `https://placehold.co/400x400?text=${encodeURIComponent(product.name)}`;
        }

        // Tạo cấu trúc HTML bằng template literal
        newItem.innerHTML = `
            <img src="${imgSrc}" alt="${imgAlt}" style="width:100%; height: 300px; object-fit: cover; background: #eee;">
            <h3>${product.name}</h3>
            <p>${desc}</p>
            <p class="price">Giá: ${formattedPrice} VNĐ</p>
            <button class="delete-btn">Xóa</button>
        `;
        return newItem;
    }

    // Hàm chính: Vẽ lại danh sách sản phẩm dựa trên bộ lọc và sắp xếp hiện tại
    function renderProducts() {
        let productsToRender = [...allProducts]; // Tạo bản sao để lọc

        // Lấy các giá trị lọc
        const searchTerm = searchInput.value.toLowerCase();
        const minPrice = parseFloat(minPriceInput.value) || 0;
        const maxPrice = parseFloat(maxPriceInput.value) || Infinity;

        // Áp dụng bộ lọc
        if (searchTerm) {
            productsToRender = productsToRender.filter(p => p.name.toLowerCase().includes(searchTerm));
        }
        productsToRender = productsToRender.filter(p => p.price >= minPrice && p.price <= maxPrice);

        // Xóa danh sách cũ và vẽ lại
        productList.innerHTML = '';
        productsToRender.forEach(product => {
            const productElement = createProductElement(product);
            productList.appendChild(productElement);
        });
    }

    // Tải dữ liệu sản phẩm khi trang mở (localStorage -> fetch -> fallback)
    async function loadProducts() {
        let dataNeedsMigration = false; // Cờ để kiểm tra nếu dữ liệu cũ cần thêm ID
        try {
            const storedProducts = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (storedProducts) {
                let parsedProducts = JSON.parse(storedProducts);
                if (Array.isArray(parsedProducts)) {
                    // Tự động thêm ID nếu dữ liệu cũ chưa có (để nút Xóa hoạt động)
                    parsedProducts.forEach((p, index) => {
                        if (!p.id) {
                            p.id = Date.now() + index;
                            dataNeedsMigration = true;
                        }
                    });
                    allProducts = parsedProducts;
                    if (dataNeedsMigration) saveProductsToStorage(); // Lưu lại nếu đã thêm ID
                } else {
                    await fetchOrInitialize(); // Dữ liệu localStorage bị hỏng
                }
            } else {
                await fetchOrInitialize(); // localStorage trống
            }
        } catch (e) {
            console.error("Lỗi đọc localStorage, tải lại dữ liệu:", e);
            await fetchOrInitialize(true); // Lỗi parse JSON -> ép dùng fallback
        }
        renderProducts(); // Hiển thị sản phẩm sau khi tải
    }

    // Hàm phụ: Thử tải từ 'products.json', nếu lỗi thì tạo dữ liệu mẫu
    async function fetchOrInitialize(forceInitialize = false) {
        if (!forceInitialize) {
            try {
                const response = await fetch('../Bai6/products.json'); // Đường dẫn đến file JSON
                if (!response.ok) throw new Error('Không tìm thấy products.json');
                const data = await response.json();
                // Gán ID duy nhất khi tải từ file
                allProducts = data.map((p, index) => ({ ...p, id: Date.now() + index }));
            } catch (fetchError) {
                console.warn("Lỗi fetch products.json, dùng dữ liệu mẫu:", fetchError);
                initializeDefaultProducts();
            }
        } else {
            initializeDefaultProducts();
        }
        saveProductsToStorage(); // Lưu lại dữ liệu vừa tải/tạo
    }

    // Hàm tạo dữ liệu mẫu (chỉ chạy khi localStorage trống và fetch lỗi)
    function initializeDefaultProducts() {
        allProducts = [
            // (Bạn có thể bỏ phần desc ngắn gọn đi nếu muốn)
            { id: Date.now()+1, name: "Son 3CE Kem Velvet Lip Tint Màu Best Ever", price: 243000, desc: "Son đỏ thuần, hợp nhiều tông da.", image: "3CE.png" },
            { id: Date.now()+2, name: "Kem chống nắng Innisfree Tone Up No Sebum", price: 480000, desc: "KCN vật lý lai hóa học, kiềm dầu.", image: "SPF50+.png" },
            { id: Date.now()+3, name: "Nước Tẩy Trang Garnier Micellar Water", price: 180000, desc: "Làm sạch sâu, không gây khô rát.", image: "Garnier.jpg" },
            { id: Date.now()+4, name: "Serum La Roche-Posay B5", price: 650000, desc: "Phục hồi độ ẩm, làm dịu da.", image: "larocheposay-b5.jpg" }
        ];
    }

    // Xử lý khi submit form thêm sản phẩm
    if (addProductForm) {
        addProductForm.addEventListener('submit', function(event) {
            event.preventDefault(); // Ngăn trang reload

            // Lấy và validate dữ liệu
            const name = document.getElementById('ten-moi').value.trim();
            const price = document.getElementById('gia-moi').value.trim();
            const desc = document.getElementById('mo-ta-moi').value.trim();
            if (!name || !price || isNaN(price) || Number(price) <= 0) {
                errorMsg.textContent = "Tên và giá hợp lệ là bắt buộc.";
                return;
            }
            errorMsg.textContent = ""; // Xóa lỗi nếu OK

            // Tạo object sản phẩm mới
            const newProduct = { id: Date.now(), name, price: Number(price), desc };

            // Cập nhật dữ liệu và giao diện
            allProducts.unshift(newProduct); // Thêm vào đầu mảng
            saveProductsToStorage();
            renderProducts(); // Vẽ lại list
            addProductForm.reset();
            closeAddForm(); // Đóng form
        });
    }

    // Xử lý khi bấm nút Xóa (dùng event delegation)
    if (productList) {
        productList.addEventListener('click', function(event) {
            // Chỉ chạy nếu bấm đúng nút Xóa
            if (event.target.classList.contains('delete-btn')) {
                const productElement = event.target.closest('.product-item');
                const productId = Number(productElement.getAttribute('data-id'));

                // Lọc bỏ sản phẩm bị xóa
                allProducts = allProducts.filter(p => p.id !== productId);

                // Cập nhật localStorage và giao diện
                saveProductsToStorage();
                renderProducts();
            }
        });
    }

    // Gắn sự kiện cho các nút sắp xếp
    if (sortPriceAscBtn) {
        sortPriceAscBtn.addEventListener('click', () => {
            allProducts.sort((a, b) => a.price - b.price); // Sắp xếp lại mảng gốc
            renderProducts(); // Vẽ lại
        });
    }
    if (sortPriceDescBtn) {
        sortPriceDescBtn.addEventListener('click', () => {
            allProducts.sort((a, b) => b.price - a.price); // Sắp xếp lại mảng gốc
            renderProducts(); // Vẽ lại
        });
    }

    // Gắn sự kiện cho các ô lọc -> gọi renderProducts() mỗi khi thay đổi
    if (searchInput) searchInput.addEventListener('keyup', renderProducts);
    if (minPriceInput) minPriceInput.addEventListener('input', renderProducts);
    if (maxPriceInput) maxPriceInput.addEventListener('input', renderProducts);
    // if (searchBtn) searchBtn.addEventListener('click', renderProducts); // Có thể bỏ nếu dùng keyup

    // Bắt đầu: Tải dữ liệu sản phẩm khi trang được load
    loadProducts();
});