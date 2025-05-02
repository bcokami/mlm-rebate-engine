# MLM Rebate Engine

A custom MLM (Multi-Level Marketing) rebate engine where users earn rebates instead of PV points — both from their own purchases and their downline's purchases.

## Features

- **User Management**: Registration, login, and profile management
- **Product Shop**: Browse and purchase products with rebate configurations
- **Rebate System**: Earn rebates from personal purchases and downline purchases
- **Genealogy Tree**: View your downline structure up to 10 levels deep
- **Wallet System**: Track rebate earnings and process withdrawals
- **Admin Panel**: Manage users, products, rebates, and view reports

## Technology Stack

- **Frontend**: Next.js with React and TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite (development) / MySQL (production)
- **ORM**: Prisma
- **Authentication**: NextAuth.js

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/mlm-rebate-engine.git
cd mlm-rebate-engine
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Set up the database:

```bash
# Create and apply migrations
npm run db:migrate

# Seed the database with initial data
npm run seed
```

4. Start the development server:

```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

### Default Login Credentials

- **Admin User**:
  - Email: admin@example.com
  - Password: admin123

- **Regular User**:
  - Email: user1@example.com
  - Password: password123

## Deployment to Hostinger

1. Build the application:

```bash
npm run build
```

2. Configure your MySQL database on Hostinger.

3. Update the `.env` file with your production database credentials:

```
DATABASE_URL="mysql://username:password@hostname:3306/database_name"
NEXTAUTH_SECRET="your-secret-key-for-jwt"
NEXTAUTH_URL="https://your-domain.com"
```

4. Upload the build files to your Hostinger hosting account using FTP or Git.

5. Set up the Node.js environment on Hostinger.

## Rebate System Details

- **Personal Rebate**: User gets a set percentage of product price as rebate.
- **Downline Rebate**: Upline users (up to 10 levels) get percentage rebate on purchases by their downline.
- **Rank-based Multipliers**: Higher ranks earn higher rebate percentages.
- **Rebate Formula**: `rebate = product.price × rebate_config[level]`

## Backup and Recovery

The system includes built-in backup and recovery functionality to ensure data safety.

### Creating Backups

To create a manual backup of the database:

```bash
npm run backup
```

This will create a backup file in the `backups` directory with a timestamp.

### Scheduled Backups

For automated backups, you can set up a cron job or scheduled task to run:

```bash
npm run scheduled-backup
```

#### Setting up a Cron Job (Linux/Mac)

Example cron job to run daily at 2 AM:

```bash
0 2 * * * cd /path/to/mlm-rebate-engine && npm run scheduled-backup >> /path/to/logs/backup.log 2>&1
```

#### Setting up a Scheduled Task (Windows)

1. Open Task Scheduler
2. Create a new task
3. Set the trigger to run daily at 2 AM
4. Set the action to run the command:
   ```
   cmd.exe /c "cd C:\path\to\mlm-rebate-engine && npm run scheduled-backup >> C:\path\to\logs\backup.log 2>&1"
   ```

### Remote Backups

To enable remote backups (e.g., to cloud storage), set the following environment variables:

```
REMOTE_BACKUP=true
REMOTE_BACKUP_CMD="your-command-to-upload {backup_path} to remote storage"
```

Examples:
- For AWS S3: `REMOTE_BACKUP_CMD="aws s3 cp {backup_path} s3://your-bucket/backups/"`
- For Google Cloud Storage: `REMOTE_BACKUP_CMD="gsutil cp {backup_path} gs://your-bucket/backups/"`

### Restoring from Backup

To restore the database from a backup:

```bash
npm run restore [backup-filename]
```

If no filename is provided, the most recent backup will be used.

## Test User Management

The system includes tools for generating and managing test users to simulate a complete MLM structure.

### Generating Test Users

To generate test users for development or testing:

```bash
npm run generate-test-users
```

This will create a set of test users with different roles (admin, distributor, ranked distributor, viewer) and automatically build a 10-level MLM structure.

#### Command Line Options

You can customize the test user generation with command line options:

```bash
npm run generate-test-users -- --environment development --userCount 30 --maxLevels 10 --generatePurchases true --generateRebates true
```

Available options:
- `--environment`: "development" or "staging" (default: "development")
- `--userCount`: Total number of users to generate (default: 30)
- `--adminCount`: Number of admin users (default: 1)
- `--distributorCount`: Number of distributor users (default: 20)
- `--rankedDistributorCount`: Number of ranked distributor users (default: 5)
- `--viewerCount`: Number of viewer users (default: 4)
- `--maxLevels`: Maximum depth of the MLM structure (default: 10)
- `--generatePurchases`: Whether to generate purchase history (default: true)
- `--generateRebates`: Whether to generate rebate earnings (default: true)

### Cleaning Up Test Users

To remove test users:

```bash
npm run cleanup-test-users
```

#### Command Line Options

```bash
npm run cleanup-test-users -- --environment development --retainKeyTesters true --dryRun false
```

Available options:
- `--environment`: "development" or "staging" (default: "development")
- `--retainKeyTesters`: Whether to keep users marked with keepForDev=true (default: true)
- `--dryRun`: Preview deletion without actually deleting (default: false)

### Admin UI for Test User Management

The system includes an admin UI for managing test users at `/admin/test-users`. This interface allows you to:

1. Generate test users with customizable settings
2. View all test users by role
3. Delete test users with options to retain key testers
4. Toggle between development and staging environments

### Test User Metadata

Test users are tagged with metadata to prevent affecting real production data:

```json
{
  "role": "admin|distributor|ranked_distributor|viewer",
  "isTest": true,
  "environment": "development|staging",
  "keepForDev": true|false
}
```

## Security Features

The application includes several security features:

- **Rate Limiting**: Prevents brute force attacks by limiting the number of requests
- **CSRF Protection**: Prevents cross-site request forgery attacks
- **Input Validation**: Validates all user input using Zod schemas
- **Secure Headers**: Implements security headers like Content-Security-Policy
- **Password Hashing**: Uses bcrypt to securely hash passwords
- **JWT Authentication**: Secures API endpoints with JSON Web Tokens

## License

This project is licensed under the MIT License - see the LICENSE file for details.
