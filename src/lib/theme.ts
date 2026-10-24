// Theme handling shared by the server layout and the client toggle.
export const THEME_KEY = "foundry-theme";

// Runs in <head> before first paint: the saved choice, else the system setting.
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}})();`;
