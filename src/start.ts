import { createStart } from "@tanstack/react-start";

// Cookies enviam a sessão automaticamente em toda request — sem attach manual.
export const startInstance = createStart(() => ({}));
