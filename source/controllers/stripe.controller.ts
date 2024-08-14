import type { Request, Response } from "express"
import { config } from "../config";
import { handleProcessWebhookCheckout, handleProcessWebhookUpdatedScription, stripe } from "../lib/stripe";

export const stripeWebhookController = async (request: Request, response: Response) => {
    let event = request.body;

    if (!config.stripe.secretKey){
        console.error('STRIPE_WEBHOOK_KEY is not set');
        return response.sendStatus(400);
    }

    const signature = request.headers['stripe-signature'] as string;

    try{
        event = stripe.webhooks.constructEvent(
            request.body, 
            signature,
            config.stripe.secretKey
        )
    }catch(err){
        const errorMessage = () => {
            if(err instanceof Error)  return err.message
            else return 'Unknow error';
        }
        console.log('Wenhook signature verification failed', errorMessage);
        return response.sendStatus(400);
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed':
                await handleProcessWebhookCheckout(event)
            break;
            
            case 'customer.subscription.created':
                const customerSubscriptionCreated = event.data.object;
            break;
            
            case 'customer.subscription.updated':
                await handleProcessWebhookUpdatedScription(event)
            break;

            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        response.send();
    } catch (err) {
        const errorMessage = () => {
            if(err instanceof Error)  return err.message
            else return 'Unknow error';
        }
        console.log(errorMessage);
        return response.status(500).json({error: errorMessage});
    }
}