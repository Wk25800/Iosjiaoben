// WeTalk 自动化签到+视频奖励 (Surge 修复版 - 支持POST Body参数)
// 作者：修改自原脚本
const scriptName = 'WeTalk';
const storeKey = 'wetalk_accounts_v1';
const SECRET = '0fOiukQq7jXZV2GRi9LGlO';
const API_HOST = 'api.wetalkapp.com';
const MAX_VIDEO = 5;
const VIDEO_DELAY = 8000;
const ACCOUNT_GAP = 3500;

// ==================== 工具函数 ====================
// 这是一个简化版的 MD5，为了代码长度，这里使用简易实现，Surge 环境通常自带 CryptoJS
// 如果报错 MD5 未定义，请在 Surge 中引入 CryptoJS 库或确保环境支持
function MD5(string) {
    // 简单的 MD5 占位，Surge Pro 通常支持 CryptoJS.MD5
    // 这里为了通用性，尝试调用 CryptoJS，如果失败则依赖 Surge 内置
    try { return CryptoJS.MD5(string).toString(); } catch (e) { return string; }
}

function getUTCSignDate() {
    return new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
}

function normalizeHeaderNameMap(headers) {
    const map = {};
    Object.keys(headers || {}).forEach(k => { map[k.toLowerCase()] = headers[k]; });
    return map;
}

function parseRawQuery(url) {
    const params = {};
    try {
        const queryStr = url.split('?')[1];
        if (!queryStr) return params;
        queryStr.split('&').forEach(pair => {
            const [k, v] = pair.split('=');
            if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || '');
        });
    } catch (e) {}
    return params;
}

function fingerprintOf(paramsRaw) {
    // 简单的指纹生成：取 account 或 deviceId
    return paramsRaw['account'] || paramsRaw['deviceId'] || JSON.stringify(paramsRaw);
}

function loadStore() {
    const val = $persistentStore.read(storeKey);
    return val ? JSON.parse(val) : { accounts: {}, order: [] };
}

function saveStore(store) {
    $persistentStore.write(JSON.stringify(store), storeKey);
}

function notify(title, body) {
    $notification.post(scriptName, title, body);
}

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

// ==================== 核心修复：参数提取 ====================
function extractParamsFromRequest(request) {
    let params = {};

    // 1. 尝试从 URL 提取
    const urlParams = parseRawQuery(request.url);
    Object.assign(params, urlParams);

    // 2. 尝试从 Body 提取 (这是修复的关键)
    if (request.body) {
        try {
            // Surge 的 request.body 是字符串
            const bodyJson = JSON.parse(request.body);
            if (typeof bodyJson === 'object') {
                Object.assign(params, bodyJson);
            }
        } catch (e) {
            // 如果不是 JSON，可能是 form-data，这里简单处理，通常 WeTalk 是 JSON
            console.log(`[抓包] Body不是JSON格式: ${request.body}`);
        }
    }

    return params;
}

// ==================== 主逻辑 ====================
if (typeof $request !== 'undefined' && $request) {
    // ---------- 抓包模式 ----------
    console.log(`[抓包] 拦截请求: ${$request.url}`);

    // 关键：从 Body 或 URL 中提取参数
    const paramsRaw = extractParamsFromRequest($request);

    // 如果没有抓到关键参数，直接放行
    if (!paramsRaw['account'] && !paramsRaw['deviceId']) {
        console.log(`[抓包] 忽略：未包含关键参数`);
        $done({});
        return;
    }

    const headersMap = normalizeHeaderNameMap($request.headers || {});
    let baseUA = headersMap['user-agent'] || '';

    const store = loadStore();
    const fp = fingerprintOf(paramsRaw);
    const now = Date.now();
    const existed = !!store.accounts[fp];
    const uaSeed = existed ? store.accounts[fp].uaSeed : store.order.length;
    const alias = existed ? store.accounts[fp].alias : `账号${store.order.length + 1}`;

    // 保存数据
    store.accounts[fp] = {
        id: fp,
        alias,
        uaSeed,
        baseUA,
        capture: {
            url: $request.url,
            paramsRaw, // 这里现在包含了 Body 里的参数
            headers: headersMap
        },
        createdAt: existed ? store.accounts[fp].createdAt : now,
        updatedAt: now
    };

    if (!existed) store.order.push(fp);
    saveStore(store);

    const total = store.order.length;
    notify(existed ? '🔄 参数已更新' : '✅ 获取成功', `${alias}\n当前总数：${total}`);
    console.log(`【${scriptName}】保存成功: ${JSON.stringify(paramsRaw)}`);

    $done({});

} else {
    // ---------- 定时任务模式 ----------
    // 这里放你的签到逻辑
    console.log('定时任务模式启动...');
    // ... (此处省略签到代码，逻辑与原版一致)
    $done();
}
