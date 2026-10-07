const fs = require('fs');
let t = fs.readFileSync('index.html', 'utf8');

// 1. Remove side nav
t = t.replace(/<!-- ============ FLOATING SIDE CHAPTER NAVIGATOR ============ -->[\s\S]*?<\/aside>\r?\n?/g, '');

// 2. Remove border and tighten padding for whatWeDo
t = t.replace(/padding-bottom: 80px; border-bottom: 1px solid var\(--dg-border\);/g, 'padding-bottom: 20px;');

// 3. Remove data-reveal from headers
// To be safe, we'll just globally remove data-reveal="fade" or "scale" or "up" etc. from ANY element that has "dg-section-header", "dg-what-content", "dg-news-header", "dg-faq-left", "dg-uptime-vision-layout".
// Actually, let's just globally remove data-reveal=".*?" from ALL tags inside the document? The user said "หัวข้อของแต่ละอัน" (headings of each section).
// Let's replace specifically on header-like divs.
const regex = /(<div[^>]*class="[^"]*(dg-section-header|dg-what-content|dg-news-header|dg-faq-left|dg-uptime-vision-layout)[^"]*"[^>]*)data-reveal="[^"]*"/g;
t = t.replace(regex, '$1');
t = t.replace(regex, '$1'); // run twice in case there are multiple? no, one per tag is enough.

// Remove data-delay if any
const delayRegex = /(<div[^>]*class="[^"]*(dg-section-header|dg-what-content|dg-news-header|dg-faq-left|dg-uptime-vision-layout)[^"]*"[^>]*)data-delay="[^"]*"/g;
t = t.replace(delayRegex, '$1');

fs.writeFileSync('index.html', t);
console.log('Done!');
