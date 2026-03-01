// youtubePlayer.js
// Fully modular YouTube player with DeArrow + SponsorBlock integration

let currentPlayer = null;
let currentSegments = [];
let sponsorWatcherInterval = null;
let currentBranding = null;

/**
 * Load Player/config.js dynamically and extract Player.Misc
 */
async function loadConfig() {
  const raw = await fetch('./Player/config.js', { cache: 'no-store' }).then(r => r.text());
  const sandbox = {};
  new Function('sandbox', `
    let config;
    ${raw}
    if(typeof config !== "undefined") sandbox.config = config;
  `)(sandbox);
  return Object.freeze(sandbox.config.Player.Misc);
}

/**
 * Create a YouTube iframe player
 */
export async function createYouTubePlayer(containerId, videoId, options = {}) {
  if (!videoId) return console.error('Invalid video ID');
  const container = document.getElementById(containerId);
  if (!container) return console.error('Container not found');

  // Load config
  const CFG = await loadConfig();

  // Initialize LibreUltra if needed
  if (!window.LibreUltra) {
    const script = document.createElement('script');
    script.src = './Player/playerCore.js';
    script.async = true;
    document.head.appendChild(script);
    await new Promise(resolve => script.onload = resolve);
  }

  // Clear previous player & intervals
  container.innerHTML = '';
  if (sponsorWatcherInterval) clearInterval(sponsorWatcherInterval);
  currentSegments = [];
  currentBranding = null;

  // Create YouTube iframe (nocookie)
  const iframe = document.createElement('iframe');
  const autoplay = options.autoplay ? 1 : 0;
  iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=${autoplay}&rel=0&modestbranding=1&enablejsapi=1`;
  iframe.width = options.width || '640';
  iframe.height = options.height || '360';
  iframe.frameBorder = '0';
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = 'no-referrer';
  iframe.title = 'YouTube (Privacy-first) Player';
  iframe.style.cssText = 'border-radius:12px;border:none;overflow:hidden;';
  container.appendChild(iframe);
  currentPlayer = iframe;

  // Fetch SponsorBlock segments
  try {
    currentSegments = (await window.LibreUltra.sponsor(videoId)) || [];
    currentSegments.sort((a, b) => a.segment[0] - b.segment[0]);
  } catch (e) {
    console.warn('SponsorBlock fetch failed:', e);
    currentSegments = [];
  }

  // Fetch DeArrow branding (titles, thumbnails)
  try {
    currentBranding = await window.LibreUltra.dearrow(videoId);
  } catch (e) {
    console.warn('DeArrow fetch failed:', e);
    currentBranding = null;
  }

  // Auto-skip SponsorBlock segments
  sponsorWatcherInterval = setInterval(() => {
    const playerWindow = iframe.contentWindow;
    if (!playerWindow || !playerWindow.YT || !playerWindow.YT.Player) return;
    const ytPlayers = playerWindow.YT.getPlayers?.() || [];
    const ytPlayer = ytPlayers[0];
    if (!ytPlayer || !ytPlayer.getCurrentTime) return;

    const currentTime = ytPlayer.getCurrentTime();
    for (const seg of currentSegments) {
      const [start, end] = seg.segment;
      if (currentTime >= start && currentTime < end) {
        ytPlayer.seekTo(end, true);
        break;
      }
    }
  }, 300);

  return iframe;
}

/**
 * Replace title & thumbnail if DeArrow data is present
 */
export function applyDeArrow(embedElement) {
  if (!currentBranding || !embedElement) return;

  const titleEl = embedElement.querySelector('.embed-title');
  const thumbEl = embedElement.querySelector('.embed-thumbnail');

  if (!titleEl && !thumbEl) return;

  const orig = { title: titleEl?.textContent, thumb: thumbEl?.src };
  const newTitle = currentBranding.titles?.[0]?.votes >= 0
    ? currentBranding.titles[0].title.replace(/(^|\s)>(\S)/g, '$1$2')
    : null;

  const newThumb = currentBranding.thumbnails?.[0]?.votes >= 0 && !currentBranding.thumbnails[0].original
    ? `https://dearrow-thumb.ajay.app/api/v1/getThumbnail?videoID=${currentBranding.videoID}&time=${currentBranding.thumbnails[0].timestamp}&license=${currentBranding.license}`
    : null;

  if (newTitle && titleEl) titleEl.textContent = newTitle;
  if (newThumb && thumbEl) thumbEl.src = newThumb;
}

/**
 * Accessor for current SponsorBlock segments
 */
export function getSponsorSegments() {
  return currentSegments;
}

/**
 * Destroy current player & cleanup
 */
export function destroyPlayer() {
  if (sponsorWatcherInterval) clearInterval(sponsorWatcherInterval);
  if (currentPlayer) currentPlayer.remove();
  currentPlayer = null;
  currentSegments = [];
  currentBranding = null;
}
