import { Buffer } from 'buffer';

window.global = window.global ?? window;
window.global.Buffer = window.global.Buffer ?? Buffer;
window.process = window.process ?? { env: {} }; // Minimal process polyfill

export {};
