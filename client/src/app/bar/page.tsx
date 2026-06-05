import StationScreen from '@/components/StationScreen';

export default function BarPage() {
  return (
    <StationScreen
      station="bar"
      room="bar_room"
      title="Bar"
      subtitle="İçecek siparişleri"
      ticketEvent="barTicket"
      toastMessage="İçecek adisyonu yazdırıldı"
    />
  );
}
