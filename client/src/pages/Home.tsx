import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, BarChart3, Cpu, Database, MessageSquare, Settings, Shield, Zap, Radio, Layers, TestTube } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Home() {
  const healthQuery = trpc.health.detailed.useQuery(undefined, { refetchInterval: 5000 });
  const providersQuery = trpc.providers.status.useQuery(undefined, { refetchInterval: 5000 });
  const liveStatsQuery = trpc.analytics.liveStats.useQuery(undefined, { refetchInterval: 5000 });

  const health = healthQuery.data;
  const providers = providersQuery.data || [];
  const healthyProviders = providers.filter(p => p.enabled && p.circuitState === "closed").length;
  const stats = liveStatsQuery.data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-[1800px] mx-auto p-6">
        <div className="mb-12 text-center">
          <h1 className="text-6xl font-bold text-white mb-4 tracking-tight">
            FreeAPI Forge
          </h1>
          <p className="text-xl text-slate-400 mb-8">
            AI Lab Control Center • Intelligent LLM Routing Platform
          </p>
          <div className="flex items-center justify-center gap-4 mb-4 flex-wrap">
            <Badge className="bg-green-600/20 text-green-400 border-green-600/50 px-4 py-2 text-sm">
              <Activity className="w-4 h-4 mr-2" />
              {health?.status === "healthy" ? "System Healthy" : "Checking..."}
            </Badge>
            <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/50 px-4 py-2 text-sm">
              <Cpu className="w-4 h-4 mr-2" />
              {healthyProviders}/{providers.filter(p => p.enabled).length} Providers
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Link href="/dashboard">
            <Card className="bg-gradient-to-br from-blue-900/20 to-blue-950/20 border-blue-700/50 backdrop-blur hover:border-blue-600/50 transition-all cursor-pointer group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-xl">Dashboard</CardTitle>
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
                  <Radio className="w-6 h-6 text-green-400 group-hover:scale-110 transition-transform" />
                </div>
                <CardDescription className="text-slate-400">
                  Direct backend connections
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

          <Link href="/requests">
            <Card className="bg-gradient-to-br from-indigo-900/20 to-indigo-950/20 border-indigo-700/50 backdrop-blur hover:border-indigo-600/50 transition-all cursor-pointer group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-xl">Request History</CardTitle>
                  <BarChart3 className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
                </div>
                <CardDescription className="text-slate-400">
                  Audit log with CSV export
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-300">
                  Paginated request history with filtering and export.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin">
            <Card className="bg-gradient-to-br from-orange-900/20 to-orange-950/20 border-orange-700/50 backdrop-blur hover:border-orange-600/50 transition-all cursor-pointer group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-xl">Admin Panel</CardTitle>
                  <Settings className="w-6 h-6 text-orange-400 group-hover:scale-110 transition-transform" />
                </div>
                <CardDescription className="text-slate-400">
                  Configure providers & budgets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-300">
                  Manage provider config, quality scores, and budget limits.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/health">
            <Card className="bg-gradient-to-br from-red-900/20 to-red-950/20 border-red-700/50 backdrop-blur hover:border-red-600/50 transition-all cursor-pointer group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-xl">System Health</CardTitle>
                  <Zap className="w-6 h-6 text-red-400 group-hover:scale-110 transition-transform" />
                </div>
                <CardDescription className="text-slate-400">
                  Infrastructure monitoring
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-300">
                  PostgreSQL, Redis, LiteLLM proxy, and provider status.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-xl">Browser Extension</CardTitle>
                <TestTube className="w-6 h-6 text-slate-400" />
              </div>
              <CardDescription className="text-slate-400">
                Chrome/Edge extension
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-300 mb-3">
                Load the <code className="text-blue-400">extension/</code> folder as unpacked in Chrome.
              </p>
              <Badge className="bg-green-600/20 text-green-400 border-green-600/50">Ready</Badge>
            </CardContent>
          </Card>
        </div>

        <div className="text-center text-slate-500 text-sm">
          <p>FreeAPI Forge v2.0.0 • React 19 + tRPC 11 + PostgreSQL + Redis + LiteLLM</p>
          <p className="mt-2">LiteLLM: :5050 • API: :5051 • llama.cpp: :8081 • Ollama: :11434</p>
        </div>
      </div>
    </div>
  );
}
