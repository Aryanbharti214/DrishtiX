import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  MapPinned,
  RefreshCw,
  ShieldAlert,
  Target,
  TriangleAlert,
} from "lucide-react";

import {
  getDisasterFindings,
  getDisasterImagery,
  getDisasterPriorities,
  getEvidenceClusters,
  getFusionRecommendations,
} from "../services/api";

import {
  useDisaster,
} from "../context/DisasterContext";

import StatCard
  from "../components/StatCard";
import BrandedText
  from "../components/BrandedText";


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

  switch (
    level
  ) {

    case "CRITICAL":
      return (
        "border-red-500/30 bg-red-500/10 text-red-500"
      );


    case "HIGH":
      return (
        "border-orange-500/30 bg-orange-500/10 text-orange-500"
      );


    case "MEDIUM":
      return (
        "border-amber-500/30 bg-amber-500/10 text-amber-500"
      );


    default:
      return (
        "border-sky-500/30 bg-sky-500/10 text-sky-500"
      );

  }
}


export default function Dashboard({
  setActiveTab,
}) {

  const {
    currentDisaster,
  } = useDisaster();


  const [
    imagery,
    setImagery,
  ] = useState([]);


  const [
    findings,
    setFindings,
  ] = useState([]);


  const [
    clusters,
    setClusters,
  ] = useState([]);


  const [
    fusionRecommendations,
    setFusionRecommendations,
  ] = useState([]);


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


  const loadDashboard =
    useCallback(
      async () => {

        if (
          !currentDisaster?.id
        ) {

          setImagery(
            []
          );

          setFindings(
            []
          );

          setClusters(
            []
          );

          setFusionRecommendations(
            []
          );

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


          const [
            imageryResponse,
            findingsResponse,
            clustersResponse,
            fusionResponse,
            prioritiesResponse,
          ] =
            await Promise.all([
              getDisasterImagery(
                currentDisaster.id
              ),

              getDisasterFindings(
                currentDisaster.id
              ),

              getEvidenceClusters(
                currentDisaster.id
              ),

              getFusionRecommendations(
                currentDisaster.id
              ),

              getDisasterPriorities(
                currentDisaster.id
              ),
            ]);


          setImagery(
            imageryResponse
              ?.data
              ?.imagery ??
            []
          );


          setFindings(
            findingsResponse
              ?.data
              ?.findings ??
            []
          );


          setClusters(
            clustersResponse
              ?.data
              ?.clusters ??
            []
          );


          setFusionRecommendations(
            fusionResponse
              ?.data
              ?.recommendations ??
            []
          );


          setPriorities(
            prioritiesResponse
              ?.data
              ?.priorities ??
            []
          );

        } catch (err) {

          setError(
            err instanceof Error
              ? err.message
              : "Failed to load operational dashboard"
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

    void loadDashboard();

  }, [
    loadDashboard,
  ]);


  const metrics =
    useMemo(
      () => {

        const activeFindings =
          findings.filter(
            (finding) =>
              finding
                .verificationStatus !==
              "REJECTED"
          );


        return {
          analyzedImagery:
            imagery.filter(
              (item) =>
                item.processingStatus ===
                "ANALYZED"
            ).length,

          activeFindings:
            activeFindings.length,

          pendingVerification:
            activeFindings.filter(
              (finding) =>
                finding
                  .verificationStatus ===
                "PENDING"
            ).length,

          corroboratedClusters:
            clusters.filter(
              (cluster) =>
                cluster.state ===
                "CORROBORATED"
            ).length,

          disputedClusters:
            clusters.filter(
              (cluster) =>
                cluster.state ===
                "DISPUTED"
            ).length,

          pendingFusion:
            fusionRecommendations.filter(
              (recommendation) =>
                recommendation.status ===
                "PENDING"
            ).length,

          approvedFusion:
            fusionRecommendations.filter(
              (recommendation) =>
                recommendation.status ===
                "APPROVED"
            ).length,

          criticalPriorities:
            priorities.filter(
              (priority) =>
                priority.priorityLevel ===
                "CRITICAL"
            ).length,
        };

      },
      [
        imagery,
        findings,
        clusters,
        fusionRecommendations,
        priorities,
      ]
    );


  const topPriorities =
    useMemo(
      () =>
        priorities.slice(
          0,
          3
        ),
      [
        priorities,
      ]
    );


  if (
    !currentDisaster
  ) {

    return (
      <div className="theme-card rounded-xl border border-[var(--border-color)] p-10 text-center">

        <TriangleAlert className="w-9 h-9 mx-auto text-amber-500" />

        <h2 className="font-bold text-lg text-[var(--text-primary)] mt-3">
          No disaster selected
        </h2>

        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Select or create a disaster event to view live operational intelligence.
        </p>

      </div>
    );

  }


  return (
    <div className="space-y-6">


      {/* HEADER */}

      <div className="theme-card rounded-xl border border-[var(--border-color)] border-l-4 border-l-amber-500 p-5">

        <div className="flex flex-wrap justify-between items-center gap-4">

          <div className="flex items-center gap-3">

            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25">

              <ShieldAlert className="w-5 h-5 text-amber-500" />

            </div>


            <div>

              <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-muted)]">
                Active Operational Event
              </p>


              <h2 className="text-lg font-black text-[var(--text-primary)] mt-1">
                <BrandedText>{currentDisaster.name}</BrandedText>
              </h2>


              <p className="text-xs text-[var(--text-secondary)] mt-1">
                {
                  currentDisaster.regionName ??
                  "Region not specified"
                }
              </p>

            </div>

          </div>


          <div className="flex gap-2">

            <button
              type="button"
              onClick={
                () =>
                  void loadDashboard()
              }
              disabled={
                loading
              }
              className="px-3 py-2 rounded-lg border border-[var(--border-color)] flex items-center gap-2 text-xs font-semibold disabled:opacity-50"
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


            <button
              type="button"
              onClick={
                () =>
                  setActiveTab?.(
                    "findings"
                  )
              }
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2"
            >

              Priority Queue

              <ArrowUpRight className="w-4 h-4" />

            </button>

          </div>

        </div>

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


      {/* PRIMARY METRICS */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Active Findings"
          value={
            metrics.activeFindings
          }
          icon={
            AlertTriangle
          }
          badgeColor="bg-red-500/10 text-red-500"
          borderColor="border-l-red-500"
        />


        <StatCard
          label="Pending Verification"
          value={
            metrics.pendingVerification
          }
          icon={
            CheckCircle2
          }
          badgeColor="bg-amber-500/10 text-amber-500"
          borderColor="border-l-amber-500"
        />

        <StatCard
          label="Critical Priorities"
          value={
            metrics.criticalPriorities
          }
          icon={Target}
          badgeColor="bg-orange-500/10 text-orange-500"
          borderColor="border-l-orange-500"
        />
      </div>


      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">


        {/* EVIDENCE OVERVIEW */}

        <div className="xl:col-span-2 theme-card rounded-xl border border-[var(--border-color)] p-5">

          <div className="flex justify-between items-start gap-4">

            <div>

              <div className="flex items-center gap-2">

                <MapPinned className="w-5 h-5 text-blue-500" />

                <h3 className="font-extrabold text-[var(--text-primary)]">
                  Evidence Intelligence Overview
                </h3>

              </div>


              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Live evidence state derived from current findings and spatial relationships.
              </p>

            </div>


            <button
              type="button"
              onClick={
                () =>
                  setActiveTab?.(
                    "map"
                  )
              }
              className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2"
            >

              Open Map

              <ArrowUpRight className="w-3.5 h-3.5" />

            </button>

          </div>


          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">

            <ClusterMetric
              label="Total Clusters"
              value={
                clusters.length
              }
            />


            <ClusterMetric
              label="Corroborated"
              value={
                metrics.corroboratedClusters
              }
            />


            <ClusterMetric
              label="Disputed"
              value={
                metrics.disputedClusters
              }
            />


            <ClusterMetric
              label="Fusion Pending"
              value={
                metrics.pendingFusion
              }
            />

          </div>


          <div className="mt-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] p-4">

            <div className="flex items-start gap-3">

              <Activity className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />


              <div>

                <p className="text-sm font-bold text-[var(--text-primary)]">
                  Human-in-the-loop operational intelligence
                </p>


                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                  Spatial correlation, evidence clustering, fusion recommendations,
                  and priority scores support responder review. They do not automatically
                  verify evidence or dispatch resources.
                </p>

              </div>

            </div>

          </div>

        </div>


        {/* TOP PRIORITIES */}

        <div className="theme-card rounded-xl border border-[var(--border-color)] p-5">

          <div className="flex justify-between items-center">

            <div className="flex items-center gap-2">

              <Target className="w-4 h-4 text-orange-500" />

              <h3 className="font-bold text-sm text-[var(--text-primary)] uppercase tracking-wide">
                Top Inspection Priorities
              </h3>

            </div>


            <button
              type="button"
              onClick={
                () =>
                  setActiveTab?.(
                    "findings"
                  )
              }
              className="text-xs text-blue-500 hover:underline"
            >
              View all
            </button>

          </div>


          <div className="space-y-3 mt-4">

            {
              topPriorities.map(
                (
                  priority
                ) => (
                  <div
                    key={
                      priority.findingId
                    }
                    className="rounded-lg border border-[var(--border-color)] p-3"
                  >

                    <div className="flex justify-between gap-3">

                      <div className="min-w-0">

                        <div className="flex items-center gap-2">

                          <span className="text-xs font-black text-[var(--text-muted)]">
                            #
                            {
                              priority.rank
                            }
                          </span>


                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded border ${priorityStyle(
                              priority.priorityLevel
                            )}`}
                          >
                            {
                              priority.priorityLevel
                            }
                          </span>

                        </div>


                        <p className="text-sm font-bold text-[var(--text-primary)] mt-2 truncate">
                          {
                            priority.title ??
                            pretty(
                              priority.type
                            )
                          }
                        </p>


                        <p className="text-[10px] text-[var(--text-secondary)] mt-1">
                          {
                            pretty(
                              priority.type
                            )
                          }

                          {" · "}

                          {
                            priority.verificationStatus
                          }
                        </p>

                      </div>


                      <div className="text-right shrink-0">

                        <p className="text-xl font-black text-orange-500">
                          {
                            priority.priorityScore
                          }
                        </p>

                        <p className="text-[8px] uppercase text-[var(--text-muted)]">
                          /100
                        </p>

                      </div>

                    </div>


                    {
                      priority.reasons?.[0] &&
                      (
                        <p className="text-[10px] text-[var(--text-secondary)] mt-2">
                          {
                            priority.reasons[0]
                          }
                        </p>
                      )
                    }

                  </div>
                )
              )
            }


            {
              !loading &&
              topPriorities.length ===
                0 &&
              (
                <div className="text-center py-8 text-xs text-[var(--text-muted)]">
                  No active priorities
                </div>
              )
            }

          </div>

        </div>

      </div>

    </div>
  );
}


function ClusterMetric({
  label,
  value,
}) {

  return (
    <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] p-4">

      <p className="text-[9px] uppercase font-bold text-[var(--text-muted)]">
        {
          label
        }
      </p>


      <p className="text-2xl font-black text-[var(--text-primary)] mt-2">
        {
          value
        }
      </p>

    </div>
  );
}
