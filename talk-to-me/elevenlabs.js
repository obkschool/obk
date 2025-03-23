// ElevenLabs TTS integration
const ELEVEN_LABS_API_KEY = "sk_0c951dee724607bf3d17f662ef9f08e2aa8d2ddbf0f8fb41";

// Arabic voice IDs from ElevenLabs
// You can use any of these or find more at https://api.elevenlabs.io/v1/voices
const VOICE_IDS = {
  haitham: {
    id: "UR972wNGq3zluze0LoIp",
    name: "هيثم",
    description: "شخص مضحك مصري"
  },
  khaled: {
    id: "7NsaqHdLuKNFvEfjpUno",
    name: "خالد",
    description: "يتكلم بسرية تامة"
  },
  dubai: {
    id: "a1KZUXKFVFDOb33I1uqr",
    name: "دبي",
    description: "صوت نسائي"
  }
};

// Function to convert text to speech using ElevenLabs API
async function speakWithElevenLabs(text) {
  // Split text by punctuation marks
  const segments = text.split(/([,.!?])/);
  
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i].trim();
    if (!segment) continue;
    
    await speakSegment(segment);
    
    // Add pause after punctuation
    if ([',', '.', '!', '?'].includes(segments[i])) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second pause
    }
  }
}

// Verify API connectivity on page load
async function checkElevenLabsConnection() {
  try {
    console.log("ElevenLabs: Testing API connection...");
    const response = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: {
        'xi-api-key': ELEVEN_LABS_API_KEY
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log("ElevenLabs: Successfully connected to API - Available voices:", data.voices?.length || 0);
      return true;
    } else {
      console.error("ElevenLabs: API connection test failed with status:", response.status);
      return false;
    }
  } catch (error) {
    console.error("ElevenLabs: API connection test error:", error);
    return false;
  }
}

// Run connection test immediately
checkElevenLabsConnection();

// Export the function for use in other scripts
window.elevenLabsTTS = {
  speak: speakWithElevenLabs,
  checkConnection: checkElevenLabsConnection
}; 