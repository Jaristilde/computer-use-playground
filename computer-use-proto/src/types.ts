export interface ComputerCallAction {
  type: string;
  [key: string]: any;
}

export interface ComputerCall {
  call_id: string;
  action: ComputerCallAction;
  pending_safety_checks?: any[];
}

export interface StepState {
  responseId?: string;
  computerCall?: ComputerCall;
  log: any[];
}
