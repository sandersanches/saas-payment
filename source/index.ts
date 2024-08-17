import express from 'express';
import { 
    createUserController, 
    findOneUserController, 
    listUserController 
} from './controllers/user.controller';
import { createTodoController } from './controllers/todo.controller';
import { createCheckoutController } from './controllers/checkout.controller';
import { stripeWebhookController } from './controllers/stripe.controller';

const app = express();
const port = 3000;

// Stripe
app.post('/stripe', express.raw({type:'application/json'}), stripeWebhookController);

app.use(express.json());

// User
app.get('/users', listUserController);
app.get('/users/:userId', findOneUserController);
app.post('/users', createUserController);

// Todo
app.post('/todo', createTodoController);

// Checkout
app.post('/checkout', createCheckoutController);

app.listen(port, () =>{
    console.log(`server is running on http://localhost:${port}`);
});

