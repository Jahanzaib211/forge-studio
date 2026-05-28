import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, Cpu, Zap, Server, Radio } from "lucide-react";
import { Streamdown } from "streamdown";
import { trpc } from "@/lib/trpc";

interface Backend {
  id: string;
  name: string;
  url: string;
  icon: any;
}

const BACKENDS: Backend[] = [
  { id: "litellm", name: "LiteLLM Proxy", url: "http://localhost:5050", icon: Radio },
  { id: "llamacpp", name: "llama.cpp (GPU)", url: "http://127.0.0.1:8081", icon: Cpu },
  { id: "ollama", name: "Ollama", url: "http://127.0.0.1:11434", icon: Server },
];

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  tokens?: number;
  latency?: number;
  model?: string;
}

export default function InferenceLab() {
  const [backend, setBackend] = useState("litellm");
  const [model, setModel] = useState("");
  const [customModel, setCustomModel] = useState("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [streaming, setStreaming] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const modelsQuery = trpc.models.list.useQuery();
  const currentBackend = BACKENDS.find((b) => b.id === backend)!;

  const availableModels = backend === "litellm"
    ? (modelsQuery.data || []).map((m) => m.name)
    : backend === "llamacpp"
      ? ["qwen-moe", "qwopus"]
      : ["hermes-4-14b-q4", "hf.co/KyleHessling1/Qwopus-GLM-18B-Merged-GGUF:Q4_K_M"];

  useEffect(() => {
    if (availableModels.length > 0 && !model) {
      setModel(availableModels[0]);
    }
  }, [availableModels, model]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const selectedModel = model || customModel;
    if (!selectedModel) return;

    const userMsg: ChatMessage = { role: "user", content: input, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setStreaming("");

    const allMessages = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const startTime = Date.now();
    let fullContent = "";
    let tokenCount = 0;

    try {
      const response = await fetch("/api/stream/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: allMessages,
          model: selectedModel,
          temperature,
          maxTokens,
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No reader");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || "";
              if (content) {
                fullContent += content;
                tokenCount++;
                setStreaming(fullContent);
              }
            } catch {}
          }
        }
      }

      const latency = Date.now() - startTime;
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: fullContent,
        timestamp: new Date(),
        tokens: tokenCount,
        latency,
        model: selectedModel,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error: any) {
      const errorMsg: ChatMessage = {
        role: "assistant",
        content: `Error: ${error.message}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      setStreaming("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-[1800px] mx-auto">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">Inference Lab</h1>
          <p className="text-slate-400 text-lg">Direct connection to any backend — LiteLLM, llama.cpp, Ollama</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="space-y-6">
            <Card className="bg-slate-800/30 border-slate-700/50 backdrop-blur">
              <CardHeader className="border-b border-slate-700/50">
                <CardTitle className="text-white text-lg">Backend</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {BACKENDS.map((b) => {
                  const Icon = b.icon;
                  return (
                    <button
                      key={b.id}
                      onClick={() => { setBackend(b.id); setModel(""); }}
                      className={`w-full p-3 rounded-lg text-left transition-all ${
                        backend === b.id
                          ? "bg-blue-600/20 border border-blue-600/50 text-white"
                          : "bg-slate-700/30 border border-slate-700/50 text-slate-300 hover:bg-slate-700/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{b.name}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1 font-mono">{b.url}</div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="bg-slate-800/30 border-slate-700/50 backdrop-blur">
              <CardHeader className="border-b border-slate-700/50">
                <CardTitle className="text-white text-lg">Model</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600 max-h-60">
                    {availableModels.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  placeholder="Or type custom model..."
                  className="bg-slate-700 border-slate-600 text-white text-sm"
                />
              </CardContent>
            </Card>

            <Card className="bg-slate-800/30 border-slate-700/50 backdrop-blur">
              <CardHeader className="border-b border-slate-700/50">
                <CardTitle className="text-white text-lg">Parameters</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Temperature: {temperature}</label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Max Tokens: {maxTokens}</label>
                  <input
                    type="range"
                    min="50"
                    max="4096"
                    step="50"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card className="h-full bg-slate-800/30 border-slate-700/50 backdrop-blur flex flex-col">
              <CardHeader className="border-b border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      {currentBackend.name}
                    </CardTitle>
                    <CardDescription>
                      Model: {model || customModel || "none selected"} • Streaming enabled
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-600/20 text-green-400 border-green-600/50">
                      <Radio className="w-3 h-3 mr-1" />
                      Live
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col p-6">
                <div className="flex-1 overflow-y-auto mb-6 space-y-4 pr-4 max-h-[600px]">
                  {messages.length === 0 && !streaming ? (
                    <div className="flex items-center justify-center h-full text-slate-400">
                      <p>Send a message to start. Tokens stream in real-time.</p>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-xs lg:max-w-lg px-4 py-3 rounded-lg ${
                              msg.role === "user"
                                ? "bg-blue-600 text-white rounded-br-none"
                                : "bg-slate-700 text-slate-100 rounded-bl-none"
                            }`}
                          >
                            {msg.role === "assistant" && msg.model && (
                              <div className="text-xs text-slate-400 mb-1">{msg.model}</div>
                            )}
                            <Streamdown>{msg.content}</Streamdown>
                            <div className="text-xs opacity-70 mt-2 flex items-center gap-3">
                              <span>{msg.timestamp.toLocaleTimeString()}</span>
                              {msg.tokens && <span>🔤 {msg.tokens}</span>}
                              {msg.latency && <span>⚡ {msg.latency}ms</span>}
                              {msg.tokens && msg.latency && (
                                <span>🚀 {((msg.tokens / (msg.latency / 1000))).toFixed(1)} tok/s</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {streaming && (
                        <div className="flex justify-start">
                          <div className="max-w-xs lg:max-w-lg px-4 py-3 rounded-lg bg-slate-700 text-slate-100 rounded-bl-none">
                            <Streamdown>{streaming + "▌"}</Streamdown>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="flex gap-2">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message... (Ctrl+Enter to send)"
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 resize-none"
                    rows={3}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.ctrlKey) sendMessage();
                    }}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white h-auto"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
