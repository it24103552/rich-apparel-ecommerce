import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, User, Search } from "lucide-react";
import { chatService } from "../../../services";
import { useAuth } from "../../../hooks/useAuth";
import "./SupportChatPage.css";

const SupportChatPage = () => {
  const [groups, setGroups] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchGroups();
    const interval = setInterval(fetchGroups, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      fetchMessages(selectedCustomer.customerId);
      const interval = setInterval(() => fetchMessages(selectedCustomer.customerId), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedCustomer]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchGroups = async () => {
    try {
      const res = await chatService.getAdminGroups();
      if (res.success) {
        setGroups(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch chat groups:", error);
    }
  };

  const fetchMessages = async (customerId) => {
    try {
      const res = await chatService.getChatHistory(customerId);
      if (res.success) {
        setMessages(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  const handleSelectCustomer = (group) => {
    setSelectedCustomer(group);
    chatService.markAsRead(group.customerId);
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedCustomer) return;

    setLoading(true);
    try {
      const res = await chatService.sendMessage({
        message: newMessage,
        receiverId: selectedCustomer.customerId,
        isAdmin: true,
        senderName: user.name,
      });
      if (res.success) {
        setMessages([...messages, res.data]);
        setNewMessage("");
        fetchGroups();
      }
    } catch (error) {
      console.error("Failed to send reply:", error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const filteredGroups = groups.filter(g =>
    g.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.customerId.includes(searchTerm)
  );

  return (
    <div className="support-chat-page">
      <div className="chat-container-main">
        {/* ═══ SIDEBAR ═══ */}
        <div className="customers-sidebar">
          <div className="sidebar-header">
            <div className="sidebar-title">
              <div className="title-icon">
                <MessageCircle size={16} />
              </div>
              Customer Chats
            </div>
            <div className="search-bar">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="customer-list">
            {filteredGroups.length === 0 ? (
              <div className="customer-list-empty">No conversations yet.</div>
            ) : (
              filteredGroups.map((group) => (
                <div
                  key={group.customerId}
                  className={`customer-item ${selectedCustomer?.customerId === group.customerId ? "active" : ""}`}
                  onClick={() => handleSelectCustomer(group)}
                >
                  <div className="avatar-placeholder">
                    {getInitials(group.customerName)}
                  </div>
                  <div className="customer-info">
                    <div className="customer-meta">
                      <span className="customer-name">{group.customerName || "Customer"}</span>
                      {group.unreadCount > 0 && (
                        <span className="unread-badge">{group.unreadCount}</span>
                      )}
                    </div>
                    <p className="last-message">{group.lastMessage}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ═══ MAIN CHAT AREA ═══ */}
        <div className="chat-content">
          {selectedCustomer ? (
            (() => {
              const activeGroup = groups.find(g => g.customerId === selectedCustomer.customerId) || selectedCustomer;
              return (
                <>
                  {/* Header */}
                  <div className="chat-header-main">
                    <div className="header-user-info">
                      <div className="avatar-placeholder-sm">
                        {getInitials(activeGroup.customerName)}
                      </div>
                      <div className="header-user-details">
                        <h3>{activeGroup.customerName}</h3>
                        <div className="status-indicator">
                          {activeGroup.isOnline ? (
                            <>
                              <span className="status-dot"></span>
                              <span className="status-text">Online</span>
                            </>
                          ) : (
                            <>
                              <span className="status-dot offline"></span>
                              <span className="status-text offline-text">Offline</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

              {/* Messages */}
              <div className="messages-viewport">
                {messages.map((msg, index) => (
                  <div
                    key={msg.id || index}
                    className={`message-row ${msg.isAdmin ? "outgoing" : "incoming"}`}
                  >
                    <div className="message-bubble-main">
                      {msg.senderName === "System" && (
                        <span className="auto-reply-tag">Auto Reply</span>
                      )}
                      {msg.imageUrl && (
                        <img
                          src={msg.imageUrl}
                          alt="chat attachment"
                          className="msg-image"
                          onClick={() => window.open(msg.imageUrl, '_blank')}
                        />
                      )}
                      {msg.message && <p>{msg.message}</p>}
                      <span className="message-time">
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Input */}
              <form onSubmit={handleReply} className="admin-reply-area">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a reply..."
                  disabled={loading}
                />
                <button
                  type="submit"
                  className="reply-send-btn"
                  disabled={loading || !newMessage.trim()}
                >
                  <Send size={17} />
                </button>
              </form>
            </>
            );
            })()
          ) : (
            <div className="empty-state">
              <div className="empty-icon-wrapper">
                <MessageCircle size={32} />
              </div>
              <h3>Select a conversation</h3>
              <p>Choose a customer from the sidebar to start chatting.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportChatPage;
