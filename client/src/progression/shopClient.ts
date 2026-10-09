import { isPotionId,POTIONS } from "../../../shared/src/items/potions.js";
import { loadConsumables,savePotionInventory } from "../battle/heroVitals.js";
import { loadProgress,saveProgress } from "./progressionClient.js";
export function buyPotion(id:unknown,quantity=1):string|null{
 if(!isPotionId(id)||!Number.isInteger(quantity)||quantity<1||quantity>99)return "Compra inválida";
 const progress=loadProgress(),inventory=loadConsumables(),count=inventory[id]??0;
 if(count+quantity>9999)return "Limite de estoque atingido";
 const price=POTIONS[id].price*quantity;
 if(!Number.isFinite(progress.ouro)||progress.ouro<price)return "Ouro insuficiente";
 progress.ouro-=price;inventory[id]=count+quantity;saveProgress(progress);savePotionInventory(inventory);return null;
}
