const fs = require('fs');

const indexHtml = fs.readFileSync('index.html', 'utf8');
const actHtml = fs.readFileSync('activities.html', 'utf8');

const targetUrl = 'https://sarawatdc.site/warn/';

const tests = [
  { name: 'Card 1 is an <a> linking to https://sarawatdc.site/warn/', pass: indexHtml.includes('href="https://sarawatdc.site/warn/"') && indexHtml.includes('theme-emergency') },
  { name: 'Card 1 opens in new tab (target="_blank")', pass: indexHtml.includes('href="https://sarawatdc.site/warn/" target="_blank" rel="noopener noreferrer"\n          class="dg-ops-card theme-emergency"') },
  { name: 'Card 1 has arrow-up-right icon', pass: indexHtml.includes('<span>เปิดระบบแจ้งเหตุด่วน</span>\n            <i data-lucide="arrow-up-right"></i>') },
  { name: 'Card 2 is an <a> linking to https://sarawatdc.site/warn/', pass: indexHtml.includes('href="https://sarawatdc.site/warn/" target="_blank" rel="noopener noreferrer"\n          class="dg-ops-card theme-complaint"') },
  { name: 'Card 2 has arrow-up-right icon', pass: indexHtml.includes('<span>ส่งข้อร้องเรียนลับ</span>\n            <i data-lucide="arrow-up-right"></i>') },
  { name: 'index.html footer Emergency links to warn with target=_blank', pass: indexHtml.includes('<a href="https://sarawatdc.site/warn/" target="_blank" rel="noopener noreferrer">แจ้งเหตุฉุกเฉิน (Emergency)</a>') },
  { name: 'index.html footer Complaint links to warn with target=_blank', pass: indexHtml.includes('<a href="https://sarawatdc.site/warn/" target="_blank" rel="noopener noreferrer">ร้องเรียนการทำงาน (Complaint)</a>') },
  { name: 'activities.html footer Emergency links to warn with target=_blank', pass: actHtml.includes('<a href="https://sarawatdc.site/warn/" target="_blank" rel="noopener noreferrer">แจ้งเหตุฉุกเฉิน (Emergency)</a>') },
  { name: 'activities.html footer Complaint links to warn with target=_blank', pass: actHtml.includes('<a href="https://sarawatdc.site/warn/" target="_blank" rel="noopener noreferrer">ร้องเรียนการทำงาน (Complaint)</a>') }
];

console.log('--- TEST RESULTS ---');
tests.forEach(t => console.log((t.pass ? 'PASS: ' : 'FAIL: ') + t.name));
const allPass = tests.every(t => t.pass);
console.log('All tests passed:', allPass);
if (!allPass) process.exit(1);
