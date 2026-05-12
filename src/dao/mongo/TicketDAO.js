import { ticketModel } from '../../models/ticket.model.js';

export default class TicketDAO {
    async createTicket(ticketData) {
        try {
            return await ticketModel.create(ticketData);
        } catch (error) {
            throw new Error(`Error al generar el ticket: ${error.message}`);
        }
    }
}