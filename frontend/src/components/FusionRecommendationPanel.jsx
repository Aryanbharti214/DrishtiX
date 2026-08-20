import React, {
  useState,
} from "react";

import {
  AlertTriangle,
  CheckCircle2,
  GitMerge,
  ShieldCheck,
  Sparkles,
  X,
  XCircle,
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


function statusMeta(
  status
) {
  switch (status) {

    case "APPROVED":
      return {
        className:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",

        label:
          "Approved for Fusion",
      };


    case "REJECTED":
      return {
        className:
          "border-red-500/30 bg-red-500/10 text-red-500",

        label:
          "Rejected",
      };


    default:
      return {
        className:
          "border-amber-500/30 bg-amber-500/10 text-amber-500",

        label:
          "Pending Human Review",
      };
  }
}


export default function FusionRecommendationPanel({
  recommendation,
  loading,
  error,
  onClose,
  onReview,
  onOpenFinding,
}) {

  const [
    reviewerLabel,
    setReviewerLabel,
  ] = useState("");


  const [
    reason,
    setReason,
  ] = useState("");


  const [
    reviewError,
    setReviewError,
  ] = useState("");


  const meta =
    statusMeta(
      recommendation.status
    );


  async function handleReview(
    decision
  ) {

    if (
      reviewerLabel.trim()
        .length < 2
    ) {

      setReviewError(
        "Enter a reviewer label."
      );

      return;
    }


    if (
      decision ===
        "REJECTED"
      &&
      reason.trim()
        .length < 3
    ) {

      setReviewError(
        "A rejection reason is required."
      );

      return;
    }


    setReviewError(
      ""
    );


    await onReview({
      decision,

      reviewerLabel:
        reviewerLabel.trim(),

      reason:
        reason.trim() ||
        undefined,
    });
  }


  return (
    <div
      className="
        fixed
        right-4
        bottom-4
        z-[1400]
        w-[calc(100vw-2rem)]
        sm:w-[470px]
        max-h-[82vh]
        overflow-y-auto
        rounded-xl
        border
        border-[var(--border-color)]
        bg-[var(--bg-primary)]
        shadow-2xl
      "
    >

      <div className="sticky top-0 z-10 bg-[var(--bg-primary)] border-b border-[var(--border-color)] p-4">

        <div className="flex items-start justify-between gap-4">

          <div>

            <div className="flex items-center gap-2">

              <GitMerge className="w-5 h-5 text-cyan-500" />

              <h3 className="font-extrabold text-[var(--text-primary)]">
                Fusion Recommendation
              </h3>

            </div>


            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Human-reviewed synthesis of corroborated evidence
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

        <div
          className={`rounded-xl border p-4 ${meta.className}`}
        >

          <div className="flex items-center gap-2">

            <Sparkles className="w-4 h-4" />

            <p className="font-bold">
              {
                meta.label
              }
            </p>

          </div>

        </div>


        <div className="rounded-xl border border-[var(--border-color)] p-4">

          <p className="text-[10px] uppercase tracking-wide text-cyan-500 font-bold">
            Proposed Finding
          </p>


          <h4 className="font-extrabold text-[var(--text-primary)] mt-2">
            {
              recommendation
                .proposedTitle
            }
          </h4>


          <p className="text-sm text-[var(--text-secondary)] mt-2">
            {
              recommendation
                .proposedDescription
            }
          </p>


          <div className="flex flex-wrap gap-2 mt-4">

            <span className="text-xs border border-[var(--border-color)] rounded px-2 py-1">
              {
                pretty(
                  recommendation
                    .proposedType
                )
              }
            </span>


            <span className="text-xs border border-[var(--border-color)] rounded px-2 py-1">
              {
                recommendation
                  .proposedSeverity
              }
            </span>

          </div>

        </div>


        <div className="grid grid-cols-2 gap-3">

          <div className="rounded-xl border border-[var(--border-color)] p-4">

            <p className="text-[10px] uppercase text-[var(--text-secondary)]">
              Support Strength
            </p>


            <p className="text-2xl font-black text-[var(--text-primary)] mt-1">
              {
                Math.round(
                  recommendation
                    .supportScore *
                  100
                )
              }%
            </p>

          </div>


          <div className="rounded-xl border border-[var(--border-color)] p-4">

            <p className="text-[10px] uppercase text-[var(--text-secondary)]">
              Evidence Count
            </p>


            <p className="text-2xl font-black text-[var(--text-primary)] mt-1">
              {
                recommendation
                  .signals
                  ?.dominantEvidenceCount ??
                "N/A"
              }
            </p>

          </div>

        </div>


        <div className="rounded-xl border border-[var(--border-color)] p-4 space-y-3">

          <p className="font-bold text-sm text-[var(--text-primary)]">
            Why was this proposed?
          </p>


          <div className="text-xs text-[var(--text-secondary)] space-y-2">

            <p>
              Cluster state:{" "}
              <strong>
                {
                  recommendation
                    .signals
                    ?.clusterState
                }
              </strong>
            </p>


            <p>
              Dominant type:{" "}
              <strong>
                {
                  pretty(
                    recommendation
                      .signals
                      ?.dominantType
                  )
                }
              </strong>
            </p>


            <p>
              Trusted supporting evidence:{" "}
              <strong>
                {
                  recommendation
                    .signals
                    ?.trustedEvidenceCount ??
                  0
                }
              </strong>
            </p>


            <p>
              Pending supporting evidence:{" "}
              <strong>
                {
                  recommendation
                    .signals
                    ?.pendingEvidenceCount ??
                  0
                }
              </strong>
            </p>


            <p>
              Source types:{" "}
              <strong>
                {
                  recommendation
                    .signals
                    ?.sourceTypes
                    ?.join(
                      ", "
                    ) ||
                  "N/A"
                }
              </strong>
            </p>

          </div>

        </div>


        <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">

          <p className="text-xs font-bold text-cyan-500">
            Important
          </p>


          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Approval creates a FUSION finding, but that finding remains PENDING and must still pass the normal verification workflow.
          </p>

        </div>


        {
          recommendation.status ===
            "PENDING" &&
          (
            <div className="space-y-3">

              <input
                value={
                  reviewerLabel
                }
                onChange={
                  (event) =>
                    setReviewerLabel(
                      event.target.value
                    )
                }
                placeholder="Reviewer label"
                className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)]"
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
                placeholder="Review reason / notes"
                className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)] resize-none"
              />


              {
                reviewError &&
                (
                  <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-500">
                    {
                      reviewError
                    }
                  </div>
                )
              }


              {
                error &&
                (
                  <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-500">
                    {
                      error
                    }
                  </div>
                )
              }


              <div className="grid grid-cols-2 gap-3">

                <button
                  type="button"
                  disabled={
                    loading
                  }
                  onClick={
                    () =>
                      void handleReview(
                        "REJECTED"
                      )
                  }
                  className="px-4 py-2.5 rounded-lg border border-red-500/30 text-red-500 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >

                  <XCircle className="w-4 h-4" />

                  Reject

                </button>


                <button
                  type="button"
                  disabled={
                    loading
                  }
                  onClick={
                    () =>
                      void handleReview(
                        "APPROVED"
                      )
                  }
                  className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >

                  <CheckCircle2 className="w-4 h-4" />

                  {
                    loading
                      ? "Submitting..."
                      : "Approve Fusion"
                  }

                </button>

              </div>


              <p className="text-[10px] text-[var(--text-secondary)]">
                Reviewer label is audit metadata only. Authentication/authorization is not enforced yet.
              </p>

            </div>
          )
        }


        {
          recommendation.status ===
            "APPROVED" &&
          (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">

              <div className="flex items-center gap-2">

                <ShieldCheck className="w-4 h-4 text-emerald-500" />

                <p className="font-bold text-sm text-[var(--text-primary)]">
                  Fusion promoted
                </p>

              </div>


              <p className="text-xs text-[var(--text-secondary)] mt-2">
                A FUSION finding was created and now requires normal verification.
              </p>


              {
                recommendation
                  .resultingFindingId &&
                (
                  <button
                    type="button"
                    onClick={
                      () =>
                        onOpenFinding(
                          recommendation
                            .resultingFindingId
                        )
                    }
                    className="mt-3 w-full px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold"
                  >
                    Inspect FUSION Finding
                  </button>
                )
              }

            </div>
          )
        }


        {
          recommendation.status ===
            "REJECTED" &&
          (
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">

              <div className="flex items-center gap-2">

                <AlertTriangle className="w-4 h-4 text-red-500" />

                <p className="font-bold text-sm text-[var(--text-primary)]">
                  Recommendation rejected
                </p>

              </div>


              {
                recommendation
                  .reviewReason &&
                (
                  <p className="text-xs text-[var(--text-secondary)] mt-2">
                    {
                      recommendation
                        .reviewReason
                    }
                  </p>
                )
              }

            </div>
          )
        }


        <p className="text-[10px] text-[var(--text-secondary)]">
          Algorithm:{" "}
          {
            recommendation
              .algorithmVersion
          }
        </p>

      </div>

    </div>
  );
}