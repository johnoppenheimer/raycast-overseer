import { Grid, useNavigation } from "@raycast/api";
import { OverseerContent } from "../types";
import { getMediaStatusIcon, GridActions } from "../utils";
import { MovieDetail } from "./MovieDetail";
import { TVDetail } from "./TVDetail";

export function HomeView({ data }: { data?: OverseerContent[] }) {
  const { push } = useNavigation();

  const goToDetail = (content: OverseerContent) => {
    if (content.type === "tv") {
      push(<TVDetail id={content.id} />);
    } else {
      push(<MovieDetail id={content.id} />);
    }
  };

  return (
    <Grid.Section title="Recently Added">
      {data?.map((media) => (
        <Grid.Item
          id={String(media.id)}
          key={media.id}
          title={media.title}
          subtitle={media.type}
          content={{ source: "https://images.tmdb.org/t/p/w300/" + media.posterPath }}
          accessory={{ icon: getMediaStatusIcon(media) }}
          actions={<GridActions id={media.id} plexUrl={media.mediaInfo?.plexUrl} onDetail={() => goToDetail(media)} />}
        />
      ))}
    </Grid.Section>
  );
}
