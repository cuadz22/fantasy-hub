/* Shared completed-week standings for the website and native app. */
(function () {
  'use strict';
  var state = {}, pending = {}, checked = {};
  function esc(s) { return String(s).replace(/[&<>"']/g, function(c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  window.cfnStandingsHTML = function(k) {
    var s = state[k];
    if (!s) return '<p class="lv-note">Standings are loading. Completed games only.</p>';
    var custom = s.customRows ? '<div class="subsec-hd">STS standings · 4 per win + 3 per top-six score</div><div class="st-table"><div class="sts-hdr"><span>#</span><span>Team</span><span>PTS</span><span>W-L-T</span><span>Top 6</span><span>PF</span></div>' + s.customRows.map(function(t){ return '<div class="sts-row"><span>'+t.rank+'</span><span>'+esc(t.name)+'</span><span>'+t.customPoints+'</span><span>'+esc(t.record)+'</span><span>'+t.topSixWeeks+'</span><span>'+t.pointsFor.toFixed(2)+'</span></div>'; }).join('') + '</div><div class="subsec-hd">Win-loss reference</div>' : '';
    return custom + stdAvg(LGD.stand[k]) + '<p class="lv-note">Through Week ' + s.throughWeek + ' · ' + s.season + '. Completed games only. Ranked by win percentage, then points for.' + (s.stale ? ' Showing saved standings; refresh is pending.' : '') + '</p>';
  };
  window.cfnLoadStandings = async function(k, force) {
    if (pending[k] || (!force && Date.now() - (checked[k] || 0) < 60000)) return;
    pending[k] = true;
    try {
      var r = await fetch('/api/mobile/standings?lg=' + encodeURIComponent(k), {cache:'no-store'});
      if (!r.ok) throw new Error('standings unavailable');
      var s = await r.json();
      if (s.leagueId !== k || !Number.isInteger(s.throughWeek) || s.rows.length !== 12 || s.rows.some(function(t){return t.wins+t.losses+t.ties!==s.throughWeek;})) throw new Error('invalid standings');
      var managers = {};
      var old = document.createElement('div'); old.innerHTML = LGD.stand[k];
      old.querySelectorAll('.lgs-row').forEach(function(row){ var nm=row.querySelector('.mg-nm b'), mg=row.querySelector('.mg-lg'); if(nm&&mg) managers[nm.textContent]=mg.textContent; });
      LGD.stand[k] = '<div class="st-table"><div class="lgs-hdr"><span>#</span><span>Team</span><span>W-L-T</span><span>PF</span><span>PA</span><span>Strk</span></div>' + s.rows.map(function(t){
        return '<div class="lgs-row"><span class="st-rk">'+t.rank+'</span><span class="mg-nm"><b>'+esc(t.name)+'</b><span class="mg-lg">'+esc(managers[t.name]||'')+'</span></span><span>'+esc(t.record)+'</span><span>'+t.pointsFor.toFixed(2)+'</span><span>'+t.pointsAgainst.toFixed(2)+'</span><span>'+esc(t.streak)+'</span></div>';
      }).join('') + '</div>';
      state[k] = s; checked[k] = Date.now();
      window.__cfnStandings = state;
      if (typeof lgState !== 'undefined' && lgState.k === k && lgState.tab === 'Standings') lgRender();
    } catch (_) {
      checked[k] = Date.now() - 45000;
      if (state[k]) state[k].stale = true;
      var panel = document.querySelector('#lg-panel[data-tab="Standings"]');
      if (panel && lgState.k === k && !state[k]) panel.innerHTML = '<p class="lv-note">Standings could not refresh. Please try again shortly.</p>';
    } finally { pending[k] = false; }
  };
  ['gl','bh','rb','sts'].forEach(function(k){ cfnLoadStandings(k); });
  document.addEventListener('visibilitychange',function(){if(!document.hidden&&typeof lgState!=='undefined')cfnLoadStandings(lgState.k);});
  setInterval(function(){if(!document.hidden&&typeof lgState!=='undefined')cfnLoadStandings(lgState.k);},60000);
})();
