const fs = require('fs');
const path = require('path');

const DEFAULT_TITLE = 'ระบบลงหน้าที่สารวัตรนักเรียน (SI-ROSTER) | สารวัตรนักเรียน โรงเรียนเดชะปัตตนยานุกูล (Truant Patrol)';
const DEFAULT_DESC = 'SI-ROSTER ระบบบริหารจัดการและลงหน้าที่สารวัตรนักเรียน โรงเรียนเดชะปัตตนยานุกูล สำหรับจัดการตารางปฏิบัติหน้าที่ มอบหมายงาน และตรวจสอบข้อมูลการลงหน้าที่ของสมาชิก ช่วยให้การจัดเวร การประสานงาน และการบริหารกำลังพลเป็นระบบ สะดวก และมีประสิทธิภาพยิ่งขึ้น';
const DEFAULT_IMAGE = 'https://sarawatdc.site/assets/images/si-roster-cover.jpg';
const DEFAULT_CANONICAL = 'https://sarawatdc.site/si-roster';

function stripMarkdown(text) {
  if (!text) return '';
  return String(text)
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/`{1,3}(.*?)`{1,3}/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\r?\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = async function handler(req, res) {
  try {
    const filePath = path.join(process.cwd(), 'SI-ROSTER', 'index.html');
    let html = fs.readFileSync(filePath, 'utf8');

    const targetId = (req.query.id || req.query.activity || req.query.sheet || req.query.event || '').toString().trim();
    if (!targetId) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(html);
    }

    // Try fetching live activities from Cloudflare backend API with 3.5s timeout
    let activities = [];
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const apiRes = await fetch('https://prototype-sampling-fees-buy.trycloudflare.com/api/roster/getAllActivities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true'
        },
        body: JSON.stringify({ args: [] }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (apiRes.ok) {
        const data = await apiRes.json();
        if (Array.isArray(data)) activities = data;
        else if (data && Array.isArray(data.result)) activities = data.result;
        else if (data && Array.isArray(data.activities)) activities = data.activities;
      }
    } catch (e) {
      // Ignore network errors, fallback to matching or default
    }

    const cleanTarget = targetId.toLowerCase();
    const found = activities.find(a =>
      (a.id && String(a.id).trim().toLowerCase() === cleanTarget) ||
      (a.sheetName && String(a.sheetName).trim().toLowerCase() === cleanTarget) ||
      (a.title && String(a.title).trim().toLowerCase() === cleanTarget) ||
      (a.title && String(a.title).toLowerCase().includes(cleanTarget))
    );

    if (found) {
      const modalTitle = found.title || targetId;
      const fullTitle = `${modalTitle} | ระบบลงหน้าที่สารวัตรนักเรียน (SI-ROSTER)`;
      const modalDesc = stripMarkdown(found.description) || DEFAULT_DESC;
      const bannerImage = 'https://sarawatdc.site/assets/images/si-roster-cover.jpg';
      const canonicalUrl = `https://sarawatdc.site/si-roster?id=${encodeURIComponent(found.sheetName || found.id || targetId)}`;

      // Replace Title
      html = html.replace(/<title\b[^>]*>.*?<\/title>/i, `<title id="pageTitle">${escapeHtml(fullTitle)}</title>`);

      // Replace Meta Description
      html = html.replace(/(<meta\s+name=["']description["'][^>]*content=["']).*?(["'])/i, `$1${escapeHtml(modalDesc)}$2`);

      // Replace Open Graph Tags
      html = html.replace(/(<meta\s+property=["']og:title["'][^>]*content=["']).*?(["'])/i, `$1${escapeHtml(modalTitle)}$2`);
      html = html.replace(/(<meta\s+property=["']og:description["'][^>]*content=["']).*?(["'])/i, `$1${escapeHtml(modalDesc)}$2`);
      html = html.replace(/(<meta\s+property=["']og:image["'][^>]*content=["']).*?(["'])/i, `$1${bannerImage}$2`);
      html = html.replace(/(<meta\s+property=["']og:url["'][^>]*content=["']).*?(["'])/i, `$1${canonicalUrl}$2`);

      // Replace Twitter Tags
      html = html.replace(/(<meta\s+name=["']twitter:title["'][^>]*content=["']).*?(["'])/i, `$1${escapeHtml(modalTitle)}$2`);
      html = html.replace(/(<meta\s+name=["']twitter:description["'][^>]*content=["']).*?(["'])/i, `$1${escapeHtml(modalDesc)}$2`);
      html = html.replace(/(<meta\s+name=["']twitter:image["'][^>]*content=["']).*?(["'])/i, `$1${bannerImage}$2`);
      html = html.replace(/(<meta\s+name=["']twitter:url["'][^>]*content=["']).*?(["'])/i, `$1${canonicalUrl}$2`);

      // Replace Canonical
      html = html.replace(/(<link\s+rel=["']canonical["'][^>]*href=["']).*?(["'])/i, `$1${canonicalUrl}$2`);

      // Pre-render modal title and description in DOM
      html = html.replace(/(<h2[^>]*id=["']modalTitle["'][^>]*>)([\s\S]*?)(<\/h2>)/i, `$1${escapeHtml(modalTitle)}$3`);
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  } catch (err) {
    console.error('Error in api/si-roster handler:', err);
    try {
      const fallbackHtml = fs.readFileSync(path.join(process.cwd(), 'SI-ROSTER', 'index.html'), 'utf8');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(fallbackHtml);
    } catch (e2) {
      return res.status(500).send('Server Error');
    }
  }
};
