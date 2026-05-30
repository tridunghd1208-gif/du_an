// ============================================================
// Bullet.js - Class đại diện cho viên đạn
// ============================================================

/**
 * Lớp Bullet đại diện cho một viên đạn.
 * speed > 0: bay xuống; speed < 0: bay lên.
 * Nhờ vậy có thể tái sử dụng cho cả đạn người chơi lẫn (sau này) đạn địch.
 */
export class Bullet {
  /**
   * @param {number} x     - tọa độ X ban đầu
   * @param {number} y     - tọa độ Y ban đầu
   * @param {number} speed - vận tốc theo trục Y (âm = lên, dương = xuống)
   */
  constructor(x, y, speed) {
    this.x = x;
    this.y = y;
    this.width = 4;
    this.height = 14;
    this.speed = speed;
    this.color = "#ffd166";
  }

  /**
   * Cập nhật vị trí viên đạn theo từng khung hình.
   * Chỉ cộng dồn vận tốc vào trục Y.
   */
  update() {
    this.y += this.speed;
  }

  /**
   * Vẽ viên đạn dưới dạng hình chữ nhật nhỏ.
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  /**
   * Kiểm tra viên đạn đã bay ra khỏi canvas hay chưa.
   * Dùng để Game xóa đạn khỏi mảng nhằm tối ưu bộ nhớ.
   * @param {number} canvasHeight
   * @returns {boolean} true nếu đạn nằm ngoài màn hình
   */
  isOffScreen(canvasHeight) {
    // Ra khỏi mép trên (đạn người chơi) hoặc mép dưới (đạn địch)
    return this.y + this.height < 0 || this.y > canvasHeight;
  }
}
