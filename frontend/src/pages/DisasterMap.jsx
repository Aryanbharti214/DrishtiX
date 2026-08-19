import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Crosshair,
  Filter,
  LocateFixed,
  MapPin,
  Plus,
  Radio,
  RefreshCw,
  ShieldAlert,
  TriangleAlert,
  UserRound,
  X,
} from "lucide-react";

import {
  createManualFinding,
  getDisasterFindings,
} from "../services/api";

import {
  useDisaster,
} from "../context/DisasterContext";


const DEFAULT_CENTER = [
  20.2961,
  85.8245,
];


const INITIAL_REPORT_FORM = {
  type:
    "ROAD_BLOCKAGE",

  severity:
    "MODERATE",

  title:
    "",

  description:
    "",

  latitude:
    "",

  longitude:
    "",
};


/*
|--------------------------------------------------------------------------
| Automatically fit map to real findings
|--------------------------------------------------------------------------
*/

function MapBoundsController({
  findings,
}) {
  const map =
    useMap();


  useEffect(() => {
    const coordinates =
      findings
        .map(
          (finding) => [
            finding.location
              ?.latitude,

            finding.location
              ?.longitude,
          ]
        )
        .filter(
          ([lat, lng]) =>
            lat !== null &&
            lat !== undefined &&
            lng !== null &&
            lng !== undefined
        );


    if (
      coordinates.length === 0
    ) {
      return;
    }


    if (
      coordinates.length === 1
    ) {
      map.flyTo(
        coordinates[0],
        14,
        {
          duration: 0.8,
        }
      );

      return;
    }


    map.fitBounds(
      coordinates,
      {
        padding: [
          80,
          80,
        ],

        maxZoom:
          15,
      }
    );

  }, [
    findings,
    map,
  ]);


  return null;
}


/*
|--------------------------------------------------------------------------
| Click anywhere on map to report a finding
|--------------------------------------------------------------------------
*/

function MapClickReporter({
  enabled,
  onLocationSelected,
}) {
  useMapEvents({
    click(event) {
      if (!enabled) {
        return;
      }


      onLocationSelected({
        latitude:
          event.latlng.lat,

        longitude:
          event.latlng.lng,
      });
    },
  });


  return null;
}


/*
|--------------------------------------------------------------------------
| Source icon
|--------------------------------------------------------------------------
*/

function SourceIcon({
  source,
}) {
  if (
    source === "AI"
  ) {
    return (
      <Bot className="w-4 h-4" />
    );
  }


  if (
    source === "FUSION"
  ) {
    return (
      <Radio className="w-4 h-4" />
    );
  }


  return (
    <UserRound className="w-4 h-4" />
  );
}


export default function DisasterMap() {
  const {
    currentDisaster,
  } = useDisaster();


  /*
  |--------------------------------------------------------------------------
  | Data
  |--------------------------------------------------------------------------
  */

  const [
    findings,
    setFindings,
  ] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");


  /*
  |--------------------------------------------------------------------------
  | Filters
  |--------------------------------------------------------------------------
  */

  const [
    severityFilter,
    setSeverityFilter,
  ] = useState("ALL");


  const [
    sourceFilter,
    setSourceFilter,
  ] = useState("ALL");


  /*
  |--------------------------------------------------------------------------
  | Map report mode
  |--------------------------------------------------------------------------
  */

  const [
    reportMode,
    setReportMode,
  ] = useState(false);


  const [
    showReportPanel,
    setShowReportPanel,
  ] = useState(false);


  const [
    submitting,
    setSubmitting,
  ] = useState(false);


  const [
    form,
    setForm,
  ] = useState(
    INITIAL_REPORT_FORM
  );


  /*
  |--------------------------------------------------------------------------
  | Load real findings
  |--------------------------------------------------------------------------
  */

  const loadFindings =
    useCallback(
      async () => {
        if (
          !currentDisaster?.id
        ) {
          setFindings([]);
          return;
        }


        try {
          setLoading(true);
          setError("");


          const response =
            await getDisasterFindings(
              currentDisaster.id
            );


          setFindings(
            response?.data
              ?.findings ?? []
          );

        } catch (err) {

          setError(
            err instanceof Error
              ? err.message
              : "Failed to load map findings"
          );

        } finally {

          setLoading(false);

        }
      },
      [
        currentDisaster?.id,
      ]
    );


  useEffect(() => {
    void loadFindings();
  }, [loadFindings]);


  /*
  |--------------------------------------------------------------------------
  | Only geolocated findings can appear on the map
  |--------------------------------------------------------------------------
  */

  const geolocatedFindings =
    useMemo(
      () =>
        findings.filter(
          (finding) => {

            const latitude =
              finding.location
                ?.latitude;


            const longitude =
              finding.location
                ?.longitude;


            return (
              latitude !== null &&
              latitude !== undefined &&
              longitude !== null &&
              longitude !== undefined
            );
          }
        ),
      [
        findings,
      ]
    );


  /*
  |--------------------------------------------------------------------------
  | Filtered map layer
  |--------------------------------------------------------------------------
  */

  const filteredFindings =
    useMemo(
      () =>
        geolocatedFindings.filter(
          (finding) => {

            const severityMatches =
              severityFilter ===
                "ALL" ||
              finding.severity ===
                severityFilter;


            const sourceMatches =
              sourceFilter ===
                "ALL" ||
              finding.source ===
                sourceFilter;


            return (
              severityMatches &&
              sourceMatches
            );
          }
        ),
      [
        geolocatedFindings,
        severityFilter,
        sourceFilter,
      ]
    );


  /*
  |--------------------------------------------------------------------------
  | Intelligence summary
  |--------------------------------------------------------------------------
  */

  const summary =
    useMemo(
      () => ({
        total:
          findings.length,

        mapped:
          geolocatedFindings
            .length,

        critical:
          findings.filter(
            (finding) =>
              finding.severity ===
              "CRITICAL"
          ).length,

        severe:
          findings.filter(
            (finding) =>
              finding.severity ===
              "SEVERE"
          ).length,

        pendingVerification:
          findings.filter(
            (finding) =>
              finding
                .verificationStatus ===
              "PENDING"
          ).length,

        ai:
          findings.filter(
            (finding) =>
              finding.source ===
              "AI"
          ).length,

        responder:
          findings.filter(
            (finding) =>
              finding.source ===
              "RESPONDER"
          ).length,

        fusion:
          findings.filter(
            (finding) =>
              finding.source ===
              "FUSION"
          ).length,
      }),
      [
        findings,
        geolocatedFindings,
      ]
    );


  /*
  |--------------------------------------------------------------------------
  | Map click
  |--------------------------------------------------------------------------
  */

  function handleLocationSelected({
    latitude,
    longitude,
  }) {
    setForm(
      (previous) => ({
        ...previous,

        latitude:
          latitude.toFixed(
            6
          ),

        longitude:
          longitude.toFixed(
            6
          ),
      })
    );


    setShowReportPanel(
      true
    );


    setReportMode(
      false
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Form
  |--------------------------------------------------------------------------
  */

  function handleChange(
    event
  ) {
    const {
      name,
      value,
    } = event.target;


    setForm(
      (previous) => ({
        ...previous,

        [name]:
          value,
      })
    );
  }


  function closeReportPanel() {
    setShowReportPanel(
      false
    );


    setReportMode(
      false
    );


    setForm(
      INITIAL_REPORT_FORM
    );
  }


  async function handleSubmit(
    event
  ) {
    event.preventDefault();


    if (
      !currentDisaster?.id
    ) {
      setError(
        "Select a disaster before reporting a finding."
      );

      return;
    }


    try {
      setSubmitting(true);

      setError("");
      setSuccessMessage("");


      const response =
        await createManualFinding({
          disasterId:
            currentDisaster.id,

          type:
            form.type,

          severity:
            form.severity,

          title:
            form.title.trim(),

          description:
            form.description
              .trim() ||
            undefined,

          latitude:
            Number(
              form.latitude
            ),

          longitude:
            Number(
              form.longitude
            ),
        });


      const finding =
        response?.data
          ?.finding;


      if (!finding) {
        throw new Error(
          "Backend did not return created finding."
        );
      }


      /*
       * Immediate map update.
       */

      setFindings(
        (previous) => [
          finding,
          ...previous,
        ]
      );


      setSuccessMessage(
        "Responder finding added to the live intelligence map."
      );


      closeReportPanel();

    } catch (err) {

      setError(
        err instanceof Error
          ? err.message
          : "Failed to report finding"
      );

    } finally {

      setSubmitting(false);

    }
  }


  /*
  |--------------------------------------------------------------------------
  | Helpers
  |--------------------------------------------------------------------------
  */

  function prettyType(
    type
  ) {
    return (
      type
        ?.replaceAll(
          "_",
          " "
        ) ??
      "UNKNOWN"
    );
  }


  function formatConfidence(
    confidence
  ) {
    if (
      confidence === null ||
      confidence === undefined
    ) {
      return "N/A";
    }


    return `${(
      confidence * 100
    ).toFixed(1)}%`;
  }


  function getFindingColor(
    severity
  ) {
    switch (severity) {

      case "CRITICAL":
        return "#ef4444";


      case "SEVERE":
        return "#f97316";


      case "MODERATE":
        return "#eab308";


      case "LOW":
        return "#0ea5e9";


      default:
        return "#64748b";
    }
  }


  function getFindingRadius(
    severity
  ) {
    switch (severity) {

      case "CRITICAL":
        return 18;


      case "SEVERE":
        return 15;


      case "MODERATE":
        return 12;


      default:
        return 10;
    }
  }


  return (
    <div className="space-y-5">


      {/* ============================================================= */}
      {/* HEADER                                                        */}
      {/* ============================================================= */}

      <div className="flex flex-wrap items-start justify-between gap-4">

        <div>

          <div className="flex items-center gap-2">

            <ShieldAlert className="w-5 h-5 text-orange-500" />


            <h2 className="text-xl font-extrabold text-[var(--text-primary)]">
              Live Disaster Intelligence Map
            </h2>

          </div>


          <p className="text-sm text-[var(--text-secondary)] mt-1">

            Operational findings for{" "}

            <span className="font-semibold">
              {
                currentDisaster
                  ?.name ??
                "no selected disaster"
              }
            </span>.

          </p>

        </div>


        <div className="flex flex-wrap gap-2">


          <button
            type="button"
            onClick={
              loadFindings
            }
            disabled={
              loading ||
              !currentDisaster
            }
            className="px-4 py-2 rounded-lg border border-[var(--border-color)] text-sm font-semibold flex items-center gap-2 text-[var(--text-primary)] disabled:opacity-50"
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
            disabled={
              !currentDisaster
            }
            onClick={() => {
              setReportMode(
                (current) =>
                  !current
              );

              setShowReportPanel(
                false
              );

              setError("");
            }}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50 transition-colors ${
              reportMode
                ? "bg-orange-500 text-white"
                : "bg-orange-600 hover:bg-orange-700 text-white"
            }`}
          >

            <Crosshair className="w-4 h-4" />

            {
              reportMode
                ? "Click Map Location"
                : "Report on Map"
            }

          </button>

        </div>

      </div>


      {/* ============================================================= */}
      {/* MESSAGES                                                      */}
      {/* ============================================================= */}

      {error && (

        <div className="flex gap-2 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 text-sm">

          <TriangleAlert className="w-4 h-4 mt-0.5" />

          <span>
            {error}
          </span>

        </div>

      )}


      {successMessage && (

        <div className="flex gap-2 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-sm">

          <CheckCircle2 className="w-4 h-4 mt-0.5" />

          <span>
            {successMessage}
          </span>

        </div>

      )}


      {/* ============================================================= */}
      {/* LIVE INTELLIGENCE SUMMARY                                     */}
      {/* ============================================================= */}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">


        <SummaryCard
          label="Total Findings"
          value={
            summary.total
          }
        />


        <SummaryCard
          label="Mapped"
          value={
            summary.mapped
          }
        />


        <SummaryCard
          label="Critical"
          value={
            summary.critical
          }
          emphasis="critical"
        />


        <SummaryCard
          label="Severe"
          value={
            summary.severe
          }
          emphasis="severe"
        />


        <SummaryCard
          label="Pending Review"
          value={
            summary.pendingVerification
          }
          emphasis="pending"
        />


        <SummaryCard
          label="Fusion Findings"
          value={
            summary.fusion
          }
          emphasis="fusion"
        />

      </div>


      {/* ============================================================= */}
      {/* FILTERS                                                       */}
      {/* ============================================================= */}

      <div className="theme-card rounded-xl border border-[var(--border-color)] p-3 flex flex-wrap items-center gap-3">


        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">

          <Filter className="w-4 h-4" />

          Intelligence Layers

        </div>


        <select
          value={
            severityFilter
          }
          onChange={
            (event) =>
              setSeverityFilter(
                event.target.value
              )
          }
          className="px-3 py-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-xs text-[var(--text-primary)]"
        >

          <option value="ALL">
            All Severities
          </option>

          <option value="CRITICAL">
            Critical
          </option>

          <option value="SEVERE">
            Severe
          </option>

          <option value="MODERATE">
            Moderate
          </option>

          <option value="LOW">
            Low
          </option>

        </select>


        <select
          value={
            sourceFilter
          }
          onChange={
            (event) =>
              setSourceFilter(
                event.target.value
              )
          }
          className="px-3 py-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-xs text-[var(--text-primary)]"
        >

          <option value="ALL">
            All Sources
          </option>

          <option value="AI">
            AI
          </option>

          <option value="RESPONDER">
            Responder
          </option>

          <option value="FUSION">
            Fusion
          </option>

        </select>


        <div className="ml-auto text-xs text-[var(--text-muted)]">

          Showing{" "}

          <span className="font-bold text-[var(--text-primary)]">
            {
              filteredFindings
                .length
            }
          </span>

          {" "}mapped findings

        </div>

      </div>


      {/* ============================================================= */}
      {/* MAIN MAP                                                      */}
      {/* ============================================================= */}

      <div className="relative theme-card rounded-2xl overflow-hidden border border-[var(--border-color)] h-[650px]">


        {!currentDisaster && (

          <div className="absolute inset-0 z-[1500] flex items-center justify-center bg-slate-950/80">

            <div className="text-center">

              <AlertTriangle className="w-10 h-10 mx-auto text-orange-500 mb-3" />

              <p className="font-bold text-white">
                Select a disaster event
              </p>

            </div>

          </div>

        )}


        {/* REPORT MODE HUD */}

        {reportMode && (

          <div className="absolute z-[1000] top-4 left-1/2 -translate-x-1/2 rounded-xl px-5 py-3 bg-orange-600 text-white shadow-2xl">

            <div className="flex items-center gap-2 text-sm font-bold">

              <Crosshair className="w-4 h-4 animate-pulse" />

              Click the map where the incident was observed

            </div>

          </div>

        )}


        {/* LEGEND */}

        <div className="absolute z-[900] left-4 bottom-4 bg-slate-950/90 border border-slate-700 rounded-xl p-4 text-white shadow-xl">

          <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-3">
            Severity
          </p>


          <LegendItem
            color="#ef4444"
            label="Critical"
          />

          <LegendItem
            color="#f97316"
            label="Severe"
          />

          <LegendItem
            color="#eab308"
            label="Moderate"
          />

          <LegendItem
            color="#0ea5e9"
            label="Low"
          />

        </div>


        <MapContainer
          center={
            DEFAULT_CENTER
          }
          zoom={13}
          style={{
            height:
              "100%",

            width:
              "100%",
          }}
        >

          <TileLayer
            attribution="&copy; OpenStreetMap contributors &copy; CARTO"
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />


          <MapBoundsController
            findings={
              filteredFindings
            }
          />


          <MapClickReporter
            enabled={
              reportMode
            }
            onLocationSelected={
              handleLocationSelected
            }
          />


          {filteredFindings.map(
            (finding) => {

              const latitude =
                Number(
                  finding.location
                    .latitude
                );


              const longitude =
                Number(
                  finding.location
                    .longitude
                );


              const color =
                getFindingColor(
                  finding.severity
                );


              return (

                <CircleMarker
                  key={
                    finding.id
                  }
                  center={[
                    latitude,
                    longitude,
                  ]}
                  radius={
                    getFindingRadius(
                      finding.severity
                    )
                  }
                  pathOptions={{
                    color,

                    fillColor:
                      color,

                    fillOpacity:
                      0.65,

                    weight:
                      3,
                  }}
                >

                  <Popup
                    minWidth={
                      280
                    }
                  >

                    <div className="space-y-3 text-slate-900">


                      {/* SOURCE */}

                      <div className="flex items-center justify-between gap-2">

                        <div className="flex items-center gap-1.5 text-xs font-bold">

                          <SourceIcon
                            source={
                              finding.source
                            }
                          />

                          {
                            finding.source
                          }

                        </div>


                        <span
                          className="text-[10px] font-bold px-2 py-1 rounded"
                          style={{
                            backgroundColor:
                              `${color}20`,

                            color,
                          }}
                        >
                          {
                            finding.severity ??
                            "UNKNOWN"
                          }
                        </span>

                      </div>


                      {/* TITLE */}

                      <div>

                        <h4 className="font-bold text-sm">
                          {
                            finding.title ??
                            prettyType(
                              finding.type
                            )
                          }
                        </h4>


                        <p className="text-xs text-slate-600 mt-1">
                          {
                            prettyType(
                              finding.type
                            )
                          }
                        </p>

                      </div>


                      {/* DESCRIPTION */}

                      {finding.description && (

                        <p className="text-xs text-slate-600">
                          {
                            finding.description
                          }
                        </p>

                      )}


                      {/* INTELLIGENCE */}

                      <div className="grid grid-cols-2 gap-2">


                        <div className="rounded-lg bg-slate-100 p-2">

                          <p className="text-[9px] uppercase text-slate-500">
                            Confidence
                          </p>

                          <p className="font-bold text-xs mt-1">
                            {
                              formatConfidence(
                                finding.confidence
                              )
                            }
                          </p>

                        </div>


                        <div className="rounded-lg bg-slate-100 p-2">

                          <p className="text-[9px] uppercase text-slate-500">
                            Verification
                          </p>

                          <p className="font-bold text-xs mt-1">
                            {
                              finding
                                .verificationStatus
                            }
                          </p>

                        </div>

                      </div>


                      {/* POSITION */}

                      <div className="flex gap-1.5 text-[10px] text-slate-500">

                        <LocateFixed className="w-3 h-3" />

                        {
                          latitude.toFixed(
                            5
                          )
                        }

                        ,

                        {
                          longitude.toFixed(
                            5
                          )
                        }

                      </div>


                      {/* SAFE OPERATIONAL ACTION */}

                      <div className="rounded-lg border border-orange-200 bg-orange-50 p-2 text-[10px] text-orange-800">

                        {
                          finding.verificationStatus ===
                          "PENDING"
                            ? "Awaiting responder verification before operational prioritization."
                            : `Verification status: ${finding.verificationStatus}`
                        }

                      </div>

                    </div>

                  </Popup>

                </CircleMarker>

              );
            }
          )}

        </MapContainer>


        {/* LOADING */}

        {loading && (

          <div className="absolute top-4 right-4 z-[1000] rounded-lg bg-slate-950/90 border border-slate-700 px-3 py-2 text-white text-xs flex items-center gap-2">

            <RefreshCw className="w-3.5 h-3.5 animate-spin" />

            Syncing intelligence...

          </div>

        )}

      </div>


      {/* ============================================================= */}
      {/* REPORT PANEL                                                  */}
      {/* ============================================================= */}

      {showReportPanel && (

        <div className="fixed inset-0 z-[5000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">

          <form
            onSubmit={
              handleSubmit
            }
            className="w-full max-w-xl theme-card rounded-2xl border border-orange-500/40 shadow-2xl p-6 space-y-5"
          >


            <div className="flex items-start justify-between">

              <div>

                <div className="flex items-center gap-2">

                  <MapPin className="w-5 h-5 text-orange-500" />

                  <h3 className="font-extrabold text-[var(--text-primary)]">
                    Report Finding at Map Location
                  </h3>

                </div>


                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Create a responder observation at the selected coordinates.
                </p>

              </div>


              <button
                type="button"
                onClick={
                  closeReportPanel
                }
                className="p-2 rounded-lg hover:bg-[var(--bg-card-hover)]"
              >

                <X className="w-4 h-4 text-[var(--text-secondary)]" />

              </button>

            </div>


            {/* COORDINATES */}

            <div className="grid grid-cols-2 gap-3">

              <div className="rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] p-3">

                <p className="text-[9px] uppercase text-[var(--text-muted)]">
                  Latitude
                </p>

                <p className="font-mono text-sm font-bold text-[var(--text-primary)] mt-1">
                  {
                    form.latitude
                  }
                </p>

              </div>


              <div className="rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] p-3">

                <p className="text-[9px] uppercase text-[var(--text-muted)]">
                  Longitude
                </p>

                <p className="font-mono text-sm font-bold text-[var(--text-primary)] mt-1">
                  {
                    form.longitude
                  }
                </p>

              </div>

            </div>


            {/* TYPE / SEVERITY */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">


              <select
                name="type"
                value={
                  form.type
                }
                onChange={
                  handleChange
                }
                className="px-4 py-2.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)]"
              >

                <option value="BUILDING_DAMAGE">
                  Building Damage
                </option>

                <option value="ROAD_BLOCKAGE">
                  Road Blockage
                </option>

                <option value="INFRASTRUCTURE_DAMAGE">
                  Infrastructure Damage
                </option>

                <option value="SERVICE_DISRUPTION">
                  Service Disruption
                </option>

              </select>


              <select
                name="severity"
                value={
                  form.severity
                }
                onChange={
                  handleChange
                }
                className="px-4 py-2.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)]"
              >

                <option value="LOW">
                  Low
                </option>

                <option value="MODERATE">
                  Moderate
                </option>

                <option value="SEVERE">
                  Severe
                </option>

                <option value="CRITICAL">
                  Critical
                </option>

              </select>

            </div>


            {/* TITLE */}

            <input
              name="title"
              required
              minLength={3}
              value={
                form.title
              }
              onChange={
                handleChange
              }
              placeholder="e.g. Bridge access blocked by debris"
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)]"
            />


            {/* DESCRIPTION */}

            <textarea
              name="description"
              rows={4}
              value={
                form.description
              }
              onChange={
                handleChange
              }
              placeholder="Describe what was observed..."
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)] resize-none"
            />


            <div className="flex justify-end gap-3">


              <button
                type="button"
                onClick={
                  closeReportPanel
                }
                className="px-4 py-2.5 rounded-lg border border-[var(--border-color)] text-sm text-[var(--text-primary)]"
              >
                Cancel
              </button>


              <button
                type="submit"
                disabled={
                  submitting
                }
                className="px-5 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold text-sm flex items-center gap-2"
              >

                <Plus className="w-4 h-4" />

                {
                  submitting
                    ? "Reporting..."
                    : "Add Finding"
                }

              </button>

            </div>

          </form>

        </div>

      )}

    </div>
  );
}


/*
|--------------------------------------------------------------------------
| Summary card
|--------------------------------------------------------------------------
*/

function SummaryCard({
  label,
  value,
  emphasis,
}) {
  let accent =
    "text-[var(--text-primary)]";


  if (
    emphasis ===
    "critical"
  ) {
    accent =
      "text-red-500";
  }


  if (
    emphasis ===
    "severe"
  ) {
    accent =
      "text-orange-500";
  }


  if (
    emphasis ===
    "pending"
  ) {
    accent =
      "text-amber-500";
  }


  if (
    emphasis ===
    "fusion"
  ) {
    accent =
      "text-cyan-500";
  }


  return (
    <div className="theme-card rounded-xl border border-[var(--border-color)] p-4">

      <p className="text-[9px] uppercase tracking-widest font-bold text-[var(--text-muted)]">
        {label}
      </p>


      <p className={`text-2xl font-black mt-2 ${accent}`}>
        {value}
      </p>

    </div>
  );
}


/*
|--------------------------------------------------------------------------
| Legend
|--------------------------------------------------------------------------
*/

function LegendItem({
  color,
  label,
}) {
  return (
    <div className="flex items-center gap-2 mb-1.5 last:mb-0">

      <span
        className="w-2.5 h-2.5 rounded-full"
        style={{
          backgroundColor:
            color,
        }}
      />

      <span className="text-[10px] text-slate-300">
        {label}
      </span>

    </div>
  );
}