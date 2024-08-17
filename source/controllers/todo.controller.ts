import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const createTodoController = async (request: Request, response: Response) => {
    const userId = request.headers['x-user-id']

    if(!userId){
        return response.status(403).send({
            error: 'Not authorized'
        })
    }

    const user = await prisma.user.findUnique({
        where:{
            id: userId as string
        },
        select: {
            id: true,
            stripeSubscriptionId: true,
            stripeSubscriptionStatus: true,
            _count: {
                select: {
                    todos: true
                }
            }
        }
    })

    
    
    if(!user){
        return response.status(403).send({
            error: 'Not authorized'
        })
    }
    
    const freeTodos = 5;
    const hasQuotaAvailable = user._count.todos < freeTodos;
    const hasActiveSubscription = user.stripeSubscriptionId && user.stripeSubscriptionStatus === 'active';

    if(!hasActiveSubscription && !hasQuotaAvailable){
        return response.status(403).send({
            error: 'Not quota available. Please upgrade your plan.'
        })
    } 

    const {title} = request.body

    if(!title){
        return response.send({
            error: 'title invalid'
        })
    }

    const todo = await prisma.todo.create({
        data:{
            title,
            ownerId: user.id
        }
    })

    response.status(201).send(todo);
}