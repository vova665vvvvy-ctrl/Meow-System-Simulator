let activeWin = null;
let highestZ = 10;
let offsetX = 0;
let offsetY = 0;
let folderCount = 0;
let fileCount = 0;

// ИМИТАЦИЯ СИСТЕМНЫХ ЗВУКОВ
function playBeep(type) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        
        if (type === 'boot') {
            osc.frequency.setValueAtTime(250, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            osc.start(); osc.stop(ctx.currentTime + 0.3);
        } else if (type === 'click') {
            osc.frequency.setValueAtTime(700, ctx.currentTime);
            gain.gain.setValueAtTime(0.03, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);
            osc.start(); osc.stop(ctx.currentTime + 0.04);
        } else if (type === 'error') {
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, ctx.currentTime);
            gain.gain.setValueAtTime(0.15, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
            osc.start(); osc.stop(ctx.currentTime + 0.2);
        } else if (type === 'notify') { // Нежный двухтональный звук всплывающего уведомления
            osc.frequency.setValueAtTime(440, ctx.currentTime);
            osc.frequency.setValueAtTime(554, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
            osc.start(); osc.stop(ctx.currentTime + 0.25);
        }
    } catch(e) { console.log("Аудио заблокировано"); }
}

// СИСТЕМА ЗАГРУЗКИ И ПЕРЕКЛЮЧЕНИЯ ЭКРАНОВ
window.addEventListener('DOMContentLoaded', () => {
    // 1. Показываем загрузку, затем плавно переходим к Выбору пользователя
    setTimeout(() => {
        document.getElementById('boot-screen').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('boot-screen').style.display = 'none';
            document.getElementById('user-screen').style.display = 'flex';
            playBeep('boot');
        }, 500);
    }, 2000);

    // Обработка глобальных кликов
    document.addEventListener('click', (e) => {
        if(e.target.tagName === 'BUTTON' || e.target.classList.contains('shortcut') || e.target.classList.contains('wp-option') || e.target.classList.contains('user-card')) {
            playBeep('click');
        }
        if (!e.target.classList.contains('start-btn')) {
            document.getElementById('start-menu').style.display = 'none';
        }
        document.getElementById('context-menu').style.display = 'none';
    });
});

// ЛОГИКА ВХОДА ПОЛЬЗОВАТЕЛЯ
function loginUser(username, defaultBg) {
    document.getElementById('user-screen').style.display = 'none';
    document.getElementById('current-user-label').innerText = `👤 ${username}`;
    changeWallpaper(defaultBg);
    
    // Всплывающее уведомление о входе
    setTimeout(() => {
        showNotification('Центр уведомлений', `Вы вошли как ${username}. Добро пожаловать в WebOS!`);
    }, 800);
}

// ВЫХОД ИЗ СИСТЕМЫ (Смена пользователя)
function logoutSystem() {
    document.getElementById('start-menu').style.display = 'none';
    document.getElementById('user-screen').style.display = 'flex';
}

// ДВИЖОК СИСТЕМНЫХ УВЕДОМЛЕНИЙ (TOASTS)
function showNotification(title, message) {
    playBeep('notify');
    const area = document.getElementById('notification-area');
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <div class="toast-header">
            <span>${title}</span>
            <span style="cursor:pointer;" onclick="this.parentElement.parentElement.remove()">×</span>
        </div>
        <div class="toast-body">${message}</div>
    `;
    
    area.appendChild(toast);
    
    // Автоматическое удаление уведомления через 5 секунд
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}

// ОКНА: ОТКРЫТЬ / ЗАКРЫТЬ
function openWindow(id) {
    const win = document.getElementById(id);
    win.style.display = 'flex';
    win.style.zIndex = ++highestZ;
    if(!win.style.left) { win.style.left = '80px'; win.style.top = '40px'; }
}
function closeWindow(id) { document.getElementById(id).style.display = 'none'; }

// МЕНЮ «ПУСК»
function toggleStartMenu(e) {
    e.stopPropagation();
    const start = document.getElementById('start-menu');
    start.style.display = start.style.display === 'flex' ? 'none' : 'flex';
}
function openFromStart(id) { openWindow(id); document.getElementById('start-menu').style.display = 'none'; }

// ПЕРЕТАСКИВАНИЕ ОКНА
function dragStart(e, id) {
    activeWin = document.getElementById(id);
    activeWin.style.zIndex = ++highestZ;
    offsetX = e.clientX - activeWin.offsetLeft;
    offsetY = e.clientY - activeWin.offsetTop;
    document.addEventListener('mousemove', dragMove);
    document.addEventListener('mouseup', dragEnd);
}
function dragMove(e) {
    if (!activeWin) return;
    activeWin.style.left = `${e.clientX - offsetX}px`;
    activeWin.style.top = `${e.clientY - offsetY}px`;
}
function dragEnd() { activeWin = null; document.removeEventListener('mousemove', dragMove); document.removeEventListener('mouseup', dragEnd); }

// МИНИ-БРАУЗЕР
function navigateBrowser() {
    let url = document.getElementById('browser-url').value.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
    document.getElementById('browser-frame').src = url;
    document.getElementById('browser-url').value = url;
}
function quickNav(url) {
    document.getElementById('browser-url').value = url;
    document.getElementById('browser-frame').src = url;
}

// СОЗДАНИЕ ФАЙЛОВ И СООБЩЕНИЕ ОБ ОШИБКЕ
function saveNotepadFile() {
    const text = document.getElementById('notepad-text').value.trim();
    if (text === '') {
        playBeep('error');
        openWindow('error-dialog');
        return;
    }
    
    fileCount++;
    const container = document.getElementById('shortcuts-container');
    const file = document.createElement('div');
    file.className = 'shortcut';
    file.innerHTML = `<div class="icon">📄</div><div class="icon-text">Текст ${fileCount}.txt</div>`;
    file.ondblclick = () => alert(`Содержимое файла:\n\n"${text}"`);
    container.appendChild(file);
    document.getElementById('notepad-text').value = '';
    
    // Присылаем системное уведомление об успехе
    showNotification('Проводник файлов', `Файл "Текст ${fileCount}.txt" успешно создан.`);
}

// ТЕРМИНАЛ
const termInput = document.getElementById('terminal-input');
const termOutput = document.getElementById('terminal-output');

termInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        const command = this.value.trim().toLowerCase();
        termOutput.innerHTML += `C:\\>${this.value}<br>`;
        
        if (command === 'help') {
            termOutput.innerHTML += `Команды:<br>  help - справка<br>  cls - очистить экран<br>  bsod - вызвать критический сбой<br>  crash - ошибка ядра<br>  notify - тестовое уведомление<br>`;
        } else if (command === 'cls') {
            termOutput.innerHTML = '';
        } else if (command === 'notify') {
            showNotification('Терминал', 'Вы запустили тестовое уведомление из консоли!');
        } else if (command === 'bsod') {
            triggerBsod('CRITICAL_PROCESS_DIED'); return;
        } else if (command === 'crash') {
            triggerBsod('KERNEL_SECURITY_CHECK_FAILURE'); return;
        } else if (command !== '') {
            termOutput.innerHTML += `"${command}" не поддерживается системой.<br>`;
        }
        this.value = '';
        document.querySelector('.terminal-content').scrollTop = termOutput.scrollHeight;
    }
});

function triggerBsod(errorCode) {
    document.getElementById('bsod-code').innerText = errorCode || 'UNKNOWN_ERROR';
    document.getElementById('bsod-screen').style.display = 'flex';
}

// КОНТЕКСТНОЕ МЕНЮ И ПАПКИ
function showContextMenu(e) {
    e.preventDefault();
    const menu = document.getElementById('context-menu');
    menu.style.display = 'flex'; menu.style.left = `${e.clientX}px`; menu.style.top = `${e.clientY}px`;
}
function createNewFolder() {
    folderCount++;
    const container = document.getElementById('shortcuts-container');
    const folder = document.createElement('div');
    folder.className = 'shortcut';
    folder.innerHTML = `<div class="icon">📁</div><div class="icon-text" contenteditable="true">Папка ${folderCount}</div>`;
    folder.ondblclick = () => alert('Папка пуста.');
    container.appendChild(folder);
    
    // Всплывающее уведомление о создании папки
    showNotification('Рабочий стол', `Создана новая директория: Папка ${folderCount}`);
}

// ОБОИ И ЧАСЫ
function changeWallpaper(theme) {
    const d = document.getElementById('desktop');
    d.classList.remove('bg-blue', 'bg-dark', 'bg-sunset');
    d.classList.add(`bg-${theme}`);
}
function updateClock() {
    const now = new Date();
    document.getElementById('clock').innerText = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
}
setInterval(updateClock, 1000); updateClock();
