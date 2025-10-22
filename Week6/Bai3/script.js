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

    // Khi bấm nút "Thêm sản phẩm mới"
    if (openFormBtn && formContainer) {
        openFormBtn.addEventListener('click', function() {
            // Dùng toggle để bật/tắt form [cite: 145]
            formContainer.classList.toggle('hidden');
        });
    }

    // Khi bấm nút "Hủy" (nut-dong-form)
    if (closeFormBtn && formContainer) {
        closeFormBtn.addEventListener('click', function() {
            // Khi hủy, luôn luôn ẩn form đi [cite: 137]
            formContainer.classList.add('hidden');
        });
    }

    // --- 3. LOGIC TÌM KIẾM/LỌC SẢN PHẨM ---

    const searchInput = document.getElementById('nhap-tim-kiem');
    const searchBtn = document.getElementById('nut-tim');
    // Lưu ý: ID này phải khớp với div chứa các <article>
    const productListContainer = document.getElementById('khung-chua-san-pham'); 

    // Tạo một hàm riêng để xử lý việc lọc
    function filterProducts() {
        // Lấy giá trị tìm kiếm, chuyển về chữ thường
        const searchTerm = searchInput.value.toLowerCase();
        
        // Lấy TẤT CẢ các sản phẩm bên trong khung chứa
        const allProducts = productListContainer.querySelectorAll('.product-item');

        // Duyệt qua từng sản phẩm
        allProducts.forEach(function(product) {
            // Lấy thẻ h3 (tên sản phẩm) bên trong
            const productNameElement = product.querySelector('h3');
            
            if (productNameElement) {
                const productName = productNameElement.textContent.toLowerCase();

                // Kiểm tra xem tên sản phẩm có chứa từ khóa không
                if (productName.includes(searchTerm)) {
                    // Nếu có, hiển thị sản phẩm
                    // (Phải đặt là 'flex' vì CSS Bài 2 dùng flexbox)
                    product.style.display = 'flex';
                } else {
                    // Nếu không, ẩn sản phẩm
                    product.style.display = 'none';
                }
            }
        });
    }

    // Gắn sự kiện cho nút "Tìm"
    if (searchBtn) {
        searchBtn.addEventListener('click', filterProducts);
    }

    // Gắn sự kiện "keyup" để lọc ngay khi gõ (tính năng "hay")
    if (searchInput) {
        searchInput.addEventListener('keyup', filterProducts);
    }

    const addProductForm = document.getElementById('bieu-mau-them-sp');
    const errorMsg = document.getElementById('tin-nhan-loi');
    const productList = document.getElementById('khung-chua-san-pham');

    if (addProductForm && errorMsg && productList && formContainer) {
        
        addProductForm.addEventListener('submit', function(event) {
            
            // 3. Ngăn form tải lại trang
            event.preventDefault(); //

            // 4. Lấy giá trị từ các ô input (dựa trên ID của Ducky Beauty)
            const name = document.getElementById('ten-moi').value.trim();
            const price = document.getElementById('gia-moi').value.trim();
            const desc = document.getElementById('mo-ta-moi').value.trim();

            // 5. Validate dữ liệu
            // Kiểm tra Tên (không rỗng)
            // Kiểm tra Giá (không rỗng, là Số, và > 0)
            if (!name || !price || isNaN(price) || Number(price) <= 0) {
                // Nếu lỗi, hiển thị thông báo
                errorMsg.textContent = "Vui lòng nhập tên và giá hợp lệ (giá phải là số > 0).";
                return; // Dừng hàm lại
            }

            // 6. Nếu dữ liệu hợp lệ, xóa thông báo lỗi (nếu có)
            errorMsg.textContent = "";

            // 7. Tạo phần tử HTML cho sản phẩm mới
            const newItem = document.createElement('article');
            newItem.className = 'product-item'; // Đặt class để CSS (Bài 2) tự động áp dụng

            // Format giá cho đẹp (vd: 250000 -> 250.000)
            const formattedPrice = Number(price).toLocaleString('vi-VN');

            // 8. Dùng innerHTML để tạo cấu trúc bên trong
            // (Chúng ta dùng ảnh placeholder cho sản phẩm mới)
            newItem.innerHTML = `
                <img src="https://placehold.co/400x400?text=${encodeURIComponent(name)}" alt="${name}" style="width:100%; height: 300px; object-fit: cover; background: #eee;">
                <h3>${name}</h3>
                <p>${desc}</p>
                <p class="price">Giá: ${formattedPrice} VNĐ</p>
            `;
            // (Lưu ý: Tôi thêm style cho ảnh để khớp với CSS (height 300px, object-fit) chúng ta đã sửa)

            // 9. Thêm sản phẩm mới vào ĐẦU danh sách
            productList.prepend(newItem); //

            // 10. Reset (xóa) nội dung form và ẩn form đi
            addProductForm.reset(); //
            formContainer.classList.add('hidden'); //
        });
    }

});