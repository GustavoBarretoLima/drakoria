// Saved quantities represent all owned copies, including the one in an equipment slot.
window.getBackpackEntries = inventory => inventory.items.flatMap(entry => {
  const quantity = entry.quantity - (inventory.equipped[entry.item.slot] === entry.item.id ? 1 : 0);
  return quantity > 0 ? [{ ...entry, quantity }] : [];
});
