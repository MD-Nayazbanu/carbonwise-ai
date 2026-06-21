// js/challenges.js - Eco Challenges System

export const CHALLENGES = [
  {
    id: 'plastic_free',
    title: 'Plastic-Free Week',
    description: 'Avoid all single-use plastics for 7 days. Swap plastic water bottles for reusable steel flask, and refuse grocery bags.',
    xp: 150,
    duration: '7 Days',
    actionTip: 'Carry a reusable canvas tote and container for takeaway lunches.',
    category: 'waste'
  },
  {
    id: 'public_transport',
    title: 'Commute Green Challenge',
    description: 'Leave the car in the garage. Use public transit, cycling, walking, or carpooling for all work or school trips this week.',
    xp: 250,
    duration: '5 Days',
    actionTip: 'Check transit schedules or coordinate a ride share with a colleague.',
    category: 'transportation'
  },
  {
    id: 'energy_saving',
    title: 'Standby Shutdown',
    description: 'Unplug all electrical equipment on standby at night. Swap out old lightbulbs for energy-efficient LEDs.',
    xp: 200,
    duration: '10 Days',
    actionTip: 'Use smart strips or manually pull plugs for routers, TVs, and chargers before bed.',
    category: 'electricity'
  },
  {
    id: 'meatless_week',
    title: 'Veggie Power',
    description: 'Adopt a completely vegetarian or vegan diet for one week to experience the low footprint of plant-based foods.',
    xp: 300,
    duration: '7 Days',
    actionTip: 'Explore bean-based curries, lentil soups, and roasted tofu dishes.',
    category: 'food'
  },
  {
    id: 'secondhand_style',
    title: 'Thrift & Repair',
    description: 'Curb manufacturing demand. Spend zero money on brand new clothes or accessories. Buy thrift or repair old garments instead.',
    xp: 180,
    duration: '14 Days',
    actionTip: 'Visit local secondhand boutiques or patch up a worn pair of jeans.',
    category: 'shopping'
  }
];

/**
 * Returns all challenges combined with their completion status
 * @param {Array} completedIds - List of completed challenge IDs from state
 * @returns {Array} List of challenge objects with status flags
 */
export function getChallengesWithStatus(completedIds = []) {
  return CHALLENGES.map(challenge => {
    const isCompleted = completedIds.includes(challenge.id);
    return {
      ...challenge,
      status: isCompleted ? 'Completed' : 'Available',
      isCompleted
    };
  });
}

/**
 * Calculates total XP earned from completed challenges
 * @param {Array} completedIds - List of completed challenge IDs
 * @returns {number} Sum of XP
 */
export function calculateEarnedXP(completedIds = []) {
  return CHALLENGES
    .filter(c => completedIds.includes(c.id))
    .reduce((sum, c) => sum + c.xp, 0);
}
