const $ = new API("WeTalk", false);

try {
  if (typeof $request !== "undefined") {
    const req_url = $request.url;
    const req_headers = $request.headers;

    if (req_url.includes("/app/queryBalanceAndBonus")) {
      console.log('WeTalk 开始');
      const capture = {
        url: req_url,
        paramsRaw: parseRawQuery(req_url),
        headers: normalizeHeaderNameMap(req_headers || {})
      };
      $.write(JSON.stringify(capture), '#wetalk_capture_v3');
      $.notify('WeTalk 获取成功✅', '已保存签到参数', '');
      console.log('WeTalk 获取到的内容：' + req_url);
    }
  }
} catch (e) {
  console.log('错误：' + e.message);
  $.notify('获取参数失败❗️', e.message, '');
}
$.done();

// 解析 URL 参数
function parseRawQuery(url) {
  const query = (url.split('?')[1] || '').split('#')[0];
  const rawMap = {};
  query.split('&').forEach(pair => {
    if (!pair) return;
    const idx = pair.indexOf('=');
    if (idx < 0) return;
    const k = pair.slice(0, idx);
    const v = pair.slice(idx + 1);
    rawMap[k] = v;
  });
  return rawMap;
}

// 标准化 header
function normalizeHeaderNameMap(headers) {
  const out = {};
  Object.keys(headers || {}).forEach(k => out[k] = headers[k]);
  return out;
}

/*****************************************************************************
 * 下面这段是通用 ENV/API 框架，和 PingMe 完全一样，保证兼容
 *****************************************************************************/
function ENV() {
  const e = "undefined" != typeof $task,
        t = "undefined" != typeof $loon,
        s = "undefined" != typeof $httpClient && !t,
        i = "function" == typeof require && "undefined" != typeof $jsbox;
  return {
    isQX: e,
    isLoon: t,
    isSurge: s,
    isNode: "function" == typeof require && !i,
    isJSBox: i,
    isRequest: "undefined" != typeof $request,
    isScriptable: "undefined" != typeof importModule
  };
}

function HTTP(e = { baseURL: "" }) {
  const t = ENV();
  const r = /https?:\/\//;
  const o = {};
  ["GET", "POST"].forEach(n => o[n.toLowerCase()] = s => {
    let l = typeof s == "string" ? { url: s } : { ...s };
    if (e.baseURL && !r.test(l.url)) l.url = e.baseURL + l.url;
    return new Promise((c, a) => {
      if (t.isQX) {
        $task.fetch({ method: n, ...l }).then(c).catch(a);
      } else if (t.isLoon || t.isSurge || t.isNode) {
        (t.isNode ? require("request") : $httpClient)[n.toLowerCase()](l, (f, h, d) => {
          f ? a(f) : c({ status: h.status, headers: h.headers, body: d });
        });
      }
    });
  });
  return o;
}

function API(t, s = false) {
  const i = ENV();
  return new class {
    constructor(t, s) {
      this.name = t;
      this.debug = s;
      this.http = HTTP();
      this.cache = {};
      try { this.cache = JSON.parse($persistentStore.read(this.name) || "{}"); } catch {}
    }
    write(e, t) {
      try {
        if (t.startsWith("#")) {
          $persistentStore.write(e, t.substring(1));
        } else {
          this.cache[t] = e;
          $persistentStore.write(JSON.stringify(this.cache), this.name);
        }
      } catch {}
    }
    read(t) {
      try {
        if (t.startsWith("#")) return $persistentStore.read(t.substring(1));
        return this.cache[t];
      } catch { return null }
    }
    notify(e, t="", s="") {
      $notification.post(e, t, s);
    }
    done(e={}) { $.done() }
  }(t, s);
}
