import type { Request, Response } from "express"
import { prisma } from "../lib/prisma"
import { createCheckoutSession } from "../lib/stripe"

export const createCheckoutController = async (request: Request, response: Response) => {

    console.log('Checkout processing');
    
    const userId = request.headers['x-user-id']

    if(!userId){
        return response.status(403).send({
            error: 'Not authorized'
        })
    }

    const user = await prisma.user.findUnique({
        where:{
            id: userId as string
        }
    })

    if(!user){
        return response.status(403).send({
            error: 'Not authorized'
        })
    }

    const checkout = await createCheckoutSession(user.id, user.name, user.email)

    await prisma.user.update({
        where: {
            id: user.id 
        },
        data:{
            stripeCustomerId: checkout.stripeCustomerId 
        }
    })

    response.status(201).send(checkout);

}