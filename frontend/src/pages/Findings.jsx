import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Bot, Filter, MapPin, Plus, RefreshCw, Search, UserRound, X } from "lucide-react";
import { createManualFinding, getDisasterFindings, getDisasterPriorities } from "../services/api";
import { useDisaster } from "../context/DisasterContext";
import FindingReviewDrawer from "../components/FindingReviewDrawer";

const pretty = (value) => value?.replaceAll("_", " ") ?? "UNKNOWN";
const INITIAL_FORM = { type: "ROAD_BLOCKAGE", severity: "MODERATE", title: "", description: "", latitude: "", longitude: "" };
const tabs = [
  ["all", "All Findings"], ["pending", "Pending Verification"], ["verified", "Verified"], ["priority", "Priority Queue"],
];
const severityRank = { LOW: 1, MODERATE: 2, SEVERE: 3, CRITICAL: 4 };

function findingGroupKey(finding) {
  return finding.source === "AI" && finding.aiRunId
    ? `ai-run:${finding.aiRunId}`
    : `finding:${finding.id}`;
}

function groupFindings(items) {
  const grouped = new Map();
  items.forEach((finding) => {
    const key = findingGroupKey(finding);
    if (!grouped.has(key)) grouped.set(key, { key, findings: [] });
    grouped.get(key).findings.push(finding);
  });
  return [...grouped.values()];
}

export default function Findings({ setActiveTab }) {
  const { currentDisaster } = useDisaster();
  const [findings, setFindings] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [activeView, setActiveView] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [selectedGroupKey, setSelectedGroupKey] = useState(null);
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState("ALL");
  const [source, setSource] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showReport, setShowReport] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!currentDisaster?.id) { setFindings([]); setPriorities([]); return; }
    try {
      setLoading(true); setError("");
      const [findingResponse, priorityResponse] = await Promise.all([getDisasterFindings(currentDisaster.id), getDisasterPriorities(currentDisaster.id)]);
      setFindings(findingResponse?.data?.findings ?? []);
      setPriorities(priorityResponse?.data?.priorities ?? []);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }, [currentDisaster?.id]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setSelectedId(null); setSelectedGroupKey(null); setActiveView("all"); }, [currentDisaster?.id]);

  const priorityByFinding = useMemo(() => new Map(priorities.map((item) => [item.findingId, item])), [priorities]);
  const selectedFinding = findings.find((item) => item.id === selectedId) ?? null;
  const filteredFindings = useMemo(() => {
    const base = activeView === "priority"
      ? priorities.map((priority) => findings.find((finding) => finding.id === priority.findingId)).filter(Boolean)
      : findings.filter((finding) => activeView === "pending" ? finding.verificationStatus === "PENDING" : activeView === "verified" ? ["CONFIRMED", "CORRECTED"].includes(finding.verificationStatus) : true);
    const needle = query.trim().toLowerCase();
    return base.filter((finding) => (severity === "ALL" || finding.severity === severity) && (source === "ALL" || finding.source === source) && (!needle || [finding.title, finding.description, finding.type, finding.source, finding.id].some((value) => String(value || "").toLowerCase().includes(needle))));
  }, [activeView, findings, priorities, query, severity, source]);

  const groups = useMemo(() => groupFindings(findings), [findings]);
  const visibleKeys = useMemo(() => new Set(filteredFindings.map(findingGroupKey)), [filteredFindings]);
  const visibleGroups = useMemo(() => groups.filter((group) => visibleKeys.has(group.key)), [groups, visibleKeys]);
  const selectedGroup = groups.find((group) => group.key === selectedGroupKey) ?? null;
  const counts = useMemo(() => ({
    all: groupFindings(findings).length,
    pending: groupFindings(findings.filter((item) => item.verificationStatus === "PENDING")).length,
    verified: groupFindings(findings.filter((item) => ["CONFIRMED", "CORRECTED"].includes(item.verificationStatus))).length,
    priority: groupFindings(priorities.map((item) => findings.find((finding) => finding.id === item.findingId)).filter(Boolean)).length,
  }), [findings, priorities]);

  async function report(event) {
    event.preventDefault();
    if (!currentDisaster?.id) return;
    try {
      setSubmitting(true); setError("");
      const response = await createManualFinding({ disasterId: currentDisaster.id, type: form.type, severity: form.severity, title: form.title.trim(), description: form.description.trim() || undefined, latitude: Number(form.latitude), longitude: Number(form.longitude) });
      const created = response?.data?.finding;
      if (!created) throw new Error("Backend did not return created finding.");
      setForm(INITIAL_FORM); setShowReport(false); await load(); setSelectedId(created.id);
    } catch (err) { setError(err.message); } finally { setSubmitting(false); }
  }

  if (!currentDisaster) return <div className="theme-card rounded-xl p-10 text-center"><AlertTriangle className="mx-auto h-8 w-8 text-amber-500" /><h2 className="mt-3 font-bold">No disaster selected</h2><p className="mt-1 text-sm text-[var(--text-secondary)]">Select or create a disaster event before reviewing findings.</p></div>;

  return <div className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-widest text-orange-500">Detect → Review → Verify → Prioritize → Act</p><h1 className="mt-1 text-2xl font-black">Findings / Damage Assessment</h1><p className="mt-1 text-sm text-[var(--text-secondary)]">One operational record through detection, human decision, priority and traceable evidence.</p></div><div className="flex gap-2"><button type="button" onClick={() => void load()} className="flex items-center gap-2 rounded-lg border border-[var(--border-color)] px-3 py-2 text-xs font-bold"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh</button><button type="button" onClick={() => setShowReport(true)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white"><Plus className="h-4 w-4" />Responder Report</button></div></div>
    {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">{error}</div>}

    <div className="theme-card rounded-xl p-2"><div className="grid grid-cols-2 gap-2 lg:grid-cols-4">{tabs.map(([id, label]) => <button type="button" key={id} onClick={() => setActiveView(id)} className={`rounded-lg px-3 py-3 text-left transition-colors ${activeView === id ? "bg-orange-600 text-white" : "hover:bg-[var(--bg-card-hover)]"}`}><span className="block text-xs font-bold">{label}</span><span className={`mt-1 block text-[10px] ${activeView === id ? "text-orange-100" : "text-[var(--text-muted)]"}`}>{counts[id]} records</span></button>)}</div></div>

    <div className="theme-card flex flex-wrap items-center gap-3 rounded-xl p-3"><Filter className="h-4 w-4 text-[var(--text-muted)]" /><div className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search findings..." className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] py-2 pl-9 pr-3 text-sm" /></div><select value={severity} onChange={(e) => setSeverity(e.target.value)} className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] px-3 py-2 text-xs"><option value="ALL">All Severities</option><option value="CRITICAL">Critical</option><option value="SEVERE">Severe</option><option value="MODERATE">Moderate</option><option value="LOW">Low</option></select><select value={source} onChange={(e) => setSource(e.target.value)} className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] px-3 py-2 text-xs"><option value="ALL">All Sources</option><option value="AI">AI</option><option value="RESPONDER">Responder</option><option value="FUSION">Fusion</option></select></div>

    <div className="space-y-3">{visibleGroups.map((group) => group.findings.length === 1 ? <FindingRow key={group.key} finding={group.findings[0]} priority={priorityByFinding.get(group.findings[0].id)} rank={activeView === "priority" ? priorityByFinding.get(group.findings[0].id)?.rank : null} onReview={() => setSelectedId(group.findings[0].id)} /> : <GroupedFindingRow key={group.key} group={group} priorityByFinding={priorityByFinding} onReview={() => setSelectedGroupKey(group.key)} />)}{!loading && visibleGroups.length === 0 && <div className="theme-card rounded-xl py-14 text-center text-sm text-[var(--text-muted)]">No findings for this view</div>}</div>

    {selectedGroup && <GroupedAssessmentModal group={selectedGroup} priorityByFinding={priorityByFinding} onClose={() => setSelectedGroupKey(null)} onReviewFinding={(id) => { setSelectedGroupKey(null); setSelectedId(id); }} />}
    {selectedFinding && <FindingReviewDrawer finding={selectedFinding} priority={priorityByFinding.get(selectedFinding.id)} onClose={() => setSelectedId(null)} onOpenMap={() => { setSelectedId(null); setActiveTab?.("map"); }} onUpdated={async (updated) => { if (updated) { setFindings((items) => items.map((item) => item.id === updated.id ? updated : item)); } await load(); }} />}
    {showReport && <ReportModal form={form} setForm={setForm} submitting={submitting} onClose={() => setShowReport(false)} onSubmit={report} />}
  </div>;
}

function GroupedFindingRow({ group, priorityByFinding, onReview }) {
  const highestSeverity = group.findings.reduce((highest, finding) =>
    (severityRank[finding.severity] ?? 0) > (severityRank[highest] ?? 0) ? finding.severity : highest, "LOW");
  const priorities = group.findings.map((finding) => priorityByFinding.get(finding.id)).filter(Boolean);
  const highestPriority = priorities.sort((a, b) => (b.priorityScore ?? 0) - (a.priorityScore ?? 0))[0];
  const statuses = new Set(group.findings.map((finding) => finding.verificationStatus));
  const reviewState = statuses.has("PENDING") ? "PENDING" : statuses.size === 1 ? [...statuses][0] : "MIXED STATUS";
  return <article className="theme-card group rounded-xl p-4 hover:border-orange-500/50">
    <div className="grid items-center gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(130px,0.8fr)_minmax(130px,0.8fr)_minmax(130px,0.8fr)_auto]">
      <div className="min-w-0"><div className="flex items-center gap-2"><Bot className="h-4 w-4 text-cyan-500" /><span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">AI Assessment</span></div><h3 className="mt-2 font-bold">Flood Impact Assessment</h3><p className="mt-1 text-[10px] text-[var(--text-muted)]">{group.findings.length} detected impacts</p></div>
      <div><p className="text-[9px] font-bold uppercase text-[var(--text-muted)]">Detected Types</p><div className="mt-1 flex flex-wrap gap-1">{group.findings.map((finding) => <span key={finding.id} className="rounded border border-[var(--border-color)] px-1.5 py-0.5 text-[10px] font-semibold">{pretty(finding.type)}</span>)}</div></div>
      <Cell label="Highest Severity" value={highestSeverity} />
      <Cell label="Highest Priority" value={highestPriority ? `${highestPriority.priorityLevel} · ${highestPriority.priorityScore}` : "Not Assigned"} />
      <div className="flex items-center gap-3 lg:justify-end"><p className={`text-xs font-bold ${reviewState === "PENDING" ? "text-amber-500" : reviewState === "REJECTED" ? "text-red-500" : "text-emerald-500"}`}>{pretty(reviewState)}</p><button type="button" onClick={onReview} className="rounded-lg bg-orange-600 px-3 py-2 text-xs font-bold text-white">Review Assessment</button></div>
    </div>
  </article>;
}

function GroupedAssessmentModal({ group, priorityByFinding, onClose, onReviewFinding }) {
  return <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/60 p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <div className="theme-card max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl p-5">
      <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-widest text-orange-500">AI Assessment</p><h2 className="mt-1 text-xl font-black">Detected Findings</h2><p className="mt-1 text-xs text-[var(--text-secondary)]">{group.findings.length} independently reviewable impacts from one analysis run.</p></div><button type="button" onClick={onClose} className="rounded-lg border border-[var(--border-color)] p-2"><X className="h-4 w-4" /></button></div>
      <div className="mt-5 space-y-3">{group.findings.map((finding, index) => { const priority = priorityByFinding.get(finding.id); return <article key={finding.id} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] p-4"><div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0"><p className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Finding {index + 1}</p><h3 className="mt-1 font-bold">{finding.title || pretty(finding.type)}</h3><p className="mt-1 text-xs text-[var(--text-secondary)]">{finding.description}</p></div><button type="button" onClick={() => onReviewFinding(finding.id)} className="rounded-lg bg-orange-600 px-3 py-2 text-xs font-bold text-white">{finding.verificationStatus === "PENDING" ? "Review Finding" : "View Activity"}</button></div><div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5"><Cell label="Type" value={pretty(finding.type)} /><Cell label="Severity" value={finding.severity || "UNKNOWN"} /><Cell label="Confidence" value={finding.confidence == null ? "N/A" : `${Math.round(finding.confidence * 100)}%`} /><Cell label="Priority" value={priority ? `${priority.priorityLevel} · ${priority.priorityScore}` : "Not Assigned"} /><Cell label="Status" value={pretty(finding.verificationStatus)} /></div></article>; })}</div>
    </div>
  </div>;
}

function FindingRow({ finding, priority, rank, onReview }) {
  const ai = finding.source === "AI";
  const verified = ["CONFIRMED", "CORRECTED"].includes(finding.verificationStatus);
  return <article className="theme-card group rounded-xl p-4 hover:border-orange-500/50"><div className="grid items-center gap-4 lg:grid-cols-[minmax(0,2fr)_repeat(4,minmax(100px,0.7fr))_auto]">
    <div className="min-w-0"><div className="flex items-center gap-2">{ai ? <Bot className="h-4 w-4 text-cyan-500" /> : <UserRound className="h-4 w-4 text-blue-500" />}<span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{ai ? "AI Detected" : finding.source === "RESPONDER" ? "Responder Reported" : "Fusion Finding"}</span>{rank && <span className="rounded bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-500">#{rank}</span>}</div><h3 className="mt-2 truncate font-bold">{finding.title || pretty(finding.type)}</h3>{finding.location?.latitude != null && <p className="mt-1 flex items-center gap-1 text-[10px] text-[var(--text-muted)]"><MapPin className="h-3 w-3" />{Number(finding.location.latitude).toFixed(5)}, {Number(finding.location.longitude).toFixed(5)}</p>}</div>
    <Cell label="Type" value={pretty(finding.type)} /><Cell label="Severity" value={finding.severity || "UNKNOWN"} /><Cell label="Confidence" value={finding.confidence == null ? "N/A" : `${Math.round(finding.confidence * 100)}%`} /><Cell label="Priority" value={priority ? `${priority.priorityLevel} · ${priority.priorityScore}` : "Not Assigned"} />
    <div className="flex items-center gap-3 lg:justify-end"><div className="text-right"><p className={`text-xs font-bold ${verified ? "text-emerald-500" : finding.verificationStatus === "REJECTED" ? "text-red-500" : "text-amber-500"}`}>{verified ? "Human Verified" : pretty(finding.verificationStatus)}</p>{ai && !verified && finding.verificationStatus === "PENDING" && <p className="mt-1 text-[9px] text-[var(--text-muted)]">Human decision required</p>}</div><button type="button" onClick={onReview} className="rounded-lg bg-orange-600 px-3 py-2 text-xs font-bold text-white">{finding.verificationStatus === "PENDING" ? "Review Finding" : "View Activity"}</button></div>
  </div></article>;
}
function Cell({ label, value }) { return <div><p className="text-[9px] font-bold uppercase text-[var(--text-muted)]">{label}</p><p className="mt-1 text-xs font-semibold">{value}</p></div>; }

function ReportModal({ form, setForm, submitting, onClose, onSubmit }) {
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  return <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/60 p-4"><form onSubmit={onSubmit} className="theme-card w-full max-w-xl rounded-xl p-5"><div className="flex justify-between"><div><p className="text-[10px] font-bold uppercase text-blue-500">Human-origin evidence</p><h2 className="mt-1 text-lg font-black">Responder Report</h2></div><button type="button" onClick={onClose}><X className="h-5 w-5" /></button></div><div className="mt-5 grid grid-cols-2 gap-3"><select name="type" value={form.type} onChange={change} className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] p-2.5 text-sm"><option value="BUILDING_DAMAGE">Building Damage</option><option value="ROAD_BLOCKAGE">Road Blockage</option><option value="INFRASTRUCTURE_DAMAGE">Infrastructure Damage</option><option value="SERVICE_DISRUPTION">Service Disruption</option></select><select name="severity" value={form.severity} onChange={change} className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] p-2.5 text-sm"><option value="LOW">Low</option><option value="MODERATE">Moderate</option><option value="SEVERE">Severe</option><option value="CRITICAL">Critical</option></select><input required name="title" value={form.title} onChange={change} placeholder="Finding title" className="col-span-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] p-2.5 text-sm" /><textarea name="description" value={form.description} onChange={change} placeholder="Description" className="col-span-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] p-2.5 text-sm" /><input required type="number" step="any" name="latitude" value={form.latitude} onChange={change} placeholder="Latitude" className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] p-2.5 text-sm" /><input required type="number" step="any" name="longitude" value={form.longitude} onChange={change} placeholder="Longitude" className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] p-2.5 text-sm" /></div><button disabled={submitting} className="mt-4 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-bold text-white">{submitting ? "Reporting..." : "Report Finding"}</button></form></div>;
}
