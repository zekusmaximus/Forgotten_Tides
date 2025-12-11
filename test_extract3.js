// Clear the module cache to get the updated version
delete require.cache[require.resolve('./scripts/prompt/extract_metadata.js')];
const { extract } = require('./scripts/prompt/extract_metadata.js');

const query = "save this as a scene for First Corridor and place this as the opening scene";
const result = extract(query);
console.log(JSON.stringify(result, null, 2));