import { readFileSync, writeFileSync, existsSync } from 'fs';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('==============================================');
  console.log('AWS S3 Setup for Invoice Receipt Uploads');
  console.log('==============================================');
  console.log('');

  // Check if .env exists
  if (!existsSync('.env')) {
    if (existsSync('.env.example')) {
      console.log('Creating .env from .env.example...');
      const exampleContent = readFileSync('.env.example', 'utf-8');
      writeFileSync('.env', exampleContent);
      console.log('✅ Created .env file');
    } else {
      console.log('❌ Error: .env.example not found');
      process.exit(1);
    }
  }

  console.log('STEP 1: AWS Account Setup');
  console.log('-------------------------');
  console.log('Do you have an AWS account? (y/n)');
  const hasAccount = await question('> ');

  if (hasAccount.toLowerCase() !== 'y') {
    console.log('');
    console.log('Please create an AWS account at: https://aws.amazon.com/free/');
    console.log('AWS Free Tier includes:');
    console.log('  - 5 GB of storage');
    console.log('  - 20,000 GET requests/month');
    console.log('  - 2,000 PUT requests/month');
    console.log('  - Valid for 12 months');
    console.log('');
    process.exit(0);
  }

  console.log('');
  console.log('STEP 2: Create S3 Bucket');
  console.log('------------------------');
  console.log('1. Go to https://console.aws.amazon.com/s3');
  console.log('2. Click "Create bucket"');
  console.log('3. Configure:');
  console.log('   - Bucket name: (unique name)');
  console.log('   - Region: us-east-1 or your preferred');
  console.log('   - Encryption: Enable server-side encryption');
  console.log('');
  
  const bucketName = await question('Enter your bucket name: ');
  const region = await question('Enter your AWS region (e.g., us-east-1): ');

  console.log('');
  console.log('STEP 3: Create IAM User');
  console.log('------------------------');
  console.log('1. Go to https://console.aws.amazon.com/iam');
  console.log('2. Create a user and access key');
  console.log('3. Attach a policy with PutObject, GetObject, DeleteObject');
  console.log('');

  const accessKey = await question('Enter AWS Access Key ID: ');
  const secretKey = await question('Enter AWS Secret Access Key: ');

  // Read current .env
  const envContent = readFileSync('.env', 'utf-8');

  // Check if S3 config already exists
  if (envContent.includes('AWS_S3_BUCKET_NAME')) {
    console.log('');
    console.log('⚠️  S3 configuration already exists in .env');
    const overwrite = await question('Do you want to overwrite it? (y/n): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup cancelled.');
      rl.close();
      process.exit(0);
    }
    // Remove old S3 config
    const lines = envContent.split('\n');
    const withoutS3 = lines.filter(line => 
      !line.startsWith('AWS_') && 
      !line.includes('# AWS S3') &&
      !line.includes('# ===== AWS')
    );
    writeFileSync('.env', withoutS3.join('\n'));
  }

  // Add S3 configuration
  const s3Config = `

# ========================================
# AWS S3 CONFIGURATION (FOR RECEIPT UPLOADS)
# ========================================

AWS_REGION=${region}
AWS_ACCESS_KEY_ID=${accessKey}
AWS_SECRET_ACCESS_KEY=${secretKey}
AWS_S3_BUCKET_NAME=${bucketName}
`;

  writeFileSync('.env', s3Config, { flag: 'a' });

  console.log('');
  console.log('✅ S3 configuration added to .env file!');
  console.log('');
  console.log('IMPORTANT: Never commit .env to version control!');
  console.log('');
  console.log('For detailed documentation, see: S3_SETUP_GUIDE.md');
  console.log('');
  console.log('Setup complete! You can now start the app with: npm run dev');

  rl.close();
}

main().catch(err => {
  console.error('Error:', err);
  rl.close();
  process.exit(1);
});


