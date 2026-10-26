module.exports = async function handler(req, res) {
  const fallbackUrl = 'https://www.sarawatdc.site/assets/images/activities-cover.jpg';
  try {
    const targetId = (req.query.id || req.query.activity || req.query.post || '').toString().trim();
    if (!targetId) {
      return res.redirect(302, fallbackUrl);
    }

    // Default fallback news items
    let items = [
      {
        id: 'news-1',
        image: 'https://www.sarawatdc.site/assets/images/activities-cover.jpg'
      },
      {
        id: 'news-2',
        image: 'https://www.sarawatdc.site/assets/images/what-we-do-1.jpg'
      },
      {
        id: 'news-3',
        image: 'https://www.sarawatdc.site/assets/images/what-we-do-2.jpg'
      }
    ];

    // Try fetching live news list from backend API
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const apiRes = await fetch('https://api.sarawatdc.site/api/news', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (apiRes.ok) {
        const liveItems = await apiRes.json();
        if (Array.isArray(liveItems) && liveItems.length > 0) {
          items = liveItems;
        }
      }
    } catch (e) {
      // Ignore network errors, fallback to default items
    }

    function findItem(list, tId) {
      if (!list || !Array.isArray(list) || !tId) return null;
      const cId = String(tId).trim().toLowerCase();
      const noPre = cId.replace(/^news[-_]/, '');
      let f = list.find(it => {
        if (!it) return false;
        const itId = String(it.id != null ? it.id : '').trim().toLowerCase();
        const itLegacy = String(it.legacyId || it.legacy_id || '').trim().toLowerCase();
        return (
          itId === cId ||
          itId === noPre ||
          itId.replace(/^news[-_]/, '') === noPre ||
          (itLegacy && (itLegacy === cId || itLegacy === noPre))
        );
      });
      if (f) return f;
      f = list.find(it => it && it.title && it.title.trim().toLowerCase() === cId);
      if (f) return f;
      if (cId.length >= 3 && !/^\d+$/.test(cId)) {
        f = list.find(it => it && it.title && it.title.toLowerCase().includes(cId));
        if (f) return f;
      }
      return null;
    }

    const found = findItem(items, targetId);

    if (!found) {
      return res.redirect(302, fallbackUrl);
    }

    const rawImg = found.image || found.img;
    if (!rawImg || typeof rawImg !== 'string') {
      return res.redirect(302, fallbackUrl);
    }

    // Handle Discord CDN dead links
    if (rawImg.includes('discordapp.com') || rawImg.includes('discord.com')) {
      return res.redirect(302, fallbackUrl);
    }

    // Handle Base64 Data URL: decode buffer and return image binary
    if (rawImg.startsWith('data:')) {
      const match = rawImg.match(/^data:([^;]+);base64,(.+)$/s);
      if (match) {
        const contentType = match[1] || 'image/jpeg';
        const base64Data = match[2];
        const buffer = Buffer.from(base64Data, 'base64');
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800');
        return res.status(200).send(buffer);
      }
    }

    // Handle Relative or Absolute URL
    let redirectUrl = rawImg;
    if (redirectUrl.startsWith('/')) {
      redirectUrl = 'https://www.sarawatdc.site' + redirectUrl;
    } else if (!redirectUrl.startsWith('http://') && !redirectUrl.startsWith('https://')) {
      redirectUrl = 'https://www.sarawatdc.site/' + redirectUrl;
    }

    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    return res.redirect(302, redirectUrl);
  } catch (err) {
    console.error('Activity image handler error:', err);
    return res.redirect(302, fallbackUrl);
  }
};
