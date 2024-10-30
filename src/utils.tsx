import { Action, ActionPanel, Color, getPreferenceValues, Icon, Image } from "@raycast/api";
import { MediaStatus } from "./types";
import { match } from "ts-pattern";
import path from "node:path";

export const getMediaStatusIcon = (options?: { status: MediaStatus }) => {
  return match(options)
    .returnType<Image.ImageLike | undefined>()
    .with({ status: MediaStatus.AVAILABLE }, () => ({
      source: Icon.CheckCircle,
      tintColor: Color.Green,
    }))
    .with({ status: MediaStatus.PENDING }, () => ({
      source: Icon.CircleProgress25,
      tintColor: Color.Purple,
    }))
    .with({ status: MediaStatus.PROCESSING }, () => ({
      source: Icon.Stopwatch,
      tintColor: Color.Purple,
    }))
    .with({ status: MediaStatus.PARTIALLY_AVAILABLE }, () => ({
      source: Icon.CircleProgress50,
      tintColor: Color.Yellow,
    }))
    .otherwise(() => undefined);
};

export const GridActions = ({ id, plexUrl, onDetail }: { id: number; plexUrl?: string; onDetail: () => void }) => {
  const preferences = getPreferenceValues<Preferences>();
  return (
    <ActionPanel>
      <Action title="Show Detail" onAction={onDetail} />
      <Action.OpenInBrowser
        icon={Icon.Info}
        url={path.join(preferences.serverUrl, "movie", String(id))}
        title="Open in Overseer"
      />
      {plexUrl != null && <Action.OpenInBrowser icon={Icon.Monitor} url={plexUrl} title="Open in Plex Web" />}
    </ActionPanel>
  );
};
