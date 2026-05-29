import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Shield,
  CheckCircle2,
  XCircle,
  Activity,
  Clock,
  AlertTriangle,
} from "lucide-react";

const recentExecutions = [
  { id: "exec-001", timestamp: new Date().toISOString(), guardrail: "PII Detection", requestId: "req-001", result: "pass", details: "No PII found in request" },
  { id: "exec-002", timestamp: new Date(Date.now() - 30000).toISOString(), guardrail: "Content Filter", requestId: "req-002", result: "block", details: "Content flagged: violence detected" },
  { id: "exec-003", timestamp: new Date(Date.now() - 60000).toISOString(), guardrail: "Rate Limiter", requestId: "req-003", result: "pass", details: "Within rate limits" },
  { id: "exec-004", timestamp: new Date(Date.now() - 90000).toISOString(), guardrail: "PII Detection", requestId: "req-004", result: "pass", details: "No PII found" },
  { id: "exec-005", timestamp: new Date(Date.now() - 120000).toISOString(), guardrail: "Token Limit", requestId: "req-005", result: "block", details: "Exceeds max token limit of 4096" },
  { id: "exec-006", timestamp: new Date(Date.now() - 150000).toISOString(), guardrail: "Content Filter", requestId: "req-006", result: "pass", details: "Content approved" },
  { id: "exec-007", timestamp: new Date(Date.now() - 180000).toISOString(), guardrail: "Prompt Injection", requestId: "req-007", result: "block", details: "Potential injection pattern detected" },
];

export default function GuardrailsMonitor() {
  const totalChecks = recentExecutions.length;
  const totalBlocks = recentExecutions.filter((e) => e.result === "block").length;
  const passRate = totalChecks > 0 ? ((totalChecks - totalBlocks) / totalChecks) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-[1800px] mx-auto">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">Guardrails Monitor</h1>
          <p className="text-slate-400 text-lg">Monitor guardrail execution results and policies</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-slate-800/30 border-slate-700/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Total Checks</span>
                <Activity className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-3xl font-bold text-white">{totalChecks}</div>
              <div className="text-xs text-slate-500 mt-1">Last 24 hours</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/30 border-slate-700/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Blocks</span>
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
              <div className="text-3xl font-bold text-white">{totalBlocks}</div>
              <div className="text-xs text-slate-500 mt-1">Requests blocked</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/30 border-slate-700/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Pass Rate</span>
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-3xl font-bold text-white">{passRate.toFixed(1)}%</div>
              <div className="text-xs text-slate-500 mt-1">Overall pass rate</div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-slate-800/30 border-slate-700/50 backdrop-blur">
          <CardHeader className="border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              <CardTitle className="text-white">Recent Guardrail Executions</CardTitle>
            </div>
            <CardDescription>Latest guardrail check results</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700/50 hover:bg-transparent">
                  <TableHead className="text-slate-300">Timestamp</TableHead>
                  <TableHead className="text-slate-300">Guardrail</TableHead>
                  <TableHead className="text-slate-300">Request ID</TableHead>
                  <TableHead className="text-slate-300">Result</TableHead>
                  <TableHead className="text-slate-300">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentExecutions.map((exec) => (
                  <TableRow key={exec.id} className="border-slate-700/50 hover:bg-slate-700/30">
                    <TableCell className="text-slate-300 text-sm">
                      <Clock className="w-3 h-3 inline mr-1 text-slate-500" />
                      {new Date(exec.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-white font-medium">{exec.guardrail}</TableCell>
                    <TableCell className="text-slate-400 font-mono text-xs">{exec.requestId}</TableCell>
                    <TableCell>
                      <Badge className={exec.result === "pass"
                        ? "bg-green-600/20 text-green-400 border-green-600/50"
                        : "bg-red-600/20 text-red-400 border-red-600/50"
                      }>
                        {exec.result === "pass" ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                        {exec.result}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-400 text-sm max-w-xs truncate">{exec.details}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
