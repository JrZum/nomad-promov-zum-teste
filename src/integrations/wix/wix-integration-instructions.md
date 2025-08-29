
# How to Embed Participant Area in Wix

This guide explains how to embed your application's participant area (authentication and number viewing) into a Wix website using Velo.

## Prerequisites

1. A Wix site with Editor X or Velo access
2. Your Lovable application deployed with a public URL

## Steps to Embed the Participant Area

### 1. Set up your Lovable app for embedding

Add this script to your Lovable application's `index.html` to enable communication between your app and Wix:

```html
<script>
// Enable communication with the parent Wix site
document.addEventListener('DOMContentLoaded', function() {
  // Check if we're in an iframe (embedded in Wix)
  if (window.parent !== window) {
    // Add navigation listener
    document.addEventListener('click', function(e) {
      // Check for navigation to participant numbers
      if (e.target.closest('a[href="/numeros"]')) {
        // Send message to parent (Wix) about navigation
        window.parent.postMessage({ 
          type: 'navigate', 
          path: '/numeros' 
        }, '*');
        e.preventDefault();
      }
      
      // Check for navigation back to auth
      if (e.target.closest('a[href="/auth"]')) {
        // Send message to parent (Wix) about navigation
        window.parent.postMessage({ 
          type: 'navigate', 
          path: '/auth' 
        }, '*');
        e.preventDefault();
      }
    });
  }
});
</script>
```

### 2. Create an HTML Component in Wix

1. Open your Wix site in the Editor
2. Add an HTML component (HTML iframe element) to your page
   - Set its ID to "html1"
   - Make it large enough to contain your participant area (recommended min height: 600px)

### 3. Add the Velo Code

1. Click on "Developer Tools" and then "Velo Development"
2. Navigate to "Public" and then "Page Code" for the page where you added the HTML component
3. Copy and paste the code from `src/integrations/wix/embed-participant-area.js` into the page code
4. Replace `"https://your-lovable-app-url.com"` with your actual deployed Lovable app URL

### 4. Customize the Appearance (Optional)

- You can modify the CSS in the embedded HTML to match your Wix site's style
- Adjust the iframe dimensions as needed

### 5. Test the Integration

1. Preview your Wix site
2. The participant area should appear in the HTML component
3. Test both login/registration and viewing numbers

### Troubleshooting

- If the iframe doesn't load: Check that your Lovable app URL is correct and publicly accessible
- If navigation doesn't work: Ensure the message event listeners are properly set up in both your Lovable app and Wix

## Advanced: Using Direct API Integration

For a more seamless integration, you can also use the Supabase API endpoints directly from Wix:

```javascript
// Example Velo code to call your Supabase endpoints
import {fetch} from 'wix-fetch';

// Login participant
export async function loginParticipante(documento, senha) {
  const url = "https://uoovrxfpjsyvpkqdxkoa.supabase.co/functions/v1/login-participante";
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ documento, senha })
    });
    
    return await response.json();
  } catch (error) {
    console.error("Error logging in:", error);
    return { error: "Failed to login" };
  }
}

// Register participant
export async function cadastrarParticipante(participanteData) {
  const url = "https://uoovrxfpjsyvpkqdxkoa.supabase.co/functions/v1/cadastro-participante";
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(participanteData)
    });
    
    return await response.json();
  } catch (error) {
    console.error("Error registering:", error);
    return { error: "Failed to register" };
  }
}
```
