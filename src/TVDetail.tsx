import { Action, ActionPanel, Detail, Form, getPreferenceValues, showToast, Toast, useNavigation } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { createRequest, getMedia } from "./api";
import { MediaStatus, mediaStatus, OverseerTV } from "./types";
import path from "node:path";
import { getMediaStatusIcon } from "./utils";
import { useState } from "react";

function SeasonSelector({ media }: { media: OverseerTV }) {
  const { pop } = useNavigation();
  const [selectedSeasons, setSelectedSeasons] = useState<number[]>([]);

  const onSubmit = async () => {
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Requesting...",
    });

    try {
      await createRequest(media.id, "tv", selectedSeasons);
      toast.title = "Requested!";
      toast.style = Toast.Style.Success;
      pop();
    } catch (err) {
      console.error(err);
      toast.title = "Error";
      toast.style = Toast.Style.Failure;
      if (err instanceof Error) {
        toast.message = err.message;
      }
    }
  };

  const selectAll = () => {
    setSelectedSeasons(media.seasons.map((season) => season.seasonNumber));
  };

  return (
    <Form
      actions={
        <ActionPanel>
          <Action title="Select All" onAction={selectAll} />
          <Action.SubmitForm title="Request" onSubmit={onSubmit} />
        </ActionPanel>
      }
    >
      {media.seasons.map((season) => (
        <Form.Checkbox
          id={String(season.id)}
          key={String(season.id)}
          label={season.name}
          value={selectedSeasons.includes(season.seasonNumber)}
          onChange={(value) => {
            if (value) {
              setSelectedSeasons([...selectedSeasons, season.seasonNumber]);
            } else {
              setSelectedSeasons(selectedSeasons.filter((s) => s !== season.seasonNumber));
            }
          }}
        />
      ))}
    </Form>
  );
}

function Content({ media }: { media: OverseerTV }) {
  const { push } = useNavigation();
  const preferences = getPreferenceValues<Preferences>();

  console.log(media.mediaInfo);

  const markdown = `
# ${media.name}
![](https://images.tmdb.org/t/p/w300${media.posterPath})
`;

  return (
    <Detail
      markdown={markdown}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label
            title="status"
            icon={getMediaStatusIcon(media.mediaInfo)}
            text={mediaStatus(media.mediaInfo?.status)}
          />
          <Detail.Metadata.Label
            title="Director(s)"
            text={media.credits.crew
              .filter((u) => u.job === "Director")
              .map((u) => u.name)
              .join(", ")}
          />
          <Detail.Metadata.Label title="Status" text={media.status} />
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          {(media.mediaInfo == null || media.mediaInfo?.status === MediaStatus.UNKNOWN) && (
            <Action title="Request" onAction={() => push(<SeasonSelector media={media} />)} />
          )}
          <Action.OpenInBrowser
            url={path.join(preferences.serverUrl, "tv", String(media.id))}
            title="Open in Overseer"
          />
          {media.mediaInfo?.iOSPlexUrl != null && (
            <Action.OpenInBrowser url={media.mediaInfo.iOSPlexUrl} title="Open in Plex" />
          )}
        </ActionPanel>
      }
    />
  );
}

export function TVDetail({ id }: { id: number }) {
  const { data: media, isLoading } = usePromise(getMedia, [id, "tv"]);

  if (media == null || isLoading) return <Detail isLoading markdown="" />;

  return <Content media={media as OverseerTV} />;
}
