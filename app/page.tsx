"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { removeBackground } from "@imgly/background-removal";
import { renderCard } from "@/lib/cardRenderer";
import { uploadCard } from "@/lib/uploadCard";

interface FormData {
  builder: string;
  role: string;
  crew: string;
  project: string;
  beachBag: [string, string, string];
  callsign: string;
}

const initialData: FormData = {
  builder: "",
  role: "",
  crew: "",
  project: "",
  beachBag: ["", "", ""],
  callsign: "",
};

function generateHousePass() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let result = "HH26-";

  for (let i = 0; i < 4; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }

  return result;
}

export default function Home() {
  const [form, setForm] = useState<FormData>(initialData);

  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);

  const [result, setResult] = useState<string | null>(null);

const [housePass, setHousePass] = useState("");
const [cardUrl, setCardUrl] = useState<string | null>(null);



useEffect(() => {
  setHousePass(generateHousePass());
}, []);

useEffect(() => {
  if (!photo || !housePass) return;

  const timeout = setTimeout(async () => {
    try {
      const canvas = await renderCard({
        photo,

        builder: form.builder || "YOUR NAME",
        role: form.role || "YOUR ROLE",
        crew: form.crew || "YOUR CREW",
        project: form.project || "YOUR PROJECT",

        beachBag: [
          form.beachBag[0] || "STACK",
          form.beachBag[1] || "STACK",
          form.beachBag[2] || "STACK",
        ],

        callsign: form.callsign || "YOUR CALLSIGN",

        housePass,
      });

      setResult(canvas.toDataURL("image/png"));
    }  catch (error) {
  console.error("CARD RENDERING FAILED");
  console.error("RAW ERROR:", error);

  try {
    console.error(
      "ERROR JSON:",
      JSON.stringify(error, null, 2)
    );
  } catch {
    console.error("Could not stringify error");
  }

  if (error instanceof Error) {
    console.error("MESSAGE:", error.message);
    console.error("STACK:", error.stack);
  }
}
  }, 250);

  return () => clearTimeout(timeout);
}, [form, photo, housePass]);

  // -----------------------------
  // PHOTO UPLOAD
  // -----------------------------

  async function handlePhotoUpload(
    e: ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      setIsProcessing(true);

      const blob = await removeBackground(file);

      const url = URL.createObjectURL(blob);

      const image = new Image();

      image.onload = () => {
        setPhoto(image);
        URL.revokeObjectURL(url);
        setIsProcessing(false);
      };

      image.onerror = () => {
        console.error("Could not load processed image");
        setIsProcessing(false);
      };

      image.src = url;
    } catch (error) {
      console.error("Background removal failed:", error);
      setIsProcessing(false);
    }
  }

async function uploadGeneratedCard() {
  if (!result || !housePass) return;

  try {
    setIsProcessing(true);

    const url = await uploadCard(
      result,
      housePass,
    );

    

    setCardUrl(url);

    console.log("CARD URL:", url);
  } catch (error) {
    console.error("Card upload failed:", error);
  } finally {
    setIsProcessing(false);
  }
}

function shareToX() {
  if (!cardUrl) return;

  const shareUrl =
    `${window.location.origin}/card/${housePass}` +
    `?image=${encodeURIComponent(cardUrl)}`;

  const text =
    `Just checked into Hacker House Goa 🏝️\n\n` +
    `Building, shipping & vibing from the House.\n\n` +
    `#FrameInGoa`;

  const xUrl =
    `https://x.com/intent/post?text=${encodeURIComponent(text)}` +
    `&url=${encodeURIComponent(shareUrl)}`;

  window.open(
    xUrl,
    "_blank",
    "noopener,noreferrer",
  );
}

  // -----------------------------
  // FIELD UPDATE
  // -----------------------------

  function updateField(
    field: keyof FormData,
    value: string,
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function updateBeachBag(
    index: number,
    value: string,
  ) {
    setForm((previous) => {
      const updated = [...previous.beachBag] as [
        string,
        string,
        string,
      ];

      updated[index] = value;

      return {
        ...previous,
        beachBag: updated,
      };
    });
  }

  // -----------------------------
  // LIVE CARD RENDER
  // -----------------------------

 

  // -----------------------------
  // DOWNLOAD
  // -----------------------------

  function downloadCard() {
    if (!result) return;

    const link = document.createElement("a");

    link.download = `HH-Goa-${form.builder || "Builder"}.png`;

    link.href = result;

    link.click();
  }

  return (
    <main className="min-h-screen bg-[#07110d] px-4 py-8 text-white">

      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-8">
          <p className="mb-2 text-sm font-bold tracking-[0.3em] text-[#FE017E]">
            HACKER HOUSE GOA 2026
          </p>

          <h1 className="text-4xl font-black">
            Build Your Goa Identity
          </h1>

          <p className="mt-2 text-white/60">
            Create your official Hacker House Goa builder pass.
          </p>
        </div>


        {/* MAIN GRID */}

        <div className="grid gap-8 lg:grid-cols-[420px_1fr]">


          {/* ========================= */}
          {/* FORM */}
          {/* ========================= */}

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">

            <h2 className="mb-6 text-xl font-bold">
              Your Details
            </h2>


            {/* PHOTO */}

            <div className="mb-6">

              <label className="mb-2 block text-sm font-bold">
                PHOTO
              </label>

              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/20 bg-black/20 p-8 text-center transition hover:border-[#FE017E]">

                <span className="text-3xl">
                  📸
                </span>

                <span className="mt-3 font-bold">
                  {photo
                    ? "Change Photo"
                    : "Upload Your Photo"}
                </span>

                <span className="mt-1 text-xs text-white/50">
                  JPG, PNG or WebP
                </span>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoUpload}
                  disabled={isProcessing}
                  className="hidden"
                />

              </label>

              {isProcessing && (
                <p className="mt-3 text-center text-sm text-[#FE017E]">
                  ✨ Preparing your photo...
                </p>
              )}

            </div>


            {/* BUILDER */}

            <Input
              label="BUILDER"
              placeholder="Your name"
              value={form.builder}
              onChange={(value) =>
                updateField("builder", value)
              }
            />


            {/* ROLE */}

            <Input
              label="ROLE"
              placeholder="Frontend Developer"
              value={form.role}
              onChange={(value) =>
                updateField("role", value)
              }
            />


            {/* CREW */}

            <Input
              label="CREW"
              placeholder="Team name"
              value={form.crew}
              onChange={(value) =>
                updateField("crew", value)
              }
            />


            {/* PROJECT */}

            <Input
              label="CURRENTLY SHIPPING"
              placeholder="Project name"
              value={form.project}
              onChange={(value) =>
                updateField("project", value)
              }
            />


            {/* BEACH BAG */}

            <div className="mb-5">

              <label className="mb-2 block text-sm font-bold">
                BEACH BAG
              </label>

              <div className="grid grid-cols-3 gap-2">

                {form.beachBag.map((value, index) => (
                  <input
                    key={index}
                    value={value}
                    onChange={(e) =>
                      updateBeachBag(
                        index,
                        e.target.value,
                      )
                    }
                    placeholder={`Stack ${index + 1}`}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none transition focus:border-[#FE017E]"
                  />
                ))}

              </div>

            </div>


            {/* CALLSIGN */}

            <Input
              label="CALLSIGN"
              placeholder="Vibe Coder"
              value={form.callsign}
              onChange={(value) =>
                updateField("callsign", value)
              }
            />


            {/* HOUSE PASS */}

            <div className="mt-6 rounded-xl bg-[#FE017E]/10 p-4">

              <p className="text-xs font-bold tracking-widest text-white/50">
                HOUSE PASS
              </p>

              <p className="mt-1 font-mono text-xl font-bold text-[#FE017E]">
                {housePass}
              </p>

              <p className="mt-1 text-xs text-white/40">
                Automatically generated
              </p>

            </div>

          </section>


          {/* ========================= */}
          {/* PREVIEW */}
          {/* ========================= */}

          <section className="flex flex-col items-center">

            <div className="mb-4 flex w-full max-w-[600px] items-center justify-between">

              <div>
                <p className="text-sm font-bold text-white/50">
                  LIVE PREVIEW
                </p>

                <p className="text-xs text-white/30">
                  Updates automatically
                </p>
              </div>

              {result && (
  <button
    onClick={uploadGeneratedCard}
    disabled={isProcessing}
    className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-black transition hover:scale-105 disabled:opacity-50"
  >
    {isProcessing ? "Preparing..." : "Create Share Card"}
  </button>
)}
{cardUrl && (
  <button
    onClick={shareToX}
    className="rounded-xl bg-black px-6 py-3 font-bold text-white transition hover:scale-105"
  >
    𝕏 Share to X
  </button>
)}

            </div>


            <div className="w-full max-w-[600px] overflow-hidden rounded-2xl shadow-2xl">

              {result ? (
                <img
                  src={result}
                  alt="Your Hacker House Goa Builder Card"
                  className="block w-full"
                />
              ) : (
                <div className="flex aspect-[3/5] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-center text-white/30">

                  <div>
                    <div className="mb-4 text-5xl">
                      🌴
                    </div>

                    <p className="font-bold">
                      Upload a photo to begin
                    </p>

                    <p className="mt-1 text-sm">
                      Your Goa Builder Pass will appear here
                    </p>
                  </div>

                </div>
              )}

            </div>

          </section>

        </div>

      </div>

    </main>
  );
}


// ========================================
// INPUT COMPONENT
// ========================================

function Input({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="mb-5">

      <label className="mb-2 block text-sm font-bold">
        {label}
      </label>

      <input
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition placeholder:text-white/20 focus:border-[#FE017E]"
      />

    </div>
  );
}