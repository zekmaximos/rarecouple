import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Envie um PDF válido." }, { status: 400 });
  }

  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ message: "O PDF precisa ter até 8 MB." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    return NextResponse.json({ text: result.text ?? "" });
  } catch {
    return NextResponse.json(
      { message: "Não foi possível ler o texto desse PDF. Se ele for imagem escaneada, será preciso OCR." },
      { status: 422 },
    );
  } finally {
    await parser.destroy();
  }
}
