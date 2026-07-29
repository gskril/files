import { Action, ActionPanel, Color, Icon, List } from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { baseUrl, fetchOptions } from "./utils";

interface ListApiResponse {
  truncated: boolean;
  objects: {
    key: string;
    size: number;
    uploaded: string;
    httpMetadata?: {
      contentType?: string;
    };
    customMetadata?: {
      title?: string;
      filename?: string;
    };
  }[];
}

function formatFileSize(bytes: number): string {
  if (bytes < 1000) return `${bytes} B`;
  if (bytes < 1_000_000) return `${(bytes / 1000).toFixed(bytes < 10_000 ? 1 : 0)} KB`;
  return `${(bytes / 1_000_000).toFixed(bytes < 10_000_000 ? 1 : 0)} MB`;
}

function filePresentation(contentType?: string) {
  if (contentType === "application/pdf") {
    return { icon: Icon.Document, label: "PDF", color: Color.Red };
  }

  if (contentType === "application/json" || contentType === "text/json" || contentType === "application/x-json") {
    return { icon: Icon.Code, label: "JSON", color: Color.Blue };
  }

  if (
    contentType === "text/csv" ||
    contentType === "application/csv" ||
    contentType === "text/comma-separated-values" ||
    contentType === "text/x-csv"
  ) {
    return { icon: Icon.BulletPoints, label: "CSV", color: Color.Green };
  }

  if (contentType?.startsWith("audio/")) {
    return { icon: Icon.Music, label: "Audio", color: Color.Purple };
  }

  if (contentType?.startsWith("image/")) {
    return { icon: Icon.Image, label: "Image", color: Color.Blue };
  }

  if (contentType?.startsWith("video/")) {
    return { icon: Icon.Video, label: "Video", color: Color.Purple };
  }

  if (contentType === "text/html") {
    return { icon: Icon.Code, label: "HTML", color: Color.Orange };
  }

  return { icon: Icon.Document, label: "File", color: Color.SecondaryText };
}

export default function FetchData() {
  const { data, isLoading } = useFetch<ListApiResponse>(`${baseUrl}/api/list`, {
    method: "GET",
    ...fetchOptions,
  });

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search shared files…">
      {data?.objects?.map((item) => {
        const shareUrl = `${baseUrl}/share/${item.key}`;
        const cdnUrl = `${baseUrl}/cdn/${item.key}`;
        const presentation = filePresentation(item.httpMetadata?.contentType);
        const title = item.customMetadata?.title || item.customMetadata?.filename || "Untitled";
        const canOpenRaw = ["PDF", "JSON", "CSV", "Audio"].includes(presentation.label);

        return (
          <List.Item
            key={item.key}
            icon={{ source: presentation.icon, tintColor: presentation.color }}
            title={title}
            subtitle={item.customMetadata?.filename}
            accessories={[
              { tag: { value: presentation.label, color: presentation.color } },
              { text: formatFileSize(item.size) },
              { date: new Date(item.uploaded) },
            ]}
            actions={
              <ActionPanel>
                <Action.OpenInBrowser title="Open Share Page" url={shareUrl} />
                {canOpenRaw && (
                  <Action.OpenInBrowser title={`Open ${presentation.label}`} url={cdnUrl} icon={presentation.icon} />
                )}
                <Action.CopyToClipboard title="Copy Share Link" content={shareUrl} />
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}
