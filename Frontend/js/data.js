/**
 * PyaazSure — Core Data & Configuration
 * Module: data.js
 * 
 * Defines the 6-screen workflow, default state structure,
 * defect definitions, varieties, and session stores.
 */

window.PyaazData = {
  version: 2,
  
  // Exactly six main screens per product requirements
  steps: [
    'Login',
    'Farmer & Lot',
    'Sample Collection',
    'AI Quality Assessment',
    'Inspector Verification',
    'Digital Certificate'
  ],

  varieties: [
    'Red Onion (Nashik Quality)',
    'Nashik Red',
    'Agrifound Dark Red',
    'Pusa Red',
    'White Onion (Dehydration Grade)',
    'Yellow Onion'
  ],

  procurementCentres: [
    'Lasalgaon APMC Centre, Nashik',
    'Pimpalgaon APMC Centre, Nashik',
    'Barwala Procurement Hub, Hisar',
    'Mahua APMC Mandi, Bhavnagar',
    'Solapur Central Procurement'
  ],

  defectTypes: [
    { key: 'healthy', label: 'Healthy', color: '#2E8B57', bg: '#E8F5EF' },
    { key: 'damaged', label: 'Damaged / Cuts', color: '#D99000', bg: '#FEF6E7' },
    { key: 'rotten', label: 'Rotten / Neck Rot', color: '#D64545', bg: '#FDECEC' },
    { key: 'sprouted', label: 'Sprouted / Shoots', color: '#7B5EA7', bg: '#F2EEF8' },
    { key: 'discolored', label: 'Discolored / Smut', color: '#B36B00', bg: '#FBF2E3' }
  ],

  defaultState() {
    return {
      step: 1,
      loggedIn: false,
      inspectorId: '',
      lotId: '',
      
      // Farmer & Lot details
      lot: {
        farmerId: '',
        farmerName: '',
        village: '',
        fpo: '',
        centre: 'Lasalgaon APMC Centre, Nashik',
        inspectionDate: new Date().toISOString().slice(0, 16),
        quantity: '',
        bags: '',
        variety: 'Red Onion (Nashik Quality)'
      },

      // Media Capture Flow
      captureMode: 'photo', // 'photo' | 'video'
      capturedSample: null, // { url, type: 'image/jpeg'|'video/webm', blobId, timestamp, sizeLabel, isSimulatedNonOnion: false }
      
      // Inference & Assessment State
      isAnalyzing: false,
      analysis: null, // Structured output from PyaazInference
      sensorData: null, // Telemetry from PyaazSensor
      multimodalAssessment: null, // Fused assessment from PyaazSensor

      // Verification Flow (1-at-a-time flagged case review)
      verification: {
        currentFlaggedIndex: 0,
        overrides: {}, // { [onion_ref]: { classification, note } }
        confirmed: {}, // { [onion_ref]: true }
        effectiveQuality: null, // Re-evaluated quality after overrides
        finalGrade: null,
        verificationStatus: 'PENDING' // 'VERIFIED' | 'PENDING_HUMAN_VERIFICATION'
      },

      // Final Decision (Task 11)
      finalDecision: null, // 'ACCEPT' | 'ACCEPT_SORTING' | 'REJECT' | 'NEEDS_INSPECTION'
      inspectorRemarks: '',
      
      // Dynamic Certificate (Task 12)
      certificateId: '',
      completedAt: null
    };
  }
};
