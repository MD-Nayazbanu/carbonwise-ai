// js/calculator.js - Carbon Footprint Calculator & Twin Benchmark Model

// EPA / IPCC-based Emission Factors (in kg CO2 equivalents)
export const EMISSION_FACTORS = {
  // Car Fuel Types (kg CO2 per km)
  carGasoline: 0.18,
  carDiesel: 0.17,
  carHybrid: 0.09,
  carElectric: 0.03, // assume standard grid charging share
  
  // Public Transit (kg CO2 per km)
  publicTransit: 0.04,
  
  // Flights (kg CO2 per flight)
  flightShortHaul: 250, // short flight, approx 1.5 hours / 1000 km
  flightLongHaul: 1100, // long flight, approx 7 hours / 6000 km
  
  // Electricity (kg CO2 per kWh)
  electricityKwh: 0.42, 
  
  // Diet (annual kg CO2 equivalent)
  dietMeatHeavy: 2800,
  dietAverage: 1900,
  dietVegetarian: 1100,
  dietVegan: 700,
  
  // Shopping (kg CO2 per currency unit/USD spent)
  shoppingSpend: 0.38, 
  
  // Waste (annual kg CO2 equivalent based on volume & recycling rate)
  wasteBaseLow: 300,   // ~1 bag/week
  wasteBaseMedium: 650, // ~2-3 bags/week
  wasteBaseHigh: 1100,  // 4+ bags/week
  
  // Recycling multiplier (percentage reduction in waste footprint)
  recyclingHigh: 0.5,
  recyclingMedium: 0.25,
  recyclingNone: 0
};

// Twin Benchmarks in annual kg CO2
export const TWIN_BENCHMARKS = {
  student: 4500,        // Average Student
  urban: 8200,          // Average Urban Resident
  champion: 2000        // Sustainability Champion
};

/**
 * Calculates carbon footprint based on structured user inputs
 * @param {Object} inputs - User questionnaire inputs
 * @returns {Object} Calculated metrics and breakdown
 */
export function calculateFootprint(inputs) {
  // 1. Transportation Footprint (annual kg CO2)
  const carDistance = parseFloat(inputs.carDistance) || 0;
  const carFuelType = inputs.carFuelType || 'carGasoline';
  const carFactor = EMISSION_FACTORS[carFuelType] || EMISSION_FACTORS.carGasoline;
  const carAnnual = carDistance * 52 * carFactor; // distance is weekly, convert to annual

  const transitDistance = parseFloat(inputs.transitDistance) || 0;
  const transitAnnual = transitDistance * 52 * EMISSION_FACTORS.publicTransit; // weekly to annual

  const flightsShort = parseInt(inputs.flightsShort) || 0;
  const flightsLong = parseInt(inputs.flightsLong) || 0;
  const flightsAnnual = (flightsShort * EMISSION_FACTORS.flightShortHaul) + 
                        (flightsLong * EMISSION_FACTORS.flightLongHaul);

  const transportation = carAnnual + transitAnnual + flightsAnnual;

  // 2. Electricity Footprint (annual kg CO2)
  const electricityKwh = parseFloat(inputs.electricityKwh) || 0; // monthly kWh
  const renewableShare = parseFloat(inputs.renewableShare) || 0; // percentage (0 - 100)
  const electricityMonthlyRaw = electricityKwh * EMISSION_FACTORS.electricityKwh;
  const electricityMonthlyNet = electricityMonthlyRaw * (1 - (renewableShare / 100));
  const electricity = electricityMonthlyNet * 12;

  // 3. Food/Diet Footprint (annual kg CO2)
  const dietType = inputs.dietType || 'dietAverage';
  const food = EMISSION_FACTORS[dietType] || EMISSION_FACTORS.dietAverage;

  // 4. Shopping Footprint (annual kg CO2)
  const shoppingSpend = parseFloat(inputs.shoppingSpend) || 0; // monthly spending
  const shopping = shoppingSpend * 12 * EMISSION_FACTORS.shoppingSpend;

  // 5. Waste Footprint (annual kg CO2)
  const wasteVolume = inputs.wasteVolume || 'wasteBaseMedium';
  const recyclingLevel = inputs.recyclingLevel || 'recyclingMedium';
  const wasteBase = EMISSION_FACTORS[wasteVolume] || EMISSION_FACTORS.wasteBaseMedium;
  const recyclingReduction = EMISSION_FACTORS[recyclingLevel] || EMISSION_FACTORS.recyclingMedium;
  const waste = wasteBase * (1 - recyclingReduction);

  // Total Calculations
  const annualTotal = Math.round(transportation + electricity + food + shopping + waste);
  const monthlyTotal = Math.round(annualTotal / 12);
  const dailyTotal = Math.round(annualTotal / 365);

  // Carbon Score: scale of 0 to 100 (100 is best, 0 is worst)
  // Formula: 100 is 1.5 tonnes or less, 0 is 20 tonnes or more.
  // Linear scaling between 1500kg and 20000kg.
  const minFootprint = 1500;
  const maxFootprint = 20000;
  let score = 100;
  if (annualTotal > minFootprint) {
    const fraction = (annualTotal - minFootprint) / (maxFootprint - minFootprint);
    score = Math.max(0, Math.min(100, Math.round(100 - (fraction * 100))));
  }

  return {
    annualTotal,
    monthlyTotal,
    dailyTotal,
    score,
    breakdown: {
      transportation: Math.round(transportation),
      electricity: Math.round(electricity),
      food: Math.round(food),
      shopping: Math.round(shopping),
      waste: Math.round(waste)
    },
    inputs: { ...inputs }
  };
}

/**
 * Returns comparison stats between user and benchmarks
 * @param {number} userAnnualTotal - User's total annual footprint in kg CO2
 * @returns {Array} List of comparison cards
 */
export function getBenchmarkComparison(userAnnualTotal) {
  return [
    {
      id: 'champion',
      name: 'Sustainability Champion',
      value: TWIN_BENCHMARKS.champion,
      percentageDiff: Math.round(((userAnnualTotal - TWIN_BENCHMARKS.champion) / TWIN_BENCHMARKS.champion) * 100),
      desc: 'Target global sustainable limit'
    },
    {
      id: 'student',
      name: 'Average Student',
      value: TWIN_BENCHMARKS.student,
      percentageDiff: Math.round(((userAnnualTotal - TWIN_BENCHMARKS.student) / TWIN_BENCHMARKS.student) * 100),
      desc: 'Typical student lifestyle footprint'
    },
    {
      id: 'urban',
      name: 'Average Urban Resident',
      value: TWIN_BENCHMARKS.urban,
      percentageDiff: Math.round(((userAnnualTotal - TWIN_BENCHMARKS.urban) / TWIN_BENCHMARKS.urban) * 100),
      desc: 'City-wide baseline resident average'
    }
  ];
}
