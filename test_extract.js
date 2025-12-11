const { extract } = require('./scripts/prompt/extract_metadata.js');

const query = "start a new novella titled First Corridor and place this as the opening scene";
const result = extract(query);
console.log(JSON.stringify(result, null, 2));