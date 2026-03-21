const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { Keypair, rpc, TransactionBuilder, Networks, Operation, BASE_FEE, nativeToScVal } = require("@stellar/stellar-sdk");

const app = express();
const PORT = process.env.PORT || 3000; // Asegúrate de saber qué puerto se usa aquí

app.use(cors());
app.use(express.json());

const RPC_URL = "https://soroban-testnet.stellar.org";
const server = new rpc.Server(RPC_URL);

// ─────────────────────────────────────────────
// Helpers Matemáticos
// ─────────────────────────────────────────────
function weightedMean(deposits) {
  let weightedSum = 0;
  let totalWeight = 0;
  for (const { amount, daysAgo } of deposits) {
    const weight = 1 / (daysAgo + 1);
    weightedSum += amount * weight;
    totalWeight += weight;
  }
  return totalWeight === 0 ? 0 : weightedSum / totalWeight;
}

function meanAbsoluteDeviation(deposits) {
  if (deposits.length === 0) return 0;
  const amounts = deposits.map((d) => d.amount);
  const mean = amounts.reduce((acc, v) => acc + v, 0) / amounts.length;
  return amounts.reduce((acc, v) => acc + Math.abs(v - mean), 0) / amounts.length;
}

function computeScoreAndTier(wMean, mad, n) {
  let score = 0;
  if (wMean > 0 && mad <= wMean) {
    score = (wMean * (1 - mad / wMean)) * Math.log(n + 1);
  }

  let tier = 0;
  let tierName = "Bronce";

  if (score >= 1000) { tier = 4; tierName = "Platino"; } 
  else if (score >= 500) { tier = 3; tierName = "Diamante"; } 
  else if (score >= 150) { tier = 2; tierName = "Oro"; } 
  else if (score >= 50) { tier = 1; tierName = "Plata"; }

  return { score: parseFloat(score.toFixed(4)), tier, tierName };
}

// ─────────────────────────────────────────────
// Función para mintear en Stellar 🚀
// ─────────────────────────────────────────────
async function mintNftOnChain(userAddress, tier) {
  try {
    const adminKeypair = Keypair.fromSecret(process.env.SECRET_KEY_ADMIN);
    const adminPublicKey = adminKeypair.publicKey();
    const account = await server.getAccount(adminPublicKey);

    console.log(`[NFT] Firmando transacción para mintear Nivel ${tier} a ${userAddress}`);

    let transaction = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
      .addOperation(
        Operation.invokeContractFunction({
          contract: process.env.NFT_CONTRACT_ID,
          function: "mint", 
          args: [
            nativeToScVal(adminPublicKey, { type: "address" }), // Quien autoriza
            nativeToScVal(userAddress, { type: "address" }),    // Quien recibe
            nativeToScVal(tier, { type: "u32" })                // El nivel
          ],
        })
      )
      .setTimeout(30).build();

    transaction = await server.prepareTransaction(transaction);
    transaction.sign(adminKeypair);

    const submitRes = await server.sendTransaction(transaction);
    if (submitRes.status !== "PENDING" && submitRes.status !== "SUCCESS") throw new Error("Transacción rechazada");

    let txStatus = submitRes.status;
    let getTxRes;
    while (txStatus === "PENDING" || txStatus === "NOT_FOUND") {
      await new Promise(resolve => setTimeout(resolve, 2000));
      getTxRes = await server.getTransaction(submitRes.hash);
      txStatus = getTxRes.status.toUpperCase();
    }

    if (txStatus === "SUCCESS") return { success: true, hash: submitRes.hash };
    throw new Error("Fallo en la ejecución del Smart Contract");

  } catch (error) {
    console.error("[NFT ERROR]", error);
    return { success: false, error: error.message };
  }
}

// ─────────────────────────────────────────────
// Endpoints API
// ─────────────────────────────────────────────

// 1. Para la rueda visual del Frontend
app.post("/api/calculate-score", (req, res) => {
  const { address, deposits } = req.body;
  if (!address || !Array.isArray(deposits)) return res.status(400).json({ error: "Datos inválidos" });

  const wMean = weightedMean(deposits);
  const mad = meanAbsoluteDeviation(deposits);
  const { score, tier, tierName } = computeScoreAndTier(wMean, mad, deposits.length);

  return res.json({ address, weightedMean: wMean, mad, score, tier, tierName });
});

// 2. Para el botón de "Reclamar NFT"
app.post('/api/evaluate-and-mint', async (req, res) => {
  const { userAddress, deposits } = req.body;

  if (!userAddress || !deposits) return res.status(400).json({ error: "Faltan datos" });

  const wMean = weightedMean(deposits);
  const mad = meanAbsoluteDeviation(deposits);
  const { score, tier, tierName } = computeScoreAndTier(wMean, mad, deposits.length);
  
  // Condición: Nivel 1 (Plata) o superior
  if (tier >= 1) {
    const mintResult = await mintNftOnChain(userAddress, tier);
    
    if (mintResult.success) {
      return res.json({ message: `¡Felicidades! SBT Nivel ${tierName} minteado.`, txHash: mintResult.hash, status: "minted" });
    } else {
      return res.status(500).json({ error: "Fallo al mintear en la blockchain", details: mintResult.error });
    }
  } else {
    return res.json({ message: `Aún eres nivel Bronce. Necesitas más score.`, status: "pending" });
  }
});

app.listen(PORT, () => { console.log(`🚀 Motor de Riesgo corriendo en http://localhost:${PORT}`); });