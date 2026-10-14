import { useEffect, useState } from "react";
import apiClient from "../api/client";
import { useAuth } from "../context/AuthContext";
import { auth } from "../firebase/firebase";

export default function ChatBox() {
  const { user } = useAuth();

  const [conversationId, setConversationId] = useState(
    localStorage.getItem("marketing_ai_conversation_id") || null
  );

  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Hello! Tell me about your business, services, target audience, and location. I will create a marketing plan and social media post ideas for you.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const getFirebaseToken = async () => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error("Firebase user not found. Please login again.");
    }

    return await currentUser.getIdToken();
  };

  const loadHistory = async () => {
    if (!conversationId) return;

    try {
      const token = await getFirebaseToken();

      const response = await apiClient.get(`/chat/history/${conversationId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const loadedMessages = response.data.messages.map((msg) => ({
        role: msg.role,
        text: msg.content,
      }));

      setMessages(loadedMessages);
    } catch (error) {
      console.error("Load history error:", error);
      localStorage.removeItem("marketing_ai_conversation_id");
      setConversationId(null);
    }
  };

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input;

    const userMessage = {
      role: "user",
      text: userText,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const token = await getFirebaseToken();

      const response = await apiClient.post(
        "/chat/plan",
        {
          message: userText,
          business_name: user?.businessName || user?.name || "My Business",
          industry: "",
          conversation_id: conversationId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.conversation_id) {
        setConversationId(response.data.conversation_id);
        localStorage.setItem(
          "marketing_ai_conversation_id",
          response.data.conversation_id
        );
      }

      const aiMessage = {
        role: "ai",
        text: response.data.reply,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat API Error:", error);

      const detail = error.response?.data?.detail;

      let errorText = "Sorry, something went wrong.";

      if (typeof detail === "string") {
        errorText = detail;
      } else if (detail?.error) {
        errorText = detail.error;
      } else if (detail?.message) {
        errorText = detail.message;
      } else if (error.message) {
        errorText = error.message;
      }

      const errorMessage = {
        role: "ai",
        text: `Backend Error:\n${errorText}`,
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    localStorage.removeItem("marketing_ai_conversation_id");
    setConversationId(null);

    setMessages([
      {
        role: "ai",
        text: "New chat started. Tell me about your business and I will create a fresh marketing plan.",
      },
    ]);
  };

  return (
    <div className="classic-card rounded-3xl p-5 h-full flex flex-col">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-classic text-2xl font-bold text-mehroonDark">
            AI Marketing Assistant
          </h3>

          <p className="text-sm text-mehroonDark/60">
            Chat with AI to generate your business plan, captions, post ideas
            and campaign strategy.
          </p>
        </div>

        <button
          onClick={startNewChat}
          className="rounded-full border border-mehroon/30 px-4 py-2 text-xs font-semibold text-mehroon hover:bg-mehroon hover:text-beige transition"
        >
          New Chat
        </button>
      </div>

      <div className="flex-1 min-h-[420px] max-h-[520px] overflow-y-auto space-y-4 pr-2">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                msg.role === "user"
                  ? "bg-mehroon text-beige"
                  : "bg-white/80 text-mehroonDark border border-mehroon/10"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm bg-white/80 text-mehroonDark border border-mehroon/10">
              Creating your marketing plan...
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 flex gap-3">
        <input
          placeholder="Example: I run a bakery in Lahore and want more customers..."
          className="flex-1 rounded-xl border border-mehroon/20 bg-white/80 px-4 py-3 outline-none focus:border-mehroon"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
        />

        <button
          onClick={handleSend}
          disabled={loading}
          className="rounded-xl bg-mehroon px-6 py-3 font-semibold text-beige hover:bg-mehroonDark transition disabled:opacity-60"
        >
          {loading ? "Wait..." : "Send"}
        </button>
      </div>
    </div>
  );
}