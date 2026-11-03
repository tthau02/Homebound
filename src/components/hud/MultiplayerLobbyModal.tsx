import React, { useEffect, useState } from 'react';
import {
  Bus,
  Check,
  Copy,
  Hash,
  LogIn,
  LogOut,
  MapPin,
  PlusCircle,
  Radio,
  RefreshCw,
  UserPlus,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useMultiplayerStore } from '../../stores/useMultiplayerStore';

const AVATAR_CHOICES = ['🧑‍🚀', '👩‍💻', '👨‍✈️', '🧢', '👩‍🎨', '🎸', '👩‍⚕️', '👨‍💼'];
const COLOR_CHOICES = [
  '#f59e0b',
  '#2563eb',
  '#059669',
  '#db2777',
  '#7c3aed',
  '#dc2626',
];

export const MultiplayerLobbyModal: React.FC = () => {
  const isLobbyModalOpen = useMultiplayerStore(
    (state) => state.isLobbyModalOpen
  );
  const setLobbyModalOpen = useMultiplayerStore(
    (state) => state.setLobbyModalOpen
  );
  const user = useMultiplayerStore((state) => state.user);
  const authError = useMultiplayerStore((state) => state.authError);
  const rooms = useMultiplayerStore((state) => state.rooms);
  const routes = useMultiplayerStore((state) => state.routes);
  const currentRoom = useMultiplayerStore((state) => state.currentRoom);
  const p2pStatusText = useMultiplayerStore((state) => state.p2pStatusText);

  const login = useMultiplayerStore((state) => state.login);
  const register = useMultiplayerStore((state) => state.register);
  const logout = useMultiplayerStore((state) => state.logout);
  const fetchRoomsAndRoutes = useMultiplayerStore(
    (state) => state.fetchRoomsAndRoutes
  );
  const createAndJoinRoom = useMultiplayerStore(
    (state) => state.createAndJoinRoom
  );
  const joinRoom = useMultiplayerStore((state) => state.joinRoom);

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatar, setAvatar] = useState(AVATAR_CHOICES[0]);
  const [shirtColor, setShirtColor] = useState(COLOR_CHOICES[0]);

  const [directRoomCode, setDirectRoomCode] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [newRoomCode, setNewRoomCode] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState(
    routes[0]?.id ?? 'route-ql1a-mientay'
  );

  useEffect(() => {
    if (isLobbyModalOpen && user) {
      fetchRoomsAndRoutes();
    }
  }, [isLobbyModalOpen, user, fetchRoomsAndRoutes]);

  if (!isLobbyModalOpen) return null;

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'login') {
      await login({ username, password });
    } else {
      await register({
        username,
        password,
        displayName,
        avatar,
        shirtColor,
      });
    }
  };

  const handleQuickDemoLogin = async (demoUsername: string) => {
    await login({ username: demoUsername, password: '123456' });
  };

  const handleDirectCodeJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directRoomCode.trim()) return;
    joinRoom(directRoomCode.trim().toUpperCase());
    setDirectRoomCode('');
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    const ok = await createAndJoinRoom({
      roomCode: newRoomCode.trim() || undefined,
      name: newRoomName.trim(),
      routeId: selectedRouteId,
      maxPlayers: 28,
    });
    if (ok) {
      setNewRoomCode('');
      setNewRoomName('');
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    window.setTimeout(() => setCopiedCode(null), 1800);
  };

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden text-slate-100">
        {/* Top Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-red-950/80 via-slate-900 to-amber-950/60 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-amber-500 text-white shadow-md">
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Bến Xe P2P WebRTC — Virtual Bus Multiplayer
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  100% P2P • No Backend
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Kết nối trực tiếp Peer-to-Peer (PeerJS WebRTC + Đa Tab) qua Mã Chuyến Xe mà không cần chạy Server
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setLobbyModalOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 max-h-[82vh] overflow-y-auto">
          {!user ? (
            /* ==================== AUTHENTICATION VIEW ==================== */
            <div className="space-y-5">
              {/* Mode Switch Tabs */}
              <div className="flex gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800 w-fit">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    authMode === 'login'
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Đăng nhập nhanh</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    authMode === 'register'
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Tạo hồ sơ nhân vật</span>
                </button>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-xs text-rose-200">
                  {authError}
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Tên đăng nhập (Username)
                    </label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="VD: minh_cantho"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Mật khẩu (Lưu trình duyệt)
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {authMode === 'register' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Tên hiển thị trong xe (Display Name)
                      </label>
                      <input
                        type="text"
                        required
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="VD: Minh Khoa Cần Thơ"
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Chọn Avatar
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {AVATAR_CHOICES.map((av) => (
                            <button
                              key={av}
                              type="button"
                              onClick={() => setAvatar(av)}
                              className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center border transition-all ${
                                avatar === av
                                  ? 'bg-amber-500/25 border-amber-400 scale-105'
                                  : 'bg-slate-950 border-slate-800'
                              }`}
                            >
                              {av}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Màu áo nhân vật 3D
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {COLOR_CHOICES.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setShirtColor(c)}
                              style={{ backgroundColor: c }}
                              className={`w-8 h-8 rounded-full border-2 transition-all ${
                                shirtColor === c
                                  ? 'border-white scale-110'
                                  : 'border-transparent opacity-75'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-bold text-sm shadow-lg transition-all"
                >
                  {authMode === 'login'
                    ? 'Vào Bến Xe P2P'
                    : 'Tạo Hồ Sơ & Vào Bến Xe P2P'}
                </button>
              </form>

              {/* Quick Demo Accounts for Instant Multi-Tab / Multi-Device P2P Testing */}
              <div className="pt-4 border-t border-slate-800">
                <p className="text-xs font-semibold text-slate-400 mb-2.5">
                  Chọn nhanh nhân vật mẫu (Hỗ trợ mở nhiều tab hoặc nhiều máy khác nhau):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('taixe')}
                    className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-all"
                  >
                    <p className="text-xs font-bold text-sky-400">
                      👨‍✈️ Bác Tài Minh
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Vai trò mặc định: Tài xế
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('phuxe')}
                    className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-all"
                  >
                    <p className="text-xs font-bold text-emerald-400">
                      🧢 Phụ Xe Tùng
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Vai trò mặc định: Phụ xe
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('hanhkhach')}
                    className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-all"
                  >
                    <p className="text-xs font-bold text-amber-400">
                      🧑‍🚀 Hành Khách Khoa
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Vai trò mặc định: Hành khách
                    </p>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ==================== P2P ROOM LOBBY VIEW ==================== */
            <div className="space-y-5">
              {/* Authenticated User Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl">
                    {user.avatar}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-white">
                        {user.displayName}
                      </p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                        <Radio className="w-2.5 h-2.5 animate-pulse" />
                        <span>{p2pStatusText}</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                      <span>
                        Ví tiền ảo:{' '}
                        <strong className="text-emerald-300">
                          {user.walletBalance.toLocaleString('vi-VN')}đ
                        </strong>
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={fetchRoomsAndRoutes}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Làm mới</span>
                  </button>
                  <button
                    type="button"
                    onClick={logout}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-700/50 text-xs font-semibold text-rose-200"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Đổi nhân vật</span>
                  </button>
                </div>
              </div>

              {/* Direct P2P Room Code Join Bar */}
              <form
                onSubmit={handleDirectCodeJoin}
                className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-950 to-emerald-500/10 border border-amber-500/40 space-y-2"
              >
                <label className="block text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Hash className="w-4 h-4" />
                  <span>
                    Nhập Mã Chuyến Xe (Room Code) để kết nối P2P với máy khác:
                  </span>
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={directRoomCode}
                    onChange={(e) =>
                      setDirectRoomCode(e.target.value.toUpperCase())
                    }
                    placeholder="Nhập mã phòng (VD: MIENTAY-01, DALAT-02, XE-VIP-88)..."
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 font-mono text-xs uppercase text-amber-300 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md transition-all"
                  >
                    Kết nối P2P & Lên xe →
                  </button>
                </div>
              </form>

              {/* Active Rooms List */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                  Các tuyến xe P2P phổ biến ({rooms.length})
                </h3>
                <div className="space-y-2.5">
                  {rooms.map((rm) => {
                    const isCurrent = currentRoom?.roomId === rm.roomId;
                    return (
                      <div
                        key={rm.roomId}
                        className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 hover:border-slate-700 transition-all"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-white">
                              {rm.name}
                            </span>

                            {/* Room Code Pill + Copy Button */}
                            <button
                              type="button"
                              onClick={() => handleCopyCode(rm.roomId)}
                              title="Copy Mã chuyến xe để gửi cho bạn bè"
                              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-mono text-[11px] font-bold transition-all"
                            >
                              <span>Mã: {rm.roomId}</span>
                              {copiedCode === rm.roomId ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3 opacity-80" />
                              )}
                            </button>

                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              {rm.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-red-400" />
                            <span>{rm.routeName}</span>
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Tài xế:{' '}
                            <strong className="text-slate-200">
                              {rm.driverName}
                            </strong>{' '}
                            • Phụ xe:{' '}
                            <strong className="text-slate-200">
                              {rm.assistantName}
                            </strong>
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-xl">
                            <Users className="w-3.5 h-3.5" />
                            <span>Max {rm.maxPlayers}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => joinRoom(rm.roomId)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                              isCurrent
                                ? 'bg-emerald-600 text-white'
                                : 'bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-400 hover:to-red-400 text-slate-950'
                            }`}
                          >
                            {isCurrent ? 'Đang ở trên xe' : 'Lên xe P2P →'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Create New P2P Bus Room Form */}
              <form
                onSubmit={handleCreateRoom}
                className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3"
              >
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4" />
                  <span>Tạo phòng chuyến xe P2P mới</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={newRoomCode}
                    onChange={(e) =>
                      setNewRoomCode(e.target.value.toUpperCase())
                    }
                    placeholder="Mã phòng (VD: VIP-888)"
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 font-mono text-xs uppercase text-amber-300 focus:outline-none focus:border-amber-500"
                  />
                  <input
                    type="text"
                    required
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="Tên chuyến xe (VD: Xe Đêm Cần Thơ)"
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <select
                    value={selectedRouteId}
                    onChange={(e) => setSelectedRouteId(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {routes.map((rt) => (
                      <option key={rt.id} value={rt.id}>
                        {rt.name} ({rt.ticketPrice.toLocaleString('vi-VN')}đ)
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all"
                >
                  + Tạo phòng P2P & Lên xe làm Chủ phòng / Tài xế
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
