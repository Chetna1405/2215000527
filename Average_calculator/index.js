const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 9876;

// Configuration
const WINDOW_SIZE = 10;
const REQUEST_TIMEOUT = 500; // milliseconds
const BASE_URL = 'http://20.244.56.144/evaluation-service';

// Store for different types of numbers
const numberStore = {
    p: [], //prime -numbers
    f: [], // fibonacci numbers
    e: [], // even numbers
    r: []  // random numbers
};

// API endpoints for the third-party server
const apiEndpoints = {
    p: `${BASE_URL}/primes`,
    f: `${BASE_URL}/fibo`,
    e: `${BASE_URL}/even`,
    r: `${BASE_URL}/rand`
};

// Function to fetch numbers from the third-party server
async function fetchNumbers(type) {
    try {
        // First, fetch the auth token
        const authResponse = await axios.post('http://20.244.56.144/evaluation-service/auth', {
            
                "email": "chetna.gla_cs22@gla.ac.in",
                "name": "chetna",
                "rollNo": "2215000527",
                "accessCode": "CNneGT",
                "clientID": "1266e016-e885-4166-97d6-2f70daf6b1e0",
                "clientSecret": "PgjuSUCQHkzGHbXb"
            
        }, {
            timeout: REQUEST_TIMEOUT
        });

        // Extract token from auth response
        const token = authResponse.data.access_token;

        // Use the token for the main API call
        const response = await axios.get(apiEndpoints[type], {
            timeout: REQUEST_TIMEOUT,
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 200 && response.data && response.data.numbers) {
            return response.data.numbers;
        }
        return [];
    } catch (error) {
        console.error(`Error fetching ${type} numbers:`, error);
        return [];
    }
}

// Function to update the number store
function updateStore(type, newNumbers) {
    // Get current state before update
    const windowPrevState = [...numberStore[type]];

    // Add new unique numbers
    const uniqueNewNumbers = newNumbers.filter(num => !numberStore[type].includes(num));
    numberStore[type].push(...uniqueNewNumbers);

    // Trim to window size
    if (numberStore[type].length > WINDOW_SIZE) {
        numberStore[type] = numberStore[type].slice(numberStore[type].length - WINDOW_SIZE);
    }

    return {
        windowPrevState,
        windowCurrState: [...numberStore[type]],
        numbers: newNumbers
    };
}

// Function to calculate average
function calculateAverage(numbers) {
    if (numbers.length === 0) return 0;
    const sum = numbers.reduce((acc, num) => acc + num, 0);
    return (sum / numbers.length).toFixed(2);
}

// Define endpoint for the Average Calculator service
app.get('/numbers/:type', async (req, res) => {
    const type = req.params.type;

    // Validate type parameter
    if (!['p', 'f', 'e', 'r'].includes(type)) {
        return res.status(400).json({ error: 'Invalid number type.' });
    }

    // Fetch new numbers from the third-party server
    const newNumbers = await fetchNumbers(type);

    // Update the store and get states
    const { windowPrevState, windowCurrState, numbers } = updateStore(type, newNumbers);

    // Calculate average
    const avg = calculateAverage(windowCurrState);

    // Prepare response
    const response = {
        windowPrevState,
        windowCurrState,
        numbers,
        avg
    };

    res.json(response);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Average Calculator service running on http://localhost:${PORT}`);
});

