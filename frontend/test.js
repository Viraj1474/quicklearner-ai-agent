console.log("Testing package.json scripts...");
console.log(JSON.stringify(require('./package.json').scripts, null, 2));