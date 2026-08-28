// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    #[cfg(target_os = "windows")]
    {
        // Force high-performance GPU rasterization, subpixel font antialiasing and High-DPI scaling
        std::env::set_var(
            "WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS",
            "--enable-features=msEdgeSubpixelFontRendering,CanvasOopif --high-dpi-support=1 --enable-gpu-rasterization --enable-zero-copy --ignore-gpu-blocklist",
        );
        std::env::set_var("WEBVIEW2_DEFAULT_BACKGROUND_COLOR", "0xFF09090B");
    }

    crescent_lib::run()
}
