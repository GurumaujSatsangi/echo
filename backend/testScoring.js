const fetch = require('node-fetch') || globalThis.fetch;

const testCases = [
    {
        name: "Well-written professional announcement",
        text: "We are thrilled to announce the launch of our brand new SmartWatch Pro. Featuring 24/7 health tracking and a 5-day battery life, it is designed to help you live your best life.",
        classification: { category: "product_launch", tone: "enthusiastic" }
    },
    {
        name: "Sloppy text with typos and poor grammar",
        text: "hey u guyz buy r stuf its grate and we hav the best thingz eva.",
        classification: { category: "advertisement", tone: "urgent" }
    }
];

async function runTests() {
    for (let i = 0; i < testCases.length; i++) {
        console.log(`\n=== Test ${i + 1}: ${testCases[i].name} ===`);
        try {
            const res = await fetch('http://localhost:5000/api/score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    text: testCases[i].text,
                    classification: testCases[i].classification
                })
            });
            const data = await res.json();
            console.log("Status:", res.status);
            console.log("Score:", data.score);
            console.log("Breakdown:", data.breakdown);
            console.log("Suggested Edits:", data.suggested_edits);
        } catch (err) {
            console.error("Error:", err);
        }
    }
}

runTests();
