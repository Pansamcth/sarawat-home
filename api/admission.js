const fs = require('fs');
const path = require('path');

module.exports = async function handler(req, res) {
  try {
    let filePath = path.join(process.cwd(), 'admission.html');
    if (!fs.existsSync(filePath)) {
      filePath = path.join(process.cwd(), 'admissions.html');
    }
    const html = fs.readFileSync(filePath, 'utf8');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    return res.status(200).send(html);
  } catch (err) {
    console.error('Error in api/admission handler:', err);
    return res.status(500).send('Internal Server Error');
  }
};
