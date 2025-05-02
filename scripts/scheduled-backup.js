/**
 * Scheduled Database Backup Script
 * 
 * This script is designed to be run as a cron job or scheduled task.
 * It creates a backup of the database and uploads it to a remote storage (if configured).
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Configuration
const DB_URL = process.env.DATABASE_URL || 'file:./dev.db';
const BACKUP_DIR = path.resolve(__dirname, '../backups');
const MAX_BACKUPS = 30; // Keep 30 days of backups
const REMOTE_BACKUP = process.env.REMOTE_BACKUP === 'true';
const REMOTE_BACKUP_CMD = process.env.REMOTE_BACKUP_CMD || '';

// Create backup directory if it doesn't exist
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Generate backup filename with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFilename = `backup-${timestamp}.db`;
const backupPath = path.join(BACKUP_DIR, backupFilename);

// Extract the database path from the DATABASE_URL
const dbPath = DB_URL.replace('file:', '').trim();

// Function to create a backup
async function createBackup() {
  console.log(`[${new Date().toISOString()}] Creating scheduled backup of database to ${backupPath}...`);
  
  try {
    // For SQLite, we can simply copy the database file
    if (DB_URL.startsWith('file:')) {
      fs.copyFileSync(dbPath, backupPath);
      console.log(`[${new Date().toISOString()}] Backup created successfully!`);
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
      
      // Create MySQL backup command
      const command = `mysqldump -h ${host} -P ${port} -u ${username} -p${password} ${database} > ${backupPath}`;
      
      // Execute the command
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`[${new Date().toISOString()}] Error creating MySQL backup: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`[${new Date().toISOString()}] MySQL backup stderr: ${stderr}`);
          return;
        }
        console.log(`[${new Date().toISOString()}] MySQL backup created successfully!`);
        
        // Upload to remote storage if configured
        if (REMOTE_BACKUP && REMOTE_BACKUP_CMD) {
          uploadToRemoteStorage();
        }
      });
    } else {
      console.error(`[${new Date().toISOString()}] Unsupported database type for backup`);
    }
    
    // Clean up old backups
    cleanupOldBackups();
    
    // Upload to remote storage if configured (for SQLite)
    if (REMOTE_BACKUP && REMOTE_BACKUP_CMD && DB_URL.startsWith('file:')) {
      uploadToRemoteStorage();
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error creating backup: ${error.message}`);
  }
}

// Function to clean up old backups
function cleanupOldBackups() {
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
    
    // Remove old backups if we have more than MAX_BACKUPS
    if (backupFiles.length > MAX_BACKUPS) {
      console.log(`[${new Date().toISOString()}] Cleaning up old backups (keeping ${MAX_BACKUPS} most recent)...`);
      
      for (let i = MAX_BACKUPS; i < backupFiles.length; i++) {
        fs.unlinkSync(backupFiles[i].path);
        console.log(`[${new Date().toISOString()}] Deleted old backup: ${backupFiles[i].name}`);
      }
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error cleaning up old backups: ${error.message}`);
  }
}

// Function to upload backup to remote storage
function uploadToRemoteStorage() {
  try {
    if (!REMOTE_BACKUP_CMD) {
      console.error(`[${new Date().toISOString()}] Remote backup command not configured`);
      return;
    }
    
    console.log(`[${new Date().toISOString()}] Uploading backup to remote storage...`);
    
    // Replace placeholders in the command
    const command = REMOTE_BACKUP_CMD
      .replace('{backup_path}', backupPath)
      .replace('{timestamp}', timestamp);
    
    // Execute the command
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`[${new Date().toISOString()}] Error uploading to remote storage: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`[${new Date().toISOString()}] Remote storage stderr: ${stderr}`);
        return;
      }
      console.log(`[${new Date().toISOString()}] Backup uploaded to remote storage successfully!`);
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error uploading to remote storage: ${error.message}`);
  }
}

// Create the backup
createBackup();
