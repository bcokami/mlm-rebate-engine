import * as XLSX from 'xlsx';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

/**
 * Interface for user import data
 */
export interface UserImportData {
  memberId: string;
  name: string;
  email: string;
  uplineId?: string | null;
  registrationDate?: Date | null;
  rank?: string | null;
  phone?: string | null;
}

/**
 * Interface for user import validation result
 */
export interface UserImportValidationResult {
  isValid: boolean;
  errors: string[];
  data?: UserImportData;
  row: number;
}

/**
 * Interface for user import summary
 */
export interface UserImportSummary {
  totalProcessed: number;
  successful: number;
  failed: number;
  duplicates: number;
  errors: Array<{ row: number; errors: string[] }>;
  importedUsers: Array<{
    id: number;
    name: string;
    email: string;
    memberId: string;
    uplineId: number | null;
    rankId: number;
  }>;
}

/**
 * Interface for user export options
 */
export interface UserExportOptions {
  includeRank?: boolean;
  includeDownlineCount?: boolean;
  includeJoinDate?: boolean;
  includeEarnings?: boolean;
  rankFilter?: number;
  dateRangeStart?: Date;
  dateRangeEnd?: Date;
  activeOnly?: boolean;
}

/**
 * Parse Excel file for user import
 * 
 * @param buffer Excel file buffer
 * @returns Array of validation results
 */
export async function parseUserExcel(buffer: Buffer): Promise<UserImportValidationResult[]> {
  // Read the Excel file
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  
  // Get all sheet names
  const sheetNames = workbook.SheetNames;
  
  // Initialize results array
  const results: UserImportValidationResult[] = [];
  
  // Process each sheet
  for (const sheetName of sheetNames) {
    const sheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
    
    // Skip empty sheets
    if (rows.length <= 1) continue;
    
    // Extract header row
    const headers = rows[0] as string[];
    
    // Check if this is a hierarchy sheet (format: ChildID-UplineID)
    const hierarchyMatch = sheetName.match(/([A-Za-z0-9]+)-([A-Za-z0-9]+)/);
    let childId = null;
    let uplineId = null;
    
    if (hierarchyMatch) {
      childId = hierarchyMatch[1];
      uplineId = hierarchyMatch[2];
    }
    
    // Process data rows
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] as any[];
      
      // Skip empty rows
      if (!row.some(cell => cell !== null && cell !== '')) continue;
      
      // Validate and convert row
      const validationResult = await validateUserRow(row, headers, i + 1, childId, uplineId);
      results.push(validationResult);
    }
  }
  
  return results;
}

/**
 * Validate a row from the Excel file
 * 
 * @param row Row data
 * @param headers Header row
 * @param rowNumber Row number for error reporting
 * @param childId Child ID from sheet name
 * @param uplineId Upline ID from sheet name
 * @returns Validation result
 */
async function validateUserRow(
  row: any[],
  headers: string[],
  rowNumber: number,
  childId: string | null,
  uplineId: string | null
): Promise<UserImportValidationResult> {
  const errors: string[] = [];
  const rowData: Record<string, any> = {};
  
  // Map row data to headers
  for (let i = 0; i < headers.length; i++) {
    if (headers[i]) {
      rowData[headers[i].toLowerCase().trim()] = row[i];
    }
  }
  
  // Extract and validate required fields
  let memberId = rowData['member id'] || rowData['memberid'] || rowData['id'] || childId;
  const name = rowData['name'] || rowData['full name'] || rowData['fullname'];
  let email = rowData['email'] || rowData['email address'] || rowData['emailaddress'];
  
  // Extract optional fields
  const phone = rowData['phone'] || rowData['phone number'] || rowData['phonenumber'];
  const rank = rowData['rank'] || rowData['rank name'] || rowData['rankname'];
  let registrationDate = rowData['registration date'] || rowData['registrationdate'] || 
                         rowData['join date'] || rowData['joindate'] || rowData['date'];
  
  // Use upline from sheet name if not in row data
  let rowUplineId = rowData['upline id'] || rowData['uplineid'] || rowData['upline'] || uplineId;
  
  // Validate required fields
  if (!memberId) {
    errors.push('Member ID is required');
  }
  
  if (!name) {
    errors.push('Name is required');
  } else if (name.length < 2) {
    errors.push('Name must be at least 2 characters');
  }
  
  // Auto-generate email if missing
  if (!email) {
    if (memberId) {
      email = `member${memberId}@extremelife.ph`;
    } else {
      errors.push('Email is required when Member ID is not provided');
    }
  } else {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Invalid email format');
    }
    
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      errors.push(`Email already exists: ${email}`);
    }
  }
  
  // Validate registration date
  if (registrationDate) {
    if (!(registrationDate instanceof Date)) {
      try {
        // Try to parse the date
        registrationDate = new Date(registrationDate);
        if (isNaN(registrationDate.getTime())) {
          errors.push('Invalid registration date format');
          registrationDate = null;
        }
      } catch (error) {
        errors.push('Invalid registration date format');
        registrationDate = null;
      }
    }
  }
  
  // Prepare user data
  const userData: UserImportData = {
    memberId: memberId?.toString(),
    name: name || '',
    email: email || '',
    uplineId: rowUplineId?.toString() || null,
    registrationDate: registrationDate || null,
    rank: rank || null,
    phone: phone?.toString() || null,
  };
  
  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? userData : undefined,
    row: rowNumber,
  };
}

/**
 * Import users from validated data
 * 
 * @param validatedData Array of validated user data
 * @param defaultPassword Default password for new users
 * @param adminId ID of the admin performing the import
 * @param adminName Name of the admin performing the import
 * @returns Import summary
 */
export async function importUsers(
  validatedData: UserImportValidationResult[],
  defaultPassword: string,
  adminId: number,
  adminName: string
): Promise<UserImportSummary> {
  const summary: UserImportSummary = {
    totalProcessed: validatedData.length,
    successful: 0,
    failed: 0,
    duplicates: 0,
    errors: [],
    importedUsers: [],
  };
  
  // Hash the default password
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);
  
  // Get all ranks for mapping
  const ranks = await prisma.rank.findMany();
  const rankMap = new Map(ranks.map(rank => [rank.name.toLowerCase(), rank.id]));
  
  // Process each validated user
  for (const result of validatedData) {
    if (!result.isValid || !result.data) {
      summary.failed++;
      summary.errors.push({
        row: result.row,
        errors: result.errors,
      });
      continue;
    }
    
    try {
      const userData = result.data;
      
      // Check if user with this email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });
      
      if (existingUser) {
        summary.duplicates++;
        summary.errors.push({
          row: result.row,
          errors: [`User with email ${userData.email} already exists`],
        });
        continue;
      }
      
      // Determine rank ID
      let rankId = 1; // Default to starter rank
      if (userData.rank) {
        const rankKey = userData.rank.toLowerCase();
        if (rankMap.has(rankKey)) {
          rankId = rankMap.get(rankKey)!;
        }
      }
      
      // Find upline user if provided
      let uplineId: number | null = null;
      if (userData.uplineId) {
        // Try to find upline by member ID first
        const uplineByMemberId = await prisma.user.findFirst({
          where: {
            metadata: {
              path: ['memberId'],
              equals: userData.uplineId,
            },
          },
        });
        
        if (uplineByMemberId) {
          uplineId = uplineByMemberId.id;
        } else {
          // Try to find by ID
          try {
            const uplineIdNum = parseInt(userData.uplineId);
            if (!isNaN(uplineIdNum)) {
              const uplineById = await prisma.user.findUnique({
                where: { id: uplineIdNum },
              });
              
              if (uplineById) {
                uplineId = uplineById.id;
              }
            }
          } catch (error) {
            // Ignore parsing errors
          }
        }
      }
      
      // Create the user
      const createdAt = userData.registrationDate || new Date();
      const user = await prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          phone: userData.phone || null,
          rankId,
          uplineId,
          createdAt,
          updatedAt: new Date(),
          metadata: {
            memberId: userData.memberId,
            importedBy: adminId,
            importedAt: new Date().toISOString(),
          },
        },
      });
      
      // Log the import action
      await prisma.userAudit.create({
        data: {
          userId: user.id,
          action: 'import',
          details: JSON.stringify({
            adminId,
            adminName,
            importSource: 'excel',
            originalData: userData,
          }),
          createdAt: new Date(),
        },
      });
      
      summary.successful++;
      summary.importedUsers.push({
        id: user.id,
        name: user.name,
        email: user.email,
        memberId: userData.memberId,
        uplineId: user.uplineId,
        rankId: user.rankId,
      });
    } catch (error) {
      console.error('Error importing user:', error);
      summary.failed++;
      summary.errors.push({
        row: result.row,
        errors: [(error as Error).message || 'Unknown error'],
      });
    }
  }
  
  return summary;
}

/**
 * Export users to Excel
 * 
 * @param options Export options
 * @returns Excel file buffer
 */
export async function exportUsersToExcel(options: UserExportOptions = {}): Promise<Buffer> {
  // Build where clause for filtering
  const whereClause: any = {};
  
  if (options.rankFilter) {
    whereClause.rankId = options.rankFilter;
  }
  
  if (options.dateRangeStart || options.dateRangeEnd) {
    whereClause.createdAt = {};
    
    if (options.dateRangeStart) {
      whereClause.createdAt.gte = options.dateRangeStart;
    }
    
    if (options.dateRangeEnd) {
      whereClause.createdAt.lte = options.dateRangeEnd;
    }
  }
  
  // Get users with related data
  const users = await prisma.user.findMany({
    where: whereClause,
    include: {
      rank: true,
      _count: {
        select: {
          downline: true,
        },
      },
    },
    orderBy: {
      id: 'asc',
    },
  });
  
  // Prepare data for export
  const data = await Promise.all(users.map(async (user) => {
    const userData: Record<string, any> = {
      'User ID': user.id,
      'Name': user.name,
      'Email': user.email,
      'Phone': user.phone || '',
      'Rank': user.rank.name,
    };
    
    if (options.includeDownlineCount) {
      userData['Downline Count'] = user._count.downline;
    }
    
    if (options.includeJoinDate) {
      userData['Join Date'] = user.createdAt.toISOString().split('T')[0];
    }
    
    if (options.includeEarnings) {
      // Calculate total earnings
      const earnings = await prisma.walletTransaction.aggregate({
        where: {
          userId: user.id,
          type: 'rebate',
        },
        _sum: {
          amount: true,
        },
      });
      
      userData['Total Earnings'] = earnings._sum.amount || 0;
    }
    
    // Add member ID if available in metadata
    if (user.metadata && typeof user.metadata === 'object' && 'memberId' in user.metadata) {
      userData['Member ID'] = (user.metadata as any).memberId;
    }
    
    // Add upline info if available
    if (user.uplineId) {
      const upline = await prisma.user.findUnique({
        where: { id: user.uplineId },
        select: { id: true, name: true },
      });
      
      if (upline) {
        userData['Upline ID'] = upline.id;
        userData['Upline Name'] = upline.name;
      }
    }
    
    return userData;
  }));
  
  // Create a new workbook
  const workbook = XLSX.utils.book_new();
  
  // Create a worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
  
  // Generate buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  
  return buffer;
}

/**
 * Generate Excel template for user import
 * 
 * @returns Excel file buffer
 */
export function generateUserImportTemplate(): Buffer {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();
  
  // Sample data for main sheet
  const mainData = [
    {
      'Member ID': '00001',
      'Name': 'John Doe',
      'Email': 'john.doe@example.com',
      'Phone': '09123456789',
      'Rank': 'Gold',
      'Upline ID': '00000',
      'Registration Date': '2023-01-15',
    },
    {
      'Member ID': '00002',
      'Name': 'Jane Smith',
      'Email': 'jane.smith@example.com',
      'Phone': '09987654321',
      'Rank': 'Silver',
      'Upline ID': '00001',
      'Registration Date': '2023-02-20',
    },
  ];
  
  // Create main worksheet
  const mainWorksheet = XLSX.utils.json_to_sheet(mainData);
  
  // Add the main worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, mainWorksheet, 'Users');
  
  // Create a hierarchy example sheet
  const hierarchyData = [
    {
      'Name': 'Alice Johnson',
      'Email': 'alice.johnson@example.com',
      'Phone': '09111222333',
      'Rank': 'Bronze',
      'Registration Date': '2023-03-10',
    },
    {
      'Name': 'Bob Williams',
      'Email': 'bob.williams@example.com',
      'Phone': '09444555666',
      'Rank': 'Starter',
      'Registration Date': '2023-03-15',
    },
  ];
  
  // Create hierarchy worksheet
  const hierarchyWorksheet = XLSX.utils.json_to_sheet(hierarchyData);
  
  // Add the hierarchy worksheet to the workbook with a special name indicating the relationship
  XLSX.utils.book_append_sheet(workbook, hierarchyWorksheet, '00003-00001');
  
  // Add instructions sheet
  const instructions = [
    {
      'Instructions': 'How to use this template:',
      'Details': '',
    },
    {
      'Instructions': '1. Main Sheet (Users)',
      'Details': 'Fill in user details in the Users sheet. All users listed here will be imported.',
    },
    {
      'Instructions': '2. Hierarchy Sheets',
      'Details': 'Create additional sheets with names in the format "ChildID-UplineID" to establish hierarchical relationships.',
    },
    {
      'Instructions': '3. Required Fields',
      'Details': 'Member ID, Name, and Email are required. Email will be auto-generated if missing.',
    },
    {
      'Instructions': '4. Optional Fields',
      'Details': 'Phone, Rank, Upline ID, and Registration Date are optional.',
    },
    {
      'Instructions': '5. Default Values',
      'Details': 'Default rank is Starter. Registration date defaults to import date if not provided.',
    },
  ];
  
  // Create instructions worksheet
  const instructionsWorksheet = XLSX.utils.json_to_sheet(instructions);
  
  // Add the instructions worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, instructionsWorksheet, 'Instructions');
  
  // Generate buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  
  return buffer;
}
