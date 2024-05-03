const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '/docs', 'index.html');

const gaCode = `
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-TQ9SNE93ZF"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-TQ9SNE93ZF');
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