# NPD Tracker - User Guide

**Version**: 1.0  
**Last Updated**: November 1, 2025  
**Target Audience**: End users (PPTK, Verifikator, Bendahara, Admin)

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Dashboard Overview](#dashboard-overview)
4. [RKA Management](#rka-management)
5. [NPD Creation](#npd-creation)
6. [NPD Verification](#npd-verification)
7. [SP2D Management](#sp2d-management)
8. [Performance Tracking](#performance-tracking)
9. [Reports & Export](#reports--export)
10. [File Management](#file-management)
11. [Troubleshooting](#troubleshooting)

---

## Introduction

### What is NPD Tracker?

NPD Tracker is a comprehensive financial management system for Indonesian government organizations (OPD/Dinas) to manage:

- **RKA (Rencana Kerja Anggaran)**: Annual budget planning
- **NPD (Nota Pencairan Dana)**: Fund disbursement requests
- **SP2D (Surat Perintah Pencairan Dana)**: Fund disbursement orders
- **Performance Indicators**: Activity performance tracking
- **Budget Realization**: Real-time budget utilization monitoring

### Key Features

- ✅ **Role-Based Access Control**: Different permissions for PPTK, Verifikator, Bendahara, Admin
- ✅ **Real-Time Updates**: Instant synchronization across all users via Convex
- ✅ **Document Management**: Secure file upload and storage
- ✅ **PDF Generation**: Automated PDF reports for NPD, SP2D, and quarterly reports
- ✅ **Email Notifications**: Automatic notifications for workflow events
- ✅ **Data Export**: CSV and Excel export for all reports
- ✅ **Audit Trail**: Complete history of all actions

### User Roles

| Role | Permissions | Typical Users |
|------|-------------|---------------|
| **PPTK** | Create and submit NPD, upload documents, view reports | Program managers, project leads |
| **Verifikator** | Verify NPD documents, review submissions | Finance verifiers, compliance officers |
| **Bendahara** | Approve/finalize NPD, create SP2D, approve performance | Treasurers, finance directors |
| **Admin** | Full system access, user management, configuration | System administrators, IT staff |
| **Viewer** | Read-only access to reports and data | Auditors, stakeholders |

---

## Getting Started

### 1. Accessing the System

1. Open your web browser (Chrome, Firefox, Safari, or Edge)
2. Navigate to your organization's NPD Tracker URL (e.g., `https://npd-tracker.vercel.app`)
3. You will be redirected to the login page

### 2. Logging In

NPD Tracker uses **Clerk** for secure authentication.

**Steps**:
1. Click **"Sign In"** button
2. Enter your email address
3. Choose your authentication method:
   - **Email Code**: Receive a one-time code via email
   - **Password**: If you've set up a password
   - **Google/Microsoft**: If enabled by your organization
4. Complete the authentication
5. You will be redirected to the dashboard

**First-Time Login**:
- If this is your first time, you may need to verify your email address
- Check your inbox for a verification email from Clerk
- Click the verification link
- Complete your profile setup

### 3. Selecting Your Organization

If you belong to multiple organizations:

1. Click the **organization selector** in the top navigation bar
2. Select your active organization from the dropdown
3. The system will reload with data specific to that organization

**Note**: All data (NPD, RKA, SP2D) is scoped to your selected organization.

### 4. Navigating the Interface

**Main Navigation Menu** (left sidebar or top bar):
- **Dashboard**: Overview of KPIs, charts, and recent activity
- **RKA**: Budget planning and hierarchy
- **NPD**: Fund disbursement requests
- **SP2D**: Fund disbursement orders
- **Performance**: Performance indicator tracking
- **Reports**: Comprehensive reports and analytics
- **Settings**: User preferences and notifications

**User Menu** (top right):
- Profile settings
- Notification preferences
- Organization settings (Admin only)
- Sign out

---

## Dashboard Overview

The dashboard provides a real-time overview of your organization's financial status.

### Key Performance Indicators (KPIs)

**1. Total Pagu**
- Total allocated budget for the fiscal year
- Displayed in Indonesian Rupiah (Rp)
- Color-coded: Blue

**2. Total Realisasi**
- Total budget utilized (via SP2D)
- Updated in real-time when SP2D is created
- Color-coded: Green

**3. Sisa Pagu**
- Remaining budget available
- Calculated as: `Total Pagu - Total Realisasi`
- Color-coded: Orange (warning if <20%)

**4. Persentase Realisasi**
- Percentage of budget utilized
- Calculated as: `(Total Realisasi / Total Pagu) × 100`
- Color-coded:
  - Green: >80% (good utilization)
  - Yellow: 50-80% (moderate)
  - Red: <50% (low utilization)

**5. Total NPD**
- Count of NPD documents by status
- Breakdown: Draft, Diajukan, Diverifikasi, Final

### Charts and Visualizations

**Budget vs Realization Chart** (Bar Chart):
- Compares allocated budget (Pagu) vs actual spending (Realisasi)
- Grouped by Program or Kegiatan
- Powered by Recharts

**Monthly Trend Chart** (Line Chart):
- Shows budget utilization over time
- Helps identify spending patterns
- Useful for forecasting

**Top Programs Chart** (Pie Chart):
- Shows budget distribution across programs
- Identifies largest budget allocations

### Recent Activity

- Last 10 NPD submissions
- Recent SP2D creations
- Pending approvals
- System notifications

### Fiscal Year Filter

- Change fiscal year using the dropdown in the top right
- Data updates automatically when year is changed
- Defaults to current fiscal year

### Export Dashboard Data

1. Click **"Export"** button in the top right
2. Choose format:
   - **CSV**: For data analysis in Excel/Google Sheets
   - **Excel**: For formatted reports with multiple sheets
3. File downloads automatically
4. Filename format: `Dashboard_Report_YYYY-MM-DD.xlsx`

---

## RKA Management

RKA (Rencana Kerja Anggaran) is the annual budget plan organized in a hierarchy:

**Hierarchy**:
```
Organization
└── Program
    └── Kegiatan
        └── Sub-Kegiatan
            └── Account (Rekening)
```

### Viewing RKA Hierarchy

1. Navigate to **RKA** in the main menu
2. You will see the budget hierarchy tree
3. Click **▶** to expand/collapse levels
4. Each level shows:
   - Name and code
   - Total Pagu (allocated budget)
   - Total Realisasi (spent amount)
   - Sisa Pagu (remaining budget)
   - Persentase Realisasi (utilization %)

### Searching RKA

**Search by Name**:
1. Enter search term in the search box
2. Results filter in real-time
3. Highlights matching items

**Search by Code**:
1. Enter account code (e.g., "5.1.02.01.01.0001")
2. System finds exact or partial matches

**Filter by Level**:
- Use dropdown to filter by Program, Kegiatan, Sub-Kegiatan, or Account

### Importing RKA Data

**Prerequisites** (Admin only):
- CSV file with correct format
- Columns: `kode`, `nama`, `pagu`, `level`, `parent_kode`

**Steps**:
1. Click **"Import RKA"** button
2. Select CSV file from your computer
3. System validates the file:
   - Checks for required columns
   - Validates budget amounts
   - Checks for duplicate codes
4. Review import preview
5. Click **"Confirm Import"**
6. Wait for import to complete
7. Verify data in RKA hierarchy

**CSV Format Example**:
```csv
kode,nama,pagu,level,parent_kode
1,Program Pelayanan Administrasi Perkantoran,1000000000,program,
1.01,Kegiatan Penyediaan Jasa Surat Menyurat,500000000,kegiatan,1
1.01.01,Sub-Kegiatan Penyediaan Peralatan dan Perlengkapan Kantor,250000000,subkegiatan,1.01
5.1.02.01.01.0001,Belanja Alat Tulis Kantor,50000000,account,1.01.01
```

### Exporting RKA Data

1. Click **"Export"** button
2. Choose format: CSV or Excel
3. Select fiscal year
4. File downloads with complete RKA hierarchy
5. Includes: Code, Name, Pagu, Realisasi, Sisa Pagu, Persentase

---

## NPD Creation

NPD (Nota Pencairan Dana) is a fund disbursement request document.

### NPD Types

- **UP (Uang Persediaan)**: Advance funds
- **GU (Ganti Uang)**: Reimbursement
- **TU (Tambah Uang)**: Additional funds
- **LS (Langsung)**: Direct payment

### Creating a New NPD

**Step 1: Navigate to NPD Builder**
1. Click **"NPD"** in main menu
2. Click **"Create New NPD"** button
3. NPD Builder form opens

**Step 2: Fill NPD Header Information**

Required fields:
- **Jenis NPD**: Select type (UP, GU, TU, LS)
- **Tanggal NPD**: NPD date (defaults to today)
- **Maksud**: Purpose/description of the fund request
- **Dasar**: Legal basis or reference document
- **Untuk**: Intended use or beneficiary

Optional fields:
- **Catatan**: Additional notes
- **Referensi**: Reference number (e.g., contract number)

**Step 3: Add Account Lines**

1. Click **"Add Line"** button
2. Select **Sub-Kegiatan** from dropdown
   - Only sub-kegiatans with available budget (sisa pagu > 0) are shown
3. Select **Account (Rekening)** from dropdown
   - Accounts are filtered by selected sub-kegiatan
   - Shows current sisa pagu for each account
4. Enter **Nilai (Amount)**
   - Must be ≤ sisa pagu
   - System validates in real-time
5. Enter **Keterangan (Description)** for the line item
6. Click **"Add"** to add the line

**Repeat** for multiple account lines.

**Step 4: Review NPD Summary**

- Total NPD amount is calculated automatically
- Review all line items for accuracy
- Check that amounts don't exceed available budget

**Step 5: Upload Supporting Documents**

1. Click **"Upload Attachment"** button
2. Select document type:
   - RAB (Budget Plan)
   - BAST (Handover Document)
   - Kontrak (Contract)
   - Kwitansi (Receipt)
   - Other
3. Choose file from your computer
   - Supported formats: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG
   - Max file size: 10 MB
4. Add description (optional)
5. Click **"Upload"**
6. File uploads with progress indicator
7. Repeat for multiple attachments

**Step 6: Save as Draft**

1. Click **"Save as Draft"** button
2. NPD is saved with status "Draft"
3. You can edit it later before submission

**Step 7: Submit for Verification**

1. Review all information carefully
2. Click **"Submit for Verification"** button
3. Confirm submission in dialog
4. NPD status changes to "Diajukan" (Submitted)
5. Email notification sent to Verifikator/Bendahara
6. NPD is now locked for editing (cannot modify)

### Editing a Draft NPD

1. Navigate to **NPD** list
2. Find NPD with status "Draft"
3. Click on NPD to open detail view
4. Click **"Edit"** button
5. Make changes to header, lines, or attachments
6. Click **"Save"** to update

**Note**: Only Draft NPDs can be edited. Once submitted, NPDs are locked.

### Viewing NPD Details

1. Click on any NPD in the list
2. Detail view shows:
   - Header information
   - All line items with amounts
   - Total NPD amount
   - Attached documents (with download links)
   - Status and workflow history
   - Approval notes (if any)
   - SP2D references (if finalized)

### NPD Status Workflow

```
Draft → Diajukan → Diverifikasi → Final
         ↓            ↓
      Rejected    Rejected
```

**Status Descriptions**:
- **Draft**: Created but not submitted
- **Diajukan**: Submitted, awaiting verification
- **Diverifikasi**: Verified, awaiting finalization
- **Final**: Finalized, ready for SP2D creation
- **Rejected**: Rejected by Verifikator or Bendahara

### Generating NPD PDF

1. Open NPD detail view
2. Click **"Generate PDF"** button
3. PDF is generated with:
   - Organization header and logo
   - NPD details and line items
   - Signatures section
   - Watermark (if not finalized)
4. PDF downloads automatically
5. Filename: `NPD_{nomorNPD}_{date}.pdf`

---

## NPD Verification

**Role Required**: Verifikator or Bendahara

### Verification Queue

1. Navigate to **NPD** list
2. Filter by status: **"Diajukan"** (Submitted)
3. NPDs awaiting verification are listed
4. Click on NPD to open verification view

### Verification Checklist

The verification checklist ensures all requirements are met:

**Document Completeness**:
- [ ] RAB (Budget Plan) attached
- [ ] Supporting documents complete
- [ ] All required signatures present

**Budget Validation**:
- [ ] Amounts match budget allocation
- [ ] No budget overruns
- [ ] Account codes are correct

**Compliance**:
- [ ] Legal basis is valid
- [ ] Purpose aligns with program objectives
- [ ] Follows procurement regulations

**Data Accuracy**:
- [ ] Calculations are correct
- [ ] Dates are valid
- [ ] Beneficiary information is complete

### Verifying an NPD

**Step 1: Review NPD Details**
1. Read the maksud (purpose) and dasar (legal basis)
2. Review all line items and amounts
3. Download and review attached documents
4. Check budget availability in RKA

**Step 2: Complete Verification Checklist**
1. Check each item in the checklist
2. All items must be checked to proceed
3. If any item fails, note the issue

**Step 3: Add Verification Notes**
1. Enter notes in the "Catatan Verifikasi" field
2. Include any observations or recommendations
3. Notes are visible to all users

**Step 4: Approve or Reject**

**To Approve**:
1. Click **"Verify NPD"** button
2. Confirm verification in dialog
3. NPD status changes to "Diverifikasi"
4. Email notification sent to creator
5. NPD moves to finalization queue

**To Reject**:
1. Click **"Reject NPD"** button
2. Enter rejection reason (required)
3. Confirm rejection in dialog
4. NPD status changes to "Rejected"
5. Email notification sent to creator with reason
6. Creator can revise and resubmit

### Finalizing an NPD

**Role Required**: Bendahara

**Prerequisites**:
- NPD must be in "Diverifikasi" status
- All verification checks passed

**Steps**:
1. Open verified NPD
2. Review verification notes
3. Click **"Finalize NPD"** button
4. Confirm finalization
5. NPD status changes to "Final"
6. Email notification sent to all stakeholders
7. NPD is now ready for SP2D creation

**Note**: Finalized NPDs cannot be edited or deleted. They are permanently locked.

---

## SP2D Management

SP2D (Surat Perintah Pencairan Dana) is the fund disbursement order that actualizes budget realization.

### Understanding SP2D Distribution

When an SP2D is created for an NPD:
1. The SP2D amount (`nilaiCair`) is distributed **proportionally** across all NPD line items
2. Each account's realization is calculated as:
   ```
   Realisasi = (Account Amount / Total NPD Amount) × SP2D Amount
   ```
3. Rounding errors are handled to ensure the sum equals `nilaiCair`
4. RKA account `sisaPagu` is reduced by the realization amount
5. RKA account `realisasiTahun` is increased by the realization amount

**Example**:
- NPD Total: Rp 10,000,000
- Line 1: Rp 6,000,000 (60%)
- Line 2: Rp 4,000,000 (40%)
- SP2D Amount: Rp 8,000,000
- Distribution:
  - Line 1 Realisasi: Rp 4,800,000 (60% of 8M)
  - Line 2 Realisasi: Rp 3,200,000 (40% of 8M)

### Creating an SP2D

**Role Required**: Bendahara

**Prerequisites**:
- NPD must be in "Final" status
- NPD must have available balance (not fully realized)

**Steps**:

**Step 1: Navigate to SP2D Creation**
1. Click **"SP2D"** in main menu
2. Click **"Create SP2D"** button
3. SP2D creation form opens

**Step 2: Select NPD**
1. Select finalized NPD from dropdown
2. Only NPDs with status "Final" are shown
3. NPD details load automatically:
   - Total NPD amount
   - Already realized amount
   - Remaining balance
   - Line items

**Step 3: Enter SP2D Details**

Required fields:
- **No. SP2D**: SP2D number (e.g., "SP2D-001/2025")
- **Tanggal SP2D**: SP2D date
- **Nilai Cair**: Disbursement amount
  - Must be ≤ remaining NPD balance
  - System validates in real-time

Optional fields:
- **No. SPM**: SPM number (if applicable)
- **Catatan**: Additional notes

**Step 4: Preview Distribution**
1. System calculates proportional distribution
2. Preview shows:
   - Each account line
   - Calculated realization amount
   - Updated sisa pagu
3. Review for accuracy

**Step 5: Submit SP2D**
1. Click **"Create SP2D"** button
2. Confirm creation in dialog
3. SP2D is created
4. Realizations are recorded
5. RKA accounts are updated (real-time)
6. Email notification sent to finance team
7. Dashboard KPIs update automatically

### Viewing SP2D History

1. Navigate to **SP2D** list
2. All SP2D records are displayed in a table
3. Columns:
   - No. SP2D
   - No. SPM
   - NPD Number
   - Tanggal SP2D
   - Nilai Cair
   - Status
   - Actions

### Filtering and Searching SP2D

**Filter by Date Range**:
1. Select start date
2. Select end date
3. Click **"Filter"**
4. Results update automatically

**Search by Number**:
1. Enter SP2D number or NPD number in search box
2. Results filter in real-time

**Filter by Status**:
- Active: SP2D that are currently valid
- Deleted: Soft-deleted SP2D (Admin only)

### Editing an SP2D

**Role Required**: Bendahara or Admin

**Steps**:
1. Open SP2D detail view
2. Click **"Edit"** button
3. Modify fields:
   - No. SPM
   - No. SP2D
   - Tanggal SP2D
   - Nilai Cair (recalculates distribution)
   - Catatan
4. Review updated distribution preview
5. Click **"Save Changes"**
6. Confirm in dialog
7. System:
   - Reverts old realizations
   - Recalculates new distribution
   - Updates RKA accounts
   - Creates audit log entry

**Note**: Editing SP2D amount triggers full recalculation of realizations.

### Deleting an SP2D

**Role Required**: Admin

**Warning**: Deleting an SP2D reverts all budget realizations. Use with caution.

**Steps**:
1. Open SP2D detail view
2. Click **"Delete"** button
3. Read warning message carefully
4. Enter admin password for confirmation
5. Click **"Confirm Delete"**
6. System:
   - Marks SP2D as deleted (soft delete)
   - Reverts all realizations
   - Restores RKA account sisa pagu
   - Creates audit log entry
7. SP2D is hidden from normal view

**Restoring a Deleted SP2D**:
1. Admin can view deleted SP2D
2. Click **"Restore"** button
3. Confirm restoration
4. System re-applies realizations

### Generating SP2D PDF

1. Open SP2D detail view
2. Click **"Generate PDF"** button
3. PDF is generated with:
   - Organization header
   - SP2D details
   - NPD reference
   - Distribution breakdown by account
   - Signatures section
4. PDF downloads automatically
5. Filename: `SP2D_{noSP2D}_{date}.pdf`

---

## Performance Tracking

Performance tracking monitors the achievement of activity indicators.

### Understanding Performance Indicators

Each Sub-Kegiatan can have multiple performance indicators:
- **Indikator**: Name of the indicator (e.g., "Jumlah Dokumen Terproses")
- **Target**: Target value for the period
- **Realisasi**: Actual achievement
- **Satuan**: Unit of measurement (e.g., "dokumen", "orang", "kegiatan")
- **Periode**: Time period (Q1, Q2, Q3, Q4, or monthly)
- **% Capaian**: Achievement percentage (auto-calculated)

### Recording Performance

**Role Required**: PPTK

**Steps**:

**Step 1: Navigate to Performance**
1. Click **"Performance"** in main menu
2. Click **"Record Performance"** button

**Step 2: Select Sub-Kegiatan**
1. Choose Sub-Kegiatan from dropdown
2. Existing indicators for that sub-kegiatan load

**Step 3: Enter Performance Data**

Required fields:
- **Indikator**: Select existing or create new
- **Target**: Target value
- **Realisasi**: Actual achievement
- **Satuan**: Unit of measurement
- **Periode**: Select period (Q1, Q2, Q3, Q4)

Optional fields:
- **Keterangan**: Additional notes
- **Bukti**: Upload evidence file (PDF, image, document)

**Step 4: Upload Evidence (Optional)**
1. Click **"Upload Evidence"** button
2. Select file (max 10 MB)
3. Supported formats: PDF, JPG, PNG, DOC, DOCX
4. File uploads with progress indicator

**Step 5: Submit for Approval**
1. Review all information
2. Click **"Submit"** button
3. Performance log status: "Pending"
4. Email notification sent to Bendahara
5. % Capaian is auto-calculated:
   ```
   % Capaian = (Realisasi / Target) × 100
   ```

### Viewing Performance Logs

1. Navigate to **Performance** list
2. Filter by:
   - **Status**: Pending, Approved, Rejected
   - **Period**: Q1, Q2, Q3, Q4
   - **Sub-Kegiatan**: Specific activity
3. Search by indicator name
4. Click on log to view details

### Performance Approval

**Role Required**: Bendahara

**Steps**:

**Step 1: Open Pending Performance Log**
1. Navigate to Performance list
2. Filter by status: "Pending"
3. Click on performance log

**Step 2: Review Performance Data**
1. Check target vs realisasi
2. Review % capaian (color-coded):
   - 🟢 Green: ≥80% (good)
   - 🟡 Yellow: 50-79% (moderate)
   - 🔴 Red: <50% (low)
3. Download and review evidence file
4. Verify data accuracy

**Step 3: Approve or Reject**

**To Approve**:
1. Click **"Approve"** button
2. Enter approval notes (optional)
3. Confirm approval
4. Status changes to "Approved"
5. Email notification sent to PPTK
6. Performance data is finalized

**To Reject**:
1. Click **"Reject"** button
2. Enter rejection reason (required)
3. Confirm rejection
4. Status changes to "Rejected"
5. Email notification sent to PPTK with reason
6. PPTK can revise and resubmit

### Performance Dashboard Widget

The main dashboard includes performance widgets:

**Top Performing Indicators**:
- Shows indicators with highest % capaian
- Limited to top 5
- Color-coded by achievement level

**Indicators Needing Approval**:
- Count of pending performance logs
- Click to navigate to approval queue

**Performance Trend Chart**:
- Line chart showing % capaian over quarters
- Helps identify trends and patterns
- Useful for forecasting

---

## Reports & Export

### Available Reports

**1. NPD Report**
- List of all NPD documents
- Filters: Status, Date Range, Jenis, Sub-Kegiatan
- Columns: No. NPD, Tanggal, Jenis, Maksud, Total, Status
- Export: CSV, Excel, PDF

**2. SP2D Report**
- List of all SP2D records
- Filters: Date Range, NPD
- Columns: No. SP2D, No. SPM, Tanggal, NPD, Nilai Cair
- Export: CSV, Excel, PDF

**3. Realization Report**
- Budget realization by account
- Filters: Program, Kegiatan, Sub-Kegiatan, Date Range
- Columns: Account, Pagu, Realisasi, Sisa Pagu, %
- Export: CSV, Excel

**4. Quarterly Report**
- Comprehensive quarterly performance report
- Includes: Budget summary, NPD summary, Performance summary
- Charts: Budget utilization, Top programs, Performance trends
- Export: PDF (formatted), Excel (data)

**5. Performance Report**
- Performance indicator achievement report
- Filters: Period, Sub-Kegiatan, Status
- Columns: Indicator, Target, Realisasi, % Capaian, Status
- Export: CSV, Excel

### Generating Reports

**Step 1: Navigate to Reports**
1. Click **"Reports"** in main menu
2. Select report type from tabs

**Step 2: Apply Filters**
1. Select fiscal year
2. Choose date range (if applicable)
3. Apply additional filters (status, program, etc.)
4. Click **"Apply Filters"**
5. Report data updates

**Step 3: Export Report**
1. Click **"Export"** button
2. Choose format:
   - **CSV**: Plain data, good for analysis
   - **Excel**: Formatted with multiple sheets
   - **PDF**: Formatted document with charts
3. File downloads automatically
4. Filename includes report type and date

### Scheduled Reports

**Role Required**: Admin

Admins can schedule automatic report generation:

**Steps**:
1. Navigate to **Settings** > **Reports**
2. Click **"Schedule Report"**
3. Configure:
   - Report type
   - Frequency: Daily, Weekly, Monthly, Quarterly
   - Recipients: Email addresses
   - Format: CSV, Excel, PDF
4. Click **"Save Schedule"**
5. Reports are generated and emailed automatically

---

## File Management

### Uploading Files

**Supported File Types**:
- Documents: PDF, DOC, DOCX, XLS, XLSX
- Images: JPG, JPEG, PNG, GIF
- Max file size: 10 MB per file

**Upload Process**:
1. Click **"Upload"** button in relevant section (NPD, Performance, etc.)
2. Select file from your computer
3. Choose file type/category (if prompted)
4. Add description (optional)
5. Click **"Upload"**
6. Progress bar shows upload status
7. File appears in attachment list when complete

**File Validation**:
- File type is checked (only allowed types)
- File size is validated (max 10 MB)
- Virus scanning (if configured)
- SHA-256 checksum calculated for integrity

### Downloading Files

**Steps**:
1. Navigate to document with attachments (NPD, Performance, etc.)
2. Find file in attachment list
3. Click **"Download"** button or file name
4. File downloads to your browser's download folder
5. Checksum is verified on download

**Download Limits**:
- Max 100 downloads per user per hour
- Rate limiting prevents abuse

### Viewing Files

**For Images**:
1. Click on image thumbnail
2. Image opens in preview modal
3. Options: Download, Close

**For PDFs**:
1. Click on PDF file
2. PDF opens in browser's PDF viewer
3. Options: Download, Print, Close

### Deleting Files

**Role Required**: File uploader or Admin

**Steps**:
1. Navigate to file in attachment list
2. Click **"Delete"** button (trash icon)
3. Confirm deletion in dialog
4. File is soft-deleted (marked as deleted)
5. File is hidden from normal view
6. Admin can restore deleted files

**Note**: Deleted files are retained for audit purposes.

### File Storage Quotas

Each organization has a file storage quota:
- Default: 1 GB
- Admin can view current usage in Settings
- Warning shown when approaching limit (>80%)
- Contact admin to increase quota if needed

---

## Troubleshooting

### Common Issues and Solutions

#### 1. Cannot Log In

**Symptoms**: Login page shows error or doesn't redirect

**Solutions**:
- Check your internet connection
- Clear browser cache and cookies
- Try a different browser
- Check if your email is verified (check inbox for verification email)
- Contact admin to verify your account is active

#### 2. Organization Not Showing

**Symptoms**: Organization dropdown is empty

**Solutions**:
- Verify you've been added to an organization
- Contact admin to add you to the organization
- Try logging out and logging back in
- Check if you're using the correct email address

#### 3. Cannot Create NPD

**Symptoms**: "Create NPD" button is disabled or missing

**Solutions**:
- Verify you have PPTK role (check with admin)
- Ensure you've selected an organization
- Check if RKA data has been imported (required)
- Verify your account is active

#### 4. Budget Validation Errors

**Symptoms**: "Amount exceeds available budget" error

**Solutions**:
- Check the current sisa pagu for the account
- Verify no other pending NPDs are using the same budget
- Check if fiscal year is correct
- Contact Bendahara to review budget allocation

#### 5. File Upload Fails

**Symptoms**: Upload progress stops or shows error

**Solutions**:
- Check file size (max 10 MB)
- Verify file type is supported (PDF, DOC, images)
- Check internet connection stability
- Try uploading a smaller file
- Try a different browser
- Contact admin if issue persists

#### 6. PDF Generation Fails

**Symptoms**: "Generate PDF" button shows error

**Solutions**:
- Wait a few seconds and try again
- Check if NPD data is complete
- Verify attachments are uploaded
- Try generating from a different NPD
- Contact admin if issue persists

#### 7. Email Notifications Not Received

**Symptoms**: No email received after NPD submission

**Solutions**:
- Check spam/junk folder
- Verify email address in profile is correct
- Check notification preferences in Settings
- Ask recipient to check their email
- Contact admin to verify email service is working

#### 8. Dashboard Data Not Updating

**Symptoms**: KPIs show old data after SP2D creation

**Solutions**:
- Refresh the page (F5 or Ctrl+R)
- Clear browser cache
- Check if fiscal year filter is correct
- Verify SP2D was successfully created
- Wait a few seconds for real-time sync

#### 9. Cannot Edit NPD

**Symptoms**: Edit button is disabled

**Solutions**:
- Check NPD status (only Draft can be edited)
- Verify you are the creator of the NPD
- Check if you have PPTK role
- Once submitted, NPDs cannot be edited (by design)

#### 10. Export Fails

**Symptoms**: Export button doesn't download file

**Solutions**:
- Check browser's pop-up blocker settings
- Allow downloads from the site
- Try a different browser
- Check if filters are too restrictive (no data to export)
- Contact admin if issue persists

### Getting Help

**In-App Help**:
- Click **"?"** icon in top navigation
- Access context-sensitive help
- View keyboard shortcuts

**Contact Support**:
- Email: support@npd-tracker.example.com
- Phone: +62-XXX-XXXX-XXXX
- Office hours: Monday-Friday, 8 AM - 5 PM WIB

**Report a Bug**:
1. Navigate to **Settings** > **Feedback**
2. Click **"Report Bug"**
3. Describe the issue with details:
   - What you were trying to do
   - What happened instead
   - Steps to reproduce
   - Screenshots (if applicable)
4. Submit report
5. Support team will respond within 24 hours

### Browser Compatibility

**Recommended Browsers**:
- ✅ Google Chrome (latest version)
- ✅ Mozilla Firefox (latest version)
- ✅ Microsoft Edge (latest version)
- ✅ Safari (latest version)

**Not Supported**:
- ❌ Internet Explorer (any version)
- ❌ Older browser versions (>2 years old)

### System Requirements

**Minimum**:
- Internet connection: 1 Mbps
- Screen resolution: 1024x768
- RAM: 4 GB
- Modern browser (see above)

**Recommended**:
- Internet connection: 5 Mbps or faster
- Screen resolution: 1920x1080 or higher
- RAM: 8 GB or more
- Latest browser version

---

## Appendix

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + K` | Open search |
| `Ctrl + N` | Create new NPD |
| `Ctrl + S` | Save current form |
| `Ctrl + E` | Export current view |
| `Esc` | Close modal/dialog |
| `?` | Show help |

### Glossary

| Term | Definition |
|------|------------|
| **NPD** | Nota Pencairan Dana - Fund disbursement request document |
| **SP2D** | Surat Perintah Pencairan Dana - Fund disbursement order |
| **RKA** | Rencana Kerja Anggaran - Annual budget plan |
| **Pagu** | Allocated budget amount |
| **Realisasi** | Actual spending/utilization |
| **Sisa Pagu** | Remaining budget (Pagu - Realisasi) |
| **PPTK** | Pejabat Pelaksana Teknis Kegiatan - Activity technical officer |
| **Bendahara** | Treasurer |
| **Verifikator** | Verifier/Compliance officer |
| **UP** | Uang Persediaan - Advance funds |
| **GU** | Ganti Uang - Reimbursement |
| **TU** | Tambah Uang - Additional funds |
| **LS** | Langsung - Direct payment |
| **SPM** | Surat Perintah Membayar - Payment order |
| **RAB** | Rencana Anggaran Biaya - Budget plan |
| **BAST** | Berita Acara Serah Terima - Handover document |

### Frequently Asked Questions (FAQ)

**Q: Can I create multiple NPDs for the same account?**  
A: Yes, as long as the total doesn't exceed the sisa pagu.

**Q: What happens if I delete an SP2D?**  
A: The SP2D is soft-deleted and all realizations are reverted. The budget becomes available again.

**Q: Can I edit an NPD after submission?**  
A: No, once submitted, NPDs are locked. If changes are needed, the NPD must be rejected and recreated.

**Q: How long are audit logs retained?**  
A: Audit logs are retained permanently for compliance purposes.

**Q: Can I export data for external analysis?**  
A: Yes, all reports can be exported to CSV or Excel for analysis in other tools.

**Q: What is the difference between Verifikator and Bendahara?**  
A: Verifikator can verify NPDs but cannot finalize them. Bendahara can both verify and finalize NPDs, and create SP2D.

**Q: How often is the dashboard updated?**  
A: The dashboard updates in real-time using Convex. Changes are reflected within seconds.

**Q: Can I access the system from mobile?**  
A: Yes, the system is responsive and works on mobile devices, but desktop is recommended for data entry.

---

## Change Log

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Nov 1, 2025 | Initial user guide release |

---

**End of User Guide**

For additional support, please contact your system administrator or the NPD Tracker support team.

