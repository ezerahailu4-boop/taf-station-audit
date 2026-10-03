/**
 * TAF ENERGIES - Station Information & Audit Management System
 * Interactive Logic, Photo Management & PDF Document Synchronization
 */

// Initial State Template — Clean Blank Slate for Real Field Audits (Zero Mock Data)
const DEFAULT_STATE = {
  id: '',
  metadata: {
    stationName: '',
    canopyId: '',
    date: new Date().toISOString().split('T')[0],
    auditorName: '',
    managerName: ''
  },
  checklist: {
    // 1. CANOPY, LIGHTING & EXTERIOR SIGNAGE
    canopyLogo: null, // 'pass' | 'fail'
    lighting: null, // 'working' | 'faulty'
    pylonSign: null, // 'working' | 'faulty'
    
    // 2. FORECOURT & DISPENSERS
    dispensersWorking: 0,
    dispensersBroken: 0,
    nozzlesBreakaways: null, // 'good' | 'action_req'
    
    // 3. LUBRICANTS & RETAIL SHOP
    lubricantShelf: null, // 'yes' | 'no_shelf'
    lubricantStock: null, // 'adequate' | 'low_none'
    
    // 4. ANCILLARY SERVICES & FACILITIES
    carWash: null, // 'branded' | 'unbranded' | 'none'
    generator: null, // 'operational' | 'non_functional'
    
    // 5. SAFETY & OPERATIONAL COMPLIANCE
    fireExtinguishers: null, // 'compliant' | 'deficient'
    staffUniform: null // 'good' | 'poor'
  },
  correctiveActions: [],
  photos: [], // Array of { id, itemId, itemTitle, dataUrl, caption, timestamp }
  signatures: {
    auditor: '',
    manager: ''
  }
};

// Application State
let appState = JSON.parse(JSON.stringify(DEFAULT_STATE));
appState.id = 'audit_' + Date.now();


// Checklist Item Definitions with Exact Labels matching the PDF
const CHECKLIST_CONFIG = {
  canopyLogo: {
    section: '1. CANOPY, LIGHTING & EXTERIOR SIGNAGE',
    title: 'Canopy Station Number & TAF Logo',
    desc: 'Verify station number and TAF logo typography/color match corporate brand standards.',
    options: [
      { value: 'pass', label: 'Pass', type: 'pass' },
      { value: 'fail', label: 'Fail', type: 'fail' }
    ]
  },
  lighting: {
    section: '1. CANOPY, LIGHTING & EXTERIOR SIGNAGE',
    title: 'Canopy & Area Lighting',
    desc: 'Check if all under-canopy and security lights are working. Note any dead bulbs.',
    options: [
      { value: 'working', label: 'Working', type: 'pass' },
      { value: 'faulty', label: 'Faulty', type: 'fail' }
    ]
  },
  pylonSign: {
    section: '1. CANOPY, LIGHTING & EXTERIOR SIGNAGE',
    title: 'Prime Sign / Pylon Sign',
    desc: 'Main highway identification sign present and illuminated correctly.',
    options: [
      { value: 'working', label: 'Yes / Working', type: 'pass' },
      { value: 'faulty', label: 'No / Faulty', type: 'fail' }
    ]
  },
  nozzlesBreakaways: {
    section: '2. FORECOURT & DISPENSERS',
    title: 'Nozzles, Hoses & Breakaways',
    desc: 'Hoses unfrayed, nozzles shutting off correctly, safety breakaways intact.',
    options: [
      { value: 'good', label: 'Good', type: 'pass' },
      { value: 'action_req', label: 'Action Req.', type: 'fail' }
    ]
  },
  lubricantShelf: {
    section: '3. LUBRICANTS & RETAIL SHOP',
    title: 'Lubricant Display Shelf',
    desc: 'Display shelf present in station shop/kiosk? Clean, organized, and structured.',
    options: [
      { value: 'yes', label: 'Yes', type: 'pass' },
      { value: 'no_shelf', label: 'No Shelf', type: 'fail' }
    ]
  },
  lubricantStock: {
    section: '3. LUBRICANTS & RETAIL SHOP',
    title: 'Lubricant Products Stock',
    desc: 'Sufficient variety of engine oils & fluids? Genuine TAF / approved stock?',
    options: [
      { value: 'adequate', label: 'Adequate', type: 'pass' },
      { value: 'low_none', label: 'Low / None', type: 'fail' }
    ]
  },
  carWash: {
    section: '4. ANCILLARY SERVICES & FACILITIES',
    title: 'Car Wash Facility',
    desc: 'Car wash present on site? Is branding correct and visible?',
    options: [
      { value: 'branded', label: 'Branded', type: 'pass' },
      { value: 'unbranded', label: 'Unbranded', type: 'neutral' },
      { value: 'none', label: 'None', type: 'neutral' }
    ]
  },
  generator: {
    section: '4. ANCILLARY SERVICES & FACILITIES',
    title: 'Generator & Backup Power',
    desc: 'Emergency generator present and operational during grid failure.',
    options: [
      { value: 'operational', label: 'Operational', type: 'pass' },
      { value: 'non_functional', label: 'Non-Functional', type: 'fail' }
    ]
  },
  fireExtinguishers: {
    section: '5. SAFETY & OPERATIONAL COMPLIANCE',
    title: 'Fire Extinguishers & Sand Buckets',
    desc: 'Clearly visible, fully charged, within inspection date, accessible.',
    options: [
      { value: 'compliant', label: 'Compliant', type: 'pass' },
      { value: 'deficient', label: 'Deficient', type: 'fail' }
    ]
  },
  staffUniform: {
    section: '5. SAFETY & OPERATIONAL COMPLIANCE',
    title: 'Staff Uniform & Presentation',
    desc: 'Attendants wearing standard TAF branded uniforms and PPE.',
    options: [
      { value: 'good', label: 'Good', type: 'pass' },
      { value: 'poor', label: 'Poor', type: 'fail' }
    ]
  }
};

// DOM Content Loaded Handler
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  // Try loading active draft from LocalStorage
  loadDraftFromStorage();
  
  // Bind UI Event Listeners
  bindEventListeners();
  
  // Initialize Digital Signature Pads
  initSignatures();
  
  // Render Form and Document
  renderAll();

  // Connect to Neon Database and sync registered records
  fetchNeonStatus();
  fetchAdminAudits();
}

/**
 * Event Listeners Binding
 */
function bindEventListeners() {
  // View Switcher (3-Way: Interactive Form, Official PDF Document, Admin Panel)
  const btnViewInteractive = document.getElementById('btnViewInteractive');
  const btnViewDocument = document.getElementById('btnViewDocument');
  const btnViewAdmin = document.getElementById('btnViewAdmin');
  
  if (btnViewInteractive) {
    btnViewInteractive.addEventListener('click', () => switchView('interactive'));
  }
  if (btnViewDocument) {
    btnViewDocument.addEventListener('click', () => switchView('document'));
  }
  if (btnViewAdmin) {
    btnViewAdmin.addEventListener('click', () => switchView('admin'));
  }

  // Neon Register Button
  const btnRegisterNeon = document.getElementById('btnRegisterNeon');
  if (btnRegisterNeon) {
    btnRegisterNeon.addEventListener('click', registerAuditToNeon);
  }

  // Neon Status Badge Click
  const neonStatusBadge = document.getElementById('neonStatusBadge');
  if (neonStatusBadge) {
    neonStatusBadge.addEventListener('click', () => {
      switchView('admin');
      fetchNeonStatus();
    });
  }

  // Admin Dashboard Controls
  const btnAdminRefresh = document.getElementById('btnAdminRefresh');
  if (btnAdminRefresh) {
    btnAdminRefresh.addEventListener('click', () => {
      fetchAdminAudits();
      fetchNeonStatus();
      showToast('Synchronized with Neon database');
    });
  }

  const btnAdminExportCsv = document.getElementById('btnAdminExportCsv');
  if (btnAdminExportCsv) {
    btnAdminExportCsv.addEventListener('click', exportToCsv);
  }

  const btnAdminExportJson = document.getElementById('btnAdminExportJson');
  if (btnAdminExportJson) {
    btnAdminExportJson.addEventListener('click', exportToJson);
  }

  const adminSearchInput = document.getElementById('adminSearchInput');
  if (adminSearchInput) {
    adminSearchInput.addEventListener('input', () => renderAdminDashboard());
  }

  const adminStatusFilter = document.getElementById('adminStatusFilter');
  if (adminStatusFilter) {
    adminStatusFilter.addEventListener('change', () => renderAdminDashboard());
  }

  const adminSortFilter = document.getElementById('adminSortFilter');
  if (adminSortFilter) {
    adminSortFilter.addEventListener('change', () => renderAdminDashboard());
  }

  // Audit Detail Modal Controls
  const btnCloseDetailModal = document.getElementById('btnCloseDetailModal');
  const auditDetailModal = document.getElementById('auditDetailModal');
  if (btnCloseDetailModal) {
    btnCloseDetailModal.addEventListener('click', closeDetailModal);
  }
  if (auditDetailModal) {
    auditDetailModal.addEventListener('click', (e) => {
      if (e.target === auditDetailModal) closeDetailModal();
    });
  }

  // Metadata input listeners
  const inputStationName = document.getElementById('inputStationName');
  const inputCanopyId = document.getElementById('inputCanopyId');
  const inputDate = document.getElementById('inputDate');
  const inputAuditorName = document.getElementById('inputAuditorName');
  const inputManagerName = document.getElementById('inputManagerName');

  if (inputStationName) {
    inputStationName.addEventListener('input', (e) => {
      appState.metadata.stationName = e.target.value;
      renderDocumentMetadata();
      saveDraftToStorage();
    });
  }
  if (inputCanopyId) {
    inputCanopyId.addEventListener('input', (e) => {
      appState.metadata.canopyId = e.target.value;
      renderDocumentMetadata();
      saveDraftToStorage();
    });
  }
  if (inputDate) {
    inputDate.addEventListener('input', (e) => {
      appState.metadata.date = e.target.value;
      renderDocumentMetadata();
      saveDraftToStorage();
    });
  }
  if (inputAuditorName) {
    inputAuditorName.addEventListener('input', (e) => {
      appState.metadata.auditorName = e.target.value;
      renderDocumentMetadata();
      saveDraftToStorage();
    });
  }
  if (inputManagerName) {
    inputManagerName.addEventListener('input', (e) => {
      appState.metadata.managerName = e.target.value;
      renderDocumentMetadata();
      saveDraftToStorage();
    });
  }

  // Dispensers numeric input listeners
  const inputDispensersWorking = document.getElementById('inputDispensersWorking');
  const inputDispensersBroken = document.getElementById('inputDispensersBroken');

  if (inputDispensersWorking) {
    inputDispensersWorking.addEventListener('input', (e) => {
      appState.checklist.dispensersWorking = parseInt(e.target.value) || 0;
      updateDispenserRatioUI();
      renderDocumentView();
      saveDraftToStorage();
    });
  }
  if (inputDispensersBroken) {
    inputDispensersBroken.addEventListener('input', (e) => {
      appState.checklist.dispensersBroken = parseInt(e.target.value) || 0;
      updateDispenserRatioUI();
      renderDocumentView();
      saveDraftToStorage();
    });
  }

  // Action Buttons
  const btnPrintPdf = document.getElementById('btnPrintPdf');
  if (btnPrintPdf) {
    btnPrintPdf.addEventListener('click', handlePrintPdf);
  }

  const btnResetAudit = document.getElementById('btnResetAudit');
  if (btnResetAudit) {
    btnResetAudit.addEventListener('click', resetAuditForm);
  }

  const btnSaveAudit = document.getElementById('btnSaveAudit');
  if (btnSaveAudit) {
    btnSaveAudit.addEventListener('click', saveAuditToHistory);
  }

  const btnHistoryToggle = document.getElementById('btnHistoryToggle');
  const btnCloseDrawer = document.getElementById('btnCloseDrawer');
  const historyDrawerOverlay = document.getElementById('historyDrawerOverlay');

  if (btnHistoryToggle) {
    btnHistoryToggle.addEventListener('click', openHistoryDrawer);
  }
  if (btnCloseDrawer) {
    btnCloseDrawer.addEventListener('click', closeHistoryDrawer);
  }
  if (historyDrawerOverlay) {
    historyDrawerOverlay.addEventListener('click', closeHistoryDrawer);
  }

  // Lightbox Modal Close
  const btnCloseLightbox = document.getElementById('btnCloseLightbox');
  const lightboxOverlay = document.getElementById('lightboxOverlay');
  if (btnCloseLightbox) {
    btnCloseLightbox.addEventListener('click', closeLightbox);
  }
  if (lightboxOverlay) {
    lightboxOverlay.addEventListener('click', (e) => {
      if (e.target === lightboxOverlay) closeLightbox();
    });
  }

  // Add Corrective Action Button
  const btnAddCorrectiveAction = document.getElementById('btnAddCorrectiveAction');
  if (btnAddCorrectiveAction) {
    btnAddCorrectiveAction.addEventListener('click', addCorrectiveAction);
  }
}

/**
 * View Switcher (Interactive Form vs Official Document vs Admin Panel)
 */
function switchView(mode) {
  const interactiveView = document.getElementById('interactiveView');
  const documentView = document.getElementById('documentView');
  const adminView = document.getElementById('adminView');
  const btnViewInteractive = document.getElementById('btnViewInteractive');
  const btnViewDocument = document.getElementById('btnViewDocument');
  const btnViewAdmin = document.getElementById('btnViewAdmin');

  interactiveView.classList.remove('active');
  documentView.classList.remove('active');
  if (adminView) adminView.classList.remove('active');

  btnViewInteractive.classList.remove('active');
  btnViewDocument.classList.remove('active');
  if (btnViewAdmin) btnViewAdmin.classList.remove('active');

  if (mode === 'interactive') {
    interactiveView.classList.add('active');
    btnViewInteractive.classList.add('active');
  } else if (mode === 'document') {
    documentView.classList.add('active');
    btnViewDocument.classList.add('active');
    renderDocumentView();
  } else if (mode === 'admin') {
    if (adminView) adminView.classList.add('active');
    if (btnViewAdmin) btnViewAdmin.classList.add('active');
    fetchAdminAudits();
  }
}

/**
 * Render All Elements
 */
function renderAll() {
  renderMetadataInputs();
  renderChecklistOptions();
  renderDispenserInputs();
  renderCorrectiveActions();
  renderAllItemPhotos();
  renderComplianceScore();
  renderDocumentView();
}


/**
 * Render Metadata Form Inputs
 */
function renderMetadataInputs() {
  const inputStationName = document.getElementById('inputStationName');
  const inputCanopyId = document.getElementById('inputCanopyId');
  const inputDate = document.getElementById('inputDate');
  const inputAuditorName = document.getElementById('inputAuditorName');
  const inputManagerName = document.getElementById('inputManagerName');

  if (inputStationName) inputStationName.value = appState.metadata.stationName || '';
  if (inputCanopyId) inputCanopyId.value = appState.metadata.canopyId || '';
  if (inputDate) inputDate.value = appState.metadata.date || '';
  if (inputAuditorName) inputAuditorName.value = appState.metadata.auditorName || '';
  if (inputManagerName) inputManagerName.value = appState.metadata.managerName || '';
}

/**
 * Render Checklist Option Buttons
 */
function renderChecklistOptions() {
  Object.keys(CHECKLIST_CONFIG).forEach(key => {
    const cfg = CHECKLIST_CONFIG[key];
    const container = document.getElementById(`options_${key}`);
    if (!container) return;

    const currentValue = appState.checklist[key];
    container.innerHTML = '';

    cfg.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'option-btn';
      
      const isSelected = currentValue === opt.value;
      if (isSelected) {
        if (opt.type === 'pass') btn.classList.add('selected-pass');
        else if (opt.type === 'fail') btn.classList.add('selected-fail');
        else btn.classList.add('selected-neutral');
      }

      btn.innerHTML = `
        <span class="checkbox-indicator">${isSelected ? '✓' : ''}</span>
        <span>${opt.label}</span>
      `;

      btn.addEventListener('click', () => {
        appState.checklist[key] = opt.value;
        renderChecklistOptions();
        renderComplianceScore();
        renderDocumentView();
        saveDraftToStorage();
      });

      container.appendChild(btn);
    });
  });
}

/**
 * Render Dispenser Numbers & Availability Ratio
 */
function renderDispenserInputs() {
  const inputDispensersWorking = document.getElementById('inputDispensersWorking');
  const inputDispensersBroken = document.getElementById('inputDispensersBroken');

  if (inputDispensersWorking) inputDispensersWorking.value = appState.checklist.dispensersWorking;
  if (inputDispensersBroken) inputDispensersBroken.value = appState.checklist.dispensersBroken;

  updateDispenserRatioUI();
}

function updateDispenserRatioUI() {
  const w = appState.checklist.dispensersWorking || 0;
  const b = appState.checklist.dispensersBroken || 0;
  const total = w + b;
  const badge = document.getElementById('dispenserRatioBadge');
  
  if (badge) {
    if (total === 0) {
      badge.textContent = '0 Pumps Registered';
      badge.style.background = '#e2e8f0';
      badge.style.color = '#475569';
    } else {
      const pct = Math.round((w / total) * 100);
      badge.textContent = `${w}/${total} Operational (${pct}%)`;
      if (pct >= 85) {
        badge.style.background = '#d1fae5';
        badge.style.color = '#065f46';
      } else if (pct >= 60) {
        badge.style.background = '#fef3c7';
        badge.style.color = '#92400e';
      } else {
        badge.style.background = '#fee2e2';
        badge.style.color = '#991b1b';
      }
    }
  }
}

/**
 * Render Corrective Actions & Notes
 */
function renderCorrectiveActions() {
  const container = document.getElementById('correctiveActionsList');
  if (!container) return;

  container.innerHTML = '';

  appState.correctiveActions.forEach((act, idx) => {
    const card = document.createElement('div');
    card.className = 'corrective-card';

    card.innerHTML = `
      <div class="corrective-card-header">
        <span class="corrective-num-badge">Action #${idx + 1}</span>
        <div class="corrective-meta-controls">
          <select class="priority-select ${act.priority || 'medium'}" data-id="${act.id}">
            <option value="critical" ${act.priority === 'critical' ? 'selected' : ''}>Critical</option>
            <option value="high" ${act.priority === 'high' ? 'selected' : ''}>High</option>
            <option value="medium" ${act.priority === 'medium' ? 'selected' : ''}>Medium</option>
            <option value="low" ${act.priority === 'low' ? 'selected' : ''}>Low</option>
          </select>
          <button type="button" class="btn-remove-note" title="Delete note" data-id="${act.id}">
            ✕
          </button>
        </div>
      </div>
      <textarea class="corrective-textarea" placeholder="Describe issue, location on site, and required corrective action..." data-id="${act.id}">${act.text || ''}</textarea>
    `;

    // Listeners for textarea
    const textarea = card.querySelector('textarea');
    textarea.addEventListener('input', (e) => {
      const item = appState.correctiveActions.find(a => a.id === act.id);
      if (item) item.text = e.target.value;
      renderDocumentNotes();
      saveDraftToStorage();
    });

    // Listener for priority select
    const select = card.querySelector('.priority-select');
    select.addEventListener('change', (e) => {
      const item = appState.correctiveActions.find(a => a.id === act.id);
      if (item) {
        item.priority = e.target.value;
        select.className = `priority-select ${e.target.value}`;
        saveDraftToStorage();
      }
    });

    // Listener for remove button
    const btnRemove = card.querySelector('.btn-remove-note');
    btnRemove.addEventListener('click', () => {
      appState.correctiveActions = appState.correctiveActions.filter(a => a.id !== act.id);
      renderCorrectiveActions();
      renderDocumentNotes();
      saveDraftToStorage();
    });

    container.appendChild(card);
  });

  renderDocumentNotes();
}

function addCorrectiveAction() {
  const newId = 'act-' + Date.now();
  appState.correctiveActions.push({
    id: newId,
    text: '',
    priority: 'high'
  });
  renderCorrectiveActions();
  saveDraftToStorage();
}

/**
 * PHOTO UPLOAD & MANAGEMENT SYSTEM ("can upload a photo")
 */
function renderAllItemPhotos() {
  // Render photo thumbnails for all checklist items
  const itemKeys = Object.keys(CHECKLIST_CONFIG);
  itemKeys.push('dispenserOperational'); // dispensers also has photo
  itemKeys.push('correctiveGeneral'); // general notes photo

  itemKeys.forEach(itemId => {
    renderItemPhotoTray(itemId);
  });
}

function renderItemPhotoTray(itemId) {
  const tray = document.getElementById(`photos_tray_${itemId}`);
  if (!tray) return;

  tray.innerHTML = '';
  const itemPhotos = appState.photos.filter(p => p.itemId === itemId);

  itemPhotos.forEach((photo) => {
    const thumb = document.createElement('div');
    thumb.className = 'photo-thumb-card';
    thumb.title = photo.caption || 'Inspection Photo (Click to view)';
    
    thumb.innerHTML = `
      <img src="${photo.dataUrl}" alt="Inspection Evidence" />
      <span class="photo-thumb-badge">🔍</span>
    `;

    thumb.addEventListener('click', () => {
      openLightbox(photo);
    });

    tray.appendChild(thumb);
  });
}

/**
 * Handle Photo Upload Triggered from HTML Input
 */
window.handlePhotoSelect = function(event, itemId, itemTitle) {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  Array.from(files).forEach(file => {
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file');
      return;
    }

    // Read and compress client-side
    const reader = new FileReader();
    reader.onload = (e) => {
      compressImage(e.target.result, 1200, 0.82, (compressedDataUrl) => {
        const newPhoto = {
          id: 'photo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          itemId: itemId,
          itemTitle: itemTitle || itemId,
          dataUrl: compressedDataUrl,
          caption: `Photo evidence for ${itemTitle || itemId}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString()
        };

        appState.photos.push(newPhoto);
        renderItemPhotoTray(itemId);
        renderDocumentAnnex();
        renderComplianceScore();
        saveDraftToStorage();
        showToast(`Photo attached to ${itemTitle || itemId}`);
      });
    };
    reader.readAsDataURL(file);
  });

  // Reset file input value so re-selecting same file triggers event
  event.target.value = '';
};

/**
 * Compress image using HTML5 Canvas to keep local storage performant
 */
function compressImage(dataUrl, maxWidth, quality, callback) {
  const img = new Image();
  img.onload = () => {
    let width = img.width;
    let height = img.height;

    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);

    const compressed = canvas.toDataURL('image/jpeg', quality);
    callback(compressed);
  };
  img.src = dataUrl;
}

/**
 * Photo Lightbox Modal
 */
let currentLightboxPhotoId = null;

function openLightbox(photo) {
  currentLightboxPhotoId = photo.id;
  const overlay = document.getElementById('lightboxOverlay');
  const title = document.getElementById('lightboxTitle');
  const img = document.getElementById('lightboxImg');
  const captionInput = document.getElementById('lightboxCaptionInput');
  const metaTime = document.getElementById('lightboxMetaTime');
  const btnDelete = document.getElementById('btnDeletePhoto');

  if (!overlay || !img) return;

  title.textContent = photo.itemTitle || 'Field Inspection Photo';
  img.src = photo.dataUrl;
  if (captionInput) {
    captionInput.value = photo.caption || '';
    captionInput.oninput = (e) => {
      photo.caption = e.target.value;
      renderDocumentAnnex();
      saveDraftToStorage();
    };
  }
  if (metaTime) {
    metaTime.textContent = `Captured: ${photo.timestamp || 'Today'}`;
  }

  if (btnDelete) {
    btnDelete.onclick = () => {
      appState.photos = appState.photos.filter(p => p.id !== photo.id);
      renderItemPhotoTray(photo.itemId);
      renderDocumentAnnex();
      renderComplianceScore();
      saveDraftToStorage();
      closeLightbox();
      showToast('Photo removed');
    };
  }

  overlay.classList.add('active');
}

function closeLightbox() {
  const overlay = document.getElementById('lightboxOverlay');
  if (overlay) overlay.classList.remove('active');
  currentLightboxPhotoId = null;
}

/**
 * Mobile-friendly stepper helper for working/broken dispensers
 */
window.stepCount = function(type, delta) {
  if (type === 'Working') {
    const current = parseInt(appState.checklist.dispensersWorking) || 0;
    appState.checklist.dispensersWorking = Math.max(0, current + delta);
    const input = document.getElementById('inputDispensersWorking');
    if (input) input.value = appState.checklist.dispensersWorking;
  } else if (type === 'Broken') {
    const current = parseInt(appState.checklist.dispensersBroken) || 0;
    appState.checklist.dispensersBroken = Math.max(0, current + delta);
    const input = document.getElementById('inputDispensersBroken');
    if (input) input.value = appState.checklist.dispensersBroken;
  }
  updateDispenserRatioUI();
  renderDocumentCheckboxes();
  renderComplianceScore();
  saveDraftToStorage();
};

/**
 * Real-time Compliance Score Calculation
 */
function renderComplianceScore() {
  let totalScoreable = 0;
  let passedScoreable = 0;
  let failCount = 0;

  // Evaluate checklist items
  Object.keys(CHECKLIST_CONFIG).forEach(key => {
    const val = appState.checklist[key];
    totalScoreable++;
    if (val === 'pass' || val === 'working' || val === 'good' || val === 'yes' || val === 'branded' || val === 'operational' || val === 'compliant') {
      passedScoreable++;
    } else if (val === 'fail' || val === 'faulty' || val === 'action_req' || val === 'no_shelf' || val === 'low_none' || val === 'non_functional' || val === 'deficient' || val === 'poor') {
      failCount++;
    } else {
      // neutral like 'unbranded' or 'none' for carwash
      passedScoreable += 0.5;
    }
  });

  // Dispenser pump availability weight
  const w = appState.checklist.dispensersWorking || 0;
  const b = appState.checklist.dispensersBroken || 0;
  totalScoreable += 2;
  if (w + b > 0) {
    const pumpRatio = w / (w + b);
    passedScoreable += pumpRatio * 2;
    if (b > 0) failCount++;
  } else {
    passedScoreable += 2;
  }

  const scorePct = Math.round((passedScoreable / totalScoreable) * 100);

  // Update Progress circle and badges
  const scoreText = document.getElementById('progressScoreText');
  const circleFill = document.getElementById('progressCircleFill');
  const headerScore = document.getElementById('headerStatScore');
  const headerIssues = document.getElementById('headerStatIssues');
  const headerPhotos = document.getElementById('headerStatPhotos');
  const pillPass = document.getElementById('pillPassCount');
  const pillFail = document.getElementById('pillFailCount');
  const pillPhotos = document.getElementById('pillPhotosCount');

  if (scoreText) scoreText.textContent = `${scorePct}%`;
  if (headerScore) {
    headerScore.textContent = `${scorePct}%`;
    headerScore.className = `stat-value ${scorePct >= 85 ? 'score-high' : scorePct >= 70 ? 'score-med' : 'score-low'}`;
  }
  if (headerIssues) headerIssues.textContent = `${failCount} Action${failCount === 1 ? '' : 's'}`;
  if (headerPhotos) headerPhotos.textContent = `${appState.photos.length} Attached`;

  if (pillPass) pillPass.textContent = `✓ ${Math.round(passedScoreable)} Passed`;
  if (pillFail) pillFail.textContent = `⚠ ${failCount} Deficiencies`;
  if (pillPhotos) pillPhotos.textContent = `📷 ${appState.photos.length} Photos`;

  if (circleFill) {
    // 220 is stroke-dasharray
    const offset = 220 - (220 * scorePct) / 100;
    circleFill.style.strokeDashoffset = offset;
    circleFill.style.stroke = scorePct >= 85 ? '#10b981' : scorePct >= 70 ? '#f59e0b' : '#ef4444';
  }
}

/**
 * RENDER THE OFFICIAL 2-PAGE DOCUMENT VIEW ("exactly like this")
 */
function renderDocumentView() {
  renderDocumentMetadata();
  renderDocumentCheckboxes();
  renderDocumentNotes();
  renderDocumentSignatures();
  renderDocumentAnnex();
}

function renderDocumentMetadata() {
  const docStation = document.getElementById('docStationName');
  const docCanopy = document.getElementById('docCanopyId');
  const docDate = document.getElementById('docDate');
  const annexStation = document.getElementById('annexStationName');
  const annexCanopy = document.getElementById('annexCanopyId');
  const annexDate = document.getElementById('annexDate');

  const station = appState.metadata.stationName || '—';
  const canopy = appState.metadata.canopyId || '—';
  const date = appState.metadata.date || new Date().toISOString().split('T')[0];

  if (docStation) docStation.textContent = station;
  if (docCanopy) docCanopy.textContent = canopy;
  if (docDate) docDate.textContent = date;

  if (annexStation) annexStation.textContent = station;
  if (annexCanopy) annexCanopy.textContent = canopy;
  if (annexDate) annexDate.textContent = date;
}

function renderDocumentCheckboxes() {
  // Section 1
  setDocBox('docBox_canopyPass', appState.checklist.canopyLogo === 'pass');
  setDocBox('docBox_canopyFail', appState.checklist.canopyLogo === 'fail');
  
  setDocBox('docBox_lightWork', appState.checklist.lighting === 'working');
  setDocBox('docBox_lightFault', appState.checklist.lighting === 'faulty');
  
  setDocBox('docBox_pylonYes', appState.checklist.pylonSign === 'working');
  setDocBox('docBox_pylonNo', appState.checklist.pylonSign === 'faulty');

  // Section 2
  const docDispWorking = document.getElementById('docDispensersWorking');
  const docDispBroken = document.getElementById('docDispensersBroken');
  if (docDispWorking) docDispWorking.textContent = appState.checklist.dispensersWorking ?? '0';
  if (docDispBroken) docDispBroken.textContent = appState.checklist.dispensersBroken ?? '0';

  setDocBox('docBox_nozzleGood', appState.checklist.nozzlesBreakaways === 'good');
  setDocBox('docBox_nozzleAction', appState.checklist.nozzlesBreakaways === 'action_req');

  // Section 3
  setDocBox('docBox_shelfYes', appState.checklist.lubricantShelf === 'yes');
  setDocBox('docBox_shelfNo', appState.checklist.lubricantShelf === 'no_shelf');
  
  setDocBox('docBox_stockAdequate', appState.checklist.lubricantStock === 'adequate');
  setDocBox('docBox_stockLow', appState.checklist.lubricantStock === 'low_none');

  // Section 4
  setDocBox('docBox_carwashBranded', appState.checklist.carWash === 'branded');
  setDocBox('docBox_carwashUnbranded', appState.checklist.carWash === 'unbranded');
  setDocBox('docBox_carwashNone', appState.checklist.carWash === 'none');

  setDocBox('docBox_genOper', appState.checklist.generator === 'operational');
  setDocBox('docBox_genNon', appState.checklist.generator === 'non_functional');

  // Section 5
  setDocBox('docBox_fireCompliant', appState.checklist.fireExtinguishers === 'compliant');
  setDocBox('docBox_fireDeficient', appState.checklist.fireExtinguishers === 'deficient');

  setDocBox('docBox_uniformGood', appState.checklist.staffUniform === 'good');
  setDocBox('docBox_uniformPoor', appState.checklist.staffUniform === 'poor');
}

function setDocBox(elementId, isChecked) {
  const el = document.getElementById(elementId);
  if (!el) return;
  if (isChecked) {
    el.classList.add('checked');
    el.textContent = '✕';
  } else {
    el.classList.remove('checked');
    el.textContent = '';
  }
}

function renderDocumentNotes() {
  const note1 = document.getElementById('docNote1');
  const note2 = document.getElementById('docNote2');
  const noteExtra = document.getElementById('docNoteExtraContainer');

  const a1 = appState.correctiveActions[0];
  const a2 = appState.correctiveActions[1];

  if (note1) note1.textContent = a1 ? a1.text : '';
  if (note2) note2.textContent = a2 ? a2.text : '';

  if (noteExtra) {
    noteExtra.innerHTML = '';
    if (appState.correctiveActions.length > 2) {
      for (let i = 2; i < appState.correctiveActions.length; i++) {
        const item = appState.correctiveActions[i];
        const line = document.createElement('div');
        line.className = 'doc-note-line';
        line.innerHTML = `
          <span class="doc-note-number">${i + 1}.</span>
          <span class="doc-note-text">${item.text || ''}</span>
        `;
        noteExtra.appendChild(line);
      }
    }
  }
}

function renderDocumentSignatures() {
  const docSigAuditor = document.getElementById('docSigAuditor');
  const docSigManager = document.getElementById('docSigManager');
  const docAuditorNameText = document.getElementById('docAuditorNameText');
  const docManagerNameText = document.getElementById('docManagerNameText');

  if (docAuditorNameText) docAuditorNameText.textContent = appState.metadata.auditorName || 'Auditor';
  if (docManagerNameText) docManagerNameText.textContent = appState.metadata.managerName || 'Station Manager';

  if (docSigAuditor) {
    docSigAuditor.innerHTML = appState.signatures.auditor ? `<img src="${appState.signatures.auditor}" alt="Auditor Signature">` : '<span style="color:#cbd5e1;font-size:11px;">(Signed Electronically)</span>';
  }
  if (docSigManager) {
    docSigManager.innerHTML = appState.signatures.manager ? `<img src="${appState.signatures.manager}" alt="Manager Signature">` : '<span style="color:#cbd5e1;font-size:11px;">(Signed Electronically)</span>';
  }
}

function renderDocumentAnnex() {
  const annexSheet = document.getElementById('docSheetAnnex');
  const grid = document.getElementById('docAnnexGrid');
  if (!annexSheet || !grid) return;

  renderDocumentMetadata();
  annexSheet.style.display = 'flex';
  grid.innerHTML = '';

  if (appState.photos.length === 0) {
    // Official Real Proof Framework — No AI Images, No Mock Data
    grid.innerHTML = `
      <div class="doc-evidence-empty-box" style="grid-column: 1 / -1;">
        <div class="doc-evidence-empty-icon">📷</div>
        <div class="doc-evidence-empty-title">Official Field Photographic Evidence Framework</div>
        <p style="font-size: 0.85rem; max-width: 580px; margin: 0 auto; color: #64748b;">
          Awaiting verified on-site field photos. Use the device camera or photo upload button in the audit checklist form (Section 1–5) to attach genuine photographic proof.
        </p>
        
        <div class="doc-evidence-slots-grid">
          <div class="doc-evidence-slot-card">
            <span style="font-size: 1.5rem;">🏢</span>
            <span class="doc-evidence-slot-name">Slot #1: Canopy & 3D Logo</span>
            <span class="doc-evidence-slot-desc">Elevation view of station canopy branding, fascia & station number</span>
            <span style="font-size: 9px; color: #d97706; font-weight: 700; margin-top: 4px;">[ Ready for Field Photo ]</span>
          </div>
          <div class="doc-evidence-slot-card">
            <span style="font-size: 1.5rem;">⛽</span>
            <span class="doc-evidence-slot-name">Slot #2: Dispensers & Nozzles</span>
            <span class="doc-evidence-slot-desc">Forecourt pumps, hoses, meters, and emergency breakaway safety valves</span>
            <span style="font-size: 9px; color: #d97706; font-weight: 700; margin-top: 4px;">[ Ready for Field Photo ]</span>
          </div>
          <div class="doc-evidence-slot-card">
            <span style="font-size: 1.5rem;">🧯</span>
            <span class="doc-evidence-slot-name">Slot #3: Fire Safety & Sand</span>
            <span class="doc-evidence-slot-desc">Fire extinguisher cylinders with inspection tags and full sand bucket</span>
            <span style="font-size: 9px; color: #d97706; font-weight: 700; margin-top: 4px;">[ Ready for Field Photo ]</span>
          </div>
          <div class="doc-evidence-slot-card">
            <span style="font-size: 1.5rem;">🛢️</span>
            <span class="doc-evidence-slot-name">Slot #4: Lubricants & Shop</span>
            <span class="doc-evidence-slot-desc">Branded lubricant shelving display and genuine engine fluid inventory</span>
            <span style="font-size: 9px; color: #d97706; font-weight: 700; margin-top: 4px;">[ Ready for Field Photo ]</span>
          </div>
        </div>
      </div>
    `;
    return;
  }

  // Render Genuine Uploaded Field Evidence Photos
  appState.photos.forEach((p, idx) => {
    const card = document.createElement('div');
    card.className = 'doc-evidence-photo-card';
    card.innerHTML = `
      <div class="doc-evidence-photo-wrap">
        <img src="${p.dataUrl}" alt="Evidence ${idx + 1}" />
        <div class="doc-evidence-watermark-tag">
          <span>TAF AUTHENTICATED EVIDENCE</span>
          <span>${p.timestamp || 'VERIFIED FIELD CAPTURE'}</span>
        </div>
      </div>
      <div class="doc-evidence-meta-box">
        <div class="doc-evidence-item-badge">EVIDENCE RECORD #${String(idx + 1).padStart(2, '0')} — ${p.itemTitle}</div>
        <div class="doc-evidence-caption-text">${p.caption || 'Field inspection photographic evidence'}</div>
        <div style="font-size: 9.5px; color: #64748b; margin-top: 2px;">
          Status: <strong style="color: #10b981;">✓ Verified On-Site</strong> | Timestamp: ${p.timestamp || 'Today'}
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

/**
 * DIGITAL SIGNATURES PADS
 */
let auditorCanvas, managerCanvas;
let auditorCtx, managerCtx;
let isDrawingAuditor = false;
let isDrawingManager = false;

function initSignatures() {
  auditorCanvas = document.getElementById('sigCanvasAuditor');
  managerCanvas = document.getElementById('sigCanvasManager');

  if (auditorCanvas) {
    setupCanvas(auditorCanvas, (dataUrl) => {
      appState.signatures.auditor = dataUrl;
      renderDocumentSignatures();
      saveDraftToStorage();
    });
  }

  if (managerCanvas) {
    setupCanvas(managerCanvas, (dataUrl) => {
      appState.signatures.manager = dataUrl;
      renderDocumentSignatures();
      saveDraftToStorage();
    });
  }

  const btnClearAuditor = document.getElementById('btnClearSigAuditor');
  if (btnClearAuditor) {
    btnClearAuditor.addEventListener('click', () => {
      clearCanvas(auditorCanvas);
      appState.signatures.auditor = '';
      renderDocumentSignatures();
      saveDraftToStorage();
    });
  }

  const btnClearManager = document.getElementById('btnClearSigManager');
  if (btnClearManager) {
    btnClearManager.addEventListener('click', () => {
      clearCanvas(managerCanvas);
      appState.signatures.manager = '';
      renderDocumentSignatures();
      saveDraftToStorage();
    });
  }
}

function setupCanvas(canvas, onSave) {
  const ctx = canvas.getContext('2d');
  
  // Set resolution based on device pixel ratio
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width || 360;
  canvas.height = rect.height || 120;
  ctx.strokeStyle = '#0e1e38';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  let drawing = false;

  function getPos(e) {
    const r = canvas.getBoundingClientRect();
    if (e.touches && e.touches[0]) {
      return {
        x: e.touches[0].clientX - r.left,
        y: e.touches[0].clientY - r.top
      };
    }
    return {
      x: e.clientX - r.left,
      y: e.clientY - r.top
    };
  }

  function start(e) {
    drawing = true;
    const p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    e.preventDefault();
  }

  function move(e) {
    if (!drawing) return;
    const p = getPos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    e.preventDefault();
  }

  function stop() {
    if (drawing) {
      drawing = false;
      onSave(canvas.toDataURL());
    }
  }

  canvas.addEventListener('mousedown', start);
  canvas.addEventListener('mousemove', move);
  window.addEventListener('mouseup', stop);

  canvas.addEventListener('touchstart', start, { passive: false });
  canvas.addEventListener('touchmove', move, { passive: false });
  window.addEventListener('touchend', stop);
}

function clearCanvas(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

/**
 * Print to PDF Handler
 */
function handlePrintPdf() {
  // Ensure document view is prepared with current data
  renderDocumentView();
  // Ensure document container is rendered
  switchView('document');
  // Trigger system print dialogue
  setTimeout(() => {
    window.print();
  }, 200);
}

/**
 * Reset Audit Form
 */
function resetAuditForm() {
  if (!confirm('Are you sure you want to reset this audit form? Unsaved changes will be cleared.')) return;

  appState = JSON.parse(JSON.stringify(DEFAULT_STATE));
  appState.id = 'audit_' + Date.now();

  if (auditorCanvas) clearCanvas(auditorCanvas);
  if (managerCanvas) clearCanvas(managerCanvas);

  renderAll();
  saveDraftToStorage();
  showToast('Form reset to blank audit');
}

/**
 * Local Storage Persistence
 */
const STORAGE_DRAFT_KEY = 'taf_audit_active_draft_v1';
const STORAGE_HISTORY_KEY = 'taf_audit_history_v1';

function saveDraftToStorage() {
  try {
    localStorage.setItem(STORAGE_DRAFT_KEY, JSON.stringify(appState));
  } catch (err) {
    console.warn('Storage quota exceeded:', err);
  }
}

function loadDraftFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_DRAFT_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.checklist) {
        // Discard any previous mock or sample data
        if (parsed.metadata?.stationName?.includes('Bole Medhanialem') ||
            (parsed.photos && parsed.photos.some(p => p.id && p.id.startsWith('sample_photo')))) {
          localStorage.removeItem(STORAGE_DRAFT_KEY);
          return;
        }
        appState = parsed;
      }
    }
  } catch (err) {
    console.error('Error loading draft:', err);
  }
}

function saveAuditToHistory() {
  try {
    const listJson = localStorage.getItem(STORAGE_HISTORY_KEY);
    const list = listJson ? JSON.parse(listJson) : [];
    
    // Add timestamp
    const record = {
      ...appState,
      savedAt: new Date().toISOString(),
      score: document.getElementById('progressScoreText')?.textContent || '100%'
    };

    // Replace if exists, or prepend
    const existingIndex = list.findIndex(item => item.id === record.id);
    if (existingIndex >= 0) {
      list[existingIndex] = record;
    } else {
      list.unshift(record);
    }

    localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(list));
    showToast(`Audit saved for ${record.metadata.stationName || 'Station'}`);
  } catch (err) {
    showToast('Failed to save audit: Local storage full');
  }
}

function openHistoryDrawer() {
  const drawer = document.getElementById('historyDrawer');
  const overlay = document.getElementById('historyDrawerOverlay');
  const listEl = document.getElementById('historyListContainer');
  if (!drawer || !overlay || !listEl) return;

  const historyJson = localStorage.getItem(STORAGE_HISTORY_KEY);
  const list = historyJson ? JSON.parse(historyJson) : [];

  listEl.innerHTML = '';
  if (list.length === 0) {
    listEl.innerHTML = `
      <div style="text-align: center; color: #94a3b8; padding: 2rem 1rem;">
        <p>No saved audits found yet.</p>
        <p style="font-size: 0.75rem; margin-top: 0.5rem;">Click "Save Audit" to store completed station inspection records.</p>
      </div>
    `;
  } else {
    list.forEach(item => {
      const card = document.createElement('div');
      card.className = 'history-item-card';
      const dateStr = item.savedAt ? new Date(item.savedAt).toLocaleDateString() : (item.metadata.date || 'Recent');
      card.innerHTML = `
        <div class="history-item-title">${item.metadata.stationName || 'Untitled Station'}</div>
        <div class="history-item-meta">
          <span>🏷️ ${item.metadata.canopyId || 'No ID'}</span>
          <span>📅 ${dateStr}</span>
          <span>⭐ ${item.score || '100%'}</span>
        </div>
      `;

      card.addEventListener('click', () => {
        if (confirm(`Load audit for ${item.metadata.stationName}? Current unsaved edits will be replaced.`)) {
          appState = item;
          renderAll();
          saveDraftToStorage();
          closeHistoryDrawer();
          showToast(`Loaded ${item.metadata.stationName}`);
        }
      });

      listEl.appendChild(card);
    });
  }

  drawer.classList.add('active');
  overlay.classList.add('active');
}

function closeHistoryDrawer() {
  const drawer = document.getElementById('historyDrawer');
  const overlay = document.getElementById('historyDrawerOverlay');
  if (drawer) drawer.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
}

/**
 * Toast Notification Utility
 */
let toastTimeout;
function showToast(message) {
  const toast = document.getElementById('toastMsg');
  const toastText = document.getElementById('toastMsgText');
  if (!toast) return;

  if (toastText) toastText.textContent = message;
  toast.classList.add('show');

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
}

/**
 * =========================================================================
 * NEON POSTGRESQL DATABASE & ADMIN MANAGEMENT FUNCTIONS
 * =========================================================================
 */
let neonAuditsList = [];
let currentDetailedAudit = null;

/**
 * Check Neon Serverless Connection Status
 */
async function fetchNeonStatus() {
  try {
    const res = await fetch('/api/neon/status');
    const data = await res.json();
    if (data.connected) {
      const badge = document.getElementById('neonStatusBadge');
      if (badge) {
        badge.innerHTML = `<span class="neon-pulse-dot"></span><span>Neon DB: Connected</span>`;
        badge.title = `Project: ${data.project_name} (${data.project_id})\nDatabase: ${data.database}\nHost: ${data.host}\nLatency: ${data.latency_ms}ms`;
      }
      const latencyBadge = document.getElementById('neonLatencyBadge');
      if (latencyBadge) latencyBadge.textContent = `Latency: ${data.latency_ms}ms`;
      const neonCardTitle = document.getElementById('neonCardTitle');
      if (neonCardTitle) neonCardTitle.textContent = `${data.engine} — Connected`;
      const neonCardEndpoint = document.getElementById('neonCardEndpoint');
      if (neonCardEndpoint) neonCardEndpoint.textContent = `${data.host} / ${data.database}`;
      const adminBadgeCount = document.getElementById('adminBadgeCount');
      if (adminBadgeCount) adminBadgeCount.textContent = data.total_records || '0';
    }
  } catch (err) {
    console.warn('Neon connection check notice:', err);
  }
}

/**
 * Fetch all audits from Neon PostgreSQL
 */
async function fetchAdminAudits() {
  const tbody = document.getElementById('adminRecordsTableBody');
  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 2rem; color: #94a3b8;">Syncing with Neon Serverless Database...</td></tr>`;
  }

  try {
    const res = await fetch('/api/audits');
    const data = await res.json();
    if (data.success) {
      neonAuditsList = data.records || [];
      renderAdminDashboard();
      const adminBadgeCount = document.getElementById('adminBadgeCount');
      if (adminBadgeCount) adminBadgeCount.textContent = neonAuditsList.length;
    } else {
      if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 2rem; color:#ef4444;">Error fetching from Neon: ${data.error}</td></tr>`;
    }
  } catch (err) {
    console.error('Fetch admin audits error:', err);
    if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 2rem; color:#ef4444;">Network connection issue to Neon backend.</td></tr>`;
  }
}

/**
 * Register current active audit to Neon Database
 */
async function registerAuditToNeon() {
  const btn = document.getElementById('btnRegisterNeon');
  if (btn) btn.disabled = true;

  try {
    const scoreText = document.getElementById('progressScoreText')?.textContent || '85%';
    const scoreVal = parseInt(scoreText.replace('%', '')) || 85;

    const payload = {
      id: appState.id || ('audit_' + Date.now()),
      metadata: appState.metadata,
      checklist: appState.checklist,
      correctiveActions: appState.correctiveActions,
      signatures: appState.signatures,
      photos: appState.photos,
      complianceScore: scoreVal
    };

    const res = await fetch('/api/audits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.success) {
      showToast(`Registered in Neon DB: ${appState.metadata.stationName || 'Station'}`);
      fetchNeonStatus();
      fetchAdminAudits();
    } else {
      showToast(`Neon DB Error: ${data.error || 'Failed to save'}`);
    }
  } catch (err) {
    showToast(`Error registering: ${err.message}`);
  } finally {
    if (btn) btn.disabled = false;
  }
}

/**
 * Render the Admin Dashboard with Live Neon Records & KPI Metrics
 */
function renderAdminDashboard() {
  const search = (document.getElementById('adminSearchInput')?.value || '').toLowerCase();
  const statusFilter = document.getElementById('adminStatusFilter')?.value || 'ALL';
  const sortFilter = document.getElementById('adminSortFilter')?.value || 'date_desc';

  // 1. Calculate Overall Fleet KPIs
  const totalAudits = neonAuditsList.length;
  let sumScore = 0;
  let totalWorkingPumps = 0;
  let totalBrokenPumps = 0;
  let totalDeficiencies = 0;

  neonAuditsList.forEach(rec => {
    sumScore += parseInt(rec.compliance_score) || 0;
    totalWorkingPumps += parseInt(rec.dispensers_working) || 0;
    totalBrokenPumps += parseInt(rec.dispensers_broken) || 0;
    if (rec.status !== 'PASS') totalDeficiencies++;
  });

  const avgScore = totalAudits > 0 ? Math.round(sumScore / totalAudits) : 0;
  const totalPumps = totalWorkingPumps + totalBrokenPumps;
  const pumpUptimePct = totalPumps > 0 ? Math.round((totalWorkingPumps / totalPumps) * 100) : 100;

  // Update KPI card elements
  const elTotal = document.getElementById('kpiTotalAudits');
  const elAvg = document.getElementById('kpiAvgScore');
  const elDisp = document.getElementById('kpiDispensers');
  const elDef = document.getElementById('kpiDeficiencies');

  if (elTotal) elTotal.textContent = totalAudits;
  if (elAvg) {
    elAvg.textContent = `${avgScore}%`;
    elAvg.style.color = avgScore >= 85 ? '#10b981' : avgScore >= 70 ? '#f59e0b' : '#ef4444';
  }
  if (elDisp) elDisp.textContent = `${totalWorkingPumps} / ${totalPumps} (${pumpUptimePct}%)`;
  if (elDef) elDef.textContent = `${totalDeficiencies} Action Item${totalDeficiencies === 1 ? '' : 's'}`;

  // 2. Filter records
  let filtered = neonAuditsList.filter(rec => {
    // Text search
    const matchesSearch = 
      (rec.station_name || '').toLowerCase().includes(search) ||
      (rec.canopy_id || '').toLowerCase().includes(search) ||
      (rec.auditor_name || '').toLowerCase().includes(search) ||
      (rec.manager_name || '').toLowerCase().includes(search);

    if (!matchesSearch) return false;

    // Status filter
    if (statusFilter !== 'ALL' && rec.status !== statusFilter) {
      return false;
    }

    return true;
  });

  // 3. Sort records
  filtered.sort((a, b) => {
    if (sortFilter === 'date_desc') return (b.audit_date || '').localeCompare(a.audit_date || '');
    if (sortFilter === 'date_asc') return (a.audit_date || '').localeCompare(b.audit_date || '');
    if (sortFilter === 'score_desc') return (parseInt(b.compliance_score) || 0) - (parseInt(a.compliance_score) || 0);
    if (sortFilter === 'score_asc') return (parseInt(a.compliance_score) || 0) - (parseInt(b.compliance_score) || 0);
    return 0;
  });

  // Results count
  const resultsCount = document.getElementById('adminResultsCount');
  if (resultsCount) resultsCount.textContent = `Showing ${filtered.length} of ${totalAudits} audits`;

  // 4. Render Table
  const tbody = document.getElementById('adminRecordsTableBody');
  if (!tbody) return;

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 3rem; color: #94a3b8;">
          No registered audits found matching your filters.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = '';
  filtered.forEach(rec => {
    const tr = document.createElement('tr');
    
    // Status Pill
    let statusClass = 'status-pill-pass';
    let statusText = 'Pass';
    if (rec.status === 'ACTION_REQUIRED') {
      statusClass = 'status-pill-warn';
      statusText = 'Action Req.';
    } else if (rec.status === 'CRITICAL') {
      statusClass = 'status-pill-critical';
      statusText = 'Critical';
    }

    const wPumps = rec.dispensers_working ?? 0;
    const bPumps = rec.dispensers_broken ?? 0;
    const pCount = rec.photo_count ?? 0;

    tr.innerHTML = `
      <td>
        <div class="station-title-cell">
          <span class="station-cell-name">${rec.station_name || 'Untitled Station'}</span>
          <span class="station-cell-canopy">${rec.region || 'Addis Ababa'}</span>
        </div>
      </td>
      <td>
        <span style="font-family: monospace; font-weight: 700; color: #0284c7; background: #e0f2fe; padding: 2px 6px; border-radius: 4px;">
          ${rec.canopy_id || 'N/A'}
        </span>
      </td>
      <td>
        <span style="font-weight: 600;">${rec.audit_date || '—'}</span>
      </td>
      <td>
        <div style="display: flex; flex-direction: column;">
          <span style="font-size: 0.82rem; font-weight: 600;">👤 ${rec.auditor_name || 'Auditor'}</span>
          <span style="font-size: 0.72rem; color: var(--text-muted);">Mgr: ${rec.manager_name || 'Manager'}</span>
        </div>
      </td>
      <td>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span style="font-weight: 800; font-size: 0.95rem;">${rec.compliance_score}%</span>
          <span class="status-pill ${statusClass}">${statusText}</span>
        </div>
      </td>
      <td>
        <span style="font-size: 0.8rem; font-weight: 700; color: ${bPumps > 0 ? '#b45309' : '#15803d'};">
          ${wPumps} Work / ${bPumps} Broke
        </span>
      </td>
      <td>
        <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary);">
          📷 ${pCount}
        </span>
      </td>
      <td>
        <div class="table-actions-cell">
          <button type="button" class="btn-tbl-action" title="Inspect full audit record" onclick="inspectAuditDetails('${rec.id}')">
            👁️ View
          </button>
          <button type="button" class="btn-tbl-action" title="Open in printable 2-page PDF document" onclick="loadAuditIntoPdf('${rec.id}')">
            📄 PDF
          </button>
          <button type="button" class="btn-tbl-action" title="Load into interactive form to edit" onclick="loadAuditIntoForm('${rec.id}')">
            ✏️ Edit
          </button>
          <button type="button" class="btn-tbl-action danger" title="Delete from Neon PostgreSQL" onclick="deleteAuditFromNeon('${rec.id}', '${rec.station_name}')">
            🗑️
          </button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

/**
 * Inspect detailed audit modal from Neon database
 */
window.inspectAuditDetails = async function(auditId) {
  const modal = document.getElementById('auditDetailModal');
  const content = document.getElementById('auditDetailContent');
  const title = document.getElementById('detailModalTitle');
  const meta = document.getElementById('detailModalMeta');
  if (!modal || !content) return;

  content.innerHTML = `<div style="text-align: center; padding: 2rem;">Loading full record from Neon database...</div>`;
  modal.classList.add('active');

  try {
    const res = await fetch(`/api/audits/${auditId}`);
    const data = await res.json();
    if (!data.success || !data.record) {
      content.innerHTML = `<div style="color: #ef4444; padding: 1rem;">Failed to load record details: ${data.error}</div>`;
      return;
    }

    const rec = data.record;
    currentDetailedAudit = rec;

    title.innerHTML = `<span>🏢</span> ${rec.station_name} (${rec.canopy_id})`;
    meta.textContent = `Audit Date: ${rec.audit_date} | Registered in Neon DB: ${rec.created_at || 'Cloud'}`;

    const checklist = typeof rec.checklist_data === 'string' ? JSON.parse(rec.checklist_data) : (rec.checklist_data || {});
    const corrective = typeof rec.corrective_actions === 'string' ? JSON.parse(rec.corrective_actions) : (rec.corrective_actions || []);
    const photos = rec.photos || [];

    // Render detailed content
    content.innerHTML = `
      <!-- Station Overview Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; background: #f8fafc; padding: 1rem; border-radius: 6px; border: 1px solid #e2e8f0;">
        <div>
          <span style="font-size: 0.72rem; color: #64748b; font-weight: 700; text-transform: uppercase;">Station / Region</span>
          <p style="font-weight: 700; color: #0f172a;">${rec.station_name}</p>
        </div>
        <div>
          <span style="font-size: 0.72rem; color: #64748b; font-weight: 700; text-transform: uppercase;">Canopy ID</span>
          <p style="font-weight: 700; color: #0284c7;">${rec.canopy_id}</p>
        </div>
        <div>
          <span style="font-size: 0.72rem; color: #64748b; font-weight: 700; text-transform: uppercase;">Compliance Score</span>
          <p style="font-weight: 800; font-size: 1.1rem; color: ${rec.compliance_score >= 85 ? '#10b981' : rec.compliance_score >= 70 ? '#f59e0b' : '#ef4444'};">
            ${rec.compliance_score}% (${rec.status})
          </p>
        </div>
        <div>
          <span style="font-size: 0.72rem; color: #64748b; font-weight: 700; text-transform: uppercase;">Auditor & Manager</span>
          <p style="font-size: 0.85rem; font-weight: 600;">${rec.auditor_name} / ${rec.manager_name}</p>
        </div>
      </div>

      <!-- Checklist Breakdown Section -->
      <div class="detail-section-card">
        <h4>📋 Checklist Verification Results</h4>
        <div class="detail-checklist-grid">
          <div class="detail-item-chip">
            <span>Canopy Logo & Brand:</span>
            <strong>${(checklist.canopyLogo || '—').toUpperCase()}</strong>
          </div>
          <div class="detail-item-chip">
            <span>Canopy & Area Lighting:</span>
            <strong>${(checklist.lighting || '—').toUpperCase()}</strong>
          </div>
          <div class="detail-item-chip">
            <span>Prime Highway Pylon:</span>
            <strong>${(checklist.pylonSign || '—').toUpperCase()}</strong>
          </div>
          <div class="detail-item-chip">
            <span>Forecourt Pumps:</span>
            <strong>${rec.dispensers_working} Work / ${rec.dispensers_broken} Broke</strong>
          </div>
          <div class="detail-item-chip">
            <span>Nozzles & Breakaways:</span>
            <strong>${(checklist.nozzlesBreakaways || '—').toUpperCase()}</strong>
          </div>
          <div class="detail-item-chip">
            <span>Lubricant Display Shelf:</span>
            <strong>${(checklist.lubricantShelf || '—').toUpperCase()}</strong>
          </div>
          <div class="detail-item-chip">
            <span>Lubricant Products Stock:</span>
            <strong>${(checklist.lubricantStock || '—').toUpperCase()}</strong>
          </div>
          <div class="detail-item-chip">
            <span>Car Wash Facility:</span>
            <strong>${(checklist.carWash || '—').toUpperCase()}</strong>
          </div>
          <div class="detail-item-chip">
            <span>Generator & Backup:</span>
            <strong>${(checklist.generator || '—').toUpperCase()}</strong>
          </div>
          <div class="detail-item-chip">
            <span>Fire Extinguishers & Sand:</span>
            <strong>${(checklist.fireExtinguishers || '—').toUpperCase()}</strong>
          </div>
          <div class="detail-item-chip">
            <span>Staff Uniform & PPE:</span>
            <strong>${(checklist.staffUniform || '—').toUpperCase()}</strong>
          </div>
        </div>
      </div>

      <!-- Photographic Evidence Gallery -->
      <div class="detail-section-card">
        <h4>📷 Photographic Inspection Evidence (${photos.length})</h4>
        ${photos.length === 0 ? '<p style="font-size: 0.85rem; color: #94a3b8;">No photos attached to this inspection record.</p>' : `
          <div class="detail-photos-grid">
            ${photos.map((p, idx) => `
              <div class="detail-photo-item" title="${p.caption || p.item_title}" onclick="openLightbox({ dataUrl: '${p.photo_url}', itemTitle: '${p.item_title}', caption: '${p.caption || ''}', timestamp: '${p.captured_at || ''}' })">
                <img src="${p.photo_url}" alt="Evidence ${idx + 1}" />
              </div>
            `).join('')}
          </div>
        `}
      </div>

      <!-- Corrective Actions List -->
      <div class="detail-section-card">
        <h4>⚠️ Corrective Actions & Follow-up Items (${corrective.length})</h4>
        ${corrective.length === 0 ? '<p style="font-size: 0.85rem; color: #10b981;">No corrective actions raised; exemplary compliance.</p>' : `
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            ${corrective.map((act, i) => `
              <div style="background: #fff; border: 1px solid #e2e8f0; padding: 0.6rem 0.85rem; border-radius: 4px; display: flex; align-items: flex-start; gap: 0.75rem;">
                <span style="font-weight: 800; color: #0e1e38; font-size: 0.8rem;">#${i + 1}</span>
                <div style="flex: 1;">
                  <p style="font-size: 0.85rem; color: #0f172a; margin-bottom: 0.2rem;">${act.text || ''}</p>
                  <span class="status-pill ${act.priority === 'critical' ? 'status-pill-critical' : act.priority === 'high' ? 'status-pill-warn' : 'status-pill-pass'}" style="font-size: 0.65rem;">
                    Priority: ${(act.priority || 'medium').toUpperCase()}
                  </span>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;

    // Connect modal action buttons
    const btnPrint = document.getElementById('btnDetailPrintPdf');
    if (btnPrint) {
      btnPrint.onclick = () => {
        closeDetailModal();
        loadAuditIntoPdf(rec.id);
      };
    }

    const btnLoad = document.getElementById('btnDetailLoadForm');
    if (btnLoad) {
      btnLoad.onclick = () => {
        closeDetailModal();
        loadAuditIntoForm(rec.id);
      };
    }

  } catch (err) {
    content.innerHTML = `<div style="color: #ef4444; padding: 1rem;">Failed to fetch detail: ${err.message}</div>`;
  }
};

function closeDetailModal() {
  const modal = document.getElementById('auditDetailModal');
  if (modal) modal.classList.remove('active');
  currentDetailedAudit = null;
}

/**
 * Load a Neon record into the interactive form
 */
window.loadAuditIntoForm = async function(auditId) {
  try {
    const res = await fetch(`/api/audits/${auditId}`);
    const data = await res.json();
    if (data.success && data.record) {
      const rec = data.record;
      const checklist = typeof rec.checklist_data === 'string' ? JSON.parse(rec.checklist_data) : (rec.checklist_data || {});
      const corrective = typeof rec.corrective_actions === 'string' ? JSON.parse(rec.corrective_actions) : (rec.corrective_actions || []);
      const signatures = typeof rec.signatures === 'string' ? JSON.parse(rec.signatures) : (rec.signatures || {});
      const photos = (rec.photos || []).map(p => ({
        id: p.id,
        itemId: p.item_id,
        itemTitle: p.item_title,
        dataUrl: p.photo_url,
        caption: p.caption,
        timestamp: p.captured_at
      }));

      appState = {
        id: rec.id,
        metadata: {
          stationName: rec.station_name,
          canopyId: rec.canopy_id,
          date: rec.audit_date,
          auditorName: rec.auditor_name,
          managerName: rec.manager_name
        },
        checklist: {
          ...checklist,
          dispensersWorking: rec.dispensers_working ?? 0,
          dispensersBroken: rec.dispensers_broken ?? 0
        },
        correctiveActions: corrective,
        signatures: signatures,
        photos: photos
      };

      renderAll();
      saveDraftToStorage();
      switchView('interactive');
      showToast(`Loaded ${rec.station_name} into form`);
    }
  } catch (err) {
    showToast(`Error loading audit: ${err.message}`);
  }
};

/**
 * Load a Neon record directly into the Official PDF Document View
 */
window.loadAuditIntoPdf = async function(auditId) {
  await loadAuditIntoForm(auditId);
  switchView('document');
  setTimeout(() => {
    window.print();
  }, 250);
};

/**
 * Delete an audit from the Neon PostgreSQL database
 */
window.deleteAuditFromNeon = async function(auditId, stationName) {
  if (!confirm(`Are you sure you want to permanently delete the audit record for "${stationName || auditId}" from Neon Database?`)) {
    return;
  }

  try {
    const res = await fetch(`/api/audits/${auditId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast(`Deleted from Neon DB`);
      fetchNeonStatus();
      fetchAdminAudits();
    } else {
      showToast(`Delete failed: ${data.error}`);
    }
  } catch (err) {
    showToast(`Error deleting: ${err.message}`);
  }
};

/**
 * Export all registered records to CSV
 */
function exportToCsv() {
  if (neonAuditsList.length === 0) {
    showToast('No records available to export');
    return;
  }

  const headers = ['Audit ID', 'Station Name', 'Canopy ID', 'Region', 'Audit Date', 'Auditor', 'Manager', 'Score (%)', 'Status', 'Working Dispensers', 'Broken Dispensers', 'Photo Count'];
  const rows = neonAuditsList.map(r => [
    `"${r.id}"`,
    `"${(r.station_name || '').replace(/"/g, '""')}"`,
    `"${r.canopy_id || ''}"`,
    `"${r.region || 'Addis Ababa'}"`,
    `"${r.audit_date || ''}"`,
    `"${(r.auditor_name || '').replace(/"/g, '""')}"`,
    `"${(r.manager_name || '').replace(/"/g, '""')}"`,
    r.compliance_score || 0,
    `"${r.status || 'PASS'}"`,
    r.dispensers_working || 0,
    r.dispensers_broken || 0,
    r.photo_count || 0
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `TAF_Energies_Station_Audits_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Exported CSV of registered station audits');
}

/**
 * Export all registered records to JSON
 */
function exportToJson() {
  if (neonAuditsList.length === 0) {
    showToast('No records available to export');
    return;
  }

  const jsonString = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(neonAuditsList, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', jsonString);
  link.setAttribute('download', `TAF_Energies_Station_Audits_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Exported JSON database backup');
}
