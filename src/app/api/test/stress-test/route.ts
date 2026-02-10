/**
 * Stress Test API Route — Phase 8
 *
 * POST /api/test/stress-test  — Creates test deals with Courier-text PDFs, triggers pipeline
 * GET  /api/test/stress-test  — Returns status of all test deals
 *
 * All docs are Courier-text PDFs. Textract AnalyzeDocument reads them perfectly,
 * then Grok extracts structured data from the OCR text.
 *
 * ⚠️  DELETE THIS FILE AFTER TESTING — no auth, exposes test seeding
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { uploadToS3 } from "@/lib/s3";
import { inngest } from "@/inngest/client";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// ---------------------------------------------------------------------------
// PDF Generator — Courier text on letter-size pages
// ---------------------------------------------------------------------------

async function createPdf(text: string, title: string): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Courier);
  const bold = await doc.embedFont(StandardFonts.CourierBold);
  const sz = 9;
  const lh = 12;
  const margin = 50;
  const W = 612;
  const H = 792;
  const maxLines = Math.floor((H - 2 * margin) / lh);

  let page = doc.addPage([W, H]);
  let y = H - margin;
  let count = 0;

  page.drawText(title, { x: margin, y, size: 14, font: bold, color: rgb(0, 0, 0) });
  y -= 24;
  count += 2;

  for (const line of text.split("\n")) {
    if (count >= maxLines) {
      page = doc.addPage([W, H]);
      y = H - margin;
      count = 0;
    }
    const isHeader = line.startsWith("===") || line.startsWith("---") || (line === line.toUpperCase() && line.length > 5);
    page.drawText(line.substring(0, 90), {
      x: margin,
      y,
      size: isHeader ? 10 : sz,
      font: isHeader ? bold : font,
      color: rgb(0, 0, 0),
    });
    y -= lh;
    count++;
  }

  return Buffer.from(await doc.save());
}

// ---------------------------------------------------------------------------
// Document Generators — All Courier text
// ---------------------------------------------------------------------------

function generate1040Thompson(): Promise<Buffer> {
  return createPdf(`
Department of the Treasury - Internal Revenue Service
Form 1040  U.S. Individual Income Tax Return  2023

Filing Status: [X] Married filing jointly
Your first name: Robert J.    Last name: Thompson    SSN: XXX-XX-4521
Spouse first name: Sarah M.   Last name: Thompson    SSN: XXX-XX-7834
Home address: 742 Evergreen Terrace
City: Springfield    State: IL    ZIP: 62704

Dependents:
  Emily Thompson       XXX-XX-1234    Daughter    [X] Child tax credit
  Michael Thompson     XXX-XX-5678    Son         [X] Child tax credit

INCOME
1a  Wages, salaries, tips (W-2)                      $185,000
1z  Add lines 1a through 1h                          $185,000
2a  Tax-exempt interest                                $1,200
2b  Taxable interest                                   $3,450
3a  Qualified dividends                                $2,100
3b  Ordinary dividends                                 $2,800
7   Capital gain or (loss)                             $8,500
9   Total income (add lines 1z, 2b, 3b, 4b-8)       $199,750
10  Adjustments to income                              $6,000
11  Adjusted gross income (line 9 minus line 10)     $193,750

DEDUCTIONS
12  Standard deduction or itemized deductions         $27,700
15  Taxable income (line 11 minus line 14)           $166,050

TAX AND CREDITS
16  Tax                                               $30,270
19  Child tax credit/credit for dependents             $4,000
22  Subtract credits from tax                         $26,270
24  Total tax                                         $26,270

PAYMENTS
25a Federal income tax withheld from W-2s             $35,000
25d Total federal tax withheld                        $35,000
26  Estimated tax payments                             $5,000
33  Total payments                                    $40,000

REFUND
34  Amount overpaid                                   $13,730
35a Refunded to you                                   $13,730
`, "Form 1040 - U.S. Individual Income Tax Return 2023");
}

function generateW2Thompson(): Promise<Buffer> {
  return createPdf(`
Form W-2  Wage and Tax Statement  2023
Department of the Treasury - Internal Revenue Service

a  Employee's SSN: XXX-XX-4521
b  Employer's EIN: 36-1234567
c  Employer: Midwest Financial Services LLC
   500 State Street, Suite 200
   Springfield, IL 62701
d  Control number: W2-2023-00421

e  Employee: Robert J. Thompson
   742 Evergreen Terrace
   Springfield, IL 62704

Box 1   Wages, tips, other compensation:        $185,000.00
Box 2   Federal income tax withheld:              $35,000.00
Box 3   Social security wages:                   $160,200.00
Box 4   Social security tax withheld:              $9,932.40
Box 5   Medicare wages and tips:                 $185,000.00
Box 6   Medicare tax withheld:                     $2,682.50
Box 12a Code DD  Health insurance:                $18,500.00
Box 12b Code D   401(k) contributions:            $22,500.00
Box 13  [X] Retirement plan
Box 15  State: IL    Employer state ID: 36-1234567
Box 16  State wages:                             $185,000.00
Box 17  State income tax:                          $9,250.00
`, "Form W-2 - Wage and Tax Statement 2023");
}

function generateBankStmtThompson(): Promise<Buffer> {
  return createPdf(`
FIRST NATIONAL BANK
CHECKING ACCOUNT STATEMENT

Account Holder: Robert J. & Sarah M. Thompson
Account Number: XXXX-XXXX-4892
Statement Period: 07/01/2023 - 12/31/2023

ACCOUNT SUMMARY
Opening Balance (07/01/2023):                    $45,320.18
Total Deposits:                                  $98,456.00
Total Withdrawals:                               $82,135.47
Ending Balance (12/31/2023):                     $61,640.71

MONTHLY SUMMARY
Month        Deposits      Withdrawals    Ending Balance
Jul 2023     $15,416.67    $12,890.23     $47,846.62
Aug 2023     $15,416.67    $13,245.78     $50,017.51
Sep 2023     $15,416.67    $14,102.34     $51,331.84
Oct 2023     $17,916.67    $13,876.45     $55,372.06
Nov 2023     $15,416.67    $13,520.12     $57,268.61
Dec 2023     $18,872.65    $14,500.55     $61,640.71

TRANSACTION DETAIL - JULY 2023
Date     Description                          Amount       Balance
07/01    Opening Balance                                   $45,320.18
07/03    ACH DEPOSIT - MIDWEST FINANCIAL      $7,708.33    $53,028.51
07/05    CHECK #1205 - Mortgage               -$2,150.00   $50,878.51
07/08    DEBIT - ComEd Electric               -$187.45     $50,691.06
07/10    DEBIT - AT&T Wireless                -$245.00     $50,446.06
07/12    ACH - Vanguard Investment            -$2,000.00   $48,446.06
07/15    ACH DEPOSIT - MIDWEST FINANCIAL      $7,708.34    $56,154.40
07/18    CHECK #1206 - Property Tax           -$4,200.00   $51,954.40
07/20    DEBIT - Whole Foods                  -$342.78     $51,611.62
07/22    DEBIT - Shell Gas                    -$85.00      $51,526.62
07/25    DEBIT - Insurance Premium            -$580.00     $50,946.62
07/28    WIRE - Quarterly estimated tax       -$3,100.00   $47,846.62

Avg Daily Balance for period: $53,182.45
No NSF/Overdraft fees during statement period.
`, "FIRST NATIONAL BANK - Checking Account Statement");
}

function generate1040Chen(): Promise<Buffer> {
  return createPdf(`
Department of the Treasury - Internal Revenue Service
Form 1040  U.S. Individual Income Tax Return  2023

Filing Status: [X] Single
Your first name: Marcus A.    Last name: Chen    SSN: XXX-XX-8901
Home address: 1847 Innovation Drive
City: Austin    State: TX    ZIP: 78701

INCOME
1a  Wages, salaries, tips (W-2)                       $92,000
1z  Add lines 1a through 1h                           $92,000
2b  Taxable interest                                   $1,850
3b  Ordinary dividends                                 $3,200
7   Capital gain or (loss)                            $12,400
8   Other income (Schedule C: $78,500)                $78,500
9   Total income                                     $187,950
10  Adjustments to income                             $11,475
11  Adjusted gross income                            $176,475

DEDUCTIONS
12  Standard deduction                                $24,380
13  Qualified business income deduction               $15,700
15  Taxable income                                   $136,395

TAX AND CREDITS
16  Tax                                               $28,186
23  Other taxes (SE tax from Schedule SE)             $11,090
24  Total tax                                         $39,276

PAYMENTS
25a Federal income tax withheld from W-2s             $18,400
25d Total federal tax withheld                        $18,400
26  Estimated tax payments                            $24,000
33  Total payments                                    $42,400

REFUND
34  Amount overpaid                                    $3,124
35a Refunded to you                                    $3,124
`, "Form 1040 - U.S. Individual Income Tax Return 2023");
}

function generateScheduleC(): Promise<Buffer> {
  return createPdf(`
SCHEDULE C - Profit or Loss From Business
(Form 1040)
Department of the Treasury - Internal Revenue Service
Tax Year 2023

Name: Marcus A. Chen
SSN: XXX-XX-8901
Business name: Chen Digital Solutions (sole proprietorship consulting)
Business address: 1847 Innovation Drive, Austin, TX 78701
Business code: 541511 (Custom Computer Programming)
Accounting method: Cash
EIN: 82-4567891

INCOME
1  Gross receipts                                    $245,000.00
2  Returns and allowances                              $2,500.00
3  Subtract line 2 from line 1                       $242,500.00
7  Gross income                                      $242,500.00

EXPENSES
8   Advertising                                        $8,400.00
9   Car and truck expenses                             $4,800.00
11  Contract labor                                    $45,000.00
13  Depreciation                                       $6,200.00
15  Insurance                                          $4,800.00
17  Legal and professional services                    $3,500.00
18  Office expense                                     $2,400.00
20a Rent (business property)                          $24,000.00
22  Supplies                                           $3,600.00
24a Travel                                             $6,800.00
24b Deductible meals                                   $4,500.00
25  Utilities                                          $3,600.00
26  Wages paid                                        $42,000.00
27a Other expenses                                     $3,400.00
28  Total expenses before home office                $163,000.00

29  Tentative profit                                  $79,500.00
30  Home office deduction                              $1,000.00
31  Net profit                                        $78,500.00

SCHEDULE SE - Self-Employment Tax
Net self-employment income                            $78,500.00
Self-employment tax                                   $11,090.00
Deductible part                                        $5,545.00
`, "SCHEDULE C - Profit or Loss From Business 2023");
}

function generate1120S(): Promise<Buffer> {
  return createPdf(`
Department of the Treasury - Internal Revenue Service
Form 1120-S  U.S. Income Tax Return for an S Corporation  2023

Corporation name: Chen Digital Solutions Inc.
EIN: 82-4567890
Date incorporated: 03/15/2019
Address: 1847 Innovation Drive, Austin, TX 78701
State of incorporation: Texas
Business activity code: 541511

A  S election effective date: 03/15/2019
B  Business activity: Computer programming
C  Number of shareholders: 1

INCOME
1a Gross receipts or sales                           $892,000.00
1b Returns and allowances                              $5,000.00
1c Net receipts                                      $887,000.00
2  Cost of goods sold (Schedule A)                   $156,000.00
3  Gross profit                                      $731,000.00
5  Other income                                        $4,500.00
6  Total income                                      $735,500.00

DEDUCTIONS
7   Compensation of officers                         $180,000.00
8   Salaries and wages                               $285,000.00
9   Repairs and maintenance                           $12,400.00
10  Bad debts                                          $3,200.00
11  Rents                                             $72,000.00
12  Taxes and licenses                                $18,500.00
13  Interest                                           $4,800.00
14  Depreciation                                      $28,500.00
16  Advertising                                       $15,600.00
17  Pension and profit-sharing                        $24,000.00
18  Employee benefit programs                         $38,400.00
19  Other deductions                                  $22,100.00
20  Total deductions                                 $704,500.00
21  Ordinary business income (loss)                   $31,000.00

SCHEDULE K - Shareholders' Pro Rata Share Items
1   Ordinary business income                          $31,000.00
4   Interest income                                    $4,500.00
8a  Net long-term capital gain                        $12,400.00
12a Charitable contributions                           $8,500.00

SCHEDULE L - Balance Sheets per Books
                           Beginning of Year    End of Year
Cash                          $125,000.00      $148,500.00
Accounts receivable           $156,000.00      $178,000.00
Less: Allowance                ($8,000.00)      ($9,500.00)
Other current assets           $12,000.00       $15,000.00
Total current assets          $285,000.00      $332,000.00
Fixed assets                  $185,000.00      $210,000.00
Less: Depreciation            ($65,000.00)     ($93,500.00)
Total assets                  $405,000.00      $448,500.00
Accounts payable               $45,000.00       $52,000.00
Other current liabilities      $28,000.00       $31,500.00
Long-term debt                 $60,000.00       $48,000.00
Total liabilities             $133,000.00      $131,500.00
Stockholders' equity          $272,000.00      $317,000.00
Total liabilities + equity    $405,000.00      $448,500.00

Officer Compensation:
  Marcus A. Chen - President/CEO                     $180,000.00
`, "FORM 1120-S - S Corporation Income Tax Return 2023");
}

function generatePnl(): Promise<Buffer> {
  return createPdf(`
CHEN DIGITAL SOLUTIONS INC.
PROFIT AND LOSS STATEMENT
For the Year Ended December 31, 2023

REVENUE
  Software Development Services              $645,000.00
  IT Consulting Services                     $198,000.00
  Maintenance & Support Contracts             $49,000.00
  TOTAL REVENUE                              $892,000.00
  Less: Returns / Credits                     ($5,000.00)
  NET REVENUE                                $887,000.00

COST OF GOODS SOLD
  Direct Labor                               $112,000.00
  Subcontractors                              $32,000.00
  Software Licenses (resold)                  $12,000.00
  TOTAL COGS                                 $156,000.00

GROSS PROFIT                                 $731,000.00
Gross Margin                                      82.4%

OPERATING EXPENSES
  Officer Compensation                       $180,000.00
  Salaries and Wages                         $285,000.00
  Rent                                        $72,000.00
  Employee Benefits                           $38,400.00
  Depreciation                                $28,500.00
  Pension/Profit-sharing                      $24,000.00
  Taxes and Licenses                          $18,500.00
  Advertising                                 $15,600.00
  Repairs and Maintenance                      $12,400.00
  Other Operating Expenses                    $22,100.00
  Bad Debt Expense                             $3,200.00
  Interest Expense                             $4,800.00
  TOTAL OPERATING EXPENSES                   $704,500.00

NET OPERATING INCOME                          $26,500.00
Other Income (Interest/Dividends)              $4,500.00

NET INCOME BEFORE TAX                         $31,000.00

Prepared by: Chen Digital Solutions Inc. - Internal Accounting
Period: January 1, 2023 - December 31, 2023
`, "PROFIT AND LOSS STATEMENT - Chen Digital Solutions Inc.");
}

function generateBalanceSheet(): Promise<Buffer> {
  return createPdf(`
CHEN DIGITAL SOLUTIONS INC.
BALANCE SHEET
As of December 31, 2023

ASSETS
CURRENT ASSETS
  Cash and Cash Equivalents                  $148,500.00
  Accounts Receivable                        $178,000.00
  Less: Allowance for Doubtful Accounts       ($9,500.00)
  Net Accounts Receivable                    $168,500.00
  Other Current Assets                        $15,000.00
  TOTAL CURRENT ASSETS                       $332,000.00

FIXED ASSETS
  Equipment and Furniture                    $210,000.00
  Less: Accumulated Depreciation             ($93,500.00)
  NET FIXED ASSETS                           $116,500.00

TOTAL ASSETS                                 $448,500.00

LIABILITIES AND EQUITY
CURRENT LIABILITIES
  Accounts Payable                            $52,000.00
  Accrued Expenses                            $31,500.00
  TOTAL CURRENT LIABILITIES                   $83,500.00

LONG-TERM LIABILITIES
  Term Loan (Bank of Austin)                  $48,000.00
  TOTAL LONG-TERM LIABILITIES                 $48,000.00

TOTAL LIABILITIES                            $131,500.00

STOCKHOLDERS' EQUITY
  Common Stock                                $10,000.00
  Retained Earnings                          $307,000.00
  TOTAL STOCKHOLDERS' EQUITY                 $317,000.00

TOTAL LIABILITIES + EQUITY                   $448,500.00

Current Ratio: 3.98
Debt-to-Equity: 0.41
`, "BALANCE SHEET - Chen Digital Solutions Inc.");
}

function generateBusinessBankStmt(): Promise<Buffer> {
  return createPdf(`
BANK OF AUSTIN
BUSINESS CHECKING ACCOUNT STATEMENT

Account: Chen Digital Solutions Inc.
Account Number: XXXX-XXXX-7823
Statement Period: 07/01/2023 - 12/31/2023

ACCOUNT SUMMARY
Opening Balance (07/01/2023):                   $125,400.00
Total Deposits:                                 $468,000.00
Total Withdrawals:                              $445,900.00
Ending Balance (12/31/2023):                    $147,500.00

MONTHLY DETAIL
Month        Deposits      Withdrawals    Ending Balance
Jul 2023     $78,000.00    $74,200.00     $129,200.00
Aug 2023     $72,000.00    $71,800.00     $129,400.00
Sep 2023     $85,000.00    $78,500.00     $135,900.00
Oct 2023     $78,000.00    $73,200.00     $140,700.00
Nov 2023     $72,000.00    $74,100.00     $138,600.00
Dec 2023     $83,000.00    $74,100.00     $147,500.00

SELECTED TRANSACTIONS - DECEMBER 2023
Date     Description                          Amount       Balance
12/01    Opening Balance                                   $138,600.00
12/03    WIRE IN - Client: Meridian Corp      $28,000.00   $166,600.00
12/05    ACH - Payroll                        -$24,500.00  $142,100.00
12/08    ACH - Rent 1847 Innovation Dr        -$6,000.00   $136,100.00
12/10    WIRE IN - Client: TechStart Inc      $22,000.00   $158,100.00
12/12    CHECK #504 - AWS Hosting             -$4,200.00   $153,900.00
12/15    ACH - Health Insurance               -$3,200.00   $150,700.00
12/18    WIRE IN - Client: DataFlow LLC       $18,000.00   $168,700.00
12/20    ACH - Payroll                        -$24,500.00  $144,200.00
12/22    DEBIT - Office Supplies              -$800.00     $143,400.00
12/28    WIRE IN - Client: Meridian Corp      $15,000.00   $158,400.00
12/29    ACH - Quarterly Tax Payment          -$10,900.00  $147,500.00

Average Daily Balance: $136,845.00
No NSF/Overdraft during period.
`, "BANK OF AUSTIN - Business Checking Statement");
}

function generate1040Williams(): Promise<Buffer> {
  return createPdf(`
Department of the Treasury - Internal Revenue Service
Form 1040  U.S. Individual Income Tax Return  2023

Filing Status: [X] Married filing jointly
Your first name: David R.     Last name: Williams    SSN: XXX-XX-3456
Spouse first name: Jennifer L.  Last name: Williams  SSN: XXX-XX-7891
Home address: 8900 Lakefront Blvd, Apt 12B
City: Miami    State: FL    ZIP: 33131

INCOME
1a  Wages, salaries, tips (W-2)                      $125,000
1z  Add lines 1a through 1h                          $125,000
2b  Taxable interest                                   $2,100
3b  Ordinary dividends                                 $4,500
7   Capital gain or (loss)                            ($8,200)
8   Other income (Schedule E rental: $45,000)         $45,000
9   Total income                                     $168,400
10  Adjustments to income                              $8,500
11  Adjusted gross income                            $159,900

DEDUCTIONS
12  Itemized deductions                               $32,500
15  Taxable income                                   $127,400

TAX AND CREDITS
16  Tax                                               $22,476
19  Child tax credit                                   $2,000
22  Subtract credits from tax                         $20,476
23  Other taxes                                        $6,750
24  Total tax                                         $27,226

PAYMENTS
25a Federal income tax withheld from W-2s             $25,000
25d Total federal tax withheld                        $25,000
26  Estimated tax payments                             $5,000
33  Total payments                                    $30,000

REFUND
34  Amount overpaid                                    $2,774
35a Refunded to you                                    $2,774
`, "Form 1040 - U.S. Individual Income Tax Return 2023");
}

function generateScheduleE(): Promise<Buffer> {
  return createPdf(`
SCHEDULE E - Supplemental Income and Loss
(Form 1040)
Department of the Treasury - Internal Revenue Service
Tax Year 2023

Name: David R. Williams
SSN: XXX-XX-3456

Part I - Rental Real Estate

Property A: 4520 NW 7th Street, Miami, FL 33126
Type: Multi-family (4 units)
Days rented: 365  Personal use days: 0

INCOME
3  Rents received                                    $96,000.00

EXPENSES
5   Advertising                                         $800.00
6   Auto and travel                                     $500.00
7   Cleaning and maintenance                          $4,200.00
8   Commissions                                       $4,800.00
9   Insurance                                         $6,500.00
10  Legal and professional fees                       $1,800.00
11  Management fees                                   $9,600.00
12  Mortgage interest                                $18,200.00
14  Repairs                                           $8,400.00
15  Supplies                                          $1,200.00
16  Taxes                                             $7,800.00
17  Utilities                                         $3,200.00
18  Depreciation                                     $12,500.00
19  Other                                             $1,500.00
20  Total expenses                                   $81,000.00
21  Net rental income (loss)                         $15,000.00

Property B: 1200 Brickell Ave #3005, Miami, FL 33131
Type: Condo (1 unit)
Rents received:                                      $36,000.00
Total expenses:                                       $6,000.00
Net rental income:                                   $30,000.00

TOTAL Schedule E net rental income:                  $45,000.00
(Property A: $15,000 + Property B: $30,000 = $45,000)
`, "SCHEDULE E - Supplemental Income and Loss 2023");
}

function generateBankStmtProblematic(): Promise<Buffer> {
  return createPdf(`
OCEANVIEW CREDIT UNION
JOINT CHECKING ACCOUNT

Account Holders: David R. Williams / Jennifer L. Williams
Account: XXXX-XXXX-9012
Period: 07/01/2023 - 12/31/2023

*** IMPORTANT NOTICE: This account had 2 NSF occurrences ***

SUMMARY
Beginning Balance:                               $18,420.33
Total Credits:                                  $142,800.00
Total Debits:                                   $128,450.67
Service Charges/Fees:                               $156.00
Ending Balance:                                  $32,613.66

MONTHLY DETAIL
Jul  Credits: $22,800  Debits: $21,400  End: $19,820.33
Aug  Credits: $22,800  Debits: $23,900  End: $18,720.33  * NSF 08/22
Sep  Credits: $24,300  Debits: $20,100  End: $22,920.33
Oct  Credits: $22,800  Debits: $21,800  End: $23,920.33
Nov  Credits: $22,800  Debits: $22,150  End: $24,570.33
Dec  Credits: $27,300  Debits: $19,100  End: $32,613.66  * large deposit

TRANSACTIONS - AUGUST 2023 (NSF MONTH)
08/01  Balance forward                                $19,820.33
08/03  ACH DEPOSIT - WILLIAMS PROPERTY MGMT  $6,200.00  $26,020.33
08/05  CHECK #892 - Miami-Dade Tax Collector  -$8,400.00 $17,620.33
08/10  DEBIT - Florida Power & Light          -$890.00   $16,730.33
08/12  ACH - State Farm Insurance             -$2,200.00 $14,530.33
08/15  ACH DEPOSIT - EMPLOYER                 $5,200.00  $19,730.33
08/17  CHECK #893 - Contractor J. Rivera      -$4,500.00 $15,230.33
08/18  WIRE OUT - Emergency roof repair       -$12,000.00 $3,230.33
08/22  CHECK #894 - HOA Brickell              -$1,800.00  $1,430.33
08/22  *** NSF FEE ***                        -$35.00     $1,395.33
08/23  ACH DEPOSIT - Tenant rent late         $3,200.00   $4,595.33
08/25  DEBIT - Home Depot supplies            -$2,400.00  $2,195.33
08/28  ACH DEPOSIT - WILLIAMS PROPERTY MGMT   $8,200.00  $10,395.33
08/29  ACH DEPOSIT - EMPLOYER                 $5,200.00  $15,595.33
08/30  DEBIT - Publix groceries               -$342.00   $15,253.33
08/31  Adjustment + other debits              $3,467.00   $18,720.33

NSF Occurrences: 2 (Aug 22, Nov 15)
Total fees charged: $156.00 ($70 NSF + $86 misc)
`, "OCEANVIEW CREDIT UNION - Joint Checking Statement");
}

function generateRentRoll(): Promise<Buffer> {
  return createPdf(`
RENT ROLL
Property: 4520 NW 7th Street, Miami, FL 33126
Type: Multi-Family Residential (4 units)
Owner: David R. Williams
As of: December 31, 2023

Unit   Tenant Name         Lease Start  Lease End    Monthly Rent  Status
----   ------------------  -----------  ----------   -----------   ------
1A     Maria Rodriguez     03/01/2022   02/28/2024   $2,200.00    Current
1B     James & Kim Park    07/15/2023   07/14/2024   $2,100.00    Current
2A     Antoine Davis       01/01/2023   12/31/2023   $1,800.00    Expired*
2B     Sarah Mitchell      09/01/2023   08/31/2024   $1,900.00    Current

* Unit 2A: Tenant month-to-month, renewal pending at $1,950/mo

MONTHLY INCOME SUMMARY
Gross Potential Rent (4 units):                    $8,000.00/mo
Vacancy Loss:                                          $0.00/mo
Effective Gross Income:                            $8,000.00/mo

ANNUAL PROJECTIONS
Gross Rental Income:                              $96,000.00/yr
Vacancy Reserve (5%):                             ($4,800.00/yr)
Net Rental Income:                                $91,200.00/yr

EXPENSE DETAIL (Annual)
Property Management (10%):                         $9,600.00
Insurance:                                         $6,500.00
Property Taxes:                                    $7,800.00
Maintenance & Repairs:                            $12,600.00
Utilities (common areas):                          $3,200.00
Total Operating Expenses:                         $39,700.00

NET OPERATING INCOME (NOI):                       $51,500.00/yr

Current Occupancy: 100% (4/4 units)
Average Rent: $2,000.00/unit/month
`, "RENT ROLL - 4520 NW 7th Street, Miami FL");
}

// ---------------------------------------------------------------------------
// Edge Case Document Generators
// ---------------------------------------------------------------------------

function generate1040MinimalPatel(): Promise<Buffer> {
  return createPdf(`
Department of the Treasury - Internal Revenue Service
Form 1040  U.S. Individual Income Tax Return  2023

Filing Status: [X] Single
Your first name: Priya A.    Last name: Patel    SSN: XXX-XX-6102
Home address: 305 Elm Street, Apt 4C
City: Columbus    State: OH    ZIP: 43215

Dependents: None

INCOME
1a  Wages, salaries, tips (W-2)                       $45,000
1z  Add lines 1a through 1h                           $45,000
2b  Taxable interest                                     $120
9   Total income                                      $45,120
10  Adjustments to income                                  $0
11  Adjusted gross income                             $45,120

DEDUCTIONS
12  Standard deduction                                $13,850
15  Taxable income                                    $31,270

TAX AND CREDITS
16  Tax                                                $3,498
24  Total tax                                          $3,498

PAYMENTS
25a Federal income tax withheld from W-2s              $5,400
25d Total federal tax withheld                         $5,400
33  Total payments                                     $5,400

REFUND
34  Amount overpaid                                    $1,902
35a Refunded to you                                    $1,902
`, "Form 1040 - U.S. Individual Income Tax Return 2023");
}

function generate1040MismatchJohnson(): Promise<Buffer> {
  return createPdf(`
Department of the Treasury - Internal Revenue Service
Form 1040  U.S. Individual Income Tax Return  2023

Filing Status: [X] Single
Your first name: Kevin M.    Last name: Johnson    SSN: XXX-XX-2789
Home address: 1455 Market Street, Unit 801
City: Denver    State: CO    ZIP: 80202

Dependents: None

INCOME
1a  Wages, salaries, tips (W-2)                      $150,000
1z  Add lines 1a through 1h                          $150,000
2b  Taxable interest                                   $1,800
3b  Ordinary dividends                                 $2,500
9   Total income                                     $154,300
10  Adjustments to income                              $3,000
11  Adjusted gross income                            $151,300

DEDUCTIONS
12  Standard deduction                                $13,850
15  Taxable income                                   $137,450

TAX AND CREDITS
16  Tax                                               $28,468
24  Total tax                                         $28,468

PAYMENTS
25a Federal income tax withheld from W-2s             $30,000
25d Total federal tax withheld                        $30,000
33  Total payments                                    $30,000

REFUND
34  Amount overpaid                                    $1,532
35a Refunded to you                                    $1,532
`, "Form 1040 - U.S. Individual Income Tax Return 2023");
}

function generateW2MismatchJohnson(): Promise<Buffer> {
  return createPdf(`
Form W-2  Wage and Tax Statement  2023
Department of the Treasury - Internal Revenue Service

a  Employee's SSN: XXX-XX-2789
b  Employer's EIN: 84-9876543
c  Employer: Rocky Mountain Analytics Inc.
   777 Pearl Street, Suite 300
   Denver, CO 80203
d  Control number: W2-2023-01987

e  Employee: Kevin M. Johnson
   1455 Market Street, Unit 801
   Denver, CO 80202

Box 1   Wages, tips, other compensation:        $120,000.00
Box 2   Federal income tax withheld:              $24,000.00
Box 3   Social security wages:                   $120,000.00
Box 4   Social security tax withheld:              $7,440.00
Box 5   Medicare wages and tips:                 $120,000.00
Box 6   Medicare tax withheld:                     $1,740.00
Box 12a Code D   401(k) contributions:             $6,000.00
Box 13  [X] Retirement plan
Box 15  State: CO    Employer state ID: 84-9876543
Box 16  State wages:                             $120,000.00
Box 17  State income tax:                          $5,280.00

NOTE: Box 1 shows $120,000 — DOES NOT MATCH 1040 line 1a of $150,000
Discrepancy: $30,000
`, "Form W-2 - Wage and Tax Statement 2023");
}

function generateBankStmtMismatchJohnson(): Promise<Buffer> {
  return createPdf(`
MOUNTAIN WEST CREDIT UNION
CHECKING ACCOUNT STATEMENT

Account Holder: Kevin M. Johnson
Account Number: XXXX-XXXX-5501
Statement Period: 07/01/2023 - 12/31/2023

ACCOUNT SUMMARY
Opening Balance (07/01/2023):                    $12,340.55
Total Deposits:                                  $58,200.00
Total Withdrawals:                               $51,890.33
Ending Balance (12/31/2023):                     $18,650.22

MONTHLY SUMMARY
Month        Deposits      Withdrawals    Ending Balance
Jul 2023     $9,200.00     $8,450.12      $13,090.43
Aug 2023     $9,200.00     $8,780.34      $13,510.09
Sep 2023     $10,200.00    $8,900.00      $14,810.09
Oct 2023     $9,200.00     $8,650.45      $15,359.64
Nov 2023     $9,200.00     $9,109.42      $15,450.22
Dec 2023     $11,200.00    $8,000.00      $18,650.22

TRANSACTION DETAIL - JULY 2023
Date     Description                          Amount       Balance
07/01    Opening Balance                                   $12,340.55
07/05    ACH DEPOSIT - ROCKY MTN ANALYTICS   $4,600.00    $16,940.55
07/08    DEBIT - Rent 1455 Market St         -$2,100.00   $14,840.55
07/12    DEBIT - Xcel Energy                 -$125.00     $14,715.55
07/15    DEBIT - Comcast                     -$89.99      $14,625.56
07/18    ACH DEPOSIT - ROCKY MTN ANALYTICS   $4,600.00    $19,225.56
07/20    ACH - Vanguard Transfer             -$2,000.00   $17,225.56
07/22    DEBIT - King Soopers Grocery        -$287.13     $16,938.43
07/25    DEBIT - State Farm Auto             -$148.00     $16,790.43
07/28    CHECK #301 - Misc                   -$3,700.00   $13,090.43

Avg Daily Balance: $15,143.52
No NSF/Overdraft during period.

NOTE: Monthly deposits avg ~$9,700 which implies ~$116K annual.
This is inconsistent with both 1040 ($150K) and W-2 ($120K).
`, "MOUNTAIN WEST CREDIT UNION - Checking Statement");
}

// ---------------------------------------------------------------------------
// Edge Case: Blank/Empty PDF (nearly empty — only a header, no data)
// ---------------------------------------------------------------------------

async function generateBlankPdf(): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Courier);
  const page = doc.addPage([612, 792]);
  page.drawText("INTENTIONALLY BLANK PAGE", { x: 180, y: 400, size: 12, font, color: rgb(0.7, 0.7, 0.7) });
  return Buffer.from(await doc.save());
}

function generate1040SimpleFoster(): Promise<Buffer> {
  return createPdf(`
Department of the Treasury - Internal Revenue Service
Form 1040  U.S. Individual Income Tax Return  2023

Filing Status: [X] Single
Your first name: Angela D.    Last name: Foster    SSN: XXX-XX-8834
Home address: 220 Pine Road
City: Portland    State: OR    ZIP: 97201

Dependents: None

INCOME
1a  Wages, salaries, tips (W-2)                       $68,000
1z  Add lines 1a through 1h                           $68,000
2b  Taxable interest                                     $340
9   Total income                                      $68,340
10  Adjustments to income                              $1,500
11  Adjusted gross income                             $66,840

DEDUCTIONS
12  Standard deduction                                $13,850
15  Taxable income                                    $52,990

TAX AND CREDITS
16  Tax                                                $7,058
24  Total tax                                          $7,058

PAYMENTS
25a Federal income tax withheld from W-2s             $10,200
25d Total federal tax withheld                        $10,200
33  Total payments                                    $10,200

REFUND
34  Amount overpaid                                    $3,142
35a Refunded to you                                    $3,142
`, "Form 1040 - U.S. Individual Income Tax Return 2023");
}

// ---------------------------------------------------------------------------
// Edge Case: Large Document (12-page bank statement with 6 months of detail)
// ---------------------------------------------------------------------------

function generateLargeBankStmtReeves(): Promise<Buffer> {
  const months = [
    { name: "July 2023", deposits: 18500, withdrawals: 15200, end: 42300 },
    { name: "August 2023", deposits: 18500, withdrawals: 16800, end: 44000 },
    { name: "September 2023", deposits: 19200, withdrawals: 14900, end: 48300 },
    { name: "October 2023", deposits: 18500, withdrawals: 17100, end: 49700 },
    { name: "November 2023", deposits: 18500, withdrawals: 15600, end: 52600 },
    { name: "December 2023", deposits: 20100, withdrawals: 16300, end: 56400 },
  ];

  const transactions = [
    "ACH DEPOSIT - REEVES CONSTRUCTION",
    "CHECK - Supplier: BuildRight Materials",
    "DEBIT - Home Depot Pro",
    "ACH - Insurance Premium",
    "WIRE IN - Client: Oakwood Homes",
    "DEBIT - Fuel/Fleet Card",
    "CHECK - Subcontractor: J. Martinez",
    "ACH - Equipment Lease Payment",
    "DEBIT - Office Supplies",
    "WIRE IN - Client: Metro Developers",
    "CHECK - Permit Fees",
    "DEBIT - Verizon Wireless",
    "ACH DEPOSIT - REEVES CONSTRUCTION",
    "CHECK - Payroll taxes",
    "DEBIT - Workers Comp Insurance",
    "WIRE IN - Client: Summit Properties",
    "CHECK - Utility payment",
    "ACH - Quarterly estimated tax",
    "DEBIT - Fuel/Fleet Card",
    "CHECK - Equipment rental",
  ];

  let text = `
PACIFIC COAST BANK
BUSINESS CHECKING ACCOUNT STATEMENT

Account: Reeves Construction LLC
Account Number: XXXX-XXXX-3847
Statement Period: 07/01/2023 - 12/31/2023

ACCOUNT SUMMARY
Opening Balance (07/01/2023):                    $39,000.00
Total Deposits:                                 $113,800.00
Total Withdrawals:                               $95,900.00
Ending Balance (12/31/2023):                     $56,400.00

MONTHLY SUMMARY
Month          Deposits      Withdrawals    Ending Balance
`;

  for (const m of months) {
    text += `${m.name.padEnd(15)}$${m.deposits.toLocaleString().padStart(10)}  $${m.withdrawals.toLocaleString().padStart(10)}  $${m.end.toLocaleString().padStart(10)}\n`;
  }

  // Generate detailed transactions for each month to make it 10+ pages
  let runningBalance = 39000;
  for (const m of months) {
    text += `\n${"=".repeat(70)}\nTRANSACTION DETAIL - ${m.name.toUpperCase()}\n${"=".repeat(70)}\n`;
    text += `Date     Description                              Amount       Balance\n`;
    text += `${"—".repeat(70)}\n`;

    const dayStart = 1;
    const perTxnDeposit = Math.round(m.deposits / 6);
    const perTxnWithdrawal = Math.round(m.withdrawals / 14);

    for (let i = 0; i < 20; i++) {
      const day = String(dayStart + i).padStart(2, "0");
      const txn = transactions[i % transactions.length];
      const isDeposit = i % 4 === 0 || i % 7 === 0;
      const amount = isDeposit ? perTxnDeposit : -perTxnWithdrawal;
      runningBalance += amount;
      const sign = amount >= 0 ? " " : "-";
      const absAmt = Math.abs(amount);
      text += `${m.name.split(" ")[0].substring(0, 2)}/${day}    ${txn.padEnd(40)} ${sign}$${absAmt.toLocaleString().padStart(10)}  $${runningBalance.toLocaleString().padStart(10)}\n`;
    }
  }

  text += `\nAverage Daily Balance: $${Math.round((39000 + 56400) / 2).toLocaleString()}\n`;
  text += `No NSF/Overdraft during period.\n`;

  return createPdf(text, "PACIFIC COAST BANK - Business Checking Statement");
}

function generate1040Reeves(): Promise<Buffer> {
  return createPdf(`
Department of the Treasury - Internal Revenue Service
Form 1040  U.S. Individual Income Tax Return  2023

Filing Status: [X] Married filing jointly
Your first name: James T.    Last name: Reeves    SSN: XXX-XX-5512
Spouse first name: Linda K.   Last name: Reeves    SSN: XXX-XX-9923
Home address: 4400 Oak Valley Drive
City: Sacramento    State: CA    ZIP: 95834

Dependents:
  Tyler Reeves        XXX-XX-3301    Son         [X] Child tax credit

INCOME
1a  Wages, salaries, tips (W-2)                      $110,000
1z  Add lines 1a through 1h                          $110,000
2b  Taxable interest                                   $2,400
3b  Ordinary dividends                                 $1,800
8   Other income (Schedule C: $95,000)                $95,000
9   Total income                                     $209,200
10  Adjustments to income                             $13,500
11  Adjusted gross income                            $195,700

DEDUCTIONS
12  Standard deduction                                $27,700
13  Qualified business income deduction               $19,000
15  Taxable income                                   $149,000

TAX AND CREDITS
16  Tax                                               $27,720
19  Child tax credit                                   $2,000
22  Subtract credits from tax                         $25,720
23  Other taxes (SE tax)                              $13,430
24  Total tax                                         $39,150

PAYMENTS
25a Federal income tax withheld from W-2s             $22,000
25d Total federal tax withheld                        $22,000
26  Estimated tax payments                            $20,000
33  Total payments                                    $42,000

REFUND
34  Amount overpaid                                    $2,850
35a Refunded to you                                    $2,850
`, "Form 1040 - U.S. Individual Income Tax Return 2023");
}

// ---------------------------------------------------------------------------
// Test Scenarios
// ---------------------------------------------------------------------------

interface TestScenario {
  name: string;
  difficulty: "easy" | "medium" | "hard" | "edge";
  deal: {
    borrowerName: string;
    loanAmount: number;
    loanPurpose: string;
    loanType: string;
    loanProgramId: string;
    proposedRate: number;
    proposedTerm: number;
    propertyAddress: string;
  };
  documents: Array<{ fileName: string; generatePdf: () => Promise<Buffer> }>;
}

function getTestScenarios(): TestScenario[] {
  return [
    {
      name: "EASY - Clean SBA 7(a) Personal Loan",
      difficulty: "easy",
      deal: {
        borrowerName: "Robert J. Thompson",
        loanAmount: 250000,
        loanPurpose: "Working capital and equipment purchase",
        loanType: "Term Loan",
        loanProgramId: "sba_7a",
        proposedRate: 0.0825,
        proposedTerm: 120,
        propertyAddress: "742 Evergreen Terrace, IL 62704",
      },
      documents: [
        { fileName: "thompson_1040_2023.pdf", generatePdf: generate1040Thompson },
        { fileName: "thompson_w2_2023.pdf", generatePdf: generateW2Thompson },
        { fileName: "thompson_bank_stmt_jul_dec_2023.pdf", generatePdf: generateBankStmtThompson },
      ],
    },
    {
      name: "MEDIUM - CRE Loan with S-Corp",
      difficulty: "medium",
      deal: {
        borrowerName: "Marcus A. Chen",
        loanAmount: 1500000,
        loanPurpose: "Commercial property acquisition",
        loanType: "Term Loan",
        loanProgramId: "commercial_cre",
        proposedRate: 0.0725,
        proposedTerm: 300,
        propertyAddress: "2200 Congress Ave, TX 78701",
      },
      documents: [
        { fileName: "chen_1040_2023.pdf", generatePdf: generate1040Chen },
        { fileName: "chen_schedule_c_2023.pdf", generatePdf: generateScheduleC },
        { fileName: "chen_digital_1120s_2023.pdf", generatePdf: generate1120S },
        { fileName: "chen_digital_pnl_2023.pdf", generatePdf: generatePnl },
        { fileName: "chen_digital_balance_sheet_2023.pdf", generatePdf: generateBalanceSheet },
        { fileName: "chen_digital_bank_stmt_2023.pdf", generatePdf: generateBusinessBankStmt },
      ],
    },
    {
      name: "HARD - Multi-Property Bridge Loan (Edge Cases)",
      difficulty: "hard",
      deal: {
        borrowerName: "David R. Williams",
        loanAmount: 3000000,
        loanPurpose: "Acquisition and renovation of multi-family property",
        loanType: "Bridge Loan",
        loanProgramId: "bridge",
        proposedRate: 0.1050,
        proposedTerm: 24,
        propertyAddress: "4520 NW 7th Street, FL 33126",
      },
      documents: [
        { fileName: "williams_1040_2023.pdf", generatePdf: generate1040Williams },
        { fileName: "williams_schedule_e_2023.pdf", generatePdf: generateScheduleE },
        { fileName: "williams_bank_stmt_jul_dec_2023.pdf", generatePdf: generateBankStmtProblematic },
        { fileName: "williams_rent_roll_nw7th.pdf", generatePdf: generateRentRoll },
      ],
    },
    {
      name: "EDGE - Minimal Documents",
      difficulty: "edge",
      deal: {
        borrowerName: "Priya A. Patel",
        loanAmount: 50000,
        loanPurpose: "Small business startup costs",
        loanType: "Term Loan",
        loanProgramId: "sba_7a",
        proposedRate: 0.0925,
        proposedTerm: 60,
        propertyAddress: "305 Elm Street, OH 43215",
      },
      documents: [
        { fileName: "patel_1040_2023.pdf", generatePdf: generate1040MinimalPatel },
      ],
    },
    {
      name: "EDGE - Mismatched Data",
      difficulty: "edge",
      deal: {
        borrowerName: "Kevin M. Johnson",
        loanAmount: 400000,
        loanPurpose: "Commercial equipment financing",
        loanType: "Term Loan",
        loanProgramId: "commercial_cre",
        proposedRate: 0.0800,
        proposedTerm: 84,
        propertyAddress: "1455 Market Street, CO 80202",
      },
      documents: [
        { fileName: "johnson_1040_2023.pdf", generatePdf: generate1040MismatchJohnson },
        { fileName: "johnson_w2_2023.pdf", generatePdf: generateW2MismatchJohnson },
        { fileName: "johnson_bank_stmt_jul_dec_2023.pdf", generatePdf: generateBankStmtMismatchJohnson },
      ],
    },
    {
      name: "EDGE - Mixed Valid/Blank Documents",
      difficulty: "edge",
      deal: {
        borrowerName: "Angela D. Foster",
        loanAmount: 75000,
        loanPurpose: "Small business working capital",
        loanType: "Term Loan",
        loanProgramId: "sba_7a",
        proposedRate: 0.0875,
        proposedTerm: 60,
        propertyAddress: "220 Pine Road, OR 97201",
      },
      documents: [
        { fileName: "foster_1040_2023.pdf", generatePdf: generate1040SimpleFoster },
        { fileName: "foster_blank_page.pdf", generatePdf: generateBlankPdf },
      ],
    },
    {
      name: "EDGE - Large Document Package (12+ pages)",
      difficulty: "edge",
      deal: {
        borrowerName: "James T. Reeves",
        loanAmount: 750000,
        loanPurpose: "Construction equipment and fleet expansion",
        loanType: "Term Loan",
        loanProgramId: "sba_7a",
        proposedRate: 0.0775,
        proposedTerm: 120,
        propertyAddress: "4400 Oak Valley Drive, CA 95834",
      },
      documents: [
        { fileName: "reeves_1040_2023.pdf", generatePdf: generate1040Reeves },
        { fileName: "reeves_business_bank_stmt_12pg_2023.pdf", generatePdf: generateLargeBankStmtReeves },
      ],
    },
  ];
}

// ---------------------------------------------------------------------------
// POST — Run stress tests
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  try {
    const org = await prisma.organization.upsert({
      where: { clerkOrgId: "test_org_stress_test" },
      create: { clerkOrgId: "test_org_stress_test", name: "OpenShut Test Organization" },
      update: {},
    });

    const user = await prisma.user.upsert({
      where: { clerkId: "test_user_stress_test" },
      create: { clerkId: "test_user_stress_test", email: "test@openshut.me", name: "Stress Test Runner", orgId: org.id },
      update: {},
    });

    const scenarios = getTestScenarios();
    const url = new URL(request.url);
    const scenarioFilter = url.searchParams.get("scenario");
    const filtered = scenarioFilter ? scenarios.filter((s) => s.difficulty === scenarioFilter) : scenarios;

    const results: Array<{ scenario: string; difficulty: string; dealId: string; documentCount: number; status: string }> = [];

    for (const scenario of filtered) {
      const deal = await prisma.deal.create({
        data: {
          borrowerName: scenario.deal.borrowerName,
          loanAmount: scenario.deal.loanAmount,
          loanPurpose: scenario.deal.loanPurpose,
          loanType: scenario.deal.loanType,
          loanProgramId: scenario.deal.loanProgramId,
          proposedRate: scenario.deal.proposedRate,
          proposedTerm: scenario.deal.proposedTerm,
          propertyAddress: scenario.deal.propertyAddress,
          orgId: org.id,
          userId: user.id,
        },
      });

      for (const doc of scenario.documents) {
        const pdfBuffer = await doc.generatePdf();
        const s3Key = `${org.id}/${deal.id}/${crypto.randomUUID()}-${doc.fileName}`;
        await uploadToS3(s3Key, pdfBuffer, "application/pdf");
        await prisma.document.create({
          data: { dealId: deal.id, fileName: doc.fileName, s3Key, fileSize: pdfBuffer.length, status: "PENDING" },
        });
      }

      await prisma.deal.update({
        where: { id: deal.id },
        data: { status: "PROCESSING_OCR", errorMessage: null, errorStep: null },
      });

      await inngest.send({ name: "deal/analyze", data: { dealId: deal.id, triggeredAt: Date.now() } });

      results.push({
        scenario: scenario.name,
        difficulty: scenario.difficulty,
        dealId: deal.id,
        documentCount: scenario.documents.length,
        status: "PIPELINE_TRIGGERED",
      });
    }

    return NextResponse.json({ message: `Stress test started: ${results.length} scenario(s)`, results, pollUrl: "/api/test/stress-test" });
  } catch (error) {
    console.error("Stress test error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// GET — Check status of test deals
// ---------------------------------------------------------------------------

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  try {
    const testUser = await prisma.user.findUnique({ where: { clerkId: "test_user_stress_test" } });
    if (!testUser) {
      return NextResponse.json({ message: "No test deals found. Run POST first." });
    }

    const deals = await prisma.deal.findMany({
      where: { userId: testUser.id },
      include: {
        documents: {
          select: {
            id: true, fileName: true, status: true, docType: true, ocrText: true,
            extractions: { select: { structuredData: true, model: true }, orderBy: { createdAt: "desc" as const }, take: 1 },
          },
        },
        analysis: {
          select: { riskScore: true, globalDscr: true, backEndDti: true, totalNetIncome: true, riskFlags: true },
        },
        verificationReport: {
          select: { overallStatus: true, mathPassed: true, mathFailed: true, crossDocPassed: true, crossDocFailed: true },
        },
        reviewItems: { select: { id: true, fieldPath: true, checkType: true, status: true, description: true } },
        dealTerms: { select: { approvedAmount: true, interestRate: true, termMonths: true, complianceStatus: true, status: true } },
        generatedDocuments: { select: { docType: true, status: true, legalReviewStatus: true, verificationStatus: true } },
        creditMemo: { select: { s3Key: true, version: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const summary = deals.map((deal) => ({
      dealId: deal.id,
      borrowerName: deal.borrowerName,
      loanAmount: deal.loanAmount ? Number(deal.loanAmount) : null,
      loanProgramId: deal.loanProgramId,
      status: deal.status,
      errorMessage: deal.errorMessage,
      errorStep: deal.errorStep,
      documents: deal.documents,
      verification: deal.verificationReport,
      reviewItems: deal.reviewItems,
      analysis: deal.analysis
        ? {
            riskScore: deal.analysis.riskScore,
            globalDscr: deal.analysis.globalDscr,
            backEndDti: deal.analysis.backEndDti,
            totalNetIncome: deal.analysis.totalNetIncome ? Number(deal.analysis.totalNetIncome) : null,
            riskFlagCount: Array.isArray(deal.analysis.riskFlags) ? (deal.analysis.riskFlags as unknown[]).length : 0,
          }
        : null,
      dealTerms: deal.dealTerms,
      generatedDocuments: deal.generatedDocuments,
      creditMemo: deal.creditMemo,
    }));

    const statusCounts = deals.reduce(
      (acc, d) => {
        acc[d.status] = (acc[d.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return NextResponse.json({ totalDeals: deals.length, statusCounts, deals: summary });
  } catch (error) {
    console.error("Stress test status error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH — Auto-approve all pending reviews and terms for test deals
// ---------------------------------------------------------------------------

export async function PATCH() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  try {
    const testUser = await prisma.user.findUnique({ where: { clerkId: "test_user_stress_test" } });
    if (!testUser) {
      return NextResponse.json({ message: "No test deals found." });
    }

    const deals = await prisma.deal.findMany({
      where: { userId: testUser.id },
      select: { id: true, status: true },
    });

    const results: Array<{ dealId: string; action: string }> = [];

    // Auto-approve review items for deals at NEEDS_REVIEW
    const reviewDeals = deals.filter((d) => d.status === "NEEDS_REVIEW");
    for (const deal of reviewDeals) {
      const updated = await prisma.reviewItem.updateMany({
        where: { dealId: deal.id, status: "PENDING" },
        data: { status: "CONFIRMED", resolvedBy: testUser.id, resolvedAt: new Date() },
      });

      // Always send the event — even if 0 items updated (deals stuck with no pending items)
      await inngest.send({ name: "deal/review-complete", data: { dealId: deal.id, triggeredAt: Date.now() } });
      results.push({ dealId: deal.id, action: updated.count > 0 ? `confirmed ${updated.count} review items` : "re-triggered (0 pending)" });
    }

    // Auto-approve terms for deals at NEEDS_TERM_REVIEW
    const termDeals = deals.filter((d) => d.status === "NEEDS_TERM_REVIEW");
    for (const deal of termDeals) {
      await inngest.send({ name: "deal/terms-approved", data: { dealId: deal.id, triggeredAt: Date.now() } });
      results.push({ dealId: deal.id, action: "terms approved" });
    }

    return NextResponse.json({
      message: `Auto-approved ${results.length} deal(s)`,
      results,
    });
  } catch (error) {
    console.error("Stress test auto-approve error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE — Clean up all test data
// ---------------------------------------------------------------------------

export async function DELETE() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  try {
    const testUser = await prisma.user.findUnique({ where: { clerkId: "test_user_stress_test" } });
    if (!testUser) {
      return NextResponse.json({ message: "No test data to clean up." });
    }

    const testOrg = await prisma.organization.findUnique({ where: { clerkOrgId: "test_org_stress_test" } });

    // Find all test deals to report counts
    const deals = await prisma.deal.findMany({
      where: { userId: testUser.id },
      select: { id: true },
    });
    const dealIds = deals.map((d) => d.id);

    // Delete in dependency order — child tables first
    // Most have onDelete: Cascade on the Deal relation, but we delete explicitly for counts
    const deleted = {
      conditions: 0,
      generatedDocuments: 0,
      creditMemos: 0,
      dealTerms: 0,
      propertyDetails: 0,
      reviewItems: 0,
      analyses: 0,
      verificationReports: 0,
      extractions: 0,
      documents: 0,
      deals: 0,
      users: 0,
      organizations: 0,
    };

    if (dealIds.length > 0) {
      deleted.conditions = (await prisma.condition.deleteMany({ where: { dealId: { in: dealIds } } })).count;
      deleted.generatedDocuments = (await prisma.generatedDocument.deleteMany({ where: { dealId: { in: dealIds } } })).count;
      deleted.creditMemos = (await prisma.creditMemo.deleteMany({ where: { dealId: { in: dealIds } } })).count;
      deleted.dealTerms = (await prisma.dealTerms.deleteMany({ where: { dealId: { in: dealIds } } })).count;
      deleted.propertyDetails = (await prisma.propertyDetails.deleteMany({ where: { dealId: { in: dealIds } } })).count;
      deleted.reviewItems = (await prisma.reviewItem.deleteMany({ where: { dealId: { in: dealIds } } })).count;
      deleted.analyses = (await prisma.analysis.deleteMany({ where: { dealId: { in: dealIds } } })).count;
      deleted.verificationReports = (await prisma.verificationReport.deleteMany({ where: { dealId: { in: dealIds } } })).count;
      deleted.extractions = (await prisma.extraction.deleteMany({ where: { dealId: { in: dealIds } } })).count;
      deleted.documents = (await prisma.document.deleteMany({ where: { dealId: { in: dealIds } } })).count;
      deleted.deals = (await prisma.deal.deleteMany({ where: { id: { in: dealIds } } })).count;
    }

    // Delete test user and org
    deleted.users = (await prisma.user.deleteMany({ where: { clerkId: "test_user_stress_test" } })).count;
    if (testOrg) {
      deleted.organizations = (await prisma.organization.deleteMany({ where: { clerkOrgId: "test_org_stress_test" } })).count;
    }

    const totalDeleted = Object.values(deleted).reduce((sum, n) => sum + n, 0);

    return NextResponse.json({ message: `Cleanup complete. ${totalDeleted} records deleted.`, deleted });
  } catch (error) {
    console.error("Stress test cleanup error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
