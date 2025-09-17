export type MatchEvent = {
  [key: string]: any;
  // Backend format (new)
  id?: string | number;
  event_type?: string;
  player_name?: string;
  player_id?: number | null;
  timestamp_sec?: number;
  extra_data?: any;
  match_id?: number;
  notes?: string | null;
  origin?: string | null;
  outcome?: string | null;
  phase?: string | null;
  tag?: string | null;
  x?: number | null;
  y?: number | null;
  IS_OPPONENT?: boolean | null;
  POINTS?: string | null;
  TRY_ORIGIN?: string | null;
  
  // Legacy format (old)
  ID?: string | number;
  CATEGORY?: string;
  PLAYER?: string;
  ADVANCE?: string;
  TEAM?: string;
  SCRUM_RESULT?: string;
  LINE_RESULT?: string;
  TURNOVER_TYPE?: string;
  INFRACTION_TYPE?: string;
  Time_Group?: string;
  COORDINATE_X?: number | null;
  DURATION?: number;
  SECOND?: number;
  'POINTS(VALUE)'?: number;
  GOAL_KICK?: string;
  'YELLOW-CARD'?: boolean;
  'RED-CARD'?: boolean;
};

export type FilterDescriptor = {
  descriptor: string;
  value: any;
};

// Types for match data structure
export interface MatchData {
  id: number;
  team: string;
  opponent_name: string;
  date: string;
  location?: string;
  video_url?: string;
  competition?: string;
  round?: string;
  field?: string;
  rain?: boolean;
  muddy?: boolean;
  wind_1p?: string;
  wind_2p?: string;
  referee?: string;
  result?: string;
  // Legacy properties for backward compatibility
  ID_MATCH?: number;
  TEAM?: string;
  OPPONENT?: string;
  DATE?: string;
  COMPETITION?: string;
}

// Types for event data structure
export interface EventData {
  id: number;
  match_id: number;
  timestamp_sec: number;
  category: string;
  team: string;
  player_number?: number;
  action_type?: string;
  points_value?: number;
  field_position_x?: number;
  field_position_y?: number;
  // Legacy properties for backward compatibility
  SECOND?: number;
  DURATION?: number;
  CATEGORY?: string;
  TEAM?: string;
  TURNOVER_TYPE?: string;
  Time_Group?: string;
  'POINTS(VALUE)'?: number;
  POINTS?: string;
  GOAL_KICK?: string;
  'YELLOW-CARD'?: boolean;
  'RED-CARD'?: boolean;
}

// Props for components
export interface FileUploadProps {
  onUpload: (fileName: string) => void;
}

export interface HorizontalBarChartProps {
  data: {
    labels: string[];
    datasets: any[];
  };
}

export interface MatchReportProps {
  data: EventData[];
}

export interface MultiMatchHeaderProps {
  matches: MatchData[];
  selectedMatchIds: number[];
  onToggleMatch: (matchId: number) => void;
}

export interface VideoPlayerProps {
  videoUrl: string;
  src?: string;
  tempTime?: number;
  duration?: number;
  isPlayingFilteredEvents?: boolean;
  onEnd?: () => void;
  onStop?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onTimeUpdate?: (time: number) => void;
  onPlayFilteredEvents?: () => void;
  filteredEvents?: EventData[];
}

export interface TurnoversTimeChartProps {
  events: EventData[];
  onChartClick: (event: any, elements: any) => void;
}

export interface TurnoversTypePieChartProps {
  events: EventData[];
  onChartClick: (event: any, elements: any) => void;
}
