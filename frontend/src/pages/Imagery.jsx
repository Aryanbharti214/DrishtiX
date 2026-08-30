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
  MapPin,
  RefreshCw,
  Satellite,
  ScanSearch,
  Trash2,
  TriangleAlert,
  Upload,
  X,
} from "lucide-react";

import {
  analyzeImagery,
  deleteImagery,
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
  const beforeFileInputRef = useRef(null);


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

  const [analysisMode, setAnalysisMode] = useState("SINGLE_IMAGE");
  const [beforeFile, setBeforeFile] = useState(null);
  const [beforePreviewUrl, setBeforePreviewUrl] = useState("");
  const [localRemoval, setLocalRemoval] = useState(null);

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

  const [manageMode, setManageMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const selectableImagery = imagery.filter(
    (item) => !["QUEUED", "PROCESSING"].includes(item.processingStatus)
  );

  function cancelManage() {
    setManageMode(false);
    setSelectedIds(new Set());
    setConfirmDelete(false);
  }

  function toggleSelected(item) {
    if (["QUEUED", "PROCESSING"].includes(item.processingStatus)) return;
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(item.id)) next.delete(item.id);
      else next.add(item.id);
      return next;
    });
  }


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

  useEffect(() => {
    if (!beforeFile) {
      setBeforePreviewUrl("");
      return;
    }
    const objectUrl = URL.createObjectURL(beforeFile);
    setBeforePreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [beforeFile]);

  function validateSelectedFile(file) {
    if (!ALLOWED_TYPES.has(file.type)) {
      setError("Only JPEG, PNG and WebP images are allowed.");
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("Image size must not exceed 20MB.");
      return false;
    }
    return true;
  }

  function handleBeforeFileChange(event) {
    setError("");
    const file = event.target.files?.[0];
    if (!file || !validateSelectedFile(file)) {
      setBeforeFile(null);
      event.target.value = "";
      return;
    }
    setBeforeFile(file);
  }


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

  useEffect(() => {
    setManageMode(false);
    setSelectedIds(new Set());
    setConfirmDelete(false);
  }, [currentDisaster?.id]);


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


  function clearSelectedFile() {
    if (uploading) {
      return;
    }

    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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

    if (sourceType === "SATELLITE" && analysisMode === "BEFORE_AFTER" && !beforeFile) {
      setError("Please select both Before and After images.");
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


      let beforeImagery = null;

      if (sourceType === "SATELLITE" && analysisMode === "BEFORE_AFTER") {
        const beforeData = new FormData();
        beforeData.append("image", beforeFile);
        beforeData.append("disasterId", currentDisaster.id);
        beforeData.append("sourceType", "SATELLITE");
        const beforeResponse = await uploadImagery(beforeData);
        beforeImagery = beforeResponse?.data?.imagery;
        if (!beforeImagery) throw new Error("Backend did not return the Before image.");
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

      let completedImagery = createdImagery;
      let completedAnalysis = null;

      if (beforeImagery) {
        const analysisResponse = await analyzeImagery(createdImagery.id, {
          analysisMode: "BEFORE_AFTER",
          beforeImageryId: beforeImagery.id,
        });
        completedImagery = {
          ...(analysisResponse?.data?.imagery ?? createdImagery),
          isComparisonJob: true,
        };
        completedAnalysis = analysisResponse?.data?.analysis ?? null;
      }

      setImagery(
        (previous) => [
          completedImagery,
          ...previous,
        ]
      );


      setSuccessMessage(beforeImagery
        ? "Before & After analysis completed. The result is ready to review."
        : `${createdImagery.originalFilename} uploaded successfully. You can now run AI analysis.`);

      if (completedAnalysis) {
        setSelectedAnalysisImagery(completedImagery);
        setSelectedAnalysis({ analysis: completedAnalysis });
      }


      /*
       * Reset upload form
       */

      setSelectedFile(null);
      setBeforeFile(null);
      setSourceType("DRONE");
      setAnalysisMode("SINGLE_IMAGE");
      setLatitude("");
      setLongitude("");
      setCapturedAt("");


      if (
        fileInputRef.current
      ) {
        fileInputRef.current.value =
          "";
      }

      if (beforeFileInputRef.current) beforeFileInputRef.current.value = "";

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

  async function handleDeleteSelected() {
    try {
      setDeleting(true);
      setError("");
      const count = selectedIds.size;
      await deleteImagery([...selectedIds]);

      if (
        selectedAnalysisImagery &&
        selectedIds.has(selectedAnalysisImagery.id)
      ) {
        setSelectedAnalysis(null);
        setSelectedAnalysisImagery(null);
      }

      await loadImagery();
      setSuccessMessage(
        `${count} imagery record${count === 1 ? "" : "s"} deleted.`
      );
      cancelManage();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete imagery"
      );
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
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
              {sourceType === "SATELLITE" && analysisMode === "BEFORE_AFTER" ? "After *" : "Image *"}
            </label>


            <label className={`block ${uploading ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>

              <input
                ref={
                  fileInputRef
                }
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={uploading}
                onChange={
                  handleFileChange
                }
                className="hidden"
              />


              <div className="border-2 border-dashed border-[var(--border-color)] hover:border-sky-500 rounded-xl p-6 text-center transition-colors">

                <Upload className="w-8 h-8 mx-auto text-sky-500" />


                <p className="text-sm font-semibold text-[var(--text-primary)] mt-3">
                  {selectedFile ? "Replace" : sourceType === "SATELLITE" && analysisMode === "BEFORE_AFTER" ? "Upload After" : "Select image"}
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


              <div className="flex items-start justify-between gap-3">

                <p className="min-w-0 break-all text-xs text-[var(--text-secondary)]">
                  {
                    selectedFile?.name
                  }
                </p>

                <button
                  type="button"
                  onClick={() => setLocalRemoval("AFTER")}
                  disabled={uploading}
                  aria-label="Remove selected image"
                  title="Remove selected image"
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-[10px] font-bold text-red-500 transition-colors hover:bg-red-500/20 focus:outline-none focus:ring-2 focus:ring-red-500/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5" />
                  Remove
                </button>

              </div>


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

          {sourceType === "SATELLITE" && (
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">Analysis Mode</label>
              <select value={analysisMode} onChange={(event) => setAnalysisMode(event.target.value)} disabled={uploading} className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)] outline-none focus:border-sky-500">
                <option value="SINGLE_IMAGE">Single Image</option>
                <option value="BEFORE_AFTER">Before &amp; After</option>
              </select>
            </div>
          )}

          {sourceType === "SATELLITE" && analysisMode === "BEFORE_AFTER" && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[var(--text-secondary)]">Before *</label>
              <label className={`block ${uploading ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
                <input ref={beforeFileInputRef} type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={handleBeforeFileChange} className="hidden" />
                {beforePreviewUrl ? (
                  <img src={beforePreviewUrl} alt="Before image preview" className="h-48 w-full rounded-lg border border-[var(--border-color)] object-cover" />
                ) : (
                  <div className="rounded-xl border-2 border-dashed border-[var(--border-color)] p-6 text-center transition-colors hover:border-sky-500">
                    <Upload className="mx-auto h-8 w-8 text-sky-500" />
                    <p className="mt-3 text-sm font-semibold text-[var(--text-primary)]">Upload Before</p>
                  </div>
                )}
              </label>
              {beforeFile && <div className="flex items-start justify-between gap-3"><p className="min-w-0 break-all text-xs text-[var(--text-secondary)]">{beforeFile.name}</p><button type="button" onClick={() => setLocalRemoval("BEFORE")} disabled={uploading} className="flex shrink-0 items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-[10px] font-bold text-red-500"><X className="h-3.5 w-3.5" />Remove</button></div>}
            </div>
          )}

          {sourceType === "SATELLITE" && analysisMode === "BEFORE_AFTER" && beforePreviewUrl && previewUrl && (
            <div className="grid grid-cols-2 gap-3">
              <div><p className="mb-2 text-xs font-bold text-[var(--text-secondary)]">Before</p><img src={beforePreviewUrl} alt="Before comparison preview" className="h-28 w-full rounded-lg border border-[var(--border-color)] object-cover" /></div>
              <div><p className="mb-2 text-xs font-bold text-[var(--text-secondary)]">After</p><img src={previewUrl} alt="After comparison preview" className="h-28 w-full rounded-lg border border-[var(--border-color)] object-cover" /></div>
            </div>
          )}


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
              !selectedFile ||
              (sourceType === "SATELLITE" && analysisMode === "BEFORE_AFTER" && !beforeFile)
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
                ? sourceType === "SATELLITE" && analysisMode === "BEFORE_AFTER" ? "Checking changes" : "Uploading..."
                : sourceType === "SATELLITE" && analysisMode === "BEFORE_AFTER" ? "Analyze Change" : "Upload Imagery"
            }

          </button>

        </form>


        {/* ============================================================= */}
        {/* IMAGERY LIBRARY                                               */}
        {/* ============================================================= */}

        <div className="xl:col-span-2 theme-card rounded-xl border border-[var(--border-color)] p-5">


          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">

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


            {!manageMode ? (
              <button type="button" onClick={() => setManageMode(true)} disabled={imagery.length === 0} className="rounded-lg border border-[var(--border-color)] px-3 py-2 text-xs font-bold hover:bg-[var(--bg-card-hover)] disabled:opacity-50">
                Manage
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => setSelectedIds(selectedIds.size === selectableImagery.length ? new Set() : new Set(selectableImagery.map((item) => item.id)))} disabled={selectableImagery.length === 0} className="rounded-lg border border-[var(--border-color)] px-3 py-2 text-xs font-bold disabled:opacity-50">
                  {selectedIds.size === selectableImagery.length && selectableImagery.length > 0 ? "Clear All" : "Select All"}
                </button>
                <span className="text-xs text-[var(--text-secondary)]">{selectedIds.size} selected</span>
                <button type="button" onClick={() => setConfirmDelete(true)} disabled={selectedIds.size === 0} className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 className="h-3.5 w-3.5" />Delete Selected</button>
                <button type="button" onClick={cancelManage} className="rounded-lg border border-[var(--border-color)] px-3 py-2 text-xs font-bold">Cancel</button>
              </div>
            )}

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
                      className={`relative rounded-xl overflow-hidden border bg-[var(--bg-main)] ${selectedIds.has(item.id) ? "border-red-500 ring-1 ring-red-500/30" : "border-[var(--border-color)]"}`}
                    >

                      {manageMode && (
                        <label className={`absolute right-3 top-3 z-10 flex items-center gap-2 rounded-lg border px-2.5 py-2 text-[10px] font-bold shadow-lg backdrop-blur ${analysisBusy ? "cursor-not-allowed border-slate-500/30 bg-slate-950/80 text-slate-300" : "cursor-pointer border-red-500/35 bg-[var(--bg-card)] text-[var(--text-primary)]"}`} onClick={(event) => event.stopPropagation()}>
                          <input type="checkbox" checked={selectedIds.has(item.id)} disabled={analysisBusy} onChange={() => toggleSelected(item)} className="h-4 w-4 accent-red-600" />
                          {analysisBusy ? "Analysis active" : "Select"}
                        </label>
                      )}


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

                            {item.isComparisonJob && <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-violet-500">Before &amp; After comparison</p>}


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

      {confirmDelete && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center bg-black/70 p-4" onMouseDown={(event) => event.target === event.currentTarget && !deleting && setConfirmDelete(false)}>
          <div className="theme-card w-full max-w-lg rounded-2xl border border-red-500/35 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs font-bold uppercase tracking-widest text-red-500">Destructive action</p><h3 className="mt-2 text-xl font-black">Delete {selectedIds.size} imagery record{selectedIds.size === 1 ? "" : "s"}?</h3></div>
              <button type="button" disabled={deleting} onClick={() => setConfirmDelete(false)} className="rounded-lg border border-[var(--border-color)] p-2"><X className="h-4 w-4" /></button>
            </div>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">The selected imagery and associated AI runs, findings, evidence relationships, overlays, and original uploads will be removed. This action cannot be undone.</p>
            <div className="mt-4 max-h-36 space-y-1 overflow-y-auto rounded-lg bg-[var(--bg-main)] p-3 text-xs text-[var(--text-secondary)]">{imagery.filter((item) => selectedIds.has(item.id)).map((item) => <p key={item.id}>{item.originalFilename}</p>)}</div>
            <div className="mt-6 flex justify-end gap-2"><button type="button" disabled={deleting} onClick={() => setConfirmDelete(false)} className="rounded-lg border border-[var(--border-color)] px-4 py-2 text-sm font-bold">Cancel</button><button type="button" disabled={deleting} onClick={handleDeleteSelected} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50">{deleting ? "Deleting..." : "Delete Selected"}</button></div>
          </div>
        </div>
      )}

      {localRemoval && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center bg-black/70 p-4" onMouseDown={(event) => event.target === event.currentTarget && setLocalRemoval(null)}>
          <div className="theme-card w-full max-w-lg rounded-2xl border border-red-500/35 p-6 shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-widest text-red-500">Remove image</p>
            <h3 className="mt-2 text-xl font-black">Remove {localRemoval === "BEFORE" ? "Before" : "After"} image?</h3>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">This image has not been uploaded yet. Only this local selection will be cleared.</p>
            <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setLocalRemoval(null)} className="rounded-lg border border-[var(--border-color)] px-4 py-2 text-sm font-bold">Cancel</button><button type="button" onClick={() => { if (localRemoval === "BEFORE") { setBeforeFile(null); if (beforeFileInputRef.current) beforeFileInputRef.current.value = ""; } else { clearSelectedFile(); } setLocalRemoval(null); }} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700">Remove</button></div>
          </div>
        </div>
      )}

    </div>
  );
}
