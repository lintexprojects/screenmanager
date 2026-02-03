// ==============================================
// Скринменеджер ЛИнТех 28
// Автор: Лев П.
// "Идея приведена в код Львом П. лИнТех 28 2026"
// ==============================================

// Конфигурация системы
const CONFIG = {
    PIN_CODE: "2855",
    AUTO_REFRESH_INTERVAL: 90000, // 1.5 минуты
    IMAGE_PATH: "images/",
    SPECIAL_IMAGES: {
        EMPTY: "empty.png",
        READYTO: "readyto.png",
        TOSLEEP: "tosleep.png",
        MISSING: "missing.png"
    },
    PERIODS: {
        NIGHT: { start: 19, end: 7 }, // 19:00-07:00
        MORNING: { start: 7, end: 7.167 }, // 7:00-7:10
        DAY: { start: 7.167, end: 17 }, // 7:10-17:00
        EVENING: { start: 17, end: 19 } // 17:00-19:00
    },
    VERSION: "2.0.0"
};

// Глобальные переменные
let currentPin = "";
let isAdminMenuOpen = false;
let isAutoRefreshEnabled = true;
let autoRefreshInterval;
let simulatedTime = null;
let currentImageOverride = null;
let screenResolution = { width: 0, height: 0 };

// Инициализация системы
document.addEventListener('DOMContentLoaded', function() {
    initSystem();
});

// Основная функция инициализации
function initSystem() {
    console.log(`🚀 Скринменеджер ЛИнТех 28 v${CONFIG.VERSION} запущен`);
    
    // Инициализация компонентов
    initPinInput();
    initScreenResolution();
    updateScreenResolution();
    updateSlideshow();
    startAutoRefresh();
    setupKeyboardShortcuts();
    updatePeriodIndicator();
    
    // Адаптация к изменению размера окна
    window.addEventListener('resize', handleResize);
    
    // Периодическая проверка обновлений
    setInterval(checkForUpdates, 300000); // Каждые 5 минут
}

// Инициализация разрешения экрана
function initScreenResolution() {
    screenResolution = {
        width: window.innerWidth,
        height: window.innerHeight
    };
    updateResolutionDisplay();
}

// Обновление отображения разрешения
function updateResolutionDisplay() {
    const resolutionElement = document.getElementById('resolutionStatus');
    if (resolutionElement) {
        resolutionElement.textContent = `${screenResolution.width}×${screenResolution.height}`;
    }
}

// Обработка изменения размера окна
function handleResize() {
    screenResolution = {
        width: window.innerWidth,
        height: window.innerHeight
    };
    updateResolutionDisplay();
    
    // Перерисовка изображения для нового размера
    const imgElement = document.getElementById('screenImage');
    if (imgElement.src) {
        const tempSrc = imgElement.src;
        imgElement.src = '';
        setTimeout(() => {
            imgElement.src = tempSrc + '&resize=' + Date.now();
        }, 100);
    }
}

// Обновление разрешения экрана
function updateScreenResolution() {
    screenResolution = {
        width: window.innerWidth || document.documentElement.clientWidth,
        height: window.innerHeight || document.documentElement.clientHeight
    };
}

// Настройка горячих клавиш
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Кнопка 1 для открытия меню
        if (e.key === '1' && !e.ctrlKey && !e.altKey) {
            toggleAdminMenu();
            e.preventDefault();
        }
        
        // ESC для закрытия
        if (e.key === 'Escape') {
            if (isAdminMenuOpen) {
                hideAdminMenu();
            }
            if (document.getElementById('creditsModal').classList.contains('hidden')) {
                hideCredits();
            }
        }
        
        // F11 для полноэкранного режима
        if (e.key === 'F11') {
            e.preventDefault();
            toggleFullscreen();
        }
        
        // Ctrl+R для обновления (с подтверждением)
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            if (confirm('Обновить страницу?')) {
                refreshPage();
            }
        }
    });
}

// Переключение полноэкранного режима
function toggleFullscreen() {
if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log('Ошибка полноэкранного режима:', err);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

// Получение текущего периода
function getCurrentPeriod() {
    const now = simulatedTime ? new Date(simulatedTime) : new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const decimalTime = hours + minutes / 60;
    
    // Ночной период (19:00-07:00)
    if (decimalTime >= CONFIG.PERIODS.NIGHT.start || decimalTime < CONFIG.PERIODS.NIGHT.end) {
        return 'NIGHT';
    }
    // Утренний период (7:00-7:10)
    else if (decimalTime >= CONFIG.PERIODS.MORNING.start && decimalTime < CONFIG.PERIODS.MORNING.end) {
        return 'MORNING';
    }
    // Вечерний период (17:00-19:00)
    else if (decimalTime >= CONFIG.PERIODS.EVENING.start && decimalTime < CONFIG.PERIODS.EVENING.end) {
        return 'EVENING';
    }
    // Дневной период (7:10-17:00)
    else {
        return 'DAY';
    }
}

// Получение имени файла для текущего периода
function getImageFilenameForPeriod() {
    const period = getCurrentPeriod();
    
    switch(period) {
        case 'NIGHT':
            return CONFIG.SPECIAL_IMAGES.EMPTY;
        case 'MORNING':
            return CONFIG.SPECIAL_IMAGES.READYTO;
        case 'EVENING':
            return CONFIG.SPECIAL_IMAGES.TOSLEEP;
        case 'DAY':
            // В дневной период показываем заставки 01-20
            const now = simulatedTime ? new Date(simulatedTime) : new Date();
            const dayOfMonth = now.getDate();
            const slideNumber = ((dayOfMonth - 1) % 20) + 1;
            return `${String(slideNumber).padStart(2, '0')}.png`;
        default:
            return CONFIG.SPECIAL_IMAGES.MISSING;
    }
}

// Обновление индикатора периода
function updatePeriodIndicator() {
    const period = getCurrentPeriod();
    const indicator = document.getElementById('periodIndicator');
    const titleElement = document.getElementById('periodTitle');
    
    const periodConfig = {
        'NIGHT': { text: '🌙 Ночной режим', color: '#9C27B0' },
        'MORNING': { text: '🌅 Подготовка', color: '#FF9800' },
        'DAY': { text: '☀️ Рабочий день', color: '#4CAF50' },
        'EVENING': { text: '🌆 Вечерний режим', color: '#2196F3' },
        'ERROR': { text: '⚠️ Ошибка', color: '#F44336' }
    };
    
    const config = periodConfig[period] || periodConfig.ERROR;
    
    if (indicator) {
        indicator.textContent = config.text;
        indicator.className = 'period-indicator';
        indicator.classList.add(`period-${period.toLowerCase()}`);
    }
    
    if (titleElement) {
        titleElement.textContent = config.text;
        titleElement.style.color = config.color;
    }
}

// Обновление заставки с оптимизацией для любых разрешений
async function updateSlideshow() {
    let filename;
    
    // Если есть ручное переопределение
    if (currentImageOverride) {
        filename = currentImageOverride;
    } else {
        // Определяем файл по периоду
        filename = getImageFilenameForPeriod();
    }
    
    // Генерация URL с кешированием и параметрами для разрешения
    const cacheBuster = Math.floor(Date.now() / CONFIG.AUTO_REFRESH_INTERVAL);
    const imgUrl = `${CONFIG.IMAGE_PATH}${filename}?t=${cacheBuster}&w=${screenResolution.width}&h=${screenResolution.height}`;
    const imgElement = document.getElementById('screenImage');
    
    try {
        // Плавное исчезновение текущего изображения
        imgElement.style.opacity = '0';
        
        // Создаем временный объект Image для предзагрузки
        const tempImage = new Image();
        
        tempImage.onload = () => {
            // При успешной загрузке - устанавливаем изображение
            setTimeout(() => {
                imgElement.src = imgUrl;
imgElement.style.opacity = '1';
                updateInfoPanel(filename);
                updatePeriodIndicator();
                console.log(`✅ Заставка обновлена: ${filename}`);
            }, 300);
        };
        
        tempImage.onerror = () => {
            // При ошибке - показываем fallback-изображение
            showMissingImage();
        };
        
        // Начинаем загрузку
        tempImage.src = imgUrl;
        
        // Таймаут на случай зависания загрузки
        setTimeout(() => {
            if (!tempImage.complete) {
                showMissingImage();
            }
        }, 5000);
        
    } catch (error) {
        console.error('❌ Ошибка при обновлении заставки:', error);
        showMissingImage();
    }
}

// Показать изображение для ошибок
function showMissingImage() {
    const imgElement = document.getElementById('screenImage');
    const missingUrl = `${CONFIG.IMAGE_PATH}${CONFIG.SPECIAL_IMAGES.MISSING}?t=${Date.now()}`;
    
    imgElement.style.opacity = '0';
    setTimeout(() => {
        imgElement.src = missingUrl;
        imgElement.style.opacity = '1';
        updateInfoPanel('missing.png');
        
        // Обновляем индикатор периода
        const indicator = document.getElementById('periodIndicator');
        if (indicator) {
            indicator.textContent = '⚠️ Ошибка загрузки';
            indicator.className = 'period-indicator period-error';
        }
        
        console.warn('⚠️ Загружено запасное изображение');
    }, 300);
}

// Обновление информационной панели
function updateInfoPanel(filename) {
    const now = simulatedTime ? new Date(simulatedTime) : new Date();
    const period = getCurrentPeriod();
    
    // Обновление заголовка периода
    const periodTitles = {
        'NIGHT': '🌙 Ночной режим',
        'MORNING': '🌅 Подготовка к занятиям',
        'DAY': '☀️ Рабочий день',
        'EVENING': '🌆 Вечерний режим'
    };
    
    const dateTimeElement = document.getElementById('dateTime');
    const fileInfoElement = document.getElementById('fileInfo');
    
    if (dateTimeElement) {
        dateTimeElement.innerHTML = `
            📅 ${now.toLocaleDateString('ru-RU', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })}
            &nbsp;|&nbsp;
            🕐 ${now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
        `;
    }
    
    if (fileInfoElement) {
        let infoText = `📄 ${filename}`;
        if (simulatedTime) infoText += ' | ⏱️ Симулированное время';
        if (currentImageOverride) infoText += ' | ✋ Ручной режим';
        infoText += ` | 🖥️ ${screenResolution.width}×${screenResolution.height}`;
        
        fileInfoElement.textContent = infoText;
    }
}

// Автообновление системы
function startAutoRefresh() {
    // Очистка предыдущего интервала
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
    
    // Установка нового интервала
    autoRefreshInterval = setInterval(() => {
        if (isAutoRefreshEnabled) {
            updateSlideshow();
            updateStatusDisplay();
        }
    }, CONFIG.AUTO_REFRESH_INTERVAL);
    
    // Обновление времени каждую минуту
    setInterval(() => {
        if (!simulatedTime) {
            updateInfoPanel(getImageFilenameForPeriod());
            updatePeriodIndicator();
        }
    }, 60000);
    
    // Обновление статуса каждые 10 секунд
    setInterval(() => {
        updateStatusDisplay();
    }, 10000);
    
    console.log('🔄 Автообновление запущено');
}

// ==============================================
// ФУНКЦИИ АДМИНИСТРАТОРА
// ==============================================

function initPinInput() {
    const inputs = document.querySelectorAll('.pin-input input');
    
    inputs.forEach((input, index) => {
        // Обработка ввода
        input.addEventListener('input', (e) => {
if (e.target.value.length === 1) {
                currentPin += e.target.value;
                if (index < 3) {
                    inputs[index + 1].focus();
                } else {
                    checkPin();
                }
            }
        });
        
        // Обработка Backspace
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                inputs[index - 1].focus();
                currentPin = currentPin.slice(0, -1);
            }
        });
        
        // Запрет ввода не-цифр
        input.addEventListener('keypress', (e) => {
            if (!/[0-9]/.test(e.key)) {
                e.preventDefault();
            }
        });
    });
    
    // Автофокус на первом поле
    if (inputs[0]) {
        inputs[0].focus();
    }
}

function checkPin() {
    if (currentPin === CONFIG.PIN_CODE) {
        // Успешный ввод PIN
        document.getElementById('pinSection').classList.add('hidden');
        document.getElementById('mainMenu').classList.remove('hidden');
        document.getElementById('pinError').classList.add('hidden');
        updateStatusDisplay();
        console.log('🔓 Админ-панель разблокирована');
    } else {
        // Неверный PIN
        document.getElementById('pinError').classList.remove('hidden');
        setTimeout(() => {
            resetPinInput();
        }, 1000);
        console.warn('⚠️ Неверная попытка ввода PIN');
    }
}

function resetPinInput() {
    currentPin = "";
    const inputs = document.querySelectorAll('.pin-input input');
    inputs.forEach(input => {
        input.value = "";
    });
    if (inputs[0]) {
        inputs[0].focus();
    }
}

function toggleAdminMenu() {
    const menu = document.getElementById('adminMenu');
    isAdminMenuOpen = !isAdminMenuOpen;
    
    if (isAdminMenuOpen) {
        menu.style.display = 'block';
        resetPinInput();
        document.getElementById('pinSection').classList.remove('hidden');
        document.getElementById('mainMenu').classList.add('hidden');
        updateStatusDisplay();
        console.log('📱 Админ-меню открыто');
    } else {
        hideAdminMenu();
    }
}

function hideAdminMenu() {
    document.getElementById('adminMenu').style.display = 'none';
    isAdminMenuOpen = false;
    console.log('📱 Админ-меню закрыто');
}

function simulateTime() {
    const timeInput = document.getElementById('simulatedTime').value;
    
    if (timeInput) {
        simulatedTime = timeInput;
        updateSlideshow();
        updateStatusDisplay();
        console.log(`⏰ Время симулировано: ${new Date(simulatedTime).toLocaleString('ru-RU')}`);
    } else {
        simulatedTime = null;
        updateSlideshow();
        updateStatusDisplay();
        console.log('⏰ Возврат к реальному времени');
    }
}

function changeSlideManual() {
    const select = document.getElementById('slideSelect');
    
    if (select.value === 'auto') {
        currentImageOverride = null;
        console.log('🔄 Возврат к автоматическому режиму');
    } else if (['empty', 'readyto', 'tosleep'].includes(select.value)) {
        currentImageOverride = CONFIG.SPECIAL_IMAGES[select.value.toUpperCase()];
        console.log(`🖼️ Установлена спец-заставка: ${currentImageOverride}`);
    } else {
        currentImageOverride = `${select.value.padStart(2, '0')}.png`;
        console.log(`🖼️ Установлена заставка: ${currentImageOverride}`);
    }
    
    updateSlideshow();
    updateStatusDisplay();
}

function refreshPage() {
    console.log('🔄 Обновление страницы...');
    location.reload();
}

function forceRefresh() {
    console.log('⚡ Принудительное обновление заставки');
    updateSlideshow();
}

function toggleAutoRefresh() {
    isAutoRefreshEnabled = !isAutoRefreshEnabled;
    const btn = document.getElementById('toggleRefreshBtn');
    const status = document.getElementById('refreshStatus');
    
    if (isAutoRefreshEnabled) {
btn.innerHTML = '⏸️ Приостановить автообновление';
        status.innerHTML = '🔄 90с';
        startAutoRefresh();
        console.log('▶️ Автообновление включено');
    } else {
        btn.innerHTML = '▶️ Возобновить автообновление';
        status.innerHTML = '⏸️ Пауза';
        if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval);
            autoRefreshInterval = null;
        }
        console.log('⏸️ Автообновление приостановлено');
    }
    
    updateStatusDisplay();
}

function updateStatusDisplay() {
    const statusElement = document.getElementById('currentStatus');
    const periodElement = document.getElementById('periodStatus');
    
    if (!statusElement || !periodElement) return;
    
    const period = getCurrentPeriod();
    const periodNames = {
        'NIGHT': 'Ночной',
        'MORNING': 'Утренний',
        'DAY': 'Дневной',
        'EVENING': 'Вечерний'
    };
    
    let statusText = `Автообновление: ${isAutoRefreshEnabled ? '✅ ВКЛ' : '❌ ВЫКЛ'}`;
    
    if (simulatedTime) {
        statusText += ` | ⏱️ Симиляция`;
    }
    
    if (currentImageOverride) {
        statusText += ` | ✋ Ручной`;
    }
    
    statusElement.textContent = statusText;
    periodElement.textContent = periodNames[period] || 'Неизвестно';
}

function showCredits() {
    console.log('ℹ️ Показ кредитов');
    hideAdminMenu();
    document.getElementById('creditsModal').classList.remove('hidden');
}

function hideCredits() {
    document.getElementById('creditsModal').classList.add('hidden');
}

// Проверка обновлений
function checkForUpdates() {
    console.log('🔍 Проверка обновлений...');
    // Здесь можно добавить логику проверки новых версий
}

// Функция для принудительного обновления с сервера
function forceUpdateFromServer() {
    console.log('🔄 Принудительная проверка обновлений с сервера');
    updateSlideshow();
}

// Логирование состояния системы
function logSystemStatus() {
    console.log('=== СТАТУС СИСТЕМЫ ===');
    console.log('Версия:', CONFIG.VERSION);
    console.log('Разрешение:', screenResolution.width, '×', screenResolution.height);
    console.log('Автообновление:', isAutoRefreshEnabled ? 'ВКЛ' : 'ВЫКЛ');
    console.log('Режим:', simulatedTime ? 'Симуляция' : 'Реальное время');
    console.log('Текущий период:', getCurrentPeriod());
    console.log('Текущий файл:', getImageFilenameForPeriod());
    console.log('====================');
}

// Инициализация при загрузке страницы
window.onload = function() {
    // Логирование запуска
    console.log('🚀 Инициализация Скринменеджера ЛИнТех 28...');
    
    // Первоначальная загрузка
    updateSlideshow();
    
    // Логирование статуса через 5 секунд
    setTimeout(logSystemStatus, 5000);
    
    // Показать подсказку о горячих клавишах
    console.log('💡 Подсказка: Нажмите "1" для открытия админ-панели');
};

// Глобальный обработчик ошибок
window.onerror = function(message, source, lineno, colno, error) {
    console.error('❌ Глобальная ошибка:', message);
    console.error('Файл:', source);
    console.error('Строка:', lineno);
    return true; // Предотвращаем стандартное сообщение об ошибке
};

// Экспорт функций для глобального доступа (если нужно)
window.ScreenManager = {
    version: CONFIG.VERSION,
    update: updateSlideshow,
    openAdmin: toggleAdminMenu,
    showCredits: showCredits,
    forceRefresh: forceUpdateFromServer,
    getStatus: logSystemStatus
};

// Сообщение об успешной загрузке
console.log('✅ Скринменеджер ЛИнТех 28 успешно загружен!');
console.log('📌 Версия:', CONFIG.VERSION);
console.log('📌 Автор: Лев П., лИнТех 28, 2026');
