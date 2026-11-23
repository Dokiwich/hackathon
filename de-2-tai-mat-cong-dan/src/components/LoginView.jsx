import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Shield,
  ArrowRight,
  Lock,
  Phone,
  Building,
  UserCheck,
  Check,
  AlertCircle
} from 'lucide-react';
import { WARDS_95 } from '../data/wardsData';
import { getStoredAccounts, registerAccount, authenticateUser } from '../data/accountsData';

export default function LoginView({ currentRole, onLogin }) {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [selectedRole, setSelectedRole] = useState(currentRole || 'citizen'); // 'citizen' | 'agency'

  // Form đăng nhập
  const [loginUsername, setLoginUsername] = useState('canbo.tinh@dongnai.gov.vn');
  const [loginPassword, setLoginPassword] = useState('123');
  const [loginError, setLoginError] = useState('');

  // Form đăng ký
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regPhone] = useState('');
  const [regUnitId, setRegUnitId] = useState('all');
  const [regMsg, setRegMsg] = useState({ text: '', isError: false });

  const storedAccounts = getStoredAccounts();

  function handleSelectQuickAccount(acc) {
    setSelectedRole(acc.role);
    setLoginUsername(acc.username);
    setLoginPassword(acc.password);
    setLoginError('');
  }

  function handleDoLogin(e) {
    e.preventDefault();
    setLoginError('');
    const res = authenticateUser(loginUsername, loginPassword);
    if (!res.success) {
      setLoginError(res.message);
      return;
    }
    const acc = res.account;
    onLogin(acc.role, {
      id: acc.id,
      label: `${acc.fullName} • ${acc.unitName}`,
      agencyWardId: acc.unitId,
      account: acc
    });

    if (acc.role === 'agency') {
      navigate('/agency/dispatch');
    } else {
      navigate('/citizen');
    }
  }

  function handleDoRegister(e) {
    e.preventDefault();
    setRegMsg({ text: '', isError: false });

    if (!regUsername.trim() || !regPassword.trim()) {
      setRegMsg({ text: 'Vui lòng nhập tài khoản và mật khẩu.', isError: true });
      return;
    }

    const unitObj = WARDS_95.find((w) => w.id === regUnitId);
    const unitName =
      selectedRole === 'agency'
        ? regUnitId === 'all'
          ? 'Trung tâm Giám sát Điều hành Đô thị Tỉnh'
          : `UBND ${unitObj?.name}`
        : unitObj
        ? unitObj.name
        : 'Tỉnh Đồng Nai';

    const res = registerAccount({
      username: regUsername,
      password: regPassword,
      fullName: regFullName,
      role: selectedRole,
      unitId: regUnitId,
      unitName,
      phone: regPhone || regUsername
    });

    if (!res.success) {
      setRegMsg({ text: res.message, isError: true });
      return;
    }

    setRegMsg({
      text: 'Đăng ký tài khoản thành công! Bạn có thể chuyển sang Đăng nhập ngay.',
      isError: false
    });
    setLoginUsername(regUsername);
    setLoginPassword(regPassword);
    setActiveTab('login');
  }

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      {/* Tiêu đề trang đăng nhập */}
      <div className="text-center space-y-2">
        <span className="inline-block text-[11px] font-mono tracking-widest uppercase px-3 py-1 bg-sky-50 border border-sky-200 text-sky-800 rounded-full font-bold">
          CỔNG XÁC THỰC DANH TÍNH ĐIỆN TỬ
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          HỆ THỐNG TAI MẮT CÔNG DÂN ĐỒNG NAI
        </h2>
        <p className="text-xs text-slate-500 max-w-lg mx-auto">
          Tách biệt hoàn toàn luồng nghiệp vụ giữa <strong className="text-slate-800">Người Dân</strong> và{' '}
          <strong className="text-slate-800">Cơ Quan Tiếp Nhận Xử Lý</strong>.
        </p>
      </div>

      {/* Hộp khung đăng nhập: Nền trắng, khung xanh biển nhạt, khi chọn chuyển sang khung xám */}
      <div className="bg-white border-2 border-sky-300 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex border-b border-sky-200 mb-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setLoginError('');
            }}
            className={`flex-1 pb-3 text-xs uppercase font-extrabold tracking-wider transition border-b-2 ${
              activeTab === 'login'
                ? 'border-slate-500 text-slate-900'
                : 'border-transparent text-sky-700 hover:text-sky-900'
            }`}
          >
            1. Đăng Nhập Hệ Thống
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setRegMsg({ text: '', isError: false });
            }}
            className={`flex-1 pb-3 text-xs uppercase font-extrabold tracking-wider transition border-b-2 ${
              activeTab === 'register'
                ? 'border-slate-500 text-slate-900'
                : 'border-transparent text-sky-700 hover:text-sky-900'
            }`}
          >
            2. Tạo Tài Khoản Mới
          </button>
        </div>

        {/* Chuyển đổi vai trò: Mặc định khung xanh, khi chọn khung xám */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => {
              setSelectedRole('citizen');
              if (activeTab === 'login') {
                setLoginUsername('0918123456');
                setLoginPassword('123');
              }
            }}
            className={`p-3.5 rounded-xl border-2 text-left transition flex items-center justify-between ${
              selectedRole === 'citizen'
                ? 'bg-slate-200 border-slate-500 text-slate-900 shadow-sm'
                : 'bg-sky-50/50 border-sky-300 text-sky-900 hover:bg-sky-100/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <User className="w-4 h-4 shrink-0 text-slate-700" />
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wide text-slate-900">Người Dân</div>
                <div className="text-[10px] text-slate-600">Gửi phản ánh & xem bản đồ</div>
              </div>
            </div>
            {selectedRole === 'citizen' && <Check className="w-4 h-4 text-slate-800" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole('agency');
              if (activeTab === 'login') {
                setLoginUsername('canbo.tinh@dongnai.gov.vn');
                setLoginPassword('123');
              }
            }}
            className={`p-3.5 rounded-xl border-2 text-left transition flex items-center justify-between ${
              selectedRole === 'agency'
                ? 'bg-slate-200 border-slate-500 text-slate-900 shadow-sm'
                : 'bg-sky-50/50 border-sky-300 text-sky-900 hover:bg-sky-100/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 shrink-0 text-slate-700" />
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wide text-slate-900">Cơ Quan</div>
                <div className="text-[10px] text-slate-600">Phân công & điều phối xử lý</div>
              </div>
            </div>
            {selectedRole === 'agency' && <Check className="w-4 h-4 text-slate-800" />}
          </button>
        </div>

        {/* FORM ĐĂNG NHẬP */}
        {activeTab === 'login' && (
          <form onSubmit={handleDoLogin} className="space-y-4">
            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                {selectedRole === 'agency' ? 'Email / Tài khoản Cán bộ' : 'Số điện thoại / CCCD'}
              </label>
              <div className="relative">
                {selectedRole === 'agency' ? (
                  <Shield className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                ) : (
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                )}
                <input
                  type="text"
                  required
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder={selectedRole === 'agency' ? 'canbo.tinh@dongnai.gov.vn' : '0918 123 456'}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:border-sky-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:border-sky-500 focus:bg-white transition"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-slate-900 hover:bg-sky-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow"
            >
              <span>Vào Giao Diện {selectedRole === 'agency' ? 'Cơ Quan' : 'Người Dân'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* FORM ĐĂNG KÝ */}
        {activeTab === 'register' && (
          <form onSubmit={handleDoRegister} className="space-y-4">
            {regMsg.text && (
              <div
                className={`text-xs p-3 rounded-xl border flex items-center gap-2 ${
                  regMsg.isError
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{regMsg.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Họ và tên
                </label>
                <input
                  type="text"
                  required
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="VD: Nguyễn Văn A"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-sky-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  {selectedRole === 'agency' ? 'Email công vụ' : 'Số điện thoại đăng nhập'}
                </label>
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder={selectedRole === 'agency' ? 'canbo.phuong@dongnai.gov.vn' : '0912 345 678'}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:border-sky-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Mật khẩu
                </label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Tối thiểu 3 ký tự"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:border-sky-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Đơn vị / Địa bàn sinh sống
                </label>
                <select
                  value={regUnitId}
                  onChange={(e) => setRegUnitId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-sky-500 focus:bg-white transition font-medium"
                >
                  {selectedRole === 'agency' && (
                    <option value="all">Trung tâm Điều hành Tỉnh Đồng Nai</option>
                  )}
                  {WARDS_95.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.area.replace('Khu vực ', '')})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-slate-900 hover:bg-sky-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow"
            >
              <UserCheck className="w-4 h-4" />
              <span>Xác Nhận Tạo Tài Khoản</span>
            </button>
          </form>
        )}
      </div>

      {/* DANH SÁCH TÀI KHOẢN MẪU (Mặc định khung xanh, khi chọn khung xám) */}
      <div className="bg-white border-2 border-sky-300 rounded-2xl p-5 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Building className="w-3.5 h-3.5 text-sky-600" />
            Tài Khoản Mẫu Có Sẵn ({storedAccounts.length} tài khoản)
          </span>
          <span className="text-[11px] text-slate-500">Bấm vào để nạp thông tin đăng nhập ngay</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {storedAccounts.map((acc) => (
            <button
              key={acc.id}
              type="button"
              onClick={() => handleSelectQuickAccount(acc)}
              className={`p-3 rounded-xl border-2 text-left transition flex flex-col justify-between ${
                loginUsername === acc.username
                  ? 'bg-slate-200 border-slate-500 text-slate-950 shadow-sm'
                  : 'bg-sky-50/40 border-sky-300 text-slate-700 hover:border-sky-400 hover:bg-sky-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${
                    acc.role === 'agency'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-sky-100 text-sky-800 border-sky-300'
                  }`}
                >
                  {acc.role === 'agency' ? 'Cơ quan' : 'Người dân'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">pass: {acc.password}</span>
              </div>
              <div className="text-xs font-bold truncate text-slate-900">{acc.fullName}</div>
              <div className="text-[11px] font-mono text-slate-500 truncate">{acc.username}</div>
              <div className="text-[10px] text-slate-400 truncate mt-1">{acc.unitName}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
