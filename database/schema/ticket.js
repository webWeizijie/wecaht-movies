const mongoose = require('mongoose')
const Schema = mongoose.Schema

const TicketSchema = new Schema({
  name: String,
  ticket: String,
  expires_in: Number,
  meta: {
    createAt: {
      type: Date,
      default: Date.now()
    },
    updatedAt: {
      type: Date,
      default: Date.now()
    }
  }
})

TicketSchema.pre('save', function (next) {
  if (this.isNew) {
    this.meta.createAt = this.meta.updatedAt = Date.now()
  } else {
    this.meta.updatedAt = Date.now()
  }

  next()
})

TicketSchema.statics = {
  async getTicket () {
    const ticket = await this.findOne({
      name: 'ticket'
    })

    return ticket || null
  },
  async saveTicket (data) {
    let ticketData = await this.findOne({
      name: 'ticket'
    })

    if (ticketData) {
      ticketData.ticket = data.ticket
      ticketData.expires_in = data.expires_in
    } else {
      ticketData = new Ticket({
        name: 'ticket',
        ticket: data.ticket,
        expires_in: data.expires_in
      })
    }

    await ticketData.save()

    return ticketData
  }
}

const Ticket = mongoose.model('Ticket', TicketSchema)
