import { NextResponse } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// In production, the WORKER_URL environment variable should be set to
// the Worker's URL (e.g. https://getting-started-vinext.you.workers.dev
// or your custom domain). In development, use NGROK_HOST.
const WEBHOOK_HOST = process.env.WORKER_URL ?? process.env.NGROK_HOST;

export async function POST(request: Request) {
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error(
      "The REPLICATE_API_TOKEN environment variable is not set. See README.md for instructions on how to set it."
    );
  }

  const { prompt } = await request.json();

  const options: {
    model: string;
    input: { prompt: string };
    webhook?: string;
    webhook_events_filter?: string[];
  } = {
    model: "black-forest-labs/flux-2-klein-9b",
    input: { prompt },
  };

  if (WEBHOOK_HOST) {
    options.webhook = `${WEBHOOK_HOST}/api/webhooks`;
    options.webhook_events_filter = ["start", "completed"];
  }

  const prediction = await replicate.predictions.create(options);

  if (prediction?.error) {
    return NextResponse.json({ detail: prediction.error }, { status: 500 });
  }

  return NextResponse.json(prediction, { status: 201 });
}
