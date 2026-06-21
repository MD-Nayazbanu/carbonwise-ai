// js/app.js - Main Application Coordinator (SPA Controller & UI Bindings)

import { db } from './db.js';
import { calculateFootprint, getBenchmarkComparison } from './calculator.js';
import { generateRecommendations, generateGoalRoadmap } from './recommendations.js';
import { calculateSimulation } from './simulator.js';
import { getChallengesWithStatus, calculateEarnedXP } from './challenges.js';
import { BADGES, checkUnlockedBadges, drawCertificate, getBadgeById } from './badges.js';
import { runDiagnostics } from './diagnostics.js';

// Global UI State
let currentStepIndex = 0;
const formSteps = document.querySelectorAll('.form-step-section');
const navStepBtns = document.querySelectorAll('.btn-tab-nav[data-step]');
const prevBtn = document.getElementById('btn-form-prev');
const nextBtn = document.getElementById('btn-form-next');
const submitBtn = document.getElementById('btn-form-submit');
const progressBar = document.getElementById('assessment-progress-bar');

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize Database
  await db.init();
  
  // Bind database status updates to UI status bars
  db.onStatusChange = handleDbStatusChange;
  db.onStatusChange({
    isFirebaseConnected: db.isFirebaseConnected,
    isSyncActive: db.isSyncActive,
    lastSyncTimestamp: db.lastSyncTimestamp,
    profileId: db.state.profileId
  });

  // Load User Theme Preference
  initTheme();

  // Setup Event Listeners
  setupNavigation();
  setupSettingsModal();
  setupAssessmentForm();
  setupGoalPlanner();
  setupSimulator();
  setupChallenges();
  setupAchievements();
  setupDiagnostics();
  setupUtilityModals();

  // Initial UI Render
  renderAll();
});

// ================= THEME TOGGLE (Accessibility & Customization) =================
function initTheme() {
  const savedTheme = localStorage.getItem('carbonwise_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  const toggleBtn = document.getElementById('theme-toggle');
  toggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('carbonwise_theme', newTheme);
    updateThemeIcon(newTheme);
  });
}

function updateThemeIcon(theme) {
  const toggleBtn = document.getElementById('theme-toggle');
  if (theme === 'light') {
    toggleBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
    `;
  } else {
    toggleBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    `;
  }
}

// ================= DATABASE SYNC / METADATA UPDATES =================
function handleDbStatusChange(status) {
  // Update Sync Status Bar Pills
  const statusPill = document.getElementById('db-status-pill');
  const statusText = document.getElementById('db-status-text');
  const profileIdDisplay = document.getElementById('display-profile-id');
  const syncTimeDisplay = document.getElementById('sync-time-info');

  if (profileIdDisplay) profileIdDisplay.textContent = status.profileId;
  
  if (status.isFirebaseConnected) {
    statusPill.className = 'status-pill connected';
    statusText.textContent = 'Cloud Sync Active';
  } else {
    statusPill.className = 'status-pill offline';
    statusText.textContent = 'Cloud Sync Offline';
  }

  if (status.lastSyncTimestamp) {
    syncTimeDisplay.textContent = `Last Synced: ${status.lastSyncTimestamp}`;
  } else {
    syncTimeDisplay.textContent = 'Last Synced: Never';
  }

  // Update Settings Profile Input field
  const profileInput = document.getElementById('settings-profile-id');
  if (profileInput) profileInput.value = status.profileId;
}

// ================= VIEW ROUTER & TABS NAVIGATION =================
function setupNavigation() {
  const tabs = document.querySelectorAll('.nav-links button');
  const views = document.querySelectorAll('.app-view');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-target');
      
      // Update navigation active status
      tabs.forEach(t => {
        t.parentElement.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.parentElement.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      // Switch active view
      views.forEach(view => {
        if (view.id === target) {
          view.classList.add('active');
        } else {
          view.classList.remove('active');
        }
      });

      // Manage focus for accessibility: Move keyboard focus to main view wrapper
      const mainContent = document.getElementById('main-content');
      mainContent.focus();

      // Trigger animations / charts redraw on tab changes
      if (target === 'dashboard') {
        renderDashboard();
      } else if (target === 'challenges') {
        renderChallenges();
      } else if (target === 'badges') {
        renderAchievements();
      }
    });
  });

  // Start Assessment button in welcome jumbotron
  const startAssessmentBtn = document.getElementById('dash-btn-start');
  startAssessmentBtn.addEventListener('click', () => {
    const assessmentTab = document.querySelector('button[data-target="assessment"]');
    if (assessmentTab) assessmentTab.click();
  });

  // Simulator fallback tab button redirect
  const simGotoCalcBtn = document.getElementById('sim-btn-goto-calc');
  simGotoCalcBtn.addEventListener('click', () => {
    const assessmentTab = document.querySelector('button[data-target="assessment"]');
    if (assessmentTab) assessmentTab.click();
  });
}

// ================= MULTI-STEP ASSESSMENT FORM =================
function setupAssessmentForm() {
  const form = document.getElementById('assessment-form');

  // Side-nav updates
  navStepBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const stepIndex = parseInt(btn.getAttribute('data-step'));
      if (validateFormStep(currentStepIndex) || stepIndex < currentStepIndex) {
        goToStep(stepIndex);
      }
    });
  });

  // Form Prev Button click
  prevBtn.addEventListener('click', () => {
    if (currentStepIndex > 0) {
      goToStep(currentStepIndex - 1);
    }
  });

  // Form Next Button click
  nextBtn.addEventListener('click', () => {
    if (currentStepIndex < formSteps.length - 1) {
      if (validateFormStep(currentStepIndex)) {
        goToStep(currentStepIndex + 1);
      }
    }
  });

  // Form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateFormStep(currentStepIndex)) return;

    // Collect validated values
    const inputs = {
      carDistance: parseFloat(document.getElementById('carDistance').value) || 0,
      carFuelType: document.getElementById('carFuelType').value,
      transitDistance: parseFloat(document.getElementById('transitDistance').value) || 0,
      flightsShort: parseInt(document.getElementById('flightsShort').value) || 0,
      flightsLong: parseInt(document.getElementById('flightsLong').value) || 0,
      electricityKwh: parseFloat(document.getElementById('electricityKwh').value) || 0,
      renewableShare: parseFloat(document.getElementById('renewableShare').value) || 0,
      dietType: document.getElementById('dietType').value,
      shoppingSpend: parseFloat(document.getElementById('shoppingSpend').value) || 0,
      wasteVolume: document.getElementById('wasteVolume').value,
      recyclingLevel: document.getElementById('recyclingLevel').value
    };

    // Run Calculations
    const results = calculateFootprint(inputs);

    // Save state
    await db.updateState(state => {
      // Append current footprint to history list
      const timestamp = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      state.assessmentHistory.push({
        date: timestamp,
        annualTotal: results.annualTotal,
        score: results.score
      });
      state.currentAssessment = results;
      
      // Auto unlock badges
      const unlockedBadges = checkUnlockedBadges(state);
      state.earnedBadges = unlockedBadges;
    });

    // Reset Form Progress
    goToStep(0);
    form.reset();

    // Re-render dashboard and navigate back
    renderAll();
    const dashboardTab = document.querySelector('button[data-target="dashboard"]');
    if (dashboardTab) dashboardTab.click();
  });
}

function goToStep(stepIndex) {
  currentStepIndex = stepIndex;
  
  // Show / hide step containers
  formSteps.forEach((step, idx) => {
    if (idx === stepIndex) {
      step.style.display = 'block';
      step.classList.add('active');
    } else {
      step.style.display = 'none';
      step.classList.remove('active');
    }
  });

  // Update nav highlights
  navStepBtns.forEach((btn, idx) => {
    if (idx === stepIndex) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Update buttons visibility
  prevBtn.style.visibility = stepIndex === 0 ? 'hidden' : 'visible';
  if (stepIndex === formSteps.length - 1) {
    nextBtn.style.display = 'none';
    submitBtn.style.display = 'inline-flex';
  } else {
    nextBtn.style.display = 'inline-flex';
    submitBtn.style.display = 'none';
  }

  // Update progress bar percentage
  const progressPct = ((stepIndex + 1) / formSteps.length) * 100;
  progressBar.style.width = `${progressPct}%`;
  progressBar.parentElement.setAttribute('aria-valuenow', progressPct);
}

function validateFormStep(stepIndex) {
  const container = formSteps[stepIndex];
  const inputs = container.querySelectorAll('input[type="number"]');
  let isValid = true;

  // Clear previous validation styling
  inputs.forEach(input => {
    input.style.borderColor = '';
    const errSpan = input.parentElement.querySelector('.form-err-msg');
    if (errSpan) errSpan.remove();
  });

  inputs.forEach(input => {
    const val = parseFloat(input.value);
    
    // Check for negative numbers or missing numbers
    if (isNaN(val) || val < 0) {
      isValid = false;
      input.style.borderColor = 'var(--color-danger)';
      
      const errMsg = document.createElement('span');
      errMsg.className = 'form-err-msg';
      errMsg.style.color = 'var(--color-danger)';
      errMsg.style.fontSize = '0.75rem';
      errMsg.style.marginTop = '4px';
      errMsg.style.display = 'block';
      errMsg.textContent = 'Please enter a positive value.';
      input.parentElement.appendChild(errMsg);
    }
  });

  return isValid;
}

// ================= RENDER ENGINES (UI Redrawing) =================
function renderAll() {
  renderDashboard();
  renderSimulator();
  renderChallenges();
  renderAchievements();
}

function renderDashboard() {
  const assessment = db.state.currentAssessment;

  // Render stats metrics
  const annualVal = document.getElementById('dash-annual-val');
  const monthlyVal = document.getElementById('dash-monthly-val');
  const scoreVal = document.getElementById('dash-score');
  const scoreFill = document.getElementById('dash-score-fill');
  const scoreDesc = document.getElementById('dash-score-desc');
  const coachTip = document.getElementById('dashboard-coach-tip');
  const changeVal = document.getElementById('dash-change-val');

  if (!assessment) {
    annualVal.textContent = '--';
    monthlyVal.textContent = '--';
    scoreVal.textContent = '--';
    scoreFill.setAttribute('stroke-dashoffset', '251.2');
    changeVal.textContent = 'No record yet';
    return;
  }

  // Set numeric data text safely via textContent to prevent XSS
  annualVal.textContent = `${assessment.annualTotal.toLocaleString()} kg`;
  monthlyVal.textContent = `${assessment.monthlyTotal.toLocaleString()}`;
  scoreVal.textContent = assessment.score;

  // Score circular gauge math
  // Circumference of path is 2 * PI * r = 2 * 3.14159 * 40 = 251.2
  const offset = 251.2 - (251.2 * assessment.score) / 100;
  scoreFill.setAttribute('stroke-dashoffset', offset);

  // Set score level text descriptions
  if (assessment.score >= 85) {
    scoreDesc.textContent = 'Excellent! Your footprint is well below the target limit.';
    scoreDesc.style.color = 'var(--color-success)';
  } else if (assessment.score >= 60) {
    scoreDesc.textContent = 'Moderate emissions. Some minor tweaks could bridge the gap.';
    scoreDesc.style.color = 'var(--color-warning)';
  } else {
    scoreDesc.textContent = 'High emissions! Review the recommendations roadmap for action.';
    scoreDesc.style.color = 'var(--color-danger)';
  }

  // Render delta history comparison compared to past assessment
  const history = db.state.assessmentHistory || [];
  if (history.length > 1) {
    const prev = history[history.length - 2];
    const diff = assessment.annualTotal - prev.annualTotal;
    const diffPct = Math.round((Math.abs(diff) / prev.annualTotal) * 100);
    
    if (diff < 0) {
      changeVal.innerHTML = `<span class="change-down">▼ -${diffPct}%</span> since last assessment`;
    } else if (diff > 0) {
      changeVal.innerHTML = `<span class="change-up">▲ +${diffPct}%</span> since last assessment`;
    } else {
      changeVal.textContent = 'No change since last assessment';
    }
  } else {
    changeVal.textContent = 'First baseline assessment saved';
  }

  // Render SVG Category chart
  renderCategoryChart(assessment.breakdown);

  // Render Real World Impact equivalents
  renderImpactEquivalents(assessment.annualTotal);

  // Render Twin Benchmark
  renderTwinBenchmark(assessment.annualTotal);

  // Render Journey History list
  renderTimelineHistory(history);

  // Render AI Coach Tip
  const recs = generateRecommendations(assessment);
  let coachHtml = '';
  if (recs.highImpact.length > 0) {
    const topRec = recs.highImpact[0];
    coachHtml = `
      <p style="margin-bottom:12px;"><strong>Top Priority Action:</strong></p>
      <div class="rec-card">
        <span class="rec-impact-badge rec-high">High</span>
        <div class="rec-details">
          <p class="rec-text">${topRec.text}</p>
          <p class="rec-description">${topRec.desc}</p>
        </div>
        <div class="rec-savings">-${topRec.reduction.toLocaleString()} kg</div>
      </div>
    `;
  } else if (recs.quickWins.length > 0) {
    const topRec = recs.quickWins[0];
    coachHtml = `
      <p style="margin-bottom:12px;"><strong>Quick Win Recommendation:</strong></p>
      <div class="rec-card">
        <span class="rec-impact-badge rec-low">Quick Win</span>
        <div class="rec-details">
          <p class="rec-text">${topRec.text}</p>
          <p class="rec-description">${topRec.desc}</p>
        </div>
        <div class="rec-savings">-${topRec.reduction.toLocaleString()} kg</div>
      </div>
    `;
  } else {
    coachHtml = `<p>Spectacular job! The coach currently has no recommendations. Keep maintaining your zero carbon champion limits.</p>`;
  }
  coachTip.innerHTML = coachHtml;

  // Redraw Goal Roadmap if goal exists
  if (db.state.goal) {
    document.getElementById('goal-roadmap-container').style.display = 'block';
    const targetFootprint = Math.round(assessment.annualTotal * (1 - db.state.goal.targetPercent / 100));
    renderRoadmapSteps(assessment, targetFootprint);
    // Sync slider values
    document.getElementById('goal-percentage-range').value = db.state.goal.targetPercent;
    document.getElementById('goal-slider-value').textContent = `${db.state.goal.targetPercent}%`;
  }
}

// Renders the horizontal bar chart securely
function renderCategoryChart(breakdown) {
  const container = document.getElementById('dash-breakdown');
  if (!container) return;

  const categories = [
    { key: 'transportation', label: 'Transportation', color: 'hsl(210, 80%, 55%)' },
    { key: 'electricity', label: 'Electricity', color: 'hsl(35, 90%, 55%)' },
    { key: 'food', label: 'Food & Diet', color: 'hsl(142, 60%, 45%)' },
    { key: 'shopping', label: 'Shopping', color: 'hsl(270, 70%, 55%)' },
    { key: 'waste', label: 'Waste Disposal', color: 'hsl(350, 75%, 55%)' }
  ];

  const maxVal = Math.max(...categories.map(c => breakdown[c.key] || 0), 100);
  
  let html = '';
  categories.forEach(cat => {
    const val = breakdown[cat.key] || 0;
    const barWidthPct = Math.max(2, (val / maxVal) * 75); // max 75% bar length
    
    html += `
      <div style="display: flex; align-items: center; margin-bottom: 12px;">
        <span style="width: 100px; font-size: 0.8rem; font-weight: 600; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${cat.label}</span>
        <div style="flex: 1; height: 12px; background: rgba(255,255,255,0.03); border-radius: 4px; overflow: hidden; border: 1px solid var(--border-color); margin: 0 16px;">
          <div class="bar-fill" style="width: 0%; height: 100%; background: ${cat.color}; border-radius: 4px; transition: width 0.8s ease-out;" data-width="${barWidthPct}%"></div>
        </div>
        <span style="width: 75px; text-align: right; font-family: var(--font-heading); font-weight: 700; font-size: 0.85rem;">${val.toLocaleString()} kg</span>
      </div>
    `;
  });

  container.innerHTML = html;

  setTimeout(() => {
    container.querySelectorAll('.bar-fill').forEach(bar => {
      bar.style.width = bar.getAttribute('data-width');
    });
  }, 50);
}

// Renders the twin benchmarks comparison bars
function renderTwinBenchmark(userAnnual) {
  const container = document.getElementById('twin-comparison');
  if (!container) return;

  const comparisons = [
    { name: 'Sustainability Champion', value: 2000, color: 'var(--color-success)', desc: 'Target global limit to avoid warming' },
    { name: 'Average Student', value: 4500, color: 'var(--color-info)', desc: 'Typical student dorm/commute profile' },
    { name: 'Average Urban Resident', value: 8200, color: 'var(--color-warning)', desc: 'Baseline grid/transit city averages' },
    { name: 'Your Footprint', value: userAnnual, color: 'var(--primary-base)', desc: 'Your calculated annual carbon output', isUser: true }
  ];

  const maxVal = Math.max(...comparisons.map(c => c.value), 100);

  let html = '';
  comparisons.forEach(c => {
    const widthPct = Math.min(100, (c.value / maxVal) * 100);
    const borderStyle = c.isUser ? 'border: 1px solid var(--primary-base); background: rgba(16, 185, 129, 0.05);' : '';
    
    html += `
      <div class="benchmark-item" style="padding: 10px; border-radius: var(--radius-sm); ${borderStyle}">
        <div class="benchmark-meta">
          <span class="benchmark-name" style="${c.isUser ? 'color: var(--primary-base); font-weight: 800;' : ''}">${c.name}</span>
          <span class="benchmark-value">${c.value.toLocaleString()} kg</span>
        </div>
        <div class="benchmark-bar-outer">
          <div class="benchmark-bar-inner" style="width: 0%; background-color: ${c.color};" data-width="${widthPct}%"></div>
        </div>
        <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 2px;">${c.desc}</div>
      </div>
    `;
  });

  container.innerHTML = html;

  setTimeout(() => {
    container.querySelectorAll('.benchmark-bar-inner').forEach(bar => {
      bar.style.width = bar.getAttribute('data-width');
    });
  }, 50);
}

// Renders dynamic timeline history items
function renderTimelineHistory(history) {
  const container = document.getElementById('timeline-list');
  if (!container) return;

  if (history.length === 0) {
    container.innerHTML = '<p style="font-size: 0.85rem; color: var(--text-muted); padding: 10px 0;">No history recorded yet.</p>';
    return;
  }

  // Render reverse chronological order (newest first)
  const items = [...history].reverse();
  container.innerHTML = items.map(item => `
    <div class="timeline-item">
      <div class="timeline-date">${item.date}</div>
      <div class="timeline-content">
        Footprint: <strong>${item.annualTotal.toLocaleString()} kg</strong> | Score: <strong>${item.score}/100</strong>
      </div>
    </div>
  `).join('');
}

// Render dynamic equivalents card values
function renderImpactEquivalents(userAnnual) {
  const treeVal = document.getElementById('impact-tree-val');
  const carVal = document.getElementById('impact-car-val');
  const electricVal = document.getElementById('impact-electric-val');

  // Using a benchmark baseline of the average urban resident (8200 kg) to calculate savings
  const baseline = 8200;
  const savings = Math.max(0, baseline - userAnnual);

  const trees = Math.round(savings / 22);
  const car = Math.round(savings / 0.18);
  const elec = Math.round(savings / 6.3);

  treeVal.textContent = trees.toLocaleString();
  carVal.textContent = `${car.toLocaleString()} km`;
  electricVal.textContent = `${elec.toLocaleString()} Days`;
}

// ================= CARBON GOAL PLANNER =================
function setupGoalPlanner() {
  const range = document.getElementById('goal-percentage-range');
  const valueDisplay = document.getElementById('goal-slider-value');
  const calcDisplay = document.getElementById('goal-calc-summary');
  const saveBtn = document.getElementById('btn-save-goal');

  const updateGoalMath = () => {
    const assessment = db.state.currentAssessment;
    if (!assessment) return;
    
    const pct = parseInt(range.value);
    valueDisplay.textContent = `${pct}%`;

    const targetVal = Math.round(assessment.annualTotal * (1 - pct / 100));
    calcDisplay.innerHTML = `Target Footprint: <strong>${targetVal.toLocaleString()} kg CO₂/year</strong>`;
  };

  range.addEventListener('input', updateGoalMath);

  saveBtn.addEventListener('click', async () => {
    const assessment = db.state.currentAssessment;
    if (!assessment) {
      alert("Please complete the carbon assessment first to define a baseline.");
      return;
    }

    const pct = parseInt(range.value);
    const targetVal = Math.round(assessment.annualTotal * (1 - pct / 100));

    await db.updateState(state => {
      state.goal = {
        targetPercent: pct,
        targetFootprint: targetVal,
        targetDate: new Date().toISOString()
      };
    });

    // Render roadmap timeline UI
    document.getElementById('goal-roadmap-container').style.display = 'block';
    renderRoadmapSteps(assessment, targetVal);
  });
}

function renderRoadmapSteps(assessment, targetFootprint) {
  const stepsContainer = document.getElementById('goal-timeline-steps');
  if (!stepsContainer) return;

  const roadmap = generateGoalRoadmap(assessment, targetFootprint);
  
  if (roadmap.steps.length === 0) {
    stepsContainer.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem;">Your current footprint is below your selected goal. No extra milestones needed!</p>';
    return;
  }

  stepsContainer.innerHTML = roadmap.steps.map(step => `
    <div class="roadmap-step">
      <div class="roadmap-title">Month ${step.month}: ${step.title}</div>
      <div class="roadmap-desc">${step.desc}</div>
      <div style="font-size:0.75rem; color:var(--primary-base); font-weight:700; margin-top:2px;">
        Est. reduction: -${step.reduction.toLocaleString()} kg CO₂/year
      </div>
    </div>
  `).join('');
}

// ================= CARBON REDUCTION SIMULATOR =================
function setupSimulator() {
  const simWorkspace = document.getElementById('simulator-workspace');
  const simNoData = document.getElementById('simulator-no-data');

  // Slider controls
  const carSlider = document.getElementById('sim-car-reduction');
  const carLabel = document.getElementById('sim-car-reduction-val');
  const carFuelSelect = document.getElementById('sim-car-fuel');
  
  const flightsSlider = document.getElementById('sim-flights-reduction');
  const flightsLabel = document.getElementById('sim-flights-reduction-val');
  
  const renewSlider = document.getElementById('sim-renewable-share');
  const renewLabel = document.getElementById('sim-renewable-share-val');
  
  const dietSelect = document.getElementById('sim-diet-type');
  const wasteSelect = document.getElementById('sim-recycling');

  // Outputs
  const projectedSavings = document.getElementById('sim-projected-savings');
  const baselineDisplay = document.getElementById('sim-baseline-val');
  const projectedDisplay = document.getElementById('sim-projected-val');
  const equivTrees = document.getElementById('sim-equiv-trees');
  const equivCar = document.getElementById('sim-equiv-car');
  const equivElectric = document.getElementById('sim-equiv-electric');

  const runSimulation = () => {
    const baseAssessment = db.state.currentAssessment;
    if (!baseAssessment) return;

    const carPct = parseInt(carSlider.value);
    carLabel.textContent = `${carPct}%`;

    const flightsPct = parseInt(flightsSlider.value);
    flightsLabel.textContent = `${flightsPct}%`;

    const renewPct = parseInt(renewSlider.value);
    renewLabel.textContent = `${renewPct}%`;

    // Package simulated overrides
    const overrides = {
      carReductionPct: carPct,
      carFuelType: carFuelSelect.value,
      flightsReductionPct: flightsPct,
      renewableShare: renewPct,
      dietType: dietSelect.value,
      recyclingLevel: wasteSelect.value
    };

    const sim = calculateSimulation(baseAssessment, overrides);

    // Update simulation displays
    projectedSavings.textContent = `${sim.reductionPercent}%`;
    baselineDisplay.textContent = `${baseAssessment.annualTotal.toLocaleString()} kg`;
    projectedDisplay.textContent = `${sim.projectedAnnual.toLocaleString()} kg`;

    equivTrees.textContent = `${sim.equivalents.trees.toLocaleString()} trees`;
    equivCar.textContent = `${sim.equivalents.carKm.toLocaleString()} km`;
    equivElectric.textContent = `${sim.equivalents.electricityDays.toLocaleString()} Days`;
  };

  // Bind change listeners to triggers
  const controls = [carSlider, carFuelSelect, flightsSlider, renewSlider, dietSelect, wasteSelect];
  controls.forEach(control => {
    control.addEventListener('input', runSimulation);
    control.addEventListener('change', runSimulation);
  });
}

function renderSimulator() {
  const simWorkspace = document.getElementById('simulator-workspace');
  const simNoData = document.getElementById('simulator-no-data');
  const baseAssessment = db.state.currentAssessment;

  if (!baseAssessment) {
    simWorkspace.style.display = 'none';
    simNoData.style.display = 'block';
  } else {
    simWorkspace.style.display = 'grid';
    simNoData.style.display = 'none';

    // Set simulator baseline controls defaults based on assessment inputs
    document.getElementById('sim-car-fuel').value = baseAssessment.inputs.carFuelType || 'carGasoline';
    document.getElementById('sim-diet-type').value = baseAssessment.inputs.dietType || 'dietAverage';
    document.getElementById('sim-recycling').value = baseAssessment.inputs.recyclingLevel || 'recyclingMedium';
    
    // Set simulator slider resets
    document.getElementById('sim-car-reduction').value = 0;
    document.getElementById('sim-flights-reduction').value = 0;
    document.getElementById('sim-renewable-share').value = baseAssessment.inputs.renewableShare || 0;
    
    // Trigger baseline render
    const inputEvt = new Event('input');
    document.getElementById('sim-car-reduction').dispatchEvent(inputEvt);
  }
}

// ================= ECO CHALLENGES SYSTEM =================
function setupChallenges() {
  const container = document.getElementById('challenge-list-container');
  
  container.addEventListener('click', async (e) => {
    const btn = e.target.closest('.challenge-btn');
    if (!btn) return;

    const challengeId = btn.getAttribute('data-id');
    const isCompleted = btn.getAttribute('data-completed') === 'true';

    await db.updateState(state => {
      if (isCompleted) {
        // Toggle off completion (reset state)
        state.completedChallenges = state.completedChallenges.filter(id => id !== challengeId);
      } else {
        // Push completion
        if (!state.completedChallenges.includes(challengeId)) {
          state.completedChallenges.push(challengeId);
        }
      }
    });

    renderChallenges();
  });
}

function renderChallenges() {
  const container = document.getElementById('challenge-list-container');
  if (!container) return;

  const completedIds = db.state.completedChallenges || [];
  const activeChallenges = getChallengesWithStatus(completedIds);
  const totalXp = calculateEarnedXP(completedIds);

  document.getElementById('challenges-xp-total').textContent = `Total XP: ${totalXp}`;

  container.innerHTML = activeChallenges.map(c => {
    const btnText = c.isCompleted ? '✓ Completed' : 'Complete Challenge';
    const btnClass = c.isCompleted ? 'btn btn-secondary' : 'btn btn-primary';
    const icon = c.category === 'waste' ? '♻️' : c.category === 'transportation' ? '🚌' : c.category === 'electricity' ? '🔌' : c.category === 'food' ? '🥗' : '🛍️';

    return `
      <div class="challenge-card" style="border-top: 4px solid var(--primary-base);">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px;">
            <span style="font-size: 1.5rem;">${icon}</span>
            <span class="challenge-xp">${c.xp} XP</span>
          </div>
          <h3 style="font-size: 1.1rem; margin-bottom: 8px;">${c.title}</h3>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 12px;">${c.description}</p>
        </div>
        <div>
          <p style="font-size: 0.75rem; font-style: italic; color: var(--text-muted); margin-bottom: 16px;">
            Tip: ${c.actionTip}
          </p>
          <button class="challenge-btn ${btnClass}" data-id="${c.id}" data-completed="${c.isCompleted}">
            ${btnText}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// ================= ACHIEVEMENT & CERTIFICATE SYSTEM =================
function setupAchievements() {
  const container = document.getElementById('badge-list-container');
  const certDrawer = document.getElementById('certificate-drawer');
  const canvas = document.getElementById('certificate-canvas');
  const downloadLink = document.getElementById('btn-download-cert');

  container.addEventListener('click', (e) => {
    const badgeCard = e.target.closest('.badge-card.unlocked');
    if (!badgeCard) return;

    const id = badgeCard.getAttribute('data-id');
    const badge = getBadgeById(id);
    const score = db.state.currentAssessment ? db.state.currentAssessment.score : 0;
    const profileId = db.state.profileId;

    // Show certificate panel drawer
    certDrawer.style.display = 'block';
    
    // Draw Certificate on canvas
    const dateString = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    drawCertificate(canvas, badge.name, profileId, score, dateString);

    // Bind dataurl to download link
    const dataUrl = canvas.toDataURL('image/png');
    downloadLink.href = dataUrl;
    downloadLink.download = `carbonwise-certificate-${id}.png`;

    // Scroll to cert display
    certDrawer.scrollIntoView({ behavior: 'smooth' });
  });
}

function renderAchievements() {
  const container = document.getElementById('badge-list-container');
  if (!container) return;

  const earned = db.state.earnedBadges || [];

  container.innerHTML = BADGES.map(b => {
    const isUnlocked = earned.includes(b.id);
    const unlockedClass = isUnlocked ? 'unlocked' : '';
    
    return `
      <div class="badge-card ${unlockedClass}" data-id="${b.id}" tabindex="${isUnlocked ? '0' : '-1'}" role="button" aria-label="Badge: ${b.name}. ${isUnlocked ? 'Unlocked. Click to download certificate.' : 'Locked.'}">
        <div class="badge-icon-wrap">${b.icon}</div>
        <div class="badge-name">${b.name}</div>
        <div class="badge-desc">${b.desc}</div>
        <div style="font-size: 0.7rem; color: var(--primary-base); margin-top: 8px; font-weight:600;">
          ${isUnlocked ? '★ Certificate Available' : b.requirementText}
        </div>
      </div>
    `;
  }).join('');
}

// ================= TESTING CENTER (DIAGNOSTICS) =================
function setupDiagnostics() {
  const runBtn = document.getElementById('btn-run-diagnostics');
  const log = document.getElementById('diagnostics-log');
  const summary = document.getElementById('diagnostics-summary');
  const summaryText = document.getElementById('diagnostics-summary-text');

  runBtn.addEventListener('click', async () => {
    log.innerHTML = '<p style="text-align: center; padding: 20px 0; color: var(--text-muted);">Executing system tests... Please wait.</p>';
    summary.style.display = 'none';

    try {
      const tests = await runDiagnostics(db);
      
      const passedCount = tests.filter(t => t.passed).length;

      // Render diagnostic checklist logs
      log.innerHTML = tests.map(t => {
        const itemClass = t.passed ? 'passed' : 'failed';
        const badgeText = t.passed ? 'Passed' : 'Failed';
        const badgeClass = t.passed ? 'pass' : 'fail';
        const dot = t.passed ? '✓' : '✗';

        return `
          <div class="diagnostic-item ${itemClass}">
            <div>
              <span class="diagnostic-name">${t.name}</span>
              <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">${t.details}</p>
            </div>
            <span class="diagnostic-status ${badgeClass}">${dot} ${badgeText}</span>
          </div>
        `;
      }).join('');

      // Show summary header
      summary.style.display = 'flex';
      summary.className = passedCount === tests.length ? 'diag-summary passed' : 'diag-summary failed';
      summaryText.textContent = `${passedCount}/${tests.length} System Checks Passed`;

    } catch (err) {
      log.innerHTML = `<p style="color:var(--color-danger); padding:20px 0;">Fatal Diagnostics Failure: ${err.message}</p>`;
    }
  });
}

// ================= UTILITY MODALS (Privacy / Settings Drawer) =================
function setupSettingsModal() {
  const modal = document.getElementById('modal-settings');
  const openBtn = document.getElementById('open-settings');
  const closeBtn = document.getElementById('close-settings');

  // Open settings
  openBtn.addEventListener('click', () => {
    modal.classList.add('active');
    document.getElementById('settings-sync-key-input').value = '';
    document.getElementById('sync-load-error').textContent = '';
  });

  // Close settings
  const closeSettingsFn = () => modal.classList.remove('active');
  closeBtn.addEventListener('click', closeSettingsFn);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeSettingsFn();
  });

  // Settings Tab switches
  const tabSync = document.getElementById('tab-btn-sync');
  const tabFirebase = document.getElementById('tab-btn-firebase');
  const viewSync = document.getElementById('settings-tab-sync');
  const viewFirebase = document.getElementById('settings-tab-firebase');

  tabSync.addEventListener('click', () => {
    tabSync.classList.add('active');
    tabSync.style.borderBottom = '2px solid var(--primary-base)';
    tabFirebase.classList.remove('active');
    tabFirebase.style.borderBottom = 'none';
    viewSync.style.display = 'block';
    viewFirebase.style.display = 'none';
  });

  tabFirebase.addEventListener('click', () => {
    tabFirebase.classList.add('active');
    tabFirebase.style.borderBottom = '2px solid var(--primary-base)';
    tabSync.classList.remove('active');
    tabSync.style.borderBottom = 'none';
    viewFirebase.style.display = 'block';
    viewSync.style.display = 'none';
  });

  // Copy Profile ID
  const copyBtn = document.getElementById('btn-copy-profile');
  copyBtn.addEventListener('click', () => {
    const input = document.getElementById('settings-profile-id');
    input.select();
    input.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(input.value)
      .then(() => {
        copyBtn.textContent = 'Copied!';
        setTimeout(() => copyBtn.textContent = 'Copy', 1500);
      })
      .catch(err => console.error("Clipboard write error:", err));
  });

  // Load Existing Profile ID
  const loadProfileBtn = document.getElementById('btn-load-profile');
  const loadInput = document.getElementById('settings-sync-key-input');
  const loadError = document.getElementById('sync-load-error');

  loadProfileBtn.addEventListener('click', async () => {
    const key = loadInput.value.trim().toLowerCase();
    loadError.textContent = '';

    if (!key) {
      loadError.textContent = 'Please enter a valid Profile ID.';
      return;
    }

    try {
      if (db.isFirebaseConnected) {
        loadProfileBtn.textContent = 'Syncing...';
        await db.pullFromCloud(key);
        loadProfileBtn.textContent = 'Sync';
        renderAll();
        closeSettingsFn();
      } else {
        // Fallback: If not connected to Firebase, we show local sandbox warning
        loadError.textContent = 'Cloud Sync is inactive. Please configure Firebase settings first.';
      }
    } catch (err) {
      loadProfileBtn.textContent = 'Sync';
      loadError.textContent = `Sync failed: ${err.message}`;
    }
  });

  // Connect Firebase form submit
  const configForm = document.getElementById('firebase-config-form');
  const fbErrorDisplay = document.getElementById('firebase-conn-error');

  // Prefill configuration if exists
  const activeConfig = db.getFirebaseConfig();
  if (activeConfig) {
    document.getElementById('fb-apiKey').value = activeConfig.apiKey || '';
    document.getElementById('fb-authDomain').value = activeConfig.authDomain || '';
    document.getElementById('fb-projectId').value = activeConfig.projectId || '';
    document.getElementById('fb-storageBucket').value = activeConfig.storageBucket || '';
    document.getElementById('fb-messagingSenderId').value = activeConfig.messagingSenderId || '';
    document.getElementById('fb-appId').value = activeConfig.appId || '';
  }

  configForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    fbErrorDisplay.textContent = '';

    const config = {
      apiKey: document.getElementById('fb-apiKey').value.trim(),
      authDomain: document.getElementById('fb-authDomain').value.trim(),
      projectId: document.getElementById('fb-projectId').value.trim(),
      storageBucket: document.getElementById('fb-storageBucket').value.trim(),
      messagingSenderId: document.getElementById('fb-messagingSenderId').value.trim(),
      appId: document.getElementById('fb-appId').value.trim()
    };

    // If all fields are empty, user is clearing/disconnecting Firebase configs
    const isEmpty = Object.values(config).every(val => val === '');
    if (isEmpty) {
      db.saveFirebaseConfig(null);
      fbErrorDisplay.textContent = 'Disconnected. Reverted to Local Sandbox mode.';
      fbErrorDisplay.style.color = 'var(--color-success)';
      return;
    }

    // Basic validation
    if (!config.apiKey || !config.projectId || !config.appId) {
      fbErrorDisplay.textContent = 'Missing API Key, Project ID, or App ID fields.';
      fbErrorDisplay.style.color = 'var(--color-danger)';
      return;
    }

    try {
      fbErrorDisplay.textContent = 'Connecting database...';
      fbErrorDisplay.style.color = 'var(--text-muted)';
      
      const success = await db.connectFirebase(config);
      if (success) {
        db.saveFirebaseConfig(config);
        fbErrorDisplay.textContent = 'Firebase Connected and Synced successfully!';
        fbErrorDisplay.style.color = 'var(--color-success)';
        setTimeout(() => closeSettingsFn(), 1200);
      }
    } catch (err) {
      fbErrorDisplay.textContent = err.message;
      fbErrorDisplay.style.color = 'var(--color-danger)';
    }
  });

  // Clear data
  const clearBtn = document.getElementById('btn-clear-data');
  clearBtn.addEventListener('click', async () => {
    if (confirm("Are you sure you want to clear all local data? This will reset history and generate a new profile key.")) {
      await db.clearData();
      renderAll();
      closeSettingsFn();
    }
  });
}

function setupUtilityModals() {
  const privacyModal = document.getElementById('modal-privacy');
  const privacyLink = document.getElementById('link-privacy');
  const privacyClose = document.getElementById('close-privacy');

  privacyLink.addEventListener('click', (e) => {
    e.preventDefault();
    privacyModal.classList.add('active');
  });
  const closePrivFn = () => privacyModal.classList.remove('active');
  privacyClose.addEventListener('click', closePrivFn);
  privacyModal.addEventListener('click', (e) => {
    if (e.target === privacyModal) closePrivFn();
  });

  const aboutModal = document.getElementById('modal-about');
  const aboutLink = document.getElementById('link-about');
  const aboutClose = document.getElementById('close-about');

  aboutLink.addEventListener('click', (e) => {
    e.preventDefault();
    aboutModal.classList.add('active');
  });
  const closeAboutFn = () => aboutModal.classList.remove('active');
  aboutClose.addEventListener('click', closeAboutFn);
  aboutModal.addEventListener('click', (e) => {
    if (e.target === aboutModal) closeAboutFn();
  });
}
