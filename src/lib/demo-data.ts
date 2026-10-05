// Publica demo dataset. Clearly fictional data used to make the interface
// fully interactive before it is wired to the live backend.

export type Role = "citizen" | "officer" | "dept_admin" | "oversight" | "super_admin";

export const ROLE_LABELS: Record<Role, string> = {
  citizen: "Citizen",
  officer: "Government Officer",
  dept_admin: "Department Administrator",
  oversight: "Oversight Authority",
  super_admin: "Super Admin",
};

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ta", label: "தமிழ்" },
  { code: "hi", label: "हिन्दी" },
  { code: "ml", label: "മലയാളം" },
  { code: "te", label: "తెలుగు" },
  { code: "kn", label: "ಕನ್ನಡ" },
  { code: "bn", label: "বাংলা" },
  { code: "mr", label: "मराठी" },
] as const;

export const STAGES = [
  "Application Submitted",
  "Document Verification",
  "Officer Review",
  "Department Approval",
  "Certificate Generation",
  "Completed",
] as const;

export type Stage = (typeof STAGES)[number];

export type Department = {
  id: string;
  name: string;
  code: string;
  description: string;
};

export const DEPARTMENTS: Department[] = [
  { id: "REV", name: "Revenue Department", code: "REV", description: "Land records, certificates and revenue services." },
  { id: "TRN", name: "Transport Department", code: "TRN", description: "Vehicle registration, licensing and permits." },
  { id: "MUN", name: "Municipal Services", code: "MUN", description: "Civic services, building permits and sanitation." },
  { id: "SWD", name: "Social Welfare Department", code: "SWD", description: "Welfare schemes, pensions and assistance." },
  { id: "BLD", name: "Business Licensing Department", code: "BLD", description: "Trade licences and business registrations." },
];

export type Service = {
  code: string;
  name: string;
  department: string;
  category: string;
  description: string;
  eligibility: string[];
  documents: string[];
  fee: number;
  slaDays: number;
  processedLastYear: number;
};

export const SERVICES: Service[] = [
  {
    code: "BIRTH-CERT",
    name: "Birth Certificate",
    department: "REV",
    category: "Certificates",
    description: "Official record of a registered birth, issued by the Revenue Department.",
    eligibility: ["Birth registered within the district", "Applicant is a parent or legal guardian"],
    documents: ["Hospital birth record", "Parent identity proof", "Address proof"],
    fee: 50,
    slaDays: 7,
    processedLastYear: 18420,
  },
  {
    code: "INCOME-CERT",
    name: "Income Certificate",
    department: "REV",
    category: "Certificates",
    description: "Certificate stating verified annual household income.",
    eligibility: ["Resident of the district", "Supporting income proof available"],
    documents: ["Identity proof", "Address proof", "Salary slip or income declaration"],
    fee: 30,
    slaDays: 10,
    processedLastYear: 26110,
  },
  {
    code: "BUS-LIC",
    name: "Business License",
    department: "BLD",
    category: "Business",
    description: "Licence to operate a commercial establishment within municipal limits.",
    eligibility: ["Registered premises within municipal limits", "Tax registration completed"],
    documents: ["Identity proof", "Premises ownership or rent agreement", "Tax registration"],
    fee: 1500,
    slaDays: 21,
    processedLastYear: 7340,
  },
  {
    code: "BLD-PERMIT",
    name: "Building Permit",
    department: "MUN",
    category: "Property",
    description: "Permission to construct, extend or modify a building.",
    eligibility: ["Clear title to the property", "Site plan prepared by a licensed engineer"],
    documents: ["Site plan", "Ownership document", "Structural drawing"],
    fee: 3500,
    slaDays: 30,
    processedLastYear: 4120,
  },
  {
    code: "VEH-REG",
    name: "Vehicle Registration",
    department: "TRN",
    category: "Transport",
    description: "Registration of a newly purchased or transferred vehicle.",
    eligibility: ["Valid purchase invoice", "Active insurance policy"],
    documents: ["Purchase invoice", "Insurance certificate", "Identity proof"],
    fee: 800,
    slaDays: 14,
    processedLastYear: 31280,
  },
  {
    code: "WELFARE",
    name: "Welfare Scheme Application",
    department: "SWD",
    category: "Welfare",
    description: "Application for social welfare assistance under notified schemes.",
    eligibility: ["Household income below the notified threshold", "Valid bank account"],
    documents: ["Income certificate", "Identity proof", "Bank account proof"],
    fee: 0,
    slaDays: 20,
    processedLastYear: 15690,
  },
];

export type TimelineEvent = {
  at: string;
  stage: Stage;
  action: string;
  actor: string;
  department: string;
  comment?: string;
};

export type DelayFlag = "normal" | "approaching_sla" | "delayed" | "highly_delayed" | "anomalous";

export type Application = {
  reference: string;
  serviceCode: string;
  applicant: string;
  district: string;
  stage: Stage;
  statusLabel: string;
  officerCode: string;
  submittedAt: string;
  expectedAt: string;
  slaDeadline: string;
  processingDays: number;
  delayFlag: DelayFlag;
  aiRecommendation?: string;
  aiConfidence?: number;
  humanDecision?: string;
  timeline: TimelineEvent[];
  documents: { name: string; type: string; status: "verified" | "flagged" | "pending" }[];
  demo: boolean;
  mine?: boolean;
};

function timeline(dept: string, officer: string, upto: number): TimelineEvent[] {
  const base: TimelineEvent[] = [
    { at: "09:42 AM", stage: "Application Submitted", action: "Application submitted", actor: "Citizen portal", department: dept },
    { at: "10:15 AM", stage: "Document Verification", action: "Documents received", actor: "Publica intake service", department: dept },
    { at: "11:30 AM", stage: "Document Verification", action: "Document verification started", actor: "Publica document service", department: dept, comment: "Security scan and classification completed" },
    { at: "02:20 PM", stage: "Document Verification", action: "Document verification completed", actor: "Publica document service", department: dept },
    { at: "03:05 PM", stage: "Officer Review", action: "Application assigned for officer review", actor: officer, department: dept, comment: "Assigned by objective workload queue" },
    { at: "04:40 PM", stage: "Department Approval", action: "Recommended for departmental approval", actor: officer, department: dept },
    { at: "10:05 AM", stage: "Certificate Generation", action: "Certificate generation queued", actor: "Publica issuance service", department: dept },
    { at: "11:20 AM", stage: "Completed", action: "Service delivered to citizen", actor: "Publica issuance service", department: dept },
  ];
  return base.slice(0, upto);
}

export const APPLICATIONS: Application[] = [
  {
    reference: "PUB-2026-000184",
    serviceCode: "BUS-LIC",
    applicant: "Demo Applicant",
    district: "Central",
    stage: "Officer Review",
    statusLabel: "Under officer review",
    officerCode: "OFF-BLD-014",
    submittedAt: "2026-09-12",
    expectedAt: "2026-10-03",
    slaDeadline: "2026-10-03",
    processingDays: 9,
    delayFlag: "normal",
    aiRecommendation: "Documents complete; premises inspection still required before approval.",
    aiConfidence: 0.86,
    timeline: timeline("BLD", "OFF-BLD-014", 5),
    documents: [
      { name: "identity-proof.pdf", type: "Identity proof", status: "verified" },
      { name: "rent-agreement.pdf", type: "Premises proof", status: "verified" },
      { name: "tax-registration.jpg", type: "Tax registration", status: "flagged" },
    ],
    demo: true,
  },
  {
    reference: "PUB-2026-000185",
    serviceCode: "BIRTH-CERT",
    applicant: "Demo Applicant",
    district: "North",
    stage: "Completed",
    statusLabel: "Completed",
    officerCode: "OFF-REV-003",
    submittedAt: "2026-09-01",
    expectedAt: "2026-09-08",
    slaDeadline: "2026-09-08",
    processingDays: 6,
    delayFlag: "normal",
    humanDecision: "Approved by OFF-REV-003",
    timeline: timeline("REV", "OFF-REV-003", 8),
    documents: [
      { name: "hospital-record.pdf", type: "Birth record", status: "verified" },
      { name: "parent-id.pdf", type: "Identity proof", status: "verified" },
    ],
    demo: true,
  },
  {
    reference: "PUB-2026-000186",
    serviceCode: "BLD-PERMIT",
    applicant: "Demo Applicant",
    district: "East",
    stage: "Document Verification",
    statusLabel: "Awaiting document verification",
    officerCode: "OFF-MUN-021",
    submittedAt: "2026-08-18",
    expectedAt: "2026-09-17",
    slaDeadline: "2026-09-17",
    processingDays: 34,
    delayFlag: "delayed",
    aiRecommendation: "Processing time exceeds the department baseline. Flagged for administrative review.",
    aiConfidence: 0.74,
    timeline: timeline("MUN", "OFF-MUN-021", 3),
    documents: [
      { name: "site-plan.pdf", type: "Site plan", status: "pending" },
      { name: "ownership.pdf", type: "Ownership document", status: "verified" },
    ],
    demo: true,
  },
  {
    reference: "PUB-2026-000187",
    serviceCode: "VEH-REG",
    applicant: "Demo Applicant",
    district: "West",
    stage: "Department Approval",
    statusLabel: "Awaiting department approval",
    officerCode: "OFF-TRN-008",
    submittedAt: "2026-09-09",
    expectedAt: "2026-09-23",
    slaDeadline: "2026-09-23",
    processingDays: 12,
    delayFlag: "approaching_sla",
    timeline: timeline("TRN", "OFF-TRN-008", 6),
    documents: [
      { name: "invoice.pdf", type: "Purchase invoice", status: "verified" },
      { name: "insurance.pdf", type: "Insurance certificate", status: "verified" },
    ],
    demo: true,
  },
  {
    reference: "PUB-2026-000189",
    serviceCode: "INCOME-CERT",
    applicant: "Demo Applicant",
    district: "North",
    stage: "Document Verification",
    statusLabel: "Additional document required",
    officerCode: "OFF-REV-011",
    submittedAt: "2026-09-15",
    expectedAt: "2026-09-25",
    slaDeadline: "2026-09-25",
    processingDays: 6,
    delayFlag: "normal",
    aiRecommendation: "Income declaration is unreadable in the uploaded scan. A clearer copy is required.",
    aiConfidence: 0.69,
    timeline: timeline("REV", "OFF-REV-011", 3),
    documents: [
      { name: "identity.pdf", type: "Identity proof", status: "verified" },
      { name: "income-declaration.jpg", type: "Income proof", status: "flagged" },
    ],
    demo: true,
  },
  {
    reference: "PUB-2026-000191",
    serviceCode: "BLD-PERMIT",
    applicant: "Demo Applicant",
    district: "East",
    stage: "Officer Review",
    statusLabel: "Under officer review",
    officerCode: "OFF-MUN-021",
    submittedAt: "2026-08-11",
    expectedAt: "2026-09-10",
    slaDeadline: "2026-09-10",
    processingDays: 41,
    delayFlag: "highly_delayed",
    aiRecommendation: "Repeated reassignment detected. Operational alert only — not an allegation of misconduct.",
    aiConfidence: 0.81,
    timeline: timeline("MUN", "OFF-MUN-021", 5),
    documents: [{ name: "site-plan.pdf", type: "Site plan", status: "verified" }],
    demo: true,
  },
];

export type Grievance = {
  reference: string;
  category: string;
  subject: string;
  description: string;
  department: string;
  status: "Submitted" | "Acknowledged" | "Assigned" | "Under Review" | "Response Prepared" | "Resolved";
  createdAt: string;
  demo?: boolean;
};

export const GRIEVANCE_FLOW = [
  "Submitted",
  "Acknowledged",
  "Assigned",
  "Under Review",
  "Response Prepared",
  "Resolved",
] as const;

export const GRIEVANCES: Grievance[] = [
  {
    reference: "GRV-2026-000031",
    category: "Service delay",
    subject: "Building permit pending beyond service level",
    description: "The building permit application has crossed its published timeline.",
    department: "MUN",
    status: "Under Review",
    createdAt: "2026-09-05",
    demo: true,
  },
  {
    reference: "GRV-2026-000032",
    category: "Technical issue",
    subject: "Document upload failed repeatedly",
    description: "Uploads failed during submission of the income certificate application.",
    department: "REV",
    status: "Resolved",
    createdAt: "2026-08-22",
    demo: true,
  },
  {
    reference: "GRV-2026-000033",
    category: "Incorrect rejection",
    subject: "Income certificate rejected without reason",
    description: "The rejection reason was not explained in the decision note.",
    department: "REV",
    status: "Assigned",
    createdAt: "2026-09-14",
    demo: true,
  },
];

export const INTEGRITY_CATEGORIES = [
  "Unofficial payment request",
  "Unnecessary delay",
  "Misconduct",
  "Abuse of authority",
  "Conflict of interest",
  "Other",
];

export type IntegrityReport = {
  reference: string;
  category: string;
  department: string;
  status: "Received" | "Under assessment" | "Investigating" | "Action taken" | "Closed";
  createdAt: string;
  description: string;
};

export const INTEGRITY_REPORTS: IntegrityReport[] = [
  {
    reference: "PRT-2026-008421",
    category: "Unofficial payment request",
    department: "BLD",
    status: "Investigating",
    createdAt: "2026-09-02",
    description: "Demo report: an unofficial payment was requested to progress a licence file.",
  },
  {
    reference: "PRT-2026-008422",
    category: "Unnecessary delay",
    department: "MUN",
    status: "Under assessment",
    createdAt: "2026-09-11",
    description: "Demo report: a permit file has remained at the same stage for five weeks.",
  },
];

export const TRANSPARENCY = {
  kpis: {
    processed: 103960,
    avgProcessingDays: 11.4,
    pending: 6820,
    slaCompliance: 91.3,
    grievancesResolved: 4820,
    avgGrievanceDays: 5.2,
  },
  monthly: [
    { month: "Apr", applications: 7820, completed: 7310, avgDays: 12.8 },
    { month: "May", applications: 8410, completed: 7990, avgDays: 12.1 },
    { month: "Jun", applications: 9020, completed: 8520, avgDays: 11.9 },
    { month: "Jul", applications: 9560, completed: 9190, avgDays: 11.2 },
    { month: "Aug", applications: 10120, completed: 9740, avgDays: 10.8 },
    { month: "Sep", applications: 10890, completed: 10240, avgDays: 11.4 },
  ],
  byDepartment: [
    { department: "Revenue", applications: 38210, slaCompliance: 94, avgDays: 8.2 },
    { department: "Transport", applications: 27640, slaCompliance: 92, avgDays: 9.6 },
    { department: "Municipal", applications: 16480, slaCompliance: 84, avgDays: 19.4 },
    { department: "Social Welfare", applications: 13520, slaCompliance: 93, avgDays: 12.1 },
    { department: "Business Licensing", applications: 8110, slaCompliance: 88, avgDays: 16.8 },
  ],
  statusMix: [
    { name: "Completed", value: 72 },
    { name: "In progress", value: 21 },
    { name: "Awaiting citizen", value: 5 },
    { name: "Delayed", value: 2 },
  ],
  districts: ["Central", "North", "South", "East", "West"],
};

export const OFFICER_QUEUE = {
  activeCases: 32,
  approachingSla: 8,
  delayed: 3,
  verifiedToday: 14,
};

export const ADMIN_INSIGHTS = [
  "12 applications have exceeded their configured service level.",
  "Document verification workload increased 18% this week.",
  "Several building permit applications show repeated reassignment.",
  "Grievance resolution time improved by 1.3 days this month.",
];

export const AI_SUGGESTIONS = [
  "I need to apply for a birth certificate.",
  "What documents do I need for a business licence?",
  "Why is my building permit delayed?",
  "How do I file a grievance?",
];

export const KNOWLEDGE_SNIPPETS: { match: string[]; answer: string; sources: string[] }[] = [
  {
    match: ["birth"],
    answer:
      "Based on government policy: a birth certificate requires the hospital birth record, a parent identity proof and an address proof. The Revenue Department issues it within 7 working days of complete submission. The fee is 50.",
    sources: ["Demo Rule RD-7/2026", "Service guide: Birth Certificate"],
  },
  {
    match: ["business", "licence", "license", "trade"],
    answer:
      "Based on government policy: a business licence requires an identity proof, premises ownership or rent agreement and tax registration. A premises inspection takes place during officer review, and the published service level is 21 days.",
    sources: ["Demo Rule BL-3/2026", "Service guide: Business License"],
  },
  {
    match: ["delay", "late", "pending", "slow"],
    answer:
      "Based on government policy: every service has a published service level. When an application approaches or exceeds it, Publica flags the case for administrative review. A flag is an operational alert for human officers, not a finding of misconduct. You can also file a grievance about a delay.",
    sources: ["Policy note: Service level agreements"],
  },
  {
    match: ["grievance", "complain", "complaint"],
    answer:
      "Based on government policy: a grievance can be filed for a service delay, technical issue, officer conduct, incorrect rejection or other concerns. It moves through acknowledgement, assignment, review, response preparation and resolution, and you are notified at each stage.",
    sources: ["Process guide: Grievance redressal"],
  },
  {
    match: ["corrupt", "bribe", "payment", "integrity"],
    answer:
      "Based on government policy: requests for unofficial payments can be reported anonymously through the integrity portal. Reports are encrypted and routed only to authorised oversight personnel, and you receive a secure report ID to follow the status.",
    sources: ["Process guide: Integrity reporting"],
  },
  {
    match: ["income"],
    answer:
      "Based on government policy: an income certificate requires an identity proof, address proof and a salary slip or income declaration. It is issued within 10 working days and is valid for one year from the date of issue.",
    sources: ["Demo Rule RD-11/2026", "Service guide: Income Certificate"],
  },
  {
    match: ["vehicle", "car", "registration"],
    answer:
      "Based on government policy: vehicle registration requires the purchase invoice, an insurance certificate and an identity proof. The Transport Department completes registration within 14 working days.",
    sources: ["Demo Rule TR-4/2026"],
  },
  {
    match: ["welfare", "pension", "scheme"],
    answer:
      "Based on government policy: welfare assistance is granted to households below the notified annual income threshold. You need an income certificate, an identity proof and bank account proof, and the service level is 20 days.",
    sources: ["Demo Rule SW-2/2026"],
  },
];

export function answerFromKnowledge(question: string) {
  const q = question.toLowerCase();
  const hit = KNOWLEDGE_SNIPPETS.find((s) => s.match.some((m) => q.includes(m)));
  if (hit) return hit;
  return {
    answer:
      "I couldn't verify this information in the government knowledge base, so I won't guess. Please check with the responsible department, or ask me about a specific service such as a birth certificate, income certificate, business licence, building permit, vehicle registration or welfare scheme.",
    sources: [] as string[],
  };
}

export function matchService(query: string): Service | undefined {
  const q = query.toLowerCase();
  return SERVICES.find(
    (s) => q.includes(s.name.toLowerCase()) || s.name.toLowerCase().split(" ").some((w) => w.length > 4 && q.includes(w)),
  );
}

export const DELAY_LABELS: Record<DelayFlag, string> = {
  normal: "On track",
  approaching_sla: "Approaching deadline",
  delayed: "Delayed",
  highly_delayed: "Highly delayed",
  anomalous: "Flagged for review",
};

export function serviceByCode(code: string) {
  return SERVICES.find((s) => s.code === code);
}

export function departmentByCode(code: string) {
  return DEPARTMENTS.find((d) => d.code === code);
}
