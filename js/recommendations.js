// js/recommendations.js - AI Sustainability Recommendations & Goal Planner

import { EMISSION_FACTORS } from './calculator.js';

/**
 * Generates custom recommendations based on user assessment outputs
 * @param {Object} results - Calculated footprint object from calculator.js
 * @returns {Object} Grouped recommendations: { highImpact, mediumImpact, quickWins }
 */
export function generateRecommendations(results) {
  if (!results || !results.breakdown) {
    return { highImpact: [], mediumImpact: [], quickWins: [] };
  }

  const { breakdown, inputs } = results;
  const list = [];

  // --- TRANSPORTATION ---
  const carDistance = parseFloat(inputs.carDistance) || 0;
  const carFuelType = inputs.carFuelType || 'carGasoline';
  const carAnnual = breakdown.transportation;

  if (carDistance > 80) { // More than 80km a week
    if (carFuelType !== 'carElectric') {
      list.push({
        id: 'ev_switch',
        category: 'transportation',
        text: 'Switch to a Hybrid or Electric Vehicle',
        desc: 'Upgrading your next car to a hybrid or battery electric vehicle reduces tailpipe emissions to near-zero.',
        impact: 'high',
        reduction: Math.round(carAnnual * 0.7) // 70% reduction
      });
      list.push({
        id: 'transit_carpool',
        category: 'transportation',
        text: 'Transit or Carpool 2 Days a Week',
        desc: 'Commit to leaving your car at home two days a week in favor of public transit, cycling, or carpooling.',
        impact: 'high',
        reduction: Math.round(carAnnual * (2 / 7)) // 28% reduction
      });
    } else {
      list.push({
        id: 'eco_driving',
        category: 'transportation',
        text: 'Practice Eco-Driving Techniques',
        desc: 'Maintain steady speeds, avoid aggressive braking, and keep tires inflated to optimize electric vehicle range and battery efficiency.',
        impact: 'low',
        reduction: Math.round(carAnnual * 0.1) // 10% reduction
      });
    }
  }

  const flightsShort = parseInt(inputs.flightsShort) || 0;
  const flightsLong = parseInt(inputs.flightsLong) || 0;
  if (flightsShort > 0 || flightsLong > 0) {
    list.push({
      id: 'flight_reduction',
      category: 'transportation',
      text: 'Replace One Flight with Train or Virtual Meeting',
      desc: 'Instead of flying for vacation or business, choose local rail travel or replace one meeting with a video call.',
      impact: 'high',
      reduction: flightsLong > 0 ? EMISSION_FACTORS.flightLongHaul : EMISSION_FACTORS.flightShortHaul
    });
    list.push({
      id: 'flight_offset',
      category: 'transportation',
      text: 'Offset Flight Emissions',
      desc: 'Purchase certified carbon offsets (Gold Standard) directly when booking flights to fund reforestation and carbon capture projects.',
      impact: 'medium',
      reduction: Math.round((flightsShort * EMISSION_FACTORS.flightShortHaul + flightsLong * EMISSION_FACTORS.flightLongHaul) * 0.9)
    });
  }

  // --- ELECTRICITY ---
  const electricityKwh = parseFloat(inputs.electricityKwh) || 0;
  const renewableShare = parseFloat(inputs.renewableShare) || 0;
  const electricityAnnual = breakdown.electricity;

  if (renewableShare < 80) {
    list.push({
      id: 'green_energy_tariff',
      category: 'electricity',
      text: 'Switch to a 100% Green Energy Provider',
      desc: 'Choose a utility plan that guarantees electricity is sourced from wind, solar, or hydro power.',
      impact: 'high',
      reduction: Math.round(electricityAnnual * (1 - renewableShare / 100))
    });
  }

  if (electricityKwh > 150) {
    list.push({
      id: 'efficient_appliances',
      category: 'electricity',
      text: 'Upgrade to Energy Star Appliances',
      desc: 'Swap out incandescent light bulbs for LEDs and invest in energy-efficient heating, cooling, or smart thermostats.',
      impact: 'medium',
      reduction: Math.round(electricityAnnual * 0.15) // 15% efficiency savings
    });
    list.push({
      id: 'vampire_draw',
      category: 'electricity',
      text: 'Unplug Standby Devices (Vampire Load)',
      desc: 'Unplug chargers, televisions, and game consoles when not in use, or use smart power strips to eliminate phantom electricity consumption.',
      impact: 'low',
      reduction: 80 // Flat 80 kg reduction
    });
  }

  // --- FOOD ---
  const dietType = inputs.dietType || 'dietAverage';
  if (dietType === 'dietMeatHeavy' || dietType === 'dietAverage') {
    const savingsToVegan = breakdown.food - EMISSION_FACTORS.dietVegan;
    const savingsToVeg = breakdown.food - EMISSION_FACTORS.dietVegetarian;

    list.push({
      id: 'plant_based_transition',
      category: 'food',
      text: 'Transition to a Vegan or Vegetarian Diet',
      desc: 'Adopting a plant-based diet is one of the most effective personal actions to reduce global agricultural emissions.',
      impact: 'high',
      reduction: Math.round(savingsToVegan)
    });
    list.push({
      id: 'meatless_mondays',
      category: 'food',
      text: 'Introduce Meatless Mondays',
      desc: 'Going meat-free just one day a week saves significant land-use emissions and helps ease the transition to green eating.',
      impact: 'low',
      reduction: Math.round(savingsToVeg / 3) // ~1/3 of vegetarian savings
    });
  } else if (dietType === 'dietVegetarian') {
    list.push({
      id: 'vegan_upgrade',
      category: 'food',
      text: 'Transition to a Fully Vegan Diet',
      desc: 'Remove dairy and egg products from your diet, further cutting agricultural carbon footprint.',
      impact: 'medium',
      reduction: Math.round(breakdown.food - EMISSION_FACTORS.dietVegan)
    });
  }

  // --- SHOPPING ---
  const shoppingSpend = parseFloat(inputs.shoppingSpend) || 0;
  const shoppingAnnual = breakdown.shopping;

  if (shoppingSpend > 50) {
    list.push({
      id: 'secondhand_shopping',
      category: 'shopping',
      text: 'Buy Secondhand and Refurbished Goods',
      desc: 'Opt for pre-owned clothing, vintage furniture, and refurbished laptops to extend product lifespans and avoid manufacturing emissions.',
      impact: 'medium',
      reduction: Math.round(shoppingAnnual * 0.4) // 40% savings
    });
    list.push({
      id: 'cooling_off_period',
      category: 'shopping',
      text: 'Implement a 48-Hour Shopping Cooling-Off Rule',
      desc: 'Wait 48 hours before purchasing non-essential items online to curb impulse buying and packaging waste.',
      impact: 'low',
      reduction: Math.round(shoppingAnnual * 0.15) // 15% reduction
    });
  }

  // --- WASTE ---
  const wasteVolume = inputs.wasteVolume || 'wasteBaseMedium';
  const recyclingLevel = inputs.recyclingLevel || 'recyclingMedium';
  const wasteAnnual = breakdown.waste;

  if (wasteVolume === 'wasteBaseHigh' || wasteVolume === 'wasteBaseMedium') {
    list.push({
      id: 'composting',
      category: 'waste',
      text: 'Compost Organic Food Waste',
      desc: 'Divert organic scraps from landfills (where they rot and release methane) to backyard or municipal compost programs.',
      impact: 'medium',
      reduction: 140
    });
    list.push({
      id: 'zero_waste_grocery',
      category: 'waste',
      text: 'Zero-Waste Grocery Habits',
      desc: 'Bring reusable mesh produce bags, purchase dry goods in bulk, and reject single-use plastic packaging.',
      impact: 'low',
      reduction: 90
    });
  }

  if (recyclingLevel !== 'recyclingHigh') {
    list.push({
      id: 'meticulous_recycling',
      category: 'waste',
      text: 'Meticulous Paper, Metal, & Glass Recycling',
      desc: 'Clean and sort cardboard, aluminum cans, and glass jars. Make sure you understand local sorting guidelines to avoid contamination.',
      impact: 'medium',
      reduction: Math.round(wasteAnnual * 0.3)
    });
  }

  // Group recommendations by impact level
  const highImpact = list.filter(r => r.impact === 'high');
  const mediumImpact = list.filter(r => r.impact === 'medium');
  const quickWins = list.filter(r => r.impact === 'low');

  return { highImpact, mediumImpact, quickWins };
}

/**
 * Generates a monthly goal roadmap targeting a specific footprint reduction
 * @param {Object} results - Calculated footprint object
 * @param {number} targetAnnualFootprint - Desired annual footprint target (in kg CO2)
 * @returns {Object} Roadmap summary and steps
 */
export function generateGoalRoadmap(results, targetAnnualFootprint) {
  if (!results) {
    return { targetMet: false, steps: [], totalReductionProposed: 0 };
  }

  const currentAnnual = results.annualTotal;
  const requiredReduction = currentAnnual - targetAnnualFootprint;

  if (requiredReduction <= 0) {
    return {
      targetMet: true,
      totalReductionProposed: 0,
      steps: [
        {
          month: 1,
          title: 'Maintain Your Low Footprint',
          desc: 'Your current carbon footprint is already below your target! Keep up your sustainable habits.',
          reduction: 0,
          category: 'general'
        }
      ]
    };
  }

  // Fetch all recommendations
  const recs = generateRecommendations(results);
  const allActions = [...recs.highImpact, ...recs.mediumImpact, ...recs.quickWins];
  
  // Sort actions by carbon reduction size (highest first) to prioritize high-yield steps
  allActions.sort((a, b) => b.reduction - a.reduction);

  const steps = [];
  let accumulatedReduction = 0;
  let month = 1;

  for (const action of allActions) {
    if (accumulatedReduction >= requiredReduction) break;

    steps.push({
      month: month++,
      title: action.text,
      desc: action.desc,
      reduction: action.reduction,
      category: action.category
    });

    accumulatedReduction += action.reduction;
  }

  return {
    targetMet: accumulatedReduction >= requiredReduction,
    totalReductionProposed: accumulatedReduction,
    requiredReduction,
    steps
  };
}
