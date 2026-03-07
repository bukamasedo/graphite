fn main() {
    // アイコン変更時にリビルドをトリガー
    println!("cargo:rerun-if-changed=icons/");
    // MCP sidecar のバイナリ名解決に使用
    let target = std::env::var("TARGET").unwrap_or_default();
    println!("cargo:rustc-env=TARGET_TRIPLE={}", target);
    tauri_build::build()
}
