import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.blyss.uz';
const API_SECRET = process.env.API_SECRET!;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng required' }, { status: 400 });
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = crypto
    .createHmac('sha256', API_SECRET)
    .update(timestamp)
    .digest('hex');

  const url = `${API_URL}/public/businesses/nearest?lat=${lat}&lng=${lng}&page_size=50&radius=1000`;

  const res = await fetch(url, {
    headers: {
      'X-Timestamp': timestamp,
      'X-Signature': signature,
    },
  });

  const data = await res.json();

  console.log('data', data)
  return NextResponse.json(data, { status: res.status });
}
