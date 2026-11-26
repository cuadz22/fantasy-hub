'use strict';
// Presentation only: separate key; never writes scoring, membership, news or jobs.
const M = require('./_m'), A = require('./_mauth'), CONFIG = require('./_seasonal.json');
const KEY = 'presentation:seasonal:v1';
function response(config, enabled, member, now = Date.now(), appearance = null) {
 const valid = config.schemaVersion === 1 && config.theme === 'smoked-mocha' &&
   Number.isFinite(Date.parse(config.startsAt)) && Number.isFinite(Date.parse(config.endsAt)) &&
   Date.parse(config.endsAt) > Date.parse(config.startsAt) && Date.parse(config.endsAt) - Date.parse(config.startsAt) <= 3*86400000;
 const harvest = appearance === "harvest-cream";
 const allowed = harvest || config.memberHashes.includes(member.h);
 return {schemaVersion:1,theme:harvest ? 'harvest-cream' : 'smoked-mocha',enabled:valid && allowed && enabled === true,
   startsAt:config.startsAt,endsAt:config.endsAt,serverNow:new Date(now).toISOString(),
   canManage:config.editors.includes(member.h),audience:harvest ? 'members' : 'personal',refreshAfterSeconds:300};
}
async function handle(req, body, {store=M, auth=A.authenticate, config=CONFIG, now=Date.now()}={}) {
 if(!['GET','POST'].includes(req.method)) return {status:405,json:{error:'method_not_allowed'}};
 const appearance = req.query?.appearance === 'harvest-cream' ? 'harvest-cream' : null;
 const a = await auth(req); if(!a) return {status:401,json:{error:'unauthorized'}};
 if(req.method === 'POST') {
   if(!config.editors.includes(a.member.h)) return {status:403,json:{error:'forbidden'}};
   if(typeof body?.enabled !== 'boolean' || Object.keys(body).some(k=>k!=='enabled')) return {status:400,json:{error:'invalid_theme_setting'}};
   await store.write(KEY,{enabled:body.enabled,updatedAt:new Date(now).toISOString()},365*86400);
   return {status:200,json:response(config,body.enabled,a.member,now,appearance)};
 }
 // Older builds retain their original private rollout; capable builds use the member theme.
 if(!appearance && !config.memberHashes.includes(a.member.h)) return {status:200,json:response(config,false,a.member,now,appearance)};
 const saved = await store.read(KEY);
 const enabled = saved == null ? config.enabled : saved.enabled === true;
 return {status:200,json:response(config,enabled,a.member,now,appearance)};
}
module.exports = {handle,response,KEY};
