const url = $request.url;
if (!url.includes("/app/") && !url.includes("/getVirtualPhoneByAccount")) {
  $done({});
  return;
}

const headerStr = JSON.stringify($request.headers);
if (!headerStr) {
  $done({});
  return;
}

const key = "WeTalk_Accounts";
let accounts = [];

try {
  const old = $persistentStore.read(key);
  if (old) accounts = JSON.parse(old);
} catch (e) {}

const exist = accounts.some(item => item === headerStr);
if (!exist) {
  accounts.push(headerStr);
  $persistentStore.write(JSON.stringify(accounts), key);
  $notification.post("WeTalk", "✅ 已新增账号", `当前账号：${accounts.length} 个`);
}

$done({});
(async () => {
  const key = "WeTalk_Accounts";
  const accountsStr = $persistentStore.read(key);

  if (!accountsStr) {
    $notification.post("WeTalk", "❌ 未获取到账号", "请先打开APP");
    $done();
    return;
  }

  let accounts = [];
  try {
    accounts = JSON.parse(accountsStr);
  } catch (e) {
    $notification.post("WeTalk", "❌ 账号数据异常", "");
    $done();
    return;
  }

  let success = 0;
  let failed = 0;

  for (const item of accounts) {
    try {
      await $http.post({
        url: "https://api.wetalkapp.com/app/userSignIn",
        headers: JSON.parse(item),
        body: {}
      });
      success++;
    } catch (e) {
      failed++;
    }
  }

  $notification.post(
    "WeTalk 批量签到完成",
    `成功：${success} 个`,
    `失败：${failed} 个`
  );

  $done();
})();
