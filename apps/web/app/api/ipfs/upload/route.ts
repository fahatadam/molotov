import * as Client from "@storacha/client";
import { Signer } from "@storacha/client/principal/ed25519";
import * as Proof from "@storacha/client/proof";
import { StoreMemory } from "@storacha/client/stores/memory";

// IPFS uploads run server-side so the Storacha credentials never reach the
// client. Storacha uses UCAN: an agent key (STORACHA_KEY) plus a delegation
// proof for the space (STORACHA_PROOF). See apps/web/docs/storacha-setup.md.
export const runtime = "nodejs";

function isConfigured() {
  return Boolean(process.env.STORACHA_KEY && process.env.STORACHA_PROOF);
}

// The UCAN client setup (parse key, create agent, add space) is expensive, so
// build it once per server process and reuse it across requests.
let clientPromise: ReturnType<typeof createClient> | null = null;

async function createClient() {
  const principal = Signer.parse(process.env.STORACHA_KEY as string);
  const store = new StoreMemory();
  const client = await Client.create({ principal, store });
  const proof = await Proof.parse(process.env.STORACHA_PROOF as string);
  const space = await client.addSpace(proof);
  await client.setCurrentSpace(space.did());
  return client;
}

function getClient() {
  if (!clientPromise) {
    clientPromise = createClient().catch((err) => {
      clientPromise = null; // allow a retry on the next request
      throw err;
    });
  }
  return clientPromise;
}

export async function POST(request: Request) {
  if (!isConfigured()) {
    return Response.json(
      { error: "IPFS no está configurado en el servidor." },
      { status: 500 },
    );
  }

  let file: File | null = null;
  try {
    const form = await request.formData();
    const entry = form.get("file");
    if (entry instanceof File) file = entry;
  } catch {
    /* falls through to the 400 below */
  }
  if (!file) {
    return Response.json({ error: "Falta el archivo." }, { status: 400 });
  }

  try {
    const client = await getClient();
    const cid = await client.uploadFile(file);
    const cidStr = cid.toString();
    return Response.json({
      cid: cidStr,
      gatewayUrl: `https://${cidStr}.ipfs.w3s.link`,
    });
  } catch (err) {
    console.error("[ipfs/upload]", err);
    return Response.json(
      { error: "No se pudo subir el archivo a IPFS." },
      { status: 502 },
    );
  }
}
