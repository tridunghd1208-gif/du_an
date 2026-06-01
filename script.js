// ============================================================
// script.js - Toàn bộ code game Space Invaders
// Viết bằng JavaScript thuần, dùng class của ES6.
// Đọc từ trên xuống dưới: 4 class trước, phần khởi động ở cuối.
// ============================================================

// Lấy thẻ canvas trong HTML và "bút vẽ" (context) để vẽ lên nó
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Lấy các ô hiển thị điểm số / đợt trên trang
const scoreText = document.getElementById("score");
const highScoreText = document.getElementById("highScore");
const waveText = document.getElementById("wave");



// ============================================================
// CLASS 1: Spaceship - Phi thuyền của người chơi
// ============================================================
class Spaceship {
  constructor() {
    this.width = 50;
    this.height = 30;
    // Đặt phi thuyền ở giữa theo chiều ngang và sát đáy canvas
    this.x = canvas.width / 2 - this.width / 2;
    this.y = canvas.height - this.height - 10;
    this.speed = 5; // số pixel di chuyển mỗi lần
  }

  // Vẽ phi thuyền (một hình chữ nhật màu xanh)
  draw() {
    ctx.fillStyle = "#57f5c4";
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  // Di chuyển sang trái hoặc phải, không cho ra khỏi viền canvas
  move(direction) {
    this.x = this.x + direction * this.speed;

    // Chặn không cho đi quá mép trái
    if (this.x < 0) {
      this.x = 0;
    }
    // Chặn không cho đi quá mép phải
    if (this.x + this.width > canvas.width) {
      this.x = canvas.width - this.width;
    }
  }

  // Bắn đạn: tạo ra một viên đạn mới từ giữa phi thuyền
  shoot() {
    const bulletX = this.x + this.width / 2;
    const bulletY = this.y;
    return new Bullet(bulletX, bulletY);
  }
}


// ============================================================
// CLASS 2: Bullet - Viên đạn
// ============================================================
class Bullet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 4;
    this.height = 12;
    this.speed = 7; // tốc độ bay
  }

  // Vẽ viên đạn (hình chữ nhật nhỏ màu vàng)
  draw() {
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  // Cập nhật vị trí: đạn bay lên trên nên trừ dần tọa độ y
  update() {
    this.y = this.y - this.speed;
  }
}


// ============================================================
// CLASS 3: Alien - Quái vật
// ============================================================
class Alien {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 36;
    this.height = 26;
  }

  // Vẽ quái vật (hình chữ nhật màu đỏ)
  draw() {
    ctx.fillStyle = "#ff5d73";
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  // Cập nhật vị trí: di chuyển ngang dx và xuống dưới dy
  update(dx, dy) {
    this.x = this.x + dx;
    this.y = this.y + dy;
  }
}


// ============================================================
// CLASS 4: Game - Quản lý toàn bộ trò chơi
// ============================================================
class Game {
  constructor() {
    this.spaceship = new Spaceship(); // phi thuyền người chơi
    this.bullets = [];                // mảng chứa các viên đạn
    this.aliens = [];                 // mảng chứa các quái vật

    this.score = 0;
    // Đọc điểm cao nhất đã lưu trong trình duyệt (nếu chưa có thì là 0)
    this.highScore = Number(localStorage.getItem("highScore")) || 0;

    this.isGameOver = false;

    this.wave = 1;           // đợt quái hiện tại (tăng dần khi diệt sạch)
    this.alienDirection = 1; // 1 = đi sang phải, -1 = đi sang trái
    this.alienSpeed = 1;     // tốc độ đi ngang của quái vật

    // Ghi nhớ phím trái/phải có đang được giữ hay không
    this.leftPressed = false;
    this.rightPressed = false;

    this.createAliens(); // tạo lưới quái vật
    this.setupKeyboard(); // cài đặt bắt sự kiện bàn phím

    // Hiện điểm cao nhất và đợt lên màn hình ngay từ đầu
    highScoreText.textContent = this.highScore;
    waveText.textContent = this.wave;
  }


  // Tạo lưới quái vật 4 hàng x 8 cột
  createAliens() {
    const rows = 4;
    const cols = 8;
    const startX = 60; // vị trí bắt đầu theo chiều ngang
    const startY = 40; // vị trí bắt đầu theo chiều dọc
    const gap = 20;    // khoảng cách giữa các quái vật

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = startX + col * (36 + gap);
        const y = startY + row * (26 + gap);
        this.aliens.push(new Alien(x, y));
      }
    }
  }

  // Bắt sự kiện bàn phím (nhấn và nhả phím)
  setupKeyboard() {
    // Khi NHẤN phím xuống
    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") {
        this.leftPressed = true;
      }
      if (e.key === "ArrowRight") {
        this.rightPressed = true;
      }
      if (e.key === " ") {
        e.preventDefault(); // không cho trang cuộn khi nhấn Space
        // Chỉ bắn khi đang chơi
        if (this.isGameOver === false) {
          this.bullets.push(this.spaceship.shoot());
        }
      }
    });

    // Khi NHẢ phím ra
    document.addEventListener("keyup", (e) => {
      if (e.key === "ArrowLeft") {
        this.leftPressed = false;
      }
      if (e.key === "ArrowRight") {
        this.rightPressed = false;
      }
    });
  }

  // --------------------------------------------------------
  // Hàm kiểm tra va chạm bằng thuật toán AABB
  // (Axis-Aligned Bounding Box = hộp chữ nhật thẳng trục)
  //
  // Hai hình chữ nhật chạm nhau khi chúng đè lên nhau
  // trên CẢ chiều ngang VÀ chiều dọc. Bốn điều kiện dưới đây
  // kiểm tra đúng điều đó:
  // --------------------------------------------------------
  isColliding(a, b) {
    return (
      a.x < b.x + b.width &&   // cạnh trái của a nằm bên trái cạnh phải của b
      a.x + a.width > b.x &&   // cạnh phải của a nằm bên phải cạnh trái của b
      a.y < b.y + b.height &&  // cạnh trên của a nằm trên cạnh dưới của b
      a.y + a.height > b.y     // cạnh dưới của a nằm dưới cạnh trên của b
    );
  }

  // Cập nhật toàn bộ trạng thái game trong một khung hình
  update() {
    // 1) Di chuyển phi thuyền theo phím đang giữ
    if (this.leftPressed === true) {
      this.spaceship.move(-1);
    }
    if (this.rightPressed === true) {
      this.spaceship.move(1);
    }

    // 2) Cập nhật từng viên đạn
    for (let i = 0; i < this.bullets.length; i++) {
      this.bullets[i].update();
    }
    // Xóa những viên đạn đã bay ra khỏi màn hình (để tiết kiệm bộ nhớ)
    this.bullets = this.bullets.filter((bullet) => bullet.y + bullet.height > 0);

    // 3) Di chuyển cả đàn quái vật
    this.moveAliens();

    // 4) Kiểm tra đạn có trúng quái vật không
    this.checkBulletHits();

    // 5) Diệt sạch quái thì sinh đợt mới (chơi liên tục)
    if (this.aliens.length === 0) {
      this.nextWave();
    }

    // 6) Kiểm tra điều kiện thua
    this.checkGameOver();
  }

  // Sinh đợt quái mới: tăng đợt, tăng tốc độ và tạo lại lưới quái
  nextWave() {
    this.wave = this.wave + 1;
    waveText.textContent = this.wave;

    // Mỗi đợt quái đi nhanh hơn một chút để khó dần (giới hạn để không quá nhanh)
    this.alienSpeed = Math.min(this.alienSpeed + 0.5, 6);

    // Đặt lại hướng đi và xóa hết đạn còn lại trên màn hình
    this.alienDirection = 1;
    this.bullets = [];

    // Tạo lưới quái mới ở vị trí trên cùng như ban đầu
    this.createAliens();
  }


  // Di chuyển đàn quái vật qua lại, chạm tường thì hạ xuống một bậc
  moveAliens() {
    let hitWall = false;

    // Kiểm tra xem có con nào sắp chạm mép trái/phải không
    for (let i = 0; i < this.aliens.length; i++) {
      const alien = this.aliens[i];
      const nextX = alien.x + this.alienDirection * this.alienSpeed;
      if (nextX < 0 || nextX + alien.width > canvas.width) {
        hitWall = true;
        break;
      }
    }

    if (hitWall === true) {
      // Chạm tường: tất cả hạ xuống 20px và đổi hướng
      for (let i = 0; i < this.aliens.length; i++) {
        this.aliens[i].update(0, 20);
      }
      this.alienDirection = this.alienDirection * -1;
    } else {
      // Chưa chạm tường: tiếp tục đi ngang
      for (let i = 0; i < this.aliens.length; i++) {
        this.aliens[i].update(this.alienDirection * this.alienSpeed, 0);
      }
    }
  }

  // Kiểm tra từng viên đạn xem có trúng quái vật nào không
  checkBulletHits() {
    for (let i = 0; i < this.bullets.length; i++) {
      for (let j = 0; j < this.aliens.length; j++) {
        if (this.isColliding(this.bullets[i], this.aliens[j])) {
          // Trúng rồi: xóa viên đạn này và con quái vật này
          this.bullets.splice(i, 1);
          this.aliens.splice(j, 1);
          // Cộng 10 điểm và cập nhật lên màn hình
          this.score = this.score + 10;
          scoreText.textContent = this.score;
          // Dừng vòng lặp đạn này lại vì nó đã bị xóa
          break;
        }
      }
    }
  }

  // Kiểm tra điều kiện thua: quái vật chạm phi thuyền hoặc chạm đáy
  checkGameOver() {
    for (let i = 0; i < this.aliens.length; i++) {
      const alien = this.aliens[i];
      const chamDay = alien.y + alien.height >= canvas.height;
      const chamPhiThuyen = this.isColliding(alien, this.spaceship);

      if (chamDay === true || chamPhiThuyen === true) {
        this.gameOver();
        return;
      }
    }
  }

  // Xử lý khi thua: lưu điểm cao nhất vào localStorage
  gameOver() {
    this.isGameOver = true;

    // Nếu điểm hiện tại cao hơn kỷ lục thì lưu lại
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem("highScore", this.highScore);
      highScoreText.textContent = this.highScore;
    }
  }

  // Vẽ lại toàn bộ màn hình
  draw() {
    // Xóa sạch canvas trước khi vẽ khung hình mới
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Vẽ phi thuyền
    this.spaceship.draw();

    // Vẽ tất cả viên đạn
    for (let i = 0; i < this.bullets.length; i++) {
      this.bullets[i].draw();
    }

    // Vẽ tất cả quái vật
    for (let i = 0; i < this.aliens.length; i++) {
      this.aliens[i].draw();
    }

    // Nếu thua thì hiện chữ GAME OVER giữa màn hình
    if (this.isGameOver === true) {
      ctx.fillStyle = "white";
      ctx.font = "40px Arial";
      ctx.textAlign = "center";
      ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
      ctx.font = "20px Arial";
      ctx.fillText("Nhấn F5 để chơi lại", canvas.width / 2, canvas.height / 2 + 40);
    }
  }

  // --------------------------------------------------------
  // Vòng lặp game (Game Loop)
  // requestAnimationFrame gọi lại hàm này khoảng 60 lần/giây,
  // tạo cảm giác chuyển động mượt mà.
  // --------------------------------------------------------
  loop() {
    if (this.isGameOver === false) {
      this.update(); // cập nhật vị trí, va chạm...
    }
    this.draw();     // vẽ lại màn hình

    // Yêu cầu trình duyệt gọi lại loop ở khung hình tiếp theo
    requestAnimationFrame(() => this.loop());
  }
}


// ============================================================
// KHỞI ĐỘNG GAME
// ------------------------------------------------------------
// Game KHÔNG tự chạy ngay nữa. Hàm startGame() sẽ được auth.js
// gọi sau khi người dùng đăng nhập thành công.
// ============================================================
window.startGame = function () {
  const game = new Game();
  game.loop();
};


