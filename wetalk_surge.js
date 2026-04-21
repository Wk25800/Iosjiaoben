try {
  if (typeof $request !== "undefined") {
    let req_url = $request.url;
    let req_headers = $request.headers;

    // 只匹配这个接口，和 PingMe 写法完全一样
    if (req_url.includes("/app/queryBalanceAndBonus")) {
      console.log('WeTalk 开始获取参数');
      
      const capture = {
        url: req_url,
        paramsRaw: parseRawQuery(req_url),
        headers: normalizeHeaderNameMap(req_headers || {})
      };

      // 存到 Surge 持久化存储
      $persistentStore.write(JSON.stringify(capture), 'wetalk_capture_v3');
      
      // 和 PingMe 一样弹通知
      $notification.post("WeTalk 获取成功✅", "参数已保存", "");
      console.log('WeTalk 链接：' + req_url);
    }
  }
} catch (e) {
  console.log('错误：' + e.message);
  $notification.post("WeTalk 获取失败❗️", "", "");
}

$done();

// ========== 下面这两个是 PingMe 原版工具函数，一字不改 ==========
function normalizeHeaderNameMap(headers) {
  const out = {};
  Object.keys(headers || {}).forEach(k => out[k] = headers[k]);
  return out;
}

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
