// js/db.js - Database Manager (LocalStorage Sandbox + Optional Firebase Firestore)

export class DatabaseManager {
  constructor() {
    this.localKey = 'carbonwise_user_data';
    this.configKey = 'carbonwise_firebase_config';
    this.state = this._getInitialState();
    
    this.db = null; // Firebase Firestore Reference
    this.firebaseApp = null;
    this.isFirebaseConnected = false;
    this.isSyncActive = false;
    this.lastSyncTimestamp = null;
    
    // Status Callbacks
    this.onStatusChange = null; // fn(status)
  }

  // Initialize: attempt to load config and connect to Firebase
  async init() {
    const config = this.getFirebaseConfig();
    if (config) {
      try {
        await this.connectFirebase(config);
      } catch (err) {
        console.warn("Failed to auto-connect to Firebase: ", err.message);
        this._updateStatus();
      }
    } else {
      this._updateStatus();
    }
  }

  // Get initial state (either from localStorage or default template)
  _getInitialState() {
    const saved = localStorage.getItem(this.localKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure profile ID exists
        if (!parsed.profileId) {
          parsed.profileId = this._generateProfileId();
        }
        return parsed;
      } catch (e) {
        console.error("Error parsing local state:", e);
      }
    }
    return {
      profileId: this._generateProfileId(),
      assessmentHistory: [],
      currentAssessment: null,
      completedChallenges: [],
      earnedBadges: [],
      goal: null, // { targetPercent: X, targetFootprint: Y, targetDate: Date }
      lastUpdated: new Date().toISOString()
    };
  }

  _generateProfileId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let id = 'cw-';
    for (let i = 0; i < 8; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }

  // Save current local state back to localStorage
  _saveLocal() {
    this.state.lastUpdated = new Date().toISOString();
    localStorage.setItem(this.localKey, JSON.stringify(this.state));
  }

  // Get/Set Firebase config in localStorage
  getFirebaseConfig() {
    const saved = localStorage.getItem(this.configKey);
    return saved ? JSON.parse(saved) : null;
  }

  saveFirebaseConfig(config) {
    if (!config) {
      localStorage.removeItem(this.configKey);
      this.disconnectFirebase();
    } else {
      localStorage.setItem(this.configKey, JSON.stringify(config));
    }
  }

  // Dynamically load Firebase modules from CDN and initialize
  async connectFirebase(config) {
    try {
      this.isSyncActive = false;
      this.isFirebaseConnected = false;
      this._updateStatus();

      // Dynamic import of Firebase modules
      const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
      const { getFirestore, doc, setDoc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

      this.firebaseApp = initializeApp(config);
      this.db = getFirestore(this.firebaseApp);
      this.isFirebaseConnected = true;
      this.isSyncActive = true;
      this._updateStatus();

      // Attempt immediate sync check/push
      await this.syncToCloud();
      return true;
    } catch (err) {
      this.isFirebaseConnected = false;
      this.isSyncActive = false;
      this._updateStatus();
      throw new Error(`Firebase connection failed: ${err.message}`);
    }
  }

  disconnectFirebase() {
    this.db = null;
    this.firebaseApp = null;
    this.isFirebaseConnected = false;
    this.isSyncActive = false;
    this.lastSyncTimestamp = null;
    this._updateStatus();
  }

  // Synchronize state with Firebase Firestore
  async syncToCloud() {
    if (!this.isFirebaseConnected || !this.db) {
      return false;
    }

    try {
      const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
      const docRef = doc(this.db, 'users', this.state.profileId);
      
      await setDoc(docRef, {
        profileId: this.state.profileId,
        assessmentHistory: this.state.assessmentHistory,
        currentAssessment: this.state.currentAssessment,
        completedChallenges: this.state.completedChallenges,
        earnedBadges: this.state.earnedBadges,
        goal: this.state.goal,
        lastUpdated: this.state.lastUpdated,
        syncTimestamp: new Date().toISOString()
      }, { merge: true });

      this.lastSyncTimestamp = new Date().toLocaleTimeString();
      this._updateStatus();
      return true;
    } catch (err) {
      console.error("Sync to cloud failed:", err);
      this.isSyncActive = false;
      this._updateStatus();
      throw err;
    }
  }

  // Load state from Cloud using Profile ID
  async pullFromCloud(profileId) {
    if (!this.isFirebaseConnected || !this.db) {
      throw new Error("Firebase is not connected.");
    }
    if (!profileId) {
      throw new Error("Invalid Sync Profile ID.");
    }

    try {
      const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
      const docRef = doc(this.db, 'users', profileId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const cloudData = docSnap.data();
        this.state = {
          profileId: cloudData.profileId || profileId,
          assessmentHistory: cloudData.assessmentHistory || [],
          currentAssessment: cloudData.currentAssessment || null,
          completedChallenges: cloudData.completedChallenges || [],
          earnedBadges: cloudData.earnedBadges || [],
          goal: cloudData.goal || null,
          lastUpdated: cloudData.lastUpdated || new Date().toISOString()
        };
        this._saveLocal();
        this.lastSyncTimestamp = new Date().toLocaleTimeString();
        this._updateStatus();
        return true;
      } else {
        throw new Error("No data found on the cloud for this Sync Profile ID.");
      }
    } catch (err) {
      console.error("Pull from cloud failed:", err);
      throw err;
    }
  }

  // Local state operations that auto-sync when connected
  async updateState(updaterFn) {
    updaterFn(this.state);
    this._saveLocal();
    if (this.isFirebaseConnected) {
      try {
        await this.syncToCloud();
      } catch (err) {
        console.warn("State saved locally, but cloud sync failed:", err.message);
      }
    }
  }

  // Clear data: clear local state and generate a new Profile ID
  async clearData() {
    this.state = {
      profileId: this._generateProfileId(),
      assessmentHistory: [],
      currentAssessment: null,
      completedChallenges: [],
      earnedBadges: [],
      goal: null,
      lastUpdated: new Date().toISOString()
    };
    this._saveLocal();
    this.lastSyncTimestamp = null;
    this._updateStatus();
  }

  // Trigger UI update callbacks
  _updateStatus() {
    if (this.onStatusChange) {
      this.onStatusChange({
        isFirebaseConnected: this.isFirebaseConnected,
        isSyncActive: this.isSyncActive,
        lastSyncTimestamp: this.lastSyncTimestamp,
        profileId: this.state.profileId
      });
    }
  }
}
export const db = new DatabaseManager();
