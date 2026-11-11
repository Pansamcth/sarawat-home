const fs = require('fs');
const path = require('path');

module.exports = async function handler(req, res) {
  try {
    const filePath = path.join(process.cwd(), 'dsd.html');
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('DSD page not found');
    }
    const html = fs.readFileSync(filePath, 'utf8');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    return res.status(200).send(html);
  } catch (err) {
    console.error('Error in api/dsd handler:', err);
    return res.status(500).send('Internal Server Error');
  }
};
