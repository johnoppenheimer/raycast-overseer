import os from "node:os";
import { environment } from "@raycast/api";
import { parallel } from "radash";
import fetch from "isomorphic-fetch";

import {
  IssueComment,
  OverseerContent,
  OverseerIssue,
  OverseerListResponse,
  OverseerMedia,
  OverseerMovie,
  OverseerSearchContent,
  OverseerTV,
} from "./types";
import { getPreferences } from "./preferences";
import ky from "ky";

const preferences = getPreferences();
const client = ky.create({
  prefixUrl: preferences.serverUrl + "/api/v1",
  headers: {
    Cookie: `connect.sid=${preferences.token}`,
    "User-Agent": `Overseer Raycast Extension, Raycast/${environment.raycastVersion} (${os.type()} ${os.version()})`,
    "Content-Type": "application/json",
  },
  fetch,
});

export const getRecentlyAdded = async () => {
  const media = await client
    .get<OverseerListResponse<OverseerMedia>>("media", {
      searchParams: {
        filter: "allavailable",
        sort: "mediaAdded",
        take: "20",
      },
    })
    .json();

  const contents = await parallel(5, media.results, async (el) => {
    if (el.mediaType === "tv") {
      const med = await client.get<OverseerTV>(`tv/${el.tmdbId}`).json();
      return {
        id: med.id,
        type: "tv",
        title: med.name,
        posterPath: med.posterPath,
        status: el.status,
        mediaInfo: med.mediaInfo,
      } satisfies OverseerContent;
    }
    const med = await client.get<OverseerMovie>(`movie/${el.tmdbId}`).json();
    return {
      id: med.id,
      type: "movie",
      title: med.title,
      posterPath: med.posterPath,
      status: el.status,
      mediaInfo: med.mediaInfo,
    } satisfies OverseerContent;
  });

  return contents;
};

export const search = async (query: string) => {
  const results = await client
    .get<OverseerListResponse<OverseerSearchContent>>("search", {
      searchParams: {
        query: encodeURIComponent(query),
      },
    })
    .json();
  return results.results;
};

export const createRequest = async (id: number, mediaType: "movie" | "tv", seasons?: number[]) => {
  const response = await client.post(`request`, {
    json: {
      mediaId: id,
      mediaType: mediaType,
      seasons,
    },
  });

  return response.json();
};

export const getMedia = async <T extends "tv" | "movie">(id: number, mediaType: T) => {
  const response = await client.get<T extends "tv" ? OverseerTV : OverseerMovie>(`${mediaType}/${id}`);
  return response.json();
};

export const getIssues = async () => {
  const response = await client.get<OverseerListResponse<OverseerIssue>>("issue").json();

  const results = await parallel(5, response.results, async (el) => {
    const fullEl = await client.get<OverseerIssue>(`issue/${el.id}`).json();

    if (el.media.mediaType === "tv") {
      const med = await client.get<OverseerTV>(`tv/${el.media.tmdbId}`).json();
      return {
        ...fullEl,
        posterPath: med.posterPath,
        title: med.name,
      } satisfies OverseerIssue;
    }

    const med = await client.get<OverseerMovie>(`movie/${el.media.tmdbId}`).json();
    return {
      ...fullEl,
      posterPath: med.posterPath,
      title: med.title,
    } satisfies OverseerIssue;
  });

  return results;
};

export const addIssueComment = async (issueId: number, comment: string) => {
  const response = await client
    .post<IssueComment>(`issue/${issueId}/comment`, {
      json: {
        message: comment,
      },
    })
    .json();

  return response;
};

export const updateIssueStatus = async (issueId: number, status: "open" | "resolved") => {
  const response = await client.post<OverseerIssue>(`issue/${issueId}/${status}`).json();

  return response;
};
