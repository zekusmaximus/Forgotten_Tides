const { findAllWorks } = require('./scripts/prompt/extract_metadata.js');
const works = findAllWorks();
console.log('Found works:', JSON.stringify(works, null, 2));