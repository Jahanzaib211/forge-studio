import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  BarChart3,
  BookOpen,
  Brain,
  Building2,
  Cpu,
  Database,
  DollarSign,
  FileText,
  Globe,
  Key,
  Layers,
  Lock,
  MessageSquare,
  Moon,
  Plug,
  Search,
  ScrollText,
  Settings,
  Shield,
  ShieldAlert,
  Sun,
  User,
  Users,
  Wrench,
  Zap,
} from "lucide-react";

export default function Home() {
  const healthQuery = trpc.health.detailed.useQuery(undefined, { refetchInterval: 5000 });
  const providersQuery = trpc.providers.status.useQuery(undefined, { refetchInterval: 5000 });
  const liveStatsQuery = trpc.analytics.liveStats.useQuery(undefined, { refetchInterval: 5000 });
  const statsQuery = trpc.systemMonitor.stats.useQuery(undefined, { refetchInterval: 5000 });

  const health = healthQuery.data;
  const providers = providersQuery.data || [];
  const healthyProviders = providers.filter(p => p.enabled && p.circuitState === "closed").length;
  const stats = liveStatsQuery.data;
  const systemStats = statsQuery.data;

  const cpuPercent = systemStats ? Math.round(systemStats.cpu.totalUsage) : null;
  const ramPercent = systemStats ? Math.round(systemStats.memory.usedPercent) : null;
  const gpuPercent = systemStats && systemStats.gpu.length > 0
    ? Math.round(systemStats.gpu.reduce((sum, g) => sum + g.utilizationGpu, 0) / systemStats.gpu.length)
    : null;

  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-[1800px] mx-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <div />
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800/50"
            >
              Dashboard →
            </Link>
            {toggleTheme && (
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-slate-800/50 transition-colors text-slate-400 hover:text-white"
                title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            )}
          </div>
        </div>
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <img
              src="https://avatars.githubusercontent.com/u/695416?v=4"
              alt="Jahanzaib Ali"
              className="h-20 w-20 rounded-full border-2 border-slate-700 shadow-lg"
            />
          </div>
          <h1 className="text-6xl font-bold mb-4 tracking-tight">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Forge Studio
            </span>
          </h1>
          <p className="text-xl text-slate-400 mb-2">
            AI Lab Control Center · Made by Jahanzaib Ali
          </p>
          <a
            href="https://github.com/Jahanzaib211"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-slate-500 hover:text-blue-400 transition-colors"
          >
            github.com/Jahanzaib211
          </a>

          <div className="flex items-center justify-center gap-3 mt-6 mb-4 flex-wrap">
            <Badge className={`px-4 py-2 text-sm ${
              health?.status === "healthy"
                ? "bg-green-600/20 text-green-400 border-green-600/50"
                : health?.status === "degraded"
                  ? "bg-yellow-600/20 text-yellow-400 border-yellow-600/50"
                  : "bg-slate-600/20 text-slate-400 border-slate-600/50"
            }`}>
              <Activity className="w-4 h-4 mr-2" />
              {health?.status === "healthy" ? "System Healthy" : health?.status === "degraded" ? "Degraded" : "Checking..."}
            </Badge>
            <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/50 px-4 py-2 text-sm">
              <Cpu className="w-4 h-4 mr-2" />
              {healthyProviders}/{providers.filter(p => p.enabled).length} Providers Active
            </Badge>
            <Badge className="bg-purple-600/20 text-purple-400 border-purple-600/50 px-4 py-2 text-sm">
              <Database className="w-4 h-4 mr-2" />
              {health?.database === "connected" ? "PostgreSQL" : "DB Offline"}
            </Badge>
            <Badge className="bg-red-600/20 text-red-400 border-red-600/50 px-4 py-2 text-sm">
              <Zap className="w-4 h-4 mr-2" />
              {stats?.totalRequests || 0} Total Requests
            </Badge>
          </div>

          {systemStats && (
            <div className="flex items-center justify-center gap-4 mt-3 flex-wrap">
              <Badge className="bg-slate-700/50 text-slate-300 border-slate-600/50 px-3 py-1.5 text-xs font-mono">
                <Cpu className="w-3 h-3 mr-1.5" />
                CPU {cpuPercent}%
              </Badge>
              {gpuPercent !== null && (
                <Badge className="bg-slate-700/50 text-slate-300 border-slate-600/50 px-3 py-1.5 text-xs font-mono">
                  <Activity className="w-3 h-3 mr-1.5" />
                  GPU {gpuPercent}%
                </Badge>
              )}
              <Badge className="bg-slate-700/50 text-slate-300 border-slate-600/50 px-3 py-1.5 text-xs font-mono">
                <Activity className="w-3 h-3 mr-1.5" />
                RAM {ramPercent}%
              </Badge>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          <Link href="/dashboard">
            <Card className="bg-gradient-to-br from-blue-900/20 to-blue-950/20 border-blue-700/50 backdrop-blur hover:border-blue-600/50 transition-all cursor-pointer group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-xl">Playground</CardTitle>
                  <MessageSquare className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" />
                </div>
                <CardDescription className="text-slate-400">
                  Streaming chat with live analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-300">
                  Real-time stats, charts, and streaming chat with token-by-token rendering.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/inference">
            <Card className="bg-gradient-to-br from-green-900/20 to-green-950/20 border-green-700/50 backdrop-blur hover:border-green-600/50 transition-all cursor-pointer group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-xl">Inference Lab</CardTitle>
                  <Globe className="w-6 h-6 text-green-400 group-hover:scale-110 transition-transform" />
                </div>
                <CardDescription className="text-slate-400">
                  OpenAI-compatible API endpoint
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-300">
                  Connect directly to LiteLLM, llama.cpp, or Ollama with streaming.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/explorer">
            <Card className="bg-gradient-to-br from-purple-900/20 to-purple-950/20 border-purple-700/50 backdrop-blur hover:border-purple-600/50 transition-all cursor-pointer group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-xl">Model Explorer</CardTitle>
                  <Layers className="w-6 h-6 text-purple-400 group-hover:scale-110 transition-transform" />
                </div>
                <CardDescription className="text-slate-400">
                  Browse all models with live stats
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-300">
                  Health status, usage stats, and one-click testing for every model.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/models">
            <Card className="bg-gradient-to-br from-yellow-900/20 to-yellow-950/20 border-yellow-700/50 backdrop-blur hover:border-yellow-600/50 transition-all cursor-pointer group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-xl">Model Manager</CardTitle>
                  <Settings className="w-6 h-6 text-yellow-400 group-hover:scale-110 transition-transform" />
                </div>
                <CardDescription className="text-slate-400">
                  Add/remove models — no code
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-300">
                  Connect any LLM provider directly to LiteLLM with auto-restart and testing.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/virtual-keys">
            <Card className="bg-gradient-to-br from-emerald-900/20 to-emerald-950/20 border-emerald-700/50 backdrop-blur hover:border-emerald-600/50 transition-all cursor-pointer group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-xl">Virtual Keys</CardTitle>
                  <Key className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
                </div>
                <CardDescription className="text-slate-400">
                  API key management & budget controls
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-300">
                  Create, rotate, and manage virtual API keys with spending limits.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/mcp-servers">
            <Card className="bg-gradient-to-br from-pink-900/20 to-pink-950/20 border-pink-700/50 backdrop-blur hover:border-pink-600/50 transition-all cursor-pointer group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-xl">MCP Servers</CardTitle>
                  <Plug className="w-6 h-6 text-pink-400 group-hover:scale-110 transition-transform" />
                </div>
                <CardDescription className="text-slate-400">
                  Model Context Protocol servers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-300">
                  Connect and manage MCP-compatible tool servers.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/skills">
            <Card className="bg-gradient-to-br from-amber-900/20 to-amber-950/20 border-amber-700/50 backdrop-blur hover:border-amber-600/50 transition-all cursor-pointer group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-xl">Skills Hub</CardTitle>
                  <Zap className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />
                </div>
                <CardDescription className="text-slate-400">
                  Agent skills & plugins
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-300">
                  Install and configure skills for agentic workflows.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/guardrails">
            <Card className="bg-gradient-to-br from-red-900/20 to-red-950/20 border-red-700/50 backdrop-blur hover:border-red-600/50 transition-all cursor-pointer group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-xl">Guardrails</CardTitle>
                  <Shield className="w-6 h-6 text-red-400 group-hover:scale-110 transition-transform" />
                </div>
                <CardDescription className="text-slate-400">
                  Content safety & filtering
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-300">
                  Input/output guardrails for content moderation and safety.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/agentic">
            <Card className="bg-gradient-to-br from-indigo-900/20 to-indigo-950/20 border-indigo-700/50 backdrop-blur hover:border-indigo-600/50 transition-all cursor-pointer group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-xl">Agentic</CardTitle>
                  <Brain className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
                </div>
                <CardDescription className="text-slate-400">
                  Autonomous agent orchestration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-300">
                  Configure and run multi-step autonomous agents.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/providers">
            <Card className="bg-gradient-to-br from-cyan-900/20 to-cyan-950/20 border-cyan-700/50 backdrop-blur hover:border-cyan-600/50 transition-all cursor-pointer group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-xl">Provider Monitor</CardTitle>
                  <Shield className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform" />
                </div>
                <CardDescription className="text-slate-400">
                  Circuit breaker & health metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-300">
                  Real-time circuit breaker state, quality scores, and admin controls.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/teams">
            <Card className="bg-gradient-to-br from-teal-900/20 to-teal-950/20 border-teal-700/50 backdrop-blur hover:border-teal-600/50 transition-all cursor-pointer group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-xl">Teams</CardTitle>
                  <Users className="w-6 h-6 text-teal-400 group-hover:scale-110 transition-transform" />
                </div>
                <CardDescription className="text-slate-400">
                  Team management & access
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-300">
                  Manage teams, roles, and collaborative access controls.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/usage">
            <Card className="bg-gradient-to-br from-violet-900/20 to-violet-950/20 border-violet-700/50 backdrop-blur hover:border-violet-600/50 transition-all cursor-pointer group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-xl">Usage</CardTitle>
                  <BarChart3 className="w-6 h-6 text-violet-400 group-hover:scale-110 transition-transform" />
                </div>
                <CardDescription className="text-slate-400">
                  Token usage & cost analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-300">
                  Detailed usage breakdowns by model, team, and time period.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/logs">
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur hover:border-slate-600/50 transition-all cursor-pointer group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-xl">Logs</CardTitle>
                  <ScrollText className="w-6 h-6 text-slate-400 group-hover:scale-110 transition-transform" />
                </div>
                <CardDescription className="text-slate-400">
                  Request & error logs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-300">
                  Browse and search through request history and error logs.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/system-monitor">
            <Card className="bg-gradient-to-br from-orange-900/20 to-orange-950/20 border-orange-700/50 backdrop-blur hover:border-orange-600/50 transition-all cursor-pointer group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-xl">System Monitor</CardTitle>
                  <Activity className="w-6 h-6 text-orange-400 group-hover:scale-110 transition-transform" />
                </div>
                <CardDescription className="text-slate-400">
                  Real-time system metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-300">
                  CPU, GPU, RAM, and AI process monitoring with live updates.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/process-manager">
            <Card className="bg-gradient-to-br from-rose-900/20 to-rose-950/20 border-rose-700/50 backdrop-blur hover:border-rose-600/50 transition-all cursor-pointer group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-xl">Process Manager</CardTitle>
                  <Settings className="w-6 h-6 text-rose-400 group-hover:scale-110 transition-transform" />
                </div>
                <CardDescription className="text-slate-400">
                  PM2 process control
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-300">
                  Start, stop, restart, and monitor managed processes.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/llm-discoverer">
            <Card className="bg-gradient-to-br from-fuchsia-900/20 to-fuchsia-950/20 border-fuchsia-700/50 backdrop-blur hover:border-fuchsia-600/50 transition-all cursor-pointer group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-xl">LLM Discoverer</CardTitle>
                  <Search className="w-6 h-6 text-fuchsia-400 group-hover:scale-110 transition-transform" />
                </div>
                <CardDescription className="text-slate-400">
                  Auto-detect running LLMs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-300">
                  Discover Ollama, llama.cpp, vLLM, and LM Studio instances.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/access-groups">
            <Card className="bg-gradient-to-br from-lime-900/20 to-lime-950/20 border-lime-700/50 backdrop-blur hover:border-lime-600/50 transition-all cursor-pointer group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-xl">Access Groups</CardTitle>
                  <Lock className="w-6 h-6 text-lime-400 group-hover:scale-110 transition-transform" />
                </div>
                <CardDescription className="text-slate-400">
                  Role-based access control
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-300">
                  Define and manage access groups and permission policies.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/budgets">
            <Card className="bg-gradient-to-br from-sky-900/20 to-sky-950/20 border-sky-700/50 backdrop-blur hover:border-sky-600/50 transition-all cursor-pointer group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-xl">Budgets</CardTitle>
                  <DollarSign className="w-6 h-6 text-sky-400 group-hover:scale-110 transition-transform" />
                </div>
                <CardDescription className="text-slate-400">
                  Spending limits & alerts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-300">
                  Set monthly budgets and receive alerts on spending thresholds.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/api-reference">
            <Card className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border-zinc-700/50 backdrop-blur hover:border-zinc-600/50 transition-all cursor-pointer group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-xl">API Reference</CardTitle>
                  <BookOpen className="w-6 h-6 text-zinc-400 group-hover:scale-110 transition-transform" />
                </div>
                <CardDescription className="text-slate-400">
                  Swagger documentation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-300">
                  Interactive API docs with request/response examples.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/settings">
            <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 backdrop-blur hover:border-gray-600/50 transition-all cursor-pointer group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-xl">Settings</CardTitle>
                  <Settings className="w-6 h-6 text-gray-400 group-hover:scale-110 transition-transform" />
                </div>
                <CardDescription className="text-slate-400">
                  System configuration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-300">
                  Global settings, integrations, and system preferences.
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="text-center text-slate-500 text-sm">
          <p>Forge Studio v3.0.0 · github.com/Jahanzaib211</p>
          <p className="mt-2">LiteLLM: :5050 · API: :5051 · llama.cpp: :8081 · Ollama: :11434</p>
        </div>
      </div>
    </div>
  );
}
