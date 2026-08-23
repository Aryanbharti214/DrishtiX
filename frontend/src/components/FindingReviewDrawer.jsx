import React, { useEffect, useMemo, useState } from "react";
import { Bot, Check, Clock3, Edit3, FileCheck2, Image, MapPin, UserRound, X } from "lucide-react";
import { getAssetUrl, getAuthUser, getFindingVerificationHistory, getImageryById, verifyFinding } from "../services/api";

const EMPTY_CORRECTION = { type: "ROAD_BLOCKAGE", severity: "MODERATE", title: "", description: "", latitude: "", longitude: "" };
const pretty = (value) => value?.replaceAll("_", " ") ?? "UNKNOWN";
const date = (value) => value ? new Date(value).toLocaleString("en-IN") : "";

export default function FindingReviewDrawer({ finding, priority, onClose, onUpdated, onOpenMap }) {
  const [history, setHistory] = useState([]);
  const [imagery, setImagery] = useState(null);
  const [mode, setMode] = useState(null);
  const [reason, setReason] = useState("");
  const [reviewerLabel, setReviewerLabel] = useState(() => getAuthUser()?.agencyId || "NDRF-2026");
  const [correction, setCorrection] = useState(EMPTY_CORRECTION);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!finding) return;
    setMode(null); setReason(""); setError("");
    setCorrection({ type: finding.type || "ROAD_BLOCKAGE", severity: finding.severity || "MODERATE", title: finding.title || "", description: finding.description || "", latitude: finding.location?.latitude ?? "", longitude: finding.location?.longitude ?? "" });
    Promise.all([
      getFindingVerificationHistory(finding.id).then((r) => r?.data?.history ?? []),
      finding.imageryId ? getImageryById(finding.imageryId).then((r) => r?.data?.imagery ?? null) : Promise.resolve(null),
    ]).then(([events, image]) => { setHistory(events); setImagery(image); }).catch((err) => setError(err.message));
  }, [finding]);

  const timeline = useMemo(() => {
    if (!finding) return [];
    const events = [];
    if (imagery) {
      events.push({ id: `upload-${imagery.id}`, label: "Image Uploaded", detail: `${imagery.originalFilename} · ${pretty(imagery.sourceType)}`, at: imagery.createdAt, icon: Image });
      if (imagery.processingStatus === "ANALYZED") events.push({ id: `analysis-${imagery.id}`, label: "AI Analysis Completed", detail: "Imagery processing status: ANALYZED", at: imagery.updatedAt, icon: Bot });
    }
    events.push({ id: `finding-${finding.id}`, label: finding.source === "AI" ? "Damage Detected / Finding Created" : "Responder Finding Created", detail: `${pretty(finding.type)}${finding.confidence != null ? ` · ${Math.round(finding.confidence * 100)}% confidence` : ""}`, at: finding.createdAt, icon: finding.source === "AI" ? Bot : UserRound });
    history.forEach((event) => events.push({ id: event.id, label: "Human Verification Completed", detail: `${pretty(event.decision)}${event.reviewerLabel ? ` · ${event.reviewerLabel}` : ""}${event.reason ? ` · ${event.reason}` : ""}`, at: event.createdAt, icon: FileCheck2 }));
    return events.filter((event) => event.at).sort((a, b) => new Date(a.at) - new Date(b.at));
  }, [finding, history, imagery]);

  if (!finding) return null;
  const canReview = finding.verificationStatus === "PENDING";

  async function submit(decision) {
    if (["REJECTED", "CORRECTED"].includes(decision) && reason.trim().length < 3) { setError(decision === "REJECTED" ? "A reason is required when rejecting a finding." : "Explain why the finding is being corrected."); return; }
    try {
      setLoading(true); setError("");
      const payload = { decision, reviewerLabel: reviewerLabel.trim() || undefined, reason: reason.trim() || undefined };
      if (decision === "CORRECTED") payload.corrected = {
        type: correction.type, severity: correction.severity, title: correction.title.trim() || undefined,
        description: correction.description.trim() || undefined,
        latitude: correction.latitude === "" ? undefined : Number(correction.latitude), longitude: correction.longitude === "" ? undefined : Number(correction.longitude),
      };
      const response = await verifyFinding(finding.id, payload);
      onUpdated?.(response?.data?.finding);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }

  return <div className="fixed inset-0 z-[5000] flex justify-end bg-black/55" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <aside className="h-full w-full max-w-2xl overflow-y-auto border-l border-[var(--border-color)] bg-[var(--bg-main)] shadow-2xl">
      <div className="sticky top-0 z-10 flex items-start justify-between border-b border-[var(--border-color)] bg-[var(--bg-card)] p-5">
        <div><p className="text-[10px] font-bold uppercase tracking-widest text-orange-500">Finding lifecycle</p><h2 className="mt-1 text-xl font-black">{finding.title || pretty(finding.type)}</h2></div>
        <button type="button" onClick={onClose} className="rounded-lg border border-[var(--border-color)] p-2"><X className="h-4 w-4" /></button>
      </div>
      <div className="space-y-5 p-5">
        {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">{error}</div>}
        <section className="theme-card rounded-xl p-5">
          <div className="flex flex-wrap items-center gap-2"><Badge>{finding.source}</Badge><Badge>{pretty(finding.type)}</Badge><Badge>{finding.severity || "UNKNOWN"}</Badge><Badge>{pretty(finding.verificationStatus)}</Badge></div>
          <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">{finding.description || "No description provided."}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4"><Metric label="Confidence" value={finding.confidence == null ? "N/A" : `${Math.round(finding.confidence * 100)}%`} /><Metric label="Priority" value={priority ? `${priority.priorityLevel} · ${priority.priorityScore}` : "Not Assigned"} /><Metric label="Source" value={finding.source} /><Metric label="Status" value={pretty(finding.verificationStatus)} /></div>
          {finding.location?.latitude != null && <button type="button" onClick={onOpenMap} className="mt-4 flex items-center gap-2 text-xs font-semibold text-blue-500"><MapPin className="h-4 w-4" />{Number(finding.location.latitude).toFixed(5)}, {Number(finding.location.longitude).toFixed(5)} · Inspect on map</button>}
          {imagery && <div className="mt-5 overflow-hidden rounded-xl border border-[var(--border-color)]"><img src={getAssetUrl(imagery.imageUrl)} alt={imagery.originalFilename} className="max-h-60 w-full bg-slate-950 object-contain" /><div className="p-3 text-xs text-[var(--text-secondary)]">Supporting imagery: {imagery.originalFilename}</div></div>}
        </section>

        {canReview && <section className="theme-card rounded-xl p-5"><h3 className="font-bold">Human decision</h3><p className="mt-1 text-xs text-[var(--text-secondary)]">Review requires a deliberate decision. Existing backend verification rules are used.</p>
          <div className="mt-4 grid grid-cols-3 gap-2"><Decision icon={Check} label="Confirm" tone="confirm" onClick={() => setMode("CONFIRMED")} active={mode === "CONFIRMED"} /><Decision icon={Edit3} label="Correct" tone="correct" onClick={() => setMode("CORRECTED")} active={mode === "CORRECTED"} /><Decision icon={X} label="Reject" tone="reject" onClick={() => setMode("REJECTED")} active={mode === "REJECTED"} /></div>
          {mode && <div className="mt-4 space-y-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] p-4">
            <input value={reviewerLabel} onChange={(e) => setReviewerLabel(e.target.value)} placeholder="Reviewer label (optional)" className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-sm" />
            {mode === "CORRECTED" && <div className="grid grid-cols-2 gap-2"><select value={correction.type} onChange={(e) => setCorrection((v) => ({ ...v, type: e.target.value }))} className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-sm"><option value="BUILDING_DAMAGE">Building Damage</option><option value="ROAD_BLOCKAGE">Road Blockage</option><option value="INFRASTRUCTURE_DAMAGE">Infrastructure Damage</option><option value="SERVICE_DISRUPTION">Service Disruption</option></select><select value={correction.severity} onChange={(e) => setCorrection((v) => ({ ...v, severity: e.target.value }))} className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-sm"><option value="LOW">Low</option><option value="MODERATE">Moderate</option><option value="SEVERE">Severe</option><option value="CRITICAL">Critical</option></select><input value={correction.title} onChange={(e) => setCorrection((v) => ({ ...v, title: e.target.value }))} placeholder="Corrected title" className="col-span-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-sm" /><textarea value={correction.description} onChange={(e) => setCorrection((v) => ({ ...v, description: e.target.value }))} placeholder="Corrected description" className="col-span-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-sm" /><input type="number" step="any" value={correction.latitude} onChange={(e) => setCorrection((v) => ({ ...v, latitude: e.target.value }))} placeholder="Latitude" className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-sm" /><input type="number" step="any" value={correction.longitude} onChange={(e) => setCorrection((v) => ({ ...v, longitude: e.target.value }))} placeholder="Longitude" className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-sm" /></div>}
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder={mode === "REJECTED" ? "Reason required" : "Responder note (optional)"} className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-sm" />
            <button type="button" disabled={loading} onClick={() => submit(mode)} className="w-full rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{loading ? "Saving decision..." : `${pretty(mode)} finding`}</button>
          </div>}
        </section>}

        <section className="theme-card rounded-xl p-5"><div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-cyan-500" /><h3 className="font-bold">Activity / Evidence Timeline</h3></div>
          <div className="mt-5 space-y-0">{timeline.map((event, index) => { const Icon = event.icon; return <div key={event.id} className="relative flex gap-3 pb-5"><div className="relative z-10 rounded-full border border-blue-500/30 bg-blue-500/10 p-2 text-blue-500"><Icon className="h-4 w-4" /></div>{index < timeline.length - 1 && <span className="absolute bottom-0 left-[17px] top-8 w-px bg-[var(--border-color)]" />}<div><p className="text-sm font-bold">{event.label}</p><p className="mt-1 text-xs text-[var(--text-secondary)]">{event.detail}</p><p className="mt-1 text-[10px] text-[var(--text-muted)]">{date(event.at)}</p></div></div>; })}</div>
          {priority && <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-3 text-xs"><strong>Current calculated priority:</strong> {priority.priorityLevel} · {priority.priorityScore}/100. This is a live calculation; the current data model does not store priority-history timestamps.</div>}
        </section>
      </div>
    </aside>
  </div>;
}

function Badge({ children }) { return <span className="rounded-md border border-[var(--border-color)] bg-[var(--bg-main)] px-2 py-1 text-[10px] font-bold">{children}</span>; }
function Metric({ label, value }) { return <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] p-3"><p className="text-[9px] uppercase text-[var(--text-muted)]">{label}</p><p className="mt-1 text-xs font-bold">{value}</p></div>; }
function Decision({ icon: Icon, label, tone, onClick, active }) { return <button type="button" onClick={onClick} className={`human-decision human-decision-${tone} ${active ? "is-active" : ""} rounded-lg border p-3 text-xs font-bold`}><Icon className="mx-auto mb-1 h-4 w-4" />{label}</button>; }
