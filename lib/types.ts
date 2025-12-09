export interface Client {
  id: string
  name: string
  contact_email: string | null
  contact_phone: string | null
  status: "active" | "inactive" | "prospect"
  cnpj: string | null
  address: string | null
  credit_risk: string | null
  client_notes: string | null
  objectives: string | null
  health_status: "green" | "yellow" | "red" | null
  assigned_relationship_manager_id: string | null
  assigned_editor_id: string | null
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
  status: "active" | "inactive"
  storage_path: string
  created_at: string
  updated_at: string
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
}

export interface NpsResponse {
  id: string
  client_id: string
  score: number
  comment: string | null
  response_date: string
  category_scores: Record<string, number> | null // JSONB
  observations: string | null
  created_at: string
}

export interface Cost {
  id: string
  description: string
  value: number
  category: string
  subcategory: string | null
  cost_type: "fixed" | "variable" | null
  date: string
  is_recurring: boolean
  recurrence_period: string | null
  installments: number | null
  current_installment: number | null
  employee_id: string | null
  notes: string | null
  payment_method: string | null
  status: "paid" | "pending" | null
  paid_date: string | null
  proof_url: string | null
  payment_proof_url: string | null
  created_at: string
  updated_at: string
}

export interface CostPayment {
  id: string
  cost_id: string
  amount: number
  payment_date: string
  proof_url: string | null
  created_at: string
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
  payment_day: number | null
  system_role: "admin" | "limited"
  career_plan_url: string | null
  career_plan_expiration_date: string | null
  work_model: "remote" | "hybrid" | "onsite" | null
  office_location: string | null
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
}

export interface EmployeeObservation {
  id: string
  employee_id: string
  observation: string
  tag: "positive" | "negative"
  created_at: string
}

export interface ClientContact {
  id: string
  client_id: string
  name: string
  role: string | null
  email: string | null
  phone: string | null
  birth_date: string | null
  created_at: string
  updated_at: string
}

export interface EmployeeContract {
  id: string
  employee_id: string
  name: string
  storage_path: string
  created_at: string
}

export interface EmployeeContribution {
  id: string
  employee_id: string
  description: string
  category: "Venda" | "Upsell" | "Ideia" | "Melhoria de Processo" | "Outro"
  value: number | null
  date: string
  created_at: string
}

export interface Service {
  id: string
  name: string
  description: string | null
  created_at: string
}

export interface ClientService {
  id: string
  client_id: string
  service_id: string
  is_done: boolean
  created_at: string
  updated_at: string
}

export interface CommercialGoal {
  id: string
  name: string
  target_value: number
  current_value: number
  start_date: string
  end_date: string
  status: "active" | "completed" | "expired"
  created_at: string
}

export interface ClientUpsell {
  id: string
  client_id: string
  service_id: string
  status: "pending" | "approved" | "rejected"
  description: string | null
  estimated_value: number | null
  next_action: string | null
  created_at: string
}
