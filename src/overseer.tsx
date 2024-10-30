import { Grid, useNavigation } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { getRecentlyAdded, search } from "./api";
import { useEffect, useState } from "react";
import { OverseerSearchContent } from "./types";
import { isEmpty } from "radash";
import { HomeView } from "./HomeView";
import { getMediaStatusIcon, GridActions } from "./utils";
import { MovieDetail } from "./MovieDetail";
import { TVDetail } from "./TVDetail";

const getTitle = (media: OverseerSearchContent) => {
  if (media.mediaType === "movie") {
    return media.title;
  }
  return media.name;
};

export default function Command() {
  const { push } = useNavigation();
  const [query, setQuery] = useState("");
  const { data, isLoading } = usePromise(getRecentlyAdded);
  const [results, setResults] = useState<OverseerSearchContent[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

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

  const goToDetail = (content: OverseerSearchContent) => {
    if (content.mediaType === "tv") {
      push(<TVDetail id={content.id} />);
    } else {
      push(<MovieDetail id={content.id} />);
    }
  };

  return (
    <Grid
      isLoading={isLoading || loadingSearch}
      searchBarPlaceholder="Search Movies & TV"
      filtering={false}
      fit={Grid.Fit.Fill}
      aspectRatio="2/3"
      onSearchTextChange={setQuery}
      throttle
    >
      {!isEmpty(query) &&
        results.map((media) => (
          <Grid.Item
            key={media.id}
            title={getTitle(media)}
            subtitle={media.mediaType}
            content={{ source: "https://images.tmdb.org/t/p/w300" + media.posterPath }}
            actions={
              media.mediaType !== "person" ? (
                <GridActions id={media.id} plexUrl={media.mediaInfo?.plexUrl} onDetail={() => goToDetail(media)} />
              ) : undefined
            }
            accessory={{ icon: getMediaStatusIcon(media.mediaInfo) }}
          />
        ))}

      {isEmpty(query) && <HomeView data={data} />}
    </Grid>
  );
}
