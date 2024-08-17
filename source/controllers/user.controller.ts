import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { createStripeCustomer } from "../lib/stripe";

export const listUserController = async (request: Request, response: Response) => {
    const users = await prisma.user.findMany()
    response.send(users);
}

export const findOneUserController = async (request: Request, response: Response) => {
    const { userId } = request.params

    const user = await prisma.user.findUnique({
        where: {
            id: userId
        }
    })

    if(!user) {
        return response.status(404).send({
            error: 'Not found'
        })
    }

    response.send(user)

}

export const createUserController = async (request: Request, response: Response) => {
    const {name, email} = request.body

    if(!name || !email){
        return response.send({
            error: 'name or email invalid'
        })
    }

    const userEmailAlreadyExist = await prisma.user.findUnique({
        where: {
            email: email
        }
    })

    if(userEmailAlreadyExist){
        return response.status(400).send({
            error: 'email alread in use'
        })
    }

    const stripeCustomer = await createStripeCustomer({email, name})


    const user = await prisma.user.create({
        data:{
            name:name,
            email:email,
            stripeCustomerId:stripeCustomer.id
        }
    })

    response.status(201).send(user);
}