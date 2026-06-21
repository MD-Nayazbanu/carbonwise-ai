// js/badges.js - Achievement & Badge System + Certificate Generator

export const BADGES = [
  {
    id: 'eco_beginner',
    name: 'Eco Beginner',
    desc: 'Completed first carbon footprint assessment.',
    icon: '🌱',
    requirementText: 'Complete your first assessment.'
  },
  {
    id: 'green_citizen',
    name: 'Green Citizen',
    desc: 'Achieved a carbon score of 70 or above.',
    icon: '🏡',
    requirementText: 'Achieve a Carbon Score of 70+.'
  },
  {
    id: 'sustainability_champion',
    name: 'Sustainability Champion',
    desc: 'Achieved a carbon score of 85 or above.',
    icon: '🎖️',
    requirementText: 'Achieve a Carbon Score of 85+.'
  },
  {
    id: 'carbon_hero',
    name: 'Carbon Hero',
    desc: 'Achieved a carbon score of 95 or above.',
    icon: '⚡',
    requirementText: 'Achieve a Carbon Score of 95+.'
  }
];

/**
 * Checks which achievements the user qualifies for based on current database state
 * @param {Object} state - Local database state
 * @returns {Array} List of newly qualified badge IDs
 */
export function checkUnlockedBadges(state) {
  const unlocked = [];
  const history = state.assessmentHistory || [];
  const current = state.currentAssessment;

  if (current || history.length > 0) {
    unlocked.push('eco_beginner');
  }

  if (current) {
    if (current.score >= 70) unlocked.push('green_citizen');
    if (current.score >= 85) unlocked.push('sustainability_champion');
    if (current.score >= 95) unlocked.push('carbon_hero');
  }

  return unlocked;
}

/**
 * Draws a premium, high-resolution certificate on an HTML5 canvas
 * @param {HTMLCanvasElement} canvas - Target canvas
 * @param {string} badgeName - Name of the badge achievement
 * @param {string} profileId - User's Profile Sync ID
 * @param {number} score - Carbon Score
 * @param {string} dateString - Achievement date
 */
export function drawCertificate(canvas, badgeName, profileId, score, dateString) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Set resolution scale for crisp print quality
  const width = 800;
  const height = 600;
  canvas.width = width;
  canvas.height = height;

  // Draw background (cream/ivory paper texture base)
  ctx.fillStyle = '#FCFBF7';
  ctx.fillRect(0, 0, width, height);

  // Outer border (deep forest green)
  ctx.lineWidth = 12;
  ctx.strokeStyle = '#065F46';
  ctx.strokeRect(20, 20, width - 40, height - 40);

  // Inner border (gold)
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#D97706';
  ctx.strokeRect(32, 32, width - 64, height - 64);

  // Corner decorations (leaves or lines)
  ctx.fillStyle = '#065F46';
  const corners = [
    [32, 32],
    [width - 32, 32],
    [32, height - 32],
    [width - 32, height - 32]
  ];
  corners.forEach(([cx, cy]) => {
    ctx.beginPath();
    ctx.arc(cx, cy, 15, 0, Math.PI * 2);
    ctx.fill();
  });

  // Certificate Header
  ctx.fillStyle = '#065F46';
  ctx.font = 'bold 36px "Outfit", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('CERTIFICATE OF ECO ACHIEVEMENT', width / 2, 70);

  // Gold separator line
  ctx.fillStyle = '#D97706';
  ctx.fillRect(width / 2 - 120, 120, 240, 3);

  // Secondary text
  ctx.fillStyle = '#4B5563';
  ctx.font = 'italic 18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('This certificate is proudly awarded to', width / 2, 145);

  // Profile Sync ID (Recipient Name)
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 32px "Outfit", sans-serif';
  ctx.fillText(profileId.toUpperCase(), width / 2, 190);

  // Award Details
  ctx.fillStyle = '#4B5563';
  ctx.font = 'normal 16px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('for exceptional commitment to environmental stewardship and sustainability,', width / 2, 250);
  ctx.fillText('securing the milestone level of:', width / 2, 275);

  // Achievement Badge Name
  ctx.fillStyle = '#059669';
  ctx.font = 'bold 28px "Outfit", sans-serif';
  ctx.fillText(badgeName, width / 2, 320);

  // Carbon Score details
  ctx.fillStyle = '#111827';
  ctx.font = '600 18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`Official Carbon Score: ${score}/100`, width / 2, 370);

  // Verification Seal
  const sealX = width / 2;
  const sealY = 460;
  
  // Seal outer circle (Gold star burst or circle)
  ctx.beginPath();
  ctx.arc(sealX, sealY, 40, 0, Math.PI * 2);
  ctx.fillStyle = '#F59E0B';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#D97706';
  ctx.stroke();

  // Seal inner circle
  ctx.beginPath();
  ctx.arc(sealX, sealY, 32, 0, Math.PI * 2);
  ctx.fillStyle = '#D97706';
  ctx.fill();

  // Seal text/symbol
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 12px "Outfit", sans-serif';
  ctx.fillText('VERIFIED', sealX, sealY - 14);
  ctx.font = 'bold 18px "Outfit", sans-serif';
  ctx.fillText('🌱', sealX, sealY + 2);

  // Signatures & Dates
  ctx.fillStyle = '#4B5563';
  ctx.font = 'normal 14px "Plus Jakarta Sans", sans-serif';
  
  // Left: Date
  ctx.fillText('DATE', 150, 480);
  ctx.fillStyle = '#111827';
  ctx.font = '600 15px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(dateString || new Date().toLocaleDateString(), 150, 455);
  ctx.strokeStyle = '#D1D5DB';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, 470);
  ctx.lineTo(220, 470);
  ctx.stroke();

  // Right: Signature
  ctx.fillStyle = '#4B5563';
  ctx.font = 'normal 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('AUTHORIZED SIGNATURE', width - 150, 480);
  
  // Signature text style
  ctx.font = 'italic 16px "Outfit", sans-serif';
  ctx.fillStyle = '#065F46';
  ctx.fillText('CarbonWise AI Team', width - 150, 450);
  
  ctx.strokeStyle = '#D1D5DB';
  ctx.beginPath();
  ctx.moveTo(width - 220, 470);
  ctx.lineTo(width - 80, 470);
  ctx.stroke();
}
export function getBadgeById(id) {
  return BADGES.find(b => b.id === id);
}
