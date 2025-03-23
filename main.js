// تحسينات عامة لتوافق الهواتف المحمولة
document.addEventListener('DOMContentLoaded', function() {
  // الكشف عن نوع الجهاز
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    // إضافة فئة للجسم للتعرف على الأجهزة المحمولة في CSS
    document.body.classList.add('mobile-device');
    
    // تحسين التمرير للأجهزة المحمولة
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        // إذا كان الرابط يشير إلى قسم في نفس الصفحة
        if (this.getAttribute('href').startsWith('#')) {
          e.preventDefault();
          const targetId = this.getAttribute('href').substring(1);
          const targetElement = document.getElementById(targetId);
          
          if (targetElement) {
            targetElement.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
        }
      });
    });
    
    // تحسين التفاعل مع الأزرار
    const allButtons = document.querySelectorAll('button, .btn, .nav-link, .feature-card');
    allButtons.forEach(button => {
      // إضافة تأثير لمس أفضل
      button.addEventListener('touchstart', function() {
        this.style.transform = 'scale(0.98)';
      }, { passive: true });
      
      button.addEventListener('touchend', function() {
        this.style.transform = '';
      }, { passive: true });
    });
    
    // تحسين أداء الرسوم المتحركة
    const animations = document.querySelectorAll('.animated, .animation');
    animations.forEach(animation => {
      animation.style.animationDuration = '0.5s';
    });
    
    // تقليل تأثيرات الخلفية لتحسين الأداء
    const backgroundEffects = document.querySelectorAll('.background-effect, .particles, .purple-rain');
    backgroundEffects.forEach(effect => {
      if (effect.id === 'purple-rain') {
        // تقليل عدد قطرات المطر
        effect.innerHTML = '';
        const raindropsCount = 30;
        for (let i = 0; i < raindropsCount; i++) {
          createRaindrop(effect);
        }
      } else {
        // تقليل شفافية التأثيرات الأخرى
        effect.style.opacity = '0.5';
      }
    });
    
    // تحسين حجم الخط للإدخال
    const inputElements = document.querySelectorAll('input, textarea');
    inputElements.forEach(input => {
      input.style.fontSize = '16px'; // منع تكبير الشاشة تلقائيًا على iOS
    });
  }
  
  // تعديل الارتفاع لشاشات الهواتف
  function adjustHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }
  
  // تنفيذ ضبط الارتفاع عند التحميل وتغيير حجم الشاشة
  adjustHeight();
  window.addEventListener('resize', adjustHeight);

  // وظائف التحدث النصي باستخدام ResponsiveVoice
  if (typeof responsiveVoice !== 'undefined') {
    // عناصر واجهة حوار التحدث النصي
    const ttsDialog = document.getElementById('tts-dialog');
    const ttsCloseBtn = document.getElementById('tts-close-btn');
    const ttsVoiceSelect = document.getElementById('tts-voice');
    const ttsRateInput = document.getElementById('tts-rate');
    const ttsRateValue = document.getElementById('tts-rate-value');
    const ttsPitchInput = document.getElementById('tts-pitch');
    const ttsPitchValue = document.getElementById('tts-pitch-value');
    const ttsText = document.getElementById('tts-text');
    const ttsPlayBtn = document.getElementById('tts-play-btn');
    const ttsPauseBtn = document.getElementById('tts-pause-btn');
    const ttsStopBtn = document.getElementById('tts-stop-btn');
    
    // إضافة زر التحدث النصي إلى القائمة
    addTtsButton();
    
    // تحديث قيم السرعة والنبرة
    ttsRateInput.addEventListener('input', function() {
      ttsRateValue.textContent = this.value;
    });
    
    ttsPitchInput.addEventListener('input', function() {
      ttsPitchValue.textContent = this.value;
    });
    
    // إغلاق واجهة الحوار
    ttsCloseBtn.addEventListener('click', function() {
      ttsDialog.classList.remove('active');
    });
    
    // تشغيل التحدث النصي
    ttsPlayBtn.addEventListener('click', function() {
      const text = ttsText.value.trim();
      if (text) {
        const voice = ttsVoiceSelect.value;
        const rate = parseFloat(ttsRateInput.value);
        const pitch = parseFloat(ttsPitchInput.value);
        
        responsiveVoice.speak(text, voice, {
          rate: rate,
          pitch: pitch,
          onstart: function() {
            ttsPlayBtn.disabled = true;
            ttsPauseBtn.disabled = false;
            ttsStopBtn.disabled = false;
          },
          onend: function() {
            resetTtsButtons();
          },
          onerror: function() {
            resetTtsButtons();
            alert('حدث خطأ أثناء التشغيل');
          }
        });
      } else {
        alert('الرجاء إدخال نص للقراءة');
      }
    });
    
    // إيقاف التحدث النصي مؤقتًا
    ttsPauseBtn.addEventListener('click', function() {
      if (responsiveVoice.isPlaying()) {
        if (ttsPauseBtn.querySelector('span').textContent === 'pause') {
          // إيقاف مؤقت
          responsiveVoice.pause();
          ttsPauseBtn.querySelector('span').textContent = 'play_arrow';
          ttsPauseBtn.querySelector('span').nextSibling.textContent = 'استئناف';
        } else {
          // استئناف
          responsiveVoice.resume();
          ttsPauseBtn.querySelector('span').textContent = 'pause';
          ttsPauseBtn.querySelector('span').nextSibling.textContent = 'إيقاف مؤقت';
        }
      }
    });
    
    // إيقاف التحدث النصي
    ttsStopBtn.addEventListener('click', function() {
      responsiveVoice.cancel();
      resetTtsButtons();
    });
    
    // إعادة تعيين أزرار التحكم
    function resetTtsButtons() {
      ttsPlayBtn.disabled = false;
      ttsPauseBtn.disabled = true;
      ttsStopBtn.disabled = true;
      ttsPauseBtn.querySelector('span').textContent = 'pause';
      ttsPauseBtn.querySelector('span').nextSibling.textContent = 'إيقاف مؤقت';
    }
    
    // إضافة زر التحدث النصي إلى القائمة
    function addTtsButton() {
      const navLinks = document.querySelector('.nav-links');
      if (navLinks) {
        const ttsLink = document.createElement('a');
        ttsLink.href = 'javascript:void(0);';
        ttsLink.className = 'nav-link';
        ttsLink.innerHTML = `
          <span class="material-symbols-rounded icon">record_voice_over</span>
          <span>التحدث النصي</span>
        `;
        
        ttsLink.addEventListener('click', function() {
          ttsDialog.classList.add('active');
        });
        
        navLinks.appendChild(ttsLink);
      }
    }
  } else {
    console.error('ResponsiveVoice غير متوفر');
  }

  // إضافة تأثير المطر الأرجواني
  const purpleRain = document.getElementById('purple-rain');
  if (purpleRain) {
    // تحديد عدد قطرات المطر بناءً على نوع الجهاز
    const raindropsCount = isMobile ? 30 : 80;
    
    console.log('Creating rain effect with', raindropsCount, 'raindrops');
    
    // إنشاء قطرات المطر
    for (let i = 0; i < raindropsCount; i++) {
      createRaindrop(purpleRain);
    }
    
    // إضافة قطرات جديدة كل 10 ثوانٍ للحفاظ على التأثير
    setInterval(function() {
      // إضافة 5-10 قطرات جديدة
      const newDrops = isMobile ? 3 : 8;
      for (let i = 0; i < newDrops; i++) {
        createRaindrop(purpleRain);
      }
      
      // إزالة بعض القطرات القديمة للحفاظ على الأداء
      const oldDrops = purpleRain.querySelectorAll('.raindrop');
      if (oldDrops.length > raindropsCount * 1.5) {
        for (let i = 0; i < newDrops; i++) {
          if (oldDrops[i]) {
            oldDrops[i].remove();
          }
        }
      }
    }, 10000);
  }

  // إضافة تأثير تفاعلي للمطر عند تحريك الماوس
  document.addEventListener('mousemove', function(e) {
    if (purpleRain && !isMobile) {
      // إنشاء قطرة مطر عند موقع الماوس
      const mouseX = (e.clientX / window.innerWidth) * 100;
      
      // إنشاء قطرة كل 5 حركات للماوس
      if (Math.random() > 0.001) {
        const raindrop = document.createElement('div');
        raindrop.className = 'raindrop';
        
        // إضافة لون عشوائي
        const colors = ['purple', 'blue'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        raindrop.classList.add(randomColor);
        
        // تعيين موقع بناءً على موقع الماوس
        raindrop.style.left = `${mouseX}%`;
        
        // تعيين حجم عشوائي
        const size = Math.random() * 2 + 1;
        raindrop.style.width = `${size}px`;
        raindrop.style.height = `${size * 10}px`;
        
        // تعيين سرعة عشوائية
        const duration = Math.random() * 5 + 3;
        raindrop.style.animationDuration = `${duration}s`;
        
        // إضافة قطرة المطر إلى الحاوية
        purpleRain.appendChild(raindrop);
        
        // إزالة قطرة المطر بعد انتهاء الرسوم المتحركة
        setTimeout(function() {
          if (raindrop.parentNode === purpleRain) {
            purpleRain.removeChild(raindrop);
          }
        }, duration * 1000);
      }
    }
  });

  // Create floating circles effect instead of rain
  function createFloatingCircles() {
    const container = document.getElementById('purple-rain');
    if (!container) return;
    
    // Clear existing raindrops
    container.innerHTML = '';
    
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    // Create fewer floating circles
    const circlesCount = Math.min(15, Math.floor(screenWidth / 120)); 
    
    for (let i = 0; i < circlesCount; i++) {
      const circle = document.createElement('div');
      circle.classList.add('floating-circle');
      
      // Randomize circle properties
      const size = Math.random() * 80 + 40; // Circles between 40px-120px
      const posX = Math.floor(Math.random() * screenWidth);
      const posY = Math.floor(Math.random() * screenHeight);
      
      // Create unique animation parameters for each circle
      const speedMultiplier = Math.random() * 1.5 + 0.5; // 0.5-2x speed
      const radius = Math.random() * 100 + 50; // Movement radius 50-150px
      
      circle.style.width = `${size}px`;
      circle.style.height = `${size}px`;
      circle.style.left = `${posX}px`;
      circle.style.top = `${posY}px`;
      circle.style.opacity = Math.random() * 0.3 + 0.1; // 0.1-0.4 opacity
      
      // Customize animation for this circle
      circle.style.animationDuration = `${(Math.random() * 20 + 20) / speedMultiplier}s`;
      circle.style.animationDelay = `${Math.random() * 10}s`;
      
      // Create unique float path for each circle
      const uniquePath = `
        @keyframes float-path-${i} {
          0% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(${radius}px, ${-radius/2}px) scale(${0.8 + Math.random() * 0.4}); }
          50% { transform: translate(${radius/2}px, ${radius}px) scale(${0.8 + Math.random() * 0.4}); }
          75% { transform: translate(${-radius}px, ${radius/2}px) scale(${0.8 + Math.random() * 0.4}); }
          100% { transform: translate(0, 0) scale(1); }
        }
      `;
      
      // Add unique animation to head
      const styleSheet = document.createElement('style');
      styleSheet.textContent = uniquePath;
      document.head.appendChild(styleSheet);
      
      // Apply the unique animation
      circle.style.animation = `float-path-${i} ${(Math.random() * 20 + 20) / speedMultiplier}s infinite alternate ease-in-out`;
      
      container.appendChild(circle);
    }
  }

  // Call this on page load
  createFloatingCircles();
  
  // Add more circles occasionally
  setInterval(() => {
    const container = document.getElementById('purple-rain');
    if (container && container.children.length < 25) {
      const circle = document.createElement('div');
      circle.classList.add('floating-circle');
      
      const size = Math.random() * 80 + 40;
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      circle.style.width = `${size}px`;
      circle.style.height = `${size}px`;
      circle.style.left = `${Math.floor(Math.random() * screenWidth)}px`;
      circle.style.top = `${Math.floor(Math.random() * screenHeight)}px`;
      circle.style.opacity = Math.random() * 0.3 + 0.1;
      circle.style.animationDuration = `${Math.random() * 20 + 20}s`;
      
      container.appendChild(circle);
    }
  }, 8000);
  
  // Handle window resize
  window.addEventListener('resize', createFloatingCircles);

  // Fade in the page when loaded
  document.body.style.opacity = 1;
  
  // Handle all internal navigation links for fade-out effect
  const internalLinks = document.querySelectorAll('a[href^="index.html"], a[href^="chat.html"], a[href="./"], .cta-button');
  
  internalLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      // Prevent default navigation
      e.preventDefault();
      
      // Store the target URL
      const targetUrl = this.href || (this.tagName.toLowerCase() === 'button' ? 'chat.html' : '');
      if (!targetUrl) return;
      
      // Add fade-out class to body
      document.body.classList.add('fade-out');
      
      // Navigate after animation completes
      setTimeout(() => {
        window.location.href = targetUrl;
      }, 500); // Match this to the fadeOut animation duration
    });
  });
});

// دالة إنشاء قطرة مطر محسنة
function createRaindrop(container) {
  const raindrop = document.createElement('div');
  raindrop.className = 'raindrop';
  
  // إضافة لون عشوائي
  const colors = ['purple', 'blue'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  raindrop.classList.add(randomColor);
  
  // تعيين موقع عشوائي
  const posX = Math.random() * 100;
  raindrop.style.left = `${posX}%`;
  
  // تعيين حجم عشوائي
  const size = Math.random() * 2 + 1;
  raindrop.style.width = `${size}px`;
  raindrop.style.height = `${size * 10}px`;
  
  // تعيين سرعة عشوائية
  const duration = Math.random() * 5 + 3;
  raindrop.style.animationDuration = `${duration}s`;
  
  // تعيين تأخير عشوائي
  const delay = Math.random() * 5;
  raindrop.style.animationDelay = `${delay}s`;
  
  // إضافة قطرة المطر إلى الحاوية
  container.appendChild(raindrop);
  
  // إزالة قطرة المطر بعد انتهاء الرسوم المتحركة
  setTimeout(function() {
    if (raindrop.parentNode === container) {
      container.removeChild(raindrop);
    }
  }, (duration + delay) * 1000);
}

// Create the rain effect with fewer raindrops
function createRain() {
  const container = document.getElementById('rainContainer') || document.getElementById('purple-rain');
  if (!container) return;
  
  const screenWidth = window.innerWidth;
  
  // Reduce the number of raindrops significantly
  const raindropsCount = Math.floor(screenWidth / 80); // Increased divisor to reduce count
  
  for (let i = 0; i < raindropsCount; i++) {
    const drop = document.createElement('div');
    drop.classList.add('raindrop');
    
    // Randomize drop properties - make them smaller and more transparent
    const size = Math.random() * 1 + 0.3; // Smaller size
    const posX = Math.floor(Math.random() * screenWidth);
    const delay = Math.random() * 15; // More spread out timing
    const duration = Math.random() * 4 + 6; // Slightly slower
    
    drop.style.left = posX + 'px';
    drop.style.width = size + 'px';
    drop.style.height = Math.floor(Math.random() * 20) + 10 + 'px'; // Shorter
    drop.style.animationDelay = delay + 's';
    drop.style.animationDuration = duration + 's';
    drop.style.opacity = Math.random() * 0.2 + 0.05; // More transparent
    
    // Add event listener to reposition or remove the raindrop
    drop.addEventListener('animationiteration', () => {
      // 30% chance to remove this raindrop (keeps total count lower over time)
      if (Math.random() > 0.7) {
        container.removeChild(drop);
        return;
      }
      
      // Otherwise reposition
      drop.style.left = Math.floor(Math.random() * screenWidth) + 'px';
      drop.style.width = (Math.random() * 1 + 0.3) + 'px';
      drop.style.opacity = Math.random() * 0.2 + 0.05;
    });
    
    container.appendChild(drop);
  }
}

// Call the createRain function on page load
document.addEventListener('DOMContentLoaded', createRain);

// Add occasional new drops (much fewer)
setInterval(() => {
  const container = document.getElementById('rainContainer') || document.getElementById('purple-rain');
  if (!container && container.children.length < 20) { // Limit total number
    const screenWidth = window.innerWidth;
    const drop = document.createElement('div');
    drop.classList.add('raindrop');
    
    const size = Math.random() * 1 + 0.3;
    drop.style.left = Math.floor(Math.random() * screenWidth) + 'px';
    drop.style.width = size + 'px';
    drop.style.height = Math.floor(Math.random() * 20) + 10 + 'px';
    drop.style.animationDuration = (Math.random() * 4 + 6) + 's';
    drop.style.opacity = Math.random() * 0.2 + 0.05;
    
    container.appendChild(drop);
  }
}, 5000); // Add a new drop every 5 seconds 