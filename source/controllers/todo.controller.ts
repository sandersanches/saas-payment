import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const createTodoController = async (request: Request, response: Response) => {
    const userId = request.headers['x-user-id']

    const teste = request.headers['teste']    

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