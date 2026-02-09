const script = `(function(){
var ps=['utm_source','utm_medium','utm_campaign','utm_content','utm_term'];
var ck='_mk_utm';
var ds=['hotmart.com','pay.hotmart.com','go.hotmart.com','pay.kiwify.com.br','kiwify.com.br','eduzz.com','digitalmanager.guru'];

function gp(){
  var s=location.search.substring(1);
  if(!s)return null;
  var r={},p=s.split('&');
  for(var i=0;i<p.length;i++){
    var kv=p[i].split('=');
    var k=decodeURIComponent(kv[0]);
    if(ps.indexOf(k)>-1)r[k]=decodeURIComponent(kv[1]||'');
  }
  return Object.keys(r).length?r:null;
}

function sc(v){
  var d=new Date();d.setTime(d.getTime()+30*86400000);
  document.cookie=ck+'='+encodeURIComponent(JSON.stringify(v))+';expires='+d.toUTCString()+';path=/;SameSite=Lax';
}

function gc(){
  var m=document.cookie.match('(?:^|;)\\\\s*'+ck+'=([^;]*)');
  if(!m)return null;
  try{return JSON.parse(decodeURIComponent(m[1]))}catch(e){return null}
}

var utms=gp();
if(utms)sc(utms);
var u=utms||gc();
if(!u)return;

function im(h){
  try{var a=new URL(h);for(var i=0;i<ds.length;i++)if(a.hostname===ds[i]||a.hostname.endsWith('.'+ds[i]))return true}catch(e){}
  return false;
}

function dl(el){
  if(el.tagName!=='A'||!el.href||!im(el.href))return;
  try{
    var url=new URL(el.href);
    for(var k in u){if(u[k])url.searchParams.set(k,u[k])}
    if(u.utm_source&&!url.searchParams.has('src'))url.searchParams.set('src',u.utm_source);
    if(u.utm_campaign&&!url.searchParams.has('sck'))url.searchParams.set('sck',u.utm_campaign);
    el.href=url.toString();
  }catch(e){}
}

function run(){
  var links=document.querySelectorAll('a[href]');
  for(var i=0;i<links.length;i++)dl(links[i]);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);
else run();

if(typeof MutationObserver!=='undefined'){
  new MutationObserver(function(ms){
    for(var i=0;i<ms.length;i++){
      var ns=ms[i].addedNodes;
      for(var j=0;j<ns.length;j++){
        var n=ns[j];
        if(n.nodeType===1){
          if(n.tagName==='A')dl(n);
          else if(n.querySelectorAll){var as=n.querySelectorAll('a[href]');for(var k=0;k<as.length;k++)dl(as[k])}
        }
      }
    }
  }).observe(document.body,{childList:true,subtree:true});
}
})();`;

Deno.serve((req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  return new Response(script, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});
