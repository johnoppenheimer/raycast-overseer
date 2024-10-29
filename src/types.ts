export enum MediaStatus {
  UNKNOWN = 1,
  PENDING = 2,
  PROCESSING = 3,
  PARTIALLY_AVAILABLE = 4,
  AVAILABLE = 5,
}

export const mediaStatus = (status: MediaStatus): string => {
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
  status: number;
};

export type OverseerContent = {
  id: number;
  type: "tv" | "movie";
  title: string;
  posterPath: string;
};

export type OverseerTV = {
  id: number;
  name: string;
  originalName: string;
  posterPath: string;
  mediaType: "tv";
};

export type OverseerMovie = {
  id: number;
  title: string;
  originalTitle: string;
  posterPath: string;
  mediaType: "movie";
};

export type OverseerSearchContent = {
  id: number;
  posterPath: string;
  mediaInfo?: {
    id: number;
    tvdbId: number;
    tmdbId: number;
    status: MediaStatus;
  };
} & (
  | {
      mediaType: "tv";
      name: string;
    }
  | {
      mediaType: "movie";
      title: string;
    }
);
