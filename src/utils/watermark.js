export function formatDateTimeVN(dateObj = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const d = pad(dateObj.getDate());
  const m = pad(dateObj.getMonth() + 1);
  const y = dateObj.getFullYear();
  const hh = pad(dateObj.getHours());
  const mm = pad(dateObj.getMinutes());
  const ss = pad(dateObj.getSeconds());
  return `${d}/${m}/${y} ${hh}:${mm}:${ss}`;
}

/**
 * Đóng dấu (burn watermark) giờ chụp + tọa độ GPS + tên Xã/Phường lên Canvas
 */
export function drawWatermarkOnCanvas(ctx, width, height, { lat, lng, accuracy, timestampStr, wardName, categoryName }) {
  const boxHeight = 112;
  const boxY = height - boxHeight - 12;
  const boxX = 12;
  const boxWidth = width - 24;

  ctx.save();
  // Khung nền đen bán trong suốt cao cấp
  ctx.fillStyle = 'rgba(10, 10, 10, 0.90)';
  ctx.strokeStyle = '#525252';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 8);
  ctx.fill();
  ctx.stroke();

  // Tiêu đề hệ thống
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('HỆ THỐNG XÁC THỰC HIỆN TRƯỜNG — ĐỒNG NAI SMART CITY', boxX + 16, boxY + 24);

  // Tọa độ GPS
  ctx.fillStyle = '#e5e5e5';
  ctx.font = '13px monospace';
  ctx.fillText(
    `GPS: ${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)} (Sai số: ±${accuracy || 5}m)`,
    boxX + 16,
    boxY + 48
  );

  // Thời gian chụp
  ctx.fillStyle = '#d4d4d4';
  ctx.font = 'bold 13px monospace';
  ctx.fillText(`THỜI GIAN: ${timestampStr}`, boxX + 16, boxY + 72);

  // Địa bàn & phân loại
  ctx.fillStyle = '#a3a3a3';
  ctx.font = '12px sans-serif';
  ctx.fillText(`ĐỊA BÀN: ${wardName}  |  HẠNG MỤC: ${categoryName}`, boxX + 16, boxY + 95);
  ctx.restore();
}

/**
 * Tạo ảnh chụp giả lập từ Camera khi thiết bị không có webcam hoặc người dùng bấm chụp thử nghiệm nhanh
 */
export function generateSimulatedCameraCapture({ lat, lng, accuracy, timestampStr, wardName, categoryName }) {
  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');

  // Nền xám/đen gradient chuyên nghiệp
  const grad = ctx.createLinearGradient(0, 0, 0, 480);
  grad.addColorStop(0, '#171717');
  grad.addColorStop(0.55, '#262626');
  grad.addColorStop(1, '#0a0a0a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 720, 480);

  // Vẽ mặt đường phối cảnh tone xám
  ctx.fillStyle = '#1c1c1c';
  ctx.beginPath();
  ctx.moveTo(0, 340);
  ctx.lineTo(260, 220);
  ctx.lineTo(460, 220);
  ctx.lineTo(720, 340);
  ctx.lineTo(720, 480);
  ctx.lineTo(0, 480);
  ctx.closePath();
  ctx.fill();

  // Vạch kẻ đường trắng mờ
  ctx.strokeStyle = '#737373';
  ctx.lineWidth = 4;
  ctx.setLineDash([18, 14]);
  ctx.beginPath();
  ctx.moveTo(360, 225);
  ctx.lineTo(360, 480);
  ctx.stroke();
  ctx.setLineDash([]);

  // Khung ngắm Camera tối giản
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(230, 90, 260, 160);
  ctx.beginPath();
  ctx.arc(360, 170, 24, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#f5f5f5';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`HIỆN TRƯỜNG GHI NHẬN: ${categoryName.toUpperCase()}`, 360, 60);
  ctx.textAlign = 'left';

  drawWatermarkOnCanvas(ctx, 720, 480, {
    lat,
    lng,
    accuracy,
    timestampStr,
    wardName,
    categoryName
  });

  return canvas.toDataURL('image/jpeg', 0.90);
}
