import { readFileSync, writeFileSync } from 'fs';

// Read the CSV file
const csvPath = '/Users/cemreuludag/Downloads/invoice-app-s3-user_accessKeys.csv';
const csvContent = readFileSync(csvPath, 'utf-8');
const lines = csvContent.split('\n');
const [, ...dataLines] = lines; // Skip header
const [accessKey, secretKey] = dataLines[0].split(',');

console.log('==============================================');
console.log('Adding AWS Credentials to .env');
console.log('==============================================');
console.log('');
console.log('Access Key ID:', accessKey);
console.log('Secret Key:', secretKey.substring(0, 10) + '...');
console.log('');
console.log('Please provide:');

// Get bucket and region from user (you'll need to provide these)
console.log('Bucket Name: (you need to provide this)');
console.log('Region: (e.g., us-east-1)');
console.log('');
console.log('After you provide these, I will add everything to .env');

