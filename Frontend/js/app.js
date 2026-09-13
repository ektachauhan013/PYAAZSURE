/**
 * PyaazSure — Core Application Controller & State Engine
 * Module: app.js
 * 
 * Coordinates:
 * - Real camera capture via getUserMedia & MediaRecorder (Task 2)
 * - IndexedDB persistence & sample flow (Task 3)
 * - Model inference & non-onion validation (Task 4, 5, 7)
 * - Standards Engine evaluation (Task 8, 9)
 * - 1-by-1 Inspector verification (Task 10, 11)
 * - Digital certificate generation (Task 12)
 * - Sensor & Multimodal telemetry (Task 13, 14)
 */

(() => {
  const D = window.PyaazData;
  const UI = window.PyaazUI;
  const Inference = window.PyaazInference;
  const Standards = window.PyaazStandards;
  const Sensor = window.PyaazSensor;

  const STORE_KEY = 'pyaazsure.session.v3';
  const LOT_STORE_KEY = 'pyaazsure.lot.history.v3';
  const DB_NAME = 'pyaazsure.media.v3';

  // State initialization
  let state = loadInitialState();
  let activeCameraStream = null;
  let mediaRecorder = null;
  let recordedChunks = [];
  let currentCameraFacing = 'environment';

  const appEl = document.getElementById('app');
  const filePickerEl = document.getElementById('media-picker');

  // IndexedDB persistent storage for large media blobs
  const MediaStore = {
    async open() {
      return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => req.result.createObjectStore('samples');
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    },
    async put(key, blob) {
      try {
        const db = await this.open();
        return new Promise((resolve, reject) => {
          const tx = db.transaction('samples', 'readwrite');
          tx.objectStore('samples').put(blob, key);
          tx.oncomplete = resolve;
          tx.onerror = () => reject(tx.error);
        });
      } catch (e) {
        console.warn('IndexedDB put error:', e);
      }
    },
    async get(key) {
      try {
        const db = await this.open();
        return new Promise((resolve, reject) => {
          const tx = db.transaction('samples', 'readonly');
          const req = tx.objectStore('samples').get(key);
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });
      } catch (e) {
        console.warn('IndexedDB get error:', e);
        return null;
      }
    },
    async clear() {
      try {
        const db = await this.open();
        return new Promise((resolve) => {
          const tx = db.transaction('samples', 'readwrite');
          tx.objectStore('samples').clear();
          tx.oncomplete = resolve;
        });
      } catch (e) {
        console.warn('IndexedDB clear error:', e);
      }
    }
  };

  function generateLotId() {
    let used = [];
    try { used = JSON.parse(localStorage.getItem(LOT_STORE_KEY) || '[]'); } catch {}
    let id;
    do {
      id = `LOT-${Math.floor(100000 + Math.random() * 900000)}`;
    } while (used.includes(id));
    used.push(id);
    localStorage.setItem(LOT_STORE_KEY, JSON.stringify(used.slice(-200)));
    return id;
  }

  function createFreshState() {
    const s = D.defaultState();
    s.lotId = generateLotId();
    return s;
  }

  function loadInitialState() {
    try {
      const saved = sessionStorage.getItem(STORE_KEY);
      if (saved) {
        return { ...D.defaultState(), ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Session load error, starting clean:', e);
    }
    return createFreshState();
  }

  function saveState() {
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Session save error:', e);
    }
  }

  function navigateTo(step) {
    // Stop camera stream when leaving capture screen
    if (state.step === 3 && step !== 3) {
      stopCameraStream();
    }

    state.step = Math.max(1, Math.min(D.steps.length, step));
    saveState();
    renderApp();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // =========================================================================
  // VIEW RENDERER & EVENT DISPATCHER
  // =========================================================================
  function renderApp() {
    const views = {
      1: UI.login,
      2: UI.lot,
      3: UI.capture,
      4: UI.analysis,
      5: UI.verification,
      6: UI.result
    };

    const renderFn = views[state.step] || UI.login;
    appEl.innerHTML = renderFn(state);
    bindEvents();

    // If on capture screen and no sample captured yet, start camera stream
    if (state.step === 3 && !state.capturedSample) {
      startCameraStream();
    }
  }

  function bindEvents() {
    // Global back button handler
    document.querySelectorAll('[data-back]').forEach(b => {
      b.onclick = () => navigateTo(state.step - 1);
    });

    if (state.step === 1) bindLoginEvents();
    if (state.step === 2) bindLotEvents();
    if (state.step === 3) bindCaptureEvents();
    if (state.step === 4) bindAnalysisEvents();
    if (state.step === 5) bindVerificationEvents();
    if (state.step === 6) bindResultEvents();
  }

  // =========================================================================
  // SCREEN 1: LOGIN BINDINGS
  // =========================================================================
  function bindLoginEvents() {
    const form = document.getElementById('login-form');
    if (!form) return;

    form.onsubmit = (e) => {
      e.preventDefault();
      const id = form.inspectorId.value.trim();
      const pw = form.password.value;

      if (!id) {
        UI.toast('Please enter your Inspector ID', 'error');
        return;
      }
      if (pw.length < 4) {
        UI.toast('Password must be at least 4 characters', 'error');
        return;
      }

      state.loggedIn = true;
      state.inspectorId = id;
      saveState();
      UI.toast(`Welcome back, Inspector ${id}`, 'success');
      navigateTo(2);
    };
  }

  // =========================================================================
  // SCREEN 2: LOT DETAILS BINDINGS
  // =========================================================================
  function bindLotEvents() {
    const form = document.getElementById('lot-form');
    if (!form) return;

    form.querySelectorAll('input, select').forEach(el => {
      el.addEventListener('input', () => {
        if (el.name) {
          state.lot[el.name] = el.value;
          saveState();
        }
      });
    });

    form.onsubmit = (e) => {
      e.preventDefault();
      if (!form.farmerName.value.trim()) {
        UI.toast('Please specify Farmer Name', 'error');
        return;
      }
      if (!form.quantity.value || Number(form.quantity.value) <= 0) {
        UI.toast('Please enter valid batch quantity', 'error');
        return;
      }
      saveState();
      navigateTo(3);
    };
  }

  // =========================================================================
  // SCREEN 3: REAL CAMERA & SAMPLE CAPTURE (Task 2 & 3)
  // =========================================================================
  function bindCaptureEvents() {
    // Mode toggling: PHOTO vs VIDEO
    document.querySelectorAll('[data-set-mode]').forEach(btn => {
      btn.onclick = () => {
        state.captureMode = btn.dataset.setMode;
        saveState();
        renderApp();
      };
    });

    // Shutter Photo Capture
    const btnCapturePhoto = document.getElementById('btn-capture-photo');
    if (btnCapturePhoto) {
      btnCapturePhoto.onclick = capturePhotoFromCamera;
    }

    // Shutter Video Record / Stop
    const btnRecordVideo = document.getElementById('btn-record-video');
    if (btnRecordVideo) {
      btnRecordVideo.onclick = toggleVideoRecording;
    }

    // Switch Camera (Front / Rear Environment)
    const btnSwitchCam = document.getElementById('btn-switch-camera');
    if (btnSwitchCam) {
      btnSwitchCam.onclick = () => {
        currentCameraFacing = currentCameraFacing === 'environment' ? 'user' : 'environment';
        startCameraStream();
      };
    }

    // Retake sample
    const btnRetake = document.getElementById('btn-retake');
    if (btnRetake) {
      btnRetake.onclick = () => {
        if (state.capturedSample?.url) {
          URL.revokeObjectURL(state.capturedSample.url);
        }
        state.capturedSample = null;
        state.analysis = null;
        saveState();
        renderApp();
      };
    }

    // Analyze sample button -> triggers Task 4 inference
    const btnAnalyze = document.getElementById('btn-analyze-sample');
    if (btnAnalyze) {
      btnAnalyze.onclick = processSampleAnalysis;
    }

    // Fallback File Upload trigger
    document.querySelectorAll('[data-trigger-upload]').forEach(btn => {
      btn.onclick = () => {
        filePickerEl.accept = state.captureMode === 'video' ? 'video/*' : 'image/*';
        filePickerEl.value = '';
        filePickerEl.click();
      };
    });

    filePickerEl.onchange = () => {
      if (filePickerEl.files && filePickerEl.files[0]) {
        handleImportedFile(filePickerEl.files[0]);
      }
    };

    // Task 5 Insufficient Evidence Demo Toggle
    const toggleNonOnion = document.getElementById('toggle-non-onion');
    if (toggleNonOnion) {
      toggleNonOnion.onchange = (e) => {
        state.isSimulatedNonOnion = e.target.checked;
        saveState();
      };
    }
  }

  /**
   * Starts live camera preview stream using getUserMedia
   * Robust error handling for denied permissions, unsupported device, or stream issues
   */
  async function startCameraStream() {
    stopCameraStream();

    const videoEl = document.getElementById('camera-stream');
    const errEl = document.getElementById('camera-error-msg');
    if (!videoEl) return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showCameraError('Camera API is not supported in this browser. Please use the file upload fallback.');
      return;
    }

    try {
      const constraints = {
        video: {
          facingMode: { ideal: currentCameraFacing },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: state.captureMode === 'video'
      };

      activeCameraStream = await navigator.mediaDevices.getUserMedia(constraints);
      videoEl.srcObject = activeCameraStream;
      if (errEl) errEl.style.display = 'none';
    } catch (err) {
      console.warn('getUserMedia error:', err);
      let message = 'Camera access unavailable. Please use the file upload option.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'Camera permission was denied. Please allow camera permissions or upload an image.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = 'No camera device found on this system. Please use file upload.';
      }
      showCameraError(message);
    }
  }

  function showCameraError(msg) {
    const errEl = document.getElementById('camera-error-msg');
    if (errEl) {
      errEl.textContent = msg;
      errEl.style.display = 'block';
    }
    UI.toast(msg, 'warning');
  }

  function stopCameraStream() {
    if (activeCameraStream) {
      activeCameraStream.getTracks().forEach(track => track.stop());
      activeCameraStream = null;
    }
  }

  /**
   * Captures high-res still frame from the live camera stream
   */
  async function capturePhotoFromCamera() {
    const videoEl = document.getElementById('camera-stream');
    if (!videoEl || !activeCameraStream) {
      UI.toast('Camera stream not active. Uploading fallback...', 'warning');
      filePickerEl.click();
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoEl.videoWidth || 1280;
      canvas.height = videoEl.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(async (blob) => {
        if (!blob) {
          UI.toast('Capture failed. Please retry.', 'error');
          return;
        }

        stopCameraStream();

        const blobId = `sample-${Date.now()}`;
        await MediaStore.put(blobId, blob);
        const url = URL.createObjectURL(blob);

        state.capturedSample = {
          blobId,
          url,
          type: 'image/jpeg',
          fileName: `CAM_${Date.now().toString().slice(-6)}.jpg`,
          sizeLabel: `${(blob.size / 1024).toFixed(1)} KB`,
          timestamp: new Date().toISOString()
        };

        saveState();
        UI.toast('Sample photo captured successfully!', 'success');
        renderApp();
      }, 'image/jpeg', 0.92);
    } catch (e) {
      console.error('Photo capture error:', e);
      UI.toast('Error capturing frame: ' + e.message, 'error');
    }
  }

  /**
   * Handles short video recording via MediaRecorder (10–30s)
   */
  async function toggleVideoRecording() {
    const btn = document.getElementById('btn-record-video');

    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      if (btn) btn.classList.remove('recording');
      return;
    }

    if (!activeCameraStream) {
      UI.toast('Camera not ready for recording.', 'error');
      return;
    }

    try {
      recordedChunks = [];
      mediaRecorder = new MediaRecorder(activeCameraStream, { mimeType: 'video/webm' });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stopCameraStream();
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const blobId = `video-${Date.now()}`;
        await MediaStore.put(blobId, blob);
        const url = URL.createObjectURL(blob);

        state.capturedSample = {
          blobId,
          url,
          type: 'video/webm',
          fileName: `REC_${Date.now().toString().slice(-6)}.webm`,
          sizeLabel: `${(blob.size / (1024 * 1024)).toFixed(1)} MB`,
          timestamp: new Date().toISOString()
        };

        saveState();
        UI.toast('Sample sweep video recorded!', 'success');
        renderApp();
      };

      mediaRecorder.start();
      if (btn) btn.classList.add('recording');
      UI.toast('Recording started (10-30s). Tap shutter again to finish.', 'info');
    } catch (e) {
      console.warn('MediaRecorder error:', e);
      UI.toast('Video recording unsupported on this browser. Use photo mode.', 'warning');
    }
  }

  /**
   * Fallback: Handles uploaded image/video from file picker
   */
  async function handleImportedFile(file) {
    stopCameraStream();

    const blobId = `upload-${Date.now()}`;
    await MediaStore.put(blobId, file);
    const url = URL.createObjectURL(file);

    state.capturedSample = {
      blobId,
      url,
      type: file.type,
      fileName: file.name,
      sizeLabel: `${(file.size / 1024).toFixed(1)} KB`,
      timestamp: new Date().toISOString()
    };

    saveState();
    UI.toast(`Imported: ${file.name}`, 'success');
    renderApp();
  }

  // =========================================================================
  // SCREEN 4: AI INFERENCE & QUALITY ASSESSMENT (Task 4, 5, 6, 7, 8, 9, 13, 14)
  // =========================================================================
  async function processSampleAnalysis() {
    if (!state.capturedSample) {
      UI.toast('Please capture or upload a sample first.', 'error');
      return;
    }

    UI.toast('Running onion vision inference & quality grading...', 'info');

    // Model Inference Interface execution (Task 4 & 5)
    const inferenceResult = await Inference.runModelInference(state.capturedSample.url, {
      simulateNonOnion: state.isSimulatedNonOnion,
      hasCalibrationMarker: false // Default uncalibrated without marker
    });

    state.analysis = inferenceResult;

    // Pre-crop visual evidence for flagged onions (Task 10)
    if (inferenceResult.sample_valid && inferenceResult.detections) {
      for (const d of inferenceResult.detections) {
        if (d.classification !== 'healthy' && d.bbox) {
          d.cropUrl = await Inference.cropOnionEvidence(state.capturedSample.url, d.bbox);
        }
      }
    }

    // Generate simulated sensor telemetry & multimodal fusion (Task 13 & 14)
    state.sensorData = Sensor.createSensorReading({
      weight_kg: Number((Number(state.lot.quantity || 4500) / (state.lot.bags || 90)).toFixed(1)),
      voc_ppm: (inferenceResult.defect_breakdown?.rotten || 0) > 0 ? 1.8 : 0.7
    });

    const sensorIndicators = Sensor.evaluateSensorTelemetry(state.sensorData);
    state.multimodalAssessment = Sensor.fuseMultimodalAssessment(inferenceResult, sensorIndicators);

    // Initialize verification state
    state.verification = {
      currentFlaggedIndex: 0,
      overrides: {},
      confirmed: {},
      effectiveQuality: inferenceResult.sample_valid ? 
        Standards.evaluateQuality(inferenceResult.detections) : null,
      finalGrade: inferenceResult.grade,
      verificationStatus: 'PENDING'
    };

    saveState();
    navigateTo(4);
  }

  function bindAnalysisEvents() {
    const btnReCapture = document.getElementById('btn-re-capture');
    if (btnReCapture) {
      btnReCapture.onclick = () => {
        state.capturedSample = null;
        state.analysis = null;
        saveState();
        navigateTo(3);
      };
    }

    const btnProceedVerify = document.getElementById('btn-proceed-verify');
    if (btnProceedVerify) {
      btnProceedVerify.onclick = () => navigateTo(5);
    }
  }

  // =========================================================================
  // SCREEN 5: 1-AT-A-TIME INSPECTOR VERIFICATION (Task 10 & 11)
  // =========================================================================
  function bindVerificationEvents() {
    const res = state.analysis;
    const flagged = (res?.detections || []).filter(d => d.classification !== 'healthy');
    const vState = state.verification;
    const activeOnion = flagged[vState.currentFlaggedIndex || 0];

    // Stepper navigation: Prev / Next
    const btnPrev = document.getElementById('btn-prev-flagged');
    if (btnPrev) {
      btnPrev.onclick = () => {
        if (vState.currentFlaggedIndex > 0) {
          vState.currentFlaggedIndex--;
          saveState();
          renderApp();
        }
      };
    }

    const btnNext = document.getElementById('btn-next-flagged');
    if (btnNext) {
      btnNext.onclick = () => {
        if (vState.currentFlaggedIndex < flagged.length - 1) {
          vState.currentFlaggedIndex++;
          saveState();
          renderApp();
        }
      };
    }

    // Confirm AI result for current flagged onion
    const btnConfirm = document.getElementById('btn-confirm-flagged');
    if (btnConfirm && activeOnion) {
      btnConfirm.onclick = () => {
        delete vState.overrides[activeOnion.onion_ref];
        vState.confirmed[activeOnion.onion_ref] = true;
        recalculateVerification();
        UI.toast(`Confirmed ${activeOnion.onion_ref} as ${activeOnion.classification}`, 'success');
        renderApp();
      };
    }

    // Show/Toggle override options panel
    const btnShowOverride = document.getElementById('btn-show-override');
    const overridePanel = document.getElementById('override-form-panel');
    if (btnShowOverride && overridePanel) {
      btnShowOverride.onclick = () => {
        overridePanel.style.display = overridePanel.style.display === 'none' ? 'block' : 'none';
      };
    }

    // Apply Override selection
    const btnApplyOverride = document.getElementById('btn-apply-override');
    if (btnApplyOverride && activeOnion) {
      btnApplyOverride.onclick = () => {
        const selectClass = document.getElementById('select-override-class');
        const inputNote = document.getElementById('input-override-note');
        const chosenClass = selectClass.value;
        const note = inputNote.value.trim();

        vState.overrides[activeOnion.onion_ref] = {
          classification: chosenClass,
          note
        };
        delete vState.confirmed[activeOnion.onion_ref];
        recalculateVerification();
        UI.toast(`Overridden ${activeOnion.onion_ref} to ${chosenClass.toUpperCase()}`, 'warning');
        renderApp();
      };
    }

    // Select Final Lot Decision (Task 11)
    document.querySelectorAll('[data-select-decision]').forEach(card => {
      card.onclick = () => {
        state.finalDecision = card.dataset.selectDecision;
        saveState();
        renderApp();
      };
    });

    // Remarks input
    const remarksEl = document.getElementById('inspectorRemarks');
    if (remarksEl) {
      remarksEl.oninput = (e) => {
        state.inspectorRemarks = e.target.value;
        saveState();
      };
    }

    // Finalize Decision -> Navigate to Certificate (Screen 6)
    const btnFinalize = document.getElementById('btn-finalize-decision');
    if (btnFinalize) {
      btnFinalize.onclick = () => {
        if (!state.finalDecision) {
          UI.toast('Please select a Final Lot Decision', 'error');
          return;
        }

        state.completedAt = new Date().toISOString();
        state.certificateId = `PYAAZ-${state.lotId}`;
        saveState();
        UI.toast('Quality Certificate generated!', 'success');
        navigateTo(6);
      };
    }
  }

  function recalculateVerification() {
    const res = state.analysis;
    if (!res || !res.detections) return;

    const effective = Standards.reevaluateWithOverrides(res.detections, state.verification.overrides);
    state.verification.effectiveQuality = effective;

    // Check if grade changed
    if (effective.grade !== res.grade) {
      state.verification.verificationStatus = 'PENDING_HUMAN_VERIFICATION';
    } else {
      state.verification.verificationStatus = 'VERIFIED';
    }
    saveState();
  }

  // =========================================================================
  // SCREEN 6: CERTIFICATE BINDINGS (Task 12)
  // =========================================================================
  function bindResultEvents() {
    const btnNew = document.getElementById('btn-new-inspection');
    if (btnNew) {
      btnNew.onclick = async () => {
        if (!confirm('Start a new inspection lot? This will generate a new Lot ID.')) return;
        if (state.capturedSample?.url) {
          URL.revokeObjectURL(state.capturedSample.url);
        }
        await MediaStore.clear();
        state = createFreshState();
        saveState();
        navigateTo(2);
      };
    }
  }

  // =========================================================================
  // HYDRATION & INITIAL BOOTSTRAP
  // =========================================================================
  async function bootstrapApp() {
    // If there is an existing captured sample blobId in state, re-hydrate object URL
    if (state.capturedSample && state.capturedSample.blobId && !state.capturedSample.url) {
      const blob = await MediaStore.get(state.capturedSample.blobId);
      if (blob) {
        state.capturedSample.url = URL.createObjectURL(blob);
      }
    }

    renderApp();
  }

  window.addEventListener('online', () => UI.toast('Online mode active', 'success'));
  window.addEventListener('offline', () => UI.toast('Offline mode active — local storage operational'));

  // Run initial bootstrap
  bootstrapApp();
})();
