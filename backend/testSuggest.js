const fetch = require('node-fetch') || globalThis.fetch;

const testText = "We are thrilled to announce the launch of our brand new SmartWatch Pro. Featuring 24/7 health tracking and a 5-day battery life, it is designed to help you live your best life. Available now at $199. Shop today!";

const classification = { category: "product_launch", tone: "enthusiastic" };

async function runTests() {
    console.log("=== Testing Suggestions ===");
    try {
        const res = await fetch('http://localhost:5000/api/suggest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                text: testText,
                classification: classification
            })
        });
        const data = await res.json();
        console.log("Status:", res.status);
        console.log("\n--- Hashtags ---");
        console.log(data.hashtags);
        
        console.log("\n--- Audio Mood ---");
        console.log(data.audio_mood);
        
        console.log("\n--- Audio Suggestions ---");
        console.log(data.audio_suggestions);
    } catch (err) {
        console.error("Error:", err);
    }
}

runTests();
