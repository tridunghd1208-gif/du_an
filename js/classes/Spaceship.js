// ============================================================
// Spaceship.js - Class đại diện cho phi thuyền của người chơi
// ============================================================

import { Bullet } from "./Bullet.js";

/**
 * Lớp Spaceship quản lý phi thuyền người chơi điều khiển.
 * Bao gồm: tọa độ, kích thước, vận tốc, và các hành vi
 * draw() (vẽ), move() (di chuyển), shoot() (bắn đạn).
 */
export class Spaceship {
  /**
   * @param {number} canvasWidth  - Chiều rộng canvas (để đặt phi thuyền vào giữa)
   * @param {number} canvasHeight - Chiều cao canvas (để đặt phi thuyền sát đáy)
   */
  constructor(canvasWidth, canvasHeight) {
    this.width = 48;
    this.height = 28;
    this.speed = 6; // số pixel di chuyển mỗi khung hình

    // Đặt phi thuyền ở giữa theo chiều ngang và cách đáy 20px
    this.x = canvasWidth / 2 - this.width / 2;
    this.y = canvasHeight - this.height - 20;

    this.color = "#57f5c4";
  }

  /**
   * Vẽ phi thuyền lên canvas dưới dạng hình tam giác cụt + bệ.
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    ctx.fillStyle = this.color;

    // Thân chính (hình thang hướng lên trên) vẽ bằng path
    ctx.beginPath();
    ctx.moveTo(this.x + this.width / 2, this.y); // đỉnh mũi tàu
    ctx.lineTo(this.x + this.width, this.y + this.height); // góc phải dưới
    ctx.lineTo(this.x, this.y + this.height); // góc trái dưới
    ctx.closePath();
    ctx.fill();

    // Buồng lái nhỏ ở giữa cho đẹp mắt
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(
      this.x + this.width / 2 - 4,
      this.y + this.height / 2,
      8,
      8
    );
  }

  /**
   * Di chuyển phi thuyền sang trái/phải và chặn không cho vượt viền canvas.
   * @param {number} direction   - -1 đi trái, +1 đi phải
   * @param {number} canvasWidth - chiều rộng canvas để giới hạn biên
   */
  move(direction, canvasWidth) {
    this.x += direction * this.speed;

    // Chặn biên trái: không cho x nhỏ hơn 0
    if (this.x < 0) {
      this.x = 0;
    }

    // Chặn biên phải: không cho mép phải vượt quá chiều rộng canvas
    if (this.x + this.width > canvasWidth) {
      this.x = canvasWidth - this.width;
    }
  }

  /**
   * Tạo và trả về một viên đạn mới bắn ra từ mũi phi thuyền.
   * Đạn bay LÊN trên nên truyền speed âm.
   * @returns {Bullet}
   */
  shoot() {
    const bulletWidth = 4;
    const bulletX = this.x + this.width / 2 - bulletWidth / 2; // canh giữa phi thuyền
    const bulletY = this.y; // xuất phát từ mũi tàu
    return new Bullet(bulletX, bulletY, -8); // speed âm = bay lên
  }
}
