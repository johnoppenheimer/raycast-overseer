/* eslint-disable @typescript-eslint/no-explicit-any */
import { Action, ActionPanel, Color, Form, Icon, List, showToast, Toast, useNavigation } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { addIssueComment, getIssues, updateIssueStatus } from "./api";
import { IssueType, issueType, OverseerIssue } from "./types";
import { match } from "ts-pattern";
import path from "node:path";
import { getPreferences } from "./preferences";
import dayjs from "dayjs";
import { isEmpty } from "radash";

const formatComments = (issue: OverseerIssue): string => {
  if (issue.comments == null) return "";

  return issue.comments.map((c) => `*${c.user.displayName}*: ${c.message}`).join("\n\n");
};

function IssueCommentForm({ issue }: { issue: OverseerIssue }) {
  const { pop } = useNavigation();
  const onSubmit = async (values: { comment: string }, close = false) => {
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Adding comment...",
    });

    if (!isEmpty(values.comment)) {
      try {
        await addIssueComment(issue.id, values.comment);
      } catch (err) {
        console.error(err);
        toast.title = "Error";
        toast.style = Toast.Style.Failure;
        if (err instanceof Error) {
          toast.message = err.message;
        }
        return;
      }
    }

    if (close) {
      toast.title = "Closing issue";

      try {
        await updateIssueStatus(issue.id, "resolved");
      } catch (err) {
        console.error(err);
        toast.title = "Error";
        toast.style = Toast.Style.Failure;
        if (err instanceof Error) {
          toast.message = err.message;
        }
        return;
      }
    } else {
      toast.title = "Comment added";
    }

    toast.style = Toast.Style.Success;

    pop();
  };

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Add Comment" onSubmit={(v) => onSubmit(v as any)} />
          <Action.SubmitForm title="Add Comment and Close" onSubmit={(v) => onSubmit(v as any, true)} />
        </ActionPanel>
      }
    >
      <Form.TextArea id="comment" placeholder="Add a comment..." />
    </Form>
  );
}

export default function Command() {
  const preferences = getPreferences();
  const { push } = useNavigation();
  const { data: issues, isLoading, revalidate } = useCachedPromise(getIssues);

  const closeIssue = async (issue: OverseerIssue) => {
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Closing issue...",
    });

    try {
      await updateIssueStatus(issue.id, "resolved");
      toast.title = "Issue closed";
      toast.style = Toast.Style.Success;
      revalidate();
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
    <List isLoading={isLoading} navigationTitle="Issues" isShowingDetail>
      {issues != null && issues.length <= 0 && <List.EmptyView title="No open issues" />}
      <List.Section title="Issues">
        {issues?.map((issue) => (
          <List.Item
            key={String(issue.id)}
            title={issue.title!}
            accessories={[
              {
                text: issue.createdBy.displayName,
                icon: Icon.Person,
                tooltip: issue.createdBy.email,
              },
            ]}
            detail={
              <List.Item.Detail
                markdown={formatComments(issue)}
                metadata={
                  <List.Item.Detail.Metadata>
                    <List.Item.Detail.Metadata.TagList title="Type">
                      <List.Item.Detail.Metadata.TagList.Item
                        text={issueType(issue.issueType)}
                        color={match(issue.issueType)
                          .with(IssueType.VIDEO, () => Color.Red)
                          .with(IssueType.AUDIO, () => Color.Orange)
                          .with(IssueType.SUBTITLE, () => Color.Yellow)
                          .with(IssueType.OTHER, () => Color.Green)
                          .otherwise(() => undefined)}
                      />
                    </List.Item.Detail.Metadata.TagList>
                    {issue.problemSeason != null && (
                      <List.Item.Detail.Metadata.Label
                        title="Season"
                        text={issue.problemSeason.toString()}
                        icon={Icon.Hashtag}
                      />
                    )}
                    {issue.problemEpisode != null && (
                      <List.Item.Detail.Metadata.Label
                        title="Episode"
                        text={issue.problemEpisode === 0 ? "All" : issue.problemEpisode.toString()}
                        icon={Icon.Circle}
                      />
                    )}
                    <List.Item.Detail.Metadata.Separator />
                    <List.Item.Detail.Metadata.Label
                      title="Created by"
                      text={issue.createdBy.displayName}
                      icon={{ source: issue.createdBy.avatar ?? Icon.PersonCircle }}
                    />
                    <List.Item.Detail.Metadata.Label
                      title="Created at"
                      text={dayjs(issue.createdAt).format("D MMM YYYY")}
                      icon={Icon.Calendar}
                    />
                  </List.Item.Detail.Metadata>
                }
              />
            }
            actions={
              <ActionPanel>
                {issue.media.plexUrl != null && <Action.OpenInBrowser url={issue.media.plexUrl} title="Open in Plex" />}
                <Action.OpenInBrowser
                  icon={Icon.Info}
                  url={path.join(preferences.serverUrl, issue.media.mediaType, String(issue.media.tmdbId))}
                  title="Open in Overseer"
                />
                <Action title="Close Issue" onAction={() => closeIssue(issue)} icon={Icon.CheckCircle} />
                <Action
                  title="Add Comment"
                  onAction={() => push(<IssueCommentForm issue={issue} />)}
                  icon={Icon.Message}
                />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    </List>
  );
}
