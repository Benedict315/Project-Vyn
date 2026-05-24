import { 
  Keypair, 
  rpc, 
  TransactionBuilder, 
  Networks, 
  Operation, 
  BASE_FEE, 
  nativeToScVal,
  Transaction
} from "@stellar/stellar-sdk";
import { consumeNonce } from "./nonce";
import dotenv from "dotenv";

dotenv.config();

const HORIZON_URL = "https://horizon-testnet.stellar.org";

const RPC_URL = "https://soroban-testnet.stellar.org";
const server = new rpc.Server(RPC_URL);

function tierNameFromValue(tier) {
  if (tier === 4) return "Platino";
  if (tier === 3) return "Diamante";
  if (tier === 2) return "Oro";
  if (tier === 1) return "Plata";
  return "Bronce";
}

async function resolveTierFromCanonicalScore(req, userAddress, totalVolume) {
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";

  if (!host) {
    throw new Error("No se pudo resolver host para validar score");
  }

  const scoreResponse = await fetch(`${proto}://${host}/api/calculate-score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      address: userAddress,
      totalDeposited: Number(totalVolume) || 0,
    }),
  });

  if (!scoreResponse.ok) {
    throw new Error("No se pudo validar score para mintear");
  }

  const scoreData = await scoreResponse.json();
  const tier = Number(scoreData?.tier) || 0;
  const tierName = scoreData?.tierName || tierNameFromValue(tier);

  return { tier, tierName };
}

async function mintNftOnChain(userAddress, tier) {
  try {
    const adminKeypair = Keypair.fromSecret(process.env.SECRET_KEY_ADMIN);
    const account = await server.getAccount(adminKeypair.publicKey());
    
    let transaction = new TransactionBuilder(account, { 
        fee: BASE_FEE, 
        networkPassphrase: Networks.TESTNET 
    })
      .addOperation(
        Operation.invokeContractFunction({ // ✅ Nombre estándar
          contract: process.env.NFT_CONTRACT_ID,
          function: "mint", 
          args: [
            nativeToScVal(adminKeypair.publicKey(), { type: "address" }), 
            nativeToScVal(userAddress, { type: "address" }), 
            nativeToScVal(tier, { type: "u32" })                
          ],
        })
      )
      .setTimeout(30).build();

    transaction = await server.prepareTransaction(transaction);
    transaction.sign(adminKeypair);

    const submitRes = await server.sendTransaction(transaction);
    return { success: true, hash: submitRes.hash };

  } catch (error) {
    console.error(`[DEBUG] 💥 Error Mint:`, error.message);
    return { success: false, error: error.message };
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userAddress, deposits, totalVolume } = req.body || {};
  const { signedTxXdr, nonce, signature } = req.body || {};

  if (!userAddress) {
    return res.status(400).json({ error: 'userAddress es requerido', status: 'error' });
  }

  const fallbackVolumeFromDeposits = Array.isArray(deposits)
    ? deposits.reduce((acc, d) => acc + (Number(d?.amount) || 0), 0)
    : 0;

  let effectiveTotalVolume = Number(totalVolume) || fallbackVolumeFromDeposits;

  // Si el cliente no provee un volumen válido, intentamos leer el saldo on-chain como fuente de verdad
  if (!effectiveTotalVolume || effectiveTotalVolume <= 0) {
    try {
      const resp = await fetch(`${HORIZON_URL}/accounts/${userAddress}`);
      if (resp.ok) {
        const acct = await resp.json();
        const native = (acct.balances || []).find(b => b.asset_type === 'native');
        effectiveTotalVolume = Number(native?.balance) || effectiveTotalVolume;
      }
    } catch (e) {
      // Si falla la consulta on-chain, usamos el fallback calculado desde 'deposits'
    }
  }

  let tier;
  let tierName;
  try {
    // Verificamos la prueba de propiedad: debe venir un signedTxXdr que contenga
    // una operación ManageData con la clave 'vinculo_nonce' y el valor del nonce.
    if (!nonce || !signedTxXdr) {
      return res.status(400).json({ status: 'error', message: 'Falta nonce o signedTxXdr para verificar propiedad' });
    }

    // Consumir nonce (verifica existencia y expiración)
    const okNonce = consumeNonce(userAddress, nonce);
    if (!okNonce) {
      return res.status(400).json({ status: 'error', message: 'Nonce inválido o expirado' });
    }

    try {
      // Parseamos la transacción firmada y verificamos que la fuente coincida
      const signedTx = TransactionBuilder.fromXDR(signedTxXdr, Networks.TESTNET);
      // Verificamos que el tx tenga al menos una firma
      if (!signedTx.signatures || signedTx.signatures.length === 0) {
        return res.status(400).json({ status: 'error', message: 'Transacción sin firmas' });
      }
      // Verificamos que la transacción tenga una operación ManageData con clave 'vinculo_nonce'
      const txOps = signedTx.operations || [];
      const mdOp = txOps.find(op => (op.type === 'manageData' || op.type === 'manage_data') && op.name === 'vinculo_nonce');
      if (!mdOp) {
        return res.status(400).json({ status: 'error', message: 'Transacción no contiene nonce esperado' });
      }
      // El valor del manageData puede estar en mdOp.value o mdOp.data
      const val = mdOp.value || mdOp.value || mdOp.data || null;
      // Muchos build/transforms pueden devolver Buffer o string; comparamos como string
      const valStr = val ? (typeof val === 'string' ? val : Buffer.from(val).toString()) : null;
      if (valStr !== nonce) {
        return res.status(400).json({ status: 'error', message: 'Nonce en transacción no coincide' });
      }

      // NOTE: Intentamos verificar la firma criptográficamente si es posible
      try {
        const txHash = signedTx.hash();
        const kp = Keypair.fromPublicKey(userAddress);
        let sigOk = false;
        for (const s of signedTx.signatures) {
          const sig = s.signature ? s.signature() : s;
          try {
            if (kp.verify(txHash, sig)) { sigOk = true; break; }
          } catch (e) {
            // ignore individual signature verification errors
          }
        }
        if (!sigOk) {
          return res.status(400).json({ status: 'error', message: 'Firma inválida' });
        }
      } catch (e) {
        // Si falla la verificación detallada, abortamos para seguridad
        return res.status(400).json({ status: 'error', message: 'No se pudo verificar la firma de la transacción' });
      }
    } catch (e) {
      return res.status(400).json({ status: 'error', message: 'Error parseando XDR firmado' });
    }

    const tierResult = await resolveTierFromCanonicalScore(req, userAddress, effectiveTotalVolume);
    tier = tierResult.tier;
    tierName = tierResult.tierName;
  } catch (scoreError) {
    return res.status(500).json({
      status: "error",
      message: scoreError?.message || "No se pudo validar el nivel para mintear",
    });
  }
  
  if (tier >= 1) {
    const mintResult = await mintNftOnChain(userAddress, tier);
    if (mintResult.success) {
      return res.json({ txHash: mintResult.hash, tier, tierName, status: "minted" });
    }

    return res.status(500).json({
      status: "error",
      tier,
      tierName,
      message: mintResult.error || "No se pudo mintear el NFT",
    });
  }

  return res.json({
    message: "Nivel insuficiente",
    tier,
    tierName,
    status: "pending",
  });
}