// js/simulator.js - Carbon Reduction Simulator & Impact Equivalents

import { calculateFootprint } from './calculator.js';

// Equivalents conversion constants:
// - 1 tree absorbs ~22 kg of CO2 per year.
// - 1 km of gasoline car travel emits ~0.18 kg CO2.
// - 1 day of average household electricity emits ~6.3 kg CO2 (based on 15 kWh/day * 0.42 kg/kWh).
export const EQUIVALENT_FACTORS = {
  treeYearlyAbsorption: 22,
  carKmEmission: 0.18,
  householdElectricityDay: 6.3
};

/**
 * Calculates the projected footprint and real-world equivalents based on simulated lifestyle changes
 * @param {Object} baseAssessment - The original assessment object containing base inputs and totals
 * @param {Object} simOverrides - Slider values/overrides for simulation
 * @returns {Object} Simulation metrics (projected totals, percentage reduction, equivalents)
 */
export function calculateSimulation(baseAssessment, simOverrides) {
  if (!baseAssessment || !baseAssessment.inputs) {
    return {
      projectedAnnual: 0,
      projectedScore: 100,
      reductionKg: 0,
      reductionPercent: 0,
      equivalents: { trees: 0, carKm: 0, electricityDays: 0 }
    };
  }

  // Clone original inputs
  const simulatedInputs = { ...baseAssessment.inputs };

  // Apply simulator overrides
  // 1. Car Travel Reduction (percentage from slider: 0 - 100)
  if (simOverrides.carReductionPct !== undefined) {
    const originalCarDist = parseFloat(baseAssessment.inputs.carDistance) || 0;
    simulatedInputs.carDistance = originalCarDist * (1 - (parseFloat(simOverrides.carReductionPct) / 100));
  }

  // 2. Car Fuel Switch
  if (simOverrides.carFuelType !== undefined) {
    simulatedInputs.carFuelType = simOverrides.carFuelType;
  }

  // 3. Renewable Energy Share Mix
  if (simOverrides.renewableShare !== undefined) {
    simulatedInputs.renewableShare = simOverrides.renewableShare;
  }

  // 4. Diet Switch
  if (simOverrides.dietType !== undefined) {
    simulatedInputs.dietType = simOverrides.dietType;
  }

  // 5. Waste Recycling Switch
  if (simOverrides.recyclingLevel !== undefined) {
    simulatedInputs.recyclingLevel = simOverrides.recyclingLevel;
  }

  // 6. Flights Reduction (percentage from slider: 0 - 100)
  if (simOverrides.flightsReductionPct !== undefined) {
    const originalShort = parseInt(baseAssessment.inputs.flightsShort) || 0;
    const originalLong = parseInt(baseAssessment.inputs.flightsLong) || 0;
    const reductionMultiplier = 1 - (parseFloat(simOverrides.flightsReductionPct) / 100);
    simulatedInputs.flightsShort = Math.round(originalShort * reductionMultiplier);
    simulatedInputs.flightsLong = Math.round(originalLong * reductionMultiplier);
  }

  // Calculate new footprint
  const projectedResult = calculateFootprint(simulatedInputs);

  // Compare totals
  const originalAnnual = baseAssessment.annualTotal;
  const projectedAnnual = projectedResult.annualTotal;
  const reductionKg = Math.max(0, originalAnnual - projectedAnnual);
  const reductionPercent = originalAnnual > 0 ? Math.round((reductionKg / originalAnnual) * 100) : 0;

  // Calculate equivalents
  const trees = Math.round(reductionKg / EQUIVALENT_FACTORS.treeYearlyAbsorption);
  const carKm = Math.round(reductionKg / EQUIVALENT_FACTORS.carKmEmission);
  const electricityDays = Math.round(reductionKg / EQUIVALENT_FACTORS.householdElectricityDay);

  return {
    projectedAnnual,
    projectedScore: projectedResult.score,
    reductionKg,
    reductionPercent,
    equivalents: {
      trees: Math.max(0, trees),
      carKm: Math.max(0, carKm),
      electricityDays: Math.max(0, electricityDays)
    }
  };
}
