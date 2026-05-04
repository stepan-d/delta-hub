"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MemeCard } from "@/components/memes/meme-card";
import { MemeItem, MemeListResponse } from "@/components/memes/types";
import { Alert } from "@/components/ui/alert";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { apiGet } from "@/lib/api-client";

export function CommunityPreview() {
  const [memes, setMemes] = useState<MemeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadPreview() {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiGet<MemeListResponse>("/api/memes?limit=3&sort=newest", {
          cache: "no-store",
        });

        if (isMounted) {
          setMemes(response.memes);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Nepodařilo se načíst feed.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadPreview();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <LoadingState
        title="Načítám ukázku feedu"
        description="Taháme poslední memy z existujícího backendu, bez falešných dat."
      />
    );
  }

  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  if (memes.length === 0) {
    return (
      <EmptyState
        title="Feed je zatím prázdný"
        description="Jakmile někdo přidá první meme, objeví se tady ukázka aktuální komunitní aktivity."
        action={
          <Link href="/memes/create" className={buttonStyles({ variant: "primary", size: "sm" })}>
            Přidat první meme
          </Link>
        }
      />
    );
  }

  return (
    <div className="min-w-0 space-y-5">
      {memes.map((meme) => (
        <MemeCard key={meme.memeId} meme={meme} compact />
      ))}
      <div className="flex justify-start">
        <Link href="/memes" className={buttonStyles({ variant: "secondary", size: "sm" })}>
          Zobrazit celý feed
        </Link>
      </div>
    </div>
  );
}
