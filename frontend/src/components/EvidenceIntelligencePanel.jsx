import React, {
  useMemo,
} from "react";

import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Link2,
  MapPin,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";


function prettyType(
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


function formatDistance(
  distance
) {
  if (
    distance === null ||
    distance === undefined
  ) {
    return "Unknown distance";
  }


  if (distance < 1000) {
    return `${distance.toFixed(1)} m`;
  }


  return `${(
    distance / 1000
  ).toFixed(2)} km`;
}


function relationMeta(
  type
) {
  switch (type) {

    case "CORROBORATES":
      return {
        label:
          "Corroborates",

        icon:
          CheckCircle2,

        className:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
      };


    case "DISPUTED":
      return {
        label:
          "Disputed",

        icon:
          AlertTriangle,

        className:
          "border-red-500/30 bg-red-500/10 text-red-500",
      };


    case "POSSIBLE_DUPLICATE":
      return {
        label:
          "Possible Duplicate",

        icon:
          Copy,

        className:
          "border-amber-500/30 bg-amber-500/10 text-amber-500",
      };


    default:
      return {
        label:
          "Related",

        icon:
          Link2,

        className:
          "border-sky-500/30 bg-sky-500/10 text-sky-500",
      };
  }
}


function SummaryCard({
  label,
  value,
}) {
  return (
    <div className="rounded-lg border border-[var(--border-color)] p-3">

      <p className="text-xs text-[var(--text-secondary)]">
        {label}
      </p>


      <p className="text-xl font-extrabold text-[var(--text-primary)] mt-1">
        {value}
      </p>

    </div>
  );
}


export default function EvidenceIntelligencePanel({
  finding,
  relations,
  loading,
  error,
  onClose,
  onRefresh,
}) {

  const summary =
    useMemo(
      () => ({
        corroborates:
          relations.filter(
            (relation) =>
              relation.relationType ===
              "CORROBORATES"
          ).length,

        related:
          relations.filter(
            (relation) =>
              relation.relationType ===
              "RELATED"
          ).length,

        duplicates:
          relations.filter(
            (relation) =>
              relation.relationType ===
              "POSSIBLE_DUPLICATE"
          ).length,

        disputed:
          relations.filter(
            (relation) =>
              relation.relationType ===
              "DISPUTED"
          ).length,
      }),
      [
        relations,
      ]
    );


  return (
    <div
      className="
    fixed
    z-[1400]

    left-3
    right-3
    bottom-3

    sm:left-auto
    sm:right-6
    sm:top-24
    sm:bottom-6
    sm:w-[520px]

    flex
    flex-col

    max-h-[82vh]
    sm:max-h-[calc(100vh-7.5rem)]

    overflow-hidden

    rounded-2xl

    border
    border-slate-700/80

    bg-[var(--bg-card)]

    shadow-[0_24px_80px_rgba(0,0,0,0.65)]
  "
    >
      <div className="
  shrink-0
  z-10
  bg-[var(--bg-card)]
  border-b
  border-[var(--border-color)]
  px-5
  py-4
">

        <div className="flex items-start justify-between gap-4">

          <div>

            <div className="flex items-center gap-2">

              <ShieldCheck className="w-5 h-5 text-orange-500" />


              <h3 className="font-extrabold text-[var(--text-primary)]">
                Evidence Intelligence
              </h3>

            </div>


            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Explainable spatial evidence relationships
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


      <div className="flex-1overflow-y-autop-5space-y-5bg-[var(--bg-card)]">



        <div className="rounded-xlborderborder-orange-500/25bg-orange-500/[0.04]p-4">

          <div className="flex items-start justify-between gap-3">

            <div>

              <p className="text-xs font-semibold text-orange-500 uppercase">
                Selected Finding
              </p>


              <h4 className="font-bold text-[var(--text-primary)] mt-1">
                {
                  finding.title ??
                  prettyType(
                    finding.type
                  )
                }
              </h4>


              <p className="text-sm text-[var(--text-secondary)] mt-1">
                {
                  prettyType(
                    finding.type
                  )
                }
              </p>

            </div>


            <span className="text-xs px-2 py-1 rounded-md border border-[var(--border-color)] text-[var(--text-secondary)]">
              {
                finding.source
              }
            </span>

          </div>


          <div className="flex flex-wrap gap-2 mt-3">

            <span className="text-xs px-2 py-1 rounded-md border border-[var(--border-color)]">
              {
                finding.severity ??
                "NO SEVERITY"
              }
            </span>


            <span className="text-xs px-2 py-1 rounded-md border border-[var(--border-color)]">
              {
                finding.verificationStatus
              }
            </span>

          </div>

        </div>




        <div className="grid grid-cols-2 gap-3">

          <SummaryCard
            label="Corroborating"
            value={
              summary.corroborates
            }
          />


          <SummaryCard
            label="Related"
            value={
              summary.related
            }
          />


          <SummaryCard
            label="Possible Duplicates"
            value={
              summary.duplicates
            }
          />


          <SummaryCard
            label="Disputed"
            value={
              summary.disputed
            }
          />

        </div>




        <button
          type="button"
          onClick={
            onRefresh
          }
          disabled={
            loading
          }
          className="
            w-full
            px-4
            py-2
            rounded-lg
            border
            border-[var(--border-color)]
            text-sm
            font-semibold
            flex
            items-center
            justify-center
            gap-2
            disabled:opacity-50
          "
        >

          <RefreshCw
            className={`w-4 h-4 ${loading
              ? "animate-spin"
              : ""
              }`}
          />


          Refresh Evidence

        </button>




        {error && (

          <div className="rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 p-3 text-sm">

            {error}

          </div>

        )}




        {loading && (

          <div className="text-sm text-[var(--text-secondary)] text-center py-8">

            Loading evidence relationships...

          </div>

        )}




        {
          !loading &&
          !error &&
          relations.length === 0 &&
          (
            <div className="rounded-xl border border-dashed border-[var(--border-color)] p-6 text-center">

              <MapPin className="w-7 h-7 mx-auto text-[var(--text-secondary)]" />


              <p className="font-semibold text-[var(--text-primary)] mt-3">
                No active evidence relationships
              </p>


              <p className="text-sm text-[var(--text-secondary)] mt-1">

                {
                  finding.verificationStatus ===
                    "REJECTED"
                    ? "Rejected evidence is intentionally excluded from supporting relationships."
                    : "No qualifying findings were found within the current spatial correlation radius."
                }

              </p>

            </div>
          )
        }




        {
          !loading &&
          relations.map(
            (relation) => {

              const meta =
                relationMeta(
                  relation.relationType
                );


              const Icon =
                meta.icon;


              const related =
                relation.relatedFinding;


              return (
                <div
                  key={
                    relation.id
                  }
                  className="rounded-xlborderborder-[var(--border-color)]bg-[var(--bg-main)]overflow-hiddenshadow-sm">

                  <div
                    className={`flex items-center gap-2 border-b px-4 py-3 ${meta.className}`}
                  >

                    <Icon className="w-4 h-4" />


                    <span className="text-sm font-bold">
                      {
                        meta.label
                      }
                    </span>


                    <span className="ml-auto text-xs font-bold">
                      {
                        Math.round(
                          relation.score *
                          100
                        )
                      }%
                    </span>

                  </div>


                  <div className="p-4 space-y-3">

                    <div>

                      <p className="font-bold text-sm text-[var(--text-primary)]">
                        {
                          related.title ??
                          prettyType(
                            related.type
                          )
                        }
                      </p>


                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        {
                          prettyType(
                            related.type
                          )
                        }
                      </p>

                    </div>


                    <div className="grid grid-cols-2 gap-2 text-xs">

                      <div className="rounded-lgborderborder-[var(--border-color)]bg-[var(--bg-card-hover)]p-3">

                        <p className="text-[var(--text-secondary)]">
                          Distance
                        </p>

                        <p className="font-semibold text-[var(--text-primary)] mt-1">
                          {
                            formatDistance(
                              relation.distanceMeters
                            )
                          }
                        </p>

                      </div>


                      <div className="rounded-lgborderborder-[var(--border-color)]bg-[var(--bg-card-hover)]p-3">

                        <p className="text-[var(--text-secondary)]">
                          Relationship Strength
                        </p>

                        <p className="font-semibold text-[var(--text-primary)] mt-1">
                          {
                            Math.round(
                              relation.score *
                              100
                            )
                          }%
                        </p>

                      </div>

                    </div>


                    <div className="flex flex-wrap gap-2">

                      <span className="text-xs border border-[var(--border-color)] px-2 py-1 rounded-md">
                        {
                          related.source
                        }
                      </span>


                      <span className="text-xs border border-[var(--border-color)] px-2 py-1 rounded-md">
                        {
                          related.verificationStatus
                        }
                      </span>


                      {
                        related.severity &&
                        (
                          <span className="text-xs border border-[var(--border-color)] px-2 py-1 rounded-md">
                            {
                              related.severity
                            }
                          </span>
                        )
                      }

                    </div>


                    <div className="rounded-lg border border-[var(--border-color)] p-3">

                      <p className="text-xs font-bold text-[var(--text-primary)]">
                        Why is this related?
                      </p>


                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        {
                          relation.signals
                            ?.rule ??
                          "Spatial relationship detected"
                        }
                      </p>


                      {
                        relation.signals
                          ?.sourceDiversity === true &&
                        (
                          <p className="text-xs text-emerald-500 mt-2">
                            Independent source types contributed to this relationship.
                          </p>
                        )
                      }


                      {
                        relation.signals
                          ?.temporalGapMinutes !==
                        undefined &&
                        (
                          <p className="text-xs text-[var(--text-secondary)] mt-2">
                            Observation time gap:{" "}
                            {
                              Number(
                                relation.signals
                                  .temporalGapMinutes
                              ).toFixed(1)
                            }{" "}
                            minutes
                          </p>
                        )
                      }

                    </div>


                    <p className="text-[11px] text-[var(--text-secondary)]">
                      Algorithm:{" "}
                      {
                        relation.algorithmVersion
                      }
                    </p>

                  </div>

                </div>
              );
            }
          )
        }

      </div>

    </div>
  );
}