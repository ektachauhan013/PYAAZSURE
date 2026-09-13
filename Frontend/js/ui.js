/**
 * PyaazSure — UI Screen Renderers
 * Module: ui.js
 * 
 * Implements the six required screens:
 * 1. Login
 * 2. Farmer + Lot Details
 * 3. Sample Collection (Real Camera + Upload Fallback)
 * 4. AI Quality Assessment (Bounding Boxes + Standards Engine + Multimodal)
 * 5. Inspector Verification (1-at-a-time Flagged Review)
 * 6. Digital Quality Certificate
 */

window.PyaazUI = (() => {
  const D = window.PyaazData;

  const esc = (val) => String(val ?? '').replace(/[&<>'"]/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[c]));

  function toast(message, type = 'info') {
    const root = document.getElementById('toast-region');
    if (!root) return;
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    root.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 250);
    }, 3200);
  }

  function shell(state, body, title, subtitle) {
    if (state.step === 1) return body;

    const navItems = D.steps.map((s, i) => `
      <div class="sidebar-step ${state.step === i + 1 ? 'active' : ''}">
        <span>${state.step > i + 1 ? '✓' : i + 1}.</span>
        <span>${esc(s)}</span>
      </div>
    `).join('');

    return `
      <div class="app-shell">
        <aside class="sidebar" aria-label="Workflow progress">
          <div class="brand">
            <div class="brand-mark">🌱</div>
            <div>
              <div class="brand-name">PyaazSure</div>
              <div style="font-size:10px;opacity:0.8">FIELD INSPECTION PWA</div>
            </div>
          </div>
          <nav class="sidebar-nav">${navItems}</nav>
          <div style="margin-top:auto;font-size:11px;opacity:0.75;padding-top:14px;border-top:1px solid rgba(255,255,255,0.15)">
            Inspector: <strong>${esc(state.inspectorId || 'Field Demo')}</strong><br>
            Lot: <strong>${esc(state.lotId)}</strong>
          </div>
        </aside>

        <div class="main-area">
          <header class="topbar">
            <div class="brand">
              <div class="brand-mark">🌱</div>
              <div>
                <div class="topbar-title">${esc(title)}</div>
                <div class="topbar-sub">${esc(subtitle || state.lotId || 'PyaazSure')}</div>
              </div>
            </div>
            <div class="top-actions">
              <span class="step-chip">Screen ${state.step} of ${D.steps.length}</span>
            </div>
          </header>

          <main class="content">
            ${body}
          </main>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // SCREEN 1: LOGIN
  // =========================================================================
  function login(state) {
    return `
      <div class="login-page">
        <div class="login-card">
          <div class="login-brand-header">
            <div class="login-brand-icon">🌱</div>
            <h1>PyaazSure</h1>
            <p>AI-Assisted Onion Procurement Quality Assessment</p>
          </div>

          <form id="login-form" class="login-form" novalidate>
            <div class="field">
              <label for="inspectorId">Inspector ID or Mobile *</label>
              <input id="inspectorId" name="inspectorId" placeholder="e.g. INS-4081 or 9876543210" value="${esc(state.inspectorId || 'INS-4081')}" required>
              <div class="error" data-error="inspectorId"></div>
            </div>

            <div class="field">
              <label for="password">Password *</label>
              <input id="password" name="password" type="password" placeholder="Enter password (min 4 chars)" value="demo123" required>
              <div class="error" data-error="password"></div>
            </div>

            <button type="submit" class="btn btn-primary full-btn" style="margin-top:8px">
              Sign In to Procurement Desk →
            </button>

            <div class="login-demo-badge">
              <strong>Field Demo Mode:</strong> Quick sign-in is pre-filled. Enter any Inspector ID and 4+ character password.
            </div>
          </form>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // SCREEN 2: FARMER & LOT DETAILS
  // =========================================================================
  function lot(state) {
    const l = state.lot;
    const varietyOptions = D.varieties.map(v => 
      `<option value="${esc(v)}" ${v === l.variety ? 'selected' : ''}>${esc(v)}</option>`
    ).join('');

    const centreOptions = D.procurementCentres.map(c => 
      `<option value="${esc(c)}" ${c === l.centre ? 'selected' : ''}>${esc(c)}</option>`
    ).join('');

    return shell(state, `
      <div class="page-head">
        <div class="eyebrow">Procurement Intake</div>
        <h1>Farmer &amp; Lot Details</h1>
        <p>Record origin and batch information before initiating AI sample assessment.</p>
      </div>

      <form id="lot-form" novalidate>
        <div class="card">
          <h2 class="section-title">👨‍🌾 Farmer Identification</h2>
          <div class="field-grid">
            <div class="field">
              <label for="farmerId">Farmer ID / Aadhaar Ref *</label>
              <input id="farmerId" name="farmerId" value="${esc(l.farmerId || 'FRM-8291')}" placeholder="FRM-8291" required>
              <div class="error" data-error="farmerId"></div>
            </div>
            <div class="field">
              <label for="farmerName">Farmer Full Name *</label>
              <input id="farmerName" name="farmerName" value="${esc(l.farmerName || 'Ramesh Patil')}" placeholder="e.g. Ramesh Patil" required>
              <div class="error" data-error="farmerName"></div>
            </div>
            <div class="field">
              <label for="village">Village / Taluka / State *</label>
              <input id="village" name="village" value="${esc(l.village || 'Lasalgaon, Niphad, Nashik, MH')}" placeholder="Village, Taluka" required>
              <div class="error" data-error="village"></div>
            </div>
            <div class="field">
              <label for="fpo">FPO / Cooperative Society (Optional)</label>
              <input id="fpo" name="fpo" value="${esc(l.fpo || 'Sahyadri Farmers Producer Co.')}" placeholder="Cooperative name">
            </div>
          </div>
        </div>

        <div class="card">
          <h2 class="section-title">📦 Batch &amp; Lot Specifications</h2>
          <div class="field-grid">
            <div class="field">
              <label>Generated Lot ID (Unique)</label>
              <input value="${esc(state.lotId)}" disabled style="font-weight:700">
            </div>
            <div class="field">
              <label for="centre">Procurement Centre *</label>
              <select id="centre" name="centre" required>${centreOptions}</select>
            </div>
            <div class="field">
              <label for="variety">Onion Variety *</label>
              <select id="variety" name="variety" required>${varietyOptions}</select>
            </div>
            <div class="field">
              <label for="quantity">Quantity (Quintals / kg) *</label>
              <input id="quantity" name="quantity" type="number" value="${esc(l.quantity || '4500')}" placeholder="4500" required min="1">
              <div class="error" data-error="quantity"></div>
            </div>
            <div class="field">
              <label for="bags">Number of Bags *</label>
              <input id="bags" name="bags" type="number" value="${esc(l.bags || '90')}" placeholder="90" required min="1">
              <div class="error" data-error="bags"></div>
            </div>
            <div class="field">
              <label for="inspectionDate">Procurement Date &amp; Time *</label>
              <input id="inspectionDate" name="inspectionDate" type="datetime-local" value="${esc(l.inspectionDate)}" required>
            </div>
          </div>
        </div>

        <div class="actions">
          <button type="button" class="btn btn-secondary" data-back>← Sign Out</button>
          <button type="submit" class="btn btn-primary">Proceed to Sample Collection →</button>
        </div>
      </form>
    `, 'Farmer & Lot Details', state.lotId);
  }

  // =========================================================================
  // SCREEN 3: SAMPLE COLLECTION (Camera-First Field Experience)
  // =========================================================================
  function capture(state) {
    const isPhoto = state.captureMode !== 'video';
    const sample = state.capturedSample;

    return shell(state, `
      <div class="page-head">
        <div class="eyebrow">Field Inspection Intake</div>
        <h1>Sample Collection</h1>
        <p>Capture a clear tray photo or short sweep video of the onion procurement sample.</p>
      </div>

      <!-- Mode Selector Tabs: [ PHOTO ] [ VIDEO ] -->
      <div class="capture-tabs">
        <button type="button" class="capture-tab ${isPhoto ? 'active' : ''}" data-set-mode="photo">
          📷 PHOTO (Primary Demo)
        </button>
        <button type="button" class="capture-tab ${!isPhoto ? 'active' : ''}" data-set-mode="video">
          🎥 VIDEO (10–30s)
        </button>
      </div>

      <!-- Camera Viewport / Preview Area -->
      <div class="card" style="padding:14px">
        <div class="camera-viewport" id="camera-viewport">
          ${sample ? `
            ${sample.type?.startsWith('video') ? `
              <video class="camera-video-stream" src="${esc(sample.url)}" controls playsinline></video>
            ` : `
              <img class="camera-preview-img" src="${esc(sample.url)}" alt="Captured Onion Sample">
            `}
          ` : `
            <video id="camera-stream" class="camera-video-stream" autoplay playsinline muted></video>
            <div class="camera-reticle">
              <div class="camera-reticle-hint">Align onions inside tray area</div>
              <div id="camera-error-msg" style="display:none;background:rgba(214,69,69,0.9);color:#fff;padding:8px 12px;border-radius:8px;font-size:11px;text-align:center;"></div>
            </div>
          `}
        </div>

        <!-- Shutter / Action HUD -->
        ${!sample ? `
          <div class="camera-hud">
            <button type="button" class="btn btn-soft" data-trigger-upload title="Upload from Gallery">
              📁 From Device
            </button>

            ${isPhoto ? `
              <button type="button" class="shutter-btn" id="btn-capture-photo" title="Capture Image">
                <div class="shutter-inner"></div>
              </button>
            ` : `
              <button type="button" class="shutter-btn" id="btn-record-video" title="Start/Stop Recording">
                <div class="shutter-inner"></div>
              </button>
            `}

            <button type="button" class="btn btn-soft" id="btn-switch-camera" title="Switch Camera">
              🔄 Switch
            </button>
          </div>
          <div style="text-align:center;font-size:11px;color:var(--text-muted);margin-top:8px">
            ${isPhoto ? 'Tap circular shutter to capture high-res sample frame' : 'Tap shutter to start/stop 10–30 sec recording'}
          </div>
        ` : `
          <!-- Post-Capture Sample Verification Controls -->
          <div class="sample-status-banner">
            <div>
              <div class="sample-meta">✓ Sample Captured</div>
              <div style="font-size:11px;color:var(--text-muted)">${esc(sample.fileName || 'Camera Sample')} · ${esc(sample.sizeLabel || '')}</div>
            </div>
            <button type="button" class="btn btn-soft" id="btn-retake" style="min-height:36px;padding:6px 12px">
              ↺ Retake
            </button>
          </div>

          <div style="margin-top:14px">
            <button type="button" class="btn btn-primary full-btn" id="btn-analyze-sample" style="min-height:50px;font-size:15px">
              ⚡ Analyze Sample with AI →
            </button>
          </div>
        `}

        <!-- Fallback File Upload Bar -->
        <div class="capture-fallback-bar">
          <span style="font-size:11.5px;color:var(--text-muted)">Camera issue? Use gallery file upload:</span>
          <button type="button" class="btn btn-soft" data-trigger-upload style="min-height:36px;padding:6px 12px">
            Upload Image
          </button>
        </div>

        <!-- Task 5 Insufficient Evidence Demo Toggle -->
        <div class="demo-mode-toggle">
          <span>Demo Validation Mode:</span>
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-weight:700">
            <input type="checkbox" id="toggle-non-onion" ${state.isSimulatedNonOnion ? 'checked' : ''}>
            Test Non-Onion / Ambiguous Image
          </label>
        </div>
      </div>

      <div class="actions">
        <button type="button" class="btn btn-secondary" data-back>← Back to Lot</button>
      </div>
    `, 'Sample Collection', state.lotId);
  }

  // =========================================================================
  // SCREEN 4: AI QUALITY ASSESSMENT (Task 5, 6, 7, 8, 9, 13, 14)
  // =========================================================================
  function analysis(state) {
    const res = state.analysis;
    const sample = state.capturedSample;

    // Task 5: Non-Onion / Insufficient Evidence State
    if (!res || res.sample_valid === false) {
      return shell(state, `
        <div class="page-head">
          <div class="eyebrow">AI Quality Assessment</div>
          <h1>Sample Validation Result</h1>
        </div>

        <div class="insufficient-card">
          <div class="insufficient-icon">✕</div>
          <h2>INSUFFICIENT EVIDENCE</h2>
          <p>
            ${esc(res?.message || 'No suitable onion sample detected. Please capture a clear sample containing onions.')}
          </p>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:16px">
            Quality assessment cannot proceed without clear, identifiable onion specimens.
          </div>
          <button type="button" class="btn btn-primary" id="btn-re-capture">
            ↺ Recapture Clear Onion Sample
          </button>
        </div>

        <div class="actions">
          <button type="button" class="btn btn-secondary" data-back>← Back to Sampling</button>
        </div>
      `, 'AI Quality Assessment', state.lotId);
    }

    // Task 6: Valid Onion Assessment Screen
    const detections = res.detections || [];
    const flaggedDetections = detections.filter(d => (d.classification || '').toLowerCase() !== 'healthy');
    const sorting = res.sorting_impact;
    const calibration = res.calibration;
    const sensor = state.sensorData;
    const multimodal = state.multimodalAssessment;

    // Render Bounding Boxes on image
    const bboxElements = detections.map(d => {
      const isDefective = d.classification !== 'healthy';
      const isUncertain = d.confidence < 0.8;
      const [x, y, w, h] = d.bbox || [0, 0, 0, 0];
      const clsClass = isDefective ? (isUncertain ? 'uncertain' : 'defective') : 'healthy';

      return `
        <div class="bbox-box ${clsClass}" style="left:${x}%;top:${y}%;width:${w}%;height:${h}%">
          <span class="bbox-label">${esc(d.onion_ref)}: ${esc(d.classification)} (${Math.round(d.confidence * 100)}%)</span>
        </div>
      `;
    }).join('');

    // Defect breakdown bars
    const breakdown = res.defect_breakdown || {};
    const total = res.onion_count || 1;
    const defectRows = D.defectTypes.map(dt => {
      const count = breakdown[dt.key] || 0;
      const pct = Math.round((count / total) * 100);
      return `
        <div class="defect-bar-row">
          <span style="font-weight:700;color:${dt.color}">${esc(dt.label)}</span>
          <div class="defect-bar-track">
            <div class="defect-bar-fill" style="width:${pct}%;background:${dt.color}"></div>
          </div>
          <span style="text-align:right;color:var(--text-muted);font-weight:600">${count} (${pct}%)</span>
        </div>
      `;
    }).join('');

    return shell(state, `
      <div class="page-head">
        <div class="eyebrow">AI Quality Assessment · Model Output</div>
        <h1>Quality &amp; Defect Analysis</h1>
        <p>Vision detections aligned with Standards-as-Code procurement grading.</p>
      </div>

      <!-- Actual Captured Sample with Bounding Boxes (Task 6) -->
      <div class="sample-viewer-card">
        <div class="sample-display-wrapper">
          <img src="${esc(sample?.url)}" class="sample-main-img" alt="Evaluated Sample">
          <div class="bbox-layer">${bboxElements}</div>
        </div>
        <div style="background:#133327;color:#fff;padding:8px 12px;font-size:10.5px;display:flex;justify-content:space-between">
          <span>🟢 Green: Acceptable</span>
          <span>🔴 Red: Defective</span>
          <span>🟡 Amber: Uncertain (&lt;80%)</span>
        </div>
      </div>

      <!-- Grade Seal Banner (Task 8) -->
      <div class="grade-banner ${res.grade === 'REJECT' ? 'grade-reject' : ''}">
        <div>
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;opacity:0.85">ASSESSED GRADE</div>
          <div style="font-size:18px;font-weight:800;margin-top:2px">${esc(res.gradeLabel)}</div>
          <div style="font-size:11px;opacity:0.85;margin-top:4px">Standard: ${esc(window.PyaazStandards.getActiveProfile().name)}</div>
        </div>
        <div class="grade-badge-huge">${esc(res.grade)}</div>
      </div>

      <!-- Key Quantitative Metrics -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-val">${res.onion_count}</div>
          <div class="metric-name">Total Onions</div>
        </div>
        <div class="metric-card">
          <div class="metric-val green">${res.acceptable_count}</div>
          <div class="metric-name">Acceptable</div>
        </div>
        <div class="metric-card">
          <div class="metric-val red">${res.defective_count}</div>
          <div class="metric-name">Defective</div>
        </div>
        <div class="metric-card">
          <div class="metric-val ${res.defective_percentage > 15 ? 'red' : 'gold'}">${res.defective_percentage}%</div>
          <div class="metric-name">Defect %</div>
        </div>
      </div>

      <!-- Defect Breakdown Card -->
      <div class="card">
        <h2 class="section-title">📊 Defect Breakdown</h2>
        <div class="defect-breakdown-list">
          ${defectRows}
        </div>
      </div>

      <!-- Size Calibration Info (Task 7) -->
      <div class="card">
        <h2 class="section-title">📏 Calibrated Size &amp; Diameter</h2>
        ${calibration?.marker_detected ? `
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:12.5px">
            <span>Estimated Average Diameter:</span>
            <strong>${calibration.diameter_cm} cm</strong>
          </div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px">
            Calibration scale: ${calibration.pixels_per_cm} px/cm · Confidence: ${Math.round(calibration.size_confidence * 100)}%
          </div>
        ` : `
          <div style="font-size:12px;color:var(--text-muted);padding:6px 0">
            ℹ️ ${esc(calibration?.note || 'Size unavailable — calibration marker not detected.')}
          </div>
        `}
      </div>

      <!-- Sorting Impact Panel (Task 9) -->
      ${sorting ? `
        <div class="sorting-panel">
          <strong>💡 Sorting Opportunity:</strong> ${esc(sorting.notice)}<br>
          <span style="font-size:10px;opacity:0.8">${esc(sorting.disclaimer)}</span>
        </div>
      ` : ''}

      <!-- Flagged Defects List with Observable Evidence (Task 6) -->
      ${flaggedDetections.length > 0 ? `
        <div class="card" style="margin-top:14px">
          <h2 class="section-title">⚠️ Flagged Onions Requiring Verification (${flaggedDetections.length})</h2>
          <div class="flagged-list">
            ${flaggedDetections.map(d => `
              <div class="flagged-item">
                <div>
                  <strong style="color:var(--error)">${esc(d.onion_ref)} · ${esc(d.classification.toUpperCase())}</strong>
                  <div class="flagged-desc">"${esc(d.evidence || 'Observable surface defect detected.')}"</div>
                </div>
                <span class="badge badge-gold">${Math.round(d.confidence * 100)}% Conf.</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Simulated Sensor & Multimodal Data (Tasks 13 & 14) -->
      <div class="card" style="margin-top:14px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <h2 class="section-title" style="margin-bottom:0">📡 Sensor Telemetry</h2>
          <span class="badge badge-soft">[SIMULATED MVP]</span>
        </div>
        <p style="font-size:11px;color:var(--text-muted);margin:6px 0 10px">
          Hardware telemetry simulated for APMC crate scale and atmospheric VOC sensors.
        </p>
        <div class="sensor-badge-row">
          <span class="sensor-chip">⚖️ Weight: ${sensor?.weight_kg} kg</span>
          <span class="sensor-chip">💨 VOC: ${sensor?.voc_ppm} ppm</span>
          <span class="sensor-chip">🌡️ Temp: ${sensor?.temperature_c} °C</span>
          <span class="sensor-chip">💧 Humidity: ${sensor?.humidity_pct}%</span>
        </div>
        ${multimodal?.crossModalConsistency?.fusedObservations?.length ? `
          <div style="margin-top:10px;padding:8px 10px;background:#F0F7F4;border-radius:8px;font-size:11.5px;color:var(--primary)">
            <strong>Multimodal Cross-Check:</strong> ${esc(multimodal.crossModalConsistency.fusedObservations[0])}
          </div>
        ` : ''}
      </div>

      <div class="actions">
        <button type="button" class="btn btn-secondary" data-back>← Retake Sample</button>
        <button type="button" class="btn btn-primary" id="btn-proceed-verify">
          Verify Flagged Cases (${flaggedDetections.length}) →
        </button>
      </div>
    `, 'AI Quality Assessment', state.lotId);
  }

  // =========================================================================
  // SCREEN 5: INSPECTOR VERIFICATION (1-At-A-Time Carousel, Task 10 & 11)
  // =========================================================================
  function verification(state) {
    const res = state.analysis;
    const detections = res?.detections || [];
    const flagged = detections.filter(d => (d.classification || '').toLowerCase() !== 'healthy');
    const totalFlagged = flagged.length;
    const vState = state.verification;
    const currentIndex = Math.min(vState.currentFlaggedIndex || 0, Math.max(0, totalFlagged - 1));
    const activeOnion = flagged[currentIndex];

    // Re-evaluate quality with any inspector overrides
    const effectiveQuality = window.PyaazStandards.reevaluateWithOverrides(detections, vState.overrides);
    const hasOverride = activeOnion ? !!vState.overrides[activeOnion.onion_ref] : false;
    const isConfirmed = activeOnion ? !!vState.confirmed[activeOnion.onion_ref] : false;

    return shell(state, `
      <div class="page-head">
        <div class="eyebrow">Human-in-the-Loop Protocol</div>
        <h1>Inspector Verification</h1>
        <p>Review flagged defects one-at-a-time. You hold final procurement authority.</p>
      </div>

      ${totalFlagged > 0 && activeOnion ? `
        <!-- Flagged Case Stepper Header (Task 10) -->
        <div class="verification-stepper">
          <span class="step-indicator-chip">FLAGGED ONION ${currentIndex + 1} OF ${totalFlagged}</span>
          <span style="font-size:12px;font-weight:700;color:var(--text-muted)">Ref: ${esc(activeOnion.onion_ref)}</span>
        </div>

        <!-- Evidence Zoom & Crop Card -->
        <div class="evidence-crop-card">
          <div style="background:#0E261D;text-align:center;padding:8px">
            <img id="crop-evidence-img" class="evidence-crop-img" src="${esc(activeOnion.cropUrl || state.capturedSample?.url)}" alt="Flagged Onion Visual Crop">
          </div>
          
          <div class="evidence-details">
            <div style="display:flex;justify-content:space-between;align-items:flex-start">
              <div>
                <span style="font-size:11px;color:var(--text-muted);text-transform:uppercase;font-weight:700">AI Classification:</span>
                <div style="font-size:18px;font-weight:850;color:var(--error)">
                  ${esc(activeOnion.classification.toUpperCase())}
                </div>
              </div>
              <div style="text-align:right">
                <span style="font-size:11px;color:var(--text-muted);text-transform:uppercase;font-weight:700">Confidence:</span>
                <div style="font-size:18px;font-weight:850;color:var(--gold)">
                  ${Math.round(activeOnion.confidence * 100)}%
                </div>
              </div>
            </div>

            <div class="evidence-quote">
              <strong>Observable Evidence:</strong> "${esc(activeOnion.evidence || 'Visible defect detected on surface.')}"
            </div>

            <!-- Current Decision Indicator -->
            <div style="margin:10px 0;font-size:12px">
              Status: 
              ${isConfirmed ? '<strong style="color:var(--success)">✓ AI Result Confirmed by Inspector</strong>' : ''}
              ${hasOverride ? `<strong style="color:var(--warning)">⚠ Overridden to: ${esc(vState.overrides[activeOnion.onion_ref].classification.toUpperCase())}</strong>` : ''}
              ${!isConfirmed && !hasOverride ? '<span style="color:var(--text-muted)">Pending Inspector Action</span>' : ''}
            </div>

            <!-- Confirm & Override Actions (Task 10) -->
            <div class="action-buttons-row">
              <button type="button" class="btn ${isConfirmed ? 'btn-primary' : 'btn-secondary'}" id="btn-confirm-flagged">
                ✓ CONFIRM
              </button>
              <button type="button" class="btn ${hasOverride ? 'btn-warning' : 'btn-outline-danger'}" id="btn-show-override">
                ✎ OVERRIDE
              </button>
            </div>

            <!-- Override Dropdown Sub-Panel -->
            <div class="override-panel" id="override-form-panel" style="${hasOverride ? 'display:block' : 'display:none'}">
              <label style="font-size:11.5px;font-weight:750;display:block;margin-bottom:6px">Select Correct Classification:</label>
              <select id="select-override-class" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--line);margin-bottom:8px">
                <option value="healthy" ${vState.overrides[activeOnion.onion_ref]?.classification === 'healthy' ? 'selected' : ''}>Healthy (False Positive)</option>
                <option value="damaged" ${vState.overrides[activeOnion.onion_ref]?.classification === 'damaged' ? 'selected' : ''}>Damaged / Cuts</option>
                <option value="rotten" ${vState.overrides[activeOnion.onion_ref]?.classification === 'rotten' ? 'selected' : ''}>Rotten / Neck Rot</option>
                <option value="sprouted" ${vState.overrides[activeOnion.onion_ref]?.classification === 'sprouted' ? 'selected' : ''}>Sprouted / Shoots</option>
                <option value="discolored" ${vState.overrides[activeOnion.onion_ref]?.classification === 'discolored' ? 'selected' : ''}>Discolored</option>
              </select>
              <input id="input-override-note" placeholder="Inspector note / justification" value="${esc(vState.overrides[activeOnion.onion_ref]?.note || '')}" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--line);font-size:12px;margin-bottom:8px">
              <button type="button" class="btn btn-warning full-btn" id="btn-apply-override">Save Override</button>
            </div>

            <!-- Navigation Stepper Buttons -->
            <div style="display:flex;justify-content:space-between;gap:8px;margin-top:14px;padding-top:12px;border-top:1px solid var(--line)">
              <button type="button" class="btn btn-soft" id="btn-prev-flagged" ${currentIndex === 0 ? 'disabled' : ''}>
                ← Previous
              </button>
              <span style="align-self:center;font-size:11px;color:var(--text-muted)">${currentIndex + 1} / ${totalFlagged}</span>
              <button type="button" class="btn btn-soft" id="btn-next-flagged" ${currentIndex === totalFlagged - 1 ? 'disabled' : ''}>
                Next →
              </button>
            </div>
          </div>
        </div>
      ` : `
        <div class="card" style="text-align:center;padding:24px">
          <div style="font-size:32px;margin-bottom:6px">🌱</div>
          <h3>All Sample Onions are Healthy</h3>
          <p style="font-size:12px;color:var(--text-muted)">No flagged defects detected. You may directly proceed with the final lot decision.</p>
        </div>
      `}

      <!-- Task 11: Final Lot Decision Selection -->
      <div class="card" style="margin-top:16px">
        <h2 class="section-title">⚖️ Final Lot Decision</h2>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:10px">
          AI Grade: <strong>${esc(res?.grade)}</strong> → Post-Verification Grade: <strong style="color:var(--primary)">${esc(effectiveQuality.grade)}</strong>
        </div>

        <div class="decision-options">
          ${[
            ['ACCEPT', 'Accept Lot', 'Procure lot at evaluated grade standard.'],
            ['ACCEPT_SORTING', 'Accept After Sorting', 'Approve procurement condition on removing flagged defects.'],
            ['REJECT', 'Reject Lot', 'Defect percentage exceeds procurement tolerance.'],
            ['NEEDS_INSPECTION', 'Needs Further Inspection', 'Request senior re-sampling or lab testing.']
          ].map(([key, label, desc]) => `
            <div class="decision-card ${state.finalDecision === key ? 'selected' : ''}" data-select-decision="${key}">
              <div>
                <strong>${label}</strong>
                <div style="font-size:11px;color:var(--text-muted)">${desc}</div>
              </div>
              <span>${state.finalDecision === key ? '◉' : '○'}</span>
            </div>
          `).join('')}
        </div>

        <div class="field" style="margin-top:12px">
          <label for="inspectorRemarks">Inspector Remarks (Optional)</label>
          <textarea id="inspectorRemarks" placeholder="Add procurement batch observations...">${esc(state.inspectorRemarks || '')}</textarea>
        </div>
      </div>

      <div class="actions">
        <button type="button" class="btn btn-secondary" data-back>← Assessment</button>
        <button type="button" class="btn btn-primary" id="btn-finalize-decision" ${state.finalDecision ? '' : 'disabled'}>
          Generate Digital Certificate →
        </button>
      </div>
    `, 'Inspector Verification', state.lotId);
  }

  // =========================================================================
  // SCREEN 6: DIGITAL QUALITY CERTIFICATE (Task 12)
  // =========================================================================
  function result(state) {
    const res = state.analysis;
    const certId = state.certificateId || `PYAAZ-${state.lotId}`;
    const isGradeChanged = state.verification?.effectiveQuality?.grade && 
      state.verification.effectiveQuality.grade !== res?.grade;
    const isVerified = !isGradeChanged;

    // Status description per Task 12:
    // If inspector agrees and final grade unchanged: VERIFIED
    // If override changes final grade: PENDING HUMAN VERIFICATION (Senior/Additional Human Verification Required)
    const statusClass = isVerified ? 'verified' : 'pending';
    const statusTitle = isVerified ? '✓ VERIFIED' : '⚠ PENDING HUMAN VERIFICATION';
    const statusSub = isVerified ? 
      'Inspector verification matches AI standard assessment.' : 
      'Senior/Additional Human Verification Required (Grade modified during inspection).';

    return shell(state, `
      <div class="page-head">
        <div class="eyebrow">Procurement Attestation</div>
        <h1>Digital Quality Certificate</h1>
        <p>Immutable digital inspection record issued for APMC / Mandi settlement.</p>
      </div>

      <div class="certificate-sheet">
        <div class="cert-header">
          <div style="font-size:11px;font-weight:800;letter-spacing:0.1em;color:var(--primary)">GOVERNMENT / APMC COMPLIANT RECORD</div>
          <h2 style="font-size:20px;font-weight:850;margin:4px 0">PyaazSure Quality Certificate</h2>
          <div class="cert-id-tag">${esc(certId)}</div>
        </div>

        <div class="cert-status-banner ${statusClass}">
          <div>${statusTitle}</div>
          <div style="font-size:11px;font-weight:600;margin-top:2px">${statusSub}</div>
        </div>

        <table class="cert-kv-table">
          <tbody>
            <tr>
              <td>Farmer Name &amp; ID</td>
              <td>${esc(state.lot.farmerName)} (${esc(state.lot.farmerId)})</td>
            </tr>
            <tr>
              <td>Location / Village</td>
              <td>${esc(state.lot.village)}</td>
            </tr>
            <tr>
              <td>Procurement Centre</td>
              <td>${esc(state.lot.centre)}</td>
            </tr>
            <tr>
              <td>Lot ID</td>
              <td>${esc(state.lotId)}</td>
            </tr>
            <tr>
              <td>Onion Variety</td>
              <td>${esc(state.lot.variety)}</td>
            </tr>
            <tr>
              <td>Batch Quantity</td>
              <td>${esc(state.lot.quantity)} kg (${esc(state.lot.bags)} Bags)</td>
            </tr>
            <tr>
              <td>Evaluated Sample Size</td>
              <td>${res?.onion_count || 0} units</td>
            </tr>
            <tr>
              <td>AI Initial Grade</td>
              <td>Grade ${esc(res?.grade || '—')}</td>
            </tr>
            <tr>
              <td>Final Certified Grade</td>
              <td style="font-size:15px;color:var(--primary)">Grade ${esc(state.verification?.effectiveQuality?.grade || res?.grade || '—')}</td>
            </tr>
            <tr>
              <td>Defective Count / %</td>
              <td>${state.verification?.effectiveQuality?.defective ?? res?.defective_count ?? 0} units (${state.verification?.effectiveQuality?.defectivePercentage ?? res?.defective_percentage ?? 0}%)</td>
            </tr>
            <tr>
              <td>Inspector Final Decision</td>
              <td><strong style="color:var(--primary)">${esc((state.finalDecision || '').replace('_', ' '))}</strong></td>
            </tr>
            <tr>
              <td>Inspector ID</td>
              <td>${esc(state.inspectorId)}</td>
            </tr>
            <tr>
              <td>Inspection Timestamp</td>
              <td>${new Date(state.completedAt || Date.now()).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <!-- Demo QR Attestation Grid -->
        <div style="text-align:center">
          <div class="qr-code-box" aria-label="Digital Verification QR">
            ${Array.from({ length: 64 }, (_, i) => `<div class="qr-dot ${((i * 5 + 3) % 7 === 0) ? 'off' : ''}"></div>`).join('')}
          </div>
          <div style="font-size:10px;color:var(--text-muted)">Scan to verify cryptographic certificate checksum</div>
        </div>
      </div>

      <div class="actions" style="margin-top:16px">
        <button type="button" class="btn btn-secondary" onclick="window.print()">🖨️ Print / Save PDF</button>
        <button type="button" class="btn btn-primary" id="btn-new-inspection">🌱 Start New Inspection</button>
      </div>
    `, 'Digital Quality Certificate', certId);
  }

  return {
    toast,
    shell,
    login,
    lot,
    capture,
    analysis,
    verification,
    result
  };
})();
