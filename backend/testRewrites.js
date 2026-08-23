const fetch = require('node-fetch') || globalThis.fetch;

const testText = "We are thrilled to announce the launch of our brand new SmartWatch Pro. Featuring 24/7 health tracking and a 5-day battery life, it is designed to help you live your best life. Available now at $199. Shop today!";

const classification = { category: "product_launch", tone: "enthusiastic" };

async function runTests() {
    console.log("=== Testing Rewrites ===");
    try {
        const res = await fetch('http://localhost:5000/api/rewrite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                text: testText,
                classification: classification
            })
        });
        const data = await res.json();
        console.log("Status:", res.status);
        console.log("\n--- Twitter ---");
        console.log(`Length: ${data.twitter?.length || 0}`);
        console.log(data.twitter);
        
        console.log("\n--- LinkedIn ---");
        console.log(data.linkedin);
        
        console.log("\n--- Instagram ---");
        console.log(data.instagram);
    } catch (err) {
        console.error("Error:", err);
    }
}

runTests();
