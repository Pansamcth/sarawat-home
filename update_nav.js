const fs = require('fs');

const files = ['index.html', 'activities.html', 'admin.html', 'team.html', 'rules.html'];
const targetText = '<a href="team.html">คณะทำงาน</a>';
const replacementText = '<a href="team.html">คณะทำงาน</a>\n        <a href="rules.html">กฎระเบียบ</a>';

files.forEach(f => {
  let p = 'c:/Users/Administrator/Desktop/MP/' + f;
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    // Replace in navbar
    content = content.replace(/<a href="team\.html">คณะทำงาน<\/a>/, '<a href="team.html">คณะทำงาน</a>\n        <a href="rules.html">กฎระเบียบ</a>');
    
    // Check if there is another team.html in mobile nav or somewhere else
    // Wait, the regular expression will only replace the FIRST occurrence!
    // We should use /g to replace all occurrences in the navbar and mobile menu if it exists.
    content = content.replace(/<a href="team\.html">คณะทำงาน<\/a>/g, '<a href="team.html">คณะทำงาน</a>\n        <a href="rules.html">กฎระเบียบ</a>');
    fs.writeFileSync(p, content);
  }
});
