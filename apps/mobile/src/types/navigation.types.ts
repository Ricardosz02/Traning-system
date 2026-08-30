export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type AppStackParamList = {
  MainTabs: undefined;
  CreatePlan: undefined;
  PlanDetails: { planId: string; planName: string };
};