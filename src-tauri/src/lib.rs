mod commands;
mod models;
mod utils;

use serde::Deserialize;
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem, Submenu};
use tauri::{AppHandle, Emitter, Manager};

#[cfg(target_os = "macos")]
use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};

/// Position macOS traffic light buttons (close/minimize/zoom).
/// `x`: left offset in points (from left edge of window)
/// `y_from_top`: offset from top of window in points
#[cfg(target_os = "macos")]
fn set_traffic_light_position(window: &tauri::WebviewWindow, x: f64, y_from_top: f64) {
    use objc2_app_kit::{NSView, NSWindowButton};
    use objc2_foundation::{NSPoint, NSRect, NSSize};
    use raw_window_handle::HasWindowHandle;

    let handle = match window.window_handle() {
        Ok(h) => h,
        Err(_) => return,
    };
    let ns_view_ptr = match handle.as_raw() {
        raw_window_handle::RawWindowHandle::AppKit(h) => h.ns_view.as_ptr() as *const NSView,
        _ => return,
    };

    unsafe {
        let ns_view: &NSView = &*ns_view_ptr;
        let Some(ns_window) = ns_view.window() else {
            return;
        };

        let buttons = [
            NSWindowButton::CloseButton,
            NSWindowButton::MiniaturizeButton,
            NSWindowButton::ZoomButton,
        ];
        let spacing = 20.0;
        for (i, button_type) in buttons.iter().enumerate() {
            if let Some(button) = ns_window.standardWindowButton(*button_type) {
                let size = button.frame().size;
                // Convert y-from-top to Cocoa coordinates (origin at bottom-left)
                let cocoa_y = if let Some(superview) = button.superview() {
                    superview.frame().size.height - y_from_top - size.height
                } else {
                    y_from_top
                };
                let origin = NSPoint::new(x + (i as f64) * spacing, cocoa_y);
                button.setFrame(NSRect::new(origin, NSSize::new(size.width, size.height)));
            }
        }
    }
}

#[derive(Deserialize)]
struct MenuLabels {
    file: String,
    new_note: String,
    new_folder: String,
    reload: String,
    edit: String,
    undo: String,
    redo: String,
    cut: String,
    copy: String,
    paste: String,
    select_all: String,
    view: String,
    command_palette: String,
    search_notes: String,
    history: String,
    history_back: String,
    history_forward: String,
    show_history: String,
    about: String,
    hide: String,
    hide_others: String,
    show_all: String,
    quit: String,
    window: String,
    minimize: String,
    zoom: String,
    close: String,
    settings: String,
}

impl Default for MenuLabels {
    fn default() -> Self {
        Self {
            file: "File".to_string(),
            new_note: "New Note".to_string(),
            new_folder: "New Folder".to_string(),
            reload: "Reload".to_string(),
            edit: "Edit".to_string(),
            undo: "Undo".to_string(),
            redo: "Redo".to_string(),
            cut: "Cut".to_string(),
            copy: "Copy".to_string(),
            paste: "Paste".to_string(),
            select_all: "Select All".to_string(),
            view: "View".to_string(),
            command_palette: "Command Palette".to_string(),
            search_notes: "Search Notes".to_string(),
            history: "History".to_string(),
            history_back: "Back".to_string(),
            history_forward: "Forward".to_string(),
            show_history: "Show History".to_string(),
            about: "About Graphite".to_string(),
            hide: "Hide Graphite".to_string(),
            hide_others: "Hide Others".to_string(),
            show_all: "Show All".to_string(),
            quit: "Quit Graphite".to_string(),
            window: "Window".to_string(),
            minimize: "Minimize".to_string(),
            zoom: "Zoom".to_string(),
            close: "Close".to_string(),
            settings: "Settings...".to_string(),
        }
    }
}

fn build_menu_with_labels(
    handle: &AppHandle,
    labels: &MenuLabels,
) -> Result<Menu<tauri::Wry>, Box<dyn std::error::Error>> {
    let app_menu = Submenu::with_items(
        handle,
        "Graphite",
        true,
        &[
            &PredefinedMenuItem::about(handle, Some(&labels.about), None)?,
            &PredefinedMenuItem::separator(handle)?,
            &MenuItem::with_id(
                handle,
                "app:open-settings",
                &labels.settings,
                true,
                Some("CmdOrCtrl+,"),
            )?,
            &PredefinedMenuItem::separator(handle)?,
            &PredefinedMenuItem::hide(handle, Some(&labels.hide))?,
            &PredefinedMenuItem::hide_others(handle, Some(&labels.hide_others))?,
            &PredefinedMenuItem::show_all(handle, Some(&labels.show_all))?,
            &PredefinedMenuItem::separator(handle)?,
            &PredefinedMenuItem::quit(handle, Some(&labels.quit))?,
        ],
    )?;

    let file_menu = Submenu::with_items(
        handle,
        &labels.file,
        true,
        &[
            &MenuItem::with_id(
                handle,
                "note:create",
                &labels.new_note,
                true,
                Some("CmdOrCtrl+N"),
            )?,
            &MenuItem::with_id(
                handle,
                "folder:create",
                &labels.new_folder,
                true,
                Some("CmdOrCtrl+Shift+N"),
            )?,
        ],
    )?;

    let edit_menu = Submenu::with_items(
        handle,
        &labels.edit,
        true,
        &[
            &PredefinedMenuItem::undo(handle, Some(&labels.undo))?,
            &PredefinedMenuItem::redo(handle, Some(&labels.redo))?,
            &PredefinedMenuItem::separator(handle)?,
            &PredefinedMenuItem::cut(handle, Some(&labels.cut))?,
            &PredefinedMenuItem::copy(handle, Some(&labels.copy))?,
            &PredefinedMenuItem::paste(handle, Some(&labels.paste))?,
            &PredefinedMenuItem::select_all(handle, Some(&labels.select_all))?,
        ],
    )?;

    let view_menu = Submenu::with_items(
        handle,
        &labels.view,
        true,
        &[
            &MenuItem::with_id(
                handle,
                "app:command-palette",
                &labels.command_palette,
                true,
                Some("CmdOrCtrl+P"),
            )?,
            &MenuItem::with_id(
                handle,
                "app:open-search",
                &labels.search_notes,
                true,
                Some("CmdOrCtrl+Shift+F"),
            )?,
            &PredefinedMenuItem::separator(handle)?,
            &MenuItem::with_id(
                handle,
                "app:reload",
                &labels.reload,
                true,
                Some("CmdOrCtrl+R"),
            )?,
        ],
    )?;

    let history_menu = Submenu::with_items(
        handle,
        &labels.history,
        true,
        &[
            &MenuItem::with_id(
                handle,
                "history:back",
                &labels.history_back,
                true,
                Some("CmdOrCtrl+["),
            )?,
            &MenuItem::with_id(
                handle,
                "history:forward",
                &labels.history_forward,
                true,
                Some("CmdOrCtrl+]"),
            )?,
            &PredefinedMenuItem::separator(handle)?,
            &MenuItem::with_id(
                handle,
                "history:show",
                &labels.show_history,
                true,
                Some("CmdOrCtrl+Y"),
            )?,
        ],
    )?;

    let window_menu = Submenu::with_items(
        handle,
        &labels.window,
        true,
        &[
            &PredefinedMenuItem::minimize(handle, Some(&labels.minimize))?,
            &PredefinedMenuItem::maximize(handle, Some(&labels.zoom))?,
            &PredefinedMenuItem::separator(handle)?,
            &PredefinedMenuItem::close_window(handle, Some(&labels.close))?,
        ],
    )?;

    Ok(Menu::with_items(
        handle,
        &[
            &app_menu,
            &file_menu,
            &edit_menu,
            &view_menu,
            &history_menu,
            &window_menu,
        ],
    )?)
}

#[tauri::command]
fn rebuild_menu(app: AppHandle, labels: MenuLabels) -> Result<(), String> {
    let menu = build_menu_with_labels(&app, &labels).map_err(|e| e.to_string())?;
    app.set_menu(menu).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            commands::init_commands::init_graphite_dir,
            commands::fs_commands::list_notes,
            commands::fs_commands::read_note,
            commands::fs_commands::write_note,
            commands::fs_commands::create_note,
            commands::fs_commands::delete_note,
            commands::fs_commands::rename_note,
            commands::folder_commands::list_folders,
            commands::folder_commands::count_all_notes,
            commands::folder_commands::create_folder,
            commands::folder_commands::delete_folder,
            commands::folder_commands::rename_folder,
            commands::config_commands::read_config,
            commands::config_commands::write_config,
            commands::config_commands::read_settings,
            commands::config_commands::write_settings,
            commands::config_commands::read_hotkeys,
            commands::config_commands::write_hotkeys,
            commands::config_commands::read_custom_css,
            commands::config_commands::open_custom_css_file,
            commands::search_commands::search_notes,
            commands::tag_commands::list_tags,
            commands::trash_commands::list_trash,
            commands::trash_commands::read_trash_note,
            commands::trash_commands::restore_note,
            commands::trash_commands::permanently_delete_trash,
            commands::trash_commands::empty_trash,
            commands::trash_commands::purge_expired_trash,
            commands::export_commands::write_export_file,
            commands::move_commands::move_note,
            commands::menu_commands::show_context_menu,
            commands::mcp_commands::get_mcp_binary_path,
            commands::mcp_commands::configure_mcp_client,
            commands::mcp_commands::remove_mcp_client,
            commands::asset_commands::save_image,
            commands::asset_commands::save_image_from_bytes,
            commands::asset_commands::export_image,
            rebuild_menu,
        ])
        .setup(|app| {
            let window = app
                .get_webview_window("main")
                .ok_or("Failed to get main window")?;

            #[cfg(target_os = "macos")]
            if let Err(e) = apply_vibrancy(
                &window,
                NSVisualEffectMaterial::UnderWindowBackground,
                None,
                None,
            ) {
                eprintln!("Failed to apply vibrancy: {}", e);
            }

            // Position traffic light buttons:
            // x=12 aligns with sidebar px-3 (12px) padding
            // y=13 centers ~14px buttons in 40px titlebar (center at 20px from top)
            #[cfg(target_os = "macos")]
            {
                const TRAFFIC_LIGHT_X: f64 = 12.0;
                const TRAFFIC_LIGHT_Y: f64 = 13.0;
                set_traffic_light_position(&window, TRAFFIC_LIGHT_X, TRAFFIC_LIGHT_Y);

                // Reposition after resize/fullscreen (macOS resets positions)
                let win = window.clone();
                window.on_window_event(move |event| match event {
                    tauri::WindowEvent::Resized(_) | tauri::WindowEvent::Moved(_) => {
                        set_traffic_light_position(&win, TRAFFIC_LIGHT_X, TRAFFIC_LIGHT_Y);
                    }
                    _ => {}
                });
            }

            // Build and set native menu with default (English) labels
            let labels = MenuLabels::default();
            match build_menu_with_labels(app.handle(), &labels) {
                Ok(menu) => {
                    app.set_menu(menu)?;
                }
                Err(e) => {
                    eprintln!("Failed to build menu: {}", e);
                }
            }

            // Forward menu events to frontend
            app.on_menu_event(|handle, event| {
                let id = event.id().as_ref();
                let _ = handle.emit("menu-action", id);
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
