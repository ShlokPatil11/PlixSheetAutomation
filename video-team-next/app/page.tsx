import { VideoWorkspace } from "@/components/video-workspace";
import { getVideoWorkspaceData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function VideoTeamPage() {
  const data = await getVideoWorkspaceData();
  return <VideoWorkspace initialData={data} />;
}
