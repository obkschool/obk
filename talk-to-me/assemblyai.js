// AssemblyAI integration for speech recognition
const ASSEMBLY_API_KEY = "ec592a0e891442ea83e1b39f2c4b56b3";

// Audio recording setup
let audioRecorder = null;
let audioChunks = [];
let isRecording = false;
let audioStream = null;
let initializationInProgress = false;

// Initialize the audio recorder
async function initRecorder() {
  if (initializationInProgress) {
    console.log("AssemblyAI: Initialization already in progress, waiting...");
    return new Promise((resolve) => {
      // Check every 500ms if initialization is complete
      const checkInterval = setInterval(() => {
        if (!initializationInProgress) {
          clearInterval(checkInterval);
          resolve(audioRecorder !== null);
        }
      }, 500);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        console.error("AssemblyAI: Initialization timeout");
        initializationInProgress = false;
        resolve(false);
      }, 10000);
    });
  }
  
  initializationInProgress = true;
  
  try {
    console.log("AssemblyAI: Initializing recorder and requesting microphone access...");
    showNotification('جاري طلب إذن الميكروفون...', 'info');
    
    // Release any previous stream
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      audioStream = null;
    }
    
    // Request microphone access with explicit constraints
    let stream;
    try {
      // First try with specific audio constraints
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
    } catch (constraintError) {
      console.warn("AssemblyAI: Failed with specific constraints, trying basic audio access", constraintError);
      // Fallback to basic audio access
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    }
    
    audioStream = stream;
    console.log("AssemblyAI: Microphone access granted");
    showNotification('تم منح إذن الميكروفون', 'success');
    
    // Test if audio is actually working by analyzing audio levels
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    // Check for audio input
    let hasAudioInput = false;
    const checkAudio = () => {
      if (!audioStream) return;
      
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      
      if (average > 10) { // Threshold for detecting audio
        hasAudioInput = true;
        console.log("AssemblyAI: Audio input detected");
      }
    };
    
    // Check audio input for 1 second
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      checkAudio();
      if (hasAudioInput) break;
    }
    
    // Create the MediaRecorder
    let options = {};
    
    // Try different MIME types in order of preference
    const mimeTypes = [
      'audio/webm',
      'audio/webm;codecs=opus',
      'audio/ogg;codecs=opus',
      'audio/wav',
      'audio/mp4'
    ];
    
    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        options = { mimeType };
        console.log(`AssemblyAI: Using mime type ${mimeType}`);
        break;
      }
    }
    
    // Create the recorder
    try {
      audioRecorder = new MediaRecorder(stream, options);
      console.log("AssemblyAI: Created recorder with options:", options);
    } catch (e) {
      console.warn("AssemblyAI: Failed to create recorder with options, using defaults");
      audioRecorder = new MediaRecorder(stream);
    }
    
    // Verify recorder was created successfully
    if (!audioRecorder) {
      throw new Error("Failed to create MediaRecorder");
    }
    
    // Set up event handlers
    audioRecorder.ondataavailable = (event) => {
      console.log(`AssemblyAI: Data available event, size: ${event.data.size} bytes`);
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };
    
    audioRecorder.onstart = () => {
      console.log("AssemblyAI: Recording started");
      isRecording = true;
      audioChunks = [];
      showNotification('بدأ التسجيل', 'info');
    };
    
    audioRecorder.onstop = async () => {
      console.log("AssemblyAI: Recording stopped, processing audio...");
      isRecording = false;
      
      if (audioChunks.length === 0) {
        console.error("AssemblyAI: No audio data recorded");
        showNotification('لم يتم تسجيل أي صوت، يرجى المحاولة مرة أخرى', 'warning');
        return;
      }
      
      const audioBlob = new Blob(audioChunks, { type: audioRecorder.mimeType || 'audio/webm' });
      console.log("AssemblyAI: Audio blob created, size:", audioBlob.size, "bytes");
      
      // Play back the recording locally for testing
      const audioUrl = URL.createObjectURL(audioBlob);
      const debugAudio = new Audio(audioUrl);
      
      // Uncomment this to test local audio playback
      // debugAudio.play();
      
      showNotification('جارٍ معالجة التسجيل الصوتي...', 'info');
      
      try {
        const transcript = await transcribeAudio(audioBlob);
        
        if (transcript) {
          // Send the transcribed text to the chat for processing
          if (window.processUserSpeech) {
            window.processUserSpeech(transcript);
          } else {
            console.error("AssemblyAI: processUserSpeech function not found");
            showNotification('خطأ في معالجة النص المسجل', 'error');
          }
        } else {
          showNotification('لم يتم التعرف على أي كلام في التسجيل', 'warning');
        }
      } catch (transcriptionError) {
        console.error("AssemblyAI: Transcription error:", transcriptionError);
        showNotification('حدث خطأ أثناء تحليل الصوت: ' + transcriptionError.message, 'error');
      }
      
      // Reset for next recording
      audioChunks = [];
    };
    
    audioRecorder.onerror = (event) => {
      console.error("AssemblyAI: Recorder error:", event.error);
      showNotification('خطأ في التسجيل: ' + event.error, 'error');
      isRecording = false;
    };
    
    initializationInProgress = false;
    return true;
  } catch (error) {
    console.error("AssemblyAI: Error accessing microphone:", error);
    showNotification('فشل في الوصول إلى الميكروفون: ' + error.message, 'error');
    initializationInProgress = false;
    return false;
  }
}

// Start recording audio with better error handling
function startRecording() {
  console.log("AssemblyAI: startRecording called");
  
  return new Promise(async (resolve, reject) => {
    try {
      if (!audioRecorder) {
        console.log("AssemblyAI: Recorder not initialized, initializing now");
        showNotification('جاري تهيئة المسجل...', 'info');
        
        const initialized = await initRecorder();
        if (!initialized) {
          console.error("AssemblyAI: Failed to initialize recorder");
          showNotification('فشل في تهيئة المسجل', 'error');
          resolve(false);
          return;
        }
        
        console.log("AssemblyAI: Recorder initialized successfully");
      }
      
      if (isRecording) {
        console.warn("AssemblyAI: Already recording");
        resolve(true);
        return;
      }
      
      if (audioRecorder.state === 'inactive') {
        console.log("AssemblyAI: Starting recording...");
        
        // Start with a shorter timeslice to get data more frequently
        audioRecorder.start(500);
        
        // Wait a moment to ensure recording has started
        setTimeout(() => {
          if (audioRecorder.state === 'recording') {
            console.log("AssemblyAI: Recording confirmed to be active");
            resolve(true);
          } else {
            console.error("AssemblyAI: Recording failed to start properly");
            showNotification('فشل في بدء التسجيل بشكل صحيح', 'error');
            resolve(false);
          }
        }, 500);
      } else {
        console.error("AssemblyAI: Recorder in invalid state:", audioRecorder.state);
        showNotification('المسجل في حالة غير صالحة: ' + audioRecorder.state, 'warning');
        resolve(false);
      }
    } catch (error) {
      console.error("AssemblyAI: Failed to start recording:", error);
      showNotification('خطأ في بدء التسجيل: ' + error.message, 'error');
      
      // Force reset of recorder
      try {
        if (audioRecorder) {
          if (audioRecorder.state === 'recording') {
            audioRecorder.stop();
          }
        }
        
        if (audioStream) {
          audioStream.getTracks().forEach(track => track.stop());
          audioStream = null;
        }
        
        audioRecorder = null;
        isRecording = false;
      } catch (e) {
        console.error("AssemblyAI: Error during reset:", e);
      }
      
      resolve(false);
    }
  });
}

// Stop recording audio
function stopRecording() {
  try {
    if (!audioRecorder || !isRecording) {
      console.warn("AssemblyAI: No active recording to stop");
      return false;
    }
    
    if (audioRecorder.state === 'recording') {
      audioRecorder.stop();
      console.log("AssemblyAI: Recording stopped");
      return true;
    } else {
      console.warn("AssemblyAI: Recorder not in recording state:", audioRecorder.state);
      isRecording = false;
      return false;
    }
  } catch (error) {
    console.error("AssemblyAI: Error stopping recording:", error);
    isRecording = false;
    return false;
  }
}

// Upload and transcribe audio using AssemblyAI
async function transcribeAudio(audioBlob) {
  try {
    showNotification('جارٍ تحليل الصوت...', 'info');
    console.log("AssemblyAI: Beginning transcription process");
    
    // First, upload the audio file
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');
    
    console.log("AssemblyAI: Uploading audio file...");
    const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'authorization': ASSEMBLY_API_KEY
      },
      body: formData
    });
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("AssemblyAI: Upload failed:", uploadResponse.status, errorText);
      throw new Error(`فشل رفع الملف الصوتي: ${uploadResponse.status}`);
    }
    
    const uploadResult = await uploadResponse.json();
    const audioUrl = uploadResult.upload_url;
    console.log("AssemblyAI: Audio uploaded successfully, URL:", audioUrl);
    
    // Then, transcribe the uploaded audio
    console.log("AssemblyAI: Starting transcription...");
    const transcribeResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'authorization': ASSEMBLY_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        audio_url: audioUrl,
        language_code: 'ar'  // Arabic language
      })
    });
    
    if (!transcribeResponse.ok) {
      const errorText = await transcribeResponse.text();
      console.error("AssemblyAI: Transcription request failed:", transcribeResponse.status, errorText);
      throw new Error(`فشل طلب التحويل: ${transcribeResponse.status}`);
    }
    
    const transcribeResult = await transcribeResponse.json();
    const transcriptId = transcribeResult.id;
    console.log("AssemblyAI: Transcription started with ID:", transcriptId);
    
    // Poll for the transcription result
    let result = null;
    let attempts = 0;
    
    showNotification('جارٍ انتظار نتائج التحويل...', 'info');
    
    while (!result && attempts < 30) {  // Wait up to 30 seconds
      console.log(`AssemblyAI: Checking transcription status, attempt ${attempts + 1}/30`);
      await new Promise(resolve => setTimeout(resolve, 1000));  // Wait 1 second
      
      const checkResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        method: 'GET',
        headers: {
          'authorization': ASSEMBLY_API_KEY
        }
      });
      
      if (!checkResponse.ok) {
        const errorText = await checkResponse.text();
        console.error("AssemblyAI: Status check failed:", checkResponse.status, errorText);
        throw new Error(`فشل التحقق من حالة التحويل: ${checkResponse.status}`);
      }
      
      const checkResult = await checkResponse.json();
      console.log("AssemblyAI: Transcription status:", checkResult.status);
      
      if (checkResult.status === 'completed') {
        result = checkResult.text;
        console.log("AssemblyAI: Transcription completed:", result);
        break;
      } else if (checkResult.status === 'error') {
        console.error("AssemblyAI: Transcription error:", checkResult.error);
        throw new Error(`خطأ في التحويل: ${checkResult.error}`);
      }
      
      attempts++;
    }
    
    if (!result) {
      console.error("AssemblyAI: Transcription timed out after 30 seconds");
      throw new Error('انتهت مهلة التحويل');
    }
    
    return result;
  } catch (error) {
    console.error('AssemblyAI: Transcription error:', error);
    showNotification('حدث خطأ أثناء تحليل الصوت: ' + error.message, 'error');
    return null;
  }
}

// Function to check if we can use the microphone
function checkMicrophoneAccess() {
  return navigator.mediaDevices.enumerateDevices()
    .then(devices => {
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      console.log(`AssemblyAI: Found ${audioInputs.length} audio input devices`);
      
      if (audioInputs.length === 0) {
        showNotification('لم يتم العثور على أي ميكروفون متصل بالجهاز', 'warning');
        return false;
      }
      
      return true;
    })
    .catch(error => {
      console.error("AssemblyAI: Error checking audio devices:", error);
      return false;
    });
}

// Initialize right away
checkMicrophoneAccess().then(hasAudioDevices => {
  if (hasAudioDevices) {
    // Don't auto-initialize, wait for user interaction
    console.log("AssemblyAI: Audio devices found, will initialize on first use");
  }
});

// Export functions for use in talk.js
window.assemblyAI = {
  initRecorder,
  startRecording,
  stopRecording,
  checkMicrophoneAccess
};

// Add helper in case showNotification isn't defined yet
if (!window.showNotification) {
  window.showNotification = function(message, type) {
    console.log(`Notification (${type}): ${message}`);
  };
} 