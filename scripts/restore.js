/**
 * Database Restore Script
 * 
 * This script restores a backup of the database.
 * Usage: node restore.js [backup-filename]
 * If no filename is provided, it will use the most recent backup.
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const dotenv = require('dotenv');
const readline = require('readline');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Configuration
const DB_URL = process.env.DATABASE_URL || 'file:./dev.db';
const BACKUP_DIR = path.resolve(__dirname, '../backups');

// Extract the database path from the DATABASE_URL
const dbPath = DB_URL.replace('file:', '').trim();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to get the most recent backup
function getMostRecentBackup() {
  try {
    // Get all backup files
    const backupFiles = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('backup-') && file.endsWith('.db'))
      .map(file => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        time: fs.statSync(path.join(BACKUP_DIR, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time); // Sort by time (newest first)
    
    if (backupFiles.length === 0) {
      console.error('No backup files found!');
      process.exit(1);
    }
    
    return backupFiles[0];
  } catch (error) {
    console.error(`Error getting most recent backup: ${error.message}`);
    process.exit(1);
  }
}

// Function to restore a backup
async function restoreBackup(backupPath) {
  console.log(`Restoring database from ${backupPath}...`);
  
  try {
    // For SQLite, we can simply copy the backup file over the database file
    if (DB_URL.startsWith('file:')) {
      // Create a backup of the current database before restoring
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const currentBackupPath = path.join(BACKUP_DIR, `pre-restore-${timestamp}.db`);
      
      if (fs.existsSync(dbPath)) {
        fs.copyFileSync(dbPath, currentBackupPath);
        console.log(`Created backup of current database at ${currentBackupPath}`);
      }
      
      // Copy the backup file to the database location
      fs.copyFileSync(backupPath, dbPath);
      console.log('Database restored successfully!');
    } 
    // For MySQL (in production)
    else if (DB_URL.includes('mysql://')) {
      // Parse MySQL connection details from DATABASE_URL
      const url = new URL(DB_URL);
      const host = url.hostname;
      const port = url.port || 3306;
      const database = url.pathname.substring(1);
      const username = url.username;
      const password = url.password;
      
      // Create MySQL restore command
      const command = `mysql -h ${host} -P ${port} -u ${username} -p${password} ${database} < ${backupPath}`;
      
      // Execute the command
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error restoring MySQL database: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`MySQL restore stderr: ${stderr}`);
          return;
        }
        console.log('MySQL database restored successfully!');
      });
    } else {
      console.error('Unsupported database type for restore');
    }
  } catch (error) {
    console.error(`Error restoring database: ${error.message}`);
  }
}

// Main function
async function main() {
  // Check if backup directory exists
  if (!fs.existsSync(BACKUP_DIR)) {
    console.error(`Backup directory ${BACKUP_DIR} does not exist!`);
    process.exit(1);
  }
  
  // Get backup filename from command line arguments or use the most recent backup
  let backupFilename = process.argv[2];
  let backupPath;
  
  if (backupFilename) {
    backupPath = path.join(BACKUP_DIR, backupFilename);
    
    if (!fs.existsSync(backupPath)) {
      console.error(`Backup file ${backupPath} does not exist!`);
      process.exit(1);
    }
  } else {
    const mostRecentBackup = getMostRecentBackup();
    backupPath = mostRecentBackup.path;
    backupFilename = mostRecentBackup.name;
    
    console.log(`Using most recent backup: ${backupFilename}`);
  }
  
  // Confirm restore
  rl.question(`Are you sure you want to restore the database from ${backupFilename}? This will overwrite the current database. (y/n) `, async (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      await restoreBackup(backupPath);
    } else {
      console.log('Restore cancelled.');
    }
    
    rl.close();
  });
}

// Run the main function
main();
