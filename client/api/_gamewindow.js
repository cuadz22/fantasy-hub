'use strict';
// The collector deliberately polls every five minutes outside game windows.
// A fresh, corroborating calendar may allow idle status, never live delivery.
const IDLE_POLL_MS = 5 * 60000;
const IDLE_GRACE_MS = 2 * 60000; // minute cron alignment + collector runtime
const LIVE_SCHEDULE_MS = 3 * 60000;
const PRE_GAME_MS = 25 * 60000;
const recent = (stamp, now, age) => Number.isFinite(stamp) && stamp <= now && now - stamp <= age;
function idleSchedule(schedule, health, context, now) {
  if (!context || context.stale || !context.board || context.board.stale ||
      !recent(context.board.fetchedAt, now, IDLE_POLL_MS) ||
      !context.board.games?.length || !schedule?.games?.length ||
      !recent(schedule.observedAt, now, IDLE_POLL_MS + IDLE_GRACE_MS) ||
      !health?.ok || health.live !== false || health.season !== context.season || health.week !== context.week ||
      !recent(health.checkedAt, now, IDLE_POLL_MS + IDLE_GRACE_MS)) return false;
  // No idle shortcut near kickoff, for an overdue start, or an unknown state.
  if (!context.board.games.every(g => g.state === 'post' ||
      (g.state === 'pre' && Date.parse(g.start) > now + PRE_GAME_MS))) return false;
  return schedule.games.every(g => g.season === context.season && g.week === context.week && !g.postseason &&
    (g.status_state === 'final' || /^final/i.test(g.status || '') ||
     (['scheduled', 'pre', 'pre_game', 'pregame'].includes(g.status_state) && Date.parse(g.date) > now + PRE_GAME_MS)));
}
module.exports = { IDLE_POLL_MS, LIVE_SCHEDULE_MS, PRE_GAME_MS, recent, idleSchedule };
