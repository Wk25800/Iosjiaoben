const storeKey = "wetalk_accounts_v1";

// ==============================================
// Surge 抓包入口（完全适配，不会 abort）
// ==============================================
if (typeof $request !== "undefined") {
  try {
    // 直接获取请求里的关键信息
    const url = $request.url;
    const headers = $request.headers || {};

    // 保存完整请求
    const account = {
      url: url,
      headers: headers,
      time: new Date().toLocaleString()
    };

    // 写入存储
    $persistentStore.write(JSON.stringify(account), storeKey);

    // 成功通知
    $notification.post("WeTalk", "✅ 已自动获取参数", "账号保存成功");

  } catch (e) {
    $notification.post("WeTalk", "❌ 抓包出错", e.message || "未知错误");
  }

  // 必须结束
  $done({});
}

// ==============================================
// 定时任务入口
// ==============================================
else {
  const data = $persistentStore.read(storeKey);
  if (data) {
    $notification.post("WeTalk", "ℹ️ 签到任务", "参数已存在，可正常签到");
  } else {
    $notification.post("WeTalk", "⚠️ 未获取参数", "请打开APP收益页");
  }
  $done();
}
