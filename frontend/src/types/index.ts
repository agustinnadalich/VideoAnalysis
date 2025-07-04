export type MatchEvent = {
  [key: string]: any;
  ID: string | number;
  CATEGORY: string;
  PLAYER?: string;
  ADVANCE?: string;
  TEAM?: string;
  SCRUM_RESULT?: string;
  LINE_RESULT?: string;
  TURNOVER_TYPE?: string;
  INFRACTION_TYPE?: string;
  POINTS?: string;
  Time_Group?: string;
  COORDINATE_X?: number | null;
  DURATION?: number;
  SECOND?: number;
};

export type FilterDescriptor = {
  descriptor: string;
  value: any;
};
