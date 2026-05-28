import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, TestTube, Loader2, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const PROVIDERS = [
  "groq", "gemini", "mistral", "cerebras", "sambanova", "cohere",
  "openrouter", "cloudflare", "ollama", "openai", "anthropic", "custom",
];

export default function ModelManager() {
  const [modelName, setModelName] = useState("");
  const [provider, setProvider] = useState("groq");
  const [modelId, setModelId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiBase, setApiBase] = useState("");
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; latency: number }>>({});

  const modelsQuery = trpc.models.list.useQuery(undefined, { refetchInterval: 5000 });
  const addMutation = trpc.models.add.useMutation();
  const removeMutation = trpc.models.remove.useMutation();
  const testMutation = trpc.models.test.useMutation();
  const utils = trpc.useUtils();

  const handleAdd = async () => {
    if (!modelName || !modelId) {
      toast.error("Model name and model ID are required");
      return;
    }

    try {
      const result = await addMutation.mutateAsync({
        modelName,
        provider,
        modelId,
        apiKey: apiKey || undefined,
        apiBase: apiBase || undefined,
      });

      if (result.success) {
        toast.success(`Model "${modelName}" added! Restarting LiteLLM...`);
        setModelName("");
        setModelId("");
        setApiKey("");
        setApiBase("");

        setTimeout(() => {
          utils.models.list.invalidate();
          utils.models.config.invalidate();
        }, 3000);
      } else {
        toast.error("Model already exists or failed to add");
      }
    } catch (error: any) {
      toast.error(`Failed: ${error.message}`);
    }
  };

  const handleRemove = async (name: string) => {
    try {
      const result = await removeMutation.mutateAsync({ modelName: name });
      if (result.success) {
        toast.success(`Model "${name}" removed`);
        setTimeout(() => {
          utils.models.list.invalidate();
          utils.models.config.invalidate();
        }, 3000);
      }
    } catch (error: any) {
      toast.error(`Failed: ${error.message}`);
    }
  };

  const handleTest = async (name: string) => {
    setTesting(name);
    try {
      const result = await testMutation.mutateAsync({ modelName: name });
      setTestResults((prev) => ({ ...prev, [name]: result }));
      if (result.success) {
        toast.success(`${name}: OK (${result.latency}ms)`);
      } else {
        toast.error(`${name}: Failed - ${result.error || "Unknown error"}`);
      }
    } catch (error: any) {
      toast.error(`Test failed: ${error.message}`);
    } finally {
      setTesting(null);
    }
  };

  const models = modelsQuery.data || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-[1800px] mx-auto">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">Model Manager</h1>
          <p className="text-slate-400 text-lg">Add, remove, and test LLM models — no code required</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2 bg-slate-800/30 border-slate-700/50 backdrop-blur">
            <CardHeader className="border-b border-slate-700/50">
              <CardTitle className="text-white flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add New Model
              </CardTitle>
              <CardDescription>Connect any LLM provider directly to LiteLLM</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Model Name (alias)</label>
                  <Input
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    placeholder="my-model"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Provider</label>
                  <Select value={provider} onValueChange={setProvider}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {PROVIDERS.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Model ID</label>
                  <Input
                    value={modelId}
                    onChange={(e) => setModelId(e.target.value)}
                    placeholder="llama-3.3-70b-versatile"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">API Key (optional)</label>
                  <Input
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    type="password"
                    placeholder="sk-..."
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-slate-400 mb-1 block">API Base URL (optional, for local/custom)</label>
                  <Input
                    value={apiBase}
                    onChange={(e) => setApiBase(e.target.value)}
                    placeholder="http://127.0.0.1:11434/v1"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
              <Button
                onClick={handleAdd}
                disabled={addMutation.isPending || !modelName || !modelId}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Add Model & Restart LiteLLM
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/30 border-slate-700/50 backdrop-blur">
            <CardHeader className="border-b border-slate-700/50">
              <CardTitle className="text-white">Quick Reference</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              <div className="p-3 bg-slate-700/30 rounded-lg">
                <div className="text-xs text-slate-400">Ollama</div>
                <div className="text-sm text-slate-300 font-mono">provider: ollama</div>
                <div className="text-sm text-slate-300 font-mono">model_id: hermes-4-14b-q4</div>
                <div className="text-sm text-slate-300 font-mono">api_base: http://127.0.0.1:11434</div>
              </div>
              <div className="p-3 bg-slate-700/30 rounded-lg">
                <div className="text-xs text-slate-400">llama.cpp</div>
                <div className="text-sm text-slate-300 font-mono">provider: openai</div>
                <div className="text-sm text-slate-300 font-mono">model_id: qwen-moe</div>
                <div className="text-sm text-slate-300 font-mono">api_base: http://127.0.0.1:8081/v1</div>
              </div>
              <div className="p-3 bg-slate-700/30 rounded-lg">
                <div className="text-xs text-slate-400">Groq</div>
                <div className="text-sm text-slate-300 font-mono">provider: groq</div>
                <div className="text-sm text-slate-300 font-mono">model_id: llama-3.3-70b-versatile</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-slate-800/30 border-slate-700/50 backdrop-blur">
          <CardHeader className="border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Configured Models ({models.length})</CardTitle>
                <CardDescription>From LiteLLM config — live from proxy</CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-slate-600 text-slate-300"
                onClick={() => utils.models.list.invalidate()}
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900/50 border-b border-slate-700/50">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-slate-300">Name</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-300">Model</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-300">Provider</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-300">Endpoint</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-300">Test</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((model) => (
                    <tr key={model.name} className="border-b border-slate-700/30 hover:bg-slate-800/50 transition-colors">
                      <td className="p-4 text-sm text-white font-medium">{model.name}</td>
                      <td className="p-4 text-sm text-slate-300 font-mono">{model.model}</td>
                      <td className="p-4">
                        <Badge variant="outline" className="border-slate-600 text-slate-300">
                          {model.provider}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-slate-400 font-mono">{model.apiBase || "LiteLLM proxy"}</td>
                      <td className="p-4">
                        {testing === model.name ? (
                          <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                        ) : testResults[model.name] ? (
                          testResults[model.name].success ? (
                            <Badge className="bg-green-600/20 text-green-400 border-green-600/50">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              {testResults[model.name].latency}ms
                            </Badge>
                          ) : (
                            <Badge className="bg-red-600/20 text-red-400 border-red-600/50">
                              <XCircle className="w-3 h-3 mr-1" />
                              Failed
                            </Badge>
                          )
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-slate-600 text-slate-300 h-7"
                            onClick={() => handleTest(model.name)}
                          >
                            <TestTube className="w-3 h-3 mr-1" />
                            Test
                          </Button>
                        )}
                      </td>
                      <td className="p-4">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-600/50 text-red-400 hover:bg-red-900/20 h-7"
                          onClick={() => handleRemove(model.name)}
                          disabled={removeMutation.isPending}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
