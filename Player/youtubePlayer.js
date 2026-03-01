// youtubePlayer.js
// dynamically imports Player/config.js, then uses playerCore/LibreUltra for SponsorBlock + DeArrow

let currentPlayer = null;
let currentSegments = [];
let sponsorWatcherInterval = null;

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

export async function createYouTubePlayer(containerId, videoId, options = {}) {
  if (!videoId) return console.error('Invalid video ID');
  const container = document.getElementById(containerId);
  if (!container) return console.error('Container not found');

  // Load config
  const CFG = await loadConfig();

  // Make sure LibreUltra is initialized
  if (!window.LibreUltra) {
    console.warn('Initializing LibreUltra from config...');
    const script = document.createElement('script');
    script.src = './Player/playerCore.js';
    script.async = true;
    document.head.appendChild(script);
    await new Promise(resolve => script.onload = resolve);
  }

  // Clear old player
  container.innerHTML = '';
  if (sponsorWatcherInterval) clearInterval(sponsorWatcherInterval);

  // Create iframe
  const iframe = document.createElement('iframe');
  const autoplay = options.autoplay ? 1 : 0;
  iframe.src = `${CFG.dearrow.API}embed/${videoId}?autoplay=${autoplay}&rel=0&modestbranding=1&enablejsapi=1`;
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

  // Fetch SponsorBlock segments via LibreUltra
  try {
    currentSegments = (await window.LibreUltra.sponsor(videoId)) || [];
    currentSegments.sort((a, b) => a.segment[0] - b.segment[0]);
  } catch (e) {
    console.warn('SponsorBlock fetch failed:', e);
    currentSegments = [];
  }

  // Automatic skipping
  const playerWindow = iframe.contentWindow;
  sponsorWatcherInterval = setInterval(() => {
    if (!playerWindow || !playerWindow.YT || !playerWindow.YT.Player) return;
    const ytPlayer = playerWindow.YT && playerWindow.YT.Player && playerWindow.YT.getPlayers && playerWindow.YT.getPlayers()[0];
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

export function getSponsorSegments() {
  return currentSegments;
}

export function destroyPlayer() {
  if (sponsorWatcherInterval) clearInterval(sponsorWatcherInterval);
  if (currentPlayer) {
    currentPlayer.remove();
    currentPlayer = null;
  }
  currentSegments = [];
}
