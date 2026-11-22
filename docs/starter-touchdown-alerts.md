# Starter touchdown alerts — CFN 1.4 (12)

NFL GOAT play-by-play access was verified against the paid account and a real finished game on November 22, 2026. This implementation uses existing BDL snapshots, with no additional provider fetches and no dependency from score publication to notifications. Webhooks require ALL-ACCESS and are not used.

## Behavior

Opt-in, authenticated members only. Passing, rushing and receiving touchdowns with stable provider play IDs and matching cumulative box scores qualify. Returns and D/ST touchdowns are not included in this first version. Explicit starter slots (including flex/superflex) qualify; bench/IR/unknown slots do not. Player name, actual position and NFL team must match uniquely. Memberships always come from the server allowlist.

One alert per play per league per installation combines involved starters within that league. Tapping opens that league’s corresponding matchup directly. Different devices may each receive one alert. Apple banners use the CFN icon and system typography/material.

## Reliability

Independent authenticated cron runs every minute and checks cached plays at 15-second offsets. Events must be 20–180 seconds old, snapshots under 90 seconds old, and complete roster snapshots under 180 seconds old and recorded after the play. Delivery depends on provider latency, polling, verification and APNs; it is not instantaneous or guaranteed. Stale, ambiguous or unconfirmed data is suppressed. A later official correction can still overturn an already delivered alert.

Durable event/installation claims survive restarts. Workers share a lock. Known APNs 429/5xx rejections retry with backoff; ambiguous transport outcomes do not, favoring a missed alert over a duplicate. APNs collapse IDs are an additional guard. Storage failures prevent sending. No catch-up alerts before opt-in or after three minutes. Persistent installation IDs and monotonic revisions prevent delayed requests from rebinding the phone to an old account and retain deduplication across token changes. Revoked/expired sessions are checked before sending. Invalid tokens are removed.

## Operations

Production variables: CFN_PUSH_ENABLED, CFN_APNS_PRIVATE_KEY (sensitive), CFN_APNS_KEY_ID, CFN_APNS_TEAM_ID. The key is topic-specific to com.cuadz.cfn.prototype and production only. Credentials never belong in the app or repository. Set CFN_PUSH_ENABLED=false and deploy to stop delivery. Existing scoring jobs and endpoints remain independent.

Authenticated GET /api/mobile/health includes push job state. No emails or tokens appear in logs. Run npm run test:reliability for replay, routing, deduplication, account/session, outage, and scoring regression checks.

## Release validation

Automated tests use in-memory Redis and a real captured BDL game; they never message testers. Production APNs connectivity was checked with an intentionally invalid token (BadDeviceToken, not an authentication error). This is not proof of physical-device delivery. After installing build 12, enable Account > Notifications > Starter touchdowns and validate delivery on an opted-in phone. External testers require TestFlight approval.

## Private rollout — November 22

`client/api/_pushrollout.json` allows only Jose’s existing member hash. All worker deliveries and self-tests enforce this allowlist; registrations outside it are not ready for delivery. Removing the hash disables access. Do not expand it without explicit authorization.

The authenticated self-test derives a real starter and matchup from the signed-in member’s server-side assignments and current week. It labels the notification TEST and Simulated play, makes no scoring changes, rate-limits each installation to one per minute, and uses the same touchdown navigation payload as real alerts. Default league is Gentlemen’s League for Jose.
