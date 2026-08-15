import socket from "../network/socket.js";
import type { EquipmentItem } from "../../../shared/src/types/equipment.js";

export function listEquipments(filters = {}): Promise<EquipmentItem[]> {
  return new Promise((resolve) => {
    socket.emit("equipment:list", filters, (items: EquipmentItem[]) => {
      resolve(items);
    });
  });
}

export function getEquipmentById(id: string): Promise<EquipmentItem | null> {
  return new Promise((resolve) => {
    socket.emit("equipment:get", id, (item: EquipmentItem | null) => {
      resolve(item);
    });
  });
}
