import { buyPotion } from "../progression/shopClient.js";
import { syncCharacterVitals } from "../progression/heroStats.js";
declare global {interface Window{comprarPocaoCatalogo:(id:unknown)=>string|null;}}
window.comprarPocaoCatalogo=buyPotion;
syncCharacterVitals();
