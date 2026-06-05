const kitchenTickets = new Map();
const barTickets = new Map();

export function addTicket(station, ticket) {
  const store = station === 'kitchen' ? kitchenTickets : barTickets;
  store.set(ticket.id, ticket);
  return ticket;
}

export function removeTicket(station, ticketId) {
  const store = station === 'kitchen' ? kitchenTickets : barTickets;
  return store.delete(ticketId);
}

export function getTickets(station) {
  const store = station === 'kitchen' ? kitchenTickets : barTickets;
  return Array.from(store.values());
}
