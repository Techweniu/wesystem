export interface Client {
  id: string
  name: string
  contact_email: string | null
  contact_phone: string | null
  status: "active" | "inactive" | "prospect"
  created_at: string
  updated_at: string
}

export interface Contract {
  id: string
  client_id: string
  name: string
  monthly_value: number
  start_date: string
  end_date: string | null
  status: "active" | "completed" | "cancelled"
  created_at: string
  updated_at: string
  // Campos de Aprovação
  approval_status: "pending" | "approved" | "rejected"
  approved_by: string | null
  approved_at: string | null
}

export interface OneTimeService {
  id: string
  client_id: string
  name: string
  value: number
  date: string
  status: "pending" | "completed" | "cancelled"
  created_at: string
  updated_at: string
  // Campos de Aprovação
  approval_status: "pending" | "approved" | "rejected"
  approved_by: string | null
  approved_at: string | null
}

export interface NpsResponse {
  id: string
  client_id: string
  score: number
  comment: string | null
  response_date: string
  created_at: string
}

export interface Cost {
  id: string
  description: string
  value: number
  category: string
  date: string
  is_recurring: boolean
  created_at: string
  updated_at: string
  // Campos de Aprovação
  approval_status: "pending" | "approved" | "rejected"
  approved_by: string | null
  approved_at: string | null
}

export interface Employee {
  id: string
  name: string
  email: string
  role: string
  department: string | null
  salary: number | null
  hire_date: string
  manager_id: string | null
  status: "active" | "inactive"
  created_at: string
  updated_at: string
}

export interface TimeLog {
  id: string
  employee_id: string
  client_id: string | null
  contract_id: string | null
  hours: number
  date: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface EmployeePayment {
  id: string
  employee_id: string
  amount: number
  payment_date: string
  created_at: string
  // Campos de Aprovação
  approval_status: "pending" | "approved" | "rejected"
  approved_by: string | null
  approved_at: string | null
}

export interface EmployeeContribution {
  id: string
  employee_id: string
  description: string
  category: "Venda" | "Upsell" | "Ideia" | "Melhoria de Processo" | "Outro"
  value: number | null
  date: string
  created_at: string
  // Campos de Aprovação
  approval_status: "pending" | "approved" | "rejected"
  approved_by: string | null
  approved_at: string | null
}
