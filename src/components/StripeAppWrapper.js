import React from 'react';
import { StripeProvider } from '@stripe/stripe-react-native';

const StripeAppWrapper = ({ children }) => {
    return (
        <StripeProvider publishableKey="pk_test_51SuftnCo1DNnxMz9zUTvd8qmnnRxqdJBZWBpzBs7qoUWXxd2t9WO20GrxaACY2jnCcnqQt6QJnvcnUwIOCiwMMuF00SPunv12U">
            {children}
        </StripeProvider>
    );
};

export default StripeAppWrapper;
