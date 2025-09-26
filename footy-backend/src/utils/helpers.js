const crypto = require('crypto');
const bcrypt = require('bcrypt');

// Generate random ID
const generateId = (length = 24) => {
  return crypto.randomBytes(length).toString('hex');
};

// Generate unique code
const generateUniqueCode = (length = 8) => {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length).toUpperCase();
};

// Hash password
const hashPassword = async (password, rounds = 12) => {
  return await bcrypt.hash(password, rounds);
};

// Compare password
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// Calculate distance between two coordinates (in kilometers)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

// Format duration in minutes to readable string
const formatDuration = (minutes) => {
  if (minutes < 60) {
    return `${minutes} minutes`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minutes`;
};

// Format date to readable string
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Generate match code
const generateMatchCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Check if match is upcoming
const isMatchUpcoming = (matchDateTime) => {
  return new Date(matchDateTime) > new Date();
};

// Check if match started (within last 4 hours)
const isMatchStarted = (startTime) => {
  const now = new Date();
  const start = new Date(startTime);
  const fourHoursFromStart = new Date(start.getTime() + 4 * 60 * 60 * 1000);
  
  return now >= start && now <= fourHoursFromStart;
};

// Check if match is live
const isMatchLive = (matchStartTime, duration) => {
  const now = new Date();
  const start = new Date(matchStartTime);
  const end = new Date(start.getTime() + duration * 60 * 1000);
  
  return now >= start && now <= end;
};

// Calculate time until match
const timeUntilMatch = (matchDateTime) => {
  const now = new Date();
  const matchTime = new Date(matchDateTime);
  const diffMs = matchTime - now;
  
  if (diffMs <= 0) return 'Match has passed';
  
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHrs = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ${diffHrs} hour${diffHrs > 1 ? 's' : ''}`;
  } else if (diffHrs > 0) {
    return `${diffHrs} hour${diffHrs > 1 ? 's' : ''} ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
  } else {
    return `${diffMins} minute${diffMins > 1 ? 's' : ''}`;
  }
};

// Slice text
const sliceText = (text, maxLength = 50) => {
  if (!text) return '';
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
};

// Generate score string
const formatScore = (teamAScore, teamBScore) => {
  return `${teamAScore} - ${teamBScore}`;
};

// Check if email is disposable
const isDisposableEmail = (email) => {
  const disposableDomains = [
    '10minutemail.com', 'guerrillamail.com', 'mailinator.com', 
    'temp-mail.org', 'throwaway.email'
  ];
  
  const domain = email.split('@')[1];
  return disposableDomains.includes(domain);
};

// Validate image URL
const isValidImageUrl = (url) => {
  try {
    const parsedUrl = new URL(url);
    return /^https?:/.test(parsedUrl.protocol) && 
      /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(parsedUrl.pathname);
  } catch {
    return false;
  }
};

// Count unique values in array
const countUniqueValues = (arr, property) => {
  if (property) {
    const values = arr.map(item => item[property]);
    return [...new Set(values)].length;
  }
  return [...new Set(arr)].length;
};

// Compile arrays for notifications
const compileNotificationText = (type, data) => {
  const templates = {
    matchCreated: `New match created: ${data.title} at ${data.location}`,
    matchJoined: `${data.playerName} joined your match`,
    matchLeft: `${data.playerName} left your match`,
    matchStarting: `Your match "${data.title}" is starting in 15 minutes`,
    matchEnded: `Match "${data.title}" has ended`,
    playerRequested: `New player request for position: ${data.position}`,
    ratingReceived: `You received a ${data.rating}/5 rating from ${data.raterName}`
  };
  
  return templates[type] || 'New notification';
};

module.exports = {
  generateId,
  generateUniqueCode,
  hashPassword,
  comparePassword,
  calculateDistance,
  formatDuration,
  formatDate,
  generateMatchCode,
  isMatchUpcoming,
  isMatchStarted,
  isMatchLive,
  timeUntilMatch,
  sliceText,
  formatScore,
  isDisposableEmail,
  isValidImageUrl,
  countUniqueValues,
  compileNotificationText
};