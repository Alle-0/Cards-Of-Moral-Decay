import React from 'react';
import { StripeProvider } from '@stripe/stripe-react-native';

const STRIPE_PK_TEST = "pk_test_51SuftnCo1DNnxMz9zUTvd8qmnnRxqdJBZWBpzBs7qoUWXxd2t9WO20GrxaACY2jnCcnqQt6QJnvcnUwIOCiwMMuF00SPunv12U";
const STRIPE_PK_LIVE = "pk_live_51SuftIE6cxPXvoLYnN8Sctv96lUp356ECPzX8TnGkLubWK3T3qJBEukEPyZfPthyflOWvyh8RyPWxJQhzb08VmwH00bJlnz5hy";

const StripeAppWrapper = ({ children }) => {
    const publishableKey = __DEV__ ? STRIPE_PK_TEST : STRIPE_PK_LIVE;
    return (
        <StripeProvider publishableKey={publishableKey}>
            {children}
        </StripeProvider>
    );
};

export default StripeAppWrapper;
