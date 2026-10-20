const fs = require('fs');
const path = require('path');

module.exports = async function handler(req, res) {
  try {
    let filePath = path.join(process.cwd(), 'admissions.html');
    if (!fs.existsSync(filePath)) {
      filePath = path.join(process.cwd(), 'admission.html');
    }
    let html = fs.readFileSync(filePath, 'utf8');
    html = html.replace(/https:\/\/www\.sarawatdc\.site\/assets\/images\/recruit-cover\.jpg/g, 'https://admission.sarawatdc.site/assets/images/recruit-cover.jpg');
    html = html.replace(/https:\/\/www\.sarawatdc\.site\/assets\/icons\/sarawat-logo\.png/g, 'https://admission.sarawatdc.site/assets/icons/sarawat-logo.png');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    return res.status(200).send(html);
  } catch (err) {
    console.error('Error in api/admissions handler:', err);
    return res.status(500).send('Internal Server Error');
  }
};
