import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  CalendarDays,
  Camera,
  CheckCircle2,
  Image as ImageIcon,
  MapPin,
  RefreshCw,
  Satellite,
  ScanSearch,
  TriangleAlert,
  Upload,
} from "lucide-react";

import {
  analyzeImagery,
  getAssetUrl,
  getDisasterImagery,
  getImageryAnalysis,
  uploadImagery,
} from "../services/api";
import AIAnalysisModal
  from "../components/AIAnalysisModal";
import {
  useDisaster,
} from "../context/DisasterContext";


const MAX_FILE_SIZE =
  20 * 1024 * 1024;

const ALLOWED_TYPES =
  new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);


export default function Imagery() {
  const {
    currentDisaster,
  } = useDisaster();


  /*
  |--------------------------------------------------------------------------
  | Refs
  |--------------------------------------------------------------------------
  */

  const fileInputRef =
    useRef(null);


  /*
  |--------------------------------------------------------------------------
  | Upload state
  |--------------------------------------------------------------------------
  */

  const [
    selectedFile,
    setSelectedFile,
  ] = useState(null);

  const [
    previewUrl,
    setPreviewUrl,
  ] = useState("");

  const [
    sourceType,
    setSourceType,
  ] = useState("DRONE");

  const [
    latitude,
    setLatitude,
  ] = useState("");

  const [
    longitude,
    setLongitude,
  ] = useState("");

  const [
    capturedAt,
    setCapturedAt,
  ] = useState("");


  /*
  |--------------------------------------------------------------------------
  | Imagery state
  |--------------------------------------------------------------------------
  */

  const [
    imagery,
    setImagery,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    uploading,
    setUploading,
  ] = useState(false);

  const [
    analyzingId,
    setAnalyzingId,
  ] = useState(null);

  const [
    analysisLoadingId,
    setAnalysisLoadingId,
  ] = useState(null);


  const [
    selectedAnalysis,
    setSelectedAnalysis,
  ] = useState(null);


  const [
    selectedAnalysisImagery,
    setSelectedAnalysisImagery,
  ] = useState(null);
  /*
  |--------------------------------------------------------------------------
  | UI state
  |--------------------------------------------------------------------------
  */

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
  | Selected image preview
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl("");
      return;
    }

    const objectUrl =
      URL.createObjectURL(
        selectedFile
      );

    setPreviewUrl(
      objectUrl
    );

    return () => {
      URL.revokeObjectURL(
        objectUrl
      );
    };
  }, [selectedFile]);


  /*
  |--------------------------------------------------------------------------
  | Load imagery
  |--------------------------------------------------------------------------
  */

  const loadImagery =
    useCallback(
      async () => {
        if (
          !currentDisaster?.id
        ) {
          setImagery([]);
          return;
        }

        try {
          setLoading(true);
          setError("");

          const response =
            await getDisasterImagery(
              currentDisaster.id
            );

          setImagery(
            response?.data
              ?.imagery ?? []
          );
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load imagery"
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
    void loadImagery();
  }, [loadImagery]);


  /*
  |--------------------------------------------------------------------------
  | File selection
  |--------------------------------------------------------------------------
  */

  function handleFileChange(
    event
  ) {
    setError("");
    setSuccessMessage("");

    const file =
      event.target.files?.[0];

    if (!file) {
      setSelectedFile(null);
      return;
    }


    if (
      !ALLOWED_TYPES.has(
        file.type
      )
    ) {
      setSelectedFile(null);

      event.target.value = "";

      setError(
        "Only JPEG, PNG and WebP images are allowed."
      );

      return;
    }


    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      setSelectedFile(null);

      event.target.value = "";

      setError(
        "Image size must not exceed 20MB."
      );

      return;
    }


    setSelectedFile(
      file
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Upload imagery
  |--------------------------------------------------------------------------
  */

  async function handleUpload(
    event
  ) {
    event.preventDefault();


    if (
      !currentDisaster?.id
    ) {
      setError(
        "Create or select a disaster event before uploading imagery."
      );

      return;
    }


    if (!selectedFile) {
      setError(
        "Please select an image."
      );

      return;
    }


    try {
      setUploading(true);

      setError("");
      setSuccessMessage("");


      const formData =
        new FormData();


      formData.append(
        "image",
        selectedFile
      );


      formData.append(
        "disasterId",
        currentDisaster.id
      );


      formData.append(
        "sourceType",
        sourceType
      );


      /*
       * Optional metadata
       */

      if (
        latitude.trim() !== ""
      ) {
        formData.append(
          "latitude",
          latitude.trim()
        );
      }


      if (
        longitude.trim() !== ""
      ) {
        formData.append(
          "longitude",
          longitude.trim()
        );
      }


      if (
        capturedAt !== ""
      ) {
        formData.append(
          "capturedAt",
          capturedAt
        );
      }


      const response =
        await uploadImagery(
          formData
        );


      const createdImagery =
        response?.data?.imagery;


      if (!createdImagery) {
        throw new Error(
          "Backend did not return uploaded imagery."
        );
      }


      /*
       * Add uploaded image immediately
       * instead of performing another GET.
       */

      setImagery(
        (previous) => [
          createdImagery,
          ...previous,
        ]
      );


      setSuccessMessage(
        `${createdImagery.originalFilename} uploaded successfully. You can now run AI analysis.`
      );


      /*
       * Reset upload form
       */

      setSelectedFile(null);
      setSourceType("DRONE");
      setLatitude("");
      setLongitude("");
      setCapturedAt("");


      if (
        fileInputRef.current
      ) {
        fileInputRef.current.value =
          "";
      }

    } catch (err) {

      setError(
        err instanceof Error
          ? err.message
          : "Imagery upload failed"
      );

    } finally {

      setUploading(false);

    }
  }


  /*
  |--------------------------------------------------------------------------
  | Run AI analysis
  |--------------------------------------------------------------------------
  */

  async function handleAnalyze(
    item
  ) {
    if (
      item.processingStatus !==
      "UPLOADED" &&
      item.processingStatus !==
      "FAILED"
    ) {
      return;
    }


    if (analyzingId) {
      return;
    }


    const previousStatus =
      item.processingStatus;


    try {
      setAnalyzingId(
        item.id
      );


      setError("");
      setSuccessMessage("");


      /*
       * Optimistically show processing
       * while Express waits for FastAPI.
       */

      setImagery(
        (previous) =>
          previous.map(
            (current) =>
              current.id ===
                item.id
                ? {
                  ...current,

                  processingStatus:
                    "PROCESSING",
                }
                : current
          )
      );


      const response =
        await analyzeImagery(
          item.id
        );


      const result =
        response?.data;


      const updatedImagery =
        result?.imagery;


      if (!updatedImagery) {
        throw new Error(
          "Backend did not return analyzed imagery."
        );
      }


      setImagery(
        (previous) =>
          previous.map(
            (current) =>
              current.id ===
                updatedImagery.id
                ? updatedImagery
                : current
          )
      );


      const detectionCount =
        result?.detectionCount ??
        0;


      const findingsCreated =
        result?.findingsCreated ??
        0;


      setSuccessMessage(
        `AI analysis complete: ${detectionCount} raw detection${detectionCount === 1
          ? ""
          : "s"
        }, ${findingsCreated} disaster finding${findingsCreated === 1
          ? ""
          : "s"
        }.`
      );

    } catch (err) {
      /*
       * Backend should normally have
       * persisted FAILED already.
       *
       * Refresh the authoritative state.
       */

      try {
        if (
          currentDisaster?.id
        ) {
          const response =
            await getDisasterImagery(
              currentDisaster.id
            );


          setImagery(
            response?.data
              ?.imagery ?? []
          );
        }

      } catch {
        setImagery(
          (previous) =>
            previous.map(
              (current) =>
                current.id ===
                  item.id
                  ? {
                    ...current,

                    processingStatus:
                      previousStatus,
                  }
                  : current
            )
        );
      }


      setError(
        err instanceof Error
          ? err.message
          : "AI analysis failed"
      );

    } finally {
      setAnalyzingId(
        null
      );
    }
  }


  async function handleViewAnalysis(
    item
  ) {

    if (
      item.processingStatus !==
      "ANALYZED"
    ) {

      return;
    }


    try {

      setAnalysisLoadingId(
        item.id
      );

      setError(
        ""
      );


      const response =
        await getImageryAnalysis(
          item.id
        );


      const analysisRecord =
        response?.data?.analysis;


      if (
        !analysisRecord
      ) {

        throw new Error(
          "Backend did not return AI analysis."
        );
      }


      setSelectedAnalysisImagery(
        item
      );

      setSelectedAnalysis(
        analysisRecord
      );

    } catch (err) {

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load AI analysis"
      );

    } finally {

      setAnalysisLoadingId(
        null
      );
    }
  }

  async function refreshImagery() {
    setSuccessMessage("");

    await loadImagery();
  }


  /*
  |--------------------------------------------------------------------------
  | Formatting helpers
  |--------------------------------------------------------------------------
  */

  function formatBytes(
    bytes
  ) {
    if (
      bytes === null ||
      bytes === undefined
    ) {
      return "Unknown size";
    }


    if (bytes < 1024) {
      return `${bytes} B`;
    }


    const kb =
      bytes / 1024;


    if (kb < 1024) {
      return `${kb.toFixed(
        1
      )} KB`;
    }


    const mb =
      kb / 1024;


    return `${mb.toFixed(
      1
    )} MB`;
  }


  function formatDate(
    value
  ) {
    if (!value) {
      return "Not specified";
    }


    return new Intl
      .DateTimeFormat(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",

          hour: "2-digit",
          minute: "2-digit",
        }
      )
      .format(
        new Date(value)
      );
  }

  function getStatusClasses(
    status
  ) {
    switch (status) {

      case "ANALYZED":
        return (
          "bg-emerald-500/10 " +
          "text-emerald-500 " +
          "border-emerald-500/30"
        );


      case "PROCESSING":
        return (
          "bg-violet-500/10 " +
          "text-violet-500 " +
          "border-violet-500/30"
        );


      case "QUEUED":
        return (
          "bg-amber-500/10 " +
          "text-amber-500 " +
          "border-amber-500/30"
        );


      case "FAILED":
        return (
          "bg-red-500/10 " +
          "text-red-500 " +
          "border-red-500/30"
        );


      case "UPLOADED":
      default:
        return (
          "bg-sky-500/10 " +
          "text-sky-500 " +
          "border-sky-500/30"
        );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="space-y-6">


      {/* PAGE HEADER */}

      <div className="flex flex-wrap items-start justify-between gap-4">

        <div>

          <div className="flex items-center gap-2">

            <Satellite className="w-5 h-5 text-sky-500" />

            <h2 className="text-xl font-extrabold tracking-wide text-[var(--text-primary)]">
              Drone & Satellite Imagery
            </h2>

          </div>


          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Upload operational imagery and run AI-assisted analysis
            for the selected disaster event.
          </p>

        </div>


        <button
          type="button"
          onClick={
            refreshImagery
          }
          disabled={
            loading ||
            !currentDisaster
          }
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
        >

          <RefreshCw
            className={`w-4 h-4 ${loading
              ? "animate-spin"
              : ""
              }`}
          />

          Refresh

        </button>

      </div>


      {/* CURRENT DISASTER */}

      <div className="theme-card rounded-xl border border-[var(--border-color)] p-4">

        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          Upload Target
        </p>


        {currentDisaster ? (

          <div className="mt-2">

            <p className="font-bold text-[var(--text-primary)]">
              {
                currentDisaster.name
              }
            </p>

            <p className="text-xs text-[var(--text-secondary)] mt-1">
              {
                currentDisaster.regionName ||
                "Region not specified"
              }
            </p>

          </div>

        ) : (

          <p className="mt-2 text-sm text-orange-500">
            No disaster selected.
            Select one from Disaster Events first.
          </p>

        )}

      </div>


      {/* ERROR */}

      {error && (

        <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">

          <TriangleAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />

          <span>
            {error}
          </span>

        </div>

      )}


      {/* SUCCESS */}

      {successMessage && (

        <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-500">

          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />

          <span>
            {successMessage}
          </span>

        </div>

      )}


      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">


        {/* ============================================================= */}
        {/* UPLOAD PANEL                                                  */}
        {/* ============================================================= */}

        <form
          onSubmit={
            handleUpload
          }
          className="xl:col-span-1 theme-card rounded-xl border border-[var(--border-color)] p-5 space-y-5"
        >

          <div>

            <h3 className="font-bold text-[var(--text-primary)]">
              Upload Imagery
            </h3>

            <p className="text-xs text-[var(--text-secondary)] mt-1">
              JPEG, PNG or WebP, maximum 20MB.
            </p>

          </div>


          {/* FILE INPUT */}

          <div>

            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">
              Image *
            </label>


            <label className="block cursor-pointer">

              <input
                ref={
                  fileInputRef
                }
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={
                  handleFileChange
                }
                className="hidden"
              />


              <div className="border-2 border-dashed border-[var(--border-color)] hover:border-sky-500 rounded-xl p-6 text-center transition-colors">

                <Upload className="w-8 h-8 mx-auto text-sky-500" />


                <p className="text-sm font-semibold text-[var(--text-primary)] mt-3">
                  Select image
                </p>


                <p className="text-xs text-[var(--text-muted)] mt-1">
                  JPEG, PNG, WebP ≤ 20MB
                </p>

              </div>

            </label>

          </div>


          {/* PREVIEW */}

          {previewUrl && (

            <div className="space-y-2">

              <img
                src={
                  previewUrl
                }
                alt="Selected upload preview"
                className="w-full h-48 object-cover rounded-lg border border-[var(--border-color)]"
              />


              <p className="text-xs text-[var(--text-secondary)] break-all">
                {
                  selectedFile?.name
                }
              </p>


              <p className="text-[11px] text-[var(--text-muted)]">
                {
                  formatBytes(
                    selectedFile?.size
                  )
                }
              </p>

            </div>

          )}


          {/* SOURCE TYPE */}

          <div>

            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">
              Source Type *
            </label>


            <select
              value={
                sourceType
              }
              onChange={
                (event) =>
                  setSourceType(
                    event.target.value
                  )
              }
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)] outline-none focus:border-sky-500"
            >

              <option value="DRONE">
                Drone
              </option>

              <option value="SATELLITE">
                Satellite
              </option>

              <option value="STREET">
                Street / Ground
              </option>

            </select>

          </div>


          {/* LATITUDE */}

          <div>

            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">
              Latitude
            </label>


            <div className="relative">

              <MapPin className="absolute left-3 top-3 w-4 h-4 text-[var(--text-muted)]" />


              <input
                type="number"
                step="any"
                min="-90"
                max="90"
                value={
                  latitude
                }
                onChange={
                  (event) =>
                    setLatitude(
                      event.target.value
                    )
                }
                placeholder="20.2961"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)] outline-none focus:border-sky-500"
              />

            </div>

          </div>


          {/* LONGITUDE */}

          <div>

            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">
              Longitude
            </label>


            <div className="relative">

              <MapPin className="absolute left-3 top-3 w-4 h-4 text-[var(--text-muted)]" />


              <input
                type="number"
                step="any"
                min="-180"
                max="180"
                value={
                  longitude
                }
                onChange={
                  (event) =>
                    setLongitude(
                      event.target.value
                    )
                }
                placeholder="85.8245"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)] outline-none focus:border-sky-500"
              />

            </div>

          </div>


          {/* CAPTURED AT */}

          <div>

            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">
              Captured At
            </label>


            <div className="relative">

              <CalendarDays className="absolute left-3 top-3 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />


              <input
                type="datetime-local"
                value={
                  capturedAt
                }
                onChange={
                  (event) =>
                    setCapturedAt(
                      event.target.value
                    )
                }
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)] outline-none focus:border-sky-500"
              />

            </div>

          </div>


          {/* UPLOAD BUTTON */}

          <button
            type="submit"
            disabled={
              uploading ||
              !currentDisaster ||
              !selectedFile
            }
            className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >

            {uploading ? (

              <RefreshCw className="w-4 h-4 animate-spin" />

            ) : (

              <Upload className="w-4 h-4" />

            )}


            {
              uploading
                ? "Uploading..."
                : "Upload Imagery"
            }

          </button>

        </form>


        {/* ============================================================= */}
        {/* IMAGERY LIBRARY                                               */}
        {/* ============================================================= */}

        <div className="xl:col-span-2 theme-card rounded-xl border border-[var(--border-color)] p-5">


          <div className="flex items-center justify-between gap-4 mb-5">

            <div>

              <h3 className="font-bold text-[var(--text-primary)]">
                Imagery Library
              </h3>


              <p className="text-xs text-[var(--text-secondary)] mt-1">
                {imagery.length} uploaded image
                {
                  imagery.length === 1
                    ? ""
                    : "s"
                }
              </p>

            </div>


            <ImageIcon className="w-5 h-5 text-sky-500" />

          </div>


          {loading ? (

            <div className="py-20 text-center text-sm text-[var(--text-secondary)]">

              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-sky-500" />

              Loading imagery...

            </div>

          ) : !currentDisaster ? (

            <div className="py-20 text-center">

              <TriangleAlert className="w-8 h-8 mx-auto text-orange-500 mb-3" />

              <p className="text-sm text-[var(--text-secondary)]">
                Select a disaster event first.
              </p>

            </div>

          ) : imagery.length === 0 ? (

            <div className="py-20 text-center">

              <Camera className="w-9 h-9 mx-auto text-[var(--text-muted)] mb-3" />

              <p className="text-sm font-semibold text-[var(--text-primary)]">
                No imagery uploaded
              </p>

              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Upload the first operational image for this disaster.
              </p>

            </div>

          ) : (

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              {imagery.map(
                (item) => {

                  const isThisAnalyzing =
                    analyzingId ===
                    item.id;


                  const analysisBusy =
                    item.processingStatus ===
                    "QUEUED" ||
                    item.processingStatus ===
                    "PROCESSING";


                  const canAnalyze =
                    item.processingStatus ===
                    "UPLOADED" ||
                    item.processingStatus ===
                    "FAILED";


                  return (

                    <article
                      key={
                        item.id
                      }
                      className="rounded-xl overflow-hidden border border-[var(--border-color)] bg-[var(--bg-main)]"
                    >


                      {/* IMAGE */}

                      <img
                        src={
                          getAssetUrl(
                            item.imageUrl
                          )
                        }
                        alt={
                          item.originalFilename
                        }
                        className="w-full h-52 object-cover"
                      />


                      <div className="p-4 space-y-4">


                        {/* FILE + STATUS */}

                        <div className="flex items-start justify-between gap-3">

                          <div className="min-w-0">

                            <p className="font-bold text-sm text-[var(--text-primary)] truncate">
                              {
                                item.originalFilename
                              }
                            </p>


                            <p className="text-[11px] text-[var(--text-muted)] mt-1">

                              {
                                item.sourceType
                              }

                              {" • "}

                              {
                                formatBytes(
                                  item.sizeBytes
                                )
                              }

                            </p>

                          </div>


                          <span
                            className={`text-[9px] font-bold px-2 py-1 rounded border whitespace-nowrap ${getStatusClasses(
                              item.processingStatus
                            )}`}
                          >
                            {
                              item.processingStatus
                            }
                          </span>

                        </div>


                        {/* METADATA */}

                        <div className="space-y-1 text-xs text-[var(--text-secondary)]">

                          <p>
                            Uploaded:{" "}
                            {
                              formatDate(
                                item.createdAt
                              )
                            }
                          </p>


                          <p>
                            Captured:{" "}
                            {
                              formatDate(
                                item.capturedAt
                              )
                            }
                          </p>


                          {
                            item.location
                              ?.latitude !==
                            null &&
                            item.location
                              ?.latitude !==
                            undefined &&
                            item.location
                              ?.longitude !==
                            null &&
                            item.location
                              ?.longitude !==
                            undefined && (

                              <p className="flex items-center gap-1">

                                <MapPin className="w-3 h-3" />

                                {
                                  item.location.latitude
                                }

                                {", "}

                                {
                                  item.location.longitude
                                }

                              </p>

                            )
                          }

                        </div>


                        {/* ================================================= */}
                        {/* ANALYSIS ACTIONS                                  */}
                        {/* ================================================= */}


                        {canAnalyze && (

                          <button
                            type="button"
                            onClick={
                              () =>
                                handleAnalyze(
                                  item
                                )
                            }
                            disabled={
                              analyzingId !==
                              null
                            }
                            className="w-full py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                          >

                            {isThisAnalyzing ? (

                              <RefreshCw className="w-4 h-4 animate-spin" />

                            ) : (

                              <ScanSearch className="w-4 h-4" />

                            )}


                            {
                              isThisAnalyzing
                                ? "Analyzing..."
                                : item.processingStatus ===
                                  "FAILED"
                                  ? "Retry AI Analysis"
                                  : "Run AI Analysis"
                            }

                          </button>

                        )}


                        {/* PROCESSING */}

                        {analysisBusy && (
                          <div className="flex items-center justify-center gap-2 rounded-lg border border-violet-500/20 bg-violet-500/10 py-2.5 text-xs font-semibold text-violet-500">

                            <RefreshCw className="w-4 h-4 animate-spin" />

                            AI analysis in progress...

                          </div>
                        )}


                        {/* ANALYZED */}

                        {item.processingStatus ===
                          "ANALYZED" && (

                            <div
                              className="
        space-y-2
      "
                            >

                              <div
                                className="
          flex
          items-center
          justify-center
          gap-2
          rounded-lg
          border
          border-emerald-500/20
          bg-emerald-500/10
          py-2.5
          text-xs
          font-semibold
          text-emerald-500
        "
                              >

                                <CheckCircle2
                                  className="
            w-4
            h-4
          "
                                />

                                AI analysis completed

                              </div>


                              <button
                                type="button"
                                onClick={
                                  () =>
                                    handleViewAnalysis(
                                      item
                                    )
                                }
                                disabled={
                                  analysisLoadingId !==
                                  null
                                }
                                className="
          w-full
          py-2.5
          rounded-lg
          border
          border-violet-500/30
          bg-violet-500/10
          hover:bg-violet-500/20
          text-violet-500
          text-xs
          font-bold
          flex
          items-center
          justify-center
          gap-2
          transition-colors
          disabled:opacity-50
          disabled:cursor-not-allowed
        "
                              >

                                {
                                  analysisLoadingId ===
                                    item.id
                                    ? (

                                      <RefreshCw
                                        className="
                  w-4
                  h-4
                  animate-spin
                "
                                      />

                                    )
                                    : (

                                      <ScanSearch
                                        className="
                  w-4
                  h-4
                "
                                      />

                                    )
                                }


                                {
                                  analysisLoadingId ===
                                    item.id
                                    ? "Loading Assessment..."
                                    : "View AI Assessment"
                                }

                              </button>

                            </div>

                          )}

                      </div>

                    </article>

                  );
                }
              )}

            </div>

          )}

        </div>

      </div>
      {selectedAnalysis &&
  selectedAnalysisImagery && (

    <AIAnalysisModal
      imagery={
        selectedAnalysisImagery
      }
      record={
        selectedAnalysis
      }
      onClose={
        () => {

          setSelectedAnalysis(
            null
          );

          setSelectedAnalysisImagery(
            null
          );
        }
      }
    />

)}

    </div>
  );
}