import { MemeDetailPanel } from "@/components/memes/meme-panels";

type MemeDetailPageProps = {
  params: Promise<{ memeId: string }>;
};

export default async function MemeDetailPage({ params }: MemeDetailPageProps) {
  const { memeId } = await params;
  const parsedMemeId = Number(memeId);

  return <MemeDetailPanel memeId={parsedMemeId} />;
}
