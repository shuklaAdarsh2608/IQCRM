"use client";

import { useCallback, useEffect, useState } from "react";
import api from "../../../services/api";
import { Select } from "../../../components/ui/Select";

export default function TeamChatPage() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversationDetail, setConversationDetail] = useState(null);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [teammates, setTeammates] = useState([]);
  const [teammatesLoading, setTeammatesLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [newChatSubmitting, setNewChatSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [pendingOtherUser, setPendingOtherUser] = useState(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("iqlead_user");
      if (raw) setCurrentUser(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  const loadConversations = useCallback(() => {
    setLoading(true);
    api
      .get("/chats/conversations")
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setConversations(res.data.data);
          if (activeId && !res.data.data.some((c) => c.id === activeId)) {
            setActiveId(null);
            setMessages([]);
            setConversationDetail(null);
          }
        } else {
          setConversations([]);
        }
      })
      .catch(() => setConversations([]))
      .finally(() => setLoading(false));
  }, [activeId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const loadMessages = useCallback((id) => {
    if (!id) return;
    setMessagesLoading(true);
    api
      .get(`/chats/conversations/${id}/messages`)
      .then((res) => {
        if (res.data?.success && res.data.data) {
          const conv = res.data.data.conversation;
          const list = res.data.data.messages || [];
          setMessages(list);
          setConversationDetail((prev) => {
            if (!conv) return null;
            if (conv.otherUser) {
              setPendingOtherUser(null);
              return conv;
            }
            if (prev?.id === conv.id && prev?.otherUser) return { ...conv, otherUser: prev.otherUser };
            return conv;
          });
        } else {
          setMessages([]);
          setConversationDetail(null);
        }
      })
      .catch(() => {
        setMessages([]);
        setConversationDetail(null);
      })
      .finally(() => setMessagesLoading(false));
  }, []);

  useEffect(() => {
    if (activeId) {
      loadMessages(activeId);
    } else {
      setMessages([]);
      setConversationDetail(null);
    }
  }, [activeId, loadMessages]);

  useEffect(() => {
    if (!activeId) return;
    const t = setInterval(() => loadMessages(activeId), 15000);
    return () => clearInterval(t);
  }, [activeId, loadMessages]);

  const handleSend = (e) => {
    e.preventDefault();
    const text = messageText.trim();
    if (!text || !activeId || sending) return;
    setSending(true);
    api
      .post(`/chats/conversations/${activeId}/messages`, { body: text })
      .then((res) => {
        if (res.data?.success && res.data.data) {
          setMessages((prev) => [...prev, res.data.data]);
          setMessageText("");
          loadConversations();
        }
      })
      .finally(() => setSending(false));
  };

  const openNewChatModal = () => {
    setNewChatOpen(true);
    setSelectedUserId("");
    setTeammatesLoading(true);
    api
      .get("/users/options")
      .then((res) => {
        const list = res.data?.success && Array.isArray(res.data.data) ? res.data.data : [];
        const filtered = list.filter((u) => String(u.id) !== String(currentUser?.id));
        const seen = new Set();
        setTeammates(filtered.filter((u) => {
          if (seen.has(u.id)) return false;
          seen.add(u.id);
          return true;
        }));
      })
      .catch(() => setTeammates([]))
      .finally(() => setTeammatesLoading(false));
  };

  const handleStartConversation = (e) => {
    e.preventDefault();
    if (!selectedUserId || newChatSubmitting) return;
    setNewChatSubmitting(true);
    const selectedTeammate = teammates.find((u) => String(u.id) === String(selectedUserId));
    api
      .post("/chats/conversations", { otherUserId: Number(selectedUserId) })
      .then((res) => {
        if (res.data?.success && res.data.data) {
          const data = res.data.data;
          setNewChatOpen(false);
          setSelectedUserId("");
          loadConversations();
          const otherUser = data.otherUser || (selectedTeammate && {
            id: selectedTeammate.id,
            name: selectedTeammate.name,
            email: selectedTeammate.email,
            role: selectedTeammate.role
          });
          setActiveId(data.id);
          setConversationDetail({ id: data.id, otherUser });
          setPendingOtherUser(otherUser);
        }
      })
      .catch(() => {})
      .finally(() => setNewChatSubmitting(false));
  };

  const displayName = (c) =>
    c?.otherUser?.name || c?.otherUser?.email || "Unknown";

  return (
    <div className="min-w-0 space-y-4 text-slate-900 dark:text-slate-100">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Team chat</h1>
        <p className="text-sm text-slate-500 dark:text-slate-300">
          Internal team communication. Message your colleagues.
        </p>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-3 sm:gap-4 md:grid-cols-[1.2fr,2fr]">
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
              Conversations
            </p>
            <button
              type="button"
              onClick={openNewChatModal}
              className="rounded-lg bg-orange-500 px-3 py-2 text-xs font-medium text-white hover:bg-orange-600"
            >
              New chat
            </button>
          </div>
          {loading ? (
            <p className="py-4 text-xs text-slate-500 dark:text-slate-300">Loading...</p>
          ) : conversations.length === 0 ? (
            <p className="py-4 text-xs text-slate-500 dark:text-slate-300">
              No conversations yet. Click &quot;New chat&quot; to message a teammate.
            </p>
          ) : (
            <div className="space-y-1">
              {conversations.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setPendingOtherUser(null);
                    setActiveId(c.id);
                  }}
                  className={`flex w-full items-start gap-2 rounded-xl px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800 ${
                    activeId === c.id ? "bg-orange-50 dark:bg-orange-500/15" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                      {displayName(c)}
                    </p>
                    {c.lastMessagePreview?.body && (
                      <p className="truncate text-xs text-slate-500 dark:text-slate-300">
                        {c.lastMessagePreview.senderName
                          ? `${c.lastMessagePreview.senderName}: `
                          : ""}
                        {c.lastMessagePreview.body}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex min-h-[320px] flex-col rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
          {!activeId ? (
            <div className="flex flex-1 items-center justify-center text-sm text-slate-500 dark:text-slate-300">
              Select a conversation or start a new chat with a teammate.
            </div>
          ) : (
            <>
              <div className="mb-3 border-b border-slate-200 pb-2 dark:border-slate-800">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {(conversationDetail?.otherUser || pendingOtherUser)
                    ? (conversationDetail?.otherUser?.name || pendingOtherUser?.name || conversationDetail?.otherUser?.email || pendingOtherUser?.email || "Unknown")
                    : conversations.find((c) => c.id === activeId)
                      ? displayName(conversations.find((c) => c.id === activeId))
                      : "—"}
                </p>
                {(conversationDetail?.otherUser?.email || pendingOtherUser?.email) && (
                  <p className="text-xs text-slate-500 dark:text-slate-300">
                    {conversationDetail?.otherUser?.email || pendingOtherUser?.email}
                  </p>
                )}
              </div>

              <div className="mb-3 min-h-[200px] flex-1 space-y-2 overflow-y-auto">
                {messagesLoading ? (
                  <p className="py-4 text-xs text-slate-500 dark:text-slate-300">Loading messages...</p>
                ) : messages.length === 0 ? (
                  <p className="py-4 text-xs text-slate-500 dark:text-slate-300">
                    No messages yet. Send a message below to start.
                  </p>
                ) : (
                  messages.map((m) => {
                    const isMe = currentUser && m.senderId === currentUser.id;
                    return (
                      <div
                        key={m.id}
                        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                            isMe
                              ? "rounded-br-sm bg-orange-500 text-white"
                              : "rounded-bl-sm bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                          }`}
                        >
                          {!isMe && m.sender?.name && (
                            <p className="mb-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                              {m.sender.name}
                            </p>
                          )}
                          {m.body}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form
                onSubmit={handleSend}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 dark:border-slate-800 dark:bg-slate-900"
              >
                <input
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  disabled={sending || !messageText.trim()}
                  className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  {sending ? "Sending..." : "Send"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {newChatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">
              New chat
            </h3>
            <p className="mb-3 text-xs text-slate-500">
              Choose a teammate to start an internal conversation.
            </p>
            <form onSubmit={handleStartConversation} className="space-y-4">
              <div>
                <Select
                  label="Teammate"
                  placeholder="Select someone..."
                  value={selectedUserId}
                  onChange={(v) => setSelectedUserId(String(v))}
                  options={teammates.map((u) => ({
                    value: u.id,
                    label: u.role ? `${u.name} (${u.role})` : u.name
                  }))}
                  disabled={teammatesLoading}
                  className="w-full"
                />
                {teammatesLoading && (
                  <p className="mt-1.5 text-xs text-slate-500">Loading teammates...</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setNewChatOpen(false);
                    setSelectedUserId("");
                  }}
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={newChatSubmitting || !selectedUserId}
                  className="flex-1 rounded-lg bg-orange-500 px-3 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  {newChatSubmitting ? "Starting..." : "Start chat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
