# CarbonWise AI — Professional Sustainability Tracking Platform

CarbonWise AI is a premium, client-side web application designed to help individuals understand, track, simulate, and reduce their carbon footprint through personalized insights, gamified challenges, and interactive goal mapping.

---

## 1. Problem Statement & Solution Overview

### The Problem
Global climate change is accelerated by greenhouse gas emissions, yet most individuals remain disconnected from the direct environmental impact of their daily choices. Traditional carbon footprint tools are often outdated, offer static, non-actionable suggestions, lack custom simulations, and fail to provide user-friendly progress tracking.

### The Solution
**CarbonWise AI** provides a responsive, dashboard-style experience where individuals can:
1. Conduct a multi-category assessment of carbon emissions.
2. View real-world impact equivalents (avoided driving distance, household electricity days saved, trees planted).
3. Compare footprint profiles against tailored benchmarks (Average Student, Urban Resident, Sustainability Champion).
4. Run real-time "what-if" simulations of lifestyle improvements.
5. Setup carbon reduction targets and receive a step-by-step roadmap.
6. Join eco-challenges, accumulate experience points (XP), and earn printable certificates.

---

## 2. Core Features

### 1. Smart Carbon Assessment
Evaluates transportation modes, monthly electricity, dining preferences, waste volumes, recycling habits, and shopping budgets, generating immediate daily, monthly, and annual footprint measurements, along with a Carbon Score (0-100).

### 2. Carbon Twin Benchmark
Visualizes user metrics side-by-side with distinct profiles:
- **Sustainability Champion**: 2,000 kg CO₂/year (aligned with international warming goals).
- **Average Student**: 4,500 kg CO₂/year.
- **Average Urban Resident**: 8,200 kg CO₂/year.

### 3. AI Sustainability Coach
Triggers customized advice based on the user's highest emissions areas, organizing suggestions into **High Impact**, **Medium Impact**, and **Quick Wins**, accompanied by exact annual CO₂ reduction potentials.

### 4. Interactive Carbon Reduction Simulator
Allows real-time tweaking of lifestyle variables (reducing car distance, shifting to EVs, increasing solar mix) to calculate projected carbon savings and update equivalents on the fly.

### 5. Carbon Goal Planner & Roadmap
A carbon target slider sets a desired reduction percentage (e.g., 20% savings), generating a structured monthly roadmap containing specific steps to hit target emissions.

### 6. Gamified Challenges & Badges
- **Eco Challenges**: Participate in challenges like *Commute Green* or *Plastic-Free Week* to earn XP.
- **Achievements**: Unlock milestones (Eco Beginner, Green Citizen, Sustainability Champion, Carbon Hero) and generate a canvas-drawn achievement certificate ready for download.

### 7. Optional Cloud Sync (Firebase Integration)
Runs by default in **Local Sandbox Mode** (using `localStorage`). Users can optionally input Firestore API keys in Settings to activate real-time synchronization using a unique, auto-generated **Sync Profile ID** (no login credentials required).

---

## 3. Technology Stack & Directory Structure

This application is built with zero external dependencies and does not require a compilation step, ensuring fast loading speeds, simple static hosting compatibility (GitHub Pages), and absolute data privacy.

```
carbonwise-ai/
├── css/
│   └── style.css          # Design system, themes (dark/light), animations
├── js/
│   ├── app.js             # Main coordinator, routing, form steps, UI updates
│   ├── db.js              # LocalStorage sandbox and Firebase sync connector
│   ├── calculator.js      # EPA & IPCC emission calculation algorithms
│   ├── recommendations.js # AI coach advice and roadmap compile engine
│   ├── simulator.js       # Real-time simulator math & equivalents
│   ├── challenges.js      # Challenge tracker and XP calculator
│   ├── badges.js          # Achievement logic & canvas certificate exporter
│   └── diagnostics.js     # Testing Center suite verifying the 8 modules
├── index.html             # Main SPA markup with full accessibility tags
└── README.md              # Technical documentation
```

---

## 4. Setup & Firebase Configuration

### Running Locally
Since CarbonWise AI uses native ES Modules, it must be run from a local development server to bypass CORS restrictions for module resolution:

1. Clone or copy this workspace to your desktop.
2. Launch a local web server in the folder:
   - **VS Code**: Install the *Live Server* extension and click "Go Live".
   - **Python**: Run `python -m http.server 8000` in your terminal.
   - **Node.js**: Install `http-server` globally and run `http-server`.
3. Open `http://localhost:8000` (or the relevant port) in your web browser.

### Optional Firebase Setup
To sync data across devices:
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a new Project and register a Web App.
3. In the project dashboard, enable **Cloud Firestore** and ensure its security rules allow read/write access (e.g., in test mode or restricted by collection ID).
4. Copy the web app configuration object:
   ```javascript
   {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT_ID.appspot.com",
     messagingSenderId: "YOUR_SENDER_ID",
     appId: "YOUR_APP_ID"
   }
   ```
5. In CarbonWise AI, click the **Settings** button in the header, choose **Firebase Setup**, paste the configuration keys, and click **Connect**.
6. Cloud Sync will transition to **Connected** and upload your profile records. Use your **Profile Sync ID** to pull and sync data on another browser.

---

## 5. Testing & Diagnostics Instructions

CarbonWise AI features an integrated client-side **Testing Center** to verify the health and security of all application modules:

1. Click on the **Diagnostics** tab in the main navigation.
2. Click **"Run System Diagnostics"**.
3. The diagnostics console will execute 8 automated unit/integration checks:
   - **Carbon Calculator Math**: Validates calculation conversion factors and totals.
   - **Recommendation Engine**: Verifies that custom suggestions and savings trigger correctly.
   - **Local Sandbox & Operations**: Validates localStorage writes and settings configuration validation.
   - **Dashboard UI Component Integrity**: Confirms critical HTML container nodes are mounted.
   - **Eco Challenge Tracker**: Validates challenge completion states and XP tally math.
   - **Badge Achievement**: Validates unlocked milestone rankings and dry-runs certificate canvas exports.
   - **Input Sanitization**: Ensures negative inputs are handled and HTML tags are escaped to prevent XSS.
   - **Accessibility Standards**: Confirms landmarks, skip-link element, and input form labels exist in the DOM.
4. If all checks succeed, the summary updates to: **"8/8 System Checks Passed"**.

---

## 6. Accessibility & Security Compliance

### Accessibility (A11y)
- **Skip-to-Content**: A hidden link is positioned at the top of the tab index, allowing keyboard users to bypass navigation headers.
- **Semantic HTML**: Built with HTML5 structure elements (`<nav>`, `<main>`, `<section>`, `<footer>`).
- **Focus Indicators**: The styling utilizes high-contrast `:focus-visible` outlines to ensure clean keyboard focus visibility.
- **ARIA Attributes**: Elements utilize `role="button"`, `aria-live="polite"`, `aria-valuenow`, and descriptive form labels to ensure screen readers read states accurately.
- **Color Contrast**: Complies with WCAG AA guidelines for clear text contrast.

### Security
- **XSS Prevention**: Dynamic text is injected strictly using `textContent` or text nodes. User-supplied parameters (like sync IDs) are processed to prevent script injection.
- **Validation**: Questionnaire input fields utilize boundary limits (e.g., negative values capped) and are checked via browser and script validations prior to calculation execution.
- **Privacy First**: No telemetry, trackers, or cookies. All records are maintained locally unless users opt into Firebase synchronization.