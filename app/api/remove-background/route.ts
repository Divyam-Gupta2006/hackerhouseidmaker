const API_KEYS = [
  process.env.REMOVEBG_API_KEY_1,
  process.env.REMOVEBG_API_KEY_2,
  process.env.REMOVEBG_API_KEY_3,
].filter(Boolean) as string[];

export async function POST(request: Request) {
  if (API_KEYS.length === 0) {
    return Response.json(
      {
        success: false,
        error: "No remove.bg API keys configured",
      },
      { status: 500 }
    );
  }

  const incomingFormData = await request.formData();
  const image = incomingFormData.get("image");

  if (!(image instanceof File)) {
    return Response.json(
      {
        success: false,
        error: "No image provided",
      },
      { status: 400 }
    );
  }

  let lastError = "Unknown remove.bg error";

  for (let i = 0; i < API_KEYS.length; i++) {
    const apiKey = API_KEYS[i];

    try {
      console.log(`Trying remove.bg API key ${i + 1}`);

      const formData = new FormData();

      formData.append(
        "image_file",
        image,
        image.name || "photo.png"
      );

      formData.append("size", "auto");
      formData.append("format", "png");

      const response = await fetch(
        "https://api.remove.bg/v1.0/removebg",
        {
          method: "POST",
          headers: {
            "X-Api-Key": apiKey,
          },
          body: formData,
        }
      );

      if (response.ok) {
        console.log(
          `remove.bg API key ${i + 1} succeeded`
        );

        const blob = await response.blob();

        return new Response(blob, {
          status: 200,
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": "no-store",
          },
        });
      }

      const errorText = await response.text();

      lastError =
        `remove.bg key ${i + 1} failed ` +
        `(${response.status}): ${errorText}`;

      console.warn(lastError);

    } catch (error) {
      lastError =
        error instanceof Error
          ? error.message
          : `remove.bg key ${i + 1} failed`;

      console.warn(lastError);
    }
  }

  // Both remove.bg keys failed.
  // Client will fall back to IMG.LY.
  return Response.json(
    {
      success: false,
      fallback: true,
      error: lastError,
    },
    { status: 502 }
  );
}