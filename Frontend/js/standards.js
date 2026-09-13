/**
 * PyaazSure — Standards-as-Code Quality Engine
 * Module: standards.js
 * 
 * Architecture:
 * MODEL OUTPUT ↓ QUALITY ENGINE ↓ GRADE / RECOMMENDATION
 * 
 * Separates quality criteria and regulatory/procurement rules
 * from presentation and inference layers. Configurable thresholds.
 */

window.PyaazStandards = (() => {
  // Configurable procurement standard profiles (e.g. Agmark / NAFED / APMC / Custom FPO)
  const STANDARD_PROFILES = {
    standard_procurement_v1: {
      name: 'Standard Procurement Quality v1 (NAFED/APMC Aligned)',
      grades: {
        A: { maxDefectivePct: 5.0, label: 'Grade A (Premium)', minAcceptablePct: 95.0 },
        B: { maxDefectivePct: 15.0, label: 'Grade B (Fair Average Quality - FAQ)', minAcceptablePct: 85.0 },
        C: { maxDefectivePct: 25.0, label: 'Grade C (Under-grade / Processing Only)', minAcceptablePct: 75.0 }
      },
      rejectionThresholdPct: 25.0,
      severeDefectWeights: {
        rotten: 1.5,
        sprouted: 1.2,
        damaged: 1.0,
        discolored: 0.8
      }
    }
  };

  let activeProfileKey = 'standard_procurement_v1';

  /**
   * Evaluate a sample from detection counts or individual detection items.
   * @param {Array} detections - List of detected onions with classification
   * @param {Object} options - Optional override standard profile
   * @returns {Object} Quality evaluation result
   */
  function evaluateQuality(detections = [], options = {}) {
    const profile = STANDARD_PROFILES[options.profileKey || activeProfileKey];
    const total = detections.length;

    if (total === 0) {
      return {
        total: 0,
        acceptable: 0,
        defective: 0,
        defectivePercentage: 0,
        grade: 'REJECT',
        gradeLabel: 'Insufficient Sample',
        defectBreakdown: {},
        sortingImpact: null,
        standardName: profile.name
      };
    }

    let defectiveCount = 0;
    const breakdown = {
      healthy: 0,
      damaged: 0,
      rotten: 0,
      sprouted: 0,
      discolored: 0
    };

    detections.forEach(d => {
      const cls = (d.classification || 'healthy').toLowerCase();
      if (cls === 'healthy') {
        breakdown.healthy++;
      } else {
        defectiveCount++;
        if (breakdown[cls] !== undefined) {
          breakdown[cls]++;
        } else {
          breakdown[cls] = 1;
        }
      }
    });

    const acceptableCount = total - defectiveCount;
    const defectivePercentage = Number(((defectiveCount / total) * 100).toFixed(1));

    // Assign Grade based on configurable thresholds
    let grade = 'REJECT';
    let gradeLabel = 'Rejected (Exceeds Defect Tolerances)';

    if (defectivePercentage <= profile.grades.A.maxDefectivePct) {
      grade = 'A';
      gradeLabel = profile.grades.A.label;
    } else if (defectivePercentage <= profile.grades.B.maxDefectivePct) {
      grade = 'B';
      gradeLabel = profile.grades.B.label;
    } else if (defectivePercentage <= profile.grades.C.maxDefectivePct) {
      grade = 'C';
      gradeLabel = profile.grades.C.label;
    }

    // Calculate Sorting/Removal recommendation (Task 9)
    // "Detect → Sort → Reassess → Decide"
    let sortingImpact = null;
    if (defectiveCount > 0) {
      const remainingTotal = acceptableCount;
      const potentialGrade = remainingTotal >= 10 ? 'A' : (remainingTotal > 0 ? 'B' : 'REJECT');
      
      sortingImpact = {
        flaggedCount: defectiveCount,
        remainingCount: remainingTotal,
        potentialGrade: potentialGrade,
        notice: `Sorting/removing the ${defectiveCount} flagged defect${defectiveCount > 1 ? 's' : ''} can improve the remaining sample (${remainingTotal} units) toward Grade ${potentialGrade}*.`,
        disclaimer: '*Subject to the applicable quality standard and minimum sample verification.'
      };
    }

    return {
      total,
      acceptable: acceptableCount,
      defective: defectiveCount,
      defectivePercentage,
      grade,
      gradeLabel,
      defectBreakdown: breakdown,
      sortingImpact,
      standardName: profile.name
    };
  }

  /**
   * Recalculate evaluation after inspector confirmations / overrides
   * @param {Array} detections - original AI detections
   * @param {Object} overrides - map of { [onionRef]: { classification, note } }
   */
  function reevaluateWithOverrides(detections = [], overrides = {}) {
    const adjustedDetections = detections.map(d => {
      const ref = d.onion_ref || d.id;
      if (overrides[ref]) {
        return {
          ...d,
          classification: overrides[ref].classification,
          isOverridden: true,
          overrideNote: overrides[ref].note || ''
        };
      }
      return { ...d };
    });

    return evaluateQuality(adjustedDetections);
  }

  return {
    STANDARD_PROFILES,
    evaluateQuality,
    reevaluateWithOverrides,
    getActiveProfile: () => STANDARD_PROFILES[activeProfileKey],
    setActiveProfile: (key) => { if (STANDARD_PROFILES[key]) activeProfileKey = key; }
  };
})();
