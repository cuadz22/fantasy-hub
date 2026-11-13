# Open items (update as things change)
- SECURITY: the git `origin` remote URL on the owner's Mac has a GitHub personal access token embedded in it. Revoke it on GitHub, then reset the remote to the plain `https://github.com/cuadz22/fantasy-hub.git` URL (GitHub Desktop handles auth). Never print `git remote -v` output into notes or chat.
- Decide how to get Yahoo lineups without the owner's computer on: options are (1) accept scraping only at kickoff windows with the computer on, (2) a scheduled task that runs on the owner's computer, (3) the repo's own Chrome extension (`extension/`) posting lineups to the site while the owner's browser is open, (4) keep requesting Yahoo API access.
- Build BallDontLie live-stats function (`client/api/live-stats.js`) after the owner adds `BALLDONTLIE_API_KEY` to Vercel; include the live projection model (see PROJECT.md).
- Automate live stats: prototype ESPN free feed, apply per-league scoring, compare to Yahoo; scheduled job + JSON the site reads (see PROJECT.md).
- Auto-push script for the owner's Mac (offered, not confirmed) so publishing doesn't need GitHub Desktop + computer use.
- Yahoo historical and all-time H2H PPG database for primetime pairs.
- Matchups tab archive for weeks 1-2.
- Show the per-player `note` field from the feed.
- Refresh stale Commish market inputs.
- Next podcast blurbs (owner will send links).
- Refresh the offline gist fallback snapshot.
- Rerun Rebirth win odds and Road to the Playoffs after the Nov 12 trade (offered, not confirmed).
- Rebirth FAAB/waiver date caveat; Chip waiver intent.
- Revoke old GitHub tokens.
- Live Activity / Dynamic Island mockup (offered). iPhone widget mockup exists: tools not saved; see CFN_Widget_Preview.html if it still exists.
- Week 10 live numbers are a post-Thursday snapshot; refresh as Sunday games finish.

# Changelog (recent)
- Week 10 live matchups on the site; card restyle; white numbers with green/orange finals; LIVE pill; homepage Week 10 Matchups live hub with primetime carried over (commits d89e978, 8ce0aa5, fe6a569, then 2cd7962, 0d93f75, ff37a9b).
