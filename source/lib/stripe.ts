import Stripe from "stripe";
import { config } from "../config";
import { prisma } from "./prisma";

export const stripe = new Stripe(config.stripe.secretKey, {
    apiVersion: '2024-06-20',
    httpClient: Stripe.createFetchHttpClient(),
})

export const getstripeCostumerByEmail =async (email: string) => {
    const customer = await stripe.customers.list({ email });
    return customer.data[0];
}

export const createStripeCustomer = async( 
    input: {
        name?: string
        email: string
    }
) => {
    let stripeCustomer = await getstripeCostumerByEmail(input.email)
    
    if (stripeCustomer) return stripeCustomer
    
    return await stripe.customers.create({
        name: input.name,
        email:input.email
    });
}


export const createCheckoutSession = async (userId: string, userName:string, userEmail: string) => {
    try {

        const stripeCustomer = await createStripeCustomer({name: userName, email: userEmail})

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            client_reference_id: userId,
            customer: stripeCustomer.id,
            success_url: 'http://localhost:3000/sucess.html',
            cancel_url: 'http://localhost:3000/cancel.html',
            line_items: [{
                price: config.stripe.proPriceId,
                quantity: 1
            }]
        });

        return{
            stripeCustomerId: stripeCustomer.id,
            url: session.url
        }
    } catch (error) {
        throw new Error('Error to create checkout session')
    }

}

export const handleProcessWebhookCheckout = async (event: {data: {object: Stripe.Checkout.Session}}) => {

    const clientReferenceId = event.data.object.client_reference_id as string
    const stripeSubscriptionId = event.data.object.subscription as string
    const stripeCustomerId = event.data.object.customer as string
    const checkoutStatus = event.data.object.status

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

export const handleProcessWebhookUpdatedScription = async (event: {data: { object: Stripe.Subscription}}) => {

    const stripeCustomerId = event.data.object.customer as string
    const stripeSubscriptionId = event.data.object.id as string
    const stripeSubscriptionStatus = event.data.object.status

    console.log(`stripeCustomerId: ${stripeCustomerId}`);
    console.log(`stripeSubscriptionId: ${stripeSubscriptionId}`);
    console.log(`stripeSubscriptionStatus: ${stripeSubscriptionStatus}`);
    

    if(!stripeCustomerId || !stripeSubscriptionId){
        throw new Error ('stripeCustomerId and stripeSubscriptionId is required!');
    }

    const userExists = await prisma.user.findFirst({
        where:{
            stripeCustomerId: stripeCustomerId
        }
    })

    if(!userExists){
        throw new Error ('user of clientReferenceId not foud!');
    }

    await prisma.user.update({
        where: {
            id: userExists.id
        },
        data: {
            stripeCustomerId, 
            stripeSubscriptionId,
            stripeSubscriptionStatus
        }   
    })
}