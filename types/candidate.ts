export interface CandidateMarketing {
  id: number;
  candidate_id: number;
  candidate_name?: string;
  email?: string;
  password?: string;
  imap_password?: string;
  linkedin_username?: string;
  linkedin_passwd?: string;
  linkedin_premium_end_date?: string;
  google_voice_number?: string;
  status: string;
  start_date?: string;
  workstatus?: string;
  priority?: number;
  notes?: string;
  run_daily_workflow: boolean;
  run_weekly_workflow: boolean;
  run_email_extraction: boolean;
  linkedin_post: boolean;
  run_raw_positions_workflow: boolean;
  move_to_placement: boolean;
  mass_email: boolean;
  candidate_intro?: string;
  candidate_json?: any;
}
