const fs = require('fs');
const html = fs.readFileSync('activities.html', 'utf8');

const tests = [
  { name: 'Has dg-footer', pass: html.includes('class="dg-footer"') },
  { name: 'No hidden data-reveal on dg-pre-footer-grid', pass: !html.includes('class="dg-pre-footer-grid" data-reveal') },
  { name: 'Has dg-pre-footer-grid', pass: html.includes('class="dg-pre-footer-grid"') },
  { name: 'Has School Logo', pass: html.includes('assets/icons/school-logo.png') },
  { name: 'Has Sarawat Glow Logo', pass: html.includes('assets/icons/sarawat_glow.png') },
  { name: 'Has Have any questions in your mind!', pass: html.includes('Have any questions<br>') && html.includes('in your mind!') },
  { name: 'Has Facebook CTA link', pass: html.includes('ส่งข้อความหาเราผ่าน Facebook') },
  { name: 'Has 3 Columns', pass: html.includes('ส่วนสำคัญ') && html.includes('บริการออนไลน์') && html.includes('ช่องทางติดต่อ') },
  { name: 'Has Copyright with year 2569', pass: html.includes('©2569 สารวัตรนักเรียน') },
  { name: 'Has Powered By Rujira', pass: html.includes('Powered By') && html.includes('Rujira') },
  { name: 'Has Admin Lock link', pass: html.includes('ระบบจัดการสารวัตร (Admin)') && html.includes('admin.html') }
];

console.log('--- TEST RESULTS ---');
tests.forEach(t => console.log((t.pass ? 'PASS: ' : 'FAIL: ') + t.name));
const allPass = tests.every(t => t.pass);
console.log('All tests passed:', allPass);
if (!allPass) process.exit(1);
