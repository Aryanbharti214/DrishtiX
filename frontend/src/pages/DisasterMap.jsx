import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
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
  Hospital,
  Layers3,
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
  generateFusionRecommendation,
  getDisasterFindings,
  getEvidenceClusters,
  getFindingById,
  getFindingRelations,
  getFusionRecommendations,
  reviewFusionRecommendation,
} from "../services/api";
import EvidenceIntelligencePanel
  from "../components/EvidenceIntelligencePanel";
import EvidenceClusterPanel
  from "../components/EvidenceClusterPanel";
import FusionRecommendationPanel
  from "../components/FusionRecommendationPanel";
import {
  useDisaster,
} from "../context/DisasterContext";
import { useSettings } from "../context/SettingsContext";


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


function RegionViewportController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 11, { duration: 0.9 });
  }, [center, map]);
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

  const { mapPreferences, isDarkMode } = useSettings();
  const [regionCenter, setRegionCenter] = useState(null);
  const [regionLookupStatus, setRegionLookupStatus] = useState("idle");
  const [mapLayers, setMapLayers] = useState({ findings: true, clusters: true, hospitals: true });
  const [hospitals, setHospitals] = useState([]);
  const [hospitalStatus, setHospitalStatus] = useState("idle");

  useEffect(() => {
    const region = currentDisaster?.regionName?.trim();
    if (!region) {
      setRegionCenter(null);
      setRegionLookupStatus("idle");
      return;
    }
    const controller = new AbortController();
    setRegionCenter(null);
    setRegionLookupStatus("loading");
    fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(region)}`, {
      signal: controller.signal,
      headers: { "Accept-Language": "en" },
    })
      .then((response) => {
        if (!response.ok) throw new Error("Geocoding failed");
        return response.json();
      })
      .then((results) => {
        if (!results?.[0]) throw new Error("Region not found");
        setRegionCenter([Number(results[0].lat), Number(results[0].lon)]);
        setRegionLookupStatus("ready");
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setRegionCenter(null);
          setRegionLookupStatus("failed");
        }
      });
    return () => controller.abort();
  }, [currentDisaster?.regionName]);

  useEffect(() => {
    if (!regionCenter) { setHospitals([]); setHospitalStatus("idle"); return; }
    const controller = new AbortController();
    const [latitude, longitude] = regionCenter;
    const query = `[out:json][timeout:25];(node["amenity"~"^(hospital|clinic)$"](around:25000,${latitude},${longitude});way["amenity"~"^(hospital|clinic)$"](around:25000,${latitude},${longitude});relation["amenity"~"^(hospital|clinic)$"](around:25000,${latitude},${longitude});node["healthcare"~"^(hospital|clinic|doctor)$"](around:25000,${latitude},${longitude});way["healthcare"~"^(hospital|clinic|doctor)$"](around:25000,${latitude},${longitude}););out center tags;`;
    setHospitalStatus("loading");
    fetch("https://overpass-api.de/api/interpreter", { method: "POST", signal: controller.signal, headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: `data=${encodeURIComponent(query)}` })
      .then((response) => { if (!response.ok) throw new Error("Healthcare data unavailable"); return response.json(); })
      .then((data) => {
        const facilities = (data?.elements ?? []).map((element) => {
          const lat = element.lat ?? element.center?.lat; const lng = element.lon ?? element.center?.lon; const tags = element.tags ?? {};
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
          const address = tags["addr:full"] || [tags["addr:housenumber"], tags["addr:street"], tags["addr:city"]].filter(Boolean).join(", ") || null;
          return { id: `${element.type}-${element.id}`, latitude: lat, longitude: lng, name: tags.name || tags["name:en"] || "Healthcare facility", facilityType: tags.healthcare || tags.amenity || null, address, operator: tags.operator || null, emergency: tags.emergency || null };
        }).filter(Boolean);
        setHospitals(facilities); setHospitalStatus("ready");
      })
      .catch((error) => { if (error.name !== "AbortError") { setHospitals([]); setHospitalStatus("failed"); } });
    return () => controller.abort();
  }, [regionCenter]);


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
  | Evidence Intelligence
  |--------------------------------------------------------------------------
  */

  const [
    selectedFinding,
    setSelectedFinding,
  ] = useState(null);


  const [
    findingRelations,
    setFindingRelations,
  ] = useState([]);


  const [
    relationsLoading,
    setRelationsLoading,
  ] = useState(false);


  const [
    relationsError,
    setRelationsError,
  ] = useState("");
  /*
|--------------------------------------------------------------------------
| Disaster Evidence Clusters
|--------------------------------------------------------------------------
*/

const [
  evidenceClusters,
  setEvidenceClusters,
] = useState([]);


const [
  clustersLoading,
  setClustersLoading,
] = useState(false);


const [
  clustersError,
  setClustersError,
] = useState("");


const [
  showClusterLayer,
  setShowClusterLayer,
] = useState(true);


const [
  selectedCluster,
  setSelectedCluster,
] = useState(null);


/*
|--------------------------------------------------------------------------
| Fusion Recommendations
|--------------------------------------------------------------------------
*/

const [
  fusionRecommendations,
  setFusionRecommendations,
] = useState([]);


const [
  selectedFusionRecommendation,
  setSelectedFusionRecommendation,
] = useState(null);


const [
  fusionLoading,
  setFusionLoading,
] = useState(false);


const [
  fusionError,
  setFusionError,
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

const loadEvidenceClusters =
  useCallback(
    async () => {

      if (
        !currentDisaster?.id
      ) {

        setEvidenceClusters(
          []
        );

        return;
      }


      try {

        setClustersLoading(
          true
        );


        setClustersError(
          ""
        );


        const response =
          await getEvidenceClusters(
            currentDisaster.id
          );


        setEvidenceClusters(
          response?.data
            ?.clusters ??
          []
        );

      } catch (err) {

        setEvidenceClusters(
          []
        );


        setClustersError(
          err instanceof Error
            ? err.message
            : "Failed to load evidence clusters"
        );

      } finally {

        setClustersLoading(
          false
        );

      }
    },
    [
      currentDisaster?.id,
    ]
  );

const loadFusionRecommendations =
  useCallback(
    async () => {

      if (
        !currentDisaster?.id
      ) {

        setFusionRecommendations(
          []
        );

        return;
      }


      try {

        setFusionError(
          ""
        );


        const response =
          await getFusionRecommendations(
            currentDisaster.id
          );


        setFusionRecommendations(
          response?.data
            ?.recommendations ??
          []
        );

      } catch (err) {

        setFusionRecommendations(
          []
        );


        setFusionError(
          err instanceof Error
            ? err.message
            : "Failed to load fusion recommendations"
        );

      }
    },
    [
      currentDisaster?.id,
    ]
  );
  useEffect(() => {
    void loadFindings();
  }, [loadFindings]);


  useEffect(() => {
    void loadEvidenceClusters();
  }, [
    loadEvidenceClusters,
  ]);


  useEffect(() => {
    void loadFusionRecommendations();
  }, [
    loadFusionRecommendations,
  ]);


  useEffect(() => {

    setSelectedFinding(
      null
    );

    setFindingRelations(
      []
    );

    setRelationsError(
      ""
    );

    setSelectedCluster(
      null
    );

    setEvidenceClusters(
      []
    );

    setClustersError(
      ""
    );

    setFusionRecommendations(
      []
    );

    setSelectedFusionRecommendation(
      null
    );

    setFusionError(
      ""
    );

  }, [
    currentDisaster?.id,
  ]);


  

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
 
  const visibleEvidenceClusters =
    useMemo(
      () =>
        evidenceClusters.filter(
          (cluster) => {

            if (
              cluster
                .activeEvidenceCount ===
              0
            ) {
              return false;
            }


            if (
              cluster.memberCount === 1 &&
              cluster.state ===
                "ISOLATED"
            ) {
              return false;
            }


            return true;
          }
        ),
      [
        evidenceClusters,
      ]
    );


  const selectedClusterFusionRecommendation =
    useMemo(
      () => {

        if (
          !selectedCluster
        ) {
          return null;
        }


        return (
          fusionRecommendations.find(
            (recommendation) =>
              recommendation.clusterId ===
              selectedCluster.clusterId
          ) ??
          null
        );

      },
      [
        fusionRecommendations,
        selectedCluster,
      ]
    );


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


      setFindings(
        (previous) => [
          finding,
          ...previous,
        ]
      );


      await loadEvidenceClusters();
      await loadFusionRecommendations();

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

  const loadFindingRelations =
    useCallback(
      async (
        finding
      ) => {

        if (
          !finding?.id
        ) {
          return;
        }


        try {

          setSelectedCluster(
            null
          );

          setSelectedFinding(
            finding
          );


          setRelationsLoading(
            true
          );


          setRelationsError(
            ""
          );


          const response =
            await getFindingRelations(
              finding.id
            );


          setFindingRelations(
            response?.data
              ?.relations ??
            []
          );

        } catch (err) {

          setFindingRelations(
            []
          );


          setRelationsError(
            err instanceof Error
              ? err.message
              : "Failed to load evidence intelligence"
          );

        } finally {

          setRelationsLoading(
            false
          );

        }
      },
      []
    );


  const handleGenerateFusion =
    useCallback(
      async (
        cluster
      ) => {

        if (
          !currentDisaster?.id ||
          !cluster
        ) {
          return;
        }


        try {

          setFusionLoading(
            true
          );


          setFusionError(
            ""
          );


          const response =
            await generateFusionRecommendation(
              currentDisaster.id,
              cluster.anchorFindingId
            );


          const recommendation =
            response?.data
              ?.recommendation;


          if (
            !recommendation
          ) {

            throw new Error(
              "Backend did not return a fusion recommendation."
            );

          }


          setSelectedFinding(
            null
          );


          setFindingRelations(
            []
          );


          setSelectedCluster(
            null
          );


          setSelectedFusionRecommendation(
            recommendation
          );


          await loadFusionRecommendations();

        } catch (err) {

          setFusionError(
            err instanceof Error
              ? err.message
              : "Failed to generate fusion recommendation"
          );

        } finally {

          setFusionLoading(
            false
          );

        }

      },
      [
        currentDisaster?.id,
        loadFusionRecommendations,
      ]
    );


  const handleReviewFusion =
    useCallback(
      async (
        recommendationId,
        payload
      ) => {

        try {

          setFusionLoading(
            true
          );


          setFusionError(
            ""
          );


          const response =
            await reviewFusionRecommendation(
              recommendationId,
              payload
            );


          const recommendation =
            response?.data
              ?.recommendation;


          const createdFinding =
            response?.data
              ?.finding;


          if (
            !recommendation
          ) {

            throw new Error(
              "Backend did not return reviewed recommendation."
            );

          }


          setSelectedFusionRecommendation(
            recommendation
          );


          await loadFusionRecommendations();


          if (
            createdFinding
          ) {

            await loadFindings();
            await loadEvidenceClusters();

          }

        } catch (err) {

          setFusionError(
            err instanceof Error
              ? err.message
              : "Failed to review fusion recommendation"
          );

        } finally {

          setFusionLoading(
            false
          );

        }

      },
      [
        loadEvidenceClusters,
        loadFindings,
        loadFusionRecommendations,
      ]
    );


  const handleOpenFusionFinding =
    useCallback(
      async (
        findingId
      ) => {

        try {

          setFusionError(
            ""
          );


          const response =
            await getFindingById(
              findingId
            );


          const finding =
            response?.data
              ?.finding;


          if (
            !finding
          ) {

            throw new Error(
              "Backend did not return the FUSION finding."
            );

          }


          setSelectedFusionRecommendation(
            null
          );


          void loadFindingRelations(
            finding
          );

        } catch (err) {

          setFusionError(
            err instanceof Error
              ? err.message
              : "Failed to load FUSION finding"
          );

        }

      },
      [
        loadFindingRelations,
      ]
    );


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


  function getClusterColor(
    state
  ) {
    switch (state) {

      case "DISPUTED":
        return "#ef4444";


      case "CORROBORATED":
        return "#22c55e";


      case "RELATED":
        return "#38bdf8";


      default:
        return "#94a3b8";
    }
  }


  function getClusterRadius(
    cluster
  ) {
    return Math.min(
      34,
      18 +
        (
          cluster
            .activeEvidenceCount *
          2
        )
    );
  }


  function getRelationColor(
    relationType
  ) {
    switch (
      relationType
    ) {

      case "DISPUTED":
        return "#ef4444";


      case "CORROBORATES":
        return "#22c55e";


      case "POSSIBLE_DUPLICATE":
        return "#f59e0b";


      default:
        return "#38bdf8";
    }
  }


  return (
    <div className="space-y-5">

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

          {regionLookupStatus === "loading" && <p className="mt-1 text-xs text-sky-500">Locating {currentDisaster?.regionName}…</p>}
          {regionLookupStatus === "failed" && <p className="mt-1 text-xs text-amber-500">Region could not be located; showing available evidence.</p>}

        </div>


        <div className="flex flex-wrap gap-2">


          <button
            type="button"
            onClick={() => {
              void loadFindings();
              void loadEvidenceClusters();
              void loadFusionRecommendations();
            }}
            disabled={
              loading ||
              !currentDisaster
            }
            className="px-4 py-2 rounded-lg border border-[var(--border-color)] text-sm font-semibold flex items-center gap-2 text-[var(--text-primary)] disabled:opacity-50"
          >

            <RefreshCw
              className={`w-4 h-4 ${loading
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
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50 transition-colors ${reportMode
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

      {clustersError && (

        <div className="flex gap-2 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-500 text-sm">

          <TriangleAlert className="w-4 h-4 mt-0.5" />

          <span>
            {
              clustersError
            }
          </span>

        </div>

      )}


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


        <button
          type="button"
          onClick={
            () =>
              setShowClusterLayer(
                (current) =>
                  !current
              )
          }
          className={`
            px-3
            py-2
            rounded-lg
            border
            text-xs
            font-bold
            transition-colors
            ${
              showClusterLayer
                ? "border-orange-500 bg-orange-500/10 text-orange-500"
                : "border-[var(--border-color)] text-[var(--text-secondary)]"
            }
          `}
        >
          Evidence Clusters:{" "}
          {
            showClusterLayer
              ? "ON"
              : "OFF"
          }
        </button>


        <span className="text-xs text-[var(--text-secondary)]">
          {
            visibleEvidenceClusters.length
          }{" "}
          active clusters
        </span>


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

      <div className="relative isolate z-0 w-full max-w-full min-w-0 h-[650px] theme-card rounded-2xl overflow-hidden border border-[var(--border-color)] [contain:layout_paint]">

        <div className="map-layers-control absolute right-4 bottom-9 z-[1100] w-48 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-3 text-[var(--text-primary)] shadow-xl">
          <div className="mb-2 flex items-center gap-2 text-xs font-black"><Layers3 className="h-4 w-4 text-orange-500" />Map Layers</div>
          {[['findings', 'Findings'], ['clusters', 'Evidence Clusters'], ['hospitals', 'Hospitals']].map(([key, label]) => <label key={key} className="flex cursor-pointer items-center justify-between gap-3 py-1.5 text-xs"><span>{label}</span><input type="checkbox" checked={mapLayers[key]} onChange={() => setMapLayers((current) => ({ ...current, [key]: !current[key] }))} className="h-4 w-4 accent-orange-600" /></label>)}
          <p className="mt-2 border-t border-[var(--border-color)] pt-2 text-[9px] text-[var(--text-muted)]">{hospitalStatus === "loading" ? "Loading healthcare data…" : hospitalStatus === "failed" ? "Hospital data unavailable" : `${hospitals.length} mapped facilities`}</p>
        </div>


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
        {reportMode && (

          <div className="absolute z-[1000] top-4 left-1/2 -translate-x-1/2 rounded-xl px-5 py-3 bg-orange-600 text-white shadow-2xl">

            <div className="flex items-center gap-2 text-sm font-bold">

              <Crosshair className="w-4 h-4 animate-pulse" />

              Click the map where the incident was observed

            </div>

          </div>

        )}
      

        <div className="map-severity-legend absolute z-[900] left-4 bottom-4 rounded-xl p-4 shadow-xl">

          <p className="map-severity-title text-[10px] uppercase tracking-widest font-bold mb-3">
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
          className="!relative !z-0 h-full w-full max-w-full"
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
            url={isDarkMode ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"}
          />


          <MapBoundsController
            findings={
              filteredFindings
            }
          />

          <RegionViewportController center={regionCenter} />


          <MapClickReporter
            enabled={
              reportMode
            }
            onLocationSelected={
              handleLocationSelected
            }
          />


          {
            mapLayers.clusters && mapPreferences.showRelations && selectedCluster &&
            selectedCluster.relations.map(
              (relation) => {

                const findingA =
                  selectedCluster
                    .members
                    .find(
                      (member) =>
                        member.id ===
                        relation.findingAId
                    );


                const findingB =
                  selectedCluster
                    .members
                    .find(
                      (member) =>
                        member.id ===
                        relation.findingBId
                    );


                if (
                  !findingA ||
                  !findingB ||
                  findingA.latitude === null ||
                  findingA.longitude === null ||
                  findingB.latitude === null ||
                  findingB.longitude === null
                ) {
                  return null;
                }


                return (
                  <Polyline
                    key={
                      relation.id
                    }
                    positions={[
                      [
                        Number(
                          findingA.latitude
                        ),
                        Number(
                          findingA.longitude
                        ),
                      ],
                      [
                        Number(
                          findingB.latitude
                        ),
                        Number(
                          findingB.longitude
                        ),
                      ],
                    ]}
                    pathOptions={{
                      color:
                        getRelationColor(
                          relation
                            .relationType
                        ),

                      weight:
                        3,

                      opacity:
                        0.7,

                      dashArray:
                        relation
                          .relationType ===
                        "RELATED"
                          ? "8 8"
                          : undefined,
                    }}
                  />
                );
              }
            )
          }


          {
            showClusterLayer &&
            mapLayers.clusters && mapPreferences.showClusters && visibleEvidenceClusters.map(
              (cluster) => {

                const latitude =
                  cluster.displayCenter
                    ?.latitude;


                const longitude =
                  cluster.displayCenter
                    ?.longitude;


                if (
                  latitude === null ||
                  latitude === undefined ||
                  longitude === null ||
                  longitude === undefined
                ) {
                  return null;
                }


                const color =
                  getClusterColor(
                    cluster.state
                  );


                const selected =
                  selectedCluster
                    ?.clusterId ===
                  cluster.clusterId;


                return (
                  <CircleMarker
                    key={
                      cluster.clusterId
                    }
                    center={[
                      Number(
                        latitude
                      ),
                      Number(
                        longitude
                      ),
                    ]}
                    radius={
                      getClusterRadius(
                        cluster
                      )
                    }
                    pathOptions={{
                      color,

                      fillColor:
                        color,

                      fillOpacity:
                        selected
                          ? 0.25
                          : 0.12,

                      opacity:
                        0.9,

                      weight:
                        selected
                          ? 5
                          : 3,

                      dashArray:
                        cluster.state ===
                          "RELATED"
                          ? "8 6"
                          : undefined,
                    }}
                  >

                    <Popup
                      minWidth={
                        270
                      }
                    >

                      <div className="evidence-cluster-popup space-y-3 text-slate-900">

                        <div className="flex items-center justify-between gap-3">

                          <p className="font-bold text-sm">
                            Evidence Cluster
                          </p>


                          <span
                            className="text-[10px] font-bold"
                            style={{
                              color,
                            }}
                          >
                            {
                              cluster.state
                            }
                          </span>

                        </div>


                        <div className="grid grid-cols-2 gap-2">

                          <div className="rounded bg-slate-100 p-2">

                            <p className="text-[9px] uppercase text-slate-500">
                              Active Evidence
                            </p>


                            <p className="font-bold">
                              {
                                cluster
                                  .activeEvidenceCount
                              }
                            </p>

                          </div>


                          <div className="rounded bg-slate-100 p-2">

                            <p className="text-[9px] uppercase text-slate-500">
                              Verified
                            </p>


                            <p className="font-bold">
                              {
                                cluster
                                  .verifiedCount
                              }
                            </p>

                          </div>

                        </div>


                        <p className="text-xs text-slate-600">
                          Highest severity:{" "}
                          <strong>
                            {
                              cluster
                                .highestSeverity ??
                              "NONE"
                            }
                          </strong>
                        </p>


                        <p className="text-[10px] text-slate-500">
                          This marker represents connected evidence, not a fused or automatically verified incident.
                        </p>

                      </div>


                      <button
                        type="button"
                        onClick={
                          (event) => {

                            event
                              .stopPropagation();


                            setSelectedFinding(
                              null
                            );


                            setFindingRelations(
                              []
                            );


                            setSelectedCluster(
                              cluster
                            );

                          }
                        }
                        className="evidence-cluster-popup-action mt-3 w-full px-3 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold"
                      >
                        Inspect Evidence Cluster
                      </button>

                    </Popup>

                  </CircleMarker>
                );
              }
            )
          }


          {mapLayers.findings && filteredFindings.map(
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

                      {finding.description && (

                        <p className="text-xs text-slate-600">
                          {
                            finding.description
                          }
                        </p>

                      )}


                      

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


                      

                      <div className="rounded-lg border border-orange-200 bg-orange-50 p-2 text-[10px] text-orange-800">

                        {
                          finding.verificationStatus ===
                            "PENDING"
                            ? "Awaiting responder verification before operational prioritization."
                            : `Verification status: ${finding.verificationStatus}`
                        }

                      </div>

                    </div>
                    <button
                      type="button"
                      onClick={
                        (event) => {

                          event.stopPropagation();


                          void loadFindingRelations(
                            finding
                          );

                        }
                      }
                      className="mt-3 w-full
    px-3
    py-2
    rounded-lg
    bg-orange-600
    hover:bg-orange-700
    text-white
    text-xs
    font-bold
  "
                    >

                      View Evidence Intelligence

                    </button>
                  </Popup>

                </CircleMarker>

              );
            }
          )}

          {mapLayers.hospitals && hospitals.map((hospital) => (
            <CircleMarker key={hospital.id} center={[hospital.latitude, hospital.longitude]} radius={10} pathOptions={{ color: "#ffffff", fillColor: "#e11d48", fillOpacity: 1, weight: 2 }}>
              <Tooltip permanent direction="center" className="hospital-marker-symbol">+</Tooltip>
              <Popup minWidth={250}>
                <div className="space-y-3 text-slate-900">
                  <div className="flex items-start gap-2"><span className="rounded-lg bg-rose-600 p-2 text-white"><Hospital className="h-4 w-4" /></span><div><h4 className="font-bold">{hospital.name}</h4>{hospital.facilityType && <p className="mt-1 text-xs capitalize text-slate-600">{prettyType(hospital.facilityType)}</p>}</div></div>
                  {hospital.address && <p className="text-xs text-slate-600"><strong>Address:</strong> {hospital.address}</p>}
                  {hospital.operator && <p className="text-xs text-slate-600"><strong>Operator:</strong> {hospital.operator}</p>}
                  {hospital.emergency && <p className="text-xs text-slate-600"><strong>Emergency:</strong> {hospital.emergency}</p>}
                  <p className="text-[10px] text-slate-500">Mapped OpenStreetMap healthcare data; coverage may be incomplete.</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}

        </MapContainer>


        {/* LOADING */}

        {loading && (

          <div className="absolute top-44 right-4 z-[1000] rounded-lg bg-slate-950/90 border border-slate-700 px-3 py-2 text-white text-xs flex items-center gap-2">

            <RefreshCw className="w-3.5 h-3.5 animate-spin" />

            Syncing intelligence...

          </div>

        )}


        {clustersLoading && (

          <div className="absolute top-56 right-4 z-[1000] rounded-lg bg-slate-950/90 border border-slate-700 px-3 py-2 text-white text-xs flex items-center gap-2">

            <RefreshCw className="w-3.5 h-3.5 animate-spin" />

            Building evidence clusters...

          </div>

        )}

      </div>

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
      {
        selectedFinding &&
        (
          <EvidenceIntelligencePanel
            finding={
              selectedFinding
            }

            relations={
              findingRelations
            }

            loading={
              relationsLoading
            }

            error={
              relationsError
            }

            onRefresh={
              () =>
                void loadFindingRelations(
                  selectedFinding
                )
            }

            onClose={
              () => {

                setSelectedFinding(
                  null
                );


                setFindingRelations(
                  []
                );


                setRelationsError(
                  ""
                );

              }
            }
          />
        )
      }


      {
        selectedCluster &&
        (
          <EvidenceClusterPanel
            cluster={
              selectedCluster
            }

            existingFusionRecommendation={
              selectedClusterFusionRecommendation
            }

            fusionLoading={
              fusionLoading
            }

            fusionError={
              fusionError
            }

            onClose={
              () => {

                setSelectedCluster(
                  null
                );


                setFusionError(
                  ""
                );

              }
            }

            onGenerateFusion={
              () =>
                void handleGenerateFusion(
                  selectedCluster
                )
            }

            onOpenExistingFusion={
              (recommendation) => {

                setSelectedCluster(
                  null
                );


                setFusionError(
                  ""
                );


                setSelectedFusionRecommendation(
                  recommendation
                );

              }
            }

            onOpenFinding={
              (member) => {

                setSelectedCluster(
                  null
                );


                const fullFinding =
                  findings.find(
                    (finding) =>
                      finding.id ===
                      member.id
                  ) ??
                  {
                    ...member,

                    location: {
                      latitude:
                        member.latitude,

                      longitude:
                        member.longitude,
                    },
                  };


                void loadFindingRelations(
                  fullFinding
                );

              }
            }
          />
        )
      }


      {
        selectedFusionRecommendation &&
        (
          <FusionRecommendationPanel
            recommendation={
              selectedFusionRecommendation
            }

            loading={
              fusionLoading
            }

            error={
              fusionError
            }

            onClose={
              () => {

                setSelectedFusionRecommendation(
                  null
                );


                setFusionError(
                  ""
                );

              }
            }

            onReview={
              (payload) =>
                handleReviewFusion(
                  selectedFusionRecommendation.id,
                  payload
                )
            }

            onOpenFinding={
              (findingId) =>
                void handleOpenFusionFinding(
                  findingId
                )
            }
          />
        )
      }
    </div>
  );
}

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
