const fs = require('fs');
const path = require('path');

module.exports = async function handler(req, res) {
  try {
    const filePath = path.join(process.cwd(), 'activities.html');
    let html = fs.readFileSync(filePath, 'utf8');

    const targetId = (req.query.id || req.query.activity || req.query.post || '').toString().trim();
    if (!targetId) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(html);
    }

    // Default fallback news items
    let items = [
      {
        id: 'news-1',
        title: 'พิธีแต่งตั้งและมอบปลอกแขนสารวัตรนักเรียน ประจำปีการศึกษา 2569',
        tag: 'พิธีการสำคัญ',
        date: '23 พ.ค. 2569',
        image: 'https://www.sarawatdc.site/assets/images/activities-cover.jpg',
        desc: 'ผู้อำนวยการโรงเรียนเดชะปัตตนยานุกูล ให้เกียรติเป็นประธานในพิธีมอบปลอกแขนและเข็มเกียรติยศแก่คณะสารวัตรนักเรียน เพื่อเริ่มต้นการปฏิบัติหน้าที่อย่างเป็นทางการ'
      },
      {
        id: 'news-2',
        title: 'โครงการรณรงค์วินัยจราจรและเสริมสร้างความปลอดภัยหน้าโรงเรียน',
        tag: 'ความปลอดภัย',
        date: '12 มิ.ย. 2569',
        image: 'https://www.sarawatdc.site/assets/images/what-we-do-1.jpg',
        desc: 'สารวัตรนักเรียนร่วมมือกับงานจราจร ดูแลความสะดวกและระเบียบการข้ามถนนของนักเรียนทุกระดับชั้นในช่วงเช้าและหลังเลิกเรียนอย่างเคร่งครัด'
      },
      {
        id: 'news-3',
        title: 'กิจกรรมจิตอาสาพัฒนาสิ่งแวดล้อมและพื้นที่ส่วนรวมโรงเรียน',
        tag: 'จิตอาสา',
        date: '08 ก.ค. 2569',
        image: 'https://www.sarawatdc.site/assets/images/what-we-do-2.jpg',
        desc: 'รวมพลังสารวัตรนักเรียนและตัวแทนห้องเรียน ร่วมบำเพ็ญประโยชน์ ปรับภูมิทัศน์และดูแลความสะอาดบริเวณลานกิจกรรมและอาคารเรียน'
      }
    ];

    // Try fetching live news list from backend API with 3s timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const apiRes = await fetch('https://prototype-sampling-fees-buy.trycloudflare.com/api/news', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (apiRes.ok) {
        const liveItems = await apiRes.json();
        if (Array.isArray(liveItems) && liveItems.length > 0) {
          items = [...liveItems, ...items];
        }
      }
    } catch (e) {
      // Ignore network errors, use fallback items
    }

    const cleanId = targetId.toLowerCase();
    const found = items.find(it =>
      String(it.id).toLowerCase() === cleanId ||
      String(it.id).toLowerCase() === 'news-' + cleanId ||
      (it.title && it.title.trim().toLowerCase() === cleanId) ||
      (it.title && it.title.toLowerCase().includes(cleanId))
    );

    if (found) {
      let resolvedImage = found.image || 'https://www.sarawatdc.site/assets/images/activities-cover.jpg';
      if (resolvedImage.includes('discordapp.com') || resolvedImage.includes('discord.com')) {
        resolvedImage = 'https://www.sarawatdc.site/assets/images/activities-cover.jpg';
      }
      if (resolvedImage.startsWith('/')) {
        resolvedImage = 'https://www.sarawatdc.site' + resolvedImage;
      } else if (!resolvedImage.startsWith('http://') && !resolvedImage.startsWith('https://')) {
        resolvedImage = 'https://www.sarawatdc.site/' + resolvedImage;
      }

      const fullTitle = `${found.title} | สารวัตรนักเรียน โรงเรียนเดชะปัตตนยานุกูล`;
      const desc = found.desc || found.detail || 'ติดตามข่าวประชาสัมพันธ์ ประกาศ และประมวลภาพกิจกรรมของสารวัตรนักเรียน โรงเรียนเดชะปัตตนยานุกูล';

      // Replace head tags
      html = html.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(fullTitle)}</title>`);
      html = html.replace(/(<meta\s+property=["']og:title["']\s+content=["']).*?(["'])/i, `$1${escapeHtml(fullTitle)}$2`);
      html = html.replace(/(<meta\s+property=["']og:description["']\s+content=["']).*?(["'])/i, `$1${escapeHtml(desc)}$2`);
      html = html.replace(/(<meta\s+property=["']og:image["']\s+content=["']).*?(["'])/i, `$1${resolvedImage}$2`);
      html = html.replace(/(<meta\s+name=["']twitter:title["']\s+content=["']).*?(["'])/i, `$1${escapeHtml(fullTitle)}$2`);
      html = html.replace(/(<meta\s+name=["']twitter:description["']\s+content=["']).*?(["'])/i, `$1${escapeHtml(desc)}$2`);
      html = html.replace(/(<meta\s+name=["']twitter:image["']\s+content=["']).*?(["'])/i, `$1${resolvedImage}$2`);

      // In Header DOM
      html = html.replace(/(<h1[^>]*id=["']actMainTitle["'][^>]*>)([\s\S]*?)(<\/h1>)/i, `$1${escapeHtml(found.title)}$3`);
      html = html.replace(/(<p[^>]*id=["']actSubtitle["'][^>]*>)([\s\S]*?)(<\/p>)/i, `$1${escapeHtml(desc)}$3`);
      html = html.replace(/(<span[^>]*id=["']actBreadcrumbCurrent["'][^>]*>)([\s\S]*?)(<\/span>)/i, `$1${escapeHtml(found.title)}$3`);
      html = html.replace(/(<span[^>]*id=["']actSectionTag["'][^>]*>)([\s\S]*?)(<\/span>)/i, `$1ACTIVITIES • ${escapeHtml(found.tag || 'ข่าวสารและกิจกรรม')}$3`);

      // In Banner Hero
      html = html.replace(/id=["']actHeaderBannerWrap["']\s+style=["']display:\s*none;/i, 'id="actHeaderBannerWrap" style="display: block;');
      html = html.replace(/id=["']actHeaderBannerImg["']\s+src=["'][^"']*["']/i, `id="actHeaderBannerImg" src="${resolvedImage}"`);
      html = html.replace(/(<h2[^>]*id=["']actBannerHeading["'][^>]*>)([\s\S]*?)(<\/h2>)/i, `$1${escapeHtml(found.title)}$3`);
      html = html.replace(/(<p[^>]*id=["']actBannerDesc["'][^>]*>)([\s\S]*?)(<\/p>)/i, `$1${escapeHtml(desc)}$3`);
      if (found.date) {
        html = html.replace(/(<span[^>]*id=["']actBannerDateText["'][^>]*>)([\s\S]*?)(<\/span>)/i, `$1${escapeHtml(found.date)}$3`);
      }
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  } catch (err) {
    console.error('Error in api/activities handler:', err);
    try {
      const fallbackHtml = fs.readFileSync(path.join(process.cwd(), 'activities.html'), 'utf8');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(fallbackHtml);
    } catch (e2) {
      return res.status(500).send('Server Error');
    }
  }
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
