const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'build', 'index.html');

fs.readFile(indexPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading index.html:', err);
    return;
  }

  let modifiedHtml = data
    .replace(/href="\/(.*?)"/g, 'href="./$1"') // Convert absolute href to relative
    .replace(/src="\/(.*?)"/g, 'src="./$1"'); // Convert absolute src to relative

  fs.writeFile(indexPath, modifiedHtml, 'utf8', (err) => {
    if (err) {
      console.error('Error writing index.html:', err);
      return;
    }
    console.log('index.html paths have been updated.');
  });
});
