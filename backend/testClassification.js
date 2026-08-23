const testTexts = [
    "Get 50% off all shoes this weekend only! Shop our huge summer clearance sale now before stocks run out.",
    "Wishing you and your family a very happy and prosperous New Year! May all your dreams come true.",
    "We are thrilled to announce the launch of our brand new SmartWatch Pro. Featuring 24/7 health tracking and a 5-day battery life."
];

async function runTests() {
    for (let i = 0; i < testTexts.length; i++) {
        console.log(`\n=== Test ${i + 1} ===`);
        console.log("Text:", testTexts[i]);
        try {
            const res = await fetch('http://localhost:5000/api/classify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: testTexts[i] })
            });
            const data = await res.json();
            console.log("Status:", res.status);
            console.log("Result:", data);
        } catch (err) {
            console.error("Error:", err);
        }
    }
}

runTests();
