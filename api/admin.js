const fs = require('fs');
const path = require('path');
const dns = require('dns');

let mainSiteCache = { isOnline: false, checkedAt: 0 };
function isMainSiteOnline() {
  return new Promise((resolve) => {
    const now = Date.now();
    if (now - mainSiteCache.checkedAt < 10000) {
      return resolve(mainSiteCache.isOnline);
    }
    dns.lookup('www.sarawatdc.site', (err, addr) => {
      mainSiteCache.isOnline = !err && !!addr;
      mainSiteCache.checkedAt = now;
      resolve(mainSiteCache.isOnline);
    });
  });
}

module.exports = async function handler(req, res) {
  try {
    const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toLowerCase();
    
    // หากเข้าผ่านซับโดเมน admin.sarawatdc.site
    if (/^admin\./i.test(host)) {
      const online = await isMainSiteOnline();
      if (online) {
        let reqUrl = req.url || '/admin';
        if (!reqUrl.startsWith('/admin')) {
          reqUrl = '/admin' + (reqUrl === '/' ? '' : reqUrl);
        }
        res.setHeader('Location', 'https://www.sarawatdc.site' + reqUrl);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        return res.status(307).end();
      }
    }

    const filePath = path.join(process.cwd(), 'admin.html');
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Admin page not found');
    }
    const html = fs.readFileSync(filePath, 'utf8');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    return res.status(200).send(html);
  } catch (err) {
    console.error('Error in api/admin handler:', err);
    return res.status(500).send('Internal Server Error');
  }
};

