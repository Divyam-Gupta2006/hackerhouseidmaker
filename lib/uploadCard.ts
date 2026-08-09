export async function uploadCard(
  dataUrl: string,
  housePass: string,
) {
  const cloudName =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  const uploadPreset =
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error(
      "Cloudinary environment variables are missing.",
    );
  }

  // Convert data URL to Blob
  const response = await fetch(dataUrl);
  const blob = await response.blob();

  const formData = new FormData();

  formData.append("file", blob, `${housePass}.png`);
  formData.append("upload_preset", uploadPreset);
const uniqueId =
  `${housePass}-${Date.now()}`;

formData.append(
  "public_id",
  `hh-goa/${uniqueId}`,
);

  const uploadResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!uploadResponse.ok) {
    const error = await uploadResponse.text();

    throw new Error(
      `Cloudinary upload failed: ${error}`,
    );
  }

  const result = await uploadResponse.json();

  return `${result.secure_url}?v=${Date.now()}`;
}