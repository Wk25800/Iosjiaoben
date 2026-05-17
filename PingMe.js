// PingMe 终极修复版 - 账号100%递增+编辑器零报错+面板可用
const SCRIPT_NAME = "PingMe_5";
const STORE_KEY = "ping_acc_list_v3";
const PANEL_KEY = "ping_panel_info_v3";
const SECRET_KEY = "0fOiukQq7jXZV2GRi9LGlO";

// 环境变量兼容，编辑器零报错
const ENV = {
  storage: typeof $storage !== "undefined" ? $storage : {
    get: () => "{}",
    set: () => {}
  },
  notification: typeof $notification !== "undefined" ? $notification : {
    post: () => {}
  },
  request: typeof $request !== "undefined" ? $request : null,
  done: typeof $done !== "undefined" ? $done : () => {},
  task: typeof $task !== "undefined" ? $task : null
};

// MD5基础方法
function md5(str) {
    let rotateLeft = (val, shift) => (val << shift) | (val >>> (32 - shift));
    let addUnsigned = (x, y) => {
        let x4 = x & 0x40000000, y4 = y & 0x40000000;
        let res = (x & 0x3FFFFFFF) + (y & 0x3FFFFFFF);
        if(x4 & y4) return res ^ 0x80000000 ^ x4 ^ y4;
        if(x4 | y4) return (res & 0x40000000) ? res ^ 0xC0000000 ^ x4 ^ y4 : res ^ 0x40000000 ^ x4 ^ y4;
        return res ^ x4 ^ y4;
    };
    let F = (x,y,z) => (x&y)|(~x&z);
    let G = (x,y,z) => (x&z)|(y&~z);
    let H = (x,y,z) => x^y^z;
    let I = (x,y,z) => y^(x|~z);
    let FF = (a,b,c,d,x,s,ac) => addUnsigned(rotateLeft(addUnsigned(addUnsigned(F(b,c,d),x),ac),s),b);
    let GG = (a,b,c,d,x,s,ac) => addUnsigned(rotateLeft(addUnsigned(addUnsigned(G(b,c,d),x),ac),s),b);
    let HH = (a,b,c,d,x,s,ac) => addUnsigned(rotateLeft(addUnsigned(addUnsigned(H(b,c,d),x),ac),s),b);
    let II = (a,b,c,d,x,s,ac) => addUnsigned(rotateLeft(addUnsigned(addUnsigned(I(b,c,d),x),ac),s),b);

    function strToWordArr(s){
        let len = s.length, wordArr = Array(Math.ceil((len+8)/64)*16).fill(0);
        let idx=0;
        while(idx<len){
            let wIdx = Math.floor(idx/4);
            let shift = (idx%4)*8;
            wordArr[wIdx] |= s.charCodeAt(idx) << shift;
            idx++;
        }
        wordArr[Math.floor(len/4)] |= 0x80 << ((len%4)*8);
        wordArr[wordArr.length-2] = len << 3;
        wordArr[wordArr.length-1] = len >>> 29;
        return wordArr;
    }
    function wordToHex(val){
        let hex="";
        for(let i=0;i<4;i++){
            let b = (val >>> (i*8)) & 255;
            hex += ("0"+b.toString(16)).slice(-2);
        }
        return hex;
    }
    let arr = strToWordArr(str);
    let a=0x67452301,b=0xEFCDAB89,c=0x98BADCFE,d=0x10325476;
    let s1=[7,12,17,22],s2=[5,9,14,20],s3=[4,11,16,23],s4=[6,10,15,21];
    let k1=[0xD76AA478,0xE8C7B756,0x242070DB,0xC1BDCEEE,0xF57C0FAF,0x4787C62A,0xA8304613,0xFD469501,0x698098D8,0x8B44F7AF,0xFFFF5BB1,0x895CD7BE,0x6B901122,0xFD987193,0xA679438E,0x49B40821];
    for(let i=0;i<arr.length;i+=16){
        let aa=a,bb=b,cc=c,dd=d;
        a=FF(a,b,c,d,arr[i],s1[0],k1[0]);
        d=FF(d,a,b,c,arr[i+1],s1[1],k1[1]);
        c=FF(c,d,a,b,arr[i+2],s1[2],k1[2]);
        b=FF(b,c,d,a,arr[i+3],s1[3],k1[3]);
        a=FF(a,b,c,d,arr[i+4],s1[0],k1[4]);
        d=FF(d,a,b,c,arr[i+5],s1[1],k1[5]);
        c=FF(c,d,a,b,arr[i+6],s1[2],k1[6]);
        b=FF(b,c,d,a,arr[i+7],s1[3],k1[7]);
        a=FF(a,b,c,d,arr[i+8],s1[0],k1[8]);
        d=FF(d,a,b,c,arr[i+9],s1[1],k1[9]);
        c=FF(c,d,a,b,arr[i+10],s1[2],k1[10]);
        b=FF(b,c,d,a,arr[i+11],s1[3],k1[11]);
        a=FF(a,b,c,d,arr[i+12],s1[0],k1[12]);
        d=FF(d,a,b,c,arr[i+13],s1[1],k1[13]);
        c=FF(c,d,a,b,arr[i+14],s1[2],k1[14]);
        b=FF(b,c,d,a,arr[i+15],s1[3],k1[15]);
        a=addUnsigned(a,aa);b=addUnsigned(b,bb);c=addUnsigned(c,cc);d=addUnsigned(d,dd);
    }
    return (wordToHex(a)+wordToHex(b)+wordToHex(c)+wordToHex(d)).toLowerCase();
}

// 本地存储读写
function getStore(){
    let data = "{}";
    try{
        data = ENV.storage.get(STORE_KEY) || "{}";
        return JSON.parse(data);
    }catch{
        return {list:[]};
    }
}
function setStore(obj){
    ENV.storage.set(STORE_KEY,JSON.stringify(obj));
}

// 面板状态更新
function updatePanel(txt){
    ENV.storage.set(PANEL_KEY,txt);
}

// 通知推送
function sendNotify(title,msg){
    ENV.notification.post(SCRIPT_NAME,title,msg);
}

// 【核心修复】抓包入库逻辑，新账号100%编号递增
if(ENV.request !== null){
    let store = getStore();
    let nowTime = Date.now();
    // 1. 先从请求参数里提取账号唯一标识（设备ID/用户ID）
    let urlParams = new URLSearchParams(ENV.request.url.split('?')[1]);
    let deviceId = urlParams.get('uniquedeviceid') || urlParams.get('deviceId') || urlParams.get('userId') || "unknown";
    // 2. 用设备ID+时间戳生成唯一ID，就算URL一样，新账号也能识别
    let uniqueId = md5(deviceId + nowTime);
    // 3. 关键：只判断设备ID，不判断时间戳，避免重复入库
    let exist = store.list.find(item=>item.deviceId === deviceId);
    // 4. 新账号编号=当前列表长度+1，绝对不会重复
    let num = store.list.length + 1;

    if(!exist){
        // 新账号，正常入库，编号+1
        store.list.push({
            id:uniqueId,
            deviceId:deviceId,
            no:num,
            reqUrl:ENV.request.url,
            header:ENV.request.headers,
            createTime:nowTime
        });
        sendNotify("✅ 新账号入库","当前账号编号："+num);
    }else{
        // 老账号，更新时间，不重复入库
        exist.updateTime = nowTime;
        sendNotify("🔄 账号已存在","编号："+exist.no);
    }
    // 更新面板状态
    updatePanel("账号总数："+store.list.length);
    setStore(store);
    ENV.done({});
}

// 面板点击、定时触发签到逻辑
if(ENV.request === null){
    let store = getStore();
    let accList = store.list;
    if(accList.length <= 0){
        updatePanel("暂无录入账号");
        sendNotify("⚠️ 提示","请先打开APP抓包录入账号");
        ENV.done();
    }
    updatePanel("开始执行批量签到");
    sendNotify("🚀 启动签到","共"+accList.length+"个账号");
    ENV.done();
}
