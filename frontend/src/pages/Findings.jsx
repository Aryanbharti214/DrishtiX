import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Filter,
  MapPin,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Shield,
  TriangleAlert,
  UserRound,
} from "lucide-react";

import {
  createManualFinding,
  getDisasterFindings,
} from "../services/api";

import {
  useDisaster,
} from "../context/DisasterContext";


const INITIAL_FORM = {
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


export default function Findings() {
  const {
    currentDisaster,
  } = useDisaster();


  const [
    findings,
    setFindings,
  ] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
    submitting,
    setSubmitting,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");


  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");


  const [
    severityFilter,
    setSeverityFilter,
  ] = useState("ALL");


  const [
    sourceFilter,
    setSourceFilter,
  ] = useState("ALL");


  const [
    showCreateForm,
    setShowCreateForm,
  ] = useState(false);


  const [
    form,
    setForm,
  ] = useState(
    INITIAL_FORM
  );


  /*
  |--------------------------------------------------------------------------
  | Load findings
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
              : "Failed to load findings"
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
  | Create manual responder finding
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


  async function handleSubmit(
    event
  ) {
    event.preventDefault();


    if (
      !currentDisaster?.id
    ) {
      setError(
        "Select a disaster first."
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


      setForm(
        INITIAL_FORM
      );


      setShowCreateForm(
        false
      );


      setSuccessMessage(
        "Responder finding created and queued for verification."
      );

    } catch (err) {

      setError(
        err instanceof Error
          ? err.message
          : "Failed to create finding"
      );

    } finally {

      setSubmitting(false);

    }
  }


  /*
  |--------------------------------------------------------------------------
  | Filtering
  |--------------------------------------------------------------------------
  */

  const filteredFindings =
    useMemo(
      () => {

        const normalizedSearch =
          searchTerm
            .trim()
            .toLowerCase();


        return findings.filter(
          (finding) => {

            const matchesSeverity =
              severityFilter ===
                "ALL" ||
              finding.severity ===
                severityFilter;


            const matchesSource =
              sourceFilter ===
                "ALL" ||
              finding.source ===
                sourceFilter;


            const searchable =
              [
                finding.id,
                finding.title,
                finding.description,
                finding.type,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


            const matchesSearch =
              normalizedSearch ===
                "" ||
              searchable.includes(
                normalizedSearch
              );


            return (
              matchesSeverity &&
              matchesSource &&
              matchesSearch
            );
          }
        );

      },
      [
        findings,
        searchTerm,
        severityFilter,
        sourceFilter,
      ]
    );


  /*
  |--------------------------------------------------------------------------
  | Helpers
  |--------------------------------------------------------------------------
  */

  function prettyType(
    type
  ) {
    return type
      ?.replaceAll(
        "_",
        " "
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


  function getSeverityClasses(
    severity
  ) {
    switch (severity) {

      case "CRITICAL":
        return (
          "bg-red-500/10 " +
          "text-red-500 " +
          "border-red-500/30"
        );


      case "SEVERE":
        return (
          "bg-orange-500/10 " +
          "text-orange-500 " +
          "border-orange-500/30"
        );


      case "MODERATE":
        return (
          "bg-amber-500/10 " +
          "text-amber-500 " +
          "border-amber-500/30"
        );


      default:
        return (
          "bg-sky-500/10 " +
          "text-sky-500 " +
          "border-sky-500/30"
        );
    }
  }


  function SourceIcon({
    source,
  }) {
    if (
      source === "AI"
    ) {
      return (
        <Bot className="w-4 h-4 text-violet-500" />
      );
    }


    if (
      source === "FUSION"
    ) {
      return (
        <Radio className="w-4 h-4 text-cyan-500" />
      );
    }


    return (
      <UserRound className="w-4 h-4 text-emerald-500" />
    );
  }


  return (
    <div className="space-y-6">


      {/* HEADER */}

      <div className="flex flex-wrap items-start justify-between gap-4">

        <div>

          <div className="flex items-center gap-2">

            <Shield className="w-5 h-5 text-orange-500" />


            <h2 className="text-xl font-extrabold text-[var(--text-primary)]">
              Disaster Intelligence Findings
            </h2>

          </div>


          <p className="text-sm text-[var(--text-secondary)] mt-1">

            AI-assisted and responder-reported
            operational findings for{" "}

            <span className="font-semibold">
              {
                currentDisaster?.name ??
                "no selected disaster"
              }
            </span>.

          </p>

        </div>


        <div className="flex gap-2">

          <button
            type="button"
            onClick={
              loadFindings
            }
            disabled={
              loading ||
              !currentDisaster
            }
            className="px-4 py-2 rounded-lg border border-[var(--border-color)] text-sm font-semibold flex items-center gap-2"
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
            onClick={() =>
              setShowCreateForm(
                (value) =>
                  !value
              )
            }
            className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-sm font-bold flex items-center gap-2"
          >

            <Plus className="w-4 h-4" />

            Report Finding

          </button>

        </div>

      </div>


      {/* MESSAGES */}

      {error && (

        <div className="flex gap-2 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 text-sm">

          <TriangleAlert className="w-4 h-4 mt-0.5" />

          {error}

        </div>

      )}


      {successMessage && (

        <div className="flex gap-2 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-sm">

          <CheckCircle2 className="w-4 h-4 mt-0.5" />

          {successMessage}

        </div>

      )}


      {/* MANUAL REPORT FORM */}

      {showCreateForm && (

        <form
          onSubmit={
            handleSubmit
          }
          className="theme-card rounded-xl border border-orange-500/30 p-5 space-y-4"
        >

          <h3 className="font-bold text-[var(--text-primary)]">
            Report Operational Finding
          </h3>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">


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
              placeholder="Finding title"
              className="md:col-span-2 px-4 py-2.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)]"
            />


            <input
              name="latitude"
              type="number"
              step="any"
              required
              min="-90"
              max="90"
              value={
                form.latitude
              }
              onChange={
                handleChange
              }
              placeholder="Latitude"
              className="px-4 py-2.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)]"
            />


            <input
              name="longitude"
              type="number"
              step="any"
              required
              min="-180"
              max="180"
              value={
                form.longitude
              }
              onChange={
                handleChange
              }
              placeholder="Longitude"
              className="px-4 py-2.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)]"
            />


            <textarea
              name="description"
              rows={3}
              value={
                form.description
              }
              onChange={
                handleChange
              }
              placeholder="Operational description / responder observations"
              className="md:col-span-2 px-4 py-2.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)] resize-none"
            />

          </div>


          <button
            disabled={
              submitting
            }
            type="submit"
            className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-lg font-bold text-sm"
          >

            {
              submitting
                ? "Reporting..."
                : "Create Finding"
            }

          </button>

        </form>

      )}


      {/* FILTERS */}

      <div className="theme-card rounded-xl border border-[var(--border-color)] p-4 flex flex-wrap gap-3">

        <div className="relative flex-1 min-w-[240px]">

          <Search className="absolute left-3 top-3 w-4 h-4 text-[var(--text-muted)]" />

          <input
            value={
              searchTerm
            }
            onChange={
              (event) =>
                setSearchTerm(
                  event.target.value
                )
            }
            placeholder="Search findings..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)]"
          />

        </div>


        <div className="flex items-center gap-2">

          <Filter className="w-4 h-4 text-[var(--text-muted)]" />


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
            className="px-3 py-2.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)]"
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
            className="px-3 py-2.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)]"
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

        </div>

      </div>


      {/* FINDING CARDS */}

      {loading ? (

        <div className="py-20 text-center text-[var(--text-secondary)]">
          Loading findings...
        </div>

      ) : filteredFindings.length === 0 ? (

        <div className="theme-card rounded-xl border border-[var(--border-color)] py-20 text-center">

          <AlertTriangle className="w-10 h-10 mx-auto text-[var(--text-muted)] mb-3" />

          <p className="font-semibold text-[var(--text-primary)]">
            No findings for this view
          </p>

          <p className="text-sm text-[var(--text-secondary)] mt-1">
            AI findings will appear here when a disaster-specific model is connected,
            or responders can report field observations manually.
          </p>

        </div>

      ) : (

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

          {filteredFindings.map(
            (finding) => (

              <article
                key={
                  finding.id
                }
                className="theme-card rounded-xl border border-[var(--border-color)] p-5 space-y-4"
              >

                <div className="flex justify-between gap-3">

                  <div>

                    <div className="flex flex-wrap items-center gap-2">

                      <SourceIcon
                        source={
                          finding.source
                        }
                      />

                      <span className="text-[10px] uppercase tracking-wider font-bold text-[var(--text-muted)]">
                        {
                          finding.source
                        }
                      </span>

                      <span
                        className={`text-[9px] px-2 py-0.5 rounded border font-bold ${getSeverityClasses(
                          finding.severity
                        )}`}
                      >
                        {
                          finding.severity ??
                          "UNKNOWN"
                        }
                      </span>

                    </div>


                    <h3 className="font-bold text-[var(--text-primary)] mt-2">
                      {
                        finding.title ??
                        prettyType(
                          finding.type
                        )
                      }
                    </h3>


                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      {
                        prettyType(
                          finding.type
                        )
                      }
                    </p>

                  </div>


                  <span className="text-[10px] px-2 py-1 h-fit rounded bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-secondary)]">
                    {
                      finding.verificationStatus
                    }
                  </span>

                </div>


                {finding.description && (

                  <p className="text-sm text-[var(--text-secondary)]">
                    {
                      finding.description
                    }
                  </p>

                )}


                <div className="grid grid-cols-2 gap-3 text-xs">

                  <div className="rounded-lg bg-[var(--bg-main)] p-3">

                    <p className="text-[var(--text-muted)]">
                      Confidence
                    </p>

                    <p className="font-bold text-[var(--text-primary)] mt-1">
                      {
                        formatConfidence(
                          finding.confidence
                        )
                      }
                    </p>

                  </div>


                  <div className="rounded-lg bg-[var(--bg-main)] p-3">

                    <p className="text-[var(--text-muted)]">
                      Verification
                    </p>

                    <p className="font-bold text-[var(--text-primary)] mt-1">
                      {
                        finding.verificationStatus
                      }
                    </p>

                  </div>

                </div>


                {
                  finding.location
                    ?.latitude !==
                    null &&
                  finding.location
                    ?.latitude !==
                    undefined &&
                  finding.location
                    ?.longitude !==
                    null &&
                  finding.location
                    ?.longitude !==
                    undefined && (

                    <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">

                      <MapPin className="w-4 h-4 text-orange-500" />

                      {
                        Number(
                          finding.location.latitude
                        ).toFixed(5)
                      }

                      ,

                      {
                        " "
                      }

                      {
                        Number(
                          finding.location.longitude
                        ).toFixed(5)
                      }

                    </div>

                  )
                }


                <p className="text-[10px] font-mono text-[var(--text-muted)] break-all">
                  ID: {finding.id}
                </p>

              </article>

            )
          )}

        </div>

      )}

    </div>
  );
}