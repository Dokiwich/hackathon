// Danh mục 95 Xã/Phường sau sáp nhập
export const CLUSTERS = [
  { area: 'Khu vực Biên Hòa', baseLat: 10.9574, baseLng: 106.8426, wards: [
    'Phường Trấn Biên', 'Phường Biên Hòa', 'Phường Tam Hiệp', 'Phường Long Bình',
    'Phường Tân Phong', 'Phường Hố Nai', 'Phường Trảng Dài', 'Phường Tân Biên',
    'Phường Bửu Long', 'Phường Quang Vinh', 'Phường Tân Mai', 'Phường Thống Nhất',
    'Phường Hiệp Hòa', 'Phường An Bình', 'Phường Bình Đa', 'Phường Tam Hòa',
    'Phường Tân Hiệp', 'Phường Tân Tiến', 'Phường Tân Vạn', 'Phường Bửu Hòa',
    'Phường Hóa An', 'Phường Tân Hạnh', 'Phường Phước Tân', 'Phường Tam Phước',
    'Xã Long Hưng'
  ]},
  { area: 'Khu vực Long Khánh', baseLat: 10.9333, baseLng: 107.2428, wards: [
    'Phường Xuân An', 'Phường Xuân Bình', 'Phường Xuân Hòa', 'Phường Xuân Trung',
    'Phường Xuân Thanh', 'Phường Xuân Tân', 'Phường Phú Bình', 'Phường Bàu Sen',
    'Phường Suối Tre', 'Xã Bảo Vinh', 'Xã Bàu Trâm', 'Xã Bình Lộc', 'Xã Bảo Quang', 'Xã Hàng Gòn'
  ]},
  { area: 'Khu vực Long Thành', baseLat: 10.7883, baseLng: 106.9531, wards: [
    'Phường Long Thành', 'Xã An Phước', 'Xã Bình An', 'Xã Bình Sơn',
    'Xã Cẩm Đường', 'Xã Lộc An', 'Xã Long An', 'Xã Long Đức',
    'Xã Long Phước', 'Xã Phước Bình', 'Xã Phước Thái', 'Xã Tam An', 'Xã Tân Hiệp (LT)'
  ]},
  { area: 'Khu vực Nhơn Trạch', baseLat: 10.7336, baseLng: 106.8797, wards: [
    'Phường Hiệp Phước', 'Xã Đại Phước', 'Xã Long Tân', 'Xã Long Thọ',
    'Xã Phú Đông', 'Xã Phú Hội', 'Xã Phú Hữu', 'Xã Phú Thạnh',
    'Xã Phước An', 'Xã Phước Khánh', 'Xã Phước Thiền', 'Xã Vĩnh Thanh'
  ]},
  { area: 'Khu vực Trảng Bom', baseLat: 10.9547, baseLng: 107.0058, wards: [
    'Phường Trảng Bom', 'Xã An Viễn', 'Xã Bắc Sơn', 'Xã Bàu Hàm',
    'Xã Bình Minh', 'Xã Đồi 61', 'Xã Giang Điền', 'Xã Hố Nai 3',
    'Xã Quảng Tiến', 'Xã Sông Thao', 'Xã Sông Trầu', 'Xã Tây Hòa'
  ]},
  { area: 'Khu vực Vĩnh Cửu & Thống Nhất', baseLat: 11.0631, baseLng: 106.9358, wards: [
    'Phường Vĩnh An', 'Xã Bình Lợi', 'Xã Thạnh Phú', 'Xã Thiện Tân',
    'Xã Trị An', 'Xã Tân An', 'Phường Dầu Giây', 'Xã Bàu Hàm 2',
    'Xã Gia Tân 1', 'Xã Gia Tân 2', 'Xã Gia Tân 3', 'Xã Quang Trung'
  ]},
  { area: 'Khu vực Xuân Lộc, Cẩm Mỹ, Định Quán, Tân Phú', baseLat: 10.9255, baseLng: 107.4021, wards: [
    'Phường Gia Ray', 'Xã Xuân Hiệp', 'Xã Xuân Tâm', 'Xã Xuân Trường',
    'Phường Long Giao', 'Xã Nhân Nghĩa', 'Xã Sông Nhạn',
    'Phường Định Quán', 'Xã Gia Canh', 'Xã Phú Ngọc', 'Xã La Ngà',
    'Phường Tân Phú', 'Xã Phú Lâm', 'Xã Trà Cổ'
  ]}
];

export const WARDS_95 = [];
let idx = 1;
CLUSTERS.forEach((cluster) => {
  cluster.wards.forEach((name, i) => {
    const angle = (i / cluster.wards.length) * Math.PI * 2;
    const radius = 0.012 + (i % 4) * 0.009;
    const lat = Number((cluster.baseLat + Math.sin(angle) * radius).toFixed(6));
    const lng = Number((cluster.baseLng + Math.cos(angle) * radius).toFixed(6));
    WARDS_95.push({
      id: `WARD-${String(idx).padStart(2, '0')}`,
      code: idx,
      name,
      area: cluster.area,
      lat,
      lng
    });
    idx++;
  });
});

export const CATEGORIES = [
  { id: 'pothole', name: 'Ổ gà / Mặt đường hư hỏng', icon: 'AlertTriangle', color: '#0f172a', slaHours: 24 },
  { id: 'streetlight', name: 'Đèn đường hỏng / Chiếu sáng', icon: 'LightbulbOff', color: '#334155', slaHours: 12 },
  { id: 'garbage', name: 'Rác thải tồn đọng / Ô nhiễm', icon: 'Trash2', color: '#475569', slaHours: 8 },
  { id: 'flooding', name: 'Ngập nước / Cống thoát nước', icon: 'CloudRain', color: '#0369a1', slaHours: 12 },
  { id: 'tree_electric', name: 'Cây ngã đổ / Dây điện võng', icon: 'Zap', color: '#0f172a', slaHours: 6 },
  { id: 'other', name: 'Mục khác', icon: 'MoreHorizontal', color: '#64748b', slaHours: 24 }
];

export const URGENCY_LEVELS = {
  urgent: {
    id: 'urgent',
    label: 'Gấp',
    desc: 'Ưu tiên khẩn cấp, xử lý ngay',
    badgeClass: 'bg-slate-200 text-slate-900 border-slate-400',
    activeClass: 'bg-slate-200 text-slate-950 border-slate-500 ring-2 ring-slate-400/50 font-bold',
    dotColor: '#0f172a'
  },
  medium: {
    id: 'medium',
    label: 'Vừa',
    desc: 'Xử lý tiêu chuẩn trong ngày',
    badgeClass: 'bg-sky-50 text-sky-900 border-sky-300',
    activeClass: 'bg-slate-200 text-slate-950 border-slate-500 ring-2 ring-slate-400/50 font-bold',
    dotColor: '#0284c7'
  },
  slow: {
    id: 'slow',
    label: 'Chậm',
    desc: 'Xử lý định kỳ theo kế hoạch',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    activeClass: 'bg-slate-200 text-slate-950 border-slate-500 ring-2 ring-slate-400/50 font-bold',
    dotColor: '#64748b'
  }
};

export const STATUSES = {
  pending: {
    id: 'pending',
    label: 'Chưa xử lý',
    badgeClass: 'bg-slate-100 text-slate-900 border-slate-400',
    dotColor: '#0f172a'
  },
  processing: {
    id: 'processing',
    label: 'Đang xử lý',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-300',
    dotColor: '#0284c7'
  },
  resolved: {
    id: 'resolved',
    label: 'Đã hoàn tất',
    badgeClass: 'bg-slate-900 text-white border-slate-900',
    dotColor: '#64748b'
  }
};

export const OFFICERS = [
  'Nguyễn Văn Hùng — Tổ Hạ tầng Đô thị',
  'Trần Quốc Tuấn — Đội Chiếu sáng Công cộng',
  'Lê Thị Mỹ Dung — Tổ Môi trường Đô thị',
  'Phạm Minh Đức — Đội Cấp thoát nước',
  'Võ Hoàng Nam — Thanh tra Xây dựng Phường/Xã',
  'Đặng Thanh Tùng — Cán bộ Địa chính - Xây dựng'
];

function createSampleSceneDataUrl({ title, wardName, lat, lng, timestampStr }) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420">
    <rect width="640" height="420" fill="#f8fafc" />
    <rect x="0" y="240" width="640" height="180" fill="#e2e8f0" />
    <line x1="320" y1="240" x2="320" y2="420" stroke="#0284c7" stroke-width="4" stroke-dasharray="14,10"/>
    <circle cx="320" cy="140" r="32" fill="#0f172a" />
    <text x="320" y="146" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="14" font-weight="bold">HIỆN TRƯỜNG</text>
    <text x="320" y="210" text-anchor="middle" fill="#0f172a" font-family="sans-serif" font-size="16" font-weight="bold">${title}</text>
    <rect x="16" y="295" width="608" height="110" rx="8" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>
    <text x="32" y="322" fill="#0284c7" font-family="monospace" font-size="13" font-weight="bold">TAI MẮT CÔNG DÂN ĐỒNG NAI — XÁC THỰC HIỆN TRƯỜNG</text>
    <text x="32" y="348" fill="#0f172a" font-family="monospace" font-size="13">📍 Tọa độ GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)} (±4m)</text>
    <text x="32" y="372" fill="#334155" font-family="monospace" font-size="13">🕒 Thời gian: ${timestampStr}</text>
    <text x="32" y="394" fill="#64748b" font-family="monospace" font-size="12">🏛️ Địa bàn: ${wardName}, Tỉnh Đồng Nai</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function findNearestWard(lat, lng) {
  let best = WARDS_95[0];
  let minDistance = Infinity;
  for (const w of WARDS_95) {
    const dLat = ((w.lat - lat) * Math.PI) / 180;
    const dLng = ((w.lng - lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat * Math.PI) / 180) *
        Math.cos((w.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = 6371 * c;
    if (dist < minDistance) {
      minDistance = dist;
      best = w;
    }
  }
  return best;
}

export const INITIAL_REPORTS = [
  {
    id: 'PA-2026-001',
    title: 'Ổ gà sâu nguy hiểm ngay khúc cua đường Đồng Khởi',
    description: 'Mặt đường bong tróc tạo hố sâu khoảng 15cm rộng 1.2m gây nguy hiểm cho người đi xe máy vào ban đêm.',
    categoryId: 'pothole',
    urgency: 'urgent',
    wardId: 'WARD-03',
    wardName: 'Phường Tam Hiệp',
    lat: 10.949821,
    lng: 106.854112,
    accuracy: 4,
    addressNote: 'Trước số 142 đường Đồng Khởi, KP4, Phường Tam Hiệp',
    status: 'pending',
    reporterName: 'Nguyễn Minh Tâm',
    reporterPhone: '0918 123 456',
    createdAt: '2026-11-14T14:20:00+07:00',
    updatedAt: '2026-11-14T14:20:00+07:00',
    resolvedAt: null,
    processingHours: null,
    assignedOfficer: '',
    progressNote: 'Đã tiếp nhận hồ sơ từ người dân, chờ phân công xử lý.',
    photoUrl: createSampleSceneDataUrl({
      title: 'Ổ gà sâu đường Đồng Khởi',
      wardName: 'Phường Tam Hiệp',
      lat: 10.949821,
      lng: 106.854112,
      timestampStr: '14/11/2026 14:20:00'
    }),
    history: [
      { time: '14/11/2026 14:20', actor: 'Công dân Nguyễn Minh Tâm', note: 'Gửi phản ánh kèm ảnh hiện trường GPS.' }
    ]
  },
  {
    id: 'PA-2026-002',
    title: 'Hàng loạt đèn cao áp tắt tối đen đoạn Võ Thị Sáu',
    description: 'Khoảng 6 trụ đèn chiếu sáng công cộng không hoạt động 2 ngày nay, khu vực đông dân cư qua lại.',
    categoryId: 'streetlight',
    urgency: 'medium',
    wardId: 'WARD-12',
    wardName: 'Phường Thống Nhất',
    lat: 10.953120,
    lng: 106.835410,
    accuracy: 5,
    addressNote: 'Đường Võ Thị Sáu, đoạn gần ngã tư Vincom',
    status: 'processing',
    reporterName: 'Trần Hoàng Phúc',
    reporterPhone: '0909 888 999',
    createdAt: '2026-11-14T08:15:00+07:00',
    updatedAt: '2026-11-14T10:30:00+07:00',
    resolvedAt: null,
    processingHours: null,
    assignedOfficer: 'Trần Quốc Tuấn — Đội Chiếu sáng Công cộng',
    progressNote: 'Đã cử tổ kỹ thuật kiểm tra tủ điều khiển chiếu sáng khu vực.',
    photoUrl: createSampleSceneDataUrl({
      title: 'Mất điện chiếu sáng đường Võ Thị Sáu',
      wardName: 'Phường Thống Nhất',
      lat: 10.953120,
      lng: 106.835410,
      timestampStr: '14/11/2026 08:15:00'
    }),
    history: [
      { time: '14/11/2026 08:15', actor: 'Công dân Trần Hoàng Phúc', note: 'Gửi phản ánh kèm ảnh GPS.' },
      { time: '14/11/2026 10:30', actor: 'UBND Phường Thống Nhất', note: 'Phân công Trần Quốc Tuấn xử lý hiện trường.' }
    ]
  },
  {
    id: 'PA-2026-003',
    title: 'Điểm tập kết rác tự phát tràn xuống lòng đường',
    description: 'Rác sinh hoạt và phế thải xây dựng đổ tràn ra 1/3 mặt đường, bốc mùi hôi nồng nặc.',
    categoryId: 'garbage',
    urgency: 'medium',
    wardId: 'WARD-07',
    wardName: 'Phường Trảng Dài',
    lat: 10.981450,
    lng: 106.863200,
    accuracy: 3,
    addressNote: 'Đường Bùi Trọng Nghĩa, KP3, Phường Trảng Dài',
    status: 'resolved',
    reporterName: 'Lê Ngọc Ánh',
    reporterPhone: '0987 111 222',
    createdAt: '2026-11-13T07:30:00+07:00',
    updatedAt: '2026-11-13T13:00:00+07:00',
    resolvedAt: '2026-11-13T13:00:00+07:00',
    processingHours: 5.5,
    assignedOfficer: 'Lê Thị Mỹ Dung — Tổ Môi trường Đô thị',
    progressNote: 'Đã điều xe ép rác chuyên dụng thu gom sạch 100% và cắm biển cấm đổ rác.',
    photoUrl: createSampleSceneDataUrl({
      title: 'Rác thải tồn đọng đường Bùi Trọng Nghĩa',
      wardName: 'Phường Trảng Dài',
      lat: 10.981450,
      lng: 106.863200,
      timestampStr: '13/11/2026 07:30:00'
    }),
    history: [
      { time: '13/11/2026 07:30', actor: 'Công dân Lê Ngọc Ánh', note: 'Gửi phản ánh.' },
      { time: '13/11/2026 13:00', actor: 'Lê Thị Mỹ Dung', note: 'Nghiệm thu hoàn thành dọn rác (5.5 giờ).' }
    ]
  },
  {
    id: 'PA-2026-004',
    title: 'Ngập nước cục bộ do rác bít miệng cống thoát nước',
    description: 'Mưa lớn làm nước ngập sâu 35cm không thoát kịp do nắp cống bị bùn và túi nilon bít kín.',
    categoryId: 'flooding',
    urgency: 'urgent',
    wardId: 'WARD-04',
    wardName: 'Phường Long Bình',
    lat: 10.937200,
    lng: 106.881900,
    accuracy: 6,
    addressNote: 'Gần vòng xoay Cổng 11, Phường Long Bình',
    status: 'resolved',
    reporterName: 'Phạm Văn Khoa',
    reporterPhone: '0933 604 123',
    createdAt: '2026-11-12T15:00:00+07:00',
    updatedAt: '2026-11-12T19:15:00+07:00',
    resolvedAt: '2026-11-12T19:15:00+07:00',
    processingHours: 4.25,
    assignedOfficer: 'Phạm Minh Đức — Đội Cấp thoát nước',
    progressNote: 'Đã khơi thông miệng thu nước và nạo vét hố ga, nước rút hoàn toàn.',
    photoUrl: createSampleSceneDataUrl({
      title: 'Ngập nước khu vực Cổng 11',
      wardName: 'Phường Long Bình',
      lat: 10.937200,
      lng: 106.881900,
      timestampStr: '12/11/2026 15:00:00'
    }),
    history: [
      { time: '12/11/2026 15:00', actor: 'Công dân Phạm Văn Khoa', note: 'Gửi phản ánh.' },
      { time: '12/11/2026 19:15', actor: 'Phạm Minh Đức', note: 'Khơi thông cống hoàn tất (4.25 giờ).' }
    ]
  },
  {
    id: 'PA-2026-005',
    title: 'Nhánh cây cổ thụ gãy treo lơ lửng trên đường dây điện',
    description: 'Sau cơn giông chiều qua có cành cây khô lớn gãy vướng vào dây cáp viễn thông và điện hạ thế.',
    categoryId: 'tree_electric',
    urgency: 'urgent',
    wardId: 'WARD-26',
    wardName: 'Phường Xuân An',
    lat: 10.933300,
    lng: 107.254800,
    accuracy: 4,
    addressNote: 'Đường Hùng Vương, Phường Xuân An',
    status: 'resolved',
    reporterName: 'Đỗ Thanh Bình',
    reporterPhone: '0972 301 456',
    createdAt: '2026-11-13T16:10:00+07:00',
    updatedAt: '2026-11-13T18:40:00+07:00',
    resolvedAt: '2026-11-13T18:40:00+07:00',
    processingHours: 2.5,
    assignedOfficer: 'Nguyễn Văn Hùng — Tổ Hạ tầng Đô thị',
    progressNote: 'Đã phối hợp Điện lực cắt tỉa, hạ nhánh cây an toàn.',
    photoUrl: createSampleSceneDataUrl({
      title: 'Cây xanh vướng dây điện đường Hùng Vương',
      wardName: 'Phường Xuân An',
      lat: 10.933300,
      lng: 107.254800,
      timestampStr: '13/11/2026 16:10:00'
    }),
    history: [
      { time: '13/11/2026 16:10', actor: 'Công dân Đỗ Thanh Bình', note: 'Gửi phản ánh.' },
      { time: '13/11/2026 18:40', actor: 'Nguyễn Văn Hùng', note: 'Hạ cành cây an toàn (2.5 giờ).' }
    ]
  },
  {
    id: 'PA-2026-006',
    title: 'Nắp hố ga bị sập trên tuyến đường trung tâm Long Thành',
    description: 'Nắp đan bê tông bị gãy sập một nửa tạo hố sâu sát lề đường, rất nguy hiểm cho người đi bộ.',
    categoryId: 'pothole',
    urgency: 'urgent',
    wardId: 'WARD-40',
    wardName: 'Phường Long Thành',
    lat: 10.788300,
    lng: 106.965100,
    accuracy: 5,
    addressNote: 'Đường Lê Duẩn, Phường Long Thành',
    status: 'processing',
    reporterName: 'Vũ Quốc Huy',
    reporterPhone: '0945 912 345',
    createdAt: '2026-11-14T11:00:00+07:00',
    updatedAt: '2026-11-14T11:45:00+07:00',
    resolvedAt: null,
    processingHours: null,
    assignedOfficer: 'Võ Hoàng Nam — Thanh tra Xây dựng Phường/Xã',
    progressNote: 'Đã rào chắn cảnh báo tạm thời, đang vận chuyển tấm đan mới ra thay thế.',
    photoUrl: createSampleSceneDataUrl({
      title: 'Sập nắp hố ga đường Lê Duẩn',
      wardName: 'Phường Long Thành',
      lat: 10.788300,
      lng: 106.965100,
      timestampStr: '14/11/2026 11:00:00'
    }),
    history: [
      { time: '14/11/2026 11:00', actor: 'Công dân Vũ Quốc Huy', note: 'Gửi phản ánh.' }
    ]
  },
  {
    id: 'PA-2026-007',
    title: 'Mặt đường sụt lún đọng nước kéo dài tại Trảng Bom',
    description: 'Đoạn đường vào khu dân cư bị xe tải nặng cày sụt lún gây đọng nước và bùn trơn trượt.',
    categoryId: 'pothole',
    urgency: 'slow',
    wardId: 'WARD-65',
    wardName: 'Phường Trảng Bom',
    lat: 10.954700,
    lng: 107.017800,
    accuracy: 4,
    addressNote: 'Đường Nguyễn Hữu Cảnh, Phường Trảng Bom',
    status: 'pending',
    reporterName: 'Hoàng Văn Sơn',
    reporterPhone: '0966 278 888',
    createdAt: '2026-11-14T16:05:00+07:00',
    updatedAt: '2026-11-14T16:05:00+07:00',
    resolvedAt: null,
    processingHours: null,
    assignedOfficer: '',
    progressNote: 'Chờ UBND Phường bố trí cán bộ khảo sát.',
    photoUrl: createSampleSceneDataUrl({
      title: 'Sụt lún mặt đường Nguyễn Hữu Cảnh',
      wardName: 'Phường Trảng Bom',
      lat: 10.954700,
      lng: 107.017800,
      timestampStr: '14/11/2026 16:05:00'
    }),
    history: [
      { time: '14/11/2026 16:05', actor: 'Công dân Hoàng Văn Sơn', note: 'Gửi phản ánh.' }
    ]
  },
  {
    id: 'PA-2026-008',
    title: 'Đèn tín hiệu cảnh báo giao thông chập chờn tại Nhơn Trạch',
    description: 'Đèn chớp vàng cảnh báo giao lộ bị tắt hoàn toàn vào ban đêm, tầm nhìn hạn chế.',
    categoryId: 'streetlight',
    urgency: 'slow',
    wardId: 'WARD-53',
    wardName: 'Phường Hiệp Phước',
    lat: 10.733600,
    lng: 106.891700,
    accuracy: 4,
    addressNote: 'Ngã ba đường Hùng Vương - Lý Thái Tổ, Hiệp Phước',
    status: 'resolved',
    reporterName: 'Trương Quốc Bảo',
    reporterPhone: '0912 733 999',
    createdAt: '2026-11-11T19:00:00+07:00',
    updatedAt: '2026-11-12T08:30:00+07:00',
    resolvedAt: '2026-11-12T08:30:00+07:00',
    processingHours: 13.5,
    assignedOfficer: 'Đặng Thanh Tùng — Cán bộ Địa chính - Xây dựng',
    progressNote: 'Đã thay mới bộ nguồn LED và ắc quy dự phòng.',
    photoUrl: createSampleSceneDataUrl({
      title: 'Hỏng đèn cảnh báo giao lộ Hiệp Phước',
      wardName: 'Phường Hiệp Phước',
      lat: 10.733600,
      lng: 106.891700,
      timestampStr: '11/11/2026 19:00:00'
    }),
    history: [
      { time: '11/11/2026 19:00', actor: 'Công dân Trương Quốc Bảo', note: 'Gửi phản ánh.' },
      { time: '12/11/2026 08:30', actor: 'Đặng Thanh Tùng', note: 'Khắc phục hoàn tất đèn tín hiệu (13.5 giờ).' }
    ]
  }
];
