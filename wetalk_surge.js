const scriptName="WeTalk";
const storeKey="wetalk_accounts_v1";
const SECRET="0fOiukQq7jXZV2GRi9LGlO";
const API_HOST="api.wetalkapp.com";
const MAX_VIDEO=5;
const VIDEO_DELAY=8000;
const ACCOUNT_GAP=3500;

function readStore(){
const raw=$persistentStore.read(storeKey);
if(!raw)return{accounts:{},order:[]};
try{return JSON.parse(raw)}catch(e){return{accounts:{},order:[]}}
}
function saveStore(obj){
$persistentStore.write(JSON.stringify(obj),storeKey)
}
function notify(a,b,c){
$notification.post(a,b,c)
}
function parseQuery(url){
const q=(url.split("?")[1]||"").split("#")[0];
const o={};
q.split("&").forEach(i=>{
const p=i.indexOf("=");
if(p>-1)o[i.slice(0,p)]=i.slice(p+1)
});
return o
}
function fp(params){
return Object.keys(params).filter(k=>k!="sign"&&k!="signDate").sort().map(k=>k+"="+params[k]).join("&")
}
function utc(){
const d=new Date();
const p=n=>String(n).padStart(2,"0");
return `${d.getUTCFullYear()}-${p(d.getUTCMonth()+1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`
}
function md5(s){return s}
function buildUrl(path,acc){
const p=Object.assign({},acc.params);
delete p.sign;
p.signDate=utc();
const base=Object.keys(p).sort().map(k=>k+"="+p[k]).join("&");
p.sign=md5(base+SECRET);
const qs=Object.keys(p).map(k=>k+"="+encodeURIComponent(p[k])).join("&");
return `https://${API_HOST}/app/${path}?${qs}`
}
function req(url,headers){
return new Promise((res,rej)=>{
$httpClient.get({url:url,headers:headers},(e,r,d)=>{
if(e)rej(e);else res(d)
})
})
}
async function run(acc,i,t){
const msg=[`账号${i+1}/${t}`];
try{
let b=await req(buildUrl("queryBalanceAndBonus",acc),acc.headers);
let j=JSON.parse(b);
msg.push("余额:"+((j.result||{}).balance||"?"));

b=await req(buildUrl("checkIn",acc),acc.headers);
j=JSON.parse(b);
msg.push("签到:"+(j.retmsg||"成功"));

for(let x=1;x<=MAX_VIDEO;x++){
await new Promise(r=>setTimeout(r,x==1?1500:VIDEO_DELAY));
b=await req(buildUrl("videoBonus",acc),acc.headers);
j=JSON.parse(b);
msg.push("视频"+x+":"+(j.retmsg||"完成"))
}

b=await req(buildUrl("queryBalanceAndBonus",acc),acc.headers);
j=JSON.parse(b);
msg.push("最新余额:"+((j.result||{}).balance||"?"))
}catch(e){
msg.push("异常:"+e)
}
return msg.join("\n")
}

if(typeof $request!="undefined"){
const params=parseQuery($request.url);
const id=fp(params);
const store=readStore();
const ex=!!store.accounts[id];
store.accounts[id]={
alias:ex?store.accounts[id].alias:"账号"+(store.order.length+1),
params:params,
headers:$request.headers
};
if(!ex)store.order.push(id);
saveStore(store);
notify(scriptName,ex?"账号更新成功":"新账号保存成功",store.accounts[id].alias);
$done({});
}else{
const store=readStore();
const ids=store.order||[];
if(!ids.length){
notify(scriptName,"无账号","先打开APP抓一次");
$done();
}else{
(async()=>{
let out=[];
for(let i=0;i<ids.length;i++){
out.push(await run(store.accounts[ids[i]],i,ids.length));
if(i<ids.length-1)await new Promise(r=>setTimeout(r,ACCOUNT_GAP))
}
notify(scriptName,"执行完成",out.join("\n------\n"));
$done();
})()
}
}
