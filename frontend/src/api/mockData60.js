import { Role, EmployeeStatus, EmployeeType, ContractStatus, AttendanceStatus } from '../utils/constants';

const DEPARTMENTS = {
  ENG: { id: 'dept_eng', name: 'Engineering', code: 'ENG' },
  HR: { id: 'dept_hr', name: 'Human Resources', code: 'HR' },
  SALES: { id: 'dept_sales', name: 'Sales & Marketing', code: 'SALES' },
  FIN: { id: 'dept_payroll', name: 'Payroll & Finance', code: 'FIN' },
  OPS: { id: 'dept_ops', name: 'Operations & IT', code: 'OPS' },
};

const SCHEDULES = {
  FULL_TIME: { id: 'sched_fulltime', name: 'Standard 40h Full-Time', totalWeeklyHours: 40 },
  PART_TIME: { id: 'sched_parttime', name: 'Part-Time 20h', totalWeeklyHours: 20 },
};

const NAMES_AND_ROLES = [
  // Core Roles (1-5)
  { firstName: 'Sarah', lastName: 'Connor', email: 'hr.manager@payflux.com', role: Role.HR_MANAGER, jobPosition: 'Director of HR', dept: DEPARTMENTS.HR, wage: 95000, type: EmployeeType.FULL_TIME },
  { firstName: 'Michael', lastName: 'Scott', email: 'payroll.user@payflux.com', role: Role.HR_PAYROLL_USER, jobPosition: 'Payroll Specialist', dept: DEPARTMENTS.FIN, wage: 75000, type: EmployeeType.FULL_TIME },
  { firstName: 'Dwight', lastName: 'Schrute', email: 'payroll.manager@payflux.com', role: Role.HR_PAYROLL_MANAGER, jobPosition: 'Payroll Manager', dept: DEPARTMENTS.FIN, wage: 98000, type: EmployeeType.FULL_TIME },
  { firstName: 'Jim', lastName: 'Halpert', email: 'employee@payflux.com', role: Role.EMPLOYEE, jobPosition: 'Sales Representative', dept: DEPARTMENTS.SALES, wage: 72000, type: EmployeeType.FULL_TIME },
  { firstName: 'Pam', lastName: 'Beesly', email: 'pam.beesly@payflux.com', role: Role.EMPLOYEE, jobPosition: 'Office Administrator', dept: DEPARTMENTS.HR, wage: 52000, type: EmployeeType.PART_TIME },

  // Engineering Team (6-17)
  { firstName: 'Alice', lastName: 'Chen', email: 'alice.chen@payflux.com', role: Role.HR_MANAGER, jobPosition: 'VP of Engineering', dept: DEPARTMENTS.ENG, wage: 135000, type: EmployeeType.FULL_TIME },
  { firstName: 'Ethan', lastName: 'Hunt', email: 'ethan.hunt@payflux.com', role: Role.EMPLOYEE, jobPosition: 'Senior Software Engineer', dept: DEPARTMENTS.ENG, wage: 110000, type: EmployeeType.FULL_TIME },
  { firstName: 'Bob', lastName: 'Smith', email: 'bob.smith@payflux.com', role: Role.EMPLOYEE, jobPosition: 'Frontend Engineer', dept: DEPARTMENTS.ENG, wage: 85000, type: EmployeeType.FULL_TIME },
  { firstName: 'Carlos', lastName: 'Mendoza', email: 'carlos.mendoza@payflux.com', role: Role.EMPLOYEE, jobPosition: 'Backend Architect', dept: DEPARTMENTS.ENG, wage: 125000, type: EmployeeType.FULL_TIME },
  { firstName: 'Diana', lastName: 'Prince', email: 'diana.prince@payflux.com', role: Role.EMPLOYEE, jobPosition: 'DevOps Lead', dept: DEPARTMENTS.ENG, wage: 118000, type: EmployeeType.FULL_TIME },
  { firstName: 'Edward', lastName: 'Nygma', email: 'edward.nygma@payflux.com', role: Role.EMPLOYEE, jobPosition: 'Data Engineer', dept: DEPARTMENTS.ENG, wage: 92000, type: EmployeeType.FULL_TIME },
  { firstName: 'Fiona', lastName: 'Gallagher', email: 'fiona.gallagher@payflux.com', role: Role.EMPLOYEE, jobPosition: 'QA Lead', dept: DEPARTMENTS.ENG, wage: 80000, type: EmployeeType.FULL_TIME },
  { firstName: 'George', lastName: 'Clark', email: 'george.clark@payflux.com', role: Role.EMPLOYEE, jobPosition: 'Full Stack Developer', dept: DEPARTMENTS.ENG, wage: 90000, type: EmployeeType.FULL_TIME },
  { firstName: 'Hannah', lastName: 'Abbott', email: 'hannah.abbott@payflux.com', role: Role.EMPLOYEE, jobPosition: 'UI/UX Designer', dept: DEPARTMENTS.ENG, wage: 82000, type: EmployeeType.FULL_TIME },
  { firstName: 'Ian', lastName: 'Malcolm', email: 'ian.malcolm@payflux.com', role: Role.EMPLOYEE, jobPosition: 'SRE Lead', dept: DEPARTMENTS.ENG, wage: 105000, type: EmployeeType.FULL_TIME },
  { firstName: 'Jessica', lastName: 'Jones', email: 'jessica.jones@payflux.com', role: Role.EMPLOYEE, jobPosition: 'Security Engineer', dept: DEPARTMENTS.ENG, wage: 112000, type: EmployeeType.FULL_TIME },
  { firstName: 'Kevin', lastName: 'Flynn', email: 'kevin.flynn@payflux.com', role: Role.EMPLOYEE, jobPosition: 'Systems Engineer', dept: DEPARTMENTS.ENG, wage: 94000, type: EmployeeType.FULL_TIME },

  // Sales & Marketing Team (18-29)
  { firstName: 'Marcus', lastName: 'Brooks', email: 'marcus.brooks@payflux.com', role: Role.HR_MANAGER, jobPosition: 'VP of Global Sales', dept: DEPARTMENTS.SALES, wage: 130000, type: EmployeeType.FULL_TIME },
  { firstName: 'Sophia', lastName: 'Patel', email: 'sophia.patel@payflux.com', role: Role.EMPLOYEE, jobPosition: 'Senior Account Executive', dept: DEPARTMENTS.SALES, wage: 88000, type: EmployeeType.FULL_TIME },
  { firstName: 'Julia', lastName: 'Roberts', email: 'julia.roberts@payflux.com', role: Role.EMPLOYEE, jobPosition: 'Marketing Director', dept: DEPARTMENTS.SALES, wage: 96000, type: EmployeeType.FULL_TIME },
  { firstName: 'Kevin', lastName: 'Bacon', email: 'kevin.bacon@payflux.com', role: Role.EMPLOYEE, jobPosition: 'Account Manager', dept: DEPARTMENTS.SALES, wage: 75000, type: EmployeeType.FULL_TIME },
  { firstName: 'Laura', lastName: 'Croft', email: 'laura.croft@payflux.com', role: Role.EMPLOYEE, jobPosition: 'Content Strategist', dept: DEPARTMENTS.SALES, wage: 68000, type: EmployeeType.FULL_TIME },
  { firstName: 'Martin', lastName: 'Freeman', email: 'martin.freeman@payflux.com', role: Role.EMPLOYEE, jobPosition: 'SEO Specialist', dept: DEPARTMENTS.SALES, wage: 85000, type: EmployeeType.FULL_TIME },
  { firstName: 'Nina', lastName: 'Patel', email: 'nina.patel@payflux.com', role: Role.EMPLOYEE, jobPosition: 'Sales Representative', dept: DEPARTMENTS.SALES, wage: 62000, type: EmployeeType.FULL_TIME },
  { firstName: 'Oscar', lastName: 'Martinez', email: 'oscar.martinez@payflux.com', role: Role.HR_PAYROLL_USER, jobPosition: 'Sales Operations Analyst', dept: DEPARTMENTS.SALES, wage: 78000, type: EmployeeType.FULL_TIME },
  { firstName: 'Peter', lastName: 'Parker', email: 'peter.parker@payflux.com', role: Role.EMPLOYEE, jobPosition: 'Digital Media Specialist', dept: DEPARTMENTS.SALES, wage: 58000, type: EmployeeType.PART_TIME },
  { firstName: 'Quinn', lastName: 'Fabray', email: 'quinn.fabray@payflux.com', role: Role.EMPLOYEE, jobPosition: 'Brand Manager', dept: DEPARTMENTS.SALES, wage: 84000, type: EmployeeType.FULL_TIME },
  { firstName: 'Rachel', lastName: 'Amber', email: 'rachel.amber@payflux.com', role: Role.EMPLOYEE, jobPosition: 'Event Coordinator', dept: DEPARTMENTS.SALES, wage: 64000, type: EmployeeType.FULL_TIME },
  { firstName: 'Sam', lastName: 'Winchester', email: 'sam.winchester@payflux.com', role: Role.EMPLOYEE, jobPosition: 'Partner Manager', dept: DEPARTMENTS.SALES, wage: 89000, type: EmployeeType.FULL_TIME },

  // Payroll & Finance Team (30-41)
  { firstName: 'Liam', lastName: 'Wright', email: 'liam.wright@payflux.com', role: Role.HR_PAYROLL_MANAGER, jobPosition: 'Financial Controller', dept: DEPARTMENTS.FIN, wage: 115000, type: EmployeeType.FULL_TIME },
  { firstName: 'Rachel', lastName: 'Green', email: 'rachel.green@payflux.com', role: Role.HR_PAYROLL_USER, jobPosition: 'Senior Accountant', dept: DEPARTMENTS.FIN, wage: 82000, type: EmployeeType.FULL_TIME },
  { firstName: 'Steven', lastName: 'Strange', email: 'steven.strange@payflux.com', role: Role.HR_PAYROLL_USER, jobPosition: 'Financial Analyst', dept: DEPARTMENTS.FIN, wage: 88000, type: EmployeeType.FULL_TIME },
  { firstName: 'Tina', lastName: 'Fey', email: 'tina.fey@payflux.com', role: Role.HR_PAYROLL_USER, jobPosition: 'Tax Specialist', dept: DEPARTMENTS.FIN, wage: 86000, type: EmployeeType.FULL_TIME },
  { firstName: 'Ulysses', lastName: 'Grant', email: 'ulysses.grant@payflux.com', role: Role.EMPLOYEE, jobPosition: 'Accounts Payable Clerk', dept: DEPARTMENTS.FIN, wage: 54000, type: EmployeeType.FULL_TIME },
  { firstName: 'Victor', lastName: 'Von', email: 'victor.von@payflux.com', role: Role.HR_PAYROLL_MANAGER, jobPosition: 'Internal Auditor', dept: DEPARTMENTS.FIN, wage: 94000, type: EmployeeType.FULL_TIME },
  { firstName: 'Wanda', lastName: 'Maximoff', email: 'wanda.maximoff@payflux.com', role: Role.EMPLOYEE, jobPosition: 'Treasury Analyst', dept: DEPARTMENTS.FIN, wage: 89000, type: EmployeeType.FULL_TIME },
  { firstName: 'Xavier', lastName: 'Charles', email: 'xavier.charles@payflux.com', role: Role.HR_PAYROLL_MANAGER, jobPosition: 'Risk Officer', dept: DEPARTMENTS.FIN, wage: 108000, type: EmployeeType.FULL_TIME },
  { firstName: 'Yara', lastName: 'Shahidi', email: 'yara.shahidi@payflux.com', role: Role.EMPLOYEE, jobPosition: 'Billing Specialist', dept: DEPARTMENTS.FIN, wage: 58000, type: EmployeeType.FULL_TIME },
  { firstName: 'Zack', lastName: 'Snyder', email: 'zack.snyder@payflux.com', role: Role.EMPLOYEE, jobPosition: 'Budget Analyst', dept: DEPARTMENTS.FIN, wage: 76000, type: EmployeeType.FULL_TIME },
  { firstName: 'Amy', lastName: 'Poehler', email: 'amy.poehler@payflux.com', role: Role.HR_PAYROLL_USER, jobPosition: 'Payroll Auditor', dept: DEPARTMENTS.FIN, wage: 81000, type: EmployeeType.FULL_TIME },
  { firstName: 'Ben', lastName: 'Wyatt', email: 'ben.wyatt@payflux.com', role: Role.HR_PAYROLL_MANAGER, jobPosition: 'Senior Accountant', dept: DEPARTMENTS.FIN, wage: 97000, type: EmployeeType.FULL_TIME },

  // Human Resources Team (42-51)
  { firstName: 'David', lastName: 'Kim', email: 'david.kim@payflux.com', role: Role.HR_MANAGER, jobPosition: 'Talent Acquisition Partner', dept: DEPARTMENTS.HR, wage: 85000, type: EmployeeType.FULL_TIME },
  { firstName: 'Angela', lastName: 'Martin', email: 'angela.martin@payflux.com', role: Role.HR_MANAGER, jobPosition: 'HR Business Partner', dept: DEPARTMENTS.HR, wage: 88000, type: EmployeeType.FULL_TIME },
  { firstName: 'Bruce', lastName: 'Wayne', email: 'bruce.wayne@payflux.com', role: Role.ADMIN, jobPosition: 'Chief People Officer', dept: DEPARTMENTS.HR, wage: 140000, type: EmployeeType.FULL_TIME },
  { firstName: 'Carol', lastName: 'Danvers', email: 'carol.danvers@payflux.com', role: Role.EMPLOYEE, jobPosition: 'Technical Recruiter', dept: DEPARTMENTS.HR, wage: 75000, type: EmployeeType.FULL_TIME },
  { firstName: 'Daniel', lastName: 'Craig', email: 'daniel.craig@payflux.com', role: Role.EMPLOYEE, jobPosition: 'HR Operations Lead', dept: DEPARTMENTS.HR, wage: 78000, type: EmployeeType.FULL_TIME },
  { firstName: 'Elena', lastName: 'Gilbert', email: 'elena.gilbert@payflux.com', role: Role.EMPLOYEE, jobPosition: 'Benefits Specialist', dept: DEPARTMENTS.HR, wage: 70000, type: EmployeeType.FULL_TIME },
  { firstName: 'Frank', lastName: 'Castle', email: 'frank.castle@payflux.com', role: Role.EMPLOYEE, jobPosition: 'Safety & Compliance Lead', dept: DEPARTMENTS.HR, wage: 82000, type: EmployeeType.FULL_TIME },
  { firstName: 'Grace', lastName: 'Hopper', email: 'grace.hopper@payflux.com', role: Role.EMPLOYEE, jobPosition: 'L&D Director', dept: DEPARTMENTS.HR, wage: 92000, type: EmployeeType.FULL_TIME },
  { firstName: 'Harry', lastName: 'Potter', email: 'harry.potter@payflux.com', role: Role.EMPLOYEE, jobPosition: 'HR Assistant', dept: DEPARTMENTS.HR, wage: 48000, type: EmployeeType.PART_TIME },
  { firstName: 'Iris', lastName: 'West', email: 'iris.west@payflux.com', role: Role.EMPLOYEE, jobPosition: 'Employee Experience Manager', dept: DEPARTMENTS.HR, wage: 83000, type: EmployeeType.FULL_TIME },

  // Operations & IT Team (52-60)
  { firstName: 'Emma', lastName: 'Clark', email: 'emma.clark@payflux.com', role: Role.EMPLOYEE, jobPosition: 'IT Operations Specialist', dept: DEPARTMENTS.OPS, wage: 65000, type: EmployeeType.PART_TIME },
  { firstName: 'Jack', lastName: 'Sparrow', email: 'jack.sparrow@payflux.com', role: Role.HR_MANAGER, jobPosition: 'VP of Infrastructure', dept: DEPARTMENTS.OPS, wage: 128000, type: EmployeeType.FULL_TIME },
  { firstName: 'Karen', lastName: 'Filippelli', email: 'karen.filippelli@payflux.com', role: Role.EMPLOYEE, jobPosition: 'System Administrator', dept: DEPARTMENTS.OPS, wage: 82000, type: EmployeeType.FULL_TIME },
  { firstName: 'Luke', lastName: 'Skywalker', email: 'luke.skywalker@payflux.com', role: Role.EMPLOYEE, jobPosition: 'Cloud Architect', dept: DEPARTMENTS.OPS, wage: 115000, type: EmployeeType.FULL_TIME },
  { firstName: 'Mia', lastName: 'Thermapolis', email: 'mia.thermapolis@payflux.com', role: Role.EMPLOYEE, jobPosition: 'Operations Manager', dept: DEPARTMENTS.OPS, wage: 95000, type: EmployeeType.FULL_TIME },
  { firstName: 'Nathan', lastName: 'Drake', email: 'nathan.drake@payflux.com', role: Role.EMPLOYEE, jobPosition: 'IT Support Engineer', dept: DEPARTMENTS.OPS, wage: 62000, type: EmployeeType.FULL_TIME },
  { firstName: 'Olivia', lastName: 'Pope', email: 'olivia.pope@payflux.com', role: Role.EMPLOYEE, jobPosition: 'Procurement Specialist', dept: DEPARTMENTS.OPS, wage: 78000, type: EmployeeType.FULL_TIME },
  { firstName: 'Paul', lastName: 'Atreides', email: 'paul.atreides@payflux.com', role: Role.EMPLOYEE, jobPosition: 'Security Analyst', dept: DEPARTMENTS.OPS, wage: 88000, type: EmployeeType.FULL_TIME },
  { firstName: 'Tony', lastName: 'Stark', email: 'admin@payflux.com', role: Role.ADMIN, jobPosition: 'Chief Executive Officer', dept: DEPARTMENTS.OPS, wage: 150000, type: EmployeeType.FULL_TIME },
];

export const SIXTY_EMPLOYEES = NAMES_AND_ROLES.map((item, index) => {
  const num = String(index + 1).padStart(3, '0');
  const empId = `emp_${num}`;
  const fullName = `${item.firstName} ${item.lastName}`;
  const isPartTime = item.type === EmployeeType.PART_TIME;
  const sched = isPartTime ? SCHEDULES.PART_TIME : SCHEDULES.FULL_TIME;

  return {
    id: empId,
    name: fullName,
    email: item.email,
    phone: `+1 555-01${num}`,
    avatarUrl: `https://images.unsplash.com/photo-15${num}00000?w=150`,
    jobPosition: item.jobPosition,
    status: index === 56 ? EmployeeStatus.ON_LEAVE : EmployeeStatus.ACTIVE,
    employeeType: item.type,
    bankAccountNumber: `98765432${num}`,
    bankIfsc: 'HDFC0001234',
    joiningDate: `202${(index % 4) + 1}-0${(index % 9) + 1}-15T00:00:00.000Z`,
    departmentId: item.dept.id,
    department: { id: item.dept.id, name: item.dept.name },
    managerId: index < 5 ? null : 'emp_001',
    scheduleId: sched.id,
    schedule: sched,
    contracts: [
      {
        id: `cnt_${num}`,
        status: ContractStatus.ACTIVE,
        wage: item.wage,
        jobPosition: item.jobPosition,
        startDate: `202${(index % 4) + 1}-0${(index % 9) + 1}-15T00:00:00.000Z`,
      },
    ],
  };
});

export const SIXTY_USERS = NAMES_AND_ROLES.map((item, index) => {
  const num = String(index + 1).padStart(3, '0');
  const userId = `usr_${num}`;
  const emp = SIXTY_EMPLOYEES[index];

  return {
    id: userId,
    name: emp.name,
    email: item.email,
    role: item.role,
    employeeId: emp.id,
    employee: {
      id: emp.id,
      name: emp.name,
      jobPosition: emp.jobPosition,
      department: emp.department,
    },
    createdAt: `2026-01-${String((index % 28) + 1).padStart(2, '0')}T09:00:00.000Z`,
  };
});

export const SIXTY_CONTRACTS = SIXTY_EMPLOYEES.map((emp, index) => {
  const num = String(index + 1).padStart(3, '0');
  return {
    id: `cnt_${num}`,
    employeeId: emp.id,
    employee: { id: emp.id, name: emp.name, jobPosition: emp.jobPosition },
    departmentId: emp.departmentId,
    department: emp.department,
    jobPosition: emp.jobPosition,
    wage: emp.contracts[0]?.wage || 75000,
    salaryStructureId: 'str_regular',
    salaryStructure: { id: 'str_regular', name: 'Regular Executive Salary' },
    startDate: emp.joiningDate,
    endDate: null,
    status: ContractStatus.ACTIVE,
  };
});

export const SIXTY_ATTENDANCE = SIXTY_EMPLOYEES.map((emp, index) => {
  const num = String(index + 1).padStart(3, '0');
  const isLate = index % 7 === 0;
  const isOvertime = index % 5 === 0;
  const status = isLate ? AttendanceStatus.LATE : isOvertime ? AttendanceStatus.OVERTIME : AttendanceStatus.PRESENT;

  return {
    id: `att_${num}`,
    employeeId: emp.id,
    employee: { id: emp.id, name: emp.name, department: emp.department },
    checkIn: `2026-09-05T09:${isLate ? '25' : '00'}:00.000Z`,
    checkOut: `2026-09-05T${isOvertime ? '19:30' : '18:00'}:00.000Z`,
    workedHours: isOvertime ? 9.5 : isLate ? 7.5 : 8.0,
    status,
    isManualEdit: false,
    note: isLate ? 'Traffic delay' : null,
  };
});

export const SIXTY_PAYSLIPS = SIXTY_EMPLOYEES.map((emp, index) => {
  const num = String(index + 1).padStart(3, '0');
  const wage = emp.contracts[0]?.wage || 75000;
  const monthlyWage = Math.round(wage / 12);
  const basic = Math.round(monthlyWage * 0.5);
  const hra = Math.round(basic * 0.4);
  const pf = Math.round(basic * 0.12);
  const gross = basic + hra;
  const net = gross - pf;

  return {
    id: `ps_${num}`,
    payrunId: 'pr_aug_2026',
    employeeId: emp.id,
    employee: { id: emp.id, name: emp.name, email: emp.email, jobPosition: emp.jobPosition, department: emp.department },
    salaryStructureId: 'str_regular',
    periodStart: '2026-08-01T00:00:00.000Z',
    periodEnd: '2026-08-31T23:59:59.000Z',
    workedDays: 22,
    totalDays: 22,
    basic,
    gross,
    net,
    status: 'PAID',
    lines: [
      { id: `psl_${num}_1`, name: 'Basic Salary', code: 'BASIC', category: 'BASIC', amount: basic },
      { id: `psl_${num}_2`, name: 'House Rent Allowance', code: 'HRA', category: 'ALLOWANCE', amount: hra },
      { id: `psl_${num}_3`, name: 'Provident Fund', code: 'PF', category: 'DEDUCTION', amount: pf },
      { id: `psl_${num}_4`, name: 'Gross Salary', code: 'GROSS', category: 'GROSS', amount: gross },
      { id: `psl_${num}_5`, name: 'Net Salary', code: 'NET', category: 'NET', amount: net },
    ],
  };
});
