import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, RefreshCw } from "lucide-react";
import { sendChat, sendLLMChat, resetLLMChat } from "../services/api";


interface Message {
  id: number;
  role: "user" | "bot";
  text: string;
  time: string;
}

// ── Offline rule-based fallback ────────────────────────────────────────────
function offlineBot(q: string): string {
  const lq = q.toLowerCase();
  if (lq.includes("hello") || lq.includes("hi")) return "👋 Hello! I'm AgriBot. The backend is offline, but I can still answer basic questions about the agricultural dataset!";
  if (lq.includes("temperature")) return "🌡️ Average temperature in the dataset is ~36.5°C, ranging from 18°C to 55°C. Higher temperatures correlate with lower soil moisture.";
  if (lq.includes("moisture")) return "💧 Average soil moisture is ~0.55. Peaty soils retain the most moisture; sandy soils retain the least.";
  if (lq.includes("ph")) return "🧪 Average pH is ~6.83. The dataset includes acidic soils (pH<5.5) to strongly alkaline (pH>8.5). Optimal crop pH is 6.0–7.5.";
  if (lq.includes("nitrogen")) return "🌿 Average nitrogen level is ~65 kg/ha. Rice and maize tend to require higher nitrogen than soybean (which fixes its own N).";
  if (lq.includes("soil")) return "🏔️ Five soil types are present: Loamy, Peaty, Acidic, Sandy, and Clay. Loamy soil is the most balanced for agriculture.";
  if (lq.includes("crop")) return "🌾 Five crops: rice, wheat, maize, soybean, cotton. Each has different nutrient, moisture, and temperature requirements.";
  if (lq.includes("fertilizer")) return "🧴 Nine fertilizers tracked: Compost, Balanced NPK, DAP, Urea, Lime, Gypsum, Organic Fe, Water Retention, Muriate of Potash.";
  if (lq.includes("rainfall")) return "🌧️ Average rainfall is ~250 mm. Crops like rice benefit from higher rainfall; cotton is more drought-tolerant.";
  if (lq.includes("carbon")) return "♻️ Organic carbon ranges from negative to ~2.8. Higher carbon improves soil structure and water retention.";
  if (lq.includes("help")) return "I can discuss: temperature, moisture, rainfall, pH, nitrogen, phosphorus, potassium, carbon, soil types, crops, and fertilizers!";
  return "🤔 I'm running in offline mode. Try asking about temperature, moisture, pH, nitrogen, soil types, crops, or fertilizers!";
}

function formatText(text: string): React.ReactNode {
  const lines = text.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        // Bold markdown **text**
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} className={line.startsWith("•") || line.startsWith("-") ? "ml-2" : ""}>
            {parts.map((part, j) =>
              part.startsWith("**") && part.endsWith("**")
                ? <strong key={j} className="font-bold">{part.slice(2, -2)}</strong>
                : part
            )}
          </p>
        );
      })}
    </div>
  );
}
const QUICK_PROMPTS_CLASSIC = [
  "What is the average pH?",
  "Which crop needs the most nitrogen?",
  "Compare soil types",
  "Recommend fertilizer for rice",
  "Show me key statistics",
  "What affects soil moisture?",
  "How to improve soil carbon?",
  "Best crop for loamy soil",
];

const QUICK_PROMPTS_AI = [
  "Show me Rice data",
  "Which crop needs the most nitrogen?",
  "Compare soil types",
  "Show me Cotton in Acidic Soil",
  "What factors influence moisture?",
  "Recommend fertilizer for low pH",
  "Explain temperature vs moisture trend",
  "What is the average pH?",
];

const ChatBot: React.FC<{
  backendOnline: boolean;
  onFilterChange?: (filters: any) => void;
}> = ({ backendOnline, onFilterChange }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "bot",
      text: "Hello! I'm **PolyBot**, your intelligent agricultural analytics assistant.\n\nI can help you explore the dataset, understand soil health, crop requirements, fertilizer recommendations, and more.\n\nTry one of the quick prompts below, or ask me anything about the data!",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
  ]);
  const [mode, setMode] = useState<"classic" | "ai">("classic");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = {
      id: Date.now(), role: "user", text,
      time: new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      let botText: string;

      if (backendOnline) {
        if (mode === "ai") {
          // ── Call LLM bot ──────────────────────
          const res = await sendLLMChat(text);
          botText = res.response;

          // ── Apply dashboard filters if detected ──
          if (res.has_filter && res.filters && onFilterChange) {
            onFilterChange(res.filters);

            // Build a readable filter summary
            const filterSummary = Object.entries(res.filters)
              .map(([k, v]) => `**${k}:** ${v}`)
              .join(", ");

            // Add notification message to chat
            setMessages(prev => [...prev,
              {
                id: Date.now()+1, role:"bot", text: botText,
                time: new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }),
              },
              {
                id: Date.now()+2, role:"bot",
                text: `🔄 **Dashboard updated** → ${filterSummary}`,
                time: new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }),
              }
            ]);
            setLoading(false);
            return; // Exit early since we already set messages
          }

        } else {
          // ── Call rule-based bot ───────────────
          const res = await sendChat(text);
          botText = res.response;
        }
      } else {
        await new Promise(r => setTimeout(r, 600));
        botText = offlineBot(text);
      }

      setMessages(prev => [...prev, {
        id: Date.now()+1, role:"bot", text: botText,
        time: new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }),
      }]);

    } catch {
      setMessages(prev => [...prev, {
        id: Date.now()+1, role:"bot",
        text: "⚠️ Sorry, I couldn't connect to the AI backend. Please try again.",
        time: new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }),
      }]);
    } finally {
      setLoading(false);
    }
  };
  
  const getGreeting = (currentMode: "classic" | "ai"): Message => ({
    id: Date.now(),
    role: "bot",
    text: currentMode === "ai"
      ? "Hello! I'm **AgriBot AI**, your advanced agricultural intelligence assistant powered by LLaMA 3.3.\n\nI can answer complex questions, explain trends, compare crops and soils, and even **filter the dashboard** for you automatically.\n\nTry asking: *'Which crop needs the most nitrogen?'* or *'Show me data for Rice in Loamy Soil'*"
      : "Hello! I'm **PolyBot**, your intelligent agricultural analytics assistant.\n\nI can help you explore the dataset, understand soil health, crop requirements, fertilizer recommendations, and more.\n\nTry one of the quick prompts below, or ask me anything about the data!",
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  });

  const clearChat = () => setMessages([getGreeting(mode)]);

  return (
    <div className="flex flex-col h-full bg-white/80 backdrop-blur-md rounded-2xl shadow-md border border-gray-200/50">
      {/* Header */}
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100/50">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow transition-colors ${mode === 'ai' ? 'bg-purple-600' : 'bg-green-600'}`}>
              {mode === 'ai' ? <Sparkles className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-sm">
                {mode === 'ai' ? "Advanced AI Assistant" : "Classic AgriBot"}
              </h3>
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode("classic");
                    setMessages([getGreeting("classic")]);
                  }}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${mode === 'classic' ? 'bg-green-100 border-green-300 text-green-700 font-bold' : 'text-gray-400 border-gray-200'}`}
                >
                  Classic
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("ai");
                    setMessages([getGreeting("ai")]);
                  }}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${mode === 'ai' ? 'bg-purple-100 border-purple-300 text-purple-700 font-bold' : 'text-gray-400 border-gray-200'}`}
                >
                  AI Mode
                </button>
              </div>
            </div>
          </div>
          <button onClick={clearChat} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            <RefreshCw className="w-3.5 h-3.5" /> Clear
          </button>
        </div>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" style={{ maxHeight: 'calc(100vh - 300px)' }}>
          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white transition-colors ${msg.role === "bot"
                ? mode === "ai"
                  ? "bg-linear-to-br from-purple-500 to-violet-600"
                  : "bg-linear-to-br from-green-500 to-emerald-600"
                : "bg-linear-to-br from-blue-500 to-indigo-600"
                }`}>
                {msg.role === "bot" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div className={`max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === "bot"
                  ? "bg-gray-50/80 border border-gray-100/50 text-gray-800 rounded-tl-sm"
                  : "bg-linear-to-br from-green-600 to-emerald-600 text-white rounded-tr-sm"
                  }`}>
                  {formatText(msg.text)}
                </div>
                <span className="text-xs text-gray-400 px-1">{msg.time}</span>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${mode === 'ai' ? 'bg-linear-to-br from-purple-500 to-violet-600' : 'bg-linear-to-br from-green-500 to-emerald-600'}`}>
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gray-50/80 border border-gray-100/50 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1.5 items-center h-4">
                  <div className={`w-2 h-2 rounded-full animate-bounce ${mode === 'ai' ? 'bg-purple-400' : 'bg-green-400'}`} style={{ animationDelay: "0ms" }} />
                  <div className={`w-2 h-2 rounded-full animate-bounce ${mode === 'ai' ? 'bg-purple-400' : 'bg-green-400'}`} style={{ animationDelay: "150ms" }} />
                  <div className={`w-2 h-2 rounded-full animate-bounce ${mode === 'ai' ? 'bg-purple-400' : 'bg-green-400'}`} style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="px-5 py-4 border-t border-gray-100/50">
          <form onSubmit={e => { e.preventDefault(); send(input); }} className="flex gap-3">
            <input
              className="flex-1 border border-gray-200/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-transparent placeholder:text-gray-400 bg-white/50"
              placeholder="Ask about soil, crops, nutrients, fertilizers…"
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()}
              className="bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl transition-all shadow">
              <Send className="w-4 h-4" />
            </button>
          </form>
          {/* Quick Prompts */}
          <div className="mt-3 flex flex-wrap gap-2">
            {(mode === "ai" ? QUICK_PROMPTS_AI : QUICK_PROMPTS_CLASSIC).map(p => (
              <button key={p} onClick={() => send(p)}
                className={`text-left text-xs px-3 py-2 rounded-lg border transition-all font-medium ${
                  mode === "ai"
                    ? "bg-purple-50/80 text-purple-700 border-purple-200/50 hover:bg-purple-100"
                    : "bg-gray-100/50 text-gray-700 border-gray-200/50 hover:bg-gray-100"
                }`}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
