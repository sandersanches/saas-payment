import Stripe from "stripe";
import { config } from "../config";
import { prisma } from "./prisma";

export const stripe = new Stripe(config.stripe.secretKey, {
    apiVersion: '2024-06-20'
})

export const createCheckoutSession = async (userId: string) => {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            client_reference_id: userId,
            success_url: 'http://localhost:3000/sucess.html',
            cancel_url: 'http://localhost:3000/cancel.html',
            line_items: [{
                price: config.stripe.proPriceId,
                quantity: 1
            }]
        });

        return{
            url: session.url
        }
    } catch (error) {
        console.error(error);
    }

}

export const handleProcessWebhookCheckout = async (event: {object: Stripe.Checkout.Session}) => {
    const clientReferenceId = event.object.client_reference_id as string
    const stripeSubscriptionId = event.object.subscription as string
    const stripeCustomerId = event.object.customer as string
    const checkoutStatus = event.object.status

    if(checkoutStatus !== 'complete') return

    if(!clientReferenceId || !stripeSubscriptionId || !stripeCustomerId){
        throw new Error ('clientReferenceId, stripeSubscriptionId and stripeCustomerId is required!');
    }

    const userExists = await prisma.user.findUnique({
        where:{
            id: clientReferenceId
        }
    })

    if(!userExists){
        throw new Error ('user of clientReferenceId not foud!');
    }
    
    await prisma.user.update({
        where: {
            id: clientReferenceId
        },
        data: {
            stripeCustomerId, 
            stripeSubscriptionId
        }   
    })
}

export const handleProcessWebhookUpdatedScription = async (event: { object: Stripe.Subscription}) => {
    const stripeCustomerId = event.object.customer as string
    const stripeSubscriptionId = event.object.id as string
    const stripeSubscriptionStatus = event.object.status

    if(stripeSubscriptionStatus !== "active") return

    if(!stripeCustomerId || !stripeSubscriptionId){
        throw new Error ('stripeCustomerId and stripeSubscriptionId is required!');
    }

    const userExists = await prisma.user.findFirst({
        where:{
            id: stripeCustomerId
        }
    })

    if(!userExists){
        throw new Error ('user of clientReferenceId not foud!');
    }

    await prisma.user.update({
        where: {
            id: stripeCustomerId
        },
        data: {
            stripeCustomerId, 
            stripeSubscriptionId,
            stripeSubscriptionStatus
        }   
    })

}