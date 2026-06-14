/* PingMe Reset - clear all stored accounts
   Add to Surge config [Script] section:
   PingMeReset = type=generic,timeout=10,script-path=<your url>/PingMe_Reset.js
   Then run it once from Surge Scripts panel to wipe all stored accounts.
   After running, remove this script entry (or just don't run it again).
*/

var storeKey = 'pingme_accounts_v1';

var before = $persistentStore.read(storeKey);
var beforeCount = 0;
if (before) {
  try {
    var obj = JSON.parse(before);
    beforeCount = Object.keys(obj.accounts || {}).length;
  } catch (e) {}
}

var empty = { version: 1, accounts: {}, order: [] };
$persistentStore.write(JSON.stringify(empty), storeKey);

var after = $persistentStore.read(storeKey);

var summary = 'Cleared. Previous account count: ' + beforeCount + '\nNow stored: ' + after;

console.log(summary);
$notification.post('PingMe Reset', 'Accounts cleared', summary);
$done();
