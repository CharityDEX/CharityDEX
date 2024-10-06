const fs = require('fs');

const build = require('./build/asset-manifest.json');

const prefix = './build/';
const jsPrefix = prefix + 'static/js/';
const mainRegex = /main\..{8}\.js/;
const mainPath = build.files['main.js'].match(mainRegex)[0];
const mainPathWithoutHash = mainPath.replace(mainRegex, 'main.js');

fs.renameSync(jsPrefix + mainPath, jsPrefix + mainPathWithoutHash);
console.log(`${mainPath} file has been renamed to ${mainPathWithoutHash}`);

const htmlPath = prefix + 'index.html';
const html = fs.readFileSync(htmlPath, 'utf-8');
const fixedHtml = html.replace(build.files['main.js'], build.files['main.js'].replace(mainRegex, 'main.js'));
fs.writeFileSync(htmlPath, fixedHtml, 'utf-8');
console.log('Html has been updated with new file path');

fs.unlinkSync('./build/asset-manifest.json');
console.log('Assets manifest has been removed');
