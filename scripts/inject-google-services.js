const fs = require('fs');
const path = require('path');

const encoded = process.env.GOOGLE_SERVICES_JSON;

if (!encoded) {
  console.error('GOOGLE_SERVICES_JSON env variable is not set');
  process.exit(1);
}

const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
const dest = path.join(__dirname, '..', 'google-services.json');

fs.writeFileSync(dest, decoded, 'utf-8');
console.log('google-services.json written successfully');
