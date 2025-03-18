// متغيرات عامة للعبة
const API_KEY = "AIzaSyCrAicHcB2IUqkMS846--MFJo6u0UqKbII";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
let controller, typingInterval;
const chatHistory = [];

// حالة اللعبة
let gameState = {
    questions: [],
    currentQuestion: 0,
    score: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    hintsUsed: 0,
    // متغيرات خاصة بلعبة الذاكرة
    memoryCards: [],
    flippedCards: [],
    matchedPairs: 0,
    boardSize: 4, // الحجم الافتراضي 4×4
    moves: 0,
    startTime: null,
    endTime: null
};
let currentTopic = "";
let timer = null;
let timerSeconds = 0;
let soundEnabled = true;
let currentGame = "memory"; // نوع اللعبة الحالية: truefalse, quiz, memory, hangman
let isGenerating = false;

// قائمة المواضيع العشوائية
const randomTopics = [
    "الفضاء والكواكب",
    "الحيوانات المفترسة",
    "التاريخ الإسلامي",
    "الرياضيات",
    "جسم الإنسان",
    "الجغرافيا",
    "التكنولوجيا الحديثة",
    "الأدب العربي",
    "العلوم",
    "الرياضة"
];

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    console.log("تم تحميل الصفحة");
    // إضافة مستمعات الأحداث
    setupEventListeners();
    
    // تعيين السمة المظلمة/الفاتحة من التخزين المحلي
    const isLightTheme = localStorage.getItem("themeColor") === "light_mode";
    document.body.classList.toggle("light-theme", isLightTheme);
    
    if (document.querySelector("#theme-toggle-btn")) {
        document.querySelector("#theme-toggle-btn").textContent = isLightTheme ? "dark_mode" : "light_mode";
    }
    
    // عرض قائمة الألعاب
    showGameMenu();
    
    // إضافة نظام الإشعارات
    setupNotificationSystem();
    
    // إضافة زر العودة إلى الصفحة الرئيسية
    addHomeButton();
});

// إضافة زر العودة إلى الصفحة الرئيسية
function addHomeButton() {
    const homeButton = document.createElement('button');
    homeButton.className = 'home-button';
    homeButton.innerHTML = '<span class="material-symbols-rounded">home</span>';
    homeButton.title = 'العودة إلى الصفحة الرئيسية';
    homeButton.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    
    // إضافة CSS للزر
    const style = document.createElement('style');
    style.textContent = `
        .home-button {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background-color: var(--primary-color);
            color: white;
            border: none;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            transition: all 0.3s ease;
        }
        
        .home-button:hover {
            transform: scale(1.1);
            background-color: var(--secondary-color);
        }
        
        .home-button .material-symbols-rounded {
            font-size: 24px;
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(homeButton);
}

// إعداد نظام الإشعارات
function setupNotificationSystem() {
    // إنشاء عنصر الإشعارات
    const notificationContainer = document.createElement('div');
    notificationContainer.className = 'notification-container';
    document.body.appendChild(notificationContainer);
    
    // إضافة CSS للإشعارات
    const style = document.createElement('style');
    style.textContent = `
        .notification-container {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
        }
        
        .notification {
            background-color: var(--card-bg);
            color: var(--text-color);
            border-right: 4px solid var(--primary-color);
            border-radius: var(--border-radius);
            padding: 15px 20px;
            margin-bottom: 10px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            transform: translateX(120%);
            transition: transform 0.3s ease;
            max-width: 350px;
            width: 100%;
        }
        
        .notification.show {
            transform: translateX(0);
        }
        
        .notification.success {
            border-color: var(--correct-color);
        }
        
        .notification.error {
            border-color: var(--wrong-color);
        }
        
        .notification.info {
            border-color: var(--accent-color);
        }
        
        .notification-icon {
            margin-left: 15px;
            font-size: 24px;
        }
        
        .notification.success .notification-icon {
            color: var(--correct-color);
        }
        
        .notification.error .notification-icon {
            color: var(--wrong-color);
        }
        
        .notification.info .notification-icon {
            color: var(--accent-color);
        }
        
        .notification-content {
            flex: 1;
        }
        
        .notification-title {
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .notification-message {
            font-size: 0.9rem;
            opacity: 0.8;
        }
        
        .notification-close {
            background: none;
            border: none;
            color: var(--text-color);
            cursor: pointer;
            font-size: 20px;
            opacity: 0.5;
            transition: opacity 0.2s;
        }
        
        .notification-close:hover {
            opacity: 1;
        }
    `;
    document.head.appendChild(style);
}

// عرض إشعار
function showNotification(title, message, type = 'info', duration = 5000) {
    const notificationContainer = document.querySelector('.notification-container');
    
    // إنشاء عنصر الإشعار
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // تحديد أيقونة الإشعار حسب النوع
    let icon = 'info';
    if (type === 'success') icon = 'check_circle';
    if (type === 'error') icon = 'error';
    
    // إضافة محتوى الإشعار
    notification.innerHTML = `
        <span class="notification-icon material-symbols-rounded">${icon}</span>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close material-symbols-rounded">close</button>
    `;
    
    // إضافة الإشعار إلى الحاوية
    notificationContainer.appendChild(notification);
    
    // إظهار الإشعار بعد إضافته (للحصول على تأثير الانتقال)
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // إضافة مستمع حدث لزر الإغلاق
    notification.querySelector('.notification-close').addEventListener('click', () => {
        closeNotification(notification);
    });
    
    // إغلاق الإشعار تلقائيًا بعد المدة المحددة
    if (duration > 0) {
        setTimeout(() => {
            closeNotification(notification);
        }, duration);
    }
    
    return notification;
}

// إغلاق إشعار
function closeNotification(notification) {
    // إزالة فئة العرض لتشغيل تأثير الانتقال
    notification.classList.remove('show');
    
    // إزالة الإشعار من DOM بعد انتهاء الانتقال
    setTimeout(() => {
        notification.remove();
    }, 300);
}

// إعداد مستمعات الأحداث
function setupEventListeners() {
    // أزرار قائمة الألعاب
    document.addEventListener('click', function(event) {
        const gameButton = event.target.closest('.game-button');
        if (gameButton) {
            const gameType = gameButton.getAttribute('data-game');
            selectGame(gameType);
        }
    });
    
    // زر بدء اللعبة
    document.addEventListener('click', function(event) {
        if (event.target.id === 'start-game-btn') {
            startGameHandler();
        }
    });
    
    // زر العودة
    document.addEventListener('click', function(event) {
        if (event.target.id === 'back-btn') {
            showGameMenu();
        }
    });
    
    // زر الموضوع العشوائي
    document.addEventListener('click', function(event) {
        if (event.target.id === 'random-topic-btn') {
            selectRandomTopic();
        }
    });
    
    // أزرار المواضيع الشائعة
    document.addEventListener('click', function(event) {
        const topicCard = event.target.closest('.topic-card');
        if (topicCard) {
            const topic = topicCard.getAttribute('data-topic');
            const count = parseInt(document.getElementById('questions-count').value);
            startMemoryGame(topic, count);
        }
    });
    
    // زر تبديل السمة
    document.addEventListener('click', function(event) {
        if (event.target.id === 'theme-toggle-btn') {
            toggleTheme();
        }
    });
    
    // زر تبديل الصوت
    document.addEventListener('click', function(event) {
        if (event.target.id === 'toggle-sound-btn') {
            toggleSound();
        }
    });
    
    // زر التلميح
    document.addEventListener('click', function(event) {
        if (event.target.id === 'hint-btn') {
            showMemoryHint();
        }
    });
    
    // زر اللعب مرة أخرى
    document.addEventListener('click', function(event) {
        if (event.target.id === 'play-again-btn') {
            showTopicSelection();
        }
    });
    
    // زر تغيير حجم اللوحة
    document.addEventListener('change', function(event) {
        if (event.target.id === 'board-size') {
            gameState.boardSize = parseInt(event.target.value);
        }
    });
    
    // أزرار اختيار اللعبة
    const gameButtons = document.querySelectorAll('.game-button');
    gameButtons.forEach(button => {
        button.addEventListener('click', () => {
            const gameType = button.getAttribute('data-game');
            if (gameType === 'memory') {
                // توجيه المستخدم مباشرة إلى صفحة لعبة الذاكرة
                window.location.href = 'games/memory.html';
            } else {
                // عرض شاشة اختيار الموضوع للألعاب الأخرى
                currentGame = gameType;
                showTopicSelection();
                updateTopicSelectionTitle();
            }
        });
    });
}

// تبديل السمة (مظلمة/فاتحة)
function toggleTheme() {
    const isLightTheme = document.body.classList.toggle('light-theme');
    localStorage.setItem('themeColor', isLightTheme ? 'light_mode' : 'dark_mode');
    
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
        themeToggleBtn.textContent = isLightTheme ? 'dark_mode' : 'light_mode';
    }
    
    showNotification(
        isLightTheme ? 'تم تفعيل الوضع الفاتح' : 'تم تفعيل الوضع المظلم',
        'تم تغيير مظهر التطبيق بنجاح',
        'success'
    );
}

// تبديل الصوت
function toggleSound() {
    soundEnabled = !soundEnabled;
    const soundBtn = document.getElementById('toggle-sound-btn');
    if (soundBtn) {
        soundBtn.textContent = soundEnabled ? 'volume_up' : 'volume_off';
    }
    
    showNotification(
        soundEnabled ? 'تم تفعيل الصوت' : 'تم إيقاف الصوت',
        soundEnabled ? 'ستسمع الآن أصوات اللعبة' : 'تم كتم أصوات اللعبة',
        'info'
    );
}

// اختيار موضوع عشوائي
function selectRandomTopic() {
    const randomIndex = Math.floor(Math.random() * randomTopics.length);
    const randomTopic = randomTopics[randomIndex];
    document.getElementById('topic-input').value = randomTopic;
    
    showNotification(
        'تم اختيار موضوع عشوائي',
        `تم اختيار "${randomTopic}" كموضوع للعبة`,
        'info'
    );
}

// عرض قائمة الألعاب
function showGameMenu() {
    console.log("عرض قائمة الألعاب");
    document.getElementById('game-menu').classList.remove('hidden');
    document.getElementById('topic-selection').classList.add('hidden');
    document.getElementById('memory-area').classList.add('hidden');
    document.getElementById('results').classList.add('hidden');
    document.getElementById('loading').classList.add('hidden');
    
    // إيقاف المؤقت إذا كان يعمل
    clearInterval(timer);
}

// عرض صفحة اختيار الموضوع
function showTopicSelection() {
    document.getElementById('game-menu').classList.add('hidden');
    document.getElementById('topic-selection').classList.remove('hidden');
    document.getElementById('memory-area').classList.add('hidden');
    document.getElementById('results').classList.add('hidden');
}

// اختيار نوع اللعبة
function selectGame(gameType) {
    console.log("تم اختيار نوع اللعبة:", gameType);
    currentGame = gameType;
    
    // تحديث واجهة اختيار الموضوع
    const titleElement = document.querySelector('#topic-selection h2');
    if (titleElement) {
        titleElement.textContent = 'اختر موضوعاً للعبة الذاكرة';
    }
    
    // إضافة خيارات حجم اللوحة لصفحة اختيار الموضوع
    const optionsContainer = document.querySelector('#topic-selection .options-container');
    if (optionsContainer) {
        // إضافة اختيار حجم اللوحة
        const sizeSelector = document.createElement('div');
        sizeSelector.className = 'option-group';
        sizeSelector.innerHTML = `
            <label for="board-size">حجم اللوحة:</label>
            <select id="board-size" class="option-select">
                <option value="4">4×4 (16 بطاقة)</option>
                <option value="5">5×5 (25 بطاقة)</option>
                <option value="6">6×6 (36 بطاقة)</option>
                <option value="7">7×7 (49 بطاقة)</option>
                <option value="8">8×8 (64 بطاقة)</option>
            </select>
        `;
        optionsContainer.appendChild(sizeSelector);
    }
    
    showTopicSelection();
}

// معالج بدء اللعبة
function startGameHandler() {
    const topicInput = document.getElementById('topic-input');
    const topic = topicInput.value.trim();
    
    if (!topic) {
        showNotification('خطأ', 'الرجاء إدخال موضوع للعبة', 'error');
        return;
    }
    
    const boardSize = parseInt(document.getElementById('board-size').value);
    const pairsCount = Math.floor((boardSize * boardSize) / 2);
    
    startMemoryGame(topic, pairsCount);
}

// بدء لعبة الذاكرة
async function startMemoryGame(topic, pairsCount) {
    console.log("بدء لعبة الذاكرة:", topic, pairsCount);
    currentTopic = topic;
    
    // إعادة تعيين حالة اللعبة
    gameState = {
        memoryCards: [],
        flippedCards: [],
        matchedPairs: 0,
        boardSize: parseInt(document.getElementById('board-size').value) || 4,
        moves: 0,
        startTime: null,
        endTime: null
    };
    
    // إظهار شاشة التحميل
    document.getElementById('topic-selection').classList.add('hidden');
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('loading-text').textContent = `جاري توليد بطاقات عن ${topic}...`;
    
    try {
        // توليد بطاقات الذاكرة
        const pairs = await generateMemoryPairs(topic, pairsCount);
        
        if (pairs.length === 0) {
            throw new Error("فشل في توليد بطاقات الذاكرة");
        }
        
        // إنشاء مصفوفة البطاقات (كل زوج من البطاقات)
        const allCards = [];
        pairs.forEach(pair => {
            allCards.push({ text: pair.term, type: 'term', pairId: allCards.length / 2 });
            allCards.push({ text: pair.definition, type: 'definition', pairId: allCards.length / 2 });
        });
        
        // خلط البطاقات
        gameState.memoryCards = shuffleArray(allCards);
        
        // إخفاء شاشة التحميل وإظهار منطقة اللعبة
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('memory-area').classList.remove('hidden');
        
        // تحديث عنوان اللعبة
        document.getElementById('memory-title').textContent = `لعبة الذاكرة - ${topic}`;
        
        // إنشاء لوحة البطاقات
        createMemoryBoard();
        
        // بدء المؤقت
        startTimer();
        gameState.startTime = new Date();
        
        // تشغيل صوت بدء اللعبة
        playSound('start');
        
        // عرض إشعار نجاح
        showNotification(
            'تم بدء اللعبة بنجاح',
            `تم توليد ${pairsCount} أزواج من البطاقات عن ${topic}`,
            'success'
        );
        
    } catch (error) {
        console.error("خطأ في توليد بطاقات الذاكرة:", error);
        
        // عرض إشعار خطأ
        showNotification(
            'حدث خطأ',
            'فشل في توليد بطاقات الذاكرة. الرجاء المحاولة مرة أخرى.',
            'error'
        );
        
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('topic-selection').classList.remove('hidden');
    }
}

// إنشاء لوحة بطاقات الذاكرة
function createMemoryBoard() {
    const memoryBoard = document.getElementById('memory-board');
    memoryBoard.innerHTML = '';
    
    // تحديد عدد الصفوف والأعمدة
    const boardSize = gameState.boardSize;
    
    // تعيين نمط CSS للشبكة
    memoryBoard.style.gridTemplateColumns = `repeat(${boardSize}, 1fr)`;
    
    // إنشاء البطاقات
    gameState.memoryCards.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'memory-card';
        cardElement.dataset.index = index;
        
        // إنشاء وجهي البطاقة (الأمامي والخلفي)
        cardElement.innerHTML = `
            <div class="card-inner">
                <div class="card-front">
                    <span class="material-symbols-rounded">question_mark</span>
                </div>
                <div class="card-back">
                    <span class="card-text">${card.text}</span>
                </div>
            </div>
        `;
        
        // إضافة مستمع حدث للنقر
        cardElement.addEventListener('click', () => flipCard(index));
        
        // إضافة البطاقة إلى اللوحة
        memoryBoard.appendChild(cardElement);
    });
    
    // تحديث عداد الحركات
    updateMovesCounter();
}

// قلب بطاقة
function flipCard(index) {
    // التحقق من صحة النقر
    if (
        gameState.flippedCards.length >= 2 || // إذا كان هناك بطاقتان مقلوبتان بالفعل
        gameState.flippedCards.includes(index) || // إذا كانت البطاقة مقلوبة بالفعل
        isCardMatched(index) // إذا كانت البطاقة متطابقة بالفعل
    ) {
        return;
    }
    
    // قلب البطاقة
    const cardElement = document.querySelector(`.memory-card[data-index="${index}"]`);
    cardElement.classList.add('flipped');
    
    // إضافة البطاقة إلى قائمة البطاقات المقلوبة
    gameState.flippedCards.push(index);
    
    // تشغيل صوت قلب البطاقة
    playSound('flip');
    
    // التحقق من التطابق إذا تم قلب بطاقتين
    if (gameState.flippedCards.length === 2) {
        gameState.moves++;
        updateMovesCounter();
        
        setTimeout(checkForMatch, 1000);
    }
}

// التحقق من تطابق البطاقات
function checkForMatch() {
    const [firstIndex, secondIndex] = gameState.flippedCards;
    const firstCard = gameState.memoryCards[firstIndex];
    const secondCard = gameState.memoryCards[secondIndex];
    
    if (firstCard.pairId === secondCard.pairId) {
        // البطاقات متطابقة
        const firstCardElement = document.querySelector(`.memory-card[data-index="${firstIndex}"]`);
        const secondCardElement = document.querySelector(`.memory-card[data-index="${secondIndex}"]`);
        
        firstCardElement.classList.add('matched');
        secondCardElement.classList.add('matched');
        
        gameState.matchedPairs++;
        
        // تشغيل صوت التطابق
        playSound('match');
        
        // التحقق من انتهاء اللعبة
        if (gameState.matchedPairs === gameState.memoryCards.length / 2) {
            gameState.endTime = new Date();
            endMemoryGame();
        }
    } else {
        // البطاقات غير متطابقة
        const firstCardElement = document.querySelector(`.memory-card[data-index="${firstIndex}"]`);
        const secondCardElement = document.querySelector(`.memory-card[data-index="${secondIndex}"]`);
        
        firstCardElement.classList.remove('flipped');
        secondCardElement.classList.remove('flipped');
        
        // تشغيل صوت عدم التطابق
        playSound('wrong');
    }
    
    // إعادة تعيين البطاقات المقلوبة
    gameState.flippedCards = [];
}

// التحقق مما إذا كانت البطاقة متطابقة
function isCardMatched(index) {
    return document.querySelector(`.memory-card[data-index="${index}"]`).classList.contains('matched');
}

// تحديث عداد الحركات
function updateMovesCounter() {
    const movesCounter = document.getElementById('memory-moves');
    if (movesCounter) {
        movesCounter.textContent = gameState.moves;
    }
}

// إنهاء لعبة الذاكرة
function endMemoryGame() {
    // إيقاف المؤقت
    clearInterval(timer);
    
    // حساب الوقت المستغرق
    const timeElapsed = Math.floor((gameState.endTime - gameState.startTime) / 1000);
    const minutes = Math.floor(timeElapsed / 60);
    const seconds = timeElapsed % 60;
    
    // عرض النتائج
    const resultsElement = document.getElementById('results');
    const resultsTitle = document.getElementById('results-title');
    const resultsDetails = document.getElementById('results-details');
    
    resultsTitle.textContent = 'مبروك! لقد أكملت لعبة الذاكرة';
    resultsDetails.innerHTML = `
        <p>الموضوع: <strong>${currentTopic}</strong></p>
        <p>عدد الحركات: <strong>${gameState.moves}</strong></p>
        <p>الوقت المستغرق: <strong>${minutes} دقيقة و ${seconds} ثانية</strong></p>
    `;
    
    // إظهار النتائج
    document.getElementById('memory-area').classList.add('hidden');
    resultsElement.classList.remove('hidden');
    
    // تشغيل صوت الانتهاء
    playSound('complete');
    
    // عرض إشعار
    showNotification(
        'مبروك!',
        'لقد أكملت لعبة الذاكرة بنجاح',
        'success'
    );
}

// عرض تلميح للعبة الذاكرة
function showMemoryHint() {
    // اختيار بطاقة عشوائية غير مطابقة
    const unmatched = gameState.memoryCards
        .map((card, index) => ({ card, index }))
        .filter(item => !isCardMatched(item.index) && !gameState.flippedCards.includes(item.index));
    
    if (unmatched.length > 0) {
        // اختيار بطاقة عشوائية
        const randomCard = unmatched[Math.floor(Math.random() * unmatched.length)];
        const cardElement = document.querySelector(`.memory-card[data-index="${randomCard.index}"]`);
        
        // إظهار البطاقة مؤقتًا
        cardElement.classList.add('hint');
        
        setTimeout(() => {
            cardElement.classList.remove('hint');
        }, 1000);
        
        // زيادة عداد التلميحات
        gameState.hintsUsed++;
        
        // عرض إشعار
        showNotification(
            'تلميح',
            'تم كشف بطاقة عشوائية لمدة ثانية واحدة',
            'info'
        );
    } else {
        showNotification(
            'تلميح',
            'لا توجد بطاقات متبقية للكشف',
            'info'
        );
    }
}

// توليد أزواج بطاقات الذاكرة
async function generateMemoryPairs(topic, count) {
    try {
        // إنشاء نص الطلب
        const prompt = `
        أنشئ ${count} أزواج من البطاقات للعبة الذاكرة عن موضوع "${topic}" باللغة العربية.
        كل زوج يتكون من مصطلح وتعريفه أو سؤال وجوابه.
        قدم الإجابة على شكل مصفوفة JSON بالتنسيق التالي:
        [
          {
            "term": "المصطلح",
            "definition": "التعريف"
          }
        ]
        قدم فقط مصفوفة JSON بدون أي نص إضافي.`;
        
        // إرسال الطلب إلى API
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
            signal: controller.signal
        });
        
        if (!response.ok) {
            throw new Error(`فشل الطلب: ${response.status}`);
        }
        
        const data = await response.json();
        const responseText = data.candidates[0].content.parts[0].text;
        
        // استخراج مصفوفة JSON من النص
        const jsonMatch = responseText.match(/\[\s*\{.*\}\s*\]/s);
        if (!jsonMatch) {
            throw new Error("لم يتم العثور على بيانات JSON صالحة في الاستجابة");
        }
        
        const jsonStr = jsonMatch[0];
        const pairs = JSON.parse(jsonStr);
        
        // التحقق من صحة البيانات
        if (!Array.isArray(pairs) || pairs.length === 0) {
            throw new Error("لم يتم استلام أزواج صالحة");
        }
        
        return pairs;
    } catch (error) {
        console.error("خطأ في توليد أزواج الذاكرة:", error);
        
        // إنشاء أزواج افتراضية في حالة الفشل
        return generateDefaultMemoryPairs(topic, count);
    }
}

// توليد أزواج افتراضية في حالة فشل API
function generateDefaultMemoryPairs(topic, count) {
    const pairs = [];
    
    // أزواج افتراضية حسب الموضوع
    if (topic.includes("رياضيات") || topic.includes("حساب")) {
        pairs.push(
            { term: "2 + 2", definition: "4" },
            { term: "5 × 6", definition: "30" },
            { term: "9 ÷ 3", definition: "3" },
            { term: "7 + 8", definition: "15" },
            { term: "12 - 5", definition: "7" }
        );
    } else {
        // أزواج افتراضية لأي موضوع آخر
        for (let i = 1; i <= count; i++) {
            pairs.push({
                term: `مصطلح ${i} عن ${topic}`,
                definition: `تعريف المصطلح ${i} عن ${topic}`
            });
        }
    }
    
    // التأكد من أن عدد الأزواج يساوي العدد المطلوب
    while (pairs.length > count) {
        pairs.pop();
    }
    
    while (pairs.length < count) {
        const index = pairs.length + 1;
        pairs.push({
            term: `مصطلح ${index} عن ${topic}`,
            definition: `تعريف المصطلح ${index} عن ${topic}`
        });
    }
    
    return pairs;
} 