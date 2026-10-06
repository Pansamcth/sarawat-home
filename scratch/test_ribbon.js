const fs = require('fs');

const indexHtml = fs.readFileSync('index.html', 'utf8');
const teamHtml = fs.readFileSync('team.html', 'utf8');
const activitiesHtml = fs.readFileSync('activities.html', 'utf8');

const targetUrl = 'https://github.com/KongNontawatDev/Black-Mourning-Ribbon/blob/2150640c0e623c7fbcca07024287b597f7999a84/ribbon_bottom_left.png?raw=true';
const oldRightUrl = 'ribbon_bottom_right.png';
const oldNuuneoiUrl = 'nuuneoi.com/blog/884/black_ribbon_bottom_left.png';

const tests = [
  { name: 'index.html has bottom-left ribbon URL', pass: indexHtml.includes(targetUrl) },
  { name: 'index.html has bottom:0; left:0;', pass: indexHtml.includes('bottom:0; left:0;') },
  { name: 'index.html no longer has nuuneoi ribbon', pass: !indexHtml.includes(oldNuuneoiUrl) },
  { name: 'team.html has bottom-left ribbon URL', pass: teamHtml.includes(targetUrl) },
  { name: 'team.html has bottom:0; left:0;', pass: teamHtml.includes('bottom:0; left:0;') },
  { name: 'team.html no longer has nuuneoi ribbon', pass: !teamHtml.includes(oldNuuneoiUrl) },
  { name: 'activities.html has bottom-left ribbon URL', pass: activitiesHtml.includes(targetUrl) },
  { name: 'activities.html has bottom:0; left:0;', pass: activitiesHtml.includes('bottom:0; left:0;') },
  { name: 'local fallback assets/icons/ribbon_bottom_left.png exists', pass: fs.existsSync('assets/icons/ribbon_bottom_left.png') && fs.statSync('assets/icons/ribbon_bottom_left.png').size > 1000 }
];

console.log('--- BOTTOM-LEFT RIBBON VALIDATION TESTS ---');
tests.forEach(t => console.log((t.pass ? 'PASS: ' : 'FAIL: ') + t.name));
const allPass = tests.every(t => t.pass);
console.log('All tests passed:', allPass);
if (!allPass) process.exit(1);
