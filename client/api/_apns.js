'use strict';
const http2=require('node:http2'),crypto=require('node:crypto');
let cached;
function configured(){return !!(process.env.CFN_APNS_KEY_ID&&process.env.CFN_APNS_PRIVATE_KEY&&process.env.CFN_APNS_TEAM_ID);}
function jwt(){
 if(cached&&Date.now()-cached.at<45*60000)return cached.value;
 const b=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
 const text=b({alg:'ES256',kid:process.env.CFN_APNS_KEY_ID})+'.'+b({iss:process.env.CFN_APNS_TEAM_ID,iat:Math.floor(Date.now()/1000)});
 const signature=crypto.sign('sha256',Buffer.from(text),{key:process.env.CFN_APNS_PRIVATE_KEY.replace(/\\n/g,'\n'),dsaEncoding:'ieee-p1363'}).toString('base64url');
 cached={at:Date.now(),value:text+'.'+signature};return cached.value;
}
async function send(device,payload,id,type='alert'){
 if(!configured())throw Error('push_unconfigured');
 const auth=jwt();
 return new Promise(resolve=>{
  let done=false,status=0,body='';const host=device.environment==='sandbox'?'api.sandbox.push.apple.com':'api.push.apple.com';
  const client=http2.connect('https://'+host);let timer;
  const finish=result=>{if(done)return;done=true;clearTimeout(timer);client.destroy();resolve(result);};
  timer=setTimeout(()=>finish({state:'uncertain'}),7000);
  client.on('error',()=>finish({state:'uncertain'}));
  const req=client.request({':method':'POST',':path':'/3/device/'+device.token,authorization:'bearer '+auth,'apns-topic':'com.cuadz.cfn.prototype'+(type==='liveactivity'?'.push-type.liveactivity':''),'apns-push-type':type,'apns-priority':type==='liveactivity'?'5':'10','apns-expiration':String(Math.floor(Date.now()/1000)+120),'apns-collapse-id':id});
  req.on('response',h=>{status=h[':status'];});req.on('data',c=>{body+=c;});req.on('error',()=>finish({state:'uncertain'}));
  req.on('end',()=>{let reason;try{reason=JSON.parse(body).reason;}catch{}
   finish({state:status===200?'sent':status===429||status>=500?'retry':'rejected',status,reason,invalid:status===410||reason==='BadDeviceToken'||reason==='DeviceTokenNotForTopic'});
  });req.end(JSON.stringify(payload));
 });
}
module.exports={configured,send};
