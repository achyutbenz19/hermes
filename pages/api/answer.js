export default function ANSWER(req, res) {
    try {
        const responseXML = `
            <Response>
                <Say>Himalayan restaurant at Niles, how can I help you?</Say>
                <Connect>
                    <Stream url="wss://${process.env.SERVER}/connection" />
                </Connect>
            </Response>
        `;

        res.status(200).setHeader('Content-Type', 'text/xml').send(responseXML);
    } catch (error) {
        console.error('Error responding:', error);
        res.status(500).send('Internal Server Error');
    }
}