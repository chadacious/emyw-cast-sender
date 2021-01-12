
const CAST_APP_ID = 'BB8F8D30';
const RECEIVER_URL = 'http://localhost:8080/';
const EXTENSION_ID = 'kdkmmpkdaepeoniobmahbegnicmfeiip';
const ENJOY_BRIDGE_NS = 'urn:x-cast:enjoy.bridge';

const cjs = new Castjs({ receiver: CAST_APP_ID });

let castSession;

// Wait for user interaction
document.getElementById('cast').addEventListener('click', () => {
    // Check if casting is available
    if (cjs.available) {
        // Initiate new cast session
        cjs.cast('na', { provider: 'DISNEYPLUS', videoId: '30ea8a44-797d-4da8-b776-2e3636a2bf5a' });
        cjs.on('connect', () => {
            castSession = cast.framework.CastContext.getInstance().getCurrentSession();
            // Add an event listener to the defined namespace channel
            castSession.addMessageListener(ENJOY_BRIDGE_NS, async (namespace, message) => {
                // console.log(namespace, message);
                const res = await iframeFetch(message);
                cast.framework.CastContext.getInstance().sendCustomMessage(namespace, undefined, res);
            });    
        })
    }
});

const iframeFetch = async (args) => {
    const { url, request, reqType, resType } = JSON.parse(args).ProviderRequest;
    try {
        resJson = await new Promise((resolve) => {
            const onMessageReceived = (res) => {
                // console.log(res.data);
                window.removeEventListener("message", onMessageReceived, false);
                resolve(res.data);
            };
            window.addEventListener("message", onMessageReceived, false);
            console.log('The request is', args);
            window.chrome.runtime.sendMessage(
                EXTENSION_ID,
                {
                    ProviderRequest: {
                        url,
                        reqType,
                        resType,
                        receiverUrl: RECEIVER_URL,
                        ...request,
                    }
                },
                (res) => {
                    console.log('got the body response', res);
                    resolve(res);
                }
            );
        });
    } catch (error) {
        console.log('Attempt to notify Enjoy Chrome extension failed. Perhaps extension is not running'
            + ' or an unsupported browser is being used.', error);
    }
    return resJson;
};