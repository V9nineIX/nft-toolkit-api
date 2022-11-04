const Queue  = require('bull')
import { orderProcess } from './order-queue-cosumer' 

const orderQueue = new Queue("orders" , {
    redis:  process.env.SERVER_IP+":6379"
})

orderQueue.process(orderProcess)

const createNewOrder = (order) => {
    orderQueue.add(order,{
        attempt:2,
    })
}

export { createNewOrder , orderQueue }