// ============================================================
// main.js - Điểm khởi động (entry point) của ứng dụng
// Nhiệm vụ: lấy canvas, khởi tạo Game và gắn sự kiện cho các nút.
// ============================================================

import { Game } from "./classes/Game.js";

// Chờ DOM tải xong rồi mới truy cập các phần tử để chắc chắn không bị null
window.addEventListener("DOMContentLoaded", () => {
  // Lấy thẻ canvas dùng để vẽ game
  const canvas = document.getElementById("gameCanvas");

  // Tạo một thực thể Game duy nhất cho toàn bộ ứng dụng
  const game = new Game(canvas);

  // Nút "Bắt đầu" trên màn hình Start
  const startButton = document.getElementById("startButton");
  startButton.addEventListener("click", () => game.start());

  // Nút "Chơi lại" trên màn hình Game Over
  const restartButton = document.getElementById("restartButton");
  restartButton.addEventListener("click", () => game.start());
});
