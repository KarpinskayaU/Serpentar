// Главный файл игры Змейка
// Тут вся логика игры

// ==========================================
// Класс для игрового поля
// ==========================================
class GameField {
    constructor(element, size) {
        this.element = element;
        this.size = size;
        this.cells = []; // тут будет двумерный массив клеток

        // создаём поле при создании объекта
        this.createField();
    }

    // создаём клетки на поле
    createField() {
        // сначала очищаем старое поле
        this.element.innerHTML = '';
        this.cells = [];

        // ставим CSS переменные чтобы поле знало свой размер
        this.element.style.setProperty('--cols', this.size);
        this.element.style.setProperty('--rows', this.size);

        // создаём клетки в цикле
        for (let y = 0; y < this.size; y++) {
            const row = [];
            for (let x = 0; x < this.size; x++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.setAttribute('data-x', x);
                cell.setAttribute('data-y', y);
                this.element.appendChild(cell);
                row.push(cell);
            }
            this.cells.push(row);
        }
    }

    // получить клетку по координатам x и y
    getCell(x, y) {
        return this.cells[y][x];
    }

    // очистить все клетки от классов змейки и яблока
    clearAll() {
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                this.cells[y][x].classList.remove('snake');
                this.cells[y][x].classList.remove('snake-head');
                this.cells[y][x].classList.remove('apple');
            }
        }
    }
}

// ==========================================
// Класс змейки
// ==========================================
class Snake {
    constructor(startX, startY) {
        // тело змейки - массив объектов с координатами
        // последний элемент массива это голова
        this.body = [
            { x: startX - 1, y: startY },
            { x: startX, y: startY }
        ];

        // текущее направление движения
        this.directionX = 1; // вправо
        this.directionY = 0;

        // следующее направление (нужно чтобы нельзя было развернуться за один тик)
        this.nextDirectionX = 1;
        this.nextDirectionY = 0;
    }

    // получить голову змейки (последний элемент массива)
    getHead() {
        return this.body[this.body.length - 1];
    }

    // поменять направление
    setDirection(newX, newY) {
        // проверяем что не разворачиваемся на 180 градусов
        if (this.directionX === -newX && this.directionY === -newY) {
            return; // так нельзя, выходим
        }
        this.nextDirectionX = newX;
        this.nextDirectionY = newY;
    }

    // движение змейки на один шаг
    // возвращает объект с инфой: съели яблоко или нет, умерли или нет
    move(fieldSize, appleX, appleY, wallsKill) {
        // обновляем направление
        this.directionX = this.nextDirectionX;
        this.directionY = this.nextDirectionY;

        // считаем новые координаты головы
        const head = this.getHead();
        let newX = head.x + this.directionX;
        let newY = head.y + this.directionY;

        // проверяем стены
        if (wallsKill) {
            // если стены убивают и мы вышли за край - смерть
            if (newX < 0 || newX >= fieldSize || newY < 0 || newY >= fieldSize) {
                return { ate: false, died: true };
            }
        } else {
            // проходим сквозь стены и выходим с другой стороны
            if (newX < 0) newX = fieldSize - 1;
            if (newX >= fieldSize) newX = 0;
            if (newY < 0) newY = fieldSize - 1;
            if (newY >= fieldSize) newY = 0;
        }

        // проверяем столкновение с собственным телом
        for (let i = 0; i < this.body.length; i++) {
            if (this.body[i].x === newX && this.body[i].y === newY) {
                return { ate: false, died: true }; // врезались в себя
            }
        }

        // добавляем новую голову в конец массива
        this.body.push({ x: newX, y: newY });

        // проверяем съели ли яблоко
        const ate = (newX === appleX && newY === appleY);

        // если не съели яблоко - убираем хвост (первый элемент)
        if (!ate) {
            this.body.shift();
        }

        return { ate: ate, died: false };
    }
}

// ==========================================
// Класс яблока
// ==========================================
class Apple {
    constructor() {
        this.x = 0;
        this.y = 0;
    }

    // поставить яблоко в случайное свободное место
    spawn(fieldSize, snakeBody) {
        // сначала ищем все свободные клетки
        const freeCells = [];

        for (let y = 0; y < fieldSize; y++) {
            for (let x = 0; x < fieldSize; x++) {
                // проверяем занята ли клетка змейкой
                let isOccupied = false;
                for (let i = 0; i < snakeBody.length; i++) {
                    if (snakeBody[i].x === x && snakeBody[i].y === y) {
                        isOccupied = true;
                        break;
                    }
                }
                // если не занята - добавляем в список свободных
                if (!isOccupied) {
                    freeCells.push({ x: x, y: y });
                }
            }
        }

        // если свободных клеток вообще нет - выходим (змейка заполнила всё поле)
        if (freeCells.length === 0) {
            return;
        }

        // выбираем случайную клетку из свободных
        const randomIndex = Math.floor(Math.random() * freeCells.length);
        this.x = freeCells[randomIndex].x;
        this.y = freeCells[randomIndex].y;
    }
}

// ==========================================
// Главный класс игры
// ==========================================
class Game {
    constructor() {
        // получаем все нужные элементы со страницы
        this.fieldElement = document.getElementById('game-field');
        this.scoreElement = document.getElementById('current-score');
        this.recordElement = document.getElementById('record-score');
        this.recordPanel = document.getElementById('record-panel');
        this.restartBtn = document.getElementById('restart-btn');
        this.hintElement = document.getElementById('hint');
        this.settingsElement = document.getElementById('settings');
        this.fieldSizeInput = document.getElementById('field-size-input');
        this.wallsKillCheckbox = document.getElementById('walls-kill-checkbox');

        // настройки по умолчанию
        this.fieldSize = 10;
        this.wallsKill = false;

        // загружаем настройки из localStorage если есть
        this.loadSettings();

        // показываем настройки на странице
        this.fieldSizeInput.value = this.fieldSize;
        this.wallsKillCheckbox.checked = this.wallsKill;

        // переменные для игры
        this.score = 0;
        this.record = 0;
        this.isRunning = false;
        this.timerId = null;
        this.speed = 500; // скорость в миллисекундах (500мс = 0.5сек)

        // создаём объекты игры
        this.field = new GameField(this.fieldElement, this.fieldSize);
        this.snake = null; // змейку создадим потом при старте
        this.apple = new Apple();

        // загружаем рекорд
        this.loadRecord();

        // вешаем обработчики событий
        this.setupEvents();
    }

    // валидация размера поля (чтобы не повторять код)
    validateFieldSize(size) {
        let validSize = parseInt(size);
        if (isNaN(validSize)) validSize = 10;
        if (validSize < 5) validSize = 5;
        if (validSize > 20) validSize = 20;
        return validSize;
    }

    // загрузка настроек из localStorage
    loadSettings() {
        const saved = localStorage.getItem('snake-settings');
        if (saved !== null) {
            try {
                const data = JSON.parse(saved);
                this.fieldSize = this.validateFieldSize(data.fieldSize);
                this.wallsKill = !!data.wallsKill;
            } catch (e) {
                // если ошибка парсинга - оставляем значения по умолчанию
                this.fieldSize = 10;
                this.wallsKill = false;
            }
        }
    }

    // сохранение настроек в localStorage
    saveSettings() {
        const data = {
            fieldSize: this.fieldSize,
            wallsKill: this.wallsKill
        };
        localStorage.setItem('snake-settings', JSON.stringify(data));
    }

    // загрузка рекорда из localStorage
    loadRecord() {
        const saved = localStorage.getItem('snake-record');
        if (saved !== null) {
            this.record = parseInt(saved);
            this.recordElement.textContent = this.record;
            this.recordPanel.hidden = false;
        }
    }

    // сохранение рекорда если побит
    saveRecord() {
        if (this.score > this.record) {
            this.record = this.score;
            localStorage.setItem('snake-record', this.record);
            this.recordElement.textContent = this.record;
            this.recordPanel.hidden = false;
        }
    }

    // настройка всех событий
    setupEvents() {
        const self = this; // сохраняем this потому что в колбэках он теряется

        // кнопка рестарта
        this.restartBtn.addEventListener('click', function() {
            self.startGame();
        });

        // клавиатура
        document.addEventListener('keydown', function(e) {
            // если игра не запущена - проверяем старт по Enter или Space
            if (!self.isRunning) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    self.startGame();
                    return;
                }
            }

            // если игра запущена - управление змейкой стрелками
            if (self.isRunning) {
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    self.snake.setDirection(0, -1);
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    self.snake.setDirection(0, 1);
                } else if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    self.snake.setDirection(-1, 0);
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    self.snake.setDirection(1, 0);
                }
            }
        });

        // когда меняют размер поля в настройках
        this.fieldSizeInput.addEventListener('change', function() {
            self.fieldSize = self.validateFieldSize(self.fieldSizeInput.value);
            self.fieldSizeInput.value = self.fieldSize;
            self.saveSettings();

            // если игра не запущена - перерисовываем поле сразу
            if (!self.isRunning) {
                self.field = new GameField(self.fieldElement, self.fieldSize);
            }
        });

        // когда меняют чекбокс стен
        this.wallsKillCheckbox.addEventListener('change', function() {
            self.wallsKill = self.wallsKillCheckbox.checked;
            self.saveSettings();
        });
    }

    // начать новую игру
    startGame() {
        if (this.isRunning) return; // если уже играем - выходим

        // читаем настройки из полей ввода
        this.fieldSize = this.validateFieldSize(this.fieldSizeInput.value);
        this.wallsKill = this.wallsKillCheckbox.checked;
        this.saveSettings();

        // пересоздаём поле с новым размером
        this.field = new GameField(this.fieldElement, this.fieldSize);

        // создаём змейку в центре поля
        const centerX = Math.floor(this.fieldSize / 2);
        const centerY = Math.floor(this.fieldSize / 2);
        this.snake = new Snake(centerX, centerY);

        // сбрасываем счёт и скорость
        this.score = 0;
        this.speed = 500;
        this.scoreElement.textContent = '0';

        // прячем подсказку и кнопку рестарта
        this.hintElement.hidden = true;
        this.restartBtn.hidden = true;

        // блокируем настройки чтобы не меняли во время игры
        this.settingsElement.classList.add('disabled');
        this.fieldSizeInput.disabled = true;
        this.wallsKillCheckbox.disabled = true;

        // ставим яблоко на поле
        this.apple.spawn(this.fieldSize, this.snake.body);

        // рисуем начальное состояние
        this.draw();

        // запускаем игровой цикл
        this.isRunning = true;
        this.startTimer();
    }

    // запуск таймера
    startTimer() {
        // если старый таймер есть - останавливаем его
        if (this.timerId !== null) {
            clearInterval(this.timerId);
        }

        const self = this;
        this.timerId = setInterval(function() {
            self.gameLoop();
        }, this.speed);
    }

    // игровой цикл - вызывается каждые speed миллисекунд
    gameLoop() {
        // двигаем змейку
        const result = this.snake.move(
            this.fieldSize,
            this.apple.x,
            this.apple.y,
            this.wallsKill
        );

        // проверяем умерла ли змейка
        if (result.died) {
            this.gameOver();
            return;
        }

        // проверяем съели ли яблоко
        if (result.ate) {
            this.score++;
            this.scoreElement.textContent = this.score;

            // ставим новое яблоко
            this.apple.spawn(this.fieldSize, this.snake.body);

            // каждые 5 очков ускоряемся
            if (this.score % 5 === 0 && this.speed > 100) {
                this.speed = this.speed - 50;
                this.startTimer(); // перезапускаем таймер с новой скоростью
            }
        }

        // перерисовываем поле
        this.draw();
    }

    // конец игры
    gameOver() {
        // останавливаем таймер
        clearInterval(this.timerId);
        this.timerId = null;
        this.isRunning = false;

        // сохраняем рекорд если побит
        this.saveRecord();

        // показываем кнопку рестарта и подсказку
        this.restartBtn.hidden = false;
        this.hintElement.hidden = false;
        this.hintElement.textContent =
            '💀 Игра окончена! Нажмите Enter / Space или кнопку, чтобы начать заново.';

        // разблокируем настройки
        this.settingsElement.classList.remove('disabled');
        this.fieldSizeInput.disabled = false;
        this.wallsKillCheckbox.disabled = false;
    }

    // отрисовка всего на поле
    draw() {
        // сначала очищаем всё поле
        this.field.clearAll();

        // рисуем яблоко
        const appleCell = this.field.getCell(this.apple.x, this.apple.y);
        appleCell.classList.add('apple');

        // рисуем змейку
        for (let i = 0; i < this.snake.body.length; i++) {
            const segment = this.snake.body[i];
            const cell = this.field.getCell(segment.x, segment.y);
            cell.classList.add('snake');

            // голова змейки - это последний элемент в массиве
            if (i === this.snake.body.length - 1) {
                cell.classList.add('snake-head');
            }
        }
    }
}

// запускаем игру когда страница загрузится
window.addEventListener('DOMContentLoaded', function() {
    const game = new Game();
});