export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type AppStackParamList = {
  MainTabs: undefined;
  CreatePlan: undefined;
  WorkoutCreator: undefined;
  PlanDetails: { planId: string; planName: string };
  CustomPlanDetails: { planId: string; planName: string };
};
