// youtubePlayer.js
import { config } from '../config.js'; // adjust path

// Store currently loaded player and segments
let currentPlayer = null;
let currentSegments = [];
let segmentCheckInterval = null;

export async function createYouTubePlayer(containerId, videoId, options = {}) {
  if (!videoId) return console.error('Invalid video ID');
  const container = document.getElementById(containerId);
  if (!container) return console.error('Container not found');

  container.innerHTML = ''; // clear old player

  // Create iframe using Piped (privacy-first)
  const iframe = document.createElement('iframe');
  iframe.src = `${config.videoAPI}watch?v=${videoId}${options.autoplay ? '&autoplay=1' : ''}`;
  iframe.width = options.width || '320';
  iframe.height = options.height || '180';
  iframe.frameBorder = '0';
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
  iframe.sandbox = 'allow-scripts allow-same-origin allow-presentation';
  iframe.referrerPolicy = 'no-referrer';
  iframe.loading = 'lazy';
  iframe.style.borderRadius = '12px';
  iframe.style.border = 'none';
  iframe.style.overflow = 'hidden';
  iframe.title = 'Privacy-first YouTube Player';

  container.appendChild(iframe);
  currentPlayer = iframe;

  // Fetch SponsorBlock segments for auto-skip
  try {
    const res = await fetch(`${config.sponsorBlock}/api/skipSegments?videoID=${videoId}`);
    currentSegments = res.ok ? (await res.json()).sort((a,b)=>a.segment[0]-b.segment[0]) : [];
  } catch (e) {
    console.warn('SponsorBlock fetch failed:', e);
    currentSegments = [];
  }

  // Start auto-skip loop if needed
  if (segmentCheckInterval) clearInterval(segmentCheckInterval);
  segmentCheckInterval = setInterval(() => {
    // Placeholder: implement real auto-skip logic if using HTML5 player
    // For iframe embeds like Piped, you may need a custom player to read currentTime
  }, 500);

  return iframe;
}

// Optional: expose current segments for external auto-skip logic
export function getSponsorSegments() {
  return currentSegments;
}
