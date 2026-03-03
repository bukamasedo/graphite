use serde::Deserialize;

#[derive(Deserialize)]
pub struct ContextMenuItem {
    #[serde(default)]
    id: Option<String>,
    #[serde(default)]
    text: Option<String>,
    #[serde(default)]
    accelerator: Option<String>,
    #[serde(default)]
    separator: bool,
}

#[cfg(target_os = "macos")]
mod macos_impl {
    use super::ContextMenuItem;
    use std::cell::Cell;

    use objc2::rc::Retained;
    use objc2::runtime::{AnyObject, NSObject};
    use objc2::{define_class, msg_send, sel, AnyThread, DefinedClass, MainThreadOnly};
    use objc2_app_kit::{NSEvent, NSEventModifierFlags, NSMenu, NSMenuItem};
    use objc2_foundation::{ns_string, MainThreadMarker, NSString};

    struct MenuTargetIvars {
        selected_tag: Cell<isize>,
    }

    define_class!(
        // SAFETY: NSObject has no subclassing requirements; MenuActionTarget does not implement Drop.
        #[unsafe(super(NSObject))]
        #[name = "GraphiteMenuActionTarget"]
        #[ivars = MenuTargetIvars]
        struct MenuActionTarget;

        impl MenuActionTarget {
            #[unsafe(method(menuItemClicked:))]
            fn menu_item_clicked(&self, sender: &AnyObject) {
                let tag: isize = unsafe { msg_send![sender, tag] };
                self.ivars().selected_tag.set(tag);
            }
        }
    );

    impl MenuActionTarget {
        fn new() -> Retained<Self> {
            let this = Self::alloc().set_ivars(MenuTargetIvars {
                selected_tag: Cell::new(-1),
            });
            unsafe { msg_send![super(this), init] }
        }

        fn selected_tag(&self) -> isize {
            self.ivars().selected_tag.get()
        }
    }

    struct ParsedAccelerator {
        key: Retained<NSString>,
        modifiers: NSEventModifierFlags,
    }

    fn parse_accelerator(accel: &str) -> ParsedAccelerator {
        if accel.eq_ignore_ascii_case("return") || accel.eq_ignore_ascii_case("enter") {
            return ParsedAccelerator {
                key: NSString::from_str("\r"),
                modifiers: NSEventModifierFlags(0),
            };
        }

        let parts: Vec<&str> = accel.split('+').collect();
        let mut mods: usize = 0;
        let key_str = parts.last().copied().unwrap_or("");

        for &part in &parts[..parts.len().saturating_sub(1)] {
            match part {
                "CmdOrCtrl" | "Cmd" | "Command" => mods |= 1 << 20,
                "Shift" => mods |= 1 << 17,
                "Alt" | "Option" => mods |= 1 << 19,
                "Ctrl" | "Control" => mods |= 1 << 18,
                _ => {}
            }
        }

        let key_equiv = match key_str {
            "Backspace" | "Delete" => "\u{08}",
            "Tab" => "\t",
            "Escape" | "Esc" => "\u{1b}",
            "Return" | "Enter" => "\r",
            "Space" => " ",
            other => other,
        };

        ParsedAccelerator {
            key: NSString::from_str(&key_equiv.to_lowercase()),
            modifiers: NSEventModifierFlags(mods),
        }
    }

    pub fn show_menu(items: &[ContextMenuItem]) -> Option<String> {
        let mtm = MainThreadMarker::new().expect("must be on main thread");
        unsafe {
            let menu = NSMenu::initWithTitle(NSMenu::alloc(mtm), ns_string!(""));
            let target = MenuActionTarget::new();
            let action = sel!(menuItemClicked:);

            let mut id_map: Vec<Option<String>> = Vec::new();

            for (idx, item) in items.iter().enumerate() {
                if item.separator {
                    menu.addItem(&NSMenuItem::separatorItem(mtm));
                    id_map.push(None);
                    continue;
                }

                let text = item.text.as_deref().unwrap_or("");
                let ns_text = NSString::from_str(text);
                let menu_item = NSMenuItem::initWithTitle_action_keyEquivalent(
                    NSMenuItem::alloc(mtm),
                    &ns_text,
                    Some(action),
                    ns_string!(""),
                );

                menu_item.setTag(idx as isize);
                menu_item.setTarget(Some(&target));

                if let Some(ref accel) = item.accelerator {
                    let parsed = parse_accelerator(accel);
                    menu_item.setKeyEquivalent(&parsed.key);
                    menu_item.setKeyEquivalentModifierMask(parsed.modifiers);
                }

                menu.addItem(&menu_item);
                id_map.push(item.id.clone());
            }

            let mouse_loc = NSEvent::mouseLocation();

            let selected = menu.popUpMenuPositioningItem_atLocation_inView(
                None,
                mouse_loc,
                None,
            );

            if selected {
                let tag = target.selected_tag();
                if tag >= 0 && (tag as usize) < id_map.len() {
                    return id_map[tag as usize].clone();
                }
            }

            None
        }
    }
}

#[tauri::command]
pub async fn show_context_menu(
    app: tauri::AppHandle,
    items: Vec<ContextMenuItem>,
) -> Result<Option<String>, String> {
    #[cfg(target_os = "macos")]
    {
        let (tx, rx) = std::sync::mpsc::sync_channel(1);
        app.run_on_main_thread(move || {
            let result = macos_impl::show_menu(&items);
            let _ = tx.send(result);
        })
        .map_err(|e| e.to_string())?;
        rx.recv().map_err(|e| e.to_string())
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = (app, items);
        Ok(None)
    }
}
