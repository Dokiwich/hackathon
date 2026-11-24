import { createDynamicQrSession } from '../utils/qrToken';

export const INITIAL_CHI_DOAN_INFO = {
  donViCapTren: 'Thành đoàn Biên Hòa',
  tenDoanCoSo: 'Đoàn Phường Tam Hiệp — TP. Biên Hòa',
  tenChiDoan: 'Chi đoàn Khu phố 5',
  biThu: 'Trần Minh Khôi',
  phoBiThu: 'Lê Thị Minh Thư',
  chiTieuGioCtxhNam: 24
};

const RAW_KP5_MEMBERS = [
  ['DV-KP5-001', 'DN-KP5-001', 'Trần Minh Khôi', '30/04/1999', '0912 345 001', '26/03/2018', 'Bí thư Chi đoàn', 'Kỹ thuật viên điện • Khu phố 5', 'Xuất sắc', 'Đang ở địa phương', 46, true, '01/11/2026'],
  ['DV-KP5-002', 'DN-KP5-002', 'Nguyễn Hoàng Anh', '14/05/2003', '0912 345 002', '26/03/2021', 'Đoàn viên', 'Công nhân KCN Amata (Ca 2)', 'Xuất sắc', 'Đang ở địa phương', 32, true, '18/11/2026'],
  ['DV-KP5-003', 'DN-KP5-003', 'Lê Thị Minh Thư', '02/09/2002', '0912 345 003', '19/05/2021', 'Phó Bí thư', 'Giáo viên Tiểu học Tam Hiệp', 'Xuất sắc', 'Đang ở địa phương', 42, true, '02/11/2026'],
  ['DV-KP5-004', 'DN-KP5-004', 'Phạm Quốc Bảo', '21/11/2003', '0912 345 004', '26/03/2020', 'Ủy viên BCH', 'Nhân viên hành chính phường', 'Xuất sắc', 'Đang ở địa phương', 36, true, '04/11/2026'],
  ['DV-KP5-005', 'DN-KP5-005', 'Võ Ngọc Hân', '08/03/2004', '0912 345 005', '15/10/2022', 'Đoàn viên', 'Sinh viên ĐH Đồng Nai', 'Xuất sắc', 'Đang ở địa phương', 30, true, '03/11/2026'],
  ['DV-KP5-006', 'DN-KP5-006', 'Đặng Gia Huy', '17/07/2005', '0912 345 006', '26/03/2023', 'Đoàn viên', 'Công nhân KCN Biên Hòa 2 (Ca 1)', 'Khá', 'Đang ở địa phương', 26, true, '05/11/2026'],
  ['DV-KP5-007', 'DN-KP5-007', 'Huỳnh Thanh Trúc', '29/01/2001', '0912 345 007', '02/09/2021', 'Đoàn viên', 'Nhân viên nhà thuốc KP5', 'Xuất sắc', 'Đang ở địa phương', 34, true, '06/11/2026'],
  ['DV-KP5-008', 'DN-KP5-008', 'Bùi Khánh Linh', '24/08/2004', '0912 345 008', '19/05/2023', 'Đoàn viên', 'Sinh viên CĐ Kỹ thuật Đồng Nai', 'Khá', 'Đang ở địa phương', 28, true, '07/11/2026'],
  ['DV-KP5-009', 'DN-KP5-009', 'Ngô Đức Thịnh', '06/12/2002', '0912 345 009', '26/03/2022', 'Đoàn viên', 'Công nhân KCN Amata (Ca 3)', 'Khá', 'Đang ở địa phương', 24, true, '10/11/2026'],
  ['DV-KP5-010', 'DN-KP5-010', 'Phan Bảo Ngọc', '19/10/2003', '0912 345 010', '20/11/2022', 'Đoàn viên', 'Kế toán doanh nghiệp tư nhân', 'Xuất sắc', 'Đang ở địa phương', 30, true, '02/11/2026'],
  ['DV-KP5-011', 'DN-KP5-011', 'Lý Nhật Minh', '03/02/2006', '0912 345 011', '26/03/2024', 'Đoàn viên', 'Sinh viên ĐH Lạc Hồng', 'Khá', 'Đang ở địa phương', 24, true, '01/11/2026'],
  ['DV-KP5-012', 'DN-KP5-012', 'Mai Phương Thảo', '27/06/2002', '0912 345 012', '15/05/2021', 'Đoàn viên', 'Nhân viên siêu thị KP5', 'Xuất sắc', 'Đang ở địa phương', 28, true, '08/11/2026'],
  ['DV-KP5-013', 'DN-KP5-013', 'Đoàn Văn Kiệt', '09/09/2004', '0912 345 013', '26/03/2023', 'Đoàn viên', 'Công nhân KCN Loteco (Ca 2)', 'Khá', 'Đang ở địa phương', 24, true, '12/11/2026'],
  ['DV-KP5-014', 'DN-KP5-014', 'Tăng Mỹ Duyên', '15/01/2005', '0912 345 014', '19/05/2024', 'Đoàn viên', 'Sinh viên ĐH Đồng Nai', 'Khá', 'Đang ở địa phương', 26, true, '04/11/2026'],
  ['DV-KP5-015', 'DN-KP5-015', 'Nguyễn Tuấn Kiệt', '12/04/2001', '0912 345 015', '19/05/2020', 'Đoàn viên', 'Nhân viên kỹ thuật viễn thông', 'Xuất sắc', 'Đang ở địa phương', 30, true, '03/11/2026'],
  ['DV-KP5-016', 'DN-KP5-016', 'Trịnh Thảo Nhi', '19/08/2003', '0912 345 016', '26/03/2022', 'Đoàn viên', 'Nhân viên văn phòng P. Tam Hiệp', 'Xuất sắc', 'Đang ở địa phương', 28, true, '05/11/2026'],
  ['DV-KP5-017', 'DN-KP5-017', 'Vũ Hoàng Long', '04/11/2000', '0912 345 017', '26/03/2019', 'Đoàn viên', 'Công nhân KCN Amata (Ca 1)', 'Khá', 'Đang ở địa phương', 24, true, '09/11/2026'],
  ['DV-KP5-018', 'DN-KP5-018', 'Lâm Gia Hân', '22/03/2005', '0912 345 018', '26/03/2024', 'Đoàn viên', 'Sinh viên ĐH Đồng Nai', 'Xuất sắc', 'Đang ở địa phương', 26, true, '06/11/2026'],
  ['DV-KP5-019', 'DN-KP5-019', 'Châu Minh Quân', '08/07/2002', '0912 345 019', '26/03/2021', 'Đoàn viên', 'Kỹ sư CNTT • Biên Hòa', 'Xuất sắc', 'Đang ở địa phương', 28, true, '01/11/2026'],
  ['DV-KP5-020', 'DN-KP5-020', 'Hồ Thị Yến Vy', '14/02/2004', '0912 345 020', '26/03/2023', 'Đoàn viên', 'Giáo viên mầm non KP5', 'Khá', 'Đang ở địa phương', 22, true, '04/11/2026'],
  ['DV-KP5-021', 'DN-KP5-021', 'Dương Hải Đăng', '25/09/2001', '0912 345 021', '26/03/2020', 'Đoàn viên', 'Công nhân KCN Biên Hòa 2 (Ca 2)', 'Khá', 'Đang ở địa phương', 20, true, '11/11/2026'],
  ['DV-KP5-022', 'DN-KP5-022', 'Cao Thị Kim Anh', '11/12/2003', '0912 345 022', '19/05/2022', 'Đoàn viên', 'Nhân viên ngân hàng Biên Hòa', 'Khá', 'Đang ở địa phương', 24, true, '05/11/2026'],
  ['DV-KP5-023', 'DN-KP5-023', 'Tô Quốc Hưng', '30/01/2002', '0912 345 023', '26/03/2021', 'Đoàn viên', 'Công nhân cơ khí (Ca đêm)', 'Trung bình', 'Đang ở địa phương', 16, false, '08/11/2026'],
  ['DV-KP5-024', 'DN-KP5-024', 'Đinh Bảo Trâm', '05/05/2006', '0912 345 024', '26/03/2025', 'Đoàn viên', 'Sinh viên CĐ Y tế Đồng Nai', 'Khá', 'Đang ở địa phương', 20, true, '03/11/2026'],
  ['DV-KP5-025', 'DN-KP5-025', 'Nguyễn Phúc Khang', '16/10/2004', '0912 345 025', '26/03/2023', 'Đoàn viên', 'Thợ sửa xe • Đường Phạm Văn Thuận', 'Khá', 'Đang ở địa phương', 18, true, '07/11/2026'],
  ['DV-KP5-026', 'DN-KP5-026', 'Trần Thị Thu Hà', '21/06/2001', '0912 345 026', '19/05/2020', 'Đoàn viên', 'Điều dưỡng phòng khám Tam Hiệp', 'Khá', 'Đang ở địa phương', 22, true, '06/11/2026'],
  ['DV-KP5-027', 'DN-KP5-027', 'Lê Văn Thành Đạt', '13/03/2003', '0912 345 027', '26/03/2022', 'Đoàn viên', 'Công nhân may KCN Amata (Ca 2)', 'Khá', 'Đang ở địa phương', 20, true, '10/11/2026'],
  ['DV-KP5-028', 'DN-KP5-028', 'Phạm Ngọc Minh Châu', '29/08/2005', '0912 345 028', '26/03/2024', 'Đoàn viên', 'Sinh viên ĐH Đồng Nai', 'Khá', 'Đang ở địa phương', 20, true, '07/11/2026'],
  ['DV-KP5-029', 'DN-KP5-029', 'Nguyễn Hữu Phước', '18/02/2000', '0912 345 029', '19/05/2019', 'Đoàn viên', 'Lao động tự do tại KP5', 'Trung bình', 'Đang ở địa phương', 12, true, '15/09/2026'],
  ['DV-KP5-030', 'DN-KP5-030', 'Võ Thị Thanh Ngân', '07/11/2004', '0912 345 030', '26/03/2023', 'Đoàn viên', 'Nhân viên bán hàng Co.opmart', 'Trung bình', 'Đang ở địa phương', 14, true, '20/10/2026'],
  ['DV-KP5-031', 'DN-KP5-031', 'Hoàng Đức Trọng', '03/04/2002', '0912 345 031', '26/03/2021', 'Đoàn viên', 'Nhân viên giao hàng Biên Hòa', 'Trung bình', 'Đang ở địa phương', 12, true, '12/10/2026'],

  ['DV-KP5-032', 'DN-KP5-032', 'Nguyễn Văn Tùng', '11/08/1998', '0912 345 032', '26/03/2018', 'Đoàn viên', 'Công nhân KCN VSIP 1 (Bình Dương)', 'Khá', 'Đi làm xa', 16, true, '16/11/2026'],
  ['DV-KP5-033', 'DN-KP5-033', 'Trần Thị Mai Linh', '20/05/2000', '0912 345 033', '26/03/2019', 'Đoàn viên', 'Nhân viên TP. Thủ Đức (TP.HCM)', 'Khá', 'Đi làm xa', 14, true, '14/11/2026'],
  ['DV-KP5-034', 'DN-KP5-034', 'Lê Quang Hải', '01/12/1999', '0912 345 034', '19/05/2018', 'Đoàn viên', 'Kỹ sư công trình Sân bay Long Thành', 'Khá', 'Đi làm xa', 18, true, '19/11/2026'],
  ['DV-KP5-035', 'DN-KP5-035', 'Phạm Thị Kim Cương', '17/03/2001', '0912 345 035', '26/03/2020', 'Đoàn viên', 'Công nhân KCN Nhơn Trạch 3 (Ca đêm)', 'Trung bình', 'Đi làm xa', 12, false, '11/11/2026'],
  ['DV-KP5-036', 'DN-KP5-036', 'Võ Minh Trí', '23/07/2002', '0912 345 036', '26/03/2021', 'Đoàn viên', 'Lái xe tuyến Đồng Nai – Tây Nguyên', 'Khá', 'Đi làm xa', 14, true, '09/11/2026'],
  ['DV-KP5-037', 'DN-KP5-037', 'Đặng Thị Tuyết Nhung', '14/09/2000', '0912 345 037', '19/05/2019', 'Đoàn viên', 'Làm việc tại Dĩ An, Bình Dương', 'Trung bình', 'Đi làm xa', 10, true, '22/10/2026'],
  ['DV-KP5-038', 'DN-KP5-038', 'Bùi Văn Hậu', '09/01/1999', '0912 345 038', '26/03/2018', 'Đoàn viên', 'Công nhân KCN Sóng Thần (Ca đêm)', 'Trung bình', 'Đi làm xa', 8, false, '18/10/2026'],
  ['DV-KP5-039', 'DN-KP5-039', 'Huỳnh Công Danh', '28/10/2001', '0912 345 039', '26/03/2020', 'Đoàn viên', 'Thực tập sinh tại Quận 1, TP.HCM', 'Trung bình', 'Đi làm xa', 10, true, '25/10/2026'],
  ['DV-KP5-040', 'DN-KP5-040', 'Ngô Thị Hồng Gấm', '06/02/2003', '0912 345 040', '26/03/2022', 'Đoàn viên', 'Kỹ thuật viên bảo trì tại Vũng Tàu', 'Trung bình', 'Đi làm xa', 8, true, '19/10/2026'],
  ['DV-KP5-041', 'DN-KP5-041', 'Trương Gia Bảo', '15/06/2002', '0912 345 041', '19/05/2021', 'Đoàn viên', 'Nhân viên kho vận KCN Tân Uyên', 'Trung bình', 'Đi làm xa', 10, true, '27/10/2026'],
  ['DV-KP5-042', 'DN-KP5-042', 'Phan Văn Hào', '27/11/2000', '0912 345 042', '26/03/2019', 'Đoàn viên', 'Kỹ sư xây dựng tại Bình Phước', 'Trung bình', 'Đi làm xa', 6, false, '15/10/2026'],
  ['DV-KP5-043', 'DN-KP5-043', 'Lý Thị Thảo Trang', '25/04/2001', '0912 345 043', '26/03/2020', 'Đoàn viên', 'Nhân viên khách sạn tại Đà Lạt', 'Trung bình', 'Đi làm xa', 8, true, '29/10/2026'],

  ['DV-KP5-044', 'DN-KP5-044', 'Trương Tấn Phát', '11/04/2003', '0912 345 044', '26/03/2021', 'Đoàn viên', 'Đang chuyển hồ sơ về P. Tân Phong', 'Trung bình', 'Chuyển sinh hoạt', 8, true, '20/11/2026'],
  ['DV-KP5-045', 'DN-KP5-045', 'Đỗ Thị Quỳnh Hương', '03/08/2004', '0912 345 045', '26/03/2022', 'Đoàn viên', 'Chuyển sinh hoạt sang Đoàn trường CĐ', 'Trung bình', 'Chuyển sinh hoạt', 6, true, '17/11/2026'],
  ['DV-KP5-046', 'DN-KP5-046', 'Nguyễn Thành Luân', '19/12/2002', '0912 345 046', '19/05/2021', 'Đoàn viên', 'Chuyển sinh hoạt về xã Bình Minh', 'Trung bình', 'Chuyển sinh hoạt', 4, false, '12/11/2026']
];

export const INITIAL_MEMBERS = RAW_KP5_MEMBERS.map((row, idx) => {
  const [
    id,
    maDoanVien,
    hoTen,
    ngaySinh,
    sdt,
    ngayVaoDoan,
    chucVu,
    congViec,
    xepLoai,
    trangThai,
    gioCtxh,
    daDongDoanPhi,
    updatedAt
  ] = row;

  const isShiftWorker = /Ca |ca /i.test(congViec);
  const t8 = idx < 28 ? (isShiftWorker && idx % 3 === 1 ? 'makeup' : 'qr') : 'absent';
  const t9 = idx < 19 ? (isShiftWorker && idx % 2 === 1 ? 'makeup' : 'qr') : 'absent';
  const t10 =
    idx < 28
      ? isShiftWorker
        ? 'makeup'
        : 'qr'
      : idx >= 31 && idx <= 35
        ? 'online'
        : 'absent';

  return {
    id,
    maDoanVien,
    hoTen,
    ngaySinh,
    branchId: 'BR-KP5',
    chiDoan: 'Chi đoàn Khu phố 5',
    sdt,
    ngayVaoDoan,
    chucVu,
    congViec,
    xepLoai,
    trangThai,
    gioCtxh,
    daDongDoanPhi,
    updatedAt,
    hist: { t8, t9, t10 }
  };
});

const RAW_OTHER_WARD_MEMBERS = [
  ['DV-KP2-001', 'DN-KP2-001', 'Bùi Đức Anh', '12/06/2000', 'BR-KP2', 'Chi đoàn Khu phố 2', '0913 112 001', '26/03/2019', 'Bí thư Chi đoàn', 'Kỹ thuật viên cơ khí • Khu phố 2', 'Xuất sắc', 'Đang ở địa phương', 34, true, '15/11/2026'],
  ['DV-KP2-002', 'DN-KP2-002', 'Nguyễn Thảo My', '08/09/2002', 'BR-KP2', 'Chi đoàn Khu phố 2', '0913 112 002', '19/05/2021', 'Phó Bí thư', 'Giáo viên mầm non Tam Hiệp', 'Xuất sắc', 'Đang ở địa phương', 28, true, '14/11/2026'],
  ['DV-KP2-003', 'DN-KP2-003', 'Phạm Tuấn Đạt', '19/01/2003', 'BR-KP2', 'Chi đoàn Khu phố 2', '0913 112 003', '26/03/2022', 'Đoàn viên', 'Công nhân KCN Amata (Ca 1)', 'Khá', 'Đang ở địa phương', 22, true, '16/11/2026'],
  ['DV-KP2-004', 'DN-KP2-004', 'Lê Ngọc Phương', '03/11/2004', 'BR-KP2', 'Chi đoàn Khu phố 2', '0913 112 004', '26/03/2023', 'Đoàn viên', 'Sinh viên ĐH Lạc Hồng', 'Khá', 'Đang ở địa phương', 20, true, '13/11/2026'],
  ['DV-KP2-005', 'DN-KP2-005', 'Trần Hoàng Nam', '25/04/2001', 'BR-KP2', 'Chi đoàn Khu phố 2', '0913 112 005', '19/05/2020', 'Đoàn viên', 'Nhân viên kinh doanh KP2', 'Khá', 'Đang ở địa phương', 18, false, '12/11/2026'],
  ['DV-KP2-006', 'DN-KP2-006', 'Vũ Minh Hiếu', '14/07/2000', 'BR-KP2', 'Chi đoàn Khu phố 2', '0913 112 006', '26/03/2019', 'Đoàn viên', 'Kỹ sư điện tại TP. Thủ Đức', 'Khá', 'Đi làm xa', 14, true, '11/11/2026'],
  ['DV-KP2-007', 'DN-KP2-007', 'Đặng Thị Hồng', '28/02/2002', 'BR-KP2', 'Chi đoàn Khu phố 2', '0913 112 007', '26/03/2021', 'Đoàn viên', 'Công nhân KCN Nhơn Trạch 2', 'Trung bình', 'Đi làm xa', 10, false, '10/11/2026'],
  ['DV-KP2-008', 'DN-KP2-008', 'Hồ Văn Thịnh', '05/08/2003', 'BR-KP2', 'Chi đoàn Khu phố 2', '0913 112 008', '19/05/2022', 'Đoàn viên', 'Chuyển sinh hoạt về P. Tân Mai', 'Trung bình', 'Chuyển sinh hoạt', 6, true, '09/11/2026'],
  ['DV-KP3-001', 'DN-KP3-001', 'Lê Đình Khánh', '10/03/1999', 'BR-KP3', 'Chi đoàn Khu phố 3', '0913 113 001', '26/03/2018', 'Bí thư Chi đoàn', 'Chuyên viên CNTT • Khu phố 3', 'Xuất sắc', 'Đang ở địa phương', 32, true, '15/11/2026'],
  ['DV-KP3-002', 'DN-KP3-002', 'Nguyễn Bảo Châu', '22/10/2003', 'BR-KP3', 'Chi đoàn Khu phố 3', '0913 113 002', '26/03/2022', 'Phó Bí thư', 'Sinh viên ĐH Đồng Nai', 'Xuất sắc', 'Đang ở địa phương', 26, true, '14/11/2026'],
  ['DV-KP3-003', 'DN-KP3-003', 'Trương Minh Quang', '17/05/2002', 'BR-KP3', 'Chi đoàn Khu phố 3', '0913 113 003', '19/05/2021', 'Đoàn viên', 'Công nhân KCN Biên Hòa 2', 'Khá', 'Đang ở địa phương', 20, true, '12/11/2026'],
  ['DV-KP3-004', 'DN-KP3-004', 'Phan Thị Thanh', '01/12/2004', 'BR-KP3', 'Chi đoàn Khu phố 3', '0913 113 004', '26/03/2023', 'Đoàn viên', 'Nhân viên nhà sách Biên Hòa', 'Khá', 'Đang ở địa phương', 18, true, '11/11/2026'],
  ['DV-KP3-005', 'DN-KP3-005', 'Ngô Gia Kiệt', '09/09/2001', 'BR-KP3', 'Chi đoàn Khu phố 3', '0913 113 005', '26/03/2020', 'Đoàn viên', 'Nhân viên logistics tại Bình Dương', 'Khá', 'Đi làm xa', 12, true, '10/11/2026'],
  ['DV-KP3-006', 'DN-KP3-006', 'Lý Ngọc Anh', '14/06/2002', 'BR-KP3', 'Chi đoàn Khu phố 3', '0913 113 006', '19/05/2021', 'Đoàn viên', 'Làm việc tại Quận 7, TP.HCM', 'Trung bình', 'Đi làm xa', 10, false, '08/11/2026']
];

export const INITIAL_OTHER_WARD_MEMBERS = RAW_OTHER_WARD_MEMBERS.map((row, idx) => {
  const [
    id,
    maDoanVien,
    hoTen,
    ngaySinh,
    branchId,
    chiDoan,
    sdt,
    ngayVaoDoan,
    chucVu,
    congViec,
    xepLoai,
    trangThai,
    gioCtxh,
    daDongDoanPhi,
    updatedAt
  ] = row;

  return {
    id,
    maDoanVien,
    hoTen,
    ngaySinh,
    branchId,
    chiDoan,
    sdt,
    ngayVaoDoan,
    chucVu,
    congViec,
    xepLoai,
    trangThai,
    gioCtxh,
    daDongDoanPhi,
    updatedAt,
    hist: {
      t8: idx % 2 === 0 ? 'qr' : 'absent',
      t9: idx % 3 !== 2 ? 'qr' : 'absent',
      t10: idx % 4 !== 3 ? 'qr' : 'online'
    }
  };
});

export const INITIAL_WARD_MEMBERS = [...INITIAL_MEMBERS, ...INITIAL_OTHER_WARD_MEMBERS];

export const WARD_BRANCH_CATALOG = [
  { id: 'BR-KP2', name: 'Chi đoàn Khu phố 2', secretary: 'Bùi Đức Anh' },
  { id: 'BR-KP3', name: 'Chi đoàn Khu phố 3', secretary: 'Lê Đình Khánh' },
  { id: 'BR-KP5', name: 'Chi đoàn Khu phố 5', secretary: 'Trần Minh Khôi' }
];

function buildCheckedIn(sessionKey, dateTime) {
  return INITIAL_MEMBERS.filter((m) => m.hist[sessionKey] !== 'absent').map((m, i) => ({
    memberId: m.id,
    checkedInAt: dateTime,
    distanceM: 12 + (i % 9) * 7,
    accuracyM: 10 + (i % 5) * 3,
    method:
      m.hist[sessionKey] === 'makeup'
        ? 'Sinh hoạt bù'
        : m.hist[sessionKey] === 'online'
          ? 'Trực tuyến OTP'
          : 'QR động'
  }));
}

const DEFAULT_WARD_LAT = 10.957412;
const DEFAULT_WARD_LON = 106.842685;

export const INITIAL_ACTIVITIES = [
  {
    id: 'ACT-WARD-01',
    scope: 'ward',
    branchId: null,
    chiDoan: 'Đoàn Phường Tam Hiệp',
    tenHoatDong: 'Ngày hội Hiến máu tình nguyện "Giọt hồng Tam Hiệp" đợt IV/2026',
    ngayToChuc: '2026-12-05',
    khungGio: '06:30 - 11:00',
    diaDiem: 'Hội trường UBND Phường Tam Hiệp, TP. Biên Hòa',
    latitude: DEFAULT_WARD_LAT,
    longitude: DEFAULT_WARD_LON,
    geofenceRadiusM: 150,
    startsAt: Date.now() - 10 * 60 * 1000,
    endsAt: Date.now() + 3 * 60 * 60 * 1000,
    isClosed: false,
    gioCongTacXaHoi: 6,
    trangThai: 'Đang điểm danh',
    qrSession: createDynamicQrSession('ACT-WARD-01', 900),
    checkedInRecords: [
      { memberId: 'DV-KP2-001', checkedInAt: '2026-11-24 07:12', method: 'QR + GPS', distanceM: 18, accuracyM: 12 },
      { memberId: 'DV-KP3-001', checkedInAt: '2026-11-24 07:15', method: 'QR + GPS', distanceM: 24, accuracyM: 14 }
    ]
  },
  {
    id: 'ACT-WARD-02',
    scope: 'ward',
    branchId: null,
    chiDoan: 'Đoàn Phường Tam Hiệp',
    tenHoatDong: 'Ra quân Ngày Chủ Nhật Xanh Toàn Phường Tam Hiệp',
    ngayToChuc: '2026-11-29',
    khungGio: '07:00 - 10:00',
    diaDiem: 'Công viên Tam Hiệp — Tuyến đường Phạm Văn Thuận',
    latitude: DEFAULT_WARD_LAT,
    longitude: DEFAULT_WARD_LON,
    geofenceRadiusM: 180,
    startsAt: Date.now() - 10 * 60 * 1000,
    endsAt: Date.now() + 3 * 60 * 60 * 1000,
    isClosed: false,
    gioCongTacXaHoi: 4,
    trangThai: 'Đang điểm danh',
    qrSession: createDynamicQrSession('ACT-WARD-02', 900),
    checkedInRecords: []
  },
  {
    id: 'ACT-KP5-01',
    scope: 'branch',
    branchId: 'BR-KP5',
    chiDoan: 'Chi đoàn Khu phố 5',
    tenHoatDong: 'Sinh hoạt Chi đoàn KP5 tháng 11 — Chuyên đề Chuyển đổi số cơ sở',
    ngayToChuc: '2026-11-16',
    khungGio: '19:00 - 20:30',
    diaDiem: 'Nhà văn hóa Khu phố 5, P. Tam Hiệp',
    latitude: DEFAULT_WARD_LAT,
    longitude: DEFAULT_WARD_LON,
    geofenceRadiusM: 120,
    isClosed: true,
    gioCongTacXaHoi: 4,
    trangThai: 'Đã hoàn thành',
    checkedInRecords: buildCheckedIn('t8', '2026-11-16 19:08')
  },
  {
    id: 'ACT-KP5-02',
    scope: 'branch',
    branchId: 'BR-KP5',
    chiDoan: 'Chi đoàn Khu phố 5',
    tenHoatDong: 'Sinh hoạt Chi đoàn KP5 đầu tháng 11 — Triển khai VNeID & an toàn mạng',
    ngayToChuc: '2026-11-02',
    khungGio: '19:00 - 20:30',
    diaDiem: 'Nhà văn hóa Khu phố 5, P. Tam Hiệp',
    latitude: DEFAULT_WARD_LAT,
    longitude: DEFAULT_WARD_LON,
    geofenceRadiusM: 120,
    isClosed: true,
    gioCongTacXaHoi: 3,
    trangThai: 'Đã hoàn thành',
    checkedInRecords: buildCheckedIn('t9', '2026-11-02 19:05')
  },
  {
    id: 'ACT-KP5-03',
    scope: 'branch',
    branchId: 'BR-KP5',
    chiDoan: 'Chi đoàn Khu phố 5',
    tenHoatDong: 'Sinh hoạt Chi đoàn KP5 tháng 10 — Kỷ niệm Ngày truyền thống Hội LHTN',
    ngayToChuc: '2026-10-19',
    khungGio: '19:00 - 21:00',
    diaDiem: 'Nhà văn hóa Khu phố 5, P. Tam Hiệp',
    latitude: DEFAULT_WARD_LAT,
    longitude: DEFAULT_WARD_LON,
    geofenceRadiusM: 150,
    isClosed: true,
    gioCongTacXaHoi: 4,
    trangThai: 'Đã hoàn thành',
    checkedInRecords: buildCheckedIn('t10', '2026-10-19 19:10')
  },
  {
    id: 'ACT-KP5-04',
    scope: 'branch',
    branchId: 'BR-KP5',
    chiDoan: 'Chi đoàn Khu phố 5',
    tenHoatDong: 'Sinh hoạt bù KP5 dành cho đoàn viên công nhân làm ca tối Thứ 7',
    ngayToChuc: '2026-11-28',
    khungGio: '19:30 - 20:45',
    diaDiem: 'Điểm sinh hoạt công nhân KCN Amata / KP5',
    latitude: DEFAULT_WARD_LAT,
    longitude: DEFAULT_WARD_LON,
    geofenceRadiusM: 150,
    isClosed: false,
    gioCongTacXaHoi: 3,
    trangThai: 'Đang điểm danh',
    qrSession: createDynamicQrSession('ACT-KP5-04', 900),
    checkedInRecords: [
      { memberId: 'DV-KP5-001', checkedInAt: '2026-11-28 19:25', method: 'QR + GPS', distanceM: 15, accuracyM: 10 },
      { memberId: 'DV-KP5-002', checkedInAt: '2026-11-28 19:31', method: 'Sinh hoạt bù', distanceM: 22, accuracyM: 14 }
    ]
  }
];

export const INITIAL_SOCIAL_LEDGER = [
  { id: 'LG-001', memberId: 'DV-KP5-001', activityId: 'ACT-KP5-01', activityTitle: 'Sinh hoạt Chi đoàn KP5 tháng 11 — Chuyên đề Chuyển đổi số cơ sở', hours: 4, method: 'QR động', recordedAt: '2026-11-16 19:08', approvedBy: 'Trần Minh Khôi' },
  { id: 'LG-002', memberId: 'DV-KP5-002', activityId: 'ACT-KP5-04', activityTitle: 'Sinh hoạt bù KP5 dành cho đoàn viên công nhân làm ca tối Thứ 7', hours: 3, method: 'Sinh hoạt bù', recordedAt: '2026-11-28 19:31', approvedBy: 'Trần Minh Khôi' },
  { id: 'LG-003', memberId: 'DV-KP5-003', activityId: 'ACT-KP5-03', activityTitle: 'Sinh hoạt Chi đoàn KP5 tháng 10 — Kỷ niệm Ngày truyền thống Hội LHTN', hours: 4, method: 'QR động', recordedAt: '2026-10-19 19:10', approvedBy: 'Trần Minh Khôi' },
  { id: 'LG-004', memberId: 'DV-KP5-004', activityId: 'ACT-KP5-01', activityTitle: 'Sinh hoạt Chi đoàn KP5 tháng 11 — Chuyên đề Chuyển đổi số cơ sở', hours: 4, method: 'QR động', recordedAt: '2026-11-16 19:12', approvedBy: 'Trần Minh Khôi' },
  { id: 'LG-005', memberId: 'DV-KP5-034', activityId: 'ACT-KP5-03', activityTitle: 'Sinh hoạt Chi đoàn KP5 tháng 10 — Kỷ niệm Ngày truyền thống Hội LHTN', hours: 4, method: 'Trực tuyến OTP', recordedAt: '2026-10-19 19:20', approvedBy: 'Trần Minh Khôi' }
];

export const INITIAL_REMINDERS = [
  {
    id: 'RM-KP5-01',
    scope: 'branch',
    branchId: 'BR-KP5',
    tieuDe: 'Nhắc đoàn viên làm ca đăng ký & dự Sinh hoạt bù tối Thứ 7',
    hanChot: '2026-11-28 19:30',
    chuKy: 'Hàng tháng',
    nhacTruoc: 'Trước 24 giờ',
    kenhNhac: 'Zalo Nhóm + Web Push',
    doiTuong: 'Đoàn viên công nhân làm ca KP5',
    batNhacTuDong: true,
    daHoanThanh: false
  },
  {
    id: 'RM-KP5-02',
    scope: 'branch',
    branchId: 'BR-KP5',
    tieuDe: 'Điểm danh QR động Ngày Chủ Nhật Xanh Khu phố 5',
    hanChot: '2026-11-29 07:00',
    chuKy: 'Hàng tháng',
    nhacTruoc: 'Trước 12 giờ',
    kenhNhac: 'Zalo OA + Web Push',
    doiTuong: '46 đoàn viên Chi đoàn KP5',
    batNhacTuDong: true,
    daHoanThanh: false
  },
  {
    id: 'RM-KP5-03',
    scope: 'branch',
    branchId: 'BR-KP5',
    tieuDe: 'Thu đoàn phí tháng 11/2026 Khu phố 5 (còn 5 ĐV chưa đóng)',
    hanChot: '2026-11-30 17:00',
    chuKy: 'Hàng tháng',
    nhacTruoc: 'Trước 48 giờ',
    kenhNhac: 'Zalo OA',
    doiTuong: 'Đoàn viên chưa đóng đoàn phí',
    batNhacTuDong: true,
    daHoanThanh: false
  },
  {
    id: 'RM-KP5-04',
    scope: 'branch',
    branchId: 'BR-KP5',
    tieuDe: 'Chốt báo cáo tháng 11 gửi Đoàn Phường Tam Hiệp',
    hanChot: '2026-11-29 17:00',
    chuKy: 'Hàng tháng',
    nhacTruoc: 'Trước 24 giờ',
    kenhNhac: 'Web Push',
    doiTuong: 'Bí thư Chi đoàn KP5',
    batNhacTuDong: true,
    daHoanThanh: false
  },
  {
    id: 'RM-WARD-01',
    scope: 'ward',
    branchId: null,
    tieuDe: 'Tổng hợp danh sách tham gia Hiến máu Phường Tam Hiệp đợt IV/2026',
    hanChot: '2026-12-03 18:00',
    chuKy: 'Một lần',
    nhacTruoc: 'Trước 48 giờ',
    kenhNhac: 'Zalo OA + Zalo Nhóm + SMS',
    doiTuong: 'Toàn thể 60 ĐV Phường Tam Hiệp',
    batNhacTuDong: true,
    daHoanThanh: false
  }
];

export const NEWS_IMAGE_PRESETS = [
  { path: 'news/ra-quan.jpg', label: 'Ra quân Thanh niên' },
  { path: 'news/hien-mau.jpg', label: 'Hiến máu tình nguyện' },
  { path: 'news/giao-thong.jpg', label: 'Văn hóa giao thông' },
  { path: 'news/sinh-hoat.jpg', label: 'Sinh hoạt Chi đoàn' }
];

export const YOUTH_UNION_NEWS = [
  {
    id: 'NEWS-01',
    category: 'Phong trào',
    source: 'Tỉnh đoàn Đồng Nai',
    location: 'Quảng trường Tỉnh Đồng Nai',
    publishedAt: '24/11/2026',
    featured: true,
    image: 'news/ra-quan.jpg',
    title: 'Ra quân Tháng Thanh niên & Chuyển đổi số đồng loạt tại 95 xã, phường',
    summary:
      'Hàng trăm cán bộ Đoàn và đoàn viên phất cờ xuất quân triển khai Sổ tay Đoàn viên số, mã QR động chấm công và lịch sinh hoạt bù cho công nhân KCN.',
    content:
      'Ban Thường vụ Tỉnh đoàn Đồng Nai phát động đợt cao điểm chuyển đổi số tại 95 xã, phường trên toàn địa bàn. Cán bộ Đoàn cơ sở sử dụng bảng tin số điều phối hoạt động, phát mã QR điểm danh 45 giây và tổng hợp báo cáo tháng theo thời gian thực. Đoàn viên đi làm xa hoặc làm ca xoay tại KCN có thể đăng ký sinh hoạt bù linh hoạt ngay trên ứng dụng.'
  },
  {
    id: 'NEWS-02',
    category: 'Phong trào',
    source: 'Đoàn Phường Tam Hiệp',
    location: 'Hội trường UBND Phường Tam Hiệp',
    publishedAt: '22/11/2026',
    featured: false,
    image: 'news/hien-mau.jpg',
    title: 'Ngày hội Hiến máu tình nguyện "Mỗi giọt máu cho đi — Một cuộc đời ở lại"',
    summary:
      'Đội hình tình nguyện viên Phường Tam Hiệp túc trực hỗ trợ tiếp đón, hướng dẫn quét mã QR đăng ký nhanh và ghi nhận +25 điểm thi đua.',
    content:
      'Chương trình hiến máu tình nguyện đợt IV/2026 quy tụ đông đảo đoàn viên thanh niên từ Chi đoàn Khu phố 2, Khu phố 3 và Khu phố 5. Đoàn viên chỉ cần quét QR động tại bàn check-in là hệ thống tự động cộng 25 điểm thi đua và cập nhật giờ công tác xã hội vào sổ cá nhân.'
  },
  {
    id: 'NEWS-03',
    category: 'Chỉ đạo Đoàn',
    source: 'Thành đoàn Biên Hòa',
    location: 'Trung tâm Hội nghị TP. Biên Hòa',
    publishedAt: '20/11/2026',
    featured: false,
    image: 'news/giao-thong.jpg',
    title: 'Ngày hội Thanh niên với Văn hóa giao thông & Tổng kết Chiến dịch Tình nguyện Hè',
    summary:
      'Phát động mô hình Cổng trường An toàn giao thông, đội hình thanh niên xung kích giữ gìn trật tự đô thị và tuyên dương tập thể xuất sắc.',
    content:
      'Thành đoàn Biên Hòa phối hợp lực lượng Công an địa phương triển khai ký cam kết văn hóa giao thông trong thanh niên công nhân và học sinh, sinh viên. Các chi đoàn khu phố duy trì tổ phản ứng nhanh vào giờ cao điểm và tổ chức sinh hoạt chuyên đề định kỳ hàng tháng.'
  },
  {
    id: 'NEWS-04',
    category: 'Chi đoàn KP5',
    source: 'Chi đoàn Khu phố 5',
    location: 'Nhà văn hóa Khu phố 5, P. Tam Hiệp',
    publishedAt: '18/11/2026',
    featured: false,
    image: 'news/sinh-hoat.jpg',
    title: 'Sinh hoạt Chi đoàn KP5 — Trao sổ tay Đoàn viên & mở ca sinh hoạt bù tối Thứ 7',
    summary:
      'Hội nghị chi đoàn trao tặng ấn phẩm tuyên truyền cho đoàn viên trẻ và thống nhất khung giờ 19:30 tối Thứ 7 dành riêng cho 12 công nhân làm ca.',
    content:
      'Chi đoàn Khu phố 5 hiện có 46 đoàn viên (31 đang ở địa phương, 12 đi làm xa, 3 chuyển sinh hoạt). Nhằm bảo đảm tỷ lệ sinh hoạt đạt trên 70%, Bí thư chi đoàn mở thêm phiên sinh hoạt bù vào tối Thứ 7 hàng tuần để công nhân tại KCN Amata và Loteco vẫn tham gia đầy đủ.'
  },
  {
    id: 'NEWS-05',
    category: 'Thông báo',
    source: 'Đoàn Phường Tam Hiệp',
    location: '95 Xã / Phường — TP. Biên Hòa',
    publishedAt: '15/11/2026',
    featured: false,
    image: 'news/ra-quan.jpg',
    title: 'Hướng dẫn chuẩn hóa báo cáo tháng & minh bạch trạng thái cư trú đoàn viên',
    summary:
      'Cán bộ Đoàn phường theo dõi tỷ lệ chuyên cần 3 kỳ gần nhất của các chi đoàn trực thuộc và xuất báo cáo Word/CSV/PDF A4 chỉ với 1 lần bấm.',
    content:
      'Từ tháng 11/2026, số liệu sinh hoạt của từng chi đoàn được tự động khóa qua điểm danh QR động và đăng ký sinh hoạt bù. Các chi đoàn dưới ngưỡng 70% sẽ được Đoàn phường hỗ trợ kịp thời trước hạn nộp báo cáo ngày 30 hàng tháng.'
  }
];

export const INITIAL_MAKEUP_REGISTRATIONS = [
  {
    id: 1,
    memberId: 'DV-KP5-002',
    memberCode: 'DN-KP5-002',
    memberName: 'Nguyễn Hoàng Anh',
    branchId: 'BR-KP5',
    branchName: 'Chi đoàn Khu phố 5',
    workShift: 'rotating_shift',
    missedActivityId: 'ACT-KP5-01',
    missedActivityTitle: 'Sinh hoạt Chi đoàn KP5 tháng 11 — Chuyên đề Chuyển đổi số cơ sở',
    makeupActivityId: 'ACT-KP5-04',
    makeupActivityTitle: 'Sinh hoạt bù KP5 dành cho đoàn viên công nhân làm ca tối Thứ 7',
    makeupDate: '2026-11-28',
    shiftReason: 'Ca tối KCN Amata 14:00 - 22:00',
    status: 'approved',
    createdAt: '2026-11-15 20:10'
  },
  {
    id: 2,
    memberId: 'DV-KP5-032',
    memberCode: 'DN-KP5-032',
    memberName: 'Nguyễn Văn Tùng',
    branchId: 'BR-KP5',
    branchName: 'Chi đoàn Khu phố 5',
    workShift: 'rotating_shift',
    missedActivityId: 'ACT-KP5-01',
    missedActivityTitle: 'Sinh hoạt Chi đoàn KP5 tháng 11 — Chuyên đề Chuyển đổi số cơ sở',
    makeupActivityId: 'ACT-KP5-04',
    makeupActivityTitle: 'Sinh hoạt bù KP5 dành cho đoàn viên công nhân làm ca tối Thứ 7',
    makeupDate: '2026-11-28',
    shiftReason: 'Tăng ca xưởng cơ khí Biên Hòa',
    status: 'approved',
    createdAt: '2026-11-16 08:30'
  },
  {
    id: 3,
    memberId: 'DV-KP5-034',
    memberCode: 'DN-KP5-034',
    memberName: 'Lê Quang Hải',
    branchId: 'BR-KP5',
    branchName: 'Chi đoàn Khu phố 5',
    workShift: 'rotating_shift',
    missedActivityId: 'ACT-KP5-02',
    missedActivityTitle: 'Sinh hoạt Chi đoàn KP5 đầu tháng 11 — Triển khai VNeID & an toàn mạng',
    makeupActivityId: 'ACT-KP5-04',
    makeupActivityTitle: 'Sinh hoạt bù KP5 dành cho đoàn viên công nhân làm ca tối Thứ 7',
    makeupDate: '2026-11-28',
    shiftReason: 'Làm ca xoay KCN Loteco',
    status: 'pending',
    createdAt: '2026-11-20 18:15'
  }
];
