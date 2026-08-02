const LEAGUES = [
  { id: 'beaners-husseins', name: "Beaners & Husseins", yahooId: '100398' },
  { id: 'rebirth', name: 'Rebirth', yahooId: '101720' },
  { id: 'gentlemens-league', name: "Gentlemen's League", yahooId: '101813' },
  { id: 'shoot-the-shits', name: 'Shoot the Shits', yahooId: '101814' },
];

function timeAgo(dateStr) {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function render(syncData) {
  const container = document.getElementById('leagues');
  let lastSync = null;

  container.innerHTML = LEAGUES.map(league => {
    const sync = syncData[`sync_${league.id}`];
    if (sync?.syncedAt) {
      if (!lastSync || new Date(sync.syncedAt) > new Date(lastSync)) {
        lastSync = sync.syncedAt;
      }
    }

    const status = sync?.status || 'pending';
    const dotClass = status === 'success' ? 'success' : status === 'error' ? 'error' : 'pending';
    const statusText = status === 'success'
      ? `Synced ${timeAgo(sync.syncedAt)}`
      : status === 'error'
      ? 'Sync failed'
      : 'Not synced yet';

    return `
      <div class="league-row">
        <div>
          <div class="league-name">${league.name}</div>
          <div class="league-sub">yahoo.com/f1/${league.yahooId}</div>
        </div>
        <div class="status">
          <div class="dot ${dotClass}"></div>
          <span style="color: #555">${statusText}</span>
        </div>
      </div>
    `;
  }).join('');

  document.getElementById('last-sync').textContent = lastSync
    ? `Last sync: ${timeAgo(lastSync)}`
    : 'Never synced';
}

// Load sync status from storage
chrome.storage.local.get(null, (data) => render(data));
