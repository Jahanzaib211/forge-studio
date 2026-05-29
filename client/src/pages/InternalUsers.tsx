import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Users,
  Shield,
  Edit2,
  Clock,
  Mail,
} from "lucide-react";

const internalUsers = [
  { id: "1", name: "Admin User", email: "admin@example.com", role: "admin", team: "engineering", lastSignIn: new Date().toISOString() },
  { id: "2", name: "John Developer", email: "john@example.com", role: "member", team: "engineering", lastSignIn: new Date(Date.now() - 3600000).toISOString() },
  { id: "3", name: "Sarah Researcher", email: "sarah@example.com", role: "member", team: "research", lastSignIn: new Date(Date.now() - 86400000).toISOString() },
  { id: "4", name: "Mike Analyst", email: "mike@example.com", role: "viewer", team: "data", lastSignIn: new Date(Date.now() - 172800000).toISOString() },
];

const roleColors: Record<string, string> = {
  admin: "bg-purple-600/20 text-purple-400 border-purple-600/50",
  member: "bg-blue-600/20 text-blue-400 border-blue-600/50",
  viewer: "bg-slate-600/20 text-slate-400 border-slate-600/50",
};

export default function InternalUsers() {
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [newRole, setNewRole] = useState("");

  const handleSaveRole = (userId: string) => {
    setEditingRole(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-[1800px] mx-auto">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">Internal Users</h1>
          <p className="text-slate-400 text-lg">Manage team members and roles</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-slate-800/30 border-slate-700/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Total Users</span>
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-3xl font-bold text-white">{internalUsers.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/30 border-slate-700/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Admins</span>
                <Shield className="w-5 h-5 text-purple-400" />
              </div>
              <div className="text-3xl font-bold text-white">{internalUsers.filter((u) => u.role === "admin").length}</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/30 border-slate-700/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Teams</span>
                <Users className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-3xl font-bold text-white">{new Set(internalUsers.map((u) => u.team)).size}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-slate-800/30 border-slate-700/50 backdrop-blur">
          <CardHeader className="border-b border-slate-700/50">
            <CardTitle className="text-white">All Users</CardTitle>
            <CardDescription>Manage user roles and team assignments</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700/50 hover:bg-transparent">
                  <TableHead className="text-slate-300">User</TableHead>
                  <TableHead className="text-slate-300">Role</TableHead>
                  <TableHead className="text-slate-300">Team</TableHead>
                  <TableHead className="text-slate-300">Last Signed In</TableHead>
                  <TableHead className="text-slate-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {internalUsers.map((user) => (
                  <TableRow key={user.id} className="border-slate-700/50 hover:bg-slate-700/30">
                    <TableCell>
                      <div>
                        <div className="font-medium text-white">{user.name}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3" /> {user.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {editingRole === user.id ? (
                        <div className="flex gap-2">
                          <Select value={newRole} onValueChange={setNewRole}>
                            <SelectTrigger className="w-28 bg-slate-700 border-slate-600 text-white h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-700 border-slate-600">
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="viewer">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleSaveRole(user.id)}>
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 text-slate-400" onClick={() => setEditingRole(null)}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Badge className={roleColors[user.role]}>{user.role}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-slate-600 text-slate-300">{user.team}</Badge>
                    </TableCell>
                    <TableCell className="text-slate-400 text-sm">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {new Date(user.lastSignIn).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        onClick={() => { setEditingRole(user.id); setNewRole(user.role); }}
                      >
                        <Edit2 className="w-3 h-3 mr-1" /> Edit Role
                      </Button>
                    </TableCell>
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
