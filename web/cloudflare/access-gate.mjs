// Cloudflare entry: PamanKu trusts the oai-authenticated-user-* headers that the ChatGPT gateway sets.
// On Cloudflare that job moves here: every request must carry a Cloudflare Access token (Cf-Access-Jwt-Assertion),
// which is verified against the team's public keys (RS256, audience, issuer, expiry). Identity headers sent by the
// client are always dropped and rebuilt from the verified token, so they cannot be forged, even via *.workers.dev.
// Required vars: ACCESS_TEAM_DOMAIN (e.g. "peternakan.cloudflareaccess.com") and ACCESS_AUD (the Access app's AUD tag).
import app from '../worker/index.js';

const IDENTITY=['oai-authenticated-user-id','oai-authenticated-user-email'];
const KEY_TTL_MS=10*60*1000;
let keyCache={domain:'',at:0,keys:new Map()};

const b64url=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(s.length/4)*4,'=')),c=>c.charCodeAt(0));
const decodePart=s=>JSON.parse(new TextDecoder().decode(b64url(s)));
const page=(status,title,text)=>new Response(`<!doctype html><html lang="id"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><body style="font:16px system-ui,sans-serif;max-width:560px;margin:15vh auto;padding:0 16px"><h1>${title}</h1><p>${text}</p></body></html>`,{status,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});

async function keysFor(domain,fetchKeys,refresh){
 if(!refresh&&keyCache.domain===domain&&Date.now()-keyCache.at<KEY_TTL_MS)return keyCache.keys;
 const res=await fetchKeys(`https://${domain}/cdn-cgi/access/certs`);
 if(!res.ok)throw Error('Access certs '+res.status);
 const keys=new Map();
 for(const jwk of (await res.json()).keys||[])if(jwk.kty==='RSA')keys.set(jwk.kid,await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']));
 keyCache={domain,at:Date.now(),keys};return keys;
}

// Returns the verified claims, or null when the token is missing, malformed, forged, expired or for another app.
export async function verifyAccessToken(token,{domain,aud,fetchKeys=fetch,now=Date.now()}){
 const parts=String(token||'').split('.');if(parts.length!==3)return null;
 let header,claims;try{header=decodePart(parts[0]);claims=decodePart(parts[1])}catch{return null}
 if(header.alg!=='RS256'||!header.kid)return null;
 let key=(await keysFor(domain,fetchKeys,false)).get(header.kid);
 // Keys rotate: refetch for an unknown kid, but at most every 30s so junk tokens cannot hammer the certs endpoint.
 if(!key&&Date.now()-keyCache.at>30000)key=(await keysFor(domain,fetchKeys,true)).get(header.kid);
 if(!key)return null;
 const signed=new TextEncoder().encode(parts[0]+'.'+parts[1]);
 if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,b64url(parts[2]),signed))return null;
 const auds=Array.isArray(claims.aud)?claims.aud:[claims.aud],t=now/1000;
 if(!auds.includes(aud)||claims.iss!==`https://${domain}`)return null;
 if(typeof claims.exp!=='number'||claims.exp<t-60||(typeof claims.nbf==='number'&&claims.nbf>t+60))return null;
 if(!claims.sub||!claims.email)return null;// service tokens have no person behind them
 return claims;
}

const cookieToken=h=>(h||'').split(/;\s*/).find(c=>c.startsWith('CF_Authorization='))?.slice(17);

// Returns {claims} for a verified visitor, or {response} with the refusal to send back. Fails closed without configuration.
export async function requireAccess(request,env,fetchKeys=fetch){
 const domain=String(env.ACCESS_TEAM_DOMAIN||'').trim().replace(/^https?:\/\//,'').replace(/\/+$/,''),aud=String(env.ACCESS_AUD||'').trim();
 if(!domain||!aud)return {response:page(503,'Belum dikonfigurasi','ACCESS_TEAM_DOMAIN dan ACCESS_AUD belum diisi. Aplikasi menolak semua akses sampai login Cloudflare Access terpasang.')};
 const token=request.headers.get('cf-access-jwt-assertion')||cookieToken(request.headers.get('cookie'));
 let claims=null;
 try{claims=await verifyAccessToken(token,{domain,aud,fetchKeys})}
 catch{return {response:page(503,'Login sedang tidak tersedia','Kunci Cloudflare Access tidak dapat diambil. Coba lagi sebentar.')}}
 if(!claims)return {response:page(401,'Perlu masuk','Buka aplikasi lewat alamat yang dilindungi Cloudflare Access lalu masuk dengan email yang diizinkan.')};
 return {claims};
}

export function createGate(inner,options={}){
 return {async fetch(request,env,ctx){
  const url=new URL(request.url);
  // Refuse before anything else, sign-out included, so an unconfigured deployment answers the same everywhere.
  if(!String(env.ACCESS_TEAM_DOMAIN||'').trim()||!String(env.ACCESS_AUD||'').trim())return (await requireAccess(request,env,options.fetchKeys||fetch)).response;
  if(url.pathname==='/signout-with-chatgpt')return Response.redirect(url.origin+'/cdn-cgi/access/logout',302);
  const {claims,response}=await requireAccess(request,env,options.fetchKeys||fetch);
  if(response)return response;
  const headers=new Headers(request.headers);
  for(const h of IDENTITY)headers.delete(h);
  // Access "sub" is stable per person per account; prefix keeps these ids apart from ChatGPT ids if data is ever merged.
  headers.set('oai-authenticated-user-id','cf-'+claims.sub);
  headers.set('oai-authenticated-user-email',String(claims.email).toLowerCase());
  return inner.fetch(new Request(request,{headers}),env,ctx);
 }};
}

export default createGate(app);
