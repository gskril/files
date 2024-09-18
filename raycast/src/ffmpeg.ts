import { environment } from "@raycast/api";
import ffmpeg from "fluent-ffmpeg";

ffmpeg.setFfmpegPath("/opt/homebrew/bin/ffmpeg");
ffmpeg.setFfprobePath("/opt/homebrew/bin/ffprobe");

export async function compressVideo(
  filePath: string,
  setFfmpegProgress: React.Dispatch<React.SetStateAction<number>>,
): Promise<string> {
  const outputPath = `${environment.supportPath}/${new Date().getTime()}.mp4`;

  return new Promise((resolve, reject) => {
    ffmpeg(filePath)
      .format("mp4")
      .videoCodec("libx264")
      .videoBitrate(350)
      .fps(30)
      .save(outputPath)
      .on("error", (error) => {
        console.error(error);
        reject(error);
      })
      .on("end", () => {
        resolve(outputPath);
      })
      .on("progress", (progress) => {
        if (progress.percent) {
          setFfmpegProgress(progress.percent);
        }
      })
      .run();
  });
}
