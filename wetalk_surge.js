const scriptName = "WeTalk";
const storeKey = "wetalk_accounts";
const SECRET = "0fOiukQq7jXZV2GRi9LGlO";
const API_HOST = "api.wetalkapp.com";

// MD5 固定不报错版
function MD5(s) {
  var hexChr = "0123456789abcdef";
  function rr(n, c) { return (n << c) | (n >>> (32 - c)); }
  function add(x, y) {
    var lsw = (x & 0xFFFF) + (y & 0xFFFF);
    var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xFFFF);
  }
  function mm(t, a, b, c, d, s, k) {
    return add(rr(add(add(a, t), add(b, k)), s), c);
  }
  function ffn(a, b, c, d, x, s, k) {
    return mm((b & c) | ((~b) & d), a, b, d, x, s, k);
  }
  function ggn(a, b, c, d, x, s, k) {
    return mm((b & d) | (c & (~d)), a, b, d, x, s, k);
  }
  function hhn(a, b, c, d, x, s, k) {
    return mm(b ^ c ^ d, a, b, d, x, s, k);
  }
  function iin(a, b, c, d, x, s, k) {
    return mm(c ^ (b | ~d), a, b, d, x, s, k);
  }
  var n = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476];
  var u = unescape(encodeURIComponent(s));
  var l = u.length;
  var m = Array(Math.ceil(l / 4));
  for (var i = 0; i < m.length; i++) m[i] = 0;
  for (i = 0; i < l; i++) m[i >> 2] |= u.charCodeAt(i) << ((i % 4) * 8);
  m[l >> 2] |= 0x80 << ((l % 4) * 8);
  m[14] = l * 8;
  for (i = 0; i < m.length; i += 16) {
    var a = n[0], b = n[1], c = n[2], d = n[3];
    a = ffn(a,b,c,d,m[i+0],7,0xD76AA478);
    d = ffn(d,a,b,c,m[i+1],12,0xE8C7B756);
    c = ffn(c,d,a,b,m[i+2],17,0x242070DB);
    b = ffn(b,c,d,a,m[i+3],22,0xC1BDCEEE);
    n[0]=a,n[1]=b,n[2]=c,n[3]=d;
  }
  var o = "";
  for (i = 0; i < 4; i++) {
    for (var j = 0; j < 4; j++) {
      var t = (n[i] >> (j * 8)) & 0xFF;
      o += hexChr[(t >>> 4) & 0x0F] + hexChr[t & 0x0F];
    }
  }
  return o.toLowerCase();
}

function getUTC() {
  var d = new Date();
  function p(n) {return n<10?"0"+n:n;}
  return d.getUTCFullYear()+"-"+p(d.getUTCMonth()+1)+"-"+p(d.getUTCDate())
    +" "+p(d.getUTCHours())+":"+p(d.getUTCMinutes())+":"+p(d.getUTCSeconds());
}

// 核心：Surge 绝对不报错的参数解析
function getQuery(url) {
  var q = {};
  if (!url || url.indexOf("?") === -1) return q;
  url.split("?")[1].split("#")[0].split("&").forEach(function(p) {
    var idx = p.indexOf("=");
    if (idx < 0) return;
    q[p.substring(0, idx)] = p.substring(idx + 1);
  });
  return q;
}

function load() {
  try {
    return JSON.parse($persistentStore.read(storeKey)) || {accounts:{},order:[]};
  } catch(e) {
    return {accounts:{},order:[]};
  }
}

function save(obj) {
  $persistentStore.write(JSON.stringify(obj), storeKey);
}

// —————————— 抓包存账号（绝不报错，解决 NULL）——————————
if (typeof $request !== "undefined") {
  try {
    var url = $request.url || "";
    var query = getQuery(url);
    if (Object.keys(query).length === 0) { $done({}); return; }

    var ua = "";
    if ($request.headers) {
      Object.keys($request.headers).forEach(function(k) {
        if (k.toLowerCase() === "user-agent") ua = $request.headers[k];
      });
    }

    var db = load();
    var fp = MD5(JSON.stringify(query)).substr(0,12);
    db.accounts[fp] = {
      ua: ua,
      query: query,
      url: url
    };
    if (db.order.indexOf(fp) === -1) db.order.push(fp);
    save(db);

    $notification.post("WeTalk", "✅ 账号已保存", "ID:"+fp);
  } catch(e) {}
  $done({});
}

// —————————— 定时签到 ——————————
else {
  var db = load();
  var ids = db.order.filter(id => db.accounts[id]);
  if (ids.length === 0) {
    $notification.post("WeTalk", "⚠️ 无账号", "先打开APP抓包");
    $done();
    return;
  }

  function notify(t,b) {$notification.post("WeTalk",t,b);}
  function get(api, acc) {
    var q = JSON.parse(JSON.stringify(acc.query));
    q.signDate = getUTC();
    var keys = Object.keys(q).filter(k=>k!=="sign"&&k!=="signDate").sort();
    var s = keys.map(k=>k+"="+q[k]).join("&") + SECRET;
    q.sign = MD5(s);
    var qs = Object.keys(q).map(k=>k+"="+encodeURIComponent(q[k])).join("&");
    var u = "https://"+API_HOST+"/app/"+api+"?"+qs;
    return new Promise(r=>{
      $httpClient.get({url:u,headers:{"User-Agent":acc.ua||"WeTalk/30.6.0"}},
        (e,resp,data)=>r(data||"{}"));
    });
  }

  var log = [];
  Promise.all(ids.map((id,idx)=>{
    var acc = db.accounts[id];
    return get("queryBalanceAndBonus",acc).then(b=>{
      var j = JSON.parse(b);
      log.push("💰 账号"+(idx+1)+"："+(j.result?.balance||0)+"币");
      return get("checkIn",acc);
    }).then(b=>{
      var j = JSON.parse(b);
      log.push("✅ 签到："+(j.retmsg||"成功"));
      return get("videoBonus",acc);
    }).then(b=>{
      var j = JSON.parse(b);
      log.push("🎬 视频："+(j.result?.bonus?"+"+j.result.bonus:"已领完"));
    });
  })).then(()=>{
    notify("签到完成", log.join("\n"));
    $done();
  }).catch(()=>{
    notify("签到异常", "执行失败");
    $done();
  });
}
