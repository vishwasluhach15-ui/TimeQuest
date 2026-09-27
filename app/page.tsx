import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-24">
      <p className="text-sm tracking-wide text-lapis">TimeQuest</p>
      <h1 className="mt-3 font-display text-5xl leading-tight text-ink sm:text-6xl">
        Walk the streets of Mohenjo-daro,
        <br />
        four and a half thousand years ago.
      </h1>
      <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/80">
        Explore a small plot of the city, talk to the Elder, and collect
        knowledge cards scattered among the ruins. The adaptive quiz and
        learning dashboard come in the next phase.
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link
          href="/play"
          className="inline-block rounded-sm bg-clay px-6 py-3 text-bone transition-colors hover:bg-clay/90"
        >
          Enter the ruins
        </Link>
        <Link
          href="/cards"
          className="inline-block rounded-sm border border-sandstone px-6 py-3 text-ink transition-colors hover:bg-sandstone/20"
        >
          Browse knowledge cards
        </Link>
      </div>
    </main>
  );
}
