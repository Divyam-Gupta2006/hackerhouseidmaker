import JsBarcode from "jsbarcode";

const WIDTH = 1200;
const HEIGHT = 2000;

const PINK = "#FE017E";

export interface BuilderData {
  photo: HTMLImageElement | null;
  builder: string;
  role: string;
  crew: string;
  project: string;
  beachBag: [string, string, string];
  callsign: string;
  housePass: string;
}

const fields = {
  builder: {
    x: 167.3,
    y: 330.9,
    width: 414.5,
    height: 70.2,
    fontSize: 44.1,
  },

  role: {
    x: 178.8,
    y: 467.2,
    width: 424.7,
    height: 70.2,
    fontSize: 44.1,
  },

  crew: {
    x: 139.6,
    y: 613.2,
    width: 505.4,
    height: 70.2,
    fontSize: 44.1,
  },

  project: {
    x: 139.6,
    y: 755.1,
    width: 505.4,
    height: 70.2,
    fontSize: 44.1,
  },

  beachBag: [
    {
      x: 171.4,
      y: 1003.6,
      width: 195.4,
      height: 41,
      fontSize: 34,
    },
    {
      x: 469.5,
      y: 1003.6,
      width: 275,
      height: 41,
      fontSize: 34,
    },
    {
      x: 843.7,
      y: 1003.6,
      width: 188.6,
      height: 41,
      fontSize: 34
    },
  ],

  callsign: {
    x: 617.9,
    y: 1189.6,
    width: 374.1,
    height: 70.2,
    fontSize: 44.1,
  },

  housePass: {
    x: 667.5,
    y: 1346.1,
    width: 289.1,
    height: 70.2,
    fontSize: 44.1,
  },

  barcode: {
    x: 622.9,
    y: 1439.2,
    width: 364.2,
    height: 128.3,
  },
};

function drawCenteredText(
  ctx: CanvasRenderingContext2D,
  text: string,
  field: {
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize: number;
  },
) {
  ctx.save();

  const MAX_FONT_SIZE = field.fontSize;
  const MIN_FONT_SIZE = field.fontSize * 0.55;

  let fontSize = MAX_FONT_SIZE;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = PINK;

  // Keep shrinking until the text fits
  while (fontSize > MIN_FONT_SIZE) {
    ctx.font = `900 ${fontSize}px "Lovelo", sans-serif`;

    const measured = ctx.measureText(text.toUpperCase());

    if (measured.width <= field.width) {
      break;
    }

    fontSize -= 1;
  }

  // Final font
  ctx.font = `900 ${fontSize}px "Lovelo", sans-serif`;

  const centerX = field.x + field.width / 2;
  const centerY = field.y + field.height / 2;

  ctx.fillText(
    text.toUpperCase(),
    centerX,
    centerY,
  );

  ctx.restore();
}

function drawPhoto(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
) {
  const { x, y, width, height } = {
    x: 667.8,
    y: 315.1,
    width: 419.4,
    height: 523.4,
  };

  const radius = 100;

  const imageRatio = image.width / image.height;
  const targetRatio = width / height;

  let sourceWidth = image.width;
  let sourceHeight = image.height;
  let sourceX = 0;
  let sourceY = 0;

  if (imageRatio > targetRatio) {
    sourceWidth = image.height * targetRatio;
    sourceX = (image.width - sourceWidth) / 2;
  } else {
    sourceHeight = image.width / targetRatio;
    sourceY = (image.height - sourceHeight) / 2;
  }

  ctx.save();

  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.clip();

  ctx.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    x,
    y,
    width,
    height,
  );

  ctx.restore();
}

async function loadTemplate(): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = reject;

    image.src = "/template.png";
  });
}

async function createBarcode(
  value: string,
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");

    try {
      JsBarcode(canvas, value, {
        format: "CODE128",
        displayValue: false,
        margin: 0,
        width: 2,
        height: 128,
        background: "transparent",
        lineColor: "#000000",
      });

      const image = new Image();

      image.onload = () => resolve(image);
      image.onerror = reject;

      image.src = canvas.toDataURL("image/png");
    } catch (error) {
      reject(error);
    }
  });
}

export async function renderCard(
  data: BuilderData,
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");

  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not create canvas context");
  }

  // 1. Load the Canva template
  const template = await loadTemplate();

  // 2. Draw template first
  ctx.drawImage(template, 0, 0, WIDTH, HEIGHT);

  // 3. Draw user photo
  if (data.photo) {
    drawPhoto(ctx, data.photo);
  }

  // 4. Dynamic text
  drawCenteredText(ctx, data.builder, fields.builder);
  drawCenteredText(ctx, data.role, fields.role);
  drawCenteredText(ctx, data.crew, fields.crew);
  drawCenteredText(ctx, data.project, fields.project);

  data.beachBag.forEach((item, index) => {
    drawCenteredText(ctx, item, fields.beachBag[index]);
  });

  drawCenteredText(ctx, data.callsign, fields.callsign);
  drawCenteredText(ctx, data.housePass, fields.housePass);

  // 5. Barcode
  const barcode = await createBarcode(data.housePass);

  ctx.drawImage(
    barcode,
    fields.barcode.x,
    fields.barcode.y,
    fields.barcode.width,
    fields.barcode.height,
  );

  return canvas;
}