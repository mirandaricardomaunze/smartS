-- HR Module Migration
-- Employees, Departments, Positions, Attendance, Leaves, Payroll

-- Departments
CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY, -- UUID
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  synced INTEGER DEFAULT 0
);

-- Positions
CREATE TABLE IF NOT EXISTS positions (
  id TEXT PRIMARY KEY, -- UUID
  company_id TEXT NOT NULL,
  department_id TEXT NOT NULL,
  title TEXT NOT NULL,
  base_salary REAL DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  synced INTEGER DEFAULT 0,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- Employees
CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY, -- UUID
  company_id TEXT NOT NULL,
  position_id TEXT,
  name TEXT NOT NULL,
  bi_number TEXT,
  nit TEXT,
  address TEXT,
  contacts TEXT, -- JSON string for multiple contacts
  photo_url TEXT,
  employment_type TEXT DEFAULT 'permanent', -- 'permanent', 'fixed-term', 'probation'
  status TEXT DEFAULT 'active', -- 'active', 'suspended', 'terminated'
  contract_start_date TEXT,
  contract_end_date TEXT,
  emergency_contact TEXT, -- JSON string
  bank_details TEXT, -- JSON string
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  synced INTEGER DEFAULT 0,
  FOREIGN KEY (position_id) REFERENCES positions(id)
);

-- Attendance (Ponto)
CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  date TEXT NOT NULL, -- YYYY-MM-DD
  clock_in TEXT, -- HH:mm:ss
  clock_out TEXT, -- HH:mm:ss
  breaks TEXT, -- JSON string
  status TEXT DEFAULT 'present', -- 'present', 'late', 'absent', 'justified'
  justification TEXT,
  total_minutes INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  synced INTEGER DEFAULT 0,
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- Leaves (Férias e Faltas)
CREATE TABLE IF NOT EXISTS leaves (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'annual', 'sick', 'maternity', 'paternity', 'unpaid', 'other'
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  comment TEXT,
  attachment_url TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  synced INTEGER DEFAULT 0,
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- Payroll (Processamento de Salários)
CREATE TABLE IF NOT EXISTS payroll (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  status TEXT DEFAULT 'draft', -- 'draft', 'processed', 'locked'
  processed_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  synced INTEGER DEFAULT 0
);

-- Payslips (Recibos de Salário)
CREATE TABLE IF NOT EXISTS payslips (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  payroll_id TEXT NOT NULL,
  base_salary REAL NOT NULL,
  subsidies REAL DEFAULT 0,
  bonuses REAL DEFAULT 0,
  overtime_pay REAL DEFAULT 0,
  inss_employee REAL NOT NULL, -- 4%
  inss_employer REAL NOT NULL, -- 4%
  irps REAL NOT NULL,
  absences_deduction REAL DEFAULT 0,
  advances REAL DEFAULT 0,
  net_salary REAL NOT NULL,
  pdf_url TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  synced INTEGER DEFAULT 0,
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (payroll_id) REFERENCES payroll(id)
);

-- Employee Qualifications
CREATE TABLE IF NOT EXISTS qualifications (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  level TEXT NOT NULL, -- 'primary', 'secondary', 'technical', 'bachelor', 'master', 'phd'
  institution TEXT NOT NULL,
  field TEXT,
  completion_date TEXT,
  expiry_date TEXT, -- For professional certifications
  certificate_url TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  synced INTEGER DEFAULT 0,
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);
