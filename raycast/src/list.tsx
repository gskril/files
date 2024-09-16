import { Action, ActionPanel, List } from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { baseUrl, fetchOptions } from "./utils";

interface ListApiResponse {
  truncated: boolean;
  objects: {
    key: string;
    size: number;
    uploaded: string;
    customMetadata: {
      title: string;
    };
  }[];
}

export default function FetchData() {
  const { data, isLoading } = useFetch<ListApiResponse>(`${baseUrl}/api/list`, {
    method: "GET",
    ...fetchOptions,
  });

  return (
    <List isLoading={isLoading}>
      {data?.objects?.map((item) => (
        <List.Item
          key={item.key}
          title={item.customMetadata.title}
          subtitle={item.key.slice(0, 12) + "..."}
          accessories={[{ text: `${Math.round(item.size / 1000)} KB` }]}
          actions={
            <ActionPanel>
              <Action.OpenInBrowser url={`${baseUrl}/share/${item.key}`} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
