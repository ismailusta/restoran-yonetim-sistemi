import StationScreen from '@/components/StationScreen';

export default function KitchenPage() {
  return (
    <StationScreen
      station="kitchen"
      room="kitchen_room"
      title="Mutfak"
      subtitle="Yemek siparişleri"
      ticketEvent="kitchenTicket"
      toastMessage="Yemek adisyonu yazdırıldı"
    />
  );
}
