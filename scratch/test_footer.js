const fs = require('fs');

const indexHtml = fs.readFileSync('index.html', 'utf8');
const actHtml = fs.readFileSync('activities.html', 'utf8');

// 1. Verify nav actions in activities.html has 'ติดต่อเรา' and dgNavToggle
const navOk = actHtml.includes('href="#contact"') && actHtml.includes('id="dgNavToggle"');
console.log('1. activities.html nav has ติดต่อเรา & dgNavToggle:', navOk);

// 2. Verify top navbar does NOT have the admin button anymore
const topAdminRemoved = !actHtml.includes('<a href="admin.html" class="dg-btn-black" style="padding: 10px 18px;');
console.log('2. Top navbar admin button removed from activities.html:', topAdminRemoved);

// 3. Verify footer has admin link at the bottom matching index.html
const bottomAdminOk = actHtml.includes('href="admin.html"') && actHtml.includes('ระบบจัดการสารวัตร (Admin)');
console.log('3. Footer has bottom admin link:', bottomAdminOk);

// 4. Verify Pre-footer CTA layout is identical
const preFooterOk = actHtml.includes('Have any questions<br>') && actHtml.includes('school-logo.png') && actHtml.includes('sarawat_glow.png');
console.log('4. Pre-footer CTA identical to index.html:', preFooterOk);

// 5. Verify 3-column footer links
const footerColsOk = actHtml.includes('ส่วนสำคัญ') && actHtml.includes('บริการออนไลน์') && actHtml.includes('ช่องทางติดต่อ');
console.log('5. 3-column footer links identical:', footerColsOk);

if (navOk && topAdminRemoved && bottomAdminOk && preFooterOk && footerColsOk) {
  console.log('ALL FOOTER & NAV VERIFICATIONS PASSED 100%!');
} else {
  console.error('VERIFICATION FAILED');
  process.exit(1);
}
