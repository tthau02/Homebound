import React, { useEffect, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  LogOut,
  MapPin,
  Megaphone,
  MessageSquare,
  Music,
  Pause,
  Play,
  Shield,
  SkipForward,
  Ticket,
  Volume2,
} from 'lucide-react';
import { DEFAULT_MUSIC_TRACKS, PlayerRole } from '@virtual-bus/shared';
import { useMultiplayerStore } from '../../stores/useMultiplayerStore';

export const MultiplayerSocialHub: React.FC = () => {
  const isOnlineMode = useMultiplayerStore((state) => state.isOnlineMode);
  const isHostPeer = useMultiplayerStore((state) => state.isHostPeer);
  const currentRoom = useMultiplayerStore((state) => state.currentRoom);
  const privateChatMessages = useMultiplayerStore(
    (state) => state.privateChatMessages
  );
  const blockedPlayerIds = useMultiplayerStore(
    (state) => state.blockedPlayerIds
  );
  const friends = useMultiplayerStore((state) => state.friends);
  const incomingFriendRequests = useMultiplayerStore(
    (state) => state.incomingFriendRequests
  );
  const incomingMatchOffers = useMultiplayerStore(
    (state) => state.incomingMatchOffers
  );
  const moderationReports = useMultiplayerStore(
    (state) => state.moderationReports
  );
  const resolveModerationReport = useMultiplayerStore(
    (state) => state.resolveModerationReport
  );
  const matchmakingEnabled = useMultiplayerStore(
    (state) => state.matchmakingEnabled
  );
  const user = useMultiplayerStore((state) => state.user);
  const isSocialPanelOpen = useMultiplayerStore(
    (state) => state.isSocialPanelOpen
  );
  const setSocialPanelOpen = useMultiplayerStore(
    (state) => state.setSocialPanelOpen
  );
  const activeTab = useMultiplayerStore((state) => state.activeSocialTab);
  const setActiveTab = useMultiplayerStore((state) => state.setActiveSocialTab);

  const privateChatTargetId = useMultiplayerStore(
    (state) => state.privateChatTargetId
  );
  const setPrivateChatTargetId = useMultiplayerStore(
    (state) => state.setPrivateChatTargetId
  );

  const emitChatMessage = useMultiplayerStore((state) => state.emitChatMessage);
  const emitJourneyControl = useMultiplayerStore(
    (state) => state.emitJourneyControl
  );
  const emitTicketAction = useMultiplayerStore(
    (state) => state.emitTicketAction
  );
  const emitMusicControl = useMultiplayerStore(
    (state) => state.emitMusicControl
  );
  const emitRoleAssign = useMultiplayerStore((state) => state.emitRoleAssign);
  const emitDisembark = useMultiplayerStore((state) => state.emitDisembark);
  const emitReturnToBus = useMultiplayerStore((state) => state.emitReturnToBus);
  const emitBlockPlayer = useMultiplayerStore((state) => state.emitBlockPlayer);
  const emitUnblockPlayer = useMultiplayerStore((state) => state.emitUnblockPlayer);
  const emitReportPlayer = useMultiplayerStore((state) => state.emitReportPlayer);
  const emitFriendRequest = useMultiplayerStore((state) => state.emitFriendRequest);
  const emitFriendResponse = useMultiplayerStore((state) => state.emitFriendResponse);
  const setMatchmakingEnabled = useMultiplayerStore(
    (state) => state.setMatchmakingEnabled
  );
  const emitMatchResponse = useMultiplayerStore(
    (state) => state.emitMatchResponse
  );
  const updateProfile = useMultiplayerStore((state) => state.updateProfile);
  const leaveCurrentRoom = useMultiplayerStore(
    (state) => state.leaveCurrentRoom
  );

  const [chatText, setChatText] = useState('');
  const [announcementInput, setAnnouncementInput] = useState('');
  const [copiedRoomCode, setCopiedRoomCode] = useState(false);
  const [reportReason, setReportReason] = useState('harassment');
  const [profileBio, setProfileBio] = useState('');
  const [profileInterests, setProfileInterests] = useState('');
  const [profileVisibility, setProfileVisibility] = useState<'public' | 'private'>('public');

  useEffect(() => {
    setProfileBio(user?.bio ?? '');
    setProfileInterests(user?.interests?.join(', ') ?? '');
    setProfileVisibility(user?.profileVisibility ?? 'public');
  }, [user?.id, user?.bio, user?.interests, user?.profileVisibility]);

  if (!isOnlineMode || !currentRoom || !user) return null;

  const selfPlayer = currentRoom.players[user.id];
  const myRole: PlayerRole = selfPlayer?.role ?? 'PASSENGER';
  const isDriverOrOwner = myRole === 'DRIVER' || myRole === 'OWNER';
  const isStaff =
    myRole === 'DRIVER' || myRole === 'ASSISTANT' || myRole === 'OWNER';

  const currentTrack =
    DEFAULT_MUSIC_TRACKS[
      currentRoom.music.currentTrackIndex % DEFAULT_MUSIC_TRACKS.length
    ] ?? DEFAULT_MUSIC_TRACKS[0];

  const myTicket = currentRoom.tickets[user.id];
  const visiblePrivateMessages = privateChatTargetId
    ? privateChatMessages.filter(
        (message) =>
          (message.senderId === user.id &&
            message.recipientId === privateChatTargetId) ||
          (message.senderId === privateChatTargetId &&
            message.recipientId === user.id)
      )
    : [];
  const visibleChatMessages = [
    ...currentRoom.chatHistory.filter(
      (message) =>
        message.scope !== 'PRIVATE' &&
        (message.scope === 'SYSTEM' ||
          !blockedPlayerIds.includes(message.senderId))
    ),
    ...visiblePrivateMessages,
  ].sort((left, right) => left.createdAt.localeCompare(right.createdAt));

  const handleCopyRoomCode = () => {
    navigator.clipboard?.writeText(currentRoom.roomId);
    setCopiedRoomCode(true);
    window.setTimeout(() => setCopiedRoomCode(false), 1800);
  };

  const handleSendRoomChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim()) return;
    emitChatMessage(chatText.trim(), privateChatTargetId);
    setChatText('');
  };

  const handleSendAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementInput.trim()) return;
    emitJourneyControl('START', announcementInput.trim());
    setAnnouncementInput('');
  };

  const handleSaveProfile = (event: React.FormEvent) => {
    event.preventDefault();
    updateProfile({
      bio: profileBio,
      interests: profileInterests
        .split(',')
        .map((interest) => interest.trim())
        .filter(Boolean)
        .slice(0, 8),
      profileVisibility,
    });
  };

  return (
    <div className="pointer-events-auto flex flex-col items-end gap-2">
      {/* Toggle Pill & Shareable P2P Room Code */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleCopyRoomCode}
          title="Copy Mã chuyến xe để mời bạn bè kết nối P2P"
          className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 text-xs font-mono font-bold shadow-lg flex items-center gap-1.5"
        >
          <span>Mã P2P: {currentRoom.roomId}</span>
          {copiedRoomCode ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setSocialPanelOpen(!isSocialPanelOpen)}
          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg flex items-center gap-2"
        >
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span>
            {isHostPeer ? 'Host P2P' : 'Peer P2P'}: {currentRoom.name} ({myRole})
          </span>
        </button>

        <button
          type="button"
          onClick={leaveCurrentRoom}
          title="Rời phòng xe"
          className="p-2 rounded-xl bg-rose-950/85 hover:bg-rose-900 border border-rose-700/60 text-rose-200 shadow-lg"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {isSocialPanelOpen && (
        <div className="w-80 sm:w-96 rounded-2xl bg-slate-950/90 backdrop-blur-xl border border-slate-800 shadow-2xl overflow-hidden text-slate-100">
          {/* Navigation Tabs */}
          <div className="grid grid-cols-5 bg-slate-900/90 border-b border-slate-800 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`py-2.5 flex flex-col items-center gap-1 ${
                activeTab === 'chat'
                  ? 'text-amber-400 border-b-2 border-amber-400 bg-slate-950/60'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('journey')}
              className={`py-2.5 flex flex-col items-center gap-1 ${
                activeTab === 'journey'
                  ? 'text-amber-400 border-b-2 border-amber-400 bg-slate-950/60'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Trạm dừng</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('tickets')}
              className={`py-2.5 flex flex-col items-center gap-1 ${
                activeTab === 'tickets'
                  ? 'text-amber-400 border-b-2 border-amber-400 bg-slate-950/60'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Vé xe</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('music')}
              className={`py-2.5 flex flex-col items-center gap-1 ${
                activeTab === 'music'
                  ? 'text-amber-400 border-b-2 border-amber-400 bg-slate-950/60'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Nhạc</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('roles')}
              className={`py-2.5 flex flex-col items-center gap-1 ${
                activeTab === 'roles'
                  ? 'text-amber-400 border-b-2 border-amber-400 bg-slate-950/60'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Vai trò</span>
            </button>
          </div>

          {/* Tab 1: Realtime Public & Private Chat */}
          {activeTab === 'chat' && (
            <div className="p-3 space-y-2.5">
              <div className="h-44 overflow-y-auto space-y-1.5 pr-1">
                {visibleChatMessages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-2 rounded-xl text-xs ${
                      m.scope === 'SYSTEM'
                        ? 'bg-amber-500/15 border border-amber-500/30 text-amber-200'
                        : m.scope === 'PRIVATE'
                          ? 'bg-purple-950/70 border border-purple-500/40 text-purple-100'
                          : 'bg-slate-900/90 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                      <span className="font-bold text-slate-200">
                        {m.senderAvatar} {m.senderName}{' '}
                        {m.scope === 'PRIVATE' &&
                          `→ 🔒 ${m.recipientName ?? 'Riêng tư'}`}
                      </span>
                      <span>{m.senderRole}</span>
                    </div>
                    <p className="break-words leading-snug">{m.content}</p>
                  </div>
                ))}
              </div>

              {/* Recipient Selector (Public vs Private 1-on-1) */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400 text-[11px]">Gửi tới:</span>
                <select
                  value={privateChatTargetId ?? ''}
                  onChange={(e) =>
                    setPrivateChatTargetId(e.target.value || null)
                  }
                  className="flex-1 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                >
                  <option value="">📢 Cả phòng xe (Public Chat)</option>
                  {Object.values(currentRoom.players)
                    .filter((p) => p.connected && p.playerId !== user.id)
                    .map((p) => (
                      <option key={p.playerId} value={p.playerId}>
                        🔒 Nhắn riêng: {p.displayName} ({p.role})
                      </option>
                    ))}
                </select>
              </div>

              {privateChatTargetId && (
                <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/70 p-2">
                  <button
                    type="button"
                    disabled={friends.includes(privateChatTargetId)}
                    onClick={() => emitFriendRequest(privateChatTargetId)}
                    className="rounded-md bg-emerald-950/70 px-2 py-1 text-[10px] font-semibold text-emerald-200 hover:bg-emerald-900 disabled:opacity-60"
                  >
                    {friends.includes(privateChatTargetId)
                      ? '✓ Bạn trong danh sách'
                      : '＋ Kết bạn'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      blockedPlayerIds.includes(privateChatTargetId)
                        ? emitUnblockPlayer(privateChatTargetId)
                        : emitBlockPlayer(privateChatTargetId)
                    }
                    className="rounded-md bg-rose-950/70 px-2 py-1 text-[10px] font-semibold text-rose-200 hover:bg-rose-900"
                  >
                    {blockedPlayerIds.includes(privateChatTargetId)
                      ? 'Bỏ chặn'
                      : 'Chặn người chơi'}
                  </button>
                  <select
                    value={reportReason}
                    onChange={(event) => setReportReason(event.target.value)}
                    className="rounded-md bg-slate-900 px-2 py-1 text-[10px] text-slate-200"
                    aria-label="Lý do báo cáo"
                  >
                    <option value="harassment">Quấy rối</option>
                    <option value="spam">Spam</option>
                    <option value="inappropriate">Nội dung không phù hợp</option>
                    <option value="other">Khác</option>
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      emitReportPlayer(privateChatTargetId, reportReason)
                    }
                    className="rounded-md bg-amber-950/70 px-2 py-1 text-[10px] font-semibold text-amber-200 hover:bg-amber-900"
                  >
                    Báo cáo
                  </button>
                </div>
              )}

              {incomingFriendRequests.length > 0 && (
                <div className="space-y-1 rounded-lg border border-emerald-800/60 bg-emerald-950/30 p-2">
                  <p className="text-[10px] font-bold text-emerald-300">
                    Lời mời kết bạn trong phòng
                  </p>
                  {incomingFriendRequests.map((request) => (
                    <div
                      key={request.playerId}
                      className="flex items-center justify-between gap-2 text-[10px]"
                    >
                      <span className="text-slate-200">{request.displayName}</span>
                      <span className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => emitFriendResponse(request.playerId, true)}
                          className="rounded bg-emerald-700 px-2 py-1 font-bold text-white"
                        >
                          Chấp nhận
                        </button>
                        <button
                          type="button"
                          onClick={() => emitFriendResponse(request.playerId, false)}
                          className="rounded bg-slate-800 px-2 py-1 text-slate-300"
                        >
                          Từ chối
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-lg border border-sky-800/60 bg-sky-950/30 p-2 space-y-2">
                <button
                  type="button"
                  onClick={() => setMatchmakingEnabled(!matchmakingEnabled)}
                  className={`w-full rounded-md px-2 py-1.5 text-[10px] font-bold ${
                    matchmakingEnabled
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  {matchmakingEnabled
                    ? '🔎 Đang opt-in tìm bạn đồng hành • Tắt'
                    : '🔎 Tìm bạn đồng hành (tự nguyện)'}
                </button>
                <p className="text-[10px] text-slate-400">
                  Chỉ ghép với người trong phòng đã chủ động bật; cả hai phải chấp nhận.
                </p>
              </div>

              {incomingMatchOffers.map((offer) => (
                <div
                  key={offer.offerId}
                  className="flex items-center justify-between gap-2 rounded-lg border border-sky-700/60 bg-sky-950/50 p-2"
                >
                  <span className="text-[10px] text-sky-100">
                    {offer.displayName} muốn kết nối. Chấp nhận?
                  </span>
                  <span className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => emitMatchResponse(offer.offerId, true)}
                      className="rounded bg-emerald-700 px-2 py-1 text-[10px] font-bold text-white"
                    >
                      Đồng ý
                    </button>
                    <button
                      type="button"
                      onClick={() => emitMatchResponse(offer.offerId, false)}
                      className="rounded bg-slate-800 px-2 py-1 text-[10px] text-slate-300"
                    >
                      Từ chối
                    </button>
                  </span>
                </div>
              ))}

              <form
                onSubmit={handleSaveProfile}
                className="space-y-1.5 rounded-lg border border-slate-800 bg-slate-950/70 p-2"
              >
                <p className="text-[10px] font-bold text-slate-300">Hồ sơ người chơi</p>
                <input
                  value={profileBio}
                  maxLength={160}
                  onChange={(event) => setProfileBio(event.target.value)}
                  placeholder="Giới thiệu ngắn"
                  className="w-full rounded-md bg-slate-900 px-2 py-1 text-[10px] text-white"
                />
                <input
                  value={profileInterests}
                  onChange={(event) => setProfileInterests(event.target.value)}
                  placeholder="Sở thích, cách nhau bằng dấu phẩy"
                  className="w-full rounded-md bg-slate-900 px-2 py-1 text-[10px] text-white"
                />
                <div className="flex items-center gap-2">
                  <select
                    value={profileVisibility}
                    onChange={(event) =>
                      setProfileVisibility(event.target.value as 'public' | 'private')
                    }
                    className="flex-1 rounded-md bg-slate-900 px-2 py-1 text-[10px] text-white"
                    aria-label="Quyền hiển thị hồ sơ"
                  >
                    <option value="public">Hiện hồ sơ trong phòng</option>
                    <option value="private">Ẩn giới thiệu và sở thích</option>
                  </select>
                  <button
                    type="submit"
                    className="rounded-md bg-slate-700 px-2 py-1 text-[10px] font-bold text-white hover:bg-slate-600"
                  >
                    Lưu hồ sơ
                  </button>
                </div>
              </form>

              <form onSubmit={handleSendRoomChat} className="flex gap-1.5">
                <input
                  type="text"
                  maxLength={110}
                  disabled={Boolean(
                    privateChatTargetId &&
                      blockedPlayerIds.includes(privateChatTargetId)
                  )}
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  placeholder={
                    privateChatTargetId
                      ? 'Nhập tin nhắn riêng tư...'
                      : 'Nhập tin nhắn cho cả chuyến xe...'
                  }
                  className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                />
                <button
                  type="submit"
                  disabled={Boolean(
                    privateChatTargetId &&
                      blockedPlayerIds.includes(privateChatTargetId)
                  )}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                >
                  Gửi
                </button>
              </form>
            </div>
          )}

          {/* Tab 2: Bus Journey & Bus Stops + Driver Controls */}
          {activeTab === 'journey' && (
            <div className="p-3.5 space-y-3 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <p className="font-bold text-amber-400">
                  {currentRoom.route.name}
                </p>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Trạng thái: <strong>{currentRoom.journey.status}</strong> • Tốc
                  độ: <strong>{currentRoom.journey.speedKmh} km/h</strong>
                </p>
                <p className="text-[11px] text-sky-200 mt-1">
                  Thời tiết đồng bộ: <strong>{currentRoom.journey.weather === 'SUNNY' ? 'Nắng' : currentRoom.journey.weather === 'CLOUDY' ? 'Nhiều mây' : 'Mưa nhẹ'}</strong>
                </p>
              </div>

              {/* Stops Timeline */}
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {currentRoom.route.stops.map((st, idx) => {
                  const isCurrent =
                    idx === currentRoom.journey.currentStopOrder;
                  const isPassed = idx < currentRoom.journey.currentStopOrder;
                  return (
                    <div
                      key={st.id}
                      className={`flex items-center justify-between p-2 rounded-xl border ${
                        isCurrent
                          ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
                          : isPassed
                            ? 'bg-slate-900/40 border-slate-800/50 text-slate-500'
                            : 'bg-slate-900/80 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div>
                        <p className="font-semibold">
                          {idx + 1}. {st.name}
                        </p>
                        <p className="text-[10px] opacity-80">
                          {st.description}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono shrink-0">
                        {st.distanceKm} km
                      </span>
                    </div>
                  );
                })}
              </div>

              {currentRoom.journey.status === 'AT_STOP' && selfPlayer && (
                <div className="rounded-xl border border-emerald-700/60 bg-emerald-950/40 p-2.5 space-y-2">
                  <p className="font-bold text-emerald-300">
                    Hoạt động tại {currentRoom.route.stops[currentRoom.journey.currentStopOrder]?.name ?? 'trạm dừng'}
                  </p>
                  {selfPlayer.isDisembarked ? (
                    <>
                      <p className="text-[11px] text-emerald-100/80">
                        Đi bộ bằng WASD quanh khu vực trạm. Chạm khung ảnh màu vàng để check-in nhóm.
                      </p>
                      <button
                        type="button"
                        onClick={emitReturnToBus}
                        className="w-full rounded-lg bg-sky-600 px-3 py-2 font-bold text-white hover:bg-sky-500"
                      >
                        🚌 Quay lại xe
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={emitDisembark}
                      className="w-full rounded-lg bg-emerald-600 px-3 py-2 font-bold text-white hover:bg-emerald-500"
                    >
                      🚶 Xuống xe khám phá trạm
                    </button>
                  )}
                </div>
              )}

              {/* Driver & Assistant Controls */}
              {isStaff ? (
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <p className="text-[11px] font-bold text-sky-400">
                    Bảng điều khiển Tài xế / Phụ xe:
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => emitJourneyControl('START')}
                      className="py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                    >
                      ▶ Cho xe chạy
                    </button>
                    <button
                      type="button"
                      onClick={() => emitJourneyControl('PAUSE')}
                      className="py-1.5 px-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold"
                    >
                      ⏸ Tạm dừng
                    </button>
                    <button
                      type="button"
                      onClick={() => emitJourneyControl('NEXT_STOP')}
                      className="py-1.5 px-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold"
                    >
                      📍 Dừng trạm kế
                    </button>
                    <button
                      type="button"
                      onClick={() => emitJourneyControl('COMPLETE')}
                      className="py-1.5 px-2 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-semibold"
                    >
                      🏁 Kết thúc chuyến
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const nextWeather = currentRoom.journey.weather === 'SUNNY'
                          ? 'CLOUDY'
                          : currentRoom.journey.weather === 'CLOUDY'
                            ? 'RAINY'
                            : 'SUNNY';
                        emitJourneyControl('SET_WEATHER', undefined, nextWeather);
                      }}
                      className="py-1.5 px-2 rounded-lg bg-indigo-700 hover:bg-indigo-600 text-white font-semibold"
                    >
                      🌦️ Đổi thời tiết
                    </button>
                  </div>

                  {isDriverOrOwner && (
                    <form
                      onSubmit={handleSendAnnouncement}
                      className="flex gap-1.5 pt-1"
                    >
                      <input
                        type="text"
                        value={announcementInput}
                        onChange={(e) => setAnnouncementInput(e.target.value)}
                        placeholder="Phát thông báo loa xe..."
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                      />
                      <button
                        type="submit"
                        className="px-2.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold flex items-center gap-1"
                      >
                        <Megaphone className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">
                  (Chỉ Tài xế hoặc Phụ xe mới có thể điều khiển trạm dừng)
                </p>
              )}
            </div>
          )}

          {/* Tab 3: Ticket System */}
          {activeTab === 'tickets' && (
            <div className="p-3.5 space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400">
                    Vé xe của bạn
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                    {myTicket?.status ?? 'CHƯA ĐẶT GHẾ'}
                  </span>
                </div>
                <p className="text-slate-300">
                  Ghế ngồi:{' '}
                  <strong>{selfPlayer?.seatId ?? 'Chưa ngồi vào ghế'}</strong> •
                  Giá vé:{' '}
                  <strong>
                    {currentRoom.route.ticketPrice.toLocaleString('vi-VN')}đ
                  </strong>
                </p>
                <p className="text-slate-400 text-[11px]">
                  Số dư ví ảo:{' '}
                  <strong className="text-emerald-300">
                    {user.walletBalance.toLocaleString('vi-VN')}đ
                  </strong>
                </p>

                {(!myTicket || myTicket.status === 'BOOKED') && (
                  <button
                    type="button"
                    onClick={() => emitTicketAction('PAY', user.id)}
                    className="w-full mt-2 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold flex items-center justify-center gap-1.5"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>
                      Thanh toán vé ({currentRoom.route.ticketPrice.toLocaleString('vi-VN')}đ)
                    </span>
                  </button>
                )}
              </div>

              {/* Assistant Ticket Collection Panel */}
              {isStaff && (
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sky-400">
                      Soát vé & Thu tiền (Phụ xe):
                    </span>
                    <button
                      type="button"
                      onClick={() => emitTicketAction('COLLECT_ALL')}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px]"
                    >
                      💵 Thu tiền & Soát tất cả
                    </button>
                  </div>

                  <div className="max-h-36 overflow-y-auto space-y-1">
                    {Object.values(currentRoom.players)
                      .filter((p) => p.connected)
                      .map((p) => {
                        const t = currentRoom.tickets[p.playerId];
                        return (
                          <div
                            key={p.playerId}
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800"
                          >
                            <div>
                              <p className="font-semibold text-white">
                                {p.displayName} (Ghế {p.seatId ?? 'Trống'})
                              </p>
                              <p className="text-[10px] text-slate-400">
                                Vé: {t?.status ?? 'Chưa mua'}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                emitTicketAction('CHECK', p.playerId)
                              }
                              className="px-2 py-1 rounded bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 text-[10px] font-semibold flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Soát vé</span>
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Synchronized Room Music Player */}
          {activeTab === 'music' && (
            <div className="p-3.5 space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <p className="text-[10px] font-semibold uppercase text-amber-400">
                  Đang phát đồng bộ toàn phòng
                </p>
                <p className="text-sm font-bold text-white">
                  🎵 {currentTrack.title}
                </p>
                <p className="text-xs text-slate-400">
                  Nghệ sĩ: {currentTrack.artist} • {currentTrack.tempoBpm} BPM
                </p>
                <p className="text-[10px] text-slate-500">
                  Cập nhật bởi: {currentRoom.music.updatedBy}
                </p>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    emitMusicControl(
                      currentRoom.music.isPlaying ? 'PAUSE' : 'PLAY'
                    )
                  }
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  {currentRoom.music.isPlaying ? (
                    <>
                      <Pause className="w-4 h-4" />
                      <span>Tạm dừng</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>Phát nhạc</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => emitMusicControl('NEXT')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
                >
                  <SkipForward className="w-4 h-4" />
                  <span>Bài kế</span>
                </button>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <Volume2 className="w-4 h-4 text-amber-400" />
                <span className="text-slate-300">Âm lượng:</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={currentRoom.music.volume}
                  onChange={(e) =>
                    emitMusicControl('VOLUME', Number(e.target.value))
                  }
                  className="flex-1 accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Tab 5: Role Management (Owner / Driver / Assistant / Passenger) */}
          {activeTab === 'roles' && (
            <div className="p-3.5 space-y-3 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <p className="text-slate-300">
                  Vai trò hiện tại của bạn:{' '}
                  <strong className="text-amber-400">{myRole}</strong>
                </p>
                <p className="text-[11px] text-slate-400">
                  Tài xế: <strong>{currentRoom.driverName}</strong> • Phụ xe:{' '}
                  <strong>{currentRoom.assistantName}</strong>
                </p>
              </div>

              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-slate-300">
                  Chuyển đổi vai trò của bạn trên xe:
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => emitRoleAssign(user.id, 'DRIVER')}
                    className={`py-2 rounded-xl font-bold border ${
                      myRole === 'DRIVER'
                        ? 'bg-sky-600 text-white border-sky-400'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    👨‍✈️ Tài xế
                  </button>
                  <button
                    type="button"
                    onClick={() => emitRoleAssign(user.id, 'ASSISTANT')}
                    className={`py-2 rounded-xl font-bold border ${
                      myRole === 'ASSISTANT'
                        ? 'bg-emerald-600 text-white border-emerald-400'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    🧢 Phụ xe
                  </button>
                  <button
                    type="button"
                    onClick={() => emitRoleAssign(user.id, 'PASSENGER')}
                    className={`py-2 rounded-xl font-bold border ${
                      myRole === 'PASSENGER'
                        ? 'bg-amber-500 text-slate-950 border-amber-300'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    🧑‍🚀 Hành khách
                  </button>
                </div>
              </div>

              {isHostPeer && (
                <div className="space-y-2 border-t border-slate-800 pt-3">
                  <p className="font-bold text-rose-300">
                    Báo cáo trong phiên ({moderationReports.length})
                  </p>
                  {moderationReports.length === 0 ? (
                    <p className="text-[10px] text-slate-400">Chưa có báo cáo cần xem.</p>
                  ) : (
                    moderationReports.map((report) => (
                      <div
                        key={report.id}
                        className="flex items-center justify-between gap-2 rounded-lg bg-slate-900 p-2"
                      >
                        <p className="text-[10px] text-slate-200">
                          {currentRoom.players[report.reporterId]?.displayName ?? 'Người chơi'}
                          {' → '}
                          {currentRoom.players[report.targetId]?.displayName ?? 'Người chơi'}
                          {' • '}{report.reason}
                        </p>
                        <button
                          type="button"
                          onClick={() => resolveModerationReport(report.id)}
                          className="shrink-0 rounded bg-slate-700 px-2 py-1 text-[10px] text-white"
                        >
                          Đã xem
                        </button>
                      </div>
                    ))
                  )}
                  <p className="text-[9px] text-slate-500">
                    Report chỉ tồn tại trên host trong phiên hiện tại; nội dung chat riêng không được đính kèm.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

