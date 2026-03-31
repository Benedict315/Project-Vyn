import { TransactionBuilder, Networks, Operation, BASE_FEE, nativeToScVal, scValToNative, rpc } from "@stellar/stellar-sdk";
import { CONTRACT_ID, RPC_URL } from "./contracts";

// 1. Función para obtener el saldo disponible (Ahorro regular)
export async function fetchContractBalance(userAddress: string): Promise<number> {
  try {
    const server = new rpc.Server(RPC_URL);
    
    // 🛡️ PROTECCIÓN 1: Si la cuenta no existe en la red, no puede tener saldo.
    let account;
    try {
      account = await server.getAccount(userAddress);
    } catch (e) {
      console.warn("La cuenta no está fondeada en Testnet. Saldo 0 por defecto.");
      return 0; 
    }

    const transaction = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        Operation.invokeContractFunction({
          contract: CONTRACT_ID,
          function: "get_balance",
          args: [
            nativeToScVal(userAddress, { type: "address" })
          ],
        })
      )
      .setTimeout(30)
      .build();

    const response = await server.simulateTransaction(transaction);

    if (rpc.Api.isSimulationSuccess(response) && response.result) {
      const balanceInStroops = scValToNative(response.result.retval);
      
      // 🛡️ PROTECCIÓN 2: Convertir explícitamente el BigInt a Number antes de operar
      return Number(balanceInStroops) / 10000000;
    }
    return 0;
  } catch (error) {
    console.error("Error consultando get_balance:", error);
    return 0;
  }
}

// 2. Función para obtener los datos del Staking
export async function fetchStakeInfo(userAddress: string) {
  // Objeto por defecto para evitar errores en React
  const defaultStake = { amount: 0, unlockTime: 0, months: 0, apy: 0 };

  try {
    const server = new rpc.Server(RPC_URL);
    
    // 🛡️ PROTECCIÓN 1: Misma validación de cuenta
    let account;
    try {
      account = await server.getAccount(userAddress);
    } catch (e) {
      return defaultStake;
    }

    const transaction = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        Operation.invokeContractFunction({
          contract: CONTRACT_ID,
          function: "get_stake",
          args: [
            nativeToScVal(userAddress, { type: "address" })
          ],
        })
      )
      .setTimeout(30)
      .build();

    const response = await server.simulateTransaction(transaction);

    if (rpc.Api.isSimulationSuccess(response) && response.result) {
      const resultVal = scValToNative(response.result.retval);
      
      // Soroban devuelve una Tupla de Rust, que en JS es un Array de BigInts
      if (Array.isArray(resultVal)) {
        return {
          amount: Number(resultVal[0]) / 10000000, // Dividimos para pasar de Stroops a XLM
          unlockTime: Number(resultVal[1]),        // Timestamp en segundos
          months: Number(resultVal[2]),
          apy: Number(resultVal[3])
        };
      }
    }
    return defaultStake;
  } catch (error) {
    console.error("Error consultando get_stake:", error);
    return defaultStake;
  }
}