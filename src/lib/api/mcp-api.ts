import { invoke } from '@tauri-apps/api/core';

export const mcpApi = {
  getMcpBinaryPath: () => invoke<string>('get_mcp_binary_path'),
  configureClaude: () => invoke<void>('configure_claude_desktop'),
  removeClaude: () => invoke<void>('remove_claude_desktop'),
};
