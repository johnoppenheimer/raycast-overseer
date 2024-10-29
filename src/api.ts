import os from "node:os";
import path from "node:path";
import { Dispatcher, request } from "undici";
import { environment, getPreferenceValues } from "@raycast/api";
import { parallel } from "radash";

import {
  OverseerContent,
  OverseerListResponse,
  OverseerMedia,
  OverseerMovie,
  OverseerSearchContent,
  OverseerTV,
} from "./types";
import { Preferences } from "./preferences";

const makeRequest = async <T extends object | object[]>(
  urlPath: string,
  options?: Omit<Dispatcher.RequestOptions, "path" | "headers">,
): Promise<T> => {
  const preferences = getPreferenceValues<Preferences>();
  const p = path.join(preferences.serverUrl, "api/v1", urlPath);

  const { body, statusCode } = await request(p, {
    headers: {
      "X-Api-Key": preferences.token,
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
      const med = await makeRequest<OverseerTV>(`tv/${el.id}`);
      return {
        id: med.id,
        type: "tv",
        title: med.name,
        posterPath: med.posterPath,
      } satisfies OverseerContent;
    }
    const med = await makeRequest<OverseerMovie>(`movie/${el.tmdbId}`);
    return {
      id: med.id,
      type: "movie",
      title: med.title,
      posterPath: med.posterPath,
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

export const createRequest = async (media: OverseerSearchContent) => {
  const response = await makeRequest(`request`, {
    method: "POST",
    body: JSON.stringify({
      mediaType: media.mediaType,
      mediaId: media.id,
    }),
  });

  return response;
};
