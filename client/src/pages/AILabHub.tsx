import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import {
  Brain, Cpu, HardDrive, Globe, Key, Plus,
  RefreshCw, Search, TestTube, X, Check,
  Zap, Radio, Server, Play, DollarSign,
  Layers, Wifi, WifiOff
} from "lucide-react";
import { cn } from "@/lib/utils";

type CatalogModel = {
  id: string;
  displayName: string;
  provider: string;
  providerName: string;
  source: string;
  pool: "paid" | "free" | "local";
  status: string;
  size?: string;
  quantization?: string;
  format?: string;
  addedAt?: string;
};

type CatalogProvider = {
  name: string;
  displayName: string;
  type: string;
  pool: "paid" | "free" | "local";
  modelCount: number;
  enabled: boolean;
  status: string;
  apiUrl?: string;
};

type PoolStats = {
  paid: { providers: number; models: number };
  free: { providers: number; models: number };
  local: { providers: number; models: number };
};

const poolColors: Record<string, string> = {
  paid: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  free: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  local: "bg-blue-500/10 text-blue-400 border-blue-500/30",
};

const sourceIcons: Record<string, React.ReactNode> = {
  cloud: <Globe className="h-3 w-3" />,
  custom: <Server className="h-3 w-3" />,
  local_ollama: <Brain className="h-3 w-3" />,
  local_llamacpp: <Cpu className="h-3 w-3" />,
  local_gguf: <HardDrive className="h-3 w-3" />,
  hf_cache: <Layers className="h-3 w-3" />,
};

const statusColors: Record<string, string> = {
  online: "bg-emerald-500",
  running: "bg-emerald-500",
  available: "bg-blue-400",
  offline: "bg-slate-600",
  cached: "bg-violet-400",
};

export default function AILabHub() {
  const catalog = trpc.catalog.getAll.useQuery(undefined, { refetchInterval: 15000 });
  const [search, setSearch] = useState("");
  const [poolFilter, setPoolFilter] = useState<string>("all");
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const addMutation = trpc.catalog.providers.addQuick.useMutation();
  const knownProviders = trpc.catalog.providers.listKnown.useQuery();
  const localScan = trpc.catalog.local.scan.useQuery(undefined, { enabled: false });

  const models: CatalogModel[] = catalog.data?.models || [];
  const providers: CatalogProvider[] = catalog.data?.providers || [];
  const pools: PoolStats = catalog.data?.pools || { paid: { providers: 0, models: 0 }, free: { providers: 0, models: 0 }, local: { providers: 0, models: 0 } };

  const filtered = models.filter((m) => {
    if (search && !m.displayName.toLowerCase().includes(search.toLowerCase()) && !m.id.toLowerCase().includes(search.toLowerCase())) return false;
    if (poolFilter !== "all" && m.pool !== poolFilter) return false;
    if (selectedProvider !== "all" && m.provider !== selectedProvider) return false;
    return true;
  });

  const handleAddKey = async (providerKey: string) => {
    const key = prompt(`Enter your ${providerKey} API key:`);
    if (!key) return;
    try {
      await addMutation.mutateAsync({ providerKey, apiKey: key });
      catalog.refetch();
    } catch (e: any) {
      alert("Failed to add: " + (e?.message || "Unknown error"));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-[1800px] mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              AI Lab Hub
            </h1>
            <p className="text-slate-400 mt-1">Unified model catalog and provider management</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={() => catalog.refetch()} disabled={catalog.isFetching}>
              <RefreshCw className={cn("h-4 w-4 mr-2", catalog.isFetching && "animate-spin")} />
              Refresh
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowAddModal(true)}>
              <Key className="h-4 w-4 mr-2" />
              Add API Key
            </Button>
          </div>
        </div>

        {/* Pool Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {(["paid", "free", "local"] as const).map((pool) => (
            <button
              key={pool}
              onClick={() => setPoolFilter(poolFilter === pool ? "all" : pool)}
              className={cn(
                "rounded-xl p-4 border transition-all",
                poolColors[pool],
                poolFilter === pool ? "ring-2 ring-white/20 scale-[1.02]" : "opacity-70 hover:opacity-100"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold uppercase">{pool}</span>
                <DollarSign className="h-4 w-4 opacity-50" />
              </div>
              <div className="mt-2 text-2xl font-bold">
                {pools[pool].models} <span className="text-sm font-normal opacity-70">models</span>
              </div>
              <div className="text-xs opacity-60">{pools[pool].providers} providers</div>
            </button>
          ))}
        </div>

        <div className="flex gap-6">
          {/* Provider Sidebar */}
          <div className="w-64 shrink-0">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Server className="h-4 w-4" /> Providers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <button
                  onClick={() => setSelectedProvider("all")}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                    selectedProvider === "all" ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800/50"
                  )}
                >
                  All Providers ({models.length})
                </button>
                {providers.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => setSelectedProvider(p.name)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between",
                      selectedProvider === p.name ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800/50"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className={cn("w-2 h-2 rounded-full", statusColors[p.status])} />
                      {p.displayName}
                    </span>
                    <span className="text-xs opacity-60">{p.modelCount}</span>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Local Scanner */}
            <Card className="bg-slate-900/50 border-slate-800 mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Radio className="h-4 w-4" /> Local Scanner
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => localScan.refetch()}
                  disabled={localScan.isFetching}
                >
                  <RefreshCw className={cn("h-4 w-4 mr-2", localScan.isFetching && "animate-spin")} />
                  Scan for Local LLMs
                </Button>
                {localScan.data && (
                  <div className="mt-3 text-xs text-slate-400">
                    Found {localScan.data.length} local models
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Model Grid */}
          <div className="flex-1 min-w-0">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search models by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-slate-900/50 border-slate-800"
              />
            </div>

            {/* Model Grid */}
            {catalog.isLoading ? (
              <div className="text-center py-20 text-slate-500">Loading catalog...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-slate-500">
                <Server className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No models found</p>
                <p className="text-sm mt-1">Add an API key or scan for local models</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filtered.map((m) => (
                  <Card
                    key={m.id}
                    className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0">
                          <CardTitle className="text-sm truncate">{m.displayName}</CardTitle>
                          <CardDescription className="text-xs mt-1 truncate">{m.providerName}</CardDescription>
                        </div>
                        <Badge className={cn("text-[10px] border", poolColors[m.pool])}>
                          {m.pool}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          {sourceIcons[m.source] || <Server className="h-3 w-3" />}
                          {m.source.replace(/_/g, " ")}
                        </span>
                        <span className="flex items-center gap-1 ml-auto">
                          <span className={cn("w-1.5 h-1.5 rounded-full", statusColors[m.status])} />
                          {m.status}
                        </span>
                      </div>
                      {m.size && (
                        <div className="mt-2 flex gap-2 text-[10px] text-slate-500">
                          <span>{m.size}</span>
                          {m.quantization && <span>· {m.quantization}</span>}
                          {m.format && <span>· {m.format}</span>}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add API Key Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-[480px] max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Key className="h-5 w-5 text-blue-400" />
                Add API Key
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-slate-400 mb-4">Select a provider and paste your API key. Models are auto-discovered.</p>

            <div className="space-y-2">
              {knownProviders.data?.map((kp) => (
                <Card key={kp.key} className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors cursor-pointer" onClick={() => handleAddKey(kp.key)}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{kp.name}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{kp.url}</div>
                    </div>
                    <Plus className="h-4 w-4 text-slate-500" />
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800">
              <p className="text-xs text-slate-500 mb-2">
                For custom OpenAI-compatible endpoints, use the{" "}
                <a href="/custom-providers" className="text-blue-400 hover:underline">Custom Providers</a> page.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
