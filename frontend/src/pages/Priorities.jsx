import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  MapPin,
  RefreshCw,
  ShieldAlert,
  Target,
} from "lucide-react";

import {
  getDisasterPriorities,
} from "../services/api";

import {
  useDisaster,
} from "../context/DisasterContext";


function pretty(
  value
) {
  return (
    value
      ?.replaceAll(
        "_",
        " "
      ) ??
    "UNKNOWN"
  );
}


function priorityStyle(
  level
) {

  switch (level) {

    case "CRITICAL":
      return {
        badge:
          "border-red-500/30 bg-red-500/10 text-red-500",

        score:
          "text-red-500",
      };


    case "HIGH":
      return {
        badge:
          "border-orange-500/30 bg-orange-500/10 text-orange-500",

        score:
          "text-orange-500",
      };


    case "MEDIUM":
      return {
        badge:
          "border-amber-500/30 bg-amber-500/10 text-amber-500",

        score:
          "text-amber-500",
      };


    default:
      return {
        badge:
          "border-sky-500/30 bg-sky-500/10 text-sky-500",

        score:
          "text-sky-500",
      };
  }
}


export default function Priorities({
  setActiveTab,
}) {

  const {
    currentDisaster,
  } = useDisaster();


  const [
    priorities,
    setPriorities,
  ] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  const loadPriorities =
    useCallback(
      async () => {

        if (
          !currentDisaster?.id
        ) {

          setPriorities(
            []
          );

          return;
        }


        try {

          setLoading(
            true
          );


          setError(
            ""
          );


          const response =
            await getDisasterPriorities(
              currentDisaster.id
            );


          setPriorities(
            response?.data
              ?.priorities ??
            []
          );

        } catch (err) {

          setPriorities(
            []
          );


          setError(
            err instanceof Error
              ? err.message
              : "Failed to load operational priorities"
          );

        } finally {

          setLoading(
            false
          );

        }

      },
      [
        currentDisaster?.id,
      ]
    );


  useEffect(() => {
    void loadPriorities();
  }, [
    loadPriorities,
  ]);


  const summary =
    useMemo(
      () => ({
        total:
          priorities.length,

        critical:
          priorities.filter(
            (item) =>
              item.priorityLevel ===
              "CRITICAL"
          ).length,

        high:
          priorities.filter(
            (item) =>
              item.priorityLevel ===
              "HIGH"
          ).length,

        pending:
          priorities.filter(
            (item) =>
              item.verificationStatus ===
              "PENDING"
          ).length,
      }),
      [
        priorities,
      ]
    );


  if (
    !currentDisaster
  ) {

    return (
      <div className="theme-card border border-[var(--border-color)] rounded-xl p-8 text-center">

        <AlertTriangle className="w-8 h-8 text-orange-500 mx-auto mb-3" />

        <p className="font-bold text-[var(--text-primary)]">
          Select a disaster first
        </p>

      </div>
    );
  }


  return (
    <div className="space-y-6">

      <div className="flex flex-wrap justify-between items-start gap-4">

        <div>

          <div className="flex items-center gap-2">

            <Target className="w-5 h-5 text-orange-500" />

            <h2 className="text-xl font-extrabold text-[var(--text-primary)]">
              Operational Inspection Priorities
            </h2>

          </div>


          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Explainable ranking for human review. Scores do not automatically dispatch resources.
          </p>

        </div>


        <button
          type="button"
          onClick={
            () =>
              void loadPriorities()
          }
          disabled={
            loading
          }
          className="px-4 py-2 rounded-lg border border-[var(--border-color)] text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
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


      {
        error &&
        (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 p-3 text-sm">
            {
              error
            }
          </div>
        )
      }


      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

        <Summary
          label="Active Queue"
          value={
            summary.total
          }
        />

        <Summary
          label="Critical"
          value={
            summary.critical
          }
        />

        <Summary
          label="High"
          value={
            summary.high
          }
        />

        <Summary
          label="Pending Verification"
          value={
            summary.pending
          }
        />

      </div>


      <div className="space-y-3">

        {
          priorities.map(
            (priority) => {

              const style =
                priorityStyle(
                  priority.priorityLevel
                );


              return (
                <div
                  key={
                    priority.findingId
                  }
                  className="theme-card rounded-xl border border-[var(--border-color)] p-5"
                >

                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">

                    <div className="flex gap-4">

                      <div className="text-2xl font-black text-[var(--text-muted)] w-10">
                        #
                        {
                          priority.rank
                        }
                      </div>


                      <div>

                        <div className="flex flex-wrap items-center gap-2">

                          <span
                            className={`text-[10px] font-bold px-2 py-1 rounded border ${style.badge}`}
                          >
                            {
                              priority.priorityLevel
                            }
                          </span>


                          <span className="text-[10px] border border-[var(--border-color)] rounded px-2 py-1">
                            {
                              pretty(
                                priority.type
                              )
                            }
                          </span>


                          <span className="text-[10px] border border-[var(--border-color)] rounded px-2 py-1">
                            {
                              priority.source
                            }
                          </span>

                        </div>


                        <h3 className="font-bold text-[var(--text-primary)] mt-3">
                          {
                            priority.title ??
                            pretty(
                              priority.type
                            )
                          }
                        </h3>


                        <div className="flex flex-wrap gap-4 text-xs text-[var(--text-secondary)] mt-2">

                          <span>
                            Severity:{" "}
                            <strong>
                              {
                                priority.severity
                              }
                            </strong>
                          </span>


                          <span>
                            Verification:{" "}
                            <strong>
                              {
                                priority.verificationStatus
                              }
                            </strong>
                          </span>


                          {
                            priority.location
                              ?.latitude !==
                              null &&
                            (
                              <span className="flex items-center gap-1">

                                <MapPin className="w-3 h-3" />

                                {
                                  Number(
                                    priority.location.latitude
                                  ).toFixed(4)
                                }

                                ,

                                {
                                  Number(
                                    priority.location.longitude
                                  ).toFixed(4)
                                }

                              </span>
                            )
                          }

                        </div>

                      </div>

                    </div>


                    <div className="text-right shrink-0">

                      <p className="text-[10px] uppercase tracking-wide text-[var(--text-secondary)]">
                        Priority Score
                      </p>


                      <p
                        className={`text-3xl font-black ${style.score}`}
                      >
                        {
                          priority.priorityScore
                        }

                        <span className="text-xs text-[var(--text-muted)]">
                          /100
                        </span>

                      </p>

                    </div>

                  </div>


                  <div className="mt-5 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-2">

                    {
                      Object.entries(
                        priority.components
                      ).map(
                        ([
                          key,
                          value,
                        ]) => (
                          <div
                            key={
                              key
                            }
                            className="rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] p-2"
                          >

                            <p className="text-[9px] uppercase text-[var(--text-muted)]">
                              {
                                pretty(
                                  key
                                )
                              }
                            </p>


                            <p className="font-bold text-sm text-[var(--text-primary)] mt-1">
                              +
                              {
                                value
                              }
                            </p>

                          </div>
                        )
                      )
                    }

                  </div>


                  <div className="mt-4 rounded-lg border border-[var(--border-color)] p-3">

                    <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] mb-2">
                      Why this rank?
                    </p>


                    <div className="space-y-1.5">

                      {
                        priority.reasons.map(
                          (
                            reason,
                            index
                          ) => (
                            <div
                              key={
                                `${priority.findingId}-${index}`
                              }
                              className="flex items-start gap-2 text-xs text-[var(--text-secondary)]"
                            >

                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />

                              {
                                reason
                              }

                            </div>
                          )
                        )
                      }

                    </div>

                  </div>


                  {
                    priority.cluster &&
                    (
                      <div className="mt-3 text-xs text-[var(--text-secondary)]">

                        Evidence cluster:{" "}

                        <strong>
                          {
                            priority.cluster.state
                          }
                        </strong>

                        {" · "}

                        {
                          priority.cluster.activeEvidenceCount
                        } active observations

                        {" · "}

                        {
                          priority.cluster.verifiedCount
                        } verified

                      </div>
                    )
                  }


                  <button
                    type="button"
                    onClick={
                      () =>
                        setActiveTab?.(
                          "map"
                        )
                    }
                    className="mt-4 w-full md:w-auto px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold flex items-center justify-center gap-2"
                  >

                    <ShieldAlert className="w-4 h-4" />

                    Inspect on Intelligence Map

                  </button>

                </div>
              );
            }
          )
        }

      </div>


      {
        !loading &&
        priorities.length ===
          0 &&
        (
          <div className="theme-card rounded-xl border border-dashed border-[var(--border-color)] p-10 text-center">

            <Clock3 className="w-8 h-8 mx-auto text-[var(--text-muted)]" />

            <p className="font-bold text-[var(--text-primary)] mt-3">
              No active inspection priorities
            </p>

          </div>
        )
      }

    </div>
  );
}


function Summary({
  label,
  value,
}) {
  return (
    <div className="theme-card rounded-xl border border-[var(--border-color)] p-4">

      <p className="text-[9px] uppercase font-bold tracking-wide text-[var(--text-muted)]">
        {label}
      </p>

      <p className="text-2xl font-black text-[var(--text-primary)] mt-2">
        {value}
      </p>

    </div>
  );
}