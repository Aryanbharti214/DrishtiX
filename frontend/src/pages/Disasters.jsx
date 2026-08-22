import React, {
  useState,
} from "react";

import {
  Activity,
  CalendarDays,
  CheckCircle2,
  MapPin,
  Plus,
  RefreshCw,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";

import {
  useDisaster,
} from "../context/DisasterContext";

const INITIAL_FORM = {
  name: "",
  type: "FLOOD",
  regionName: "",
  startDate:
    new Date()
      .toISOString()
      .slice(0, 10),

  description: "",
  status: "ACTIVE",
};

export default function Disasters() {
  const {
    disasters,
    currentDisaster,
    loading,
    error,

    addDisaster,
    removeDisasters,
    selectDisaster,
    refreshDisasters,
  } = useDisaster();

  const [form, setForm] =
    useState(INITIAL_FORM);

  const [submitting, setSubmitting] =
    useState(false);

  const [successMessage,
    setSuccessMessage] =
    useState("");

  const [formError, setFormError] =
    useState("");

  const [manageMode, setManageMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function cancelManage() {
    setManageMode(false);
    setSelectedIds(new Set());
    setConfirmDelete(false);
  }

  function toggleSelected(id) {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleDeleteSelected() {
    try {
      setDeleting(true);
      setFormError("");
      await removeDisasters([...selectedIds]);
      setSuccessMessage(`${selectedIds.size} disaster event${selectedIds.size === 1 ? "" : "s"} deleted.`);
      cancelManage();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to delete disaster events");
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setFormError("");
      setSuccessMessage("");

      /*
       * Only send fields backend expects.
       */
      const payload = {
        name:
          form.name.trim(),

        type:
          form.type,

        regionName:
          form.regionName.trim()
            || undefined,

        startDate:
          form.startDate,

        description:
          form.description.trim()
            || undefined,

        status:
          form.status,
      };

      const createdDisaster =
        await addDisaster(
          payload
        );

      setSuccessMessage(
        `${createdDisaster.name} created and selected successfully.`
      );

      setForm(
        INITIAL_FORM
      );
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Failed to create disaster"
      );
    } finally {
      setSubmitting(false);
    }
  }

  function formatDate(value) {
    if (!value) {
      return "Unknown";
    }

    return new Intl.DateTimeFormat(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    ).format(
      new Date(value)
    );
  }

  return (
    <div className="space-y-6">

      {/* Page heading */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-orange-500" />

            <h2 className="text-xl font-extrabold tracking-wide text-[var(--text-primary)]">
              Disaster Event Management
            </h2>
          </div>

          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Create incidents and select
            the active operational event.
          </p>
        </div>

        <button
          type="button"
          onClick={
            refreshDisasters
          }
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] disabled:opacity-50"
        >
          <RefreshCw
            className={`w-4 h-4 ${
              loading
                ? "animate-spin"
                : ""
            }`}
          />

          Refresh
        </button>
      </div>

      {/* Current event */}
      <div className="theme-card rounded-xl border border-[var(--border-color)] p-5">
        <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-muted)]">
          Current Operational Event
        </p>

        {currentDisaster ? (
          <div className="mt-3 flex flex-wrap justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />

                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>

                <h3 className="font-bold text-lg text-[var(--text-primary)]">
                  {
                    currentDisaster.name
                  }
                </h3>
              </div>

              <div className="flex flex-wrap gap-4 mt-2 text-xs text-[var(--text-secondary)]">
                <span>
                  {
                    currentDisaster.type
                  }
                </span>

                <span>
                  {
                    currentDisaster.regionName
                    || "Region not specified"
                  }
                </span>

                <span>
                  {
                    currentDisaster.status
                  }
                </span>
              </div>
            </div>

            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
        ) : (
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            No disaster event selected.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* CREATE FORM */}
        <div className="theme-card rounded-xl border border-[var(--border-color)] p-6">
          <div className="flex items-center gap-2 mb-5">
            <Plus className="w-5 h-5 text-orange-500" />

            <h3 className="font-bold text-[var(--text-primary)]">
              Create Disaster Event
            </h3>
          </div>

          {successMessage && (
            <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-600 dark:text-emerald-400">
              {successMessage}
            </div>
          )}

          {(formError || error) && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
              <TriangleAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />

              <span>
                {
                  formError
                  || error
                }
              </span>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >

            {/* NAME */}
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">
                Event Name *
              </label>

              <input
                name="name"
                type="text"
                required
                minLength={3}
                maxLength={150}
                value={form.name}
                onChange={
                  handleChange
                }
                placeholder="e.g. Odisha Flood 2026"
                className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)] outline-none focus:border-orange-500"
              />
            </div>

            {/* TYPE */}
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">
                Disaster Type *
              </label>

              <select
                name="type"
                value={form.type}
                onChange={
                  handleChange
                }
                className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)] outline-none focus:border-orange-500"
              >
                <option value="FLOOD">
                  Flood
                </option>

                <option value="CYCLONE">
                  Cyclone
                </option>

                <option value="FIRE">
                  Fire
                </option>

                <option value="EARTHQUAKE">
                  Earthquake
                </option>
              </select>
            </div>

            {/* REGION */}
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">
                Region
              </label>

              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-[var(--text-muted)]" />

                <input
                  name="regionName"
                  type="text"
                  maxLength={255}
                  value={
                    form.regionName
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="e.g. Bhubaneswar Region"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)] outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* DATE */}
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">
                Start Date *
              </label>

              <div className="relative">
                <CalendarDays className="absolute left-3 top-3 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />

                <input
                  name="startDate"
                  type="date"
                  required
                  value={
                    form.startDate
                  }
                  onChange={
                    handleChange
                  }
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)] outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* STATUS */}
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">
                Status
              </label>

              <select
                name="status"
                value={
                  form.status
                }
                onChange={
                  handleChange
                }
                className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)] outline-none focus:border-orange-500"
              >
                <option value="ACTIVE">
                  Active
                </option>

                <option value="MONITORING">
                  Monitoring
                </option>

                <option value="CLOSED">
                  Closed
                </option>
              </select>
            </div>

            {/* DESCRIPTION */}
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">
                Description
              </label>

              <textarea
                name="description"
                rows={4}
                maxLength={5000}
                value={
                  form.description
                }
                onChange={
                  handleChange
                }
                placeholder="Brief description of the incident..."
                className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)] outline-none focus:border-orange-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={
                submitting
              }
              className="w-full py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold text-sm transition-colors"
            >
              {submitting
                ? "Creating Event..."
                : "Create Disaster Event"}
            </button>
          </form>
        </div>

        {/* EVENT LIST */}
        <div className="theme-card rounded-xl border border-[var(--border-color)] p-6">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
            <div>
              <h3 className="font-bold text-[var(--text-primary)]">
                Disaster Events
              </h3>

              <p className="text-xs text-[var(--text-secondary)] mt-1">
                {
                  disasters.length
                } event
                {
                  disasters.length !==
                  1
                    ? "s"
                    : ""
                }
              </p>
            </div>

            {!manageMode ? (
              <button type="button" onClick={() => setManageMode(true)} disabled={disasters.length === 0} className="rounded-lg border border-[var(--border-color)] px-3 py-2 text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] disabled:opacity-50">
                Manage
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => setSelectedIds(selectedIds.size === disasters.length ? new Set() : new Set(disasters.map((item) => item.id)))} className="rounded-lg border border-[var(--border-color)] px-3 py-2 text-xs font-bold">
                  {selectedIds.size === disasters.length ? "Clear All" : "Select All"}
                </button>
                <span className="text-xs text-[var(--text-secondary)]">{selectedIds.size} selected</span>
                <button type="button" onClick={() => setConfirmDelete(true)} disabled={selectedIds.size === 0} className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 className="h-3.5 w-3.5" />Delete Selected</button>
                <button type="button" onClick={cancelManage} className="rounded-lg border border-[var(--border-color)] px-3 py-2 text-xs font-bold">Cancel</button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm text-[var(--text-secondary)]">
              Loading disasters...
            </div>
          ) : disasters.length === 0 ? (
            <div className="py-12 text-center">
              <Activity className="w-8 h-8 mx-auto text-[var(--text-muted)] mb-3" />

              <p className="text-sm text-[var(--text-secondary)]">
                No disaster events yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[650px] overflow-y-auto pr-1">
              {disasters.map(
                (disaster) => {
                  const selected =
                    currentDisaster?.id ===
                    disaster.id;

                  return (
                    <div
                      role="button"
                      tabIndex={0}
                      key={
                        disaster.id
                      }
                      onClick={() => manageMode ? toggleSelected(disaster.id) : selectDisaster(disaster)}
                      onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); manageMode ? toggleSelected(disaster.id) : selectDisaster(disaster); } }}
                      className={`relative w-full cursor-pointer text-left rounded-xl border p-4 transition-all ${
                        manageMode && selectedIds.has(disaster.id)
                          ? "border-red-500 bg-red-500/10"
                          :
                        selected
                          ? "border-orange-500 bg-orange-500/10"
                          : "border-[var(--border-color)] bg-[var(--bg-main)] hover:bg-[var(--bg-card-hover)]"
                      }`}
                    >
                      {manageMode && <input type="checkbox" checked={selectedIds.has(disaster.id)} onChange={() => toggleSelected(disaster.id)} onClick={(event) => event.stopPropagation()} aria-label={`Select ${disaster.name}`} className="absolute right-3 top-3 h-4 w-4 accent-red-600" />}
                      <div className="flex justify-between gap-3">

                        <div className="min-w-0">

                          <div className="flex flex-wrap items-center gap-2">

                            <h4 className="font-bold text-sm text-[var(--text-primary)] truncate">
                              {
                                disaster.name
                              }
                            </h4>

                            {selected && (
                              <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-orange-600 text-white">
                                Selected
                              </span>
                            )}

                          </div>

                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-[var(--text-secondary)]">

                            <span>
                              {
                                disaster.type
                              }
                            </span>

                            <span>
                              {
                                disaster.regionName
                                || "No region"
                              }
                            </span>

                          </div>

                          <p className="text-[11px] text-[var(--text-muted)] mt-2">
                            Started{" "}
                            {
                              formatDate(
                                disaster.startDate
                              )
                            }
                          </p>

                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-1 h-fit rounded ${manageMode ? "mr-7" : ""} ${
                            disaster.status ===
                            "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : disaster.status ===
                                "MONITORING"
                              ? "bg-amber-500/10 text-amber-500"
                              : "bg-slate-500/10 text-slate-500"
                          }`}
                        >
                          {
                            disaster.status
                          }
                        </span>

                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center bg-black/70 p-4" onMouseDown={(event) => event.target === event.currentTarget && !deleting && setConfirmDelete(false)}>
          <div className="theme-card w-full max-w-lg rounded-2xl border border-red-500/35 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-red-500">Destructive action</p><h3 className="mt-2 text-xl font-black">Delete {selectedIds.size} disaster event{selectedIds.size === 1 ? "" : "s"}?</h3></div><button type="button" disabled={deleting} onClick={() => setConfirmDelete(false)} className="rounded-lg border border-[var(--border-color)] p-2"><X className="h-4 w-4" /></button></div>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">This action cannot be undone. Related imagery, AI runs, findings, evidence relationships, and fusion records will also be removed.</p>
            <div className="mt-4 max-h-36 space-y-1 overflow-y-auto rounded-lg bg-[var(--bg-main)] p-3 text-xs text-[var(--text-secondary)]">{disasters.filter((item) => selectedIds.has(item.id)).map((item) => <p key={item.id}>{item.name}</p>)}</div>
            <div className="mt-6 flex justify-end gap-2"><button type="button" disabled={deleting} onClick={() => setConfirmDelete(false)} className="rounded-lg border border-[var(--border-color)] px-4 py-2 text-sm font-bold">Cancel</button><button type="button" disabled={deleting} onClick={handleDeleteSelected} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50">{deleting ? "Deleting..." : "Delete Selected"}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
