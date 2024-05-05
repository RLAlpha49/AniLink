const fs = require('fs');
const path = require('path');

const packageName = process.argv[2];
const packageJsonPath = path.resolve(__dirname, 'package.json');
const packageJson = require(packageJsonPath);

packageJson.name = packageName;

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));