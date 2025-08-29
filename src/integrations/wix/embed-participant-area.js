
// Code to embed the Participant Area in Wix using Velo
// This file can be copied and pasted into your Wix site's code panel

// Initialize the page
$w.onReady(function () {
    // Set up the HTML component that will contain the participant area
    if ($w("#html1").length > 0) {
        initParticipantArea();
    }
});

function initParticipantArea() {
    // Configure the HTML component to embed the participant area
    const baseUrl = "https://your-lovable-app-url.com"; // Replace with your actual deployed Lovable app URL
    const htmlContent = `
        <div id="participant-area-container" style="width:100%; height:100%; min-height:600px;">
            <iframe 
                id="participant-iframe" 
                src="${baseUrl}/auth" 
                style="width:100%; height:100%; min-height:600px; border:none;"
                allow="clipboard-write">
            </iframe>
        </div>
        <script>
            // Handle navigation between auth and numbers pages
            window.addEventListener('message', function(event) {
                // Make sure message is from your Lovable app
                if (event.origin !== "${baseUrl}") return;
                
                // Handle navigation messages
                if (event.data.type === 'navigate') {
                    const iframe = document.getElementById('participant-iframe');
                    if (iframe) {
                        iframe.src = "${baseUrl}" + event.data.path;
                    }
                }
            });
        </script>
    `;
    
    // Set the HTML content
    $w("#html1").postMessage(htmlContent);
}
