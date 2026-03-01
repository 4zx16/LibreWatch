// Player/youtubePlayer.js
// Full JS player for LibreWatch
// Dynamically imports Player/config.js, then uses playerCore/LibreUltra for SponsorBlock + DeArrow

let currentPlayer = null;
let currentSegments = [];
let sponsorWatcherInterval = null;

async function loadConfig() {
  // Fix relative path: fetch config.js relative to this JS file
  const scriptURL = new URL('./config.js', import.meta.url);
  const raw = await fetch(scriptURL.href, { cache: 'no-store' }).then(r => r.text());

  const sandbox = {};
  new Function('sandbox', `
    let config;
    ${raw}
    if(typeof config !== "undefined") sandbox.config = config;
  `)(sandbox);

  return Object.freeze(sandbox.config.Player.Misc);
}

async function ensureLibreUltra(CFG) {
  if (!window.LibreUltra) {
    // Load playerCore.js if LibreUltra not initialized
    await new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = new URL('./playerCore.js', import.meta.url).href;
      script.async = true;
      script.onload = resolve;
      document.head.appendChild(script);
    });
  }
}

export async function createYouTubePlayer(containerId, videoId, options = {}) {
  if (!videoId) return console.error('Invalid video ID');
  const container = document.getElementById(containerId);
  if (!container) return console.error('Container not found');

  // Load config & ensure LibreUltra
  const CFG = await loadConfig();
  await ensureLibreUltra(CFG);

  // Clear old player
  container.innerHTML = '';
  if (sponsorWatcherInterval) clearInterval(sponsorWatcherInterval);

  // Create iframe player
  const iframe = document.createElement('iframe');
  const autoplay = options.autoplay ? 1 : 0;
  iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=${autoplay}&rel=0&modestbranding=1&enablejsapi=1`;
  iframe.width = options.width || '640';
  iframe.height = options.height || '360';
  iframe.frameBorder = '0';
  iframe.allow =
    'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
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

  // Automatic SponsorBlock skipping
  const ytCheckInterval = 300;
  sponsorWatcherInterval = setInterval(() => {
    if (!iframe.contentWindow || !iframe.contentWindow.YT) return;
    const players = iframe.contentWindow.YT.getPlayers?.() || [];
    const ytPlayer = players[0];
    if (!ytPlayer || !ytPlayer.getCurrentTime) return;

    const currentTime = ytPlayer.getCurrentTime();
    for (const seg of currentSegments) {
      const [start, end] = seg.segment;
      if (currentTime >= start && currentTime < end) {
        ytPlayer.seekTo(end, true);
        break;
      }
    }
  }, ytCheckInterval);

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

// Optional: helper to append player dynamically in HTML
export async function initPlayerUI(containerId, inputId, buttonId) {
  const input = document.getElementById(inputId);
  const btn = document.getElementById(buttonId);
  if (!input || !btn) return;

  const extractVideoID = (val) => {
    try {
      if (val.includes('youtube.com') || val.includes('youtu.be')) {
        const url = new URL(val);
        return url.searchParams.get('v') || url.pathname.split('/').pop();
      }
      return val.trim();
    } catch {
      return val.trim();
    }
  };

  btn.addEventListener('click', async () => {
    const id = extractVideoID(input.value);
    if (!id) return alert('Invalid video ID');
    if (currentPlayer) destroyPlayer();
    await createYouTubePlayer(containerId, id, { autoplay: true });
  });
}
