"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { removeBackground } from "@imgly/background-removal";
import { renderCard } from "@/lib/cardRenderer";
import { enableDevToolsProtection } from "@/lib/devToolsProtection";
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

const POPULAR_TECH_STACKS = [
  "React",
  "Next.js",
  "Vue.js",
  "Svelte",
  "TypeScript",
  "Node.js",
  "Python",
  "Go",
  "Rust",
  "Solidity",
  "Tailwind CSS",
  "PyTorch",
  "OpenAI API",
  "LangChain",
  "PostgreSQL",
  "GraphQL",
  "Docker",
  "Kubernetes",
  "Supabase",
  "Ethers.js",
  "Viem/Wagmi",
  "Foundry",
  "Flutter",
  "React Native",
  "Other",
];

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
  const [beachBagOther, setBeachBagOther] = useState<[boolean, boolean, boolean]>([false, false, false]);

  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);

  const [result, setResult] = useState<string | null>(null);

  const [housePass, setHousePass] = useState("");
  const [cardUrl, setCardUrl] = useState<string | null>(null);

  useEffect(() => {
    setHousePass(generateHousePass());
  }, []);

  useEffect(() => {
    return enableDevToolsProtection();
  }, []);

  useEffect(() => {
    if (!housePass) return;

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

        const newResult = canvas.toDataURL("image/png");

        setResult(newResult);

        // The current card changed, so the previous
        // Cloudinary upload is no longer valid.
        setCardUrl(null);

      } catch (error) {
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

      let processedFile: File | Blob = file;

      // ---------------------------------------
      // Convert iPhone HEIC/HEIF → JPEG
      // ---------------------------------------

      const isHEIC =
        file.type === "image/heic" ||
        file.type === "image/heif" ||
        file.name.toLowerCase().endsWith(".heic") ||
        file.name.toLowerCase().endsWith(".heif");

      if (isHEIC) {
        const { default: heic2any } =
          await import("heic2any");

        const converted = await heic2any({
          blob: file,
          toType: "image/jpeg",
          quality: 0.9,
        });

        processedFile = Array.isArray(converted)
          ? converted[0]
          : converted;
      }

      // ---------------------------------------
      // TRY REMOVE.BG FIRST
      // ---------------------------------------

      let blob: Blob;

      try {
        const apiFormData = new FormData();

        apiFormData.append(
          "image",
          processedFile,
          file.name || "photo.png"
        );

        const response = await fetch(
          "/api/remove-background",
          {
            method: "POST",
            body: apiFormData,
          }
        );

        if (!response.ok) {
          throw new Error(
            `remove.bg backend failed: ${response.status}`
          );
        }

        blob = await response.blob();

        console.log(
          "✅ Background removed using remove.bg"
        );

      } catch (error) {
        console.warn(
          "⚠️ remove.bg failed. Falling back to IMG.LY...",
          error
        );

        // ---------------------------------------
        // FALLBACK → IMG.LY
        // ---------------------------------------

        blob = await removeBackground(
          processedFile
        );

        console.log(
          "✅ Background removed using IMG.LY fallback"
        );
      }

      // ---------------------------------------
      // LOAD PROCESSED IMAGE
      // ---------------------------------------

      const url = URL.createObjectURL(blob);

      const image = new Image();

      image.onload = () => {
        setPhoto(image);

        // Previous uploaded card is no longer valid
        setCardUrl(null);

        URL.revokeObjectURL(url);

        setIsProcessing(false);
      };

      image.onerror = () => {
        console.error(
          "Could not load processed image"
        );

        URL.revokeObjectURL(url);

        setIsProcessing(false);
      };

      image.src = url;

    } catch (error) {
      console.error(
        "Background removal failed:",
        error
      );

      setIsProcessing(false);
    }
  }

  async function uploadGeneratedCard() {
    if (!housePass) return;

    try {
      setIsProcessing(true);

      // Generate a completely fresh card from
      // the CURRENT form state.
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

        callsign:
          form.callsign || "YOUR CALLSIGN",

        housePass,
      });

      // Use this freshly generated image.
      const freshResult =
        canvas.toDataURL("image/png");

      // Update the preview state too.
      setResult(freshResult);

      // Upload THIS image, not the old result state.
      const url = await uploadCard(
        freshResult,
        housePass,
      );

      setCardUrl(url);

    } catch (error) {
      console.error(
        "❌ CURRENT CARD UPLOAD FAILED:",
        error,
      );
    } finally {
      setIsProcessing(false);
    }
  }

function shareToX() {
  if (!housePass) return;

  const shareUrl =
    `${window.location.origin}/card/${housePass}`;

  const builderName =
    form.builder?.trim() || "A Hacker House Goa builder";

  const text =
    `🪪 ${builderName} just checked into Hacker House Goa 2026! 🌴\n\n` +
    `Built my Builder ID Card with #FrameInGoa 🚀\n\n` +
    `Get yours 👇`;

  const xUrl =
    `https://x.com/intent/post` +
    `?text=${encodeURIComponent(text)}` +
    `&url=${encodeURIComponent(shareUrl)}`;

  window.open(
    xUrl,
    "_blank",
    "noopener,noreferrer,width=600,height=700",
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
    <main className="min-h-screen   bg-cover bg-center bg-no-repeat text-[#F3EAD7] selection:bg-[#FE017E] selection:text-white relative pb-20 overflow-hidden">

      {/* ========================================================= */}
      {/* BACKGROUND DECORATIVE LAYERS (WORLD OF HACKER HOUSE GOA) */}
      {/* ========================================================= */}

      {/* 1. GIANT OVERSIZED MARGIN TYPOGRAPHY */}
      <div className="absolute top-24 left-[-2rem] pointer-events-none select-none z-0 hidden lg:block opacity-10">
        <span className="font-samarkan text-[14rem] font-black text-[#FFC629] leading-none block rotate-90 origin-top-left">
          GOA
        </span>
      </div>



      <div className="absolute bottom-32 left-4 pointer-events-none select-none z-0 hidden xl:block opacity-10">
        <span className="font-lovelo text-8xl font-black text-[#FE017E] tracking-widest">
          #FRAMEINGOA
        </span>
      </div>

      {/* 2. RETRO SUN VECTOR BEHIND HERO */}
      <div className="absolute top-[-50px] left-1/2 -translate-x-1/2 w-[800px] h-[800px] pointer-events-none z-0 select-none opacity-20 animate-pulse-sun">
        <svg viewBox="0 0 200 200" className="w-full h-full fill-[#FFC629]">
          <circle cx="100" cy="100" r="40" />
          <g stroke="#FFC629" strokeWidth="2" strokeDasharray="4 4">
            <line x1="100" y1="10" x2="100" y2="45" />
            <line x1="100" y1="155" x2="100" y2="190" />
            <line x1="10" y1="100" x2="45" y2="100" />
            <line x1="155" y1="100" x2="190" y2="100" />
            <line x1="36" y1="36" x2="61" y2="61" />
            <line x1="139" y1="139" x2="164" y2="164" />
            <line x1="36" y1="164" x2="61" y2="139" />
            <line x1="139" y1="61" x2="164" y2="36" />
          </g>
        </svg>
      </div>

      {/* 3. PALM LEAF SILHOUETTE LAYERS */}
      <div className="absolute top-10 left-[-30px] pointer-events-none z-0 select-none hidden md:block opacity-25 animate-float-slight">
        <svg width="240" height="280" viewBox="0 0 100 100" fill="#006B3C">
          <path d="M10,90 Q30,20 90,10 Q50,50 10,90 Z" />
          <path d="M10,90 Q40,30 95,30 Q50,60 10,90 Z" />
          <path d="M10,90 Q20,40 70,5 Q40,50 10,90 Z" />
        </svg>
      </div>

      <div className="absolute top-[35%] right-[-40px] pointer-events-none z-0 select-none hidden md:block opacity-20 animate-float-slight" style={{ animationDelay: '2s' }}>
        <svg width="280" height="320" viewBox="0 0 100 100" fill="#006B3C" transform="scale(-1, 1)">
          <path d="M10,90 Q30,20 90,10 Q50,50 10,90 Z" />
          <path d="M10,90 Q40,30 95,30 Q50,60 10,90 Z" />
          <path d="M10,90 Q20,40 70,5 Q40,50 10,90 Z" />
        </svg>
      </div>

      {/* 4. SCATTERED TRAVEL STICKERS & TELEMETRY LABELS */}
      <div className="absolute top-48 right-[12%] pointer-events-none select-none z-0 hidden xl:block stamp-badge opacity-40">
        <div className="border-2 border-[#FE017E] bg-[#FE017E]/10 px-3 py-1 text-xs font-mono font-bold text-[#FE017E]">
          PASSPORT :: VISA_APPROVED
        </div>
      </div>




      {/* 5. RETRO OCEAN WAVE VECTOR AT BOTTOM */}
      <div className="absolute bottom-0 left-0 w-full pointer-events-none z-0 select-none opacity-20 overflow-hidden leading-none">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-[120%] h-24 text-[#006B3C] fill-current animate-wave">
          <path d="M0,0 C150,90 350,-40 500,50 C650,140 900,-20 1200,40 L1200,120 L0,120 Z"></path>
        </svg>
      </div>


      {/* ========================================================= */}
      {/* FOREGROUND CONTENT (UNCHANGED FUNCTIONAL UI) */}
      {/* ========================================================= */}

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 pt-8">

        {/* HERO SECTION */}
        <section className="relative mb-12 border-4 border-[#006B3C] bg-[#064B32] p-6 sm:p-10 shadow-goa overflow-hidden">
          {/* Background Sun Ray Rays Motif */}
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-[#FFC629]/10 pointer-events-none blur-2xl"></div>
          <div className="absolute right-8 top-8 opacity-20 hidden md:block text-8xl pointer-events-none select-none">
            ☀️
          </div>

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 border-2 border-[#FFC629] bg-[#07110D] px-3 py-1 text-xs font-mono font-bold tracking-[0.25em] text-[#FE017E] mb-4 shadow-[3px_3px_0px_0px_#FFC629]">
              <span>★</span> HACKER HOUSE GOA 2026 <span>★</span>
            </div>

            <h1 className="font-samarkan text-4xl sm:text-6xl font-black uppercase tracking-tight text-[#FFC629] leading-none mb-4">
              BUILD YOUR GOA IDENTITY.
            </h1>

            <p className="text-base sm:text-lg text-[#F3EAD7]/90 font-sans max-w-2xl leading-relaxed mb-6">
              Welcome to the check-in desk. Upload your face, forge your builder credentials, and claim your official pass into the 2026 beach house residency.
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#FFC629]">
              <span className="flex items-center gap-1.5 border border-[#FFC629]/40 bg-[#07110D]/60 px-3 py-1.5">
                <span>📍</span> GOA, INDIA
              </span>
              <span className="flex items-center gap-1.5 border border-[#FFC629]/40 bg-[#07110D]/60 px-3 py-1.5">
                <span>⚡</span> VISA STATUS: OPEN
              </span>
              <span className="flex items-center gap-1.5 border border-[#FFC629]/40 bg-[#07110D]/60 px-3 py-1.5">
                <span>🏷️</span> #FrameInGoa
              </span>
            </div>
          </div>
        </section>

        {/* MAIN GENERATOR GRID */}
        <div id="generator" className="grid gap-8 lg:grid-cols-[450px_1fr] items-start">

          {/* ========================= */}
          {/* FORM (CHECK-IN DESK) */}
          {/* ========================= */}

          <section className="border-4 border-[#006B3C] bg-[#F3EAD7] p-6 text-[#07110D] shadow-goa relative z-10">

            {/* BUILDER */}
            <Input
              fieldNum="01"
              label="BUILDER"
              placeholder="Satoshi Nakamoto"
              value={form.builder}
              onChange={(value) =>
                updateField("builder", value)
              }
            />

            {/* ROLE */}
            <Input
              fieldNum="02"
              label="ROLE"
              placeholder="Frontend Developer / Vibe Coder"
              value={form.role}
              onChange={(value) =>
                updateField("role", value)
              }
            />

            {/* CREW */}
            <Input
              fieldNum="03"
              label="CREW"
              placeholder="Gap Bridgers / Solo"
              value={form.crew}
              onChange={(value) =>
                updateField("crew", value)
              }
            />

            {/* PROJECT */}
            <Input
              fieldNum="04"
              label="CURRENTLY SHIPPING"
              placeholder="Autonomous AI Agent / DeFi Protocol"
              value={form.project}
              onChange={(value) =>
                updateField("project", value)
              }
            />

            {/* BEACH BAG */}
            <div className="mb-5">
              <label className="mb-2 block text-xs font-mono font-bold text-[#006B3C] uppercase">
                BEACH BAG (TECH STACK)
              </label>

              <div className="grid grid-cols-3 gap-2">
                {form.beachBag.map((value, index) => {
                  const isPreset = POPULAR_TECH_STACKS.includes(value) && value !== "Other";
                  const showCustomInput = beachBagOther[index] || (!isPreset && value !== "");

                  return (
                    <div key={index} className="flex flex-col">
                      <select
                        value={
                          beachBagOther[index]
                            ? "Other"
                            : isPreset
                            ? value
                            : value ? "Other" : ""
                        }
                        onChange={(e) => {
                          const selected = e.target.value;
                          if (selected === "Other") {
                            setBeachBagOther((prev) => {
                              const next = [...prev] as [boolean, boolean, boolean];
                              next[index] = true;
                              return next;
                            });
                            updateBeachBag(index, isPreset ? "" : value);
                          } else {
                            setBeachBagOther((prev) => {
                              const next = [...prev] as [boolean, boolean, boolean];
                              next[index] = false;
                              return next;
                            });
                            updateBeachBag(index, selected);
                          }
                        }}
                        className={`w-full border-2 border-[#07110D] bg-white px-2 py-2 text-xs font-mono font-medium outline-none transition focus:border-[#FE017E] focus:ring-1 focus:ring-[#FE017E] cursor-pointer ${
                          (beachBagOther[index] ? "Other" : isPreset ? value : value ? "Other" : "")
                            ? "text-[#07110D]"
                            : "text-[#07110D]/40"
                        }`}
                      >
                        <option value="" className="text-[#07110D]/40">{`Stack 0${index + 1}`}</option>
                        {POPULAR_TECH_STACKS.map((stack) => (
                          <option key={stack} value={stack} className="text-[#07110D]">
                            {stack}
                          </option>
                        ))}
                      </select>

                      {showCustomInput && (
                        <input
                          type="text"
                          value={value}
                          onChange={(e) =>
                            updateBeachBag(index, e.target.value)
                          }
                          placeholder="Type tech stack..."
                          className="mt-1.5 w-full border-2 border-[#FE017E] bg-white px-2 py-1.5 text-xs font-mono font-medium text-[#07110D] placeholder:text-[#07110D]/40 outline-none focus:ring-1 focus:ring-[#FE017E]"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CALLSIGN */}
            <Input
              fieldNum="06"
              label="CALLSIGN"
              placeholder="Cypherpunk / Vibe Coder"
              value={form.callsign}
              onChange={(value) =>
                updateField("callsign", value)
              }
            />

            {/* PHOTO UPLOADER */}
            <div className="mb-6">
              <label className="mb-2 flex items-center justify-between text-xs font-mono font-bold text-[#006B3C] uppercase">
                <span>PORTRAIT_PHOTO</span>
                <span className="text-[10px] text-[#FE017E]">REQUIRED</span>
              </label>

              <label className="group relative flex cursor-pointer flex-col items-center justify-center border-2 border-dashed border-[#07110D] bg-[#07110D]/5 p-6 text-center transition hover:border-[#FE017E] hover:bg-[#07110D]/10">

                {photo ? (
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📸</span>
                    <div className="text-left">
                      <span className="font-bold text-sm text-[#07110D] block uppercase">
                        CHANGE BUILDER PHOTO
                      </span>
                      <span className="text-[10px] font-mono text-[#006B3C]">
                        BACKGROUND AUTOMATICALLY REMOVED
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-2 text-3xl transition-transform group-hover:scale-110">
                      📸
                    </div>
                    <span className="font-samarkan text-base font-black text-[#07110D] group-hover:text-[#FE017E]">
                      DROP YOUR FACE HERE
                    </span>
                    <span className="mt-1 text-[11px] font-mono text-[#07110D]/60">
                      PASSPORT STYLE • JPG, PNG, WEBP
                    </span>
                  </>
                )}

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                  onChange={handlePhotoUpload}
                  disabled={isProcessing}
                  className="hidden"
                />
              </label>

              {isProcessing && (
                <div className="mt-3 flex items-center justify-center gap-2 border-2 border-[#FE017E] bg-[#FE017E]/10 p-2 text-xs font-mono font-bold text-[#FE017E] animate-pulse">
                  <span>⚡</span> FORGING PHOTO & REMOVING BG...
                </div>
              )}
            </div>

            {/* HOUSE PASS PREVIEW BOX */}
            <div className="mt-6 border-2 border-[#07110D] bg-[#006B3C] p-4 text-[#F3EAD7] shadow-[4px_4px_0px_0px_#07110D]">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-mono font-bold tracking-widest text-[#FFC629] uppercase">
                  ASSIGNED_HOUSE_PASS
                </p>
                <span className="text-[10px] font-mono text-[#F3EAD7]/70">AUTOMATIC</span>
              </div>

              <p className="font-mono text-2xl font-black text-[#FFC629] tracking-wider">
                {housePass}
              </p>
            </div>

          </section>


          {/* ========================= */}
          {/* PREVIEW (LIVE ID CARD) */}
          {/* ========================= */}

          <section className="flex flex-col items-center relative z-10">

            {/* CONTROL BAR */}
            <div className="mb-6 flex w-full max-w-[600px] flex-wrap items-center justify-between gap-4 border-2 border-[#006B3C] bg-[#064B32] p-4 shadow-goa">

              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#FE017E] animate-ping"></span>
                  <p className="font-samarkan text-sm font-black text-[#FFC629]">
                    LIVE BUILDER CARD
                  </p>
                </div>
                <p className="text-[11px] font-mono text-[#F3EAD7]/70">
                  REAL-TIME CANVAS RENDER
                </p>
              </div>

              <div className="flex items-center gap-2">
                {result && (
                  <button
                    onClick={uploadGeneratedCard}
                    disabled={isProcessing}
                    className="border-2 border-[#07110D] bg-[#FFC629] px-4 py-2 text-xs font-mono font-bold text-[#07110D] transition hover:bg-white shadow-[3px_3px_0px_0px_#07110D] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:opacity-50 uppercase cursor-pointer"
                  >
                    {isProcessing ? "PROCESSING..." : "GENERATE CARD"}
                  </button>
                )}

                {cardUrl && (
                  <button
                    onClick={shareToX}
                    className="border-2 border-[#07110D] bg-[#FE017E] px-4 py-2 text-xs font-mono font-bold text-white transition hover:bg-[#FE017E]/90 shadow-[3px_3px_0px_0px_#FFC629] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none uppercase cursor-pointer"
                  >
                    𝕏 SHARE TO X
                  </button>
                )}
              </div>

            </div>

            {/* CARD CONTAINER */}
            <div className="card-preview-container relative w-full max-w-[600px]">

              {/* Optional Success Stamp Overlay */}
              {cardUrl && (
                <div className="absolute -top-4 -right-4 z-20 stamp-badge border-4 border-[#FE017E] bg-[#FE017E] text-white font-samarkan px-4 py-2 text-sm font-black tracking-widest shadow-goa-dark uppercase">
                  ✓ VISA APPROVED
                </div>
              )}

              <div className="w-full overflow-hidden border-4 border-[#07110D] bg-[#07110D] shadow-goa-dark">

                {result ? (
                  <img
                    src={result}
                    alt="Your Hacker House Goa Builder Card"
                    className="block w-full h-auto"
                  />
                ) : (
                  <div className="flex aspect-[3/5] items-center justify-center border-2 border-dashed border-[#006B3C] bg-[#064B32]/40 p-8 text-center text-[#F3EAD7]">

                    <div className="max-w-xs">
                      <div className="mb-4 text-6xl">
                        🏝️
                      </div>

                      <p className="font-samarkan text-xl font-black text-[#FFC629] mb-2">
                        AWAITING BUILDER DATA
                      </p>

                      <p className="text-xs font-mono text-[#F3EAD7]/80 leading-relaxed">
                        Upload a photo and complete your check-in details to forge your official Goa Builder Pass.
                      </p>
                    </div>

                  </div>
                )}

              </div>

            </div>

            {/* DOWNLOAD ACTION SECONDARY BUTTON */}
            {result && (
              <div className="mt-6">
                <button
                  onClick={downloadCard}
                  className="border-2 border-[#FFC629] bg-[#07110D] px-6 py-3 font-mono text-xs font-bold text-[#FFC629] transition hover:bg-[#006B3C] shadow-[4px_4px_0px_0px_#FFC629] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none uppercase tracking-wider cursor-pointer"
                >
                  ↓ DOWNLOAD HIGH-RES PNG
                </button>
              </div>
            )}

          </section>

        </div>

        {/* FOOTER */}
        <footer className="relative z-10 mt-20 border-t-4 border-[#006B3C] bg-[#064B32] p-8 text-center font-mono text-xs text-[#F3EAD7]/80 shadow-goa">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-5xl mx-auto">
            <div className="text-left">
              <p className="font-samarkan text-lg font-black text-[#FFC629]">
                HACKER HOUSE GOA 2026
              </p>
              <p className="text-[11px] text-[#F3EAD7]/60">
                GOA, INDIA · 28—31 OCT 2026
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="border border-[#FFC629]/40 px-2 py-1 text-[#FFC629]">
                #FrameInGoa
              </span>
              <span className="border border-[#FE017E]/40 px-2 py-1 text-[#FE017E]">
                HH26 // TRANSMISSION COMPLETE
              </span>
            </div>
          </div>
        </footer>

      </div>

    </main>
  );
}


// ========================================
// INPUT COMPONENT
// ========================================

function Input({
  fieldNum,
  label,
  placeholder,
  value,
  onChange,
}: {
  fieldNum?: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="mb-5">

      <label className="mb-2 block text-xs font-mono font-bold text-[#006B3C] uppercase">
        {label}
      </label>

      <input
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        className="w-full border-2 border-[#07110D] bg-white px-4 py-2.5 text-xs font-mono font-medium text-[#07110D] placeholder:text-[#07110D]/30 outline-none transition focus:border-[#FE017E] focus:ring-1 focus:ring-[#FE017E]"
      />

    </div>
  );
}