#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String};

#[contracttype]
pub enum DataKey {
    Admin,         // Guarda quién es el dueño del contrato (Tu servidor Node.js)
    Tier(Address), // Guarda el nivel del usuario (0=Bronce/Revocado, 1=Plata, 2=Oro, 3=Diamante, 4=Platino)
}

#[contract]
pub struct VinculoSBT;

#[contractimpl]
impl VinculoSBT {
    // 1. Inicializa el contrato definiendo quién es el administrador (Tu Backend)
    pub fn init(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("El contrato ya fue inicializado");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    // 2. Mintear o Subir de Nivel (Requiere la firma de la wallet Admin)
    pub fn mint(env: Env, admin: Address, user: Address, tier: u32) {
        // Exigimos que la transacción venga firmada por el Admin
        admin.require_auth(); 
        
        let saved_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if admin != saved_admin {
            panic!("Solo el administrador puede mintear NFTs");
        }

        // Guardamos el nivel del usuario (1=Plata, 2=Oro, 3=Diamante, 4=Platino)
        env.storage().persistent().set(&DataKey::Tier(user.clone()), &tier);
    }

    // 3. Revocar/Castigar (Los bajamos a Nivel 0 = Bronce/Sin crédito)
    pub fn revoke(env: Env, admin: Address, user: Address) {
        admin.require_auth();
        let saved_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if admin != saved_admin {
            panic!("Solo el administrador puede revocar");
        }

        // Nivel 0 significa que no es acreedor a crédito o fue revocado
        env.storage().persistent().set(&DataKey::Tier(user.clone()), &0u32);
    }

    // 4. Consultar el Nivel actual
    pub fn get_tier(env: Env, user: Address) -> u32 {
        env.storage().persistent().get(&DataKey::Tier(user)).unwrap_or(0)
    }

    // 5. La magia visual: Dependiendo del nivel, la DApp mostrará una imagen distinta
    pub fn get_token_uri(env: Env, user: Address) -> String {
        let tier = Self::get_tier(env.clone(), user);
        
        match tier {
            1 => String::from_str(&env, "https://tuservidor.com/nft/plata.json"),
            2 => String::from_str(&env, "https://tuservidor.com/nft/oro.json"),
            3 => String::from_str(&env, "https://tuservidor.com/nft/diamante.json"),
            4 => String::from_str(&env, "https://tuservidor.com/nft/platino.json"),
            // Si el nivel es 0, mostramos el estado base (Bronce / Sin beneficios)
            _ => String::from_str(&env, "https://tuservidor.com/nft/bronce_default.json"), 
        }
    }
}