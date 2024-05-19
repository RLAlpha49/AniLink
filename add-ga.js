const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '/docs', 'index.html');

const gaCode = `
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-F7DE9Y757W"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-F7DE9Y757W');
</script>
`;

fs.readFile(indexPath, 'utf8', function(err, data) {
  if (err) {
    return console.log(err);
  }

  const result = data.replace('</head>', `${gaCode}</head>`);

  fs.writeFile(indexPath, result, 'utf8', function(err) {
    if (err) return console.log(err);
  });
});