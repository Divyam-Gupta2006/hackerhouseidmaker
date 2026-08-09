import type { Metadata } from "next";

interface ShareCardProps {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    image?: string;
  }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: ShareCardProps): Promise<Metadata> {
  const { id } = await params;
  const { image } = await searchParams;

  const cardImage = image
    ? decodeURIComponent(image)
    : undefined;

  return {
    title: `Hacker House Goa — ${id}`,

    description:
      "My Hacker House Goa 2026 Builder Identity.",

    openGraph: {
      title: `Hacker House Goa — ${id}`,

      description:
        "My Hacker House Goa 2026 Builder Identity.",

      type: "website",

      ...(cardImage
        ? {
            images: [
              {
                url: cardImage,
                width: 1200,
                height: 2000,
                alt: `Hacker House Goa Builder Card ${id}`,
              },
            ],
          }
        : {}),
    },

    twitter: {
      card: "summary_large_image",

      title: `Hacker House Goa — ${id}`,

      description:
        "My Hacker House Goa 2026 Builder Identity.",

      ...(cardImage
        ? {
            images: [cardImage],
          }
        : {}),
    },
  };
}

export default async function ShareCard({
  params,
  searchParams,
}: ShareCardProps) {
  const { id } = await params;
  const { image } = await searchParams;

  const cardImage = image
    ? decodeURIComponent(image)
    : null;

  return (
    <main className="min-h-screen bg-[#07110d] px-4 py-10 text-white">
      <div className="mx-auto flex max-w-2xl flex-col items-center">

        {/* HEADER */}

        <p className="mb-3 text-sm font-bold tracking-[0.3em] text-[#FE017E]">
          HACKER HOUSE GOA 2026
        </p>

        <h1 className="mb-2 text-center text-3xl font-black">
          BUILDER IDENTITY
        </h1>

        <p className="mb-8 text-center font-mono text-sm text-white/40">
          {id}
        </p>

        {/* CARD */}

        {cardImage ? (
          <img
            src={cardImage}
            alt={`Hacker House Goa Builder Card ${id}`}
            className="w-full max-w-[600px] rounded-2xl shadow-2xl"
          />
        ) : (
          <div className="flex aspect-[3/5] w-full max-w-[600px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-center">
            <div>
              <div className="mb-4 text-5xl">
                🌴
              </div>

              <p className="font-bold">
                Card image unavailable
              </p>

              <p className="mt-2 text-sm text-white/40">
                The generated card could not be loaded.
              </p>
            </div>
          </div>
        )}

        {/* FOOTER */}

        <p className="mt-8 text-center text-sm text-white/40">
          Built at Hacker House Goa 🏝️
        </p>

        <p className="mt-2 text-center text-sm font-bold text-[#FE017E]">
          #FrameInGoa
        </p>

      </div>
    </main>
  );
}