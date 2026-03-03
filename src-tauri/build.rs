fn main() {
    // アイコン変更時にリビルドをトリガー
    println!("cargo:rerun-if-changed=icons/");
    tauri_build::build()
}
