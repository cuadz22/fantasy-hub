const { REDIRECT, json, html, sign, tokenCall, saveTokens } = require('./_yahoo');
module.exports = async (req, res) => {
  try {
    const u = new URL(req.url, 'http://x');
    const code = u.searchParams.get('code'), state = u.searchParams.get('state') || '';
    const [ts, sig] = state.split('.');
    if (!code || !ts || !sig || sig !== sign('state:' + ts) || Date.now() - Number(ts) > 15 * 60 * 1000) return json(res, 400, { error: 'bad_state' });
    const j = await tokenCall({ grant_type: 'authorization_code', code, redirect_uri: REDIRECT });
    await saveTokens(j);
    html(res, 200, '<!doctype html><meta charset="utf-8"><body style="font-family:system-ui;padding:40px;background:#0a0b07;color:#f1f4e6"><h2>Yahoo connected</h2><p>Cuadz Fantasy Network can now read your leagues. You can close this tab.</p>');
  } catch (e) { json(res, 500, { error: String(e.message || e) }); }
};
