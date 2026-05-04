import { MemeListPanel } from "@/components/memes/meme-panels";

type MemesPageProps = {
  searchParams: Promise<{
    search?: string;
    sort?: "newest" | "oldest" | "mostLiked";
    categoryId?: string;
    tag?: string;
  }>;
};

export default async function MemesPage({ searchParams }: MemesPageProps) {
  const params = await searchParams;

  return (
    <MemeListPanel
      initialFilters={{
        search: params.search,
        sort: params.sort,
        categoryId: params.categoryId,
        tag: params.tag,
      }}
    />
  );
}
