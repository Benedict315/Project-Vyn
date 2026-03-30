import { 
  Keypair, 
  rpc, 
  TransactionBuilder, 
  Networks, 
  Operation, 
  BASE_FEE, 
  nativeToScVal, 
  scValToNative 
} from "@stellar/stellar-sdk";
import dotenv from "dotenv";

dotenv.config();

const RPC_URL = "https://soroban-testnet.stellar.org";
const server = new rpc.Server(RPC_URL);

const CREDIT_LIMITS = {
  0: { name: "Bronce", amount: 0 },
  1: { name: "Plata", amount: 300 },
  2: { name: "Oro", amount: 600 },
  3: { name: "Diamante", amount: 1500 },
  4: { name: "Platino", amount: 5000 }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userAddress } = req.body;
  if (!userAddress) return res.status(400).json({ error: "Falta wallet" });

  try {
    console.log(`[DEBUG] 🔍 Consultando Tier para: ${userAddress}`);

    // 1. Cargamos una cuenta temporal para la simulación
    const adminKeypair = Keypair.fromSecret(process.env.SECRET_KEY_ADMIN);
    const sourceAccount = await server.getAccount(adminKeypair.publicKey());

    // 2. Creamos la transacción de "lectura"
    const tx = new TransactionBuilder(sourceAccount, { 
      fee: BASE_FEE, 
      networkPassphrase: Networks.TESTNET 
    })
    .addOperation(
      Operation.invokeContractFunction({ // ✅ Nombre estándar
        contract: process.env.NFT_CONTRACT_ID,
        function: "get_tier",
        args: [nativeToScVal(userAddress, { type: "address" })]
      })
    )
    .setTimeout(30)
    .build();

    // 3. Simulamos la transacción para obtener el valor de retorno
    const simulation = await server.simulateTransaction(tx);

    let finalTier = 0;
    if (simulation.result && simulation.result.retval) {
      finalTier = Number(scValToNative(simulation.result.retval)) || 0;
    }

    const config = CREDIT_LIMITS[finalTier] || CREDIT_LIMITS[0];
    console.log(`[DEBUG] ✅ Tier: ${finalTier} (${config.name})`);

    return res.json({
      success: true,
      tier: finalTier,
      tierName: config.name,
      availableCredit: config.amount,
      currency: "XLM"
    });

  } catch (error) {
    console.error(`[DEBUG] 💥 Error en /get-available-credit:`, error.message);
    res.status(500).json({ error: error.message });
  }
}