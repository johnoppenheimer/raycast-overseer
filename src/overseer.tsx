import {
  Action,
  ActionPanel,
  Color,
  Detail,
  getPreferenceValues,
  Grid,
  Icon,
  showToast,
  Toast,
  useNavigation,
} from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { createRequest, getRecentlyAdded, search } from "./api";
import { useEffect, useState } from "react";
import { mediaStatus, MediaStatus, OverseerSearchContent } from "./types";
import { isEmpty } from "radash";
import { match } from "ts-pattern";
import path from "path";

type ItemAccessory = Grid.Item.Props["accessory"];

function MediaDetail({ media }: { media: OverseerSearchContent }) {
  const preferences = getPreferenceValues<Preferences>();
  const markdown = `
![](https://images.tmdb.org/t/p/w300${media.posterPath})
`;

  const request = async () => {
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Requesting...",
    });

    try {
      const res = await createRequest(media);
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
          <Detail.Metadata.Label title="title" text={media.mediaType === "tv" ? media.name : media.title} />
          {media.mediaInfo != null && media.mediaInfo.status !== MediaStatus.UNKNOWN && (
            <Detail.Metadata.Label title="status" text={mediaStatus(media.mediaInfo?.status)} />
          )}
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          {(media.mediaInfo == null || media.mediaInfo?.status === MediaStatus.UNKNOWN) && (
            <Action title="Request" onAction={request} />
          )}
          <Action.OpenInBrowser
            url={path.join(preferences.serverUrl, media.mediaType, String(media.id))}
            title="Open in Overseer"
          />
        </ActionPanel>
      }
    />
  );
}

function RecentlyAdded() {
  const [query, setQuery] = useState("");
  const { data, isLoading } = usePromise(getRecentlyAdded);
  const [results, setResults] = useState<OverseerSearchContent[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const { push } = useNavigation();

  useEffect(() => {
    (async () => {
      if (!isEmpty(query)) {
        setLoadingSearch(true);
        const q = query.trim();
        const results = await search(q);
        setResults(results);
        setLoadingSearch(false);
      }
    })();
  }, [query]);

  return (
    <Grid
      isLoading={isLoading || loadingSearch}
      searchBarPlaceholder="Search Movies & TV"
      filtering={false}
      fit={Grid.Fit.Fill}
      aspectRatio="9/16"
      onSearchTextChange={setQuery}
      throttle
    >
      {!isEmpty(query) &&
        results.map((media) => (
          <Grid.Item
            key={media.id}
            title={media.mediaType === "tv" ? media.name : media.title}
            subtitle={media.mediaType}
            content={{ source: "https://images.tmdb.org/t/p/w300" + media.posterPath }}
            actions={
              <ActionPanel>
                <Action title="Show Detail" onAction={() => push(<MediaDetail media={media} />)} />
              </ActionPanel>
            }
            accessory={match(media.mediaInfo)
              .returnType<ItemAccessory>()
              .with({ status: MediaStatus.AVAILABLE }, () => ({
                icon: { source: Icon.CheckCircle, tintColor: Color.Green },
              }))
              .with({ status: MediaStatus.PENDING }, () => ({
                icon: { source: Icon.CircleProgress25, tintColor: Color.Purple },
              }))
              .with({ status: MediaStatus.PROCESSING }, () => ({
                icon: { source: Icon.Stopwatch, tintColor: Color.Purple },
              }))
              .otherwise(() => undefined)}
          />
        ))}

      {isEmpty(query) &&
        data?.map((media) => (
          <Grid.Item
            key={media.id}
            title={media.title}
            content={{ source: "https://images.tmdb.org/t/p/w300/" + media.posterPath }}
            actions={
              <ActionPanel>
                <Action title="Show Detail" onAction={() => {}} />
              </ActionPanel>
            }
          />
        ))}
    </Grid>
  );
}
export default function Command() {
  return <RecentlyAdded />;
}
