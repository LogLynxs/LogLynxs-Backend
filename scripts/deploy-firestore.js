const { execSync } = require('child_process');
const path = require('path');

async function deployFirestore() {
  try {
    // Deploy Firestore rules
    execSync('npx firebase deploy --only firestore:rules', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });

    // Deploy Firestore indexes
    execSync('npx firebase deploy --only firestore:indexes', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });

  } catch (error) {
    console.error('Error deploying Firestore:', error.message);
    process.exit(1);
  }
}

deployFirestore();
