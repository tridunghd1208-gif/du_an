// ============================================================
// auth.js - Xử lý đăng nhập & đăng ký cơ bản (phía client)
// ------------------------------------------------------------
// File này dùng chung cho 3 trang:
//   - index.html    : form đăng nhập (trang mở đầu)
//   - register.html : form đăng ký
//   - game.html     : trang chơi game (chỉ vào được khi đã đăng nhập)
// Nó tự nhận biết đang ở trang nào dựa vào phần tử có trên trang.
//
// LƯU Ý: Đây là xác thực demo phía trình duyệt, KHÔNG bảo mật
// thật. Tài khoản và mật khẩu lưu dạng văn bản thường trong
// localStorage, ai mở DevTools cũng xem được. Chỉ dùng cho
// mục đích học tập / màn hình chào game.
// ============================================================

// Khóa lưu trong localStorage
const KEY_NGUOI_DUNG = "nguoiDung";   // danh sách tài khoản { tên: mật_khẩu }
const KEY_DANG_NHAP = "daDangNhap";   // trạng thái đã đăng nhập ("true")

// ------------------------------------------------------------
// Đọc / ghi danh sách tài khoản trong localStorage
// ------------------------------------------------------------
function layDanhSachNguoiDung() {
  const data = localStorage.getItem(KEY_NGUOI_DUNG);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      // Dữ liệu hỏng thì khởi tạo lại
      return taoMacDinh();
    }
  }
  // Lần đầu chạy: tạo sẵn tài khoản demo admin/1234
  return taoMacDinh();
}

function taoMacDinh() {
  const macDinh = { admin: "1234" };
  localStorage.setItem(KEY_NGUOI_DUNG, JSON.stringify(macDinh));
  return macDinh;
}

function luuDanhSachNguoiDung(ds) {
  localStorage.setItem(KEY_NGUOI_DUNG, JSON.stringify(ds));
}

function daDangNhap() {
  return localStorage.getItem(KEY_DANG_NHAP) === "true";
}

// ============================================================
// PHẦN 1: TRANG ĐĂNG NHẬP (index.html)
// ============================================================
function khoiTaoTrangDangNhap() {
  const loginForm = document.getElementById("loginForm");
  // Không có form đăng nhập → không phải trang này
  if (!loginForm) {
    return;
  }

  // Nếu đã đăng nhập rồi thì vào thẳng trang game
  if (daDangNhap()) {
    window.location.href = "game.html";
    return;
  }

  const loginUsername = document.getElementById("loginUsername");
  const loginPassword = document.getElementById("loginPassword");
  const loginError = document.getElementById("loginError");

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const username = loginUsername.value.trim();
    const password = loginPassword.value;

    if (username === "" || password === "") {
      loginError.textContent = "Vui lòng nhập đầy đủ thông tin!";
      return;
    }

    const ds = layDanhSachNguoiDung();

    if (Object.prototype.hasOwnProperty.call(ds, username) && ds[username] === password) {
      // Đúng: lưu trạng thái và chuyển sang trang game
      localStorage.setItem(KEY_DANG_NHAP, "true");
      loginError.textContent = "";
      window.location.href = "game.html";
    } else {
      loginError.textContent = "Sai tên đăng nhập hoặc mật khẩu!";
      loginPassword.value = "";
    }
  });
}

// ============================================================
// PHẦN 2: TRANG ĐĂNG KÝ (register.html)
// ============================================================
function khoiTaoTrangDangKy() {
  const registerForm = document.getElementById("registerForm");
  // Không có form đăng ký → không phải trang này
  if (!registerForm) {
    return;
  }

  const registerUsername = document.getElementById("registerUsername");
  const registerPassword = document.getElementById("registerPassword");
  const registerConfirm = document.getElementById("registerConfirm");
  const registerError = document.getElementById("registerError");

  registerForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const username = registerUsername.value.trim();
    const password = registerPassword.value;
    const confirm = registerConfirm.value;

    // Kiểm tra rỗng
    if (username === "" || password === "" || confirm === "") {
      registerError.style.color = "";
      registerError.textContent = "Vui lòng nhập đầy đủ thông tin!";
      return;
    }

    // Mật khẩu xác nhận không khớp
    if (password !== confirm) {
      registerError.style.color = "";
      registerError.textContent = "Mật khẩu xác nhận không khớp!";
      return;
    }

    const ds = layDanhSachNguoiDung();

    // Tên đã tồn tại
    if (Object.prototype.hasOwnProperty.call(ds, username)) {
      registerError.style.color = "";
      registerError.textContent = "Tên đăng nhập đã tồn tại!";
      return;
    }

    // Lưu tài khoản mới
    ds[username] = password;
    luuDanhSachNguoiDung(ds);

    // Báo thành công (màu xanh) rồi chuyển về trang đăng nhập
    registerError.style.color = "#57f5c4";
    registerError.textContent = "Đăng ký thành công! Đang chuyển sang trang đăng nhập...";

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1000);
  });
}

// ============================================================
// PHẦN 3: TRANG CHƠI GAME (game.html)
// ============================================================
function khoiTaoTrangGame() {
  const gameContainer = document.getElementById("gameContainer");
  // Không có khu vực game → không phải trang này
  if (!gameContainer) {
    return;
  }

  // Bảo vệ: chưa đăng nhập (vào thẳng URL) thì đá về trang đăng nhập
  if (!daDangNhap()) {
    window.location.href = "index.html";
    return;
  }

  // Nút đăng xuất: xóa trạng thái và quay về trang đăng nhập
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem(KEY_DANG_NHAP);
      window.location.href = "index.html";
    });
  }

  // Khởi động game (startGame() được định nghĩa trong script.js)
  if (typeof window.startGame === "function") {
    window.startGame();
  }
}

// ============================================================
// KHỞI ĐỘNG: chạy sau khi DOM sẵn sàng
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  // Đảm bảo luôn có sẵn danh sách tài khoản (tạo demo nếu chưa có)
  layDanhSachNguoiDung();

  // Tùy trang đang mở mà chỉ một trong ba hàm này chạy thật sự
  khoiTaoTrangDangNhap();
  khoiTaoTrangDangKy();
  khoiTaoTrangGame();
});
