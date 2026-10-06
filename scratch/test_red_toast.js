const fs = require('fs');

const jsCode = fs.readFileSync('js/image-protection.js', 'utf8');
const diegoCss = fs.readFileSync('css/diego.css', 'utf8');
const teamCss = fs.readFileSync('css/team-page.css', 'utf8');

const tests = [
  { name: 'JS contains 🚧 emoji', pass: jsCode.includes('🚧') },
  { name: 'JS contains เว็บไซต์นี้ไม่อนุญาตให้คุณบันทึกภาพ', pass: jsCode.includes('เว็บไซต์นี้ไม่อนุญาตให้คุณบันทึกภาพ') },
  { name: 'diego.css has red background (#dc2626 or linear-gradient with red)', pass: diegoCss.includes('#dc2626') },
  { name: 'diego.css has white text', pass: diegoCss.includes('.dg-protect-toast') && diegoCss.includes('color: #ffffff;') },
  { name: 'diego.css has border-radius', pass: diegoCss.includes('border-radius: 12px;') },
  { name: 'diego.css has toast icon styles', pass: diegoCss.includes('.dg-toast-icon') },
  { name: 'team-page.css has red background', pass: teamCss.includes('#dc2626') },
  { name: 'team-page.css has toast icon styles', pass: teamCss.includes('.dg-toast-icon') }
];

console.log('--- TOAST VALIDATION TESTS ---');
tests.forEach(t => console.log((t.pass ? 'PASS: ' : 'FAIL: ') + t.name));
const allPass = tests.every(t => t.pass);
console.log('All tests passed:', allPass);
if (!allPass) process.exit(1);
