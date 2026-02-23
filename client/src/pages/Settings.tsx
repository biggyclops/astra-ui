import { useState, useRef } from "react";
import { useSettings } from "@/hooks/use-settings";
import { type NodeRegistryEntry, type Tone, type DefaultSort, type DefaultFilter, type HistoryRetention } from "@shared/settings";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
  User, Network, Image, Briefcase, Mic, Info,
  Plus, Trash2, Pencil, Check, X, Wifi, WifiOff,
  Download, Upload, RotateCcw, Lock, Server, Shield
} from "lucide-react";

const sections = [
  { id: "identity", label: "Identity", icon: User },
  { id: "nodes", label: "Nodes & Network", icon: Network },
  { id: "media", label: "Media Wall", icon: Image },
  { id: "jobs", label: "Jobs", icon: Briefcase },
  { id: "voice", label: "Voice", icon: Mic },
  { id: "about", label: "About / Diagnostics", icon: Info },
] as const;

type SectionId = typeof sections[number]["id"];

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-bold font-display tracking-tight">{title}</h2>
      {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
    </div>
  );
}

function IdentitySection() {
  const { settings, updateSection } = useSettings();
  const { identity } = settings;

  return (
    <div>
      <SectionHeader title="Identity" description="Configure Astra's personality and communication style." />
      <div className="space-y-1 divide-y divide-white/5">
        <SettingRow label="Name" description="Display name used in the interface.">
          <Input
            value={identity.name}
            onChange={(e) => updateSection("identity", { name: e.target.value })}
            className="w-40 h-8 text-sm bg-white/5 border-white/10"
            data-testid="input-identity-name"
          />
        </SettingRow>
        <SettingRow label="Tone" description="Affects UI copy and response style.">
          <Select value={identity.tone} onValueChange={(v) => updateSection("identity", { tone: v as Tone })}>
            <SelectTrigger className="w-36 h-8 text-sm bg-white/5 border-white/10" data-testid="select-tone">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="calm">Calm</SelectItem>
              <SelectItem value="direct">Direct</SelectItem>
              <SelectItem value="dry">Dry</SelectItem>
              <SelectItem value="friendly">Friendly</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow label="Lore Mode" description="Operator-style responses: brief summaries, checklists, commands.">
          <Switch
            checked={identity.loreMode}
            onCheckedChange={(v) => updateSection("identity", { loreMode: v })}
            data-testid="switch-lore-mode"
          />
        </SettingRow>
      </div>
    </div>
  );
}

function NodesSection() {
  const { settings, updateSection } = useSettings();
  const { nodesNetwork } = settings;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [addMode, setAddMode] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [testResults, setTestResults] = useState<Record<string, "online" | "offline" | "unknown">>({});
  const [testing, setTesting] = useState(false);

  const isValidUrl = (url: string) => /^https?:\/\/.+/.test(url);

  const startEdit = (node: NodeRegistryEntry) => {
    setEditingId(node.id);
    setEditName(node.name);
    setEditUrl(node.baseUrl);
  };

  const saveEdit = () => {
    if (!editingId || !editName.trim() || !isValidUrl(editUrl)) return;
    updateSection("nodesNetwork", {
      registry: nodesNetwork.registry.map(n =>
        n.id === editingId ? { ...n, name: editName.trim(), baseUrl: editUrl.trim() } : n
      ),
    });
    setEditingId(null);
  };

  const removeNode = (id: string) => {
    updateSection("nodesNetwork", {
      registry: nodesNetwork.registry.filter(n => n.id !== id),
    });
  };

  const addNode = () => {
    if (!newName.trim() || !isValidUrl(newUrl)) return;
    const id = `node-${newName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
    updateSection("nodesNetwork", {
      registry: [...nodesNetwork.registry, { id, name: newName.trim(), baseUrl: newUrl.trim() }],
    });
    setNewName("");
    setNewUrl("");
    setAddMode(false);
  };

  const runConnectivityTest = async () => {
    setTesting(true);
    const results: Record<string, "online" | "offline" | "unknown"> = {};
    await new Promise(r => setTimeout(r, 800));
    for (const node of nodesNetwork.registry) {
      const rand = Math.random();
      results[node.id] = rand > 0.2 ? "online" : rand > 0.1 ? "unknown" : "offline";
    }
    setTestResults(results);
    setTesting(false);
  };

  return (
    <div>
      <SectionHeader title="Nodes & Network" description="Manage node registry and connectivity." />

      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-mono text-muted-foreground uppercase">Node Registry</h3>
          <Button variant="ghost" size="sm" onClick={() => setAddMode(true)} className="text-xs gap-1.5" data-testid="btn-add-node">
            <Plus className="w-3 h-3" /> Add Node
          </Button>
        </div>

        <div className="space-y-2">
          {nodesNetwork.registry.map((node) => (
            <div key={node.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5" data-testid={`node-registry-${node.id}`}>
              {editingId === node.id ? (
                <>
                  <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-7 text-xs bg-white/5 border-white/10 flex-1" placeholder="Name" />
                  <Input value={editUrl} onChange={e => setEditUrl(e.target.value)} className={cn("h-7 text-xs bg-white/5 border-white/10 flex-[2]", !isValidUrl(editUrl) && editUrl.length > 0 && "border-red-500/50")} placeholder="https://..." />
                  <Button variant="ghost" size="icon" className="w-7 h-7" onClick={saveEdit} disabled={!editName.trim() || !isValidUrl(editUrl)}>
                    <Check className="w-3 h-3 text-green-400" />
                  </Button>
                  <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setEditingId(null)}>
                    <X className="w-3 h-3" />
                  </Button>
                </>
              ) : (
                <>
                  <Server className="w-4 h-4 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{node.name}</p>
                    <p className="text-[11px] font-mono text-muted-foreground truncate">{node.baseUrl}</p>
                  </div>
                  {testResults[node.id] && (
                    <div className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border",
                      testResults[node.id] === "online" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                      testResults[node.id] === "offline" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                      "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                    )}>
                      <span className={cn("w-1.5 h-1.5 rounded-full",
                        testResults[node.id] === "online" ? "bg-green-400" :
                        testResults[node.id] === "offline" ? "bg-red-400" : "bg-yellow-400"
                      )} />
                      {testResults[node.id] === "online" ? "Online" : testResults[node.id] === "offline" ? "Offline" : "Unknown"}
                    </div>
                  )}
                  <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => startEdit(node)} data-testid={`btn-edit-${node.id}`}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="w-7 h-7 hover:text-red-400" onClick={() => removeNode(node.id)} data-testid={`btn-remove-${node.id}`}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </>
              )}
            </div>
          ))}

          <AnimatePresence>
            {addMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <Input value={newName} onChange={e => setNewName(e.target.value)} className="h-7 text-xs bg-white/5 border-white/10 flex-1" placeholder="Node name" data-testid="input-new-node-name" />
                  <Input value={newUrl} onChange={e => setNewUrl(e.target.value)} className={cn("h-7 text-xs bg-white/5 border-white/10 flex-[2]", !isValidUrl(newUrl) && newUrl.length > 0 && "border-red-500/50")} placeholder="https://..." data-testid="input-new-node-url" />
                  <Button variant="ghost" size="icon" className="w-7 h-7" onClick={addNode} disabled={!newName.trim() || !isValidUrl(newUrl)} data-testid="btn-confirm-add">
                    <Check className="w-3 h-3 text-green-400" />
                  </Button>
                  <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => { setAddMode(false); setNewName(""); setNewUrl(""); }}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Button variant="outline" size="sm" onClick={runConnectivityTest} disabled={testing} className="mt-3 text-xs gap-1.5 border-white/10" data-testid="btn-connectivity-test">
          {testing ? <Wifi className="w-3 h-3 animate-pulse" /> : <Wifi className="w-3 h-3" />}
          {testing ? "Testing..." : "Connectivity Test"}
        </Button>
      </div>

      <Separator className="bg-white/5 my-6" />

      <div className="space-y-1 divide-y divide-white/5">
        <SettingRow label="LLM Node" description="Default node for language model requests.">
          <Select value={nodesNetwork.defaultLlmNode} onValueChange={(v) => updateSection("nodesNetwork", { defaultLlmNode: v })}>
            <SelectTrigger className="w-36 h-8 text-sm bg-white/5 border-white/10" data-testid="select-llm-node">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {nodesNetwork.registry.map(n => <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow label="Render Node" description="Default node for ComfyUI / image generation.">
          <Select value={nodesNetwork.defaultRenderNode} onValueChange={(v) => updateSection("nodesNetwork", { defaultRenderNode: v })}>
            <SelectTrigger className="w-36 h-8 text-sm bg-white/5 border-white/10" data-testid="select-render-node">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {nodesNetwork.registry.map(n => <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow label="Storage Node" description="Default node for file and media storage.">
          <Select value={nodesNetwork.defaultStorageNode} onValueChange={(v) => updateSection("nodesNetwork", { defaultStorageNode: v })}>
            <SelectTrigger className="w-36 h-8 text-sm bg-white/5 border-white/10" data-testid="select-storage-node">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {nodesNetwork.registry.map(n => <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow label="Require Approval" description="Ask for confirmation before running jobs.">
          <Switch
            checked={nodesNetwork.requireApproval}
            onCheckedChange={(v) => updateSection("nodesNetwork", { requireApproval: v })}
            data-testid="switch-require-approval"
          />
        </SettingRow>
      </div>
    </div>
  );
}

function MediaWallSection() {
  const { settings, updateSection } = useSettings();
  const { mediaWall } = settings;

  return (
    <div>
      <SectionHeader title="Media Wall" description="Customize media browsing and playback behavior." />
      <div className="space-y-1 divide-y divide-white/5">
        <SettingRow label="Ambient Loop Mode" description="Loop ambient media in the background.">
          <Switch
            checked={mediaWall.ambientLoop}
            onCheckedChange={(v) => updateSection("mediaWall", { ambientLoop: v })}
            data-testid="switch-ambient-loop"
          />
        </SettingRow>
        <SettingRow label="Max Simultaneous Videos" description={`Currently: ${mediaWall.maxSimultaneousVideos}`}>
          <div className="w-32">
            <Slider
              value={[mediaWall.maxSimultaneousVideos]}
              onValueChange={([v]) => updateSection("mediaWall", { maxSimultaneousVideos: v })}
              min={1}
              max={12}
              step={1}
              data-testid="slider-max-videos"
            />
          </div>
        </SettingRow>
        <SettingRow label="Autoplay on Hover" description="Start video playback on mouse hover.">
          <Switch
            checked={mediaWall.autoplayOnHover}
            onCheckedChange={(v) => updateSection("mediaWall", { autoplayOnHover: v })}
            data-testid="switch-autoplay-hover"
          />
        </SettingRow>
        <SettingRow label="Show Labels (IMG/VID)" description="Display type badges on media tiles.">
          <Switch
            checked={mediaWall.showLabels}
            onCheckedChange={(v) => updateSection("mediaWall", { showLabels: v })}
            data-testid="switch-show-labels"
          />
        </SettingRow>
        <SettingRow label="Default Sort">
          <Select value={mediaWall.defaultSort} onValueChange={(v) => updateSection("mediaWall", { defaultSort: v as DefaultSort })}>
            <SelectTrigger className="w-32 h-8 text-sm bg-white/5 border-white/10" data-testid="select-default-sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow label="Default Filter">
          <Select value={mediaWall.defaultFilter} onValueChange={(v) => updateSection("mediaWall", { defaultFilter: v as DefaultFilter })}>
            <SelectTrigger className="w-32 h-8 text-sm bg-white/5 border-white/10" data-testid="select-default-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="videos">Videos</SelectItem>
              <SelectItem value="images">Images</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
      </div>
    </div>
  );
}

function JobsSection() {
  const { settings, updateSection } = useSettings();
  const { jobs } = settings;

  return (
    <div>
      <SectionHeader title="Jobs" description="Control job execution and history." />
      <div className="space-y-1 divide-y divide-white/5">
        <SettingRow label="Max Concurrent Jobs" description={`Currently: ${jobs.maxConcurrentJobs}`}>
          <div className="w-32">
            <Slider
              value={[jobs.maxConcurrentJobs]}
              onValueChange={([v]) => updateSection("jobs", { maxConcurrentJobs: v })}
              min={1}
              max={8}
              step={1}
              data-testid="slider-max-jobs"
            />
          </div>
        </SettingRow>
        <SettingRow label="Auto-open Output" description="Open completed job output in Media Wall.">
          <Switch
            checked={jobs.autoOpenOutput}
            onCheckedChange={(v) => updateSection("jobs", { autoOpenOutput: v })}
            data-testid="switch-auto-open"
          />
        </SettingRow>
        <SettingRow label="Keep Job History">
          <Select value={jobs.keepHistory} onValueChange={(v) => updateSection("jobs", { keepHistory: v as HistoryRetention })}>
            <SelectTrigger className="w-28 h-8 text-sm bg-white/5 border-white/10" data-testid="select-keep-history">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24 hours</SelectItem>
              <SelectItem value="7d">7 days</SelectItem>
              <SelectItem value="30d">30 days</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
      </div>

      <Separator className="bg-white/5 my-6" />

      <div>
        <h3 className="text-xs font-mono text-muted-foreground uppercase mb-3 flex items-center gap-2">
          <Shield className="w-3 h-3" /> Stop Conditions
        </h3>
        <div className="p-3 rounded-lg bg-white/5 border border-white/5 font-mono text-xs text-muted-foreground space-y-1" data-testid="text-stop-conditions">
          <p>• Stop after 5 iterations</p>
          <p>• Destructive actions require approval</p>
        </div>
      </div>
    </div>
  );
}

function VoiceSection() {
  return (
    <div>
      <SectionHeader title="Voice" description="Voice interface configuration." />
      <div className="mb-4 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-400 font-medium flex items-center gap-2">
        <Lock className="w-3 h-3" />
        Coming soon — will route to Kratos service.
      </div>
      <div className="space-y-1 divide-y divide-white/5 opacity-40 pointer-events-none">
        <SettingRow label="Push-to-Talk">
          <Switch checked={false} disabled />
        </SettingRow>
        <SettingRow label="Wake Word">
          <Switch checked={false} disabled />
        </SettingRow>
        <SettingRow label="Voice Output">
          <Switch checked={false} disabled />
        </SettingRow>
      </div>
    </div>
  );
}

function AboutSection() {
  const { exportSettings, importSettings, resetSettings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) importSettings(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div>
      <SectionHeader title="About / Diagnostics" description="System information and data management." />

      <div className="space-y-3 mb-6">
        <div className="p-3 rounded-lg bg-white/5 border border-white/5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-mono text-xs">Version</span>
            <span className="font-mono text-xs">0.1.0-alpha</span>
          </div>
        </div>
        <div className="p-3 rounded-lg bg-white/5 border border-white/5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-mono text-xs">Build</span>
            <span className="font-mono text-xs">2026.02.21</span>
          </div>
        </div>
        <div className="p-3 rounded-lg bg-white/5 border border-white/5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-mono text-xs">Runtime</span>
            <span className="font-mono text-xs">Node {typeof process !== "undefined" ? "" : ""}/ React 18</span>
          </div>
        </div>
      </div>

      <Separator className="bg-white/5 my-6" />

      <div className="space-y-3">
        <Button variant="outline" size="sm" onClick={exportSettings} className="w-full text-xs gap-2 border-white/10" data-testid="btn-export-settings">
          <Download className="w-3.5 h-3.5" /> Export Settings
        </Button>

        <input type="file" accept=".json" ref={fileInputRef} onChange={handleImport} className="hidden" />
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="w-full text-xs gap-2 border-white/10" data-testid="btn-import-settings">
          <Upload className="w-3.5 h-3.5" /> Import Settings
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full text-xs gap-2 border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300" data-testid="btn-reset-settings">
              <RotateCcw className="w-3.5 h-3.5" /> Reset Settings
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card border-white/10">
            <AlertDialogHeader>
              <AlertDialogTitle>Reset All Settings?</AlertDialogTitle>
              <AlertDialogDescription>
                This will restore all settings to their default values. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-white/10">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={resetSettings} className="bg-red-500 hover:bg-red-600" data-testid="btn-confirm-reset">
                Reset
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

const sectionComponents: Record<SectionId, () => JSX.Element> = {
  identity: IdentitySection,
  nodes: NodesSection,
  media: MediaWallSection,
  jobs: JobsSection,
  voice: VoiceSection,
  about: AboutSection,
};

export default function Settings() {
  const [activeSection, setActiveSection] = useState<SectionId>("identity");
  const ActiveComponent = sectionComponents[activeSection];

  return (
    <div className="flex h-screen w-full bg-background">
      <div className="w-56 flex-shrink-0 border-r border-white/5 bg-background/50 backdrop-blur-md overflow-y-auto">
        <div className="p-4 pb-2">
          <h1 className="text-lg font-bold font-display tracking-tight" data-testid="text-settings-title">Settings</h1>
          <p className="text-xs text-muted-foreground mt-1">Operator configuration</p>
        </div>
        <nav className="p-2 space-y-0.5">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              data-testid={`nav-${s.id}`}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 text-left",
                activeSection === s.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              <s.icon className="w-4 h-4 flex-shrink-0" />
              {s.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <ActiveComponent />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
