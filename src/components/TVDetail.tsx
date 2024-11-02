import { Action, ActionPanel, Color, Detail, Icon, List, showToast, Toast, useNavigation } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { createRequest, getMedia } from "../api";
import { MediaStatus, mediaStatus, OverseerTV } from "../types";
import path from "node:path";
import { getMediaStatusIcon } from "../utils";
import { useState } from "react";
import { isEmpty } from "radash";
import dayjs from "dayjs";
import { getPreferences } from "../preferences";

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
    <List isShowingDetail navigationTitle="Select Seasons">
      <List.Section title="Select seasons">
        {media.seasons.map((season) => (
          <List.Item
            id={String(season.id)}
            key={String(season.id)}
            title={season.name}
            keywords={[season.name]}
            icon={
              selectedSeasons.includes(season.seasonNumber)
                ? { source: Icon.CheckCircle, tintColor: Color.Green }
                : Icon.Circle
            }
            detail={
              <List.Item.Detail
                metadata={
                  <List.Item.Detail.Metadata>
                    <List.Item.Detail.Metadata.Label title="Episodes" text={String(season.episodeCount)} />
                    <List.Item.Detail.Metadata.Label
                      title="Air Date"
                      text={dayjs(season.airDate).format("D MMM YYYY")}
                    />
                  </List.Item.Detail.Metadata>
                }
              />
            }
            actions={
              <ActionPanel>
                {selectedSeasons.includes(season.seasonNumber) ? (
                  <Action
                    title="Deselect"
                    onAction={() => setSelectedSeasons(selectedSeasons.filter((s) => s !== season.seasonNumber))}
                  />
                ) : (
                  <Action
                    title="Select"
                    onAction={() => setSelectedSeasons([...selectedSeasons, season.seasonNumber])}
                  />
                )}
                <Action title="Select All" onAction={selectAll} />
                <Action title="Deselect All" onAction={() => setSelectedSeasons([])} />
                <Action title="Request" onAction={onSubmit} />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    </List>
  );
}

function Content({ media }: { media: OverseerTV }) {
  const { push } = useNavigation();
  const preferences = getPreferences();

  const markdown = `
# ${media.name}
![](https://images.tmdb.org/t/p/w300${media.posterPath})

${media.overview}
`;
  const directors = media.credits.crew
    .filter((u) => u.job === "Director")
    .map((u) => u.name)
    .join(", ");

  return (
    <Detail
      markdown={markdown}
      metadata={
        <Detail.Metadata>
          {media.mediaInfo != null && (
            <Detail.Metadata.Label
              title="status"
              icon={getMediaStatusIcon(media.mediaInfo)}
              text={mediaStatus(media.mediaInfo?.status)}
            />
          )}
          {media.createdBy != null && (
            <Detail.Metadata.Label title="Created By" text={media.createdBy.map((u) => u.name).join(", ")} />
          )}
          {!isEmpty(directors) && <Detail.Metadata.Label title="Director(s)" text={directors} />}
          <Detail.Metadata.Label title="Status" text={media.status} />
          <Detail.Metadata.Separator />
          <Detail.Metadata.Label title="Seasons" text={media.numberOfSeasons.toString()} icon={Icon.Hashtag} />
          <Detail.Metadata.Label title="Episodes" text={media.numberOfEpisodes.toString()} />
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
