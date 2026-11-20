import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MessageCircle, Minus, X, Send, Paperclip } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";
import { useFloatingWidgets } from "../../hooks/useFloatingWidgets";
import { chatService } from "../../services";
import "./CustomerSupportChat.css";

const OPEN_POLL_MS = 5000; // while the chat window is open
const IDLE_POLL_MS = 60000; // unread check while minimized (visible tab only)
const SEEN_STORAGE_PREFIX = "rich_apparel_support_seen_";
const MAX_MESSAGE_LENGTH = 1000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // matches existing backend multer limit
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif"];
const STAFF_ROLES = ["admin", "product manager", "supplier manager"];
const AUTO_REPLY_SENDER = "System";

/** Same guard Customer Pulse uses, so an expired token never triggers the
 *  global 401 -> /login redirect from background chat requests. */
const hasValidSessionToken = () => {
  try {
    const token = window.sessionStorage.getItem("token");
    if (!token) return false;
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return false;
    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    if (typeof payload.exp === "number" && payload.exp * 1000 <= Date.now()) {
      return false;
    }
    return Boolean(payload.id);
  } catch {
    return false;
  }
};

const toTime = (message) => {
  const time = new Date(message?.createdAt).getTime();
  return Number.isFinite(time) ? time : 0;
};

const latestTime = (list) => list.reduce((max, m) => Math.max(max, toTime(m)), 0);

const readSeen = (userId) => {
  try {
    const raw = window.localStorage.getItem(`${SEEN_STORAGE_PREFIX}${userId}`);
    if (raw === null) return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
};

const writeSeen = (userId, time) => {
  if (!time) return;
  try {
    window.localStorage.setItem(`${SEEN_STORAGE_PREFIX}${userId}`, String(time));
  } catch {
    // Ignore storage errors (privacy mode / quota)
  }
};

/** Client-side unread: staff/system messages newer than the last time the
 *  customer viewed the conversation on this browser. */
const deriveUnread = (list, userId) => {
  const stored = readSeen(userId);
  if (stored === null && list.length > 0) {
    // First time on this browser: treat existing history as already seen.
    writeSeen(userId, latestTime(list));
    return 0;
  }
  const since = stored ?? 0;
  return list.filter((m) => m.isAdmin && toTime(m) > since).length;
};

const mergeMessages = (existing, incoming) => {
  const byId = new Map();
  [...existing, ...incoming].forEach((m, i) => byId.set(m.id ?? `tmp-${i}`, m));
  return [...byId.values()].sort((a, b) => toTime(a) - toTime(b));
};

const getMessageKind = (message) => {
  if (message.senderName === AUTO_REPLY_SENDER) return "auto";
  return message.isAdmin ? "staff" : "customer";
};

const formatMessageTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const time = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (date.toDateString() === new Date().toDateString()) return time;
  return `${date.toLocaleDateString([], { month: "short", day: "numeric" })}, ${time}`;
};

export const CustomerSupportChat = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { isCartOpen } = useCart();
  const { activeFloatingWidget, openSupport, closeSupport } = useFloatingWidgets();

  const userId = user?.id ?? null;
  const roleName = String(
    typeof user?.role === "string" ? user.role : user?.role?.name || ""
  ).toLowerCase();
  const isStaff = STAFF_ROLES.includes(roleName);
  const canChat = Boolean(isAuthenticated && userId && !isStaff);
  // Same non-intrusive rule as Customer Pulse: stay out of the way of the cart
  // drawer, cart page and checkout/payment controls.
  const suppressed =
    isCartOpen || pathname.startsWith("/cart") || pathname.startsWith("/checkout");
  const hidden = authLoading || isStaff || suppressed;

  // Expanded only while it is the single active floating widget.
  const open = activeFloatingWidget === "support";
  // State is stored with its owner so a different logged-in user never sees it.
  const [conversation, setConversation] = useState({ userId: null, messages: [] });
  const [unreadState, setUnreadState] = useState({ userId: null, count: 0 });
  const [loadState, setLoadState] = useState({ userId: null, loaded: false, error: false });
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState(null); // { file, previewUrl }
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  const viewportRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const openRef = useRef(false);
  const inFlightRef = useRef(false);
  const baselineUserRef = useRef(null);
  const attachmentRef = useRef(null);

  const messages = conversation.userId === userId ? conversation.messages : [];
  const unreadCount = unreadState.userId === userId ? unreadState.count : 0;
  const loaded = loadState.userId === userId && loadState.loaded;
  const loadError = loadState.userId === userId && loadState.error;

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    attachmentRef.current = attachment;
  }, [attachment]);

  // Release any object URL on unmount
  useEffect(
    () => () => {
      if (attachmentRef.current?.previewUrl) {
        URL.revokeObjectURL(attachmentRef.current.previewUrl);
      }
    },
    []
  );

  /* ───────────── Fetch history (existing endpoint, own conversation only) ───────────── */
  const loadHistory = useCallback(async () => {
    if (!userId || inFlightRef.current || !hasValidSessionToken()) return;
    inFlightRef.current = true;
    try {
      const res = await chatService.getChatHistory(userId);
      if (!res?.success || !Array.isArray(res.data)) return;
      const list = res.data;
      baselineUserRef.current = userId;
      setConversation({ userId, messages: list });
      setLoadState({ userId, loaded: true, error: false });
      if (openRef.current) {
        writeSeen(userId, latestTime(list));
        setUnreadState({ userId, count: 0 });
      } else {
        setUnreadState({ userId, count: deriveUnread(list, userId) });
      }
    } catch {
      setLoadState((prev) => ({ userId, loaded: prev.userId === userId && prev.loaded, error: true }));
    } finally {
      inFlightRef.current = false;
    }
  }, [userId]);

  /* ───────────── Polling: 5s while open, slow unread check while minimized ───────────── */
  useEffect(() => {
    if (!canChat || hidden) return undefined;

    const tick = () => {
      if (!document.hidden) loadHistory();
    };

    // Immediate load when opened; when minimized only do the one-time baseline.
    if (open || baselineUserRef.current !== userId) tick();

    const intervalId = window.setInterval(tick, open ? OPEN_POLL_MS : IDLE_POLL_MS);
    document.addEventListener("visibilitychange", tick);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [canChat, hidden, open, userId, loadHistory]);

  /* ───────────── Widget coordination: one shared active-widget state ───────────── */
  // Never leave Support expanded behind the cart drawer / cart / checkout, and
  // never reopen it automatically afterwards.
  useEffect(() => {
    if (suppressed && open) closeSupport();
  }, [suppressed, open, closeSupport]);

  const clearAttachment = useCallback(() => {
    setAttachment((prev) => {
      if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const openChat = useCallback(() => {
    openSupport();
  }, [openSupport]);

  const closeChat = useCallback(
    (discardDraft = false) => {
      setSendError("");
      if (discardDraft) {
        setDraft("");
        clearAttachment();
      }
      closeSupport();
    },
    [clearAttachment, closeSupport]
  );

  /* ───────────── UI behaviours ───────────── */
  useEffect(() => {
    if (!open) return;
    const viewport = viewportRef.current;
    if (viewport) viewport.scrollTop = viewport.scrollHeight;
  }, [open, messages.length, loaded]);

  useEffect(() => {
    if (open && canChat && window.innerWidth >= 768) inputRef.current?.focus();
  }, [open, canChat]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setSendError("Please attach a JPG, PNG or GIF image.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setSendError("Image must be 5MB or smaller.");
      e.target.value = "";
      return;
    }
    setSendError("");
    setAttachment((prev) => {
      if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      return { file, previewUrl: URL.createObjectURL(file) };
    });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if ((!text && !attachment) || sending || !userId) return;

    setSending(true);
    setSendError("");
    try {
      // Identity, sender name, isAdmin and receiverId are all derived by the
      // existing backend from the authenticated user - never sent from here.
      let payload;
      if (attachment) {
        payload = new FormData();
        if (text) payload.append("message", text);
        payload.append("image", attachment.file);
      } else {
        payload = { message: text };
      }

      const res = await chatService.sendMessage(payload);
      if (res?.success && res.data) {
        setConversation((prev) => ({
          userId,
          messages: mergeMessages(prev.userId === userId ? prev.messages : [], [res.data]),
        }));
        writeSeen(userId, toTime(res.data));
        setDraft("");
        clearAttachment();
        // One follow-up fetch picks up the existing automatic reply, if any.
        loadHistory();
      }
    } catch (err) {
      setSendError(
        err?.response?.data?.message || "Message could not be sent. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") closeChat(false);
  };

  if (hidden) return null;

  const canSubmit = (draft.trim().length > 0 || Boolean(attachment)) && !sending;

  return (
    <aside className="rich-support" aria-label="Rich Apparel Support">
      {!open ? (
        <button
          type="button"
          className="rich-support-pill"
          onClick={openChat}
          aria-label={
            unreadCount > 0
              ? `Open Customer Support, ${unreadCount} new message${unreadCount === 1 ? "" : "s"}`
              : "Open Customer Support"
          }
        >
          <MessageCircle size={13} className="rich-support-icon" aria-hidden="true" />
          <span>Support</span>
          {unreadCount > 0 && (
            <>
              <span className="rich-support-sep" aria-hidden="true">•</span>
              <span className="rich-support-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
            </>
          )}
        </button>
      ) : (
        <section
          className="rich-support-card"
          role="dialog"
          aria-label="Rich Apparel Support conversation"
          onKeyDown={handleKeyDown}
        >
          <header className="rich-support-header">
            <span className="rich-support-brand">
              <MessageCircle size={13} className="rich-support-icon" aria-hidden="true" />
              <span>Rich Apparel Support</span>
            </span>
            <div className="rich-support-controls">
              <button
                type="button"
                className="rich-support-icon-btn"
                onClick={() => closeChat(false)}
                aria-label="Minimize Customer Support"
                title="Minimize"
              >
                <Minus size={15} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="rich-support-icon-btn"
                onClick={() => closeChat(true)}
                aria-label="Close Customer Support"
                title="Close"
              >
                <X size={15} aria-hidden="true" />
              </button>
            </div>
          </header>

          {!canChat ? (
            <div className="rich-support-guest">
              <p className="rich-support-guest-title">
                Sign in to chat with our support team.
              </p>
              <p className="rich-support-guest-sub">
                Your conversation stays saved to your account.
              </p>
              <button
                type="button"
                className="rich-support-signin"
                onClick={() => {
                  closeChat(false);
                  navigate("/login");
                }}
              >
                Sign in
              </button>
            </div>
          ) : (
            <>
              <div
                ref={viewportRef}
                className="rich-support-messages"
                role="log"
                aria-live="polite"
                aria-label="Conversation with Rich Apparel Support"
              >
                {messages.length === 0 ? (
                  <div className="rich-support-empty">
                    {!loaded && !loadError ? (
                      <p className="rich-support-empty-sub">Loading conversation…</p>
                    ) : loadError && !loaded ? (
                      <p className="rich-support-empty-sub">
                        We couldn’t load your conversation. Retrying shortly…
                      </p>
                    ) : (
                      <>
                        <p className="rich-support-empty-title">
                          Need help with your order or our products?
                        </p>
                        <p className="rich-support-empty-sub">
                          Send us a message and our team will get back to you.
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const kind = getMessageKind(msg);
                    const hasText = typeof msg.message === "string" && msg.message.trim();
                    return (
                      <div
                        key={msg.id || index}
                        className={`rich-support-row rich-support-row--${kind}`}
                      >
                        <div className={`rich-support-bubble rich-support-bubble--${kind}`}>
                          {kind === "auto" && (
                            <span className="rich-support-tag">Automatic reply</span>
                          )}
                          {kind === "staff" && (
                            <span className="rich-support-tag">Rich Apparel Team</span>
                          )}
                          {msg.imageUrl && (
                            <a
                              href={msg.imageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rich-support-image-link"
                            >
                              <img
                                src={msg.imageUrl}
                                alt="Attachment"
                                className="rich-support-image"
                                loading="lazy"
                              />
                            </a>
                          )}
                          {hasText && <p className="rich-support-text">{msg.message}</p>}
                          <span className="rich-support-time">
                            {formatMessageTime(msg.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {attachment && (
                <div className="rich-support-attachment">
                  <img src={attachment.previewUrl} alt="" className="rich-support-attachment-thumb" />
                  <span className="rich-support-attachment-name">{attachment.file.name}</span>
                  <button
                    type="button"
                    className="rich-support-icon-btn rich-support-icon-btn--sm"
                    onClick={clearAttachment}
                    aria-label="Remove attachment"
                  >
                    <X size={13} aria-hidden="true" />
                  </button>
                </div>
              )}

              {sendError && (
                <p className="rich-support-error" role="alert">
                  {sendError}
                </p>
              )}

              <form className="rich-support-composer" onSubmit={handleSend}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif"
                  className="rich-support-file-input"
                  onChange={handleFileChange}
                  tabIndex={-1}
                  aria-hidden="true"
                />
                <button
                  type="button"
                  className="rich-support-icon-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sending}
                  aria-label="Attach an image"
                  title="Attach an image"
                >
                  <Paperclip size={16} aria-hidden="true" />
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  className="rich-support-input"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type your message..."
                  maxLength={MAX_MESSAGE_LENGTH}
                  disabled={sending}
                  aria-label="Type your message"
                />
                <button
                  type="submit"
                  className="rich-support-send"
                  disabled={!canSubmit}
                  aria-label="Send message"
                >
                  <Send size={15} aria-hidden="true" />
                </button>
              </form>
            </>
          )}
        </section>
      )}
    </aside>
  );
};
