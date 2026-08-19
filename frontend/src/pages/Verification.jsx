import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  Bot,
  Check,
  CheckCircle2,
  Clock3,
  Edit3,
  History,
  MapPin,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
  UserRound,
  X,
} from "lucide-react";

import {
  getDisasterFindings,
  getFindingVerificationHistory,
  verifyFinding,
} from "../services/api";

import {
  useDisaster,
} from "../context/DisasterContext";


const EMPTY_CORRECTION = {
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


export default function Verification() {
  const {
    currentDisaster,
  } = useDisaster();


  const [
    findings,
    setFindings,
  ] = useState([]);


  const [
    selectedFindingId,
    setSelectedFindingId,
  ] = useState(null);


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
    decisionMode,
    setDecisionMode,
  ] = useState(null);


  const [
    reason,
    setReason,
  ] = useState("");


  const [
    correction,
    setCorrection,
  ] = useState(
    EMPTY_CORRECTION
  );


  const [
    history,
    setHistory,
  ] = useState([]);


  const [
    historyLoading,
    setHistoryLoading,
  ] = useState(false);


  /*
  |--------------------------------------------------------------------------
  | Selected finding
  |--------------------------------------------------------------------------
  */

  const selectedFinding =
    useMemo(
      () =>
        findings.find(
          (finding) =>
            finding.id ===
            selectedFindingId
        ) ?? null,
      [
        findings,
        selectedFindingId,
      ]
    );


  /*
  |--------------------------------------------------------------------------
  | Queue counts
  |--------------------------------------------------------------------------
  */

  const counts =
    useMemo(
      () => ({
        pending:
          findings.filter(
            (finding) =>
              finding.verificationStatus ===
              "PENDING"
          ).length,

        confirmed:
          findings.filter(
            (finding) =>
              finding.verificationStatus ===
              "CONFIRMED"
          ).length,

        corrected:
          findings.filter(
            (finding) =>
              finding.verificationStatus ===
              "CORRECTED"
          ).length,

        rejected:
          findings.filter(
            (finding) =>
              finding.verificationStatus ===
              "REJECTED"
          ).length,
      }),
      [
        findings,
      ]
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
          setSelectedFindingId(
            null
          );

          return;
        }


        try {

          setLoading(true);
          setError("");


          const response =
            await getDisasterFindings(
              currentDisaster.id
            );


          const list =
            response?.data
              ?.findings ?? [];


          setFindings(
            list
          );


          setSelectedFindingId(
            (previous) => {

              if (
                previous &&
                list.some(
                  (finding) =>
                    finding.id ===
                    previous
                )
              ) {
                return previous;
              }


              const pending =
                list.find(
                  (finding) =>
                    finding
                      .verificationStatus ===
                    "PENDING"
                );


              return (
                pending?.id ??
                list[0]?.id ??
                null
              );
            }
          );

        } catch (err) {

          setError(
            err instanceof Error
              ? err.message
              : "Failed to load verification queue"
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
  | Load audit history whenever selection changes
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    let ignore =
      false;


    async function loadHistory() {

      if (
        !selectedFindingId
      ) {
        setHistory([]);
        return;
      }


      try {

        setHistoryLoading(
          true
        );


        const response =
          await getFindingVerificationHistory(
            selectedFindingId
          );


        if (!ignore) {

          setHistory(
            response?.data
              ?.history ?? []
          );

        }

      } catch {

        if (!ignore) {
          setHistory([]);
        }

      } finally {

        if (!ignore) {
          setHistoryLoading(
            false
          );
        }

      }
    }


    void loadHistory();


    return () => {
      ignore = true;
    };

  }, [
    selectedFindingId,
  ]);


  /*
  |--------------------------------------------------------------------------
  | Prepare correction form
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    if (!selectedFinding) {
      return;
    }


    setCorrection({
      type:
        selectedFinding.type ??
        "ROAD_BLOCKAGE",

      severity:
        selectedFinding.severity ??
        "MODERATE",

      title:
        selectedFinding.title ??
        "",

      description:
        selectedFinding.description ??
        "",

      latitude:
        selectedFinding.location
          ?.latitude ??
        "",

      longitude:
        selectedFinding.location
          ?.longitude ??
        "",
    });


    setReason("");
    setDecisionMode(null);

  }, [
    selectedFindingId,
  ]);


  /*
  |--------------------------------------------------------------------------
  | Replace one finding with server response
  |--------------------------------------------------------------------------
  */

  function updateFinding(
    updated
  ) {

    setFindings(
      (previous) =>
        previous.map(
          (finding) =>
            finding.id ===
            updated.id
              ? updated
              : finding
        )
    );

  }


  /*
  |--------------------------------------------------------------------------
  | Confirm
  |--------------------------------------------------------------------------
  */

  async function handleConfirm() {

    if (!selectedFinding) {
      return;
    }


    try {

      setSubmitting(true);
      setError("");
      setSuccessMessage("");


      const response =
        await verifyFinding(
          selectedFinding.id,
          {
            decision:
              "CONFIRMED",

            reviewerLabel:
              "NDRF-2026",

            reason:
              reason.trim() ||
              undefined,
          }
        );


      const updated =
        response?.data
          ?.finding;


      if (!updated) {
        throw new Error(
          "Backend did not return verified finding."
        );
      }


      updateFinding(
        updated
      );


      setHistory(
        (previous) => [
          response.data
            .verification,

          ...previous,
        ]
      );


      setSuccessMessage(
        "Finding confirmed and audit event recorded."
      );


      setDecisionMode(
        null
      );

      setReason("");

    } catch (err) {

      setError(
        err instanceof Error
          ? err.message
          : "Unable to confirm finding"
      );

    } finally {

      setSubmitting(false);

    }
  }


  /*
  |--------------------------------------------------------------------------
  | Reject
  |--------------------------------------------------------------------------
  */

  async function handleReject() {

    if (
      !selectedFinding
    ) {
      return;
    }


    if (
      reason.trim().length <
      3
    ) {
      setError(
        "A rejection reason is required."
      );

      return;
    }


    try {

      setSubmitting(true);
      setError("");
      setSuccessMessage("");


      const response =
        await verifyFinding(
          selectedFinding.id,
          {
            decision:
              "REJECTED",

            reviewerLabel:
              "NDRF-2026",

            reason:
              reason.trim(),
          }
        );


      const updated =
        response?.data
          ?.finding;


      if (!updated) {
        throw new Error(
          "Backend did not return rejected finding."
        );
      }


      updateFinding(
        updated
      );


      setHistory(
        (previous) => [
          response.data
            .verification,

          ...previous,
        ]
      );


      setSuccessMessage(
        "Finding rejected and preserved in the audit history."
      );


      setDecisionMode(
        null
      );

      setReason("");

    } catch (err) {

      setError(
        err instanceof Error
          ? err.message
          : "Unable to reject finding"
      );

    } finally {

      setSubmitting(false);

    }
  }


  /*
  |--------------------------------------------------------------------------
  | Correct
  |--------------------------------------------------------------------------
  */

  async function handleCorrect() {

    if (
      !selectedFinding
    ) {
      return;
    }


    if (
      reason.trim().length <
      3
    ) {

      setError(
        "Explain why the finding is being corrected."
      );

      return;
    }


    try {

      setSubmitting(true);
      setError("");
      setSuccessMessage("");


      const corrected = {
        type:
          correction.type,

        severity:
          correction.severity,

        title:
          correction.title
            .trim(),

        description:
          correction.description
            .trim() ||
          undefined,
      };


      if (
        correction.latitude !==
          "" &&
        correction.longitude !==
          ""
      ) {

        corrected.latitude =
          Number(
            correction.latitude
          );


        corrected.longitude =
          Number(
            correction.longitude
          );

      }


      const response =
        await verifyFinding(
          selectedFinding.id,
          {
            decision:
              "CORRECTED",

            reviewerLabel:
              "NDRF-2026",

            reason:
              reason.trim(),

            corrected,
          }
        );


      const updated =
        response?.data
          ?.finding;


      if (!updated) {
        throw new Error(
          "Backend did not return corrected finding."
        );
      }


      updateFinding(
        updated
      );


      setHistory(
        (previous) => [
          response.data
            .verification,

          ...previous,
        ]
      );


      setSuccessMessage(
        "Human correction applied while original values were preserved in the audit trail."
      );


      setDecisionMode(
        null
      );

      setReason("");

    } catch (err) {

      setError(
        err instanceof Error
          ? err.message
          : "Unable to correct finding"
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


  function confidenceText(
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


  function statusClasses(
    status
  ) {

    switch (status) {

      case "CONFIRMED":
        return "text-emerald-500 bg-emerald-500/10 border-emerald-500/30";


      case "CORRECTED":
        return "text-amber-500 bg-amber-500/10 border-amber-500/30";


      case "REJECTED":
        return "text-red-500 bg-red-500/10 border-red-500/30";


      default:
        return "text-sky-500 bg-sky-500/10 border-sky-500/30";

    }
  }


  return (
    <div className="space-y-6">


      {/* HEADER */}

      <div className="flex flex-wrap items-start justify-between gap-4">

        <div>

          <div className="flex items-center gap-2">

            <ShieldCheck className="w-5 h-5 text-emerald-500" />

            <h2 className="text-xl font-extrabold text-[var(--text-primary)]">
              Human Verification Command
            </h2>

          </div>


          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Review, correct, or reject intelligence before downstream prioritization.
          </p>

        </div>


        <button
          type="button"
          onClick={
            loadFindings
          }
          disabled={
            loading ||
            !currentDisaster
          }
          className="px-4 py-2 rounded-lg border border-[var(--border-color)] flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]"
        >

          <RefreshCw
            className={`w-4 h-4 ${
              loading
                ? "animate-spin"
                : ""
            }`}
          />

          Refresh Queue

        </button>

      </div>


      {/* SUMMARY */}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

        <QueueCard
          label="Pending"
          value={
            counts.pending
          }
          className="text-sky-500"
        />

        <QueueCard
          label="Confirmed"
          value={
            counts.confirmed
          }
          className="text-emerald-500"
        />

        <QueueCard
          label="Corrected"
          value={
            counts.corrected
          }
          className="text-amber-500"
        />

        <QueueCard
          label="Rejected"
          value={
            counts.rejected
          }
          className="text-red-500"
        />

      </div>


      {error && (

        <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 text-sm flex gap-2">

          <TriangleAlert className="w-4 h-4" />

          {error}

        </div>

      )}


      {successMessage && (

        <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-sm flex gap-2">

          <CheckCircle2 className="w-4 h-4" />

          {successMessage}

        </div>

      )}


      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-5">


        {/* QUEUE */}

        <div className="theme-card rounded-xl border border-[var(--border-color)] overflow-hidden">

          <div className="p-4 border-b border-[var(--border-color)]">

            <h3 className="font-bold text-[var(--text-primary)]">
              Review Queue
            </h3>

            <p className="text-xs text-[var(--text-secondary)] mt-1">
              {findings.length} findings
            </p>

          </div>


          <div className="max-h-[720px] overflow-y-auto">

            {findings.length === 0 ? (

              <div className="p-10 text-center">

                <AlertTriangle className="w-8 h-8 mx-auto text-[var(--text-muted)] mb-2" />

                <p className="text-sm text-[var(--text-secondary)]">
                  No findings available.
                </p>

              </div>

            ) : (

              findings.map(
                (finding) => (

                  <button
                    type="button"
                    key={
                      finding.id
                    }
                    onClick={() =>
                      setSelectedFindingId(
                        finding.id
                      )
                    }
                    className={`w-full text-left p-4 border-b border-[var(--border-color)] transition-colors ${
                      selectedFindingId ===
                      finding.id
                        ? "bg-orange-500/10"
                        : "hover:bg-[var(--bg-card-hover)]"
                    }`}
                  >

                    <div className="flex items-center gap-2">

                      {
                        finding.source ===
                        "AI"
                          ? (
                            <Bot className="w-4 h-4 text-violet-500" />
                          )
                          : (
                            <UserRound className="w-4 h-4 text-emerald-500" />
                          )
                      }


                      <span className="font-bold text-sm text-[var(--text-primary)] truncate">
                        {
                          finding.title ??
                          prettyType(
                            finding.type
                          )
                        }
                      </span>

                    </div>


                    <div className="mt-2 flex justify-between gap-2">

                      <span className="text-[10px] text-[var(--text-muted)]">
                        {
                          prettyType(
                            finding.type
                          )
                        }
                      </span>


                      <span
                        className={`text-[9px] px-2 py-0.5 rounded border font-bold ${statusClasses(
                          finding.verificationStatus
                        )}`}
                      >
                        {
                          finding.verificationStatus
                        }
                      </span>

                    </div>

                  </button>

                )
              )

            )}

          </div>

        </div>


        {/* DETAIL */}

        {!selectedFinding ? (

          <div className="theme-card rounded-xl border border-[var(--border-color)] flex items-center justify-center min-h-[500px]">

            <p className="text-[var(--text-secondary)]">
              Select a finding to review.
            </p>

          </div>

        ) : (

          <div className="space-y-5">


            <div className="theme-card rounded-xl border border-[var(--border-color)] p-6 space-y-5">


              {/* TITLE */}

              <div className="flex flex-wrap justify-between gap-4">

                <div>

                  <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-muted)]">
                    Finding Review
                  </p>

                  <h3 className="text-xl font-extrabold text-[var(--text-primary)] mt-1">
                    {
                      selectedFinding.title ??
                      prettyType(
                        selectedFinding.type
                      )
                    }
                  </h3>

                </div>


                <span
                  className={`h-fit text-xs px-3 py-1.5 rounded-lg border font-bold ${statusClasses(
                    selectedFinding.verificationStatus
                  )}`}
                >
                  {
                    selectedFinding.verificationStatus
                  }
                </span>

              </div>


              {/* INTELLIGENCE */}

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

                <DetailCard
                  label="Source"
                  value={
                    selectedFinding.source
                  }
                />

                <DetailCard
                  label="Type"
                  value={
                    prettyType(
                      selectedFinding.type
                    )
                  }
                />

                <DetailCard
                  label="Severity"
                  value={
                    selectedFinding.severity ??
                    "UNKNOWN"
                  }
                />

                <DetailCard
                  label="Confidence"
                  value={
                    confidenceText(
                      selectedFinding.confidence
                    )
                  }
                />

              </div>


              {selectedFinding.description && (

                <p className="text-sm text-[var(--text-secondary)]">
                  {
                    selectedFinding.description
                  }
                </p>

              )}


              {selectedFinding.location
                ?.latitude !== null &&
                selectedFinding.location
                  ?.latitude !== undefined &&
                selectedFinding.location
                  ?.longitude !== null &&
                selectedFinding.location
                  ?.longitude !== undefined && (

                  <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">

                    <MapPin className="w-4 h-4 text-orange-500" />

                    {
                      Number(
                        selectedFinding.location.latitude
                      ).toFixed(6)
                    }

                    ,

                    {" "}

                    {
                      Number(
                        selectedFinding.location.longitude
                      ).toFixed(6)
                    }

                  </div>

                )}


              {/* ACTIONS */}

              <div className="border-t border-[var(--border-color)] pt-5">

                <p className="text-xs font-bold text-[var(--text-primary)] mb-3">
                  Human Decision
                </p>


                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                  <button
                    type="button"
                    onClick={() =>
                      setDecisionMode(
                        "CONFIRM"
                      )
                    }
                    className="py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2"
                  >

                    <Check className="w-4 h-4" />

                    Confirm

                  </button>


                  <button
                    type="button"
                    onClick={() =>
                      setDecisionMode(
                        "CORRECT"
                      )
                    }
                    className="py-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm flex items-center justify-center gap-2"
                  >

                    <Edit3 className="w-4 h-4" />

                    Correct

                  </button>


                  <button
                    type="button"
                    onClick={() =>
                      setDecisionMode(
                        "REJECT"
                      )
                    }
                    className="py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-sm flex items-center justify-center gap-2"
                  >

                    <X className="w-4 h-4" />

                    Reject

                  </button>

                </div>

              </div>


              {/* CONFIRM */}

              {decisionMode ===
                "CONFIRM" && (

                <DecisionPanel
                  title="Confirm Finding"
                  reason={
                    reason
                  }
                  setReason={
                    setReason
                  }
                  buttonText={
                    submitting
                      ? "Confirming..."
                      : "Confirm Finding"
                  }
                  submitting={
                    submitting
                  }
                  onSubmit={
                    handleConfirm
                  }
                />

              )}


              {/* REJECT */}

              {decisionMode ===
                "REJECT" && (

                <DecisionPanel
                  title="Reject Finding"
                  reason={
                    reason
                  }
                  setReason={
                    setReason
                  }
                  buttonText={
                    submitting
                      ? "Rejecting..."
                      : "Reject Finding"
                  }
                  submitting={
                    submitting
                  }
                  required
                  onSubmit={
                    handleReject
                  }
                />

              )}


              {/* CORRECTION */}

              {decisionMode ===
                "CORRECT" && (

                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-4">

                  <h4 className="font-bold text-amber-500">
                    Human Correction
                  </h4>


                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">


                    <select
                      value={
                        correction.type
                      }
                      onChange={
                        (event) =>
                          setCorrection(
                            (previous) => ({
                              ...previous,

                              type:
                                event.target.value,
                            })
                          )
                      }
                      className="px-3 py-2.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)]"
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
                      value={
                        correction.severity
                      }
                      onChange={
                        (event) =>
                          setCorrection(
                            (previous) => ({
                              ...previous,

                              severity:
                                event.target.value,
                            })
                          )
                      }
                      className="px-3 py-2.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)]"
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
                      value={
                        correction.title
                      }
                      onChange={
                        (event) =>
                          setCorrection(
                            (previous) => ({
                              ...previous,

                              title:
                                event.target.value,
                            })
                          )
                      }
                      placeholder="Corrected title"
                      className="md:col-span-2 px-3 py-2.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)]"
                    />


                    <input
                      type="number"
                      step="any"
                      value={
                        correction.latitude
                      }
                      onChange={
                        (event) =>
                          setCorrection(
                            (previous) => ({
                              ...previous,

                              latitude:
                                event.target.value,
                            })
                          )
                      }
                      placeholder="Latitude"
                      className="px-3 py-2.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)]"
                    />


                    <input
                      type="number"
                      step="any"
                      value={
                        correction.longitude
                      }
                      onChange={
                        (event) =>
                          setCorrection(
                            (previous) => ({
                              ...previous,

                              longitude:
                                event.target.value,
                            })
                          )
                      }
                      placeholder="Longitude"
                      className="px-3 py-2.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)]"
                    />


                    <textarea
                      rows={3}
                      value={
                        correction.description
                      }
                      onChange={
                        (event) =>
                          setCorrection(
                            (previous) => ({
                              ...previous,

                              description:
                                event.target.value,
                            })
                          )
                      }
                      placeholder="Corrected description"
                      className="md:col-span-2 px-3 py-2.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)] resize-none"
                    />


                    <textarea
                      rows={3}
                      value={
                        reason
                      }
                      onChange={
                        (event) =>
                          setReason(
                            event.target.value
                          )
                      }
                      placeholder="Why is this correction required?"
                      className="md:col-span-2 px-3 py-2.5 rounded-lg bg-[var(--bg-main)] border border-amber-500/40 text-[var(--text-primary)] resize-none"
                    />

                  </div>


                  <button
                    type="button"
                    onClick={
                      handleCorrect
                    }
                    disabled={
                      submitting
                    }
                    className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-sm"
                  >

                    {
                      submitting
                        ? "Applying Correction..."
                        : "Apply Human Correction"
                    }

                  </button>

                </div>

              )}

            </div>


            {/* AUDIT HISTORY */}

            <div className="theme-card rounded-xl border border-[var(--border-color)] p-5">

              <div className="flex items-center gap-2 mb-4">

                <History className="w-4 h-4 text-cyan-500" />

                <h3 className="font-bold text-[var(--text-primary)]">
                  Verification Audit Trail
                </h3>

              </div>


              {historyLoading ? (

                <p className="text-sm text-[var(--text-secondary)]">
                  Loading audit history...
                </p>

              ) : history.length === 0 ? (

                <p className="text-sm text-[var(--text-secondary)]">
                  No verification events recorded yet.
                </p>

              ) : (

                <div className="space-y-3">

                  {history.map(
                    (entry) => (

                      <div
                        key={
                          entry.id
                        }
                        className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] p-4"
                      >

                        <div className="flex justify-between gap-3">

                          <span className="font-bold text-sm text-[var(--text-primary)]">
                            {
                              entry.decision
                            }
                          </span>


                          <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">

                            <Clock3 className="w-3 h-3" />

                            {
                              new Date(
                                entry.createdAt
                              ).toLocaleString(
                                "en-IN"
                              )
                            }

                          </span>

                        </div>


                        {entry.reviewerLabel && (

                          <p className="text-xs text-[var(--text-secondary)] mt-2">
                            Reviewer:{" "}
                            {
                              entry.reviewerLabel
                            }
                          </p>

                        )}


                        {entry.reason && (

                          <p className="text-xs text-[var(--text-secondary)] mt-1">
                            Reason:{" "}
                            {
                              entry.reason
                            }
                          </p>

                        )}

                      </div>

                    )
                  )}

                </div>

              )}

            </div>

          </div>

        )}

      </div>

    </div>
  );
}


function QueueCard({
  label,
  value,
  className,
}) {
  return (
    <div className="theme-card rounded-xl border border-[var(--border-color)] p-4">

      <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-bold">
        {label}
      </p>

      <p className={`text-2xl font-black mt-2 ${className}`}>
        {value}
      </p>

    </div>
  );
}


function DetailCard({
  label,
  value,
}) {
  return (
    <div className="rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] p-3">

      <p className="text-[9px] uppercase tracking-widest text-[var(--text-muted)]">
        {label}
      </p>

      <p className="text-sm font-bold text-[var(--text-primary)] mt-1">
        {value}
      </p>

    </div>
  );
}


function DecisionPanel({
  title,
  reason,
  setReason,
  onSubmit,
  submitting,
  buttonText,
  required = false,
}) {
  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] p-5 space-y-3">

      <h4 className="font-bold text-[var(--text-primary)]">
        {title}
      </h4>


      <textarea
        rows={3}
        value={
          reason
        }
        onChange={
          (event) =>
            setReason(
              event.target.value
            )
        }
        placeholder={
          required
            ? "Reason required..."
            : "Optional responder note..."
        }
        className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] resize-none"
      />


      <button
        type="button"
        onClick={
          onSubmit
        }
        disabled={
          submitting
        }
        className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-lg font-bold text-sm"
      >
        {buttonText}
      </button>

    </div>
  );
}