export function buildWaUrl(phoneNumber: string, sellerName: string, adTitle: string): string {
  const message = `Halo ${sellerName}, saya tertarik dengan iklan "${adTitle}". Apakah masih tersedia dan bisa COD?`;
  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
}
