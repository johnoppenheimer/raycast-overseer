import { Action, ActionPanel, Detail, Icon, showToast, Toast } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { createRequest, getMedia } from "../api";
import { mediaStatus, MediaStatus, OverseerMovie } from "../types";
import path from "node:path";
import { getMediaStatusIcon } from "../utils";
import { getPreferences } from "../preferences";

function Content({ media }: { media: OverseerMovie }) {
  const preferences = getPreferences();

  const markdown = `
# ${media.title}
![](https://images.tmdb.org/t/p/w300${media.posterPath})

${media.overview}
`;

  const request = async () => {
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Requesting...",
    });

    try {
      const res = await createRequest(media.id, "movie");
      console.log(res);
      toast.title = "Requested!";
      toast.style = Toast.Style.Success;
    } catch (err) {
      console.error(err);
      toast.title = "Error";
      toast.style = Toast.Style.Failure;
      if (err instanceof Error) {
        toast.message = err.message;
      }
    }
  };

  return (
    <Detail
      markdown={markdown}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label
            title="status"
            icon={getMediaStatusIcon(media.mediaInfo)}
            text={mediaStatus(media.mediaInfo.status)}
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
          {media.mediaInfo.status === MediaStatus.UNKNOWN && <Action title="Request" onAction={request} />}
          <Action.OpenInBrowser
            icon={Icon.Info}
            url={path.join(preferences.serverUrl, "movie", String(media.id))}
            title="Open in Overseer"
          />
          {media.mediaInfo.plexUrl != null && (
            <Action.OpenInBrowser icon={Icon.Monitor} url={media.mediaInfo.plexUrl} title="Open in Plex Web" />
          )}
        </ActionPanel>
      }
    />
  );
}

export function MovieDetail({ id }: { id: number }) {
  const { data: media, isLoading } = usePromise(getMedia, [id, "movie"]);

  if (media == null || isLoading) return <Detail isLoading markdown="" />;

  return <Content media={media as OverseerMovie} />;
}
