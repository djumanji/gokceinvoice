import { setWasmUrl } from "@lottiefiles/dotlottie-react";

// Centralized path for the dotlottie WebAssembly file served from same-origin
// Ensure the file exists under client/public/vendor/dotlottie/dotlottie-player.wasm
export const DOTLOTTIE_WASM_URL = "/vendor/dotlottie/dotlottie-player.wasm";

// Configure the WASM URL globally for all DotLottieReact components
setWasmUrl(DOTLOTTIE_WASM_URL);


