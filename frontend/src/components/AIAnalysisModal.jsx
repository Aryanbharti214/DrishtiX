import React, {
  useEffect,
} from "react";

import {
  BrainCircuit,
  Building2,
  CheckCircle2,
  Clock3,
  Route,
  ShieldAlert,
  Waves,
  X,
} from "lucide-react";

import {
  getAssetUrl,
} from "../services/api";


function getPriorityClasses(
  level
) {

  switch (
    String(
      level ?? ""
    ).toLowerCase()
  ) {

    case "critical":
      return (
        "border-red-500/30 " +
        "bg-red-500/10 " +
        "text-red-500"
      );

    case "high":
      return (
        "border-orange-500/30 " +
        "bg-orange-500/10 " +
        "text-orange-500"
      );

    case "medium":
      return (
        "border-amber-500/30 " +
        "bg-amber-500/10 " +
        "text-amber-500"
      );

    case "low":
    default:
      return (
        "border-emerald-500/30 " +
        "bg-emerald-500/10 " +
        "text-emerald-500"
      );
  }
}


function formatNumber(
  value
) {

  const number =
    Number(value);


  if (
    !Number.isFinite(
      number
    )
  ) {

    return "0";
  }


  return number.toFixed(
    2
  );
}


function MetricCard({
  icon:
    Icon,

  label,

  value,

  detail,
}) {

  return (
    <div
      className="
        rounded-xl
        border
        border-[var(--border-color)]
        bg-[var(--bg-main)]
        p-4
      "
    >

      <div
        className="
          flex
          items-center
          gap-2
        "
      >

        <Icon
          className="
            w-4
            h-4
            text-sky-500
          "
        />

        <p
          className="
            text-[10px]
            font-bold
            uppercase
            tracking-widest
            text-[var(--text-muted)]
          "
        >
          {label}
        </p>

      </div>


      <p
        className="
          mt-3
          text-xl
          font-extrabold
          text-[var(--text-primary)]
        "
      >
        {value}
      </p>


      {detail && (

        <p
          className="
            mt-1
            text-xs
            text-[var(--text-secondary)]
          "
        >
          {detail}
        </p>

      )}

    </div>
  );
}


export default function AIAnalysisModal({
  imagery,
  record,
  onClose,
}) {

  /*
  |--------------------------------------------------------------------------
  | Escape key
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {

      function handleKeyDown(
        event
      ) {

        if (
          event.key ===
          "Escape"
        ) {

          onClose();
        }
      }


      window.addEventListener(
        "keydown",
        handleKeyDown
      );


      return () => {

        window.removeEventListener(
          "keydown",
          handleKeyDown
        );
      };

    },
    [
      onClose,
    ]
  );


  if (
    !record ||
    !imagery
  ) {

    return null;
  }


  const analysis =
    record.analysis ?? {};


  const priority =
    analysis.priority ?? {};


  const impact =
    priority.impact ?? {};


  const components =
    priority.components ?? {};


  const segmentationSummary =
    Array.isArray(
      analysis.segmentationSummary
    )
      ? analysis.segmentationSummary
      : [];


  const findings =
    Array.isArray(
      analysis.findings
    )
      ? analysis.findings
      : [];


  const originalImageUrl =
    getAssetUrl(
      imagery.imageUrl
    );


  const overlayImageUrl =
    getAssetUrl(
      analysis.resultImage
    );

  const satellite = analysis.satelliteAnalysis;

  if (satellite) {
    const beforeImageUrl = getAssetUrl(satellite.beforeImage);
    const isComparison = satellite.mode === "BEFORE_AFTER";
    const isFallback = satellite.mode === "AFTER_IMAGE_FALLBACK";
    const impactLevel = satellite.impactLevel ?? satellite.floodConcern ?? "Unknown";
    const suggestedPriority = satellite.suggestedPriority;
    const unavailable = "Unable to estimate reliably";
    const waterValue = satellite.visibleWater == null ? unavailable : `${formatNumber(satellite.visibleWater)}%`;
    const waterIncrease = satellite.waterIncrease == null ? unavailable : `${formatNumber(satellite.waterIncrease)}%`;
    const action = isComparison
      ? "Review the detected river and terrain-corridor changes and verify affected areas."
      : satellite.impactCue
        ? "Review the visible impact area and verify conditions with responder reports."
        : "Review the satellite assessment and verify visible conditions before dispatch.";
    const evidence = isComparison
      ? [`${formatNumber(satellite.areaChanged)}% of the comparable area shows significant change`, satellite.summary, satellite.waterIncrease == null ? "Water increase could not be estimated reliably" : `Visible water increased by ${waterIncrease}`]
      : [satellite.summary, satellite.impactCue ? `${satellite.impactCue} detected` : `Visible water: ${waterValue}`];
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
        <div className="w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-2xl">
          <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[var(--border-color)] bg-[var(--bg-card)] p-5">
            <div><div className="flex items-center gap-2"><BrainCircuit className="h-5 w-5 text-violet-500" /><h2 className="text-lg font-extrabold text-[var(--text-primary)]">Satellite AI Assessment</h2></div><p className="mt-1 text-xs text-[var(--text-secondary)]">{imagery.originalFilename}</p></div>
            <button type="button" onClick={onClose} className="rounded-lg border border-[var(--border-color)] p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"><X className="h-5 w-5" /></button>
          </div>
          <div className="space-y-6 p-5">
            {isFallback && <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm leading-6 text-[var(--text-secondary)]">The Before and After images could not be matched reliably because their views are too different. Direct change measurement is unavailable. The After image was assessed separately.</div>}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
              <div className={`rounded-xl border p-5 ${getPriorityClasses(impactLevel === "MODERATE" ? "medium" : impactLevel)}`}>
                <p className="text-[10px] font-bold uppercase tracking-widest">Response Priority</p>
                <p className="mt-3 text-4xl font-black">{suggestedPriority ?? "—"}</p>
                <p className="mt-2 text-sm font-bold uppercase">{impactLevel}</p>
              </div>
              <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] p-5">
                <div className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-orange-500" /><h3 className="font-bold text-[var(--text-primary)]">Recommended Action</h3></div>
                <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{action}</p>
                <div className="mt-4 space-y-2">{evidence.filter(Boolean).map((item, index) => <div key={`${item}-${index}`} className="flex items-start gap-2 text-xs leading-5 text-[var(--text-secondary)]"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /><span>{item}</span></div>)}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {isComparison ? <><SimpleMetric label="Area Changed" value={`${formatNumber(satellite.areaChanged)}%`} /><SimpleMetric label="Water Increase" value={waterIncrease} /></> : <SimpleMetric label="Visible Water" value={waterValue} />}
              <SimpleMetric label={isComparison || isFallback || satellite.impactCue ? "Impact Level" : "Flood Concern"} value={impactLevel} />
              <SimpleMetric label="AI Confidence" value={satellite.aiConfidence ?? "Unknown"} />
              {!isComparison && <SimpleMetric label="Impact Cue" value={satellite.impactCue ?? "No strong cue"} />}
            </div>
            <div>
              <div className="mb-3"><h3 className="font-bold text-[var(--text-primary)]">Visual Assessment</h3><p className="mt-1 text-xs text-[var(--text-secondary)]">{isComparison ? "Before and after satellite imagery compared with the detected disaster-impact changes." : isFallback ? "Original comparison imagery and the available After-image impact assessment." : "Original satellite imagery compared with the available AI visualization."}</p></div>
              <div className={`grid grid-cols-1 gap-4 ${(isComparison || isFallback) ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
                {(isComparison || isFallback) && <ImagePanel label="Before" url={beforeImageUrl} alt="Before satellite image" />}
                <ImagePanel label={(isComparison || isFallback) ? "After" : "Original"} url={originalImageUrl} alt="Satellite image" />
                <ImagePanel label={isComparison ? "Change View" : "Impact Segmentation"} url={overlayImageUrl} alt="Satellite analysis result" analyzed />
              </div>
            </div>
            <p className="text-xs text-[var(--text-muted)]">Suggested Priority is advisory. Satellite AI findings remain pending until responder verification.</p>
          </div>
        </div>
      </div>
    );
  }


  return (

    <div
      className="
        fixed
        inset-0
        z-[100]
        flex
        items-center
        justify-center
        bg-black/70
        p-4
      "
      onMouseDown={
        (
          event
        ) => {

          if (
            event.target ===
            event.currentTarget
          ) {

            onClose();
          }
        }
      }
    >

      <div
        className="
          w-full
          max-w-6xl
          max-h-[92vh]
          overflow-y-auto
          rounded-2xl
          border
          border-[var(--border-color)]
          bg-[var(--bg-card)]
          shadow-2xl
        "
      >

        {/* ============================================================= */}
        {/* HEADER                                                        */}
        {/* ============================================================= */}

        <div
          className="
            sticky
            top-0
            z-10
            flex
            items-start
            justify-between
            gap-4
            border-b
            border-[var(--border-color)]
            bg-[var(--bg-card)]
            p-5
          "
        >

          <div>

            <div
              className="
                flex
                items-center
                gap-2
              "
            >

              <BrainCircuit
                className="
                  w-5
                  h-5
                  text-violet-500
                "
              />

              <h2
                className="
                  text-lg
                  font-extrabold
                  text-[var(--text-primary)]
                "
              >
                AI Disaster Assessment
              </h2>

            </div>


            <p
              className="
                mt-1
                text-xs
                text-[var(--text-secondary)]
              "
            >
              {imagery.originalFilename}
            </p>

          </div>


          <button
            type="button"
            onClick={
              onClose
            }
            className="
              rounded-lg
              border
              border-[var(--border-color)]
              p-2
              text-[var(--text-secondary)]
              hover:bg-[var(--bg-card-hover)]
              hover:text-[var(--text-primary)]
            "
          >

            <X
              className="
                w-5
                h-5
              "
            />

          </button>

        </div>


        <div
          className="
            space-y-6
            p-5
          "
        >

          {/* =========================================================== */}
          {/* PRIORITY                                                    */}
          {/* =========================================================== */}

          <div
            className="
              grid
              grid-cols-1
              lg:grid-cols-[220px_1fr]
              gap-4
            "
          >

            <div
              className={`
                rounded-xl
                border
                p-5
                ${getPriorityClasses(
                  priority.level
                )}
              `}
            >

              <p
                className="
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-widest
                "
              >
                Response Priority
              </p>


              <p
                className="
                  mt-3
                  text-4xl
                  font-black
                "
              >
                {
                  priority.responsePriority ??
                  "—"
                }
              </p>


              <p
                className="
                  mt-2
                  text-sm
                  font-bold
                  uppercase
                "
              >
                {
                  priority.level ??
                  "Unknown"
                }
              </p>


              <p
                className="
                  mt-4
                  text-3xl
                  font-black
                "
              >
                {
                  formatNumber(
                    priority.score
                  )
                }
                <span
                  className="
                    text-sm
                    font-semibold
                  "
                >
                  /100
                </span>
              </p>

            </div>


            <div
              className="
                rounded-xl
                border
                border-[var(--border-color)]
                bg-[var(--bg-main)]
                p-5
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-2
                "
              >

                <ShieldAlert
                  className="
                    w-5
                    h-5
                    text-orange-500
                  "
                />

                <h3
                  className="
                    font-bold
                    text-[var(--text-primary)]
                  "
                >
                  Recommended Action
                </h3>

              </div>


              <p
                className="
                  mt-3
                  text-sm
                  leading-6
                  text-[var(--text-secondary)]
                "
              >
                {
                  priority.recommendedAction ??
                  "No recommendation available."
                }
              </p>


              {
                Array.isArray(
                  priority.reasons
                ) &&
                priority.reasons.length >
                  0 && (

                  <div
                    className="
                      mt-4
                      space-y-2
                    "
                  >

                    {
                      priority.reasons.map(
                        (
                          reason,
                          index
                        ) => (

                          <div
                            key={
                              `${reason}-${index}`
                            }
                            className="
                              flex
                              items-start
                              gap-2
                              text-xs
                              text-[var(--text-secondary)]
                            "
                          >

                            <CheckCircle2
                              className="
                                mt-0.5
                                w-3.5
                                h-3.5
                                flex-shrink-0
                                text-emerald-500
                              "
                            />

                            <span>
                              {reason}
                            </span>

                          </div>

                        )
                      )
                    }

                  </div>

                )
              }

            </div>

          </div>


          {/* =========================================================== */}
          {/* IMPACT METRICS                                              */}
          {/* =========================================================== */}

          <div
            className="
              grid
              grid-cols-1
              sm:grid-cols-2
              lg:grid-cols-4
              gap-4
            "
          >

            <MetricCard
              icon={
                Building2
              }
              label="Building Impact"
              value={
                impact.buildings ??
                "none"
              }
              detail={
                `${formatNumber(
                  components.buildingImpact
                )} impact score`
              }
            />


            <MetricCard
              icon={
                Route
              }
              label="Road Impact"
              value={
                impact.roads ??
                "none"
              }
              detail={
                `${formatNumber(
                  components.roadImpact
                )} impact score`
              }
            />


            <MetricCard
              icon={
                Waves
              }
              label="Water Extent"
              value={
                impact.water ??
                "none"
              }
              detail={
                `${formatNumber(
                  components.waterExtent
                )} impact score`
              }
            />


            <MetricCard
              icon={
                Clock3
              }
              label="Processing"
              value={
                `${formatNumber(
                  record.processingTimeMs
                )} ms`
              }
              detail={
                record.modelName ??
                analysis.model?.name ??
                "AI model"
              }
            />

          </div>


          {/* =========================================================== */}
          {/* ORIGINAL + SEGMENTATION                                     */}
          {/* =========================================================== */}

          <div>

            <div
              className="
                mb-3
              "
            >

              <h3
                className="
                  font-bold
                  text-[var(--text-primary)]
                "
              >
                Visual Assessment
              </h3>


              <p
                className="
                  mt-1
                  text-xs
                  text-[var(--text-secondary)]
                "
              >
                Original imagery compared with the
                FloodNet semantic segmentation result.
              </p>

            </div>


            <div
              className="
                grid
                grid-cols-1
                lg:grid-cols-2
                gap-4
              "
            >

              <div
                className="
                  overflow-hidden
                  rounded-xl
                  border
                  border-[var(--border-color)]
                  bg-[var(--bg-main)]
                "
              >

                <div
                  className="
                    border-b
                    border-[var(--border-color)]
                    px-4
                    py-3
                  "
                >

                  <p
                    className="
                      text-xs
                      font-bold
                      text-[var(--text-primary)]
                    "
                  >
                    Original
                  </p>

                </div>


                <img
                  src={
                    originalImageUrl
                  }
                  alt="Original disaster imagery"
                  className="
                    w-full
                    h-[360px]
                    object-contain
                    bg-black
                  "
                />

              </div>


              <div
                className="
                  overflow-hidden
                  rounded-xl
                  border
                  border-[var(--border-color)]
                  bg-[var(--bg-main)]
                "
              >

                <div
                  className="
                    border-b
                    border-[var(--border-color)]
                    px-4
                    py-3
                  "
                >

                  <p
                    className="
                      text-xs
                      font-bold
                      text-[var(--text-primary)]
                    "
                  >
                    Semantic Segmentation
                  </p>

                </div>


                {
                  overlayImageUrl
                    ? (

                      <img
                        src={
                          overlayImageUrl
                        }
                        alt="AI semantic segmentation"
                        className="
                          w-full
                          h-[360px]
                          object-contain
                          bg-black
                        "
                      />

                    )
                    : (

                      <div
                        className="
                          flex
                          h-[360px]
                          items-center
                          justify-center
                          text-sm
                          text-[var(--text-muted)]
                        "
                      >
                        Visualization unavailable
                      </div>

                    )
                }

              </div>

            </div>

          </div>


          {/* =========================================================== */}
          {/* SEGMENTATION SUMMARY                                        */}
          {/* =========================================================== */}

          <div
            className="
              rounded-xl
              border
              border-[var(--border-color)]
              bg-[var(--bg-main)]
              p-5
            "
          >

            <h3
              className="
                font-bold
                text-[var(--text-primary)]
              "
            >
              Semantic Coverage
            </h3>


            <p
              className="
                mt-1
                text-xs
                text-[var(--text-secondary)]
              "
            >
              Percentage of image pixels classified
              into each FloodNet semantic class.
            </p>


            <div
              className="
                mt-5
                space-y-4
              "
            >

              {
                segmentationSummary.length >
                0
                  ? segmentationSummary.map(
                      (
                        item
                      ) => (

                        <div
                          key={
                            `${item.type}-${item.prediction?.class_id}`
                          }
                        >

                          <div
                            className="
                              mb-1
                              flex
                              items-center
                              justify-between
                              gap-4
                            "
                          >

                            <div>

                              <p
                                className="
                                  text-sm
                                  font-semibold
                                  text-[var(--text-primary)]
                                "
                              >
                                {item.type}
                              </p>


                              <p
                                className="
                                  text-[10px]
                                  text-[var(--text-muted)]
                                "
                              >
                                {
                                  item.pixelCount
                                    ?.toLocaleString?.() ??
                                  item.pixelCount
                                } pixels
                              </p>

                            </div>


                            <p
                              className="
                                text-sm
                                font-bold
                                text-[var(--text-primary)]
                              "
                            >
                              {
                                formatNumber(
                                  item.areaPercentage
                                )
                              }
                              %
                            </p>

                          </div>


                          <div
                            className="
                              h-2
                              overflow-hidden
                              rounded-full
                              bg-[var(--border-color)]
                            "
                          >

                            <div
                              className="
                                h-full
                                rounded-full
                                bg-sky-500
                              "
                              style={{
                                width:
                                  `${Math.min(
                                    100,
                                    Math.max(
                                      0,
                                      Number(
                                        item.areaPercentage
                                      ) || 0
                                    )
                                  )}%`,
                              }}
                            />

                          </div>

                        </div>

                      )
                    )
                  : (

                    <p
                      className="
                        text-sm
                        text-[var(--text-muted)]
                      "
                    >
                      No semantic classes were returned.
                    </p>

                  )
              }

            </div>

          </div>


          {/* =========================================================== */}
          {/* ACTIONABLE FINDINGS                                         */}
          {/* =========================================================== */}

          <div
            className="
              rounded-xl
              border
              border-[var(--border-color)]
              bg-[var(--bg-main)]
              p-5
            "
          >

            <div
              className="
                flex
                items-center
                justify-between
                gap-4
              "
            >

              <h3
                className="
                  font-bold
                  text-[var(--text-primary)]
                "
              >
                Actionable Findings
              </h3>


              <span
                className="
                  rounded-full
                  border
                  border-[var(--border-color)]
                  px-2.5
                  py-1
                  text-[10px]
                  font-bold
                  text-[var(--text-secondary)]
                "
              >
                {findings.length}
              </span>

            </div>


            {
              findings.length ===
              0
                ? (

                  <div
                    className="
                      mt-4
                      rounded-lg
                      border
                      border-emerald-500/20
                      bg-emerald-500/10
                      p-4
                    "
                  >

                    <p
                      className="
                        text-sm
                        font-semibold
                        text-emerald-500
                      "
                    >
                      No flooded building or road
                      finding was generated for this
                      image.
                    </p>

                  </div>

                )
                : (

                  <div
                    className="
                      mt-4
                      grid
                      grid-cols-1
                      md:grid-cols-2
                      gap-3
                    "
                  >

                    {
                      findings.map(
                        (
                          finding,
                          index
                        ) => (

                          <div
                            key={
                              `${finding.type}-${index}`
                            }
                            className="
                              rounded-lg
                              border
                              border-[var(--border-color)]
                              p-4
                            "
                          >

                            <div
                              className="
                                flex
                                items-start
                                justify-between
                                gap-3
                              "
                            >

                              <p
                                className="
                                  text-sm
                                  font-bold
                                  text-[var(--text-primary)]
                                "
                              >
                                {
                                  finding.title ??
                                  finding.type
                                }
                              </p>


                              <span
                                className="
                                  rounded
                                  border
                                  border-orange-500/30
                                  bg-orange-500/10
                                  px-2
                                  py-1
                                  text-[9px]
                                  font-bold
                                  text-orange-500
                                "
                              >
                                {
                                  finding.severity ??
                                  "UNKNOWN"
                                }
                              </span>

                            </div>


                            {
                              finding.description && (

                                <p
                                  className="
                                    mt-2
                                    text-xs
                                    leading-5
                                    text-[var(--text-secondary)]
                                  "
                                >
                                  {
                                    finding.description
                                  }
                                </p>

                              )
                            }

                          </div>

                        )
                      )
                    }

                  </div>

                )
            }

          </div>


          {/* =========================================================== */}
          {/* MODEL METADATA                                              */}
          {/* =========================================================== */}

          <div
            className="
              flex
              flex-wrap
              items-center
              justify-between
              gap-3
              rounded-xl
              border
              border-[var(--border-color)]
              bg-[var(--bg-main)]
              px-4
              py-3
              text-xs
              text-[var(--text-secondary)]
            "
          >

            <span>
              Model:{" "}
              <strong
                className="
                  text-[var(--text-primary)]
                "
              >
                {
                  record.modelName ??
                  analysis.model?.name ??
                  "Unknown"
                }
              </strong>
            </span>


            <span>
              Version:{" "}
              <strong
                className="
                  text-[var(--text-primary)]
                "
              >
                {
                  record.modelVersion ??
                  analysis.model?.version ??
                  "Unknown"
                }
              </strong>
            </span>


            <span>
              Run ID:{" "}
              <strong
                className="
                  text-[var(--text-primary)]
                "
              >
                {
                  record.aiRunId ??
                  "Unknown"
                }
              </strong>
            </span>

          </div>

        </div>

      </div>

    </div>
  );
}

function ImagePanel({ label, url, alt, analyzed = false }) {
  return <div className={`satellite-image-panel overflow-hidden rounded-xl border bg-[var(--bg-main)] ${analyzed ? "satellite-image-panel--analyzed border-cyan-500/40" : "border-[var(--border-color)]"}`}><div className="flex items-center justify-between gap-3 border-b border-[var(--border-color)] px-4 py-3"><p className="text-xs font-bold text-[var(--text-primary)]">{label}</p>{analyzed && <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[9px] font-extrabold uppercase tracking-widest text-cyan-500">AI Processed</span>}</div>{url ? <div className={`satellite-image-stage ${analyzed ? "satellite-image-stage--analyzed" : ""}`}><img src={url} alt={alt} className="satellite-analysis-image aspect-video w-full object-contain" /></div> : <div className="flex aspect-video items-center justify-center text-sm text-[var(--text-muted)]">Visualization unavailable</div>}</div>;
}

function SimpleMetric({ label, value }) {
  return <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] p-4"><p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{label}</p><p className="mt-3 text-xl font-extrabold text-[var(--text-primary)]">{value}</p></div>;
}
