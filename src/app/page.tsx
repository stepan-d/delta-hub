import Link from "next/link";
import { CommunityPreview } from "@/components/home/community-preview";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex min-w-0 flex-col gap-12 pb-4">
      <section className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:items-center">
        <div className="min-w-0 space-y-7">
          <Badge variant="brand">Komunitní platforma pro DELTA</Badge>
          <div className="space-y-5">
            <h1 className="max-w-4xl break-words text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-[4rem] lg:leading-[1.02]">
              Komunitní hub pro memy, dění ve škole a aktivní komunitu.
            </h1>
            <p className="max-w-2xl break-words text-lg leading-8 text-slate-600">
              DELTA Hub spojuje feed, akce a správu obsahu do jednoho přehledného
              produktu. Rozhraní je navržené tak, aby působilo důvěryhodně na první
              pohled a neztrácelo se v zbytečném chaosu.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/memes" className={buttonStyles({ variant: "primary", size: "lg" })}>
              Projít feed
            </Link>
            <Link href="/register" className={buttonStyles({ variant: "secondary", size: "lg" })}>
              Vytvořit účet
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-slate-500">Feed</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">Memy a diskuze</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-slate-500">Účty</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">Přihlášení a profil</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-slate-500">Moderace</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">Admin a reporty</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="min-w-0 overflow-hidden border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(239,246,255,0.92)_100%)]">
          <CardContent className="p-0">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
              </div>
              <Badge variant="outline">Live preview</Badge>
            </div>
            <div className="space-y-5 p-6">
              <div className="rounded-[24px] bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_100%)] p-6 text-white shadow-[0_18px_48px_rgba(29,78,216,0.22)]">
                <p className="text-sm text-blue-100">Komunitní feed</p>
                <p className="mt-2 break-words text-2xl font-semibold tracking-[-0.03em]">
                  Rozhraní, které působí jako hotový produkt, ne jako školní prototyp.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                  <p className="text-sm font-medium text-slate-500">Memy</p>
                  <p className="mt-2 text-base leading-7 text-slate-700">
                    Karty s filtry, reakcemi a detailem každého příspěvku.
                  </p>
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                  <p className="text-sm font-medium text-slate-500">Účty</p>
                  <p className="mt-2 text-base leading-7 text-slate-700">
                    Přihlášení, registrace a profil navázaný na reálné uživatele.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid min-w-0 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Jeden jasný vizuální jazyk</CardTitle>
            <CardDescription>
              Karty, formuláře i navigace drží stejné proporce, spacing a barevnou logiku.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Rychlá orientace</CardTitle>
            <CardDescription>
              Důležité akce jsou vidět hned a obsah má dost prostoru dýchat.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Produktový dojem</CardTitle>
            <CardDescription>
              UI působí konzistentně napříč feedem, detailem, auth i administrací.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>

      <section className="space-y-6">
        <div className="space-y-2">
          <Badge variant="accent">Aktuální obsah</Badge>
          <h2 className="break-words text-3xl font-semibold tracking-[-0.03em] text-slate-950">
            Nejnovější příspěvky z komunity
          </h2>
          <p className="max-w-3xl break-words text-base leading-7 text-slate-600">
            Homepage rovnou ukazuje obsah z backendu. Když je feed prázdný,
            zobrazí se klidný empty state místo zbytečných placeholderů.
          </p>
        </div>

        <CommunityPreview />
      </section>
    </div>
  );
}
