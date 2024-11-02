import os from "node:os";
import path from "node:path";
import { Dispatcher, request } from "undici";
import { environment } from "@raycast/api";
import { parallel } from "radash";

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

const makeRequest = async <T extends object | object[]>(
  urlPath: string,
  options?: Omit<Dispatcher.RequestOptions, "path" | "headers">,
): Promise<T> => {
  const preferences = getPreferences();
  const p = path.join(preferences.serverUrl, "api/v1", urlPath);

  const { body, statusCode } = await request(p, {
    headers: {
      Cookie: `connect.sid=${preferences.token}`,
      "User-Agent": `Overseer Raycast Extension, Raycast/${environment.raycastVersion} (${os.type()} ${os.version()})`,
      "Content-Type": "application/json",
    },
    ...options,
  });

  const data = await body.json();

  if (statusCode >= 400) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    throw new Error((data as any).message);
  }

  return data as T;
};

export const getRecentlyAdded = async () => {
  const media = await makeRequest<OverseerListResponse<OverseerMedia>>(
    "media?filter=allavailable&sort=mediaAdded&take=20",
  );

  const contents = await parallel(5, media.results, async (el) => {
    if (el.mediaType === "tv") {
      const med = await makeRequest<OverseerTV>(`tv/${el.tmdbId}`);
      return {
        id: med.id,
        type: "tv",
        title: med.name,
        posterPath: med.posterPath,
        status: el.status,
        mediaInfo: med.mediaInfo,
      } satisfies OverseerContent;
    }
    const med = await makeRequest<OverseerMovie>(`movie/${el.tmdbId}`);
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
  const results = await makeRequest<OverseerListResponse<OverseerSearchContent>>(
    `search?query=${encodeURIComponent(query)}`,
  );
  return results.results;
};

export const createRequest = async (id: number, mediaType: "movie" | "tv", seasons?: number[]) => {
  const response = await makeRequest(`request`, {
    method: "POST",
    body: JSON.stringify({
      mediaId: id,
      mediaType: mediaType,
      seasons,
    }),
  });

  return response;
};

export const getMedia = async <T extends "tv" | "movie">(id: number, mediaType: T) => {
  const response = await makeRequest<T extends "tv" ? OverseerTV : OverseerMovie>(`${mediaType}/${id}`);
  return response;
};

export const getIssues = async () => {
  const response = await makeRequest<OverseerListResponse<OverseerIssue>>("issue");

  const results = await parallel(5, response.results, async (el) => {
    const fullEl = await makeRequest<OverseerIssue>(`issue/${el.id}`);

    if (el.media.mediaType === "tv") {
      const med = await makeRequest<OverseerTV>(`tv/${el.media.tmdbId}`);
      return {
        ...fullEl,
        posterPath: med.posterPath,
        title: med.name,
      } satisfies OverseerIssue;
    }

    const med = await makeRequest<OverseerMovie>(`movie/${el.media.tmdbId}`);
    return {
      ...fullEl,
      posterPath: med.posterPath,
      title: el.title,
    } satisfies OverseerIssue;
  });

  return results;
};

export const addIssueComment = async (issueId: number, comment: string) => {
  const response = await makeRequest<IssueComment>(`issue/${issueId}/comment`, {
    method: "POST",
    body: JSON.stringify({
      message: comment,
    }),
  });

  return response;
};

export const updateIssueStatus = async (issueId: number, status: "open" | "resolved") => {
  const response = await makeRequest<OverseerIssue>(`issue/${issueId}/${status}`, {
    method: "POST",
  });

  return response;
};
