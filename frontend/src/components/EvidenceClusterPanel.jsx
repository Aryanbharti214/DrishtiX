import React, {
  useMemo,
} from "react";

import {
  AlertTriangle,
  CheckCircle2,
  Layers3,
  Link2,
  MapPin,
  ShieldCheck,
  UserRound,
  X,
  GitMerge
} from "lucide-react";


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


function clusterMeta(
  state
) {
  switch (state) {

    case "DISPUTED":
      return {
        label:
          "Disputed Evidence",

        icon:
          AlertTriangle,

        className:
          "border-red-500/30 bg-red-500/10 text-red-500",
      };


    case "CORROBORATED":
      return {
        label:
          "Corroborated Evidence",

        icon:
          CheckCircle2,

        className:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
      };


    case "RELATED":
      return {
        label:
          "Related Evidence",

        icon:
          Link2,

        className:
          "border-sky-500/30 bg-sky-500/10 text-sky-500",
      };


    default:
      return {
        label:
          "Isolated Evidence",

        icon:
          MapPin,

        className:
          "border-slate-500/30 bg-slate-500/10 text-slate-500",
      };
  }
}


function Metric({
  label,
  value,
}) {
  return (
    <div className="rounded-lg border border-[var(--border-color)] p-3">

      <p className="text-[10px] uppercase tracking-wide text-[var(--text-secondary)]">
        {label}
      </p>


      <p className="text-xl font-extrabold text-[var(--text-primary)] mt-1">
        {value}
      </p>

    </div>
  );
}


export default function EvidenceClusterPanel({
  cluster,
  onClose,
  onOpenFinding,
  onGenerateFusion,
  fusionLoading,
  fusionError,
}) {

  const meta =
    clusterMeta(
      cluster.state
    );


  const StateIcon =
    meta.icon;


  const activeMembers =
    useMemo(
      () =>
        cluster.members.filter(
          (member) =>
            member.verificationStatus !==
            "REJECTED"
        ),
      [
        cluster.members,
      ]
    );


  const rejectedMembers =
    useMemo(
      () =>
        cluster.members.filter(
          (member) =>
            member.verificationStatus ===
            "REJECTED"
        ),
      [
        cluster.members,
      ]
    );


  return (
    <div
      className="
        fixed
        right-4
        bottom-4
        z-[1300]
        w-[calc(100vw-2rem)]
        sm:w-[460px]
        max-h-[80vh]
        overflow-y-auto
        rounded-xl
        border
        border-[var(--border-color)]
        bg-[var(--bg-primary)]
        shadow-2xl
      "
    >

      {/* HEADER */}

      <div className="sticky top-0 z-10 border-b border-[var(--border-color)] bg-[var(--bg-primary)] p-4">

        <div className="flex items-start justify-between gap-4">

          <div>

            <div className="flex items-center gap-2">

              <Layers3 className="w-5 h-5 text-orange-500" />


              <h3 className="font-extrabold text-[var(--text-primary)]">
                Evidence Cluster
              </h3>

            </div>


            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Connected observations within the selected disaster
            </p>

          </div>


          <button
            type="button"
            onClick={
              onClose
            }
            className="p-2 rounded-lg hover:bg-black/5"
          >
            <X className="w-4 h-4" />
          </button>

        </div>

      </div>


      <div className="p-4 space-y-5">

        {/* STATE */}

        <div
          className={`rounded-xl border p-4 ${meta.className}`}
        >

          <div className="flex items-center gap-2">

            <StateIcon className="w-5 h-5" />


            <p className="font-extrabold">
              {
                meta.label
              }
            </p>

          </div>


          <p className="text-xs mt-2 opacity-90">

            {
              cluster.state ===
              "DISPUTED"
                ? "The cluster contains contradictory verified and rejected evidence requiring human review."
                : cluster.state ===
                    "CORROBORATED"
                  ? "Multiple observations provide spatially corroborating evidence."
                  : cluster.state ===
                      "RELATED"
                    ? "Nearby observations appear operationally related but do not represent the same verified claim."
                    : "This observation currently has no qualifying evidence relationships."
            }

          </p>

        </div>


        {/* METRICS */}

        <div className="grid grid-cols-2 gap-3">

          <Metric
            label="Members"
            value={
              cluster.memberCount
            }
          />


          <Metric
            label="Active Evidence"
            value={
              cluster.activeEvidenceCount
            }
          />


          <Metric
            label="Verified"
            value={
              cluster.verifiedCount
            }
          />


          <Metric
            label="Pending"
            value={
              cluster.pendingCount
            }
          />

        </div>


        

        <div className="rounded-xl border border-[var(--border-color)] p-4 space-y-3">

          <div>

            <p className="text-xs text-[var(--text-secondary)]">
              Highest active severity
            </p>


            <p className="font-bold text-[var(--text-primary)] mt-1">
              {
                cluster.highestSeverity ??
                "NONE"
              }
            </p>

          </div>


          <div>

            <p className="text-xs text-[var(--text-secondary)]">
              Evidence types
            </p>


            <div className="flex flex-wrap gap-2 mt-2">

              {
                cluster.findingTypes
                  .map(
                    (type) => (
                      <span
                        key={
                          type
                        }
                        className="text-xs px-2 py-1 rounded-md border border-[var(--border-color)]"
                      >
                        {
                          pretty(
                            type
                          )
                        }
                      </span>
                    )
                  )
              }

            </div>

          </div>


          <div>

            <p className="text-xs text-[var(--text-secondary)]">
              Active source types
            </p>


            <div className="flex flex-wrap gap-2 mt-2">

              {
                cluster.sources
                  .map(
                    (source) => (
                      <span
                        key={
                          source
                        }
                        className="text-xs px-2 py-1 rounded-md border border-[var(--border-color)]"
                      >
                        {
                          source
                        }
                      </span>
                    )
                  )
              }

            </div>

          </div>

        </div>


        

        <div>

          <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)] mb-3">
            Relationship Structure
          </p>


          <div className="grid grid-cols-2 gap-3">

            <Metric
              label="Corroborates"
              value={
                cluster
                  .relationCounts
                  .corroborates
              }
            />


            <Metric
              label="Related"
              value={
                cluster
                  .relationCounts
                  .related
              }
            />


            <Metric
              label="Duplicates"
              value={
                cluster
                  .relationCounts
                  .possibleDuplicates
              }
            />


            <Metric
              label="Disputed"
              value={
                cluster
                  .relationCounts
                  .disputed
              }
            />

          </div>

        </div>


        

        <div>

          <div className="flex items-center gap-2 mb-3">

            <ShieldCheck className="w-4 h-4 text-emerald-500" />


            <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]">
              Active Evidence
            </p>

          </div>


          <div className="space-y-3">

            {
              activeMembers.map(
                (member) => (

                  <button
                    key={
                      member.id
                    }
                    type="button"
                    onClick={
                      () =>
                        onOpenFinding(
                          member
                        )
                    }
                    className="
                      w-full
                      text-left
                      rounded-xl
                      border
                      border-[var(--border-color)]
                      p-4
                      hover:bg-[var(--bg-card-hover)]
                      transition-colors
                    "
                  >

                    <div className="flex items-start justify-between gap-3">

                      <div>

                        <p className="font-bold text-sm text-[var(--text-primary)]">
                          {
                            member.title ??
                            pretty(
                              member.type
                            )
                          }
                        </p>


                        <p className="text-xs text-[var(--text-secondary)] mt-1">
                          {
                            pretty(
                              member.type
                            )
                          }
                        </p>

                      </div>


                      <span className="text-[10px] border border-[var(--border-color)] rounded px-2 py-1">
                        {
                          member.verificationStatus
                        }
                      </span>

                    </div>


                    <div className="flex flex-wrap gap-2 mt-3">

                      <span className="text-[10px] px-2 py-1 rounded border border-[var(--border-color)] flex items-center gap-1">

                        <UserRound className="w-3 h-3" />

                        {
                          member.source
                        }

                      </span>


                      {
                        member.severity &&
                        (
                          <span className="text-[10px] px-2 py-1 rounded border border-[var(--border-color)]">
                            {
                              member.severity
                            }
                          </span>
                        )
                      }

                    </div>

                  </button>

                )
              )
            }

          </div>

        </div>


        

        {
          rejectedMembers.length >
            0 &&
          (
            <div>

              <div className="flex items-center gap-2 mb-3">

                <AlertTriangle className="w-4 h-4 text-red-500" />


                <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]">
                  Rejected Evidence Context
                </p>

              </div>


              <p className="text-xs text-[var(--text-secondary)] mb-3">
                These observations remain visible for audit context but do not count as active supporting evidence.
              </p>


              <div className="space-y-2">

                {
                  rejectedMembers.map(
                    (member) => (

                      <button
                        key={
                          member.id
                        }
                        type="button"
                        onClick={
                          () =>
                            onOpenFinding(
                              member
                            )
                        }
                        className="w-full text-left rounded-lg border border-red-500/20 bg-red-500/5 p-3"
                      >

                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          {
                            member.title ??
                            pretty(
                              member.type
                            )
                          }
                        </p>


                        <p className="text-xs text-red-500 mt-1">
                          REJECTED
                        </p>

                      </button>

                    )
                  )
                }

              </div>

            </div>
          )
        }

{/* FUSION */}

<div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4">

  <div className="flex items-start gap-3">

    <GitMerge className="w-5 h-5 text-cyan-500 mt-0.5" />


    <div className="flex-1">

      <p className="font-bold text-sm text-[var(--text-primary)]">
        Fusion Recommendation
      </p>


      <p className="text-xs text-[var(--text-secondary)] mt-1">

        {
          cluster.state ===
          "CORROBORATED"
            ? "This evidence cluster is eligible for a human-reviewed fusion recommendation."
            : cluster.state ===
              "DISPUTED"
              ? "Resolve disputed evidence before generating a fusion recommendation."
              : "Fusion requires corroborated evidence."
        }

      </p>

    </div>

  </div>


  {
    fusionError &&
    (
      <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-500">
        {
          fusionError
        }
      </div>
    )
  }


  <button
    type="button"
    disabled={
      cluster.state !==
        "CORROBORATED" ||
      fusionLoading
    }
    onClick={
      onGenerateFusion
    }
    className="
      mt-4
      w-full
      px-4
      py-2.5
      rounded-lg
      bg-cyan-600
      hover:bg-cyan-700
      disabled:opacity-40
      disabled:cursor-not-allowed
      text-white
      font-bold
      text-sm
    "
  >

    {
      fusionLoading
        ? "Generating..."
        : "Generate Fusion Recommendation"
    }

  </button>

</div>
        

        <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-3">

          <p className="text-xs text-orange-500 font-semibold">
            Decision-support only
          </p>


          <p className="text-xs text-[var(--text-secondary)] mt-1">
            An evidence cluster is not an automatic incident conclusion, dispatch instruction, or verified operational fact.
          </p>

        </div>


        <p className="text-[10px] text-[var(--text-secondary)]">
          Cluster:{" "}
          {
            cluster.clusterId
          }
        </p>

      </div>

    </div>
  );
}