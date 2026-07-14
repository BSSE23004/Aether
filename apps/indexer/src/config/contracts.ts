/**
 * Contract ABIs and configurations
 * These will be loaded from the contracts artifacts
 */

export const CONTRACT_ABIS: Record<string, any[]> = {
  CommunityRegistry: [],
  MembershipPass: [],
  Governor: []
};

/**
 * Load contract ABI from Foundry artifacts
 */
export async function loadContractABI(contractName: string): Promise<any[]> {
  try {
    // In production, this would load from ../../contracts/out/{contractName}/solc/{contractName}.json
    // For now, return empty array - will be loaded dynamically
    return CONTRACT_ABIS[contractName] || [];
  } catch (error) {
    console.error(`Failed to load ABI for ${contractName}:`, error);
    return [];
  }
}

/**
 * Register contract ABI
 */
export function registerContractABI(contractName: string, abi: any[]): void {
  CONTRACT_ABIS[contractName] = abi;
}