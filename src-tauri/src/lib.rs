use tauri_plugin_shell::ShellExt;
use tauri::menu::{MenuBuilder, PredefinedMenuItem, SubmenuBuilder, MenuItemBuilder};
use tauri::Emitter;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Configure native desktop app menu bar (File, Edit, View)
      let handle = app.handle();

      // 1. File Menu
      let quit = PredefinedMenuItem::quit(handle, Some("Exit"))?;
      let file_menu = SubmenuBuilder::new(handle, "File")
          .item(&quit)
          .build()?;

      // 2. Edit Menu
      let undo = PredefinedMenuItem::undo(handle, None)?;
      let redo = PredefinedMenuItem::redo(handle, None)?;
      let cut = PredefinedMenuItem::cut(handle, None)?;
      let copy = PredefinedMenuItem::copy(handle, None)?;
      let paste = PredefinedMenuItem::paste(handle, None)?;
      let select_all = PredefinedMenuItem::select_all(handle, None)?;
      
      let edit_menu = SubmenuBuilder::new(handle, "Edit")
          .item(&undo)
          .item(&redo)
          .separator()
          .item(&cut)
          .item(&copy)
          .item(&paste)
          .separator()
          .item(&select_all)
          .build()?;

      // 3. View Menu (Navigation & window modes)
      let ws_view = MenuItemBuilder::with_id("workspace", "Swarm Workspace")
          .accelerator("CmdOrCtrl+1")
          .build(handle)?;
      let db_view = MenuItemBuilder::with_id("dashboard", "BI Analytics Dashboard")
          .accelerator("CmdOrCtrl+2")
          .build(handle)?;
      let setup_view = MenuItemBuilder::with_id("setup", "Database Setup")
          .accelerator("CmdOrCtrl+3")
          .build(handle)?;
      let settings_view = MenuItemBuilder::with_id("settings", "Settings")
          .accelerator("CmdOrCtrl+4")
          .build(handle)?;

      let view_menu = SubmenuBuilder::new(handle, "View")
          .item(&ws_view)
          .item(&db_view)
          .item(&setup_view)
          .item(&settings_view)
          .build()?;

      // Assemble final menu bar
      let menu = MenuBuilder::new(handle)
          .items(&[&file_menu, &edit_menu, &view_menu])
          .build()?;

      app.set_menu(menu)?;

      // Spawn the sidecar backend
      let sidecar = app.shell().sidecar("enterprise-analyst-backend");
      match sidecar {
        Ok(sidecar) => {
          match sidecar.spawn() {
            Ok((_rx, _child)) => {
              println!("Successfully spawned backend sidecar!");
            }
            Err(e) => {
              eprintln!("Failed to spawn backend sidecar child: {}", e);
            }
          }
        }
        Err(e) => {
          eprintln!("Failed to get backend sidecar: {}", e);
        }
      }

      Ok(())
    })
    .on_menu_event(|app, event| {
      match event.id().as_ref() {
        "workspace" => {
          let _ = app.emit("menu-navigate", "workspace");
        }
        "dashboard" => {
          let _ = app.emit("menu-navigate", "dashboard");
        }
        "setup" => {
          let _ = app.emit("menu-navigate", "setup");
        }
        "settings" => {
          let _ = app.emit("menu-navigate", "settings");
        }
        _ => {}
      }
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
