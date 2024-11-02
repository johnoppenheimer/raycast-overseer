export enum MediaStatus {
  UNKNOWN = 1,
  PENDING = 2,
  PROCESSING = 3,
  PARTIALLY_AVAILABLE = 4,
  AVAILABLE = 5,
}

export enum MediaType {
  MOVIE = "movie",
  TV = "tv",
  PERSON = "person",
}

export const mediaStatus = (status?: MediaStatus): string => {
  switch (status) {
    case MediaStatus.PROCESSING:
      return "requested";
    case MediaStatus.PENDING:
      return "pending";
    case MediaStatus.PARTIALLY_AVAILABLE:
      return "partially available";
    case MediaStatus.AVAILABLE:
      return "available";
    default:
      return "";
  }
};

export type OverseerListResponse<T> = {
  pageInfo: {
    pages: number;
    pageSize: number;
    results: number;
    page: number;
  };
  results: T[];
};

export type OverseerRequest = {
  id: number;
  status: number;
  media: {
    id: number;
  };
};

export type OverseerMedia = {
  id: number;
  createdAt: string;
  updatedAt: string;
  mediaType: "tv" | "movie";
  tvdbId: number;
  tmdbId: number;
  status: MediaStatus;
};

export type OverseerContent = {
  id: number;
  type: "tv" | "movie";
  title: string;
  posterPath: string;
  status: MediaStatus;
  mediaInfo?: MediaInfo;
};

export type Credits = {
  crew: (People & { job: string; department: string })[];
  cast: People[];
};

export type TVSeason = {
  id: number;
  episodeCount: number;
  airDate: string;
  overview: string;
  posterPath: string;
  name: string;
  seasonNumber: number;
};

export type OverseerTV = {
  id: number;
  name: string;
  originalName: string;
  posterPath: string;
  status: string;
  createdBy?: (People & { credit_id: string })[];
  credits: Credits;
  mediaInfo?: MediaInfo;
  seasons: TVSeason[];
  numberOfSeasons: number;
  numberOfEpisodes: number;
  overview: string;
};

export type People = {
  id: number;
  name: string;
};

export type OverseerMovie = {
  id: number;
  title: string;
  originalTitle: string;
  posterPath: string;
  status: string;
  mediaInfo: MediaInfo;
  credits: Credits;
  overview: string;
};

type MediaInfo = {
  id: number;
  tvdbId: number;
  tmdbId: number;
  status: MediaStatus;
  mediaType: "tv" | "movie";
  plexUrl?: string;
  iOSPlexUrl?: string;
};

export type OverseerSearchContent = {
  id: number;
  posterPath: string;
  mediaInfo?: MediaInfo;
} & (
  | {
      mediaType: "tv";
      name: string;
    }
  | {
      mediaType: "movie";
      title: string;
    }
  | {
      mediaType: "person";
      name: string;
    }
);

export enum IssueType {
  VIDEO = 1,
  AUDIO = 2,
  SUBTITLE = 3,
  OTHER = 4,
}

export const issueType = (type: IssueType): string => {
  switch (type) {
    case IssueType.VIDEO:
      return "video";
    case IssueType.AUDIO:
      return "audio";
    case IssueType.SUBTITLE:
      return "subtitle";
    case IssueType.OTHER:
      return "other";
    default:
      return "";
  }
};

export type OverseerUser = {
  id: number;
  email: string;
  plexUsername: string;
  username: string;
  displayName: string;
  avatar: string;
};

export type OverseerIssue = {
  id: number;
  issueType: IssueType;
  createdAt: string;
  updatedAt: string;
  problemSeason?: number;
  problemEpisode?: number;
  createdBy: OverseerUser;
  media: MediaInfo;
  comments?: IssueComment[];
  posterPath?: string;
  title?: string;
};

export type IssueComment = {
  id: number;
  user: OverseerUser;
  message: string;
};
