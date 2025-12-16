    import { defineConfig } from "vite";
    
    // Taken from Google AI
    export default defineConfig({
        build: {
            chunkSizeWarningLimit: 1500, // Increase limit to 1000 kB
        },
    });