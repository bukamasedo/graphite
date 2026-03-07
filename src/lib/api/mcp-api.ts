import { invoke } from '@tauri-apps/api/core';

export const mcpApi = {
  getMcpBinaryPath: () => invoke<string>('get_mcp_binary_path'),
  configureClient: (clientId: string) =>
    invoke<void>('configure_mcp_client', { clientId }),
  removeClient: (clientId: string) =>
    invoke<void>('remove_mcp_client', { clientId }),
};
