// ============================================================
// Game.js - Class điều phối trung tâm của toàn bộ trò chơi
// ============================================================

import { Spaceship } from "./Spaceship.js";
import { Alien } from "./Alien.js";

// Khóa dùng để lưu điểm cao nhất trong localStorage
const HIGH_SCORE_KEY = "spaceInvadersHighScore";

/**
 * Lớp Game là "bộ não" của trò chơi.
 * Nhiệm vụ:
 *  - Quản lý trạng thái (điểm số, start / playing / paused / gameover).
 *  - Chứa toàn bộ thực thể (phi thuyền, đạn, đàn quái vật).
 *  - Bắt sự kiện bàn phím.
 *  - Chạy Game Loop bằng requestAnimationFrame.
 *  - Xử lý va chạm (AABB) và lưu điểm cao nhất vào localStorage.
 */
export class Game {
  /**
   * @param {HTMLCanvasElement} canvas - thẻ canvas dùng để vẽ game
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.width = canvas.width;
    this.height = canvas.height;

    // ---- Trạng thái game ----
    this.state = "start"; // "start" | "playing" | "paused" | "gameover"
    this.score = 0;
    // Đọc điểm cao nhất đã lưu (nếu chưa có thì mặc định 0)
    this.highScore = Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0;

    // ---- Các thực thể trong game ----
    this.spaceship = null;
    this.bullets = []; // mảng các viên đạn đang bay
    this.aliens = []; // mảng quái vật còn sống

    // ---- Cấu hình lưới quái vật ----
    this.alienRows = 4; // số hàng
    this.alienCols = 8; // số cột
    this.alienGap = 16; // khoảng cách giữa các quái vật
    this.alienDirection = 1; // 1 = sang phải, -1 = sang trái
    this.alienSpeed = 1.2; // tốc độ trượt ngang của cả đàn
    this.alienDropDistance = 24; // bậc hạ xuống khi chạm tường

    // ---- Trạng thái bàn phím ----
    // Lưu phím đang được giữ để di chuyển mượt mỗi khung hình
    this.keys = { left: false, right: false };

    // ---- Cơ chế bắn đạn ----
    this.shootCooldown = 0; // đếm lùi số khung hình giữa 2 lần bắn
    this.shootInterval = 15; // khoảng cách tối thiểu giữa 2 viên đạn (frames)

    // ---- Vòng lặp game ----
    this.animationId = null; // id trả về từ requestAnimationFrame để có thể hủy

    // Bind sẵn các hàm xử lý sự kiện để có thể addEventListener/removeEventListener đúng tham chiếu
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.gameLoop = this.gameLoop.bind(this);

    // Tham chiếu tới các phần tử DOM dùng để cập nhật giao diện
    this.scoreEl = document.getElementById("scoreValue");
    this.highScoreEl = document.getElementById("highScoreValue");
    this.startScreen = document.getElementById("startScreen");
    this.gameOverScreen = document.getElementById("gameOverScreen");
    this.finalScoreEl = document.getElementById("finalScore");
    this.finalHighScoreEl = document.getElementById("finalHighScore");

    // Hiển thị điểm cao nhất ngay khi khởi tạo
    this.highScoreEl.textContent = this.highScore;

    // Đăng ký lắng nghe bàn phím một lần duy nhất cho cả vòng đời game
    this.registerInput();
  }

  // ============================================================
  // KHỞI TẠO / RESET VÁN ĐẤU
  // ============================================================

  /**
   * Đặt lại toàn bộ thực thể và biến trạng thái để bắt đầu một ván mới.
   */
  reset() {
    this.score = 0;
    this.bullets = [];
    this.alienDirection = 1;
    this.shootCooldown = 0;
    this.keys.left = false;
    this.keys.right = false;

    // Tạo lại phi thuyền ở giữa đáy canvas
    this.spaceship = new Spaceship(this.width, this.height);

    // Sinh lưới quái vật
    this.createAlienGrid();

    // Cập nhật điểm hiển thị
    this.updateScoreUI();
  }

  /**
   * Sinh lưới quái vật theo số hàng x số cột đã cấu hình.
   * Mỗi quái vật được đặt cách đều nhau và căn giữa theo chiều ngang.
   */
  createAlienGrid() {
    this.aliens = [];

    // Lấy kích thước một quái vật mẫu để tính toán bố cục lưới
    const sample = new Alien(0, 0);
    const cellWidth = sample.width + this.alienGap;
    const cellHeight = sample.height + this.alienGap;

    // Tính bề rộng toàn lưới để căn giữa theo chiều ngang
    const gridWidth = this.alienCols * cellWidth - this.alienGap;
    const startX = (this.width - gridWidth) / 2;
    const startY = 60; // chừa khoảng trống phía trên

    // Lặp qua từng hàng/cột để tạo và đặt vị trí từng quái vật
    for (let row = 0; row < this.alienRows; row++) {
      for (let col = 0; col < this.alienCols; col++) {
        const x = startX + col * cellWidth;
        const y = startY + row * cellHeight;
        this.aliens.push(new Alien(x, y));
      }
    }
  }

  // ============================================================
  // ĐIỀU KHIỂN VÒNG ĐỜI: START / PAUSE / GAME OVER
  // ============================================================

  /** Bắt đầu ván mới từ màn hình Start hoặc Game Over. */
  start() {
    this.reset();
    this.state = "playing";
    this.startScreen.classList.add("hidden");
    this.gameOverScreen.classList.add("hidden");

    // Đảm bảo không có 2 vòng lặp chạy song song
    cancelAnimationFrame(this.animationId);
    this.animationId = requestAnimationFrame(this.gameLoop);
  }

  /** Bật/tắt tạm dừng (chỉ có tác dụng khi đang chơi). */
  togglePause() {
    if (this.state === "playing") {
      this.state = "paused";
    } else if (this.state === "paused") {
      this.state = "playing";
      // Khởi động lại vòng lặp vì khi pause ta đã dừng requestAnimationFrame
      this.animationId = requestAnimationFrame(this.gameLoop);
    }
  }

  /** Kết thúc game: cập nhật điểm cao nhất, lưu localStorage, hiện overlay. */
  gameOver() {
    this.state = "gameover";
    cancelAnimationFrame(this.animationId);

    // So sánh và lưu điểm cao nhất vào localStorage nếu phá kỷ lục
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem(HIGH_SCORE_KEY, String(this.highScore));
    }

    // Cập nhật giao diện màn hình Game Over
    this.finalScoreEl.textContent = this.score;
    this.finalHighScoreEl.textContent = this.highScore;
    this.highScoreEl.textContent = this.highScore;
    this.gameOverScreen.classList.remove("hidden");
  }

  // ============================================================
  // XỬ LÝ BÀN PHÍM (INPUT)
  // ============================================================

  /** Đăng ký lắng nghe các sự kiện bàn phím. */
  registerInput() {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
  }

  /**
   * Xử lý khi nhấn phím xuống.
   * - Mũi tên trái/phải: bật cờ di chuyển.
   * - Space: bắn đạn (có cooldown).
   * - P: tạm dừng / tiếp tục.
   * @param {KeyboardEvent} e
   */
  handleKeyDown(e) {
    // Phím P để tạm dừng - hoạt động bất cứ lúc nào đang chơi
    if (e.key === "p" || e.key === "P") {
      this.togglePause();
      return;
    }

    // Các phím còn lại chỉ có tác dụng khi đang chơi
    if (this.state !== "playing") return;

    switch (e.key) {
      case "ArrowLeft":
        this.keys.left = true;
        break;
      case "ArrowRight":
        this.keys.right = true;
        break;
      case " ": // phím Space
      case "Spacebar": // tên phím cũ trên một số trình duyệt
        e.preventDefault(); // chặn cuộn trang khi nhấn Space
        this.fireBullet();
        break;
    }
  }

  /**
   * Xử lý khi nhả phím: tắt cờ di chuyển tương ứng.
   * @param {KeyboardEvent} e
   */
  handleKeyUp(e) {
    if (e.key === "ArrowLeft") this.keys.left = false;
    if (e.key === "ArrowRight") this.keys.right = false;
  }

  /**
   * Bắn một viên đạn nếu đã hết thời gian hồi (cooldown).
   * Giúp tránh việc giữ Space tạo ra quá nhiều đạn cùng lúc.
   */
  fireBullet() {
    if (this.shootCooldown > 0) return;
    this.bullets.push(this.spaceship.shoot());
    this.shootCooldown = this.shootInterval; // nạp lại thời gian hồi
  }

  // ============================================================
  // GAME LOOP - TRÁI TIM CỦA TRÒ CHƠI
  // ============================================================

  /**
   * Vòng lặp game chạy ~60 lần/giây nhờ requestAnimationFrame.
   * Mỗi khung hình thực hiện 3 việc theo thứ tự:
   *   1) update()  -> cập nhật vị trí mọi thực thể + va chạm
   *   2) draw()    -> vẽ lại toàn bộ khung hình
   *   3) gọi lại requestAnimationFrame để lặp tiếp
   * Nếu đang pause/gameover thì dừng yêu cầu khung hình tiếp theo.
   */
  gameLoop() {
    if (this.state !== "playing") return; // dừng vòng lặp khi không chơi

    this.update();
    this.draw();

    // Lên lịch cho khung hình kế tiếp
    this.animationId = requestAnimationFrame(this.gameLoop);
  }

  /**
   * Cập nhật logic toàn bộ thực thể trong một khung hình.
   */
  update() {
    // --- 1) Giảm cooldown bắn đạn mỗi khung hình ---
    if (this.shootCooldown > 0) this.shootCooldown--;

    // --- 2) Di chuyển phi thuyền dựa trên phím đang giữ ---
    if (this.keys.left) this.spaceship.move(-1, this.width);
    if (this.keys.right) this.spaceship.move(1, this.width);

    // --- 3) Cập nhật đạn và loại bỏ đạn ra khỏi màn hình ---
    // Duyệt từ cuối mảng về đầu để splice không làm lệch chỉ số.
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.update();
      if (bullet.isOffScreen(this.height)) {
        this.bullets.splice(i, 1); // xóa đạn -> tối ưu bộ nhớ
      }
    }

    // --- 4) Cập nhật đàn quái vật (di chuyển ngang, chạm tường thì hạ xuống) ---
    this.updateAliens();

    // --- 5) Kiểm tra va chạm đạn <-> quái vật ---
    this.handleBulletAlienCollisions();

    // --- 6) Kiểm tra điều kiện thua / thắng ---
    this.checkLoseCondition();
    this.checkWinCondition();
  }

  /**
   * Cập nhật chuyển động của cả đàn quái vật.
   * Cơ chế cổ điển: cả đàn trượt ngang cùng hướng; khi con ngoài cùng
   * chạm mép canvas thì TẤT CẢ hạ xuống một bậc và đảo hướng.
   */
  updateAliens() {
    if (this.aliens.length === 0) return;

    // Tìm mép trái và mép phải hiện tại của cả đàn
    let minX = Infinity;
    let maxX = -Infinity;
    for (const alien of this.aliens) {
      if (alien.x < minX) minX = alien.x;
      if (alien.x + alien.width > maxX) maxX = alien.x + alien.width;
    }

    // Kiểm tra xem bước di chuyển tiếp theo có chạm tường không
    const nextMinX = minX + this.alienDirection * this.alienSpeed;
    const nextMaxX = maxX + this.alienDirection * this.alienSpeed;
    const hitWall = nextMinX <= 0 || nextMaxX >= this.width;

    let dx = this.alienDirection * this.alienSpeed;
    let dy = 0;

    if (hitWall) {
      // Chạm tường: hạ xuống một bậc và đảo hướng cho khung hình kế tiếp
      dx = 0;
      dy = this.alienDropDistance;
      this.alienDirection *= -1;
    }

    // Áp dụng dịch chuyển cho từng quái vật
    for (const alien of this.aliens) {
      alien.update(dx, dy);
    }
  }

  // ============================================================
  // VA CHẠM - THUẬT TOÁN AABB
  // ============================================================

  /**
   * Kiểm tra va chạm giữa 2 hình chữ nhật bằng thuật toán AABB
   * (Axis-Aligned Bounding Box - hộp bao thẳng trục).
   *
   * Ý tưởng: hai hình chữ nhật (không xoay) CHỒNG nhau khi và chỉ khi
   * chúng chồng nhau trên CẢ trục X lẫn trục Y.
   *
   * Trên trục X, A và B chồng nhau khi:
   *   - mép trái của A nằm bên trái mép phải của B  (a.x < b.x + b.width)
   *   - VÀ mép phải của A nằm bên phải mép trái của B (a.x + a.width > b.x)
   * Tương tự cho trục Y với chiều cao.
   *
   * Nếu cả 4 điều kiện đều đúng -> hai hình chạm nhau.
   *
   * @param {{x:number,y:number,width:number,height:number}} a
   * @param {{x:number,y:number,width:number,height:number}} b
   * @returns {boolean} true nếu a và b chồng lên nhau
   */
  checkCollision(a, b) {
    return (
      a.x < b.x + b.width && // mép trái A < mép phải B
      a.x + a.width > b.x && // mép phải A > mép trái B
      a.y < b.y + b.height && // mép trên A < mép dưới B
      a.y + a.height > b.y // mép dưới A > mép trên B
    );
  }

  /**
   * Duyệt mọi cặp (đạn, quái vật) để phát hiện va chạm.
   * Khi trúng: xóa cả đạn lẫn quái vật và cộng điểm.
   */
  handleBulletAlienCollisions() {
    // Duyệt ngược cả hai mảng để splice an toàn (không lệch chỉ số).
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];

      for (let j = this.aliens.length - 1; j >= 0; j--) {
        const alien = this.aliens[j];

        if (this.checkCollision(bullet, alien)) {
          // Trúng đích: xóa đạn, xóa quái vật, cộng 10 điểm
          this.bullets.splice(i, 1);
          this.aliens.splice(j, 1);
          this.score += 10;
          this.updateScoreUI();
          break; // viên đạn này đã nổ, không xét quái vật khác nữa
        }
      }
    }
  }

  /**
   * Điều kiện THUA: quái vật chạm vào phi thuyền hoặc chạm đáy canvas.
   */
  checkLoseCondition() {
    for (const alien of this.aliens) {
      const reachedBottom = alien.y + alien.height >= this.height;
      const hitSpaceship = this.checkCollision(alien, this.spaceship);

      if (reachedBottom || hitSpaceship) {
        this.gameOver();
        return;
      }
    }
  }

  /**
   * Điều kiện THẮNG: tiêu diệt hết quái vật -> sinh lưới mới khó hơn
   * (tăng tốc độ một chút để game có chiều sâu).
   */
  checkWinCondition() {
    if (this.aliens.length === 0) {
      this.alienSpeed += 0.4; // tăng độ khó
      this.createAlienGrid();
    }
  }

  // ============================================================
  // RENDER (VẼ)
  // ============================================================

  /**
   * Vẽ lại toàn bộ khung hình: xóa nền rồi vẽ mọi thực thể.
   */
  draw() {
    // Xóa toàn bộ canvas trước khi vẽ khung hình mới
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Vẽ phi thuyền
    this.spaceship.draw(this.ctx);

    // Vẽ tất cả viên đạn
    for (const bullet of this.bullets) {
      bullet.draw(this.ctx);
    }

    // Vẽ tất cả quái vật
    for (const alien of this.aliens) {
      alien.draw(this.ctx);
    }
  }

  // ============================================================
  // TIỆN ÍCH GIAO DIỆN
  // ============================================================

  /** Đồng bộ điểm số hiện tại lên giao diện. */
  updateScoreUI() {
    this.scoreEl.textContent = this.score;
  }
}
