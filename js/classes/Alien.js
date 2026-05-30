// ============================================================
// Alien.js - Class đại diện cho quái vật ngoài hành tinh
// ============================================================

/**
 * Lớp Alien đại diện cho một con quái vật trong lưới.
 * Việc đổi hướng và hạ xuống do Game điều phối chung cho cả đàn,
 * còn mỗi Alien chỉ chịu trách nhiệm cập nhật tọa độ và tự vẽ chính nó.
 */
export class Alien {
  /**
   * @param {number} x - tọa độ X ban đầu trong lưới
   * @param {number} y - tọa độ Y ban đầu trong lưới
   */
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 36;
    this.height = 26;
    this.color = "#ff5d73";
  }

  /**
   * Cập nhật vị trí quái vật.
   * @param {number} dx - dịch chuyển ngang trong khung hình này
   * @param {number} dy - dịch chuyển xuống (chỉ khác 0 khi cả đàn chạm tường)
   */
  update(dx, dy) {
    this.x += dx;
    this.y += dy;
  }

  /**
   * Vẽ quái vật dạng "con bọ không gian" cổ điển bằng vài hình chữ nhật.
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    ctx.fillStyle = this.color;

    // Thân chính
    ctx.fillRect(this.x, this.y + 6, this.width, this.height - 10);

    // Hai "chân" hai bên
    ctx.fillRect(this.x, this.y + this.height - 6, 8, 6);
    ctx.fillRect(this.x + this.width - 8, this.y + this.height - 6, 8, 6);

    // Hai mắt màu nền tối để tạo cảm giác có khuôn mặt
    ctx.fillStyle = "#02030a";
    ctx.fillRect(this.x + 8, this.y + 12, 6, 6);
    ctx.fillRect(this.x + this.width - 14, this.y + 12, 6, 6);
  }
}
