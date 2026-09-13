/**
 * PyaazSure — Sensor Data & Multimodal Interface
 * Module: sensor.js
 * 
 * Tasks 13 & 14:
 * Architecture:
 * Vision Model + Sensor Model ↓ Multimodal Assessment
 * 
 * Defines standard contracts for sensor readings (weight, VOC, temp, humidity),
 * sensor quality indicators, and cross-modal consistency fusion.
 * Sensor values for the prototype are explicitly marked as [SIMULATED].
 */

window.PyaazSensor = (() => {
  /**
   * Standard Sensor Data Interface
   * Prepared for hardware / BLE integration
   */
  function createSensorReading(overrides = {}) {
    return {
      timestamp: new Date().toISOString(),
      isSimulated: true, // EXPLICIT: Clearly labelled as simulated MVP
      weight_kg: overrides.weight_kg ?? 5.4,
      voc_ppm: overrides.voc_ppm ?? 0.85, // Volatile Organic Compounds (rot/spoilage indicator)
      temperature_c: overrides.temperature_c ?? 26.4,
      humidity_pct: overrides.humidity_pct ?? 64.2,
      sensor_health: 'OK',
      device_id: 'PYAAZ-SNS-DEMO-01'
    };
  }

  /**
   * Sensor Quality Model Interface
   * Translates sensor telemetry into qualitative indicators
   * @param {Object} sensorData
   */
  function evaluateSensorTelemetry(sensorData) {
    if (!sensorData) return null;

    const indicators = {
      spoilageRisk: 'LOW',
      moistureCondition: 'NORMAL',
      thermalStress: 'NORMAL',
      sensorConfidence: 0.88,
      notes: []
    };

    // VOC > 1.5 ppm typically indicates active microbial rotting in storage
    if (sensorData.voc_ppm > 2.0) {
      indicators.spoilageRisk = 'HIGH';
      indicators.notes.push('Elevated volatile organic compounds indicate possible internal rot or fermentation.');
    } else if (sensorData.voc_ppm > 1.2) {
      indicators.spoilageRisk = 'MODERATE';
      indicators.notes.push('Slightly elevated VOCs detected in sample atmosphere.');
    }

    // High humidity (>75%) risks fungal germination/sprouting
    if (sensorData.humidity_pct > 75) {
      indicators.moistureCondition = 'HIGH_RISK';
      indicators.notes.push('High sample humidity increases storage fungal decay and sprouting risk.');
    }

    return indicators;
  }

  /**
   * Multimodal Fusion Interface (Task 14)
   * Cross-modal consistency between vision observations and sensor telemetry
   * @param {Object} visionQualityResult - Output from Quality Engine
   * @param {Object} sensorIndicators - Output from evaluateSensorTelemetry
   */
  function fuseMultimodalAssessment(visionQualityResult, sensorIndicators) {
    if (!visionQualityResult) return null;

    const crossModalConsistency = {
      aligned: true,
      conflictDetected: false,
      confidenceScore: 0.92,
      fusedObservations: []
    };

    if (sensorIndicators) {
      const hasVisualRot = (visionQualityResult.defectBreakdown?.rotten || 0) > 0;
      const hasSensorRot = sensorIndicators.spoilageRisk === 'HIGH' || sensorIndicators.spoilageRisk === 'MODERATE';

      if (hasVisualRot && hasSensorRot) {
        crossModalConsistency.fusedObservations.push('Cross-modal confirmation: Visual signs of rot correlate with elevated ambient VOC gas sensors.');
      } else if (!hasVisualRot && hasSensorRot) {
        crossModalConsistency.conflictDetected = true;
        crossModalConsistency.fusedObservations.push('Cross-modal caution: VOC sensor indicates possible latent or internal decay not yet prominent on surface inspection.');
      } else if (hasVisualRot && !hasSensorRot) {
        crossModalConsistency.fusedObservations.push('Isolated superficial rot detected; atmospheric VOC concentration remains localized.');
      }
    }

    return {
      visualGrade: visionQualityResult.grade,
      sensorIndicators,
      crossModalConsistency,
      timestamp: new Date().toISOString()
    };
  }

  return {
    createSensorReading,
    evaluateSensorTelemetry,
    fuseMultimodalAssessment
  };
})();
