/*
	Тестовая игрушка, проверялось на IE 9, Chrome 18, Firefox 14, Safari 5, Opera 12
*/

/*
 * Эдакий универсальный способ подписки на событие
 * elem - элемент, к которому будем привязывать событие
 * evType - тип события (например: "click","mouseover")
 * call - функция-обработчик (можно анонимную)
 */
 
function addEvent(elem,evType,call)
{
     if(elem.addEventListener)
     {  
        elem.addEventListener(evType, call, false);
     } 
     else if(elem.attachEvent) 
     {  
        elem.attachEvent('on' + evType, call); 
     }                
} 

/* Соаздаём игроков второй аргумент - скорость движения площадки */
var first_player = new Player(10);
var second_player = new Player(10);
/*Заносим переменную поля в глобалы*/
var field = new Field(); 

/* Продписка на события для движения площадок и для инициализации игры при полной загрузке страницы */
addEvent(window,'load',function(){ Game.init() });
/*Решение для клавиатуры слабо-кроссбраузерное*/
addEvent(window,'keydown',handlerKeyDown);
//addEvent(window,'keypress',handler);
addEvent(window,'keyup',handlerKeyUp);


/* Управляем рокетками для зелёгоно (a,z,ф,я) и для красного (k,m,л,ь) 
	Выполнение действйи за один кадр определяется флагами функций т.е. для каждой функции которая должна выполена в кадре флаг истина, для отсальных ложь 
*/
function handlerKeyDown(event) {  
	/* Костыль для IE */
	if ( typeof event == "undefined") {
 		e = window.event; 
	}
 	var e = e || event;
	/* Костыль для FireFox*/
 	var code = e.keyCode || e.charCode;
	/* руский и анлизуий вариант клавиш */
	//console.log('code = '+code);
	if (code == 65 || code == 97 || code == 1092) {
		/*Нажали на клавишу и взвели флаг в истину */
		first_player.reflector.moveFlagUp = true; 
	}
 	if (code == 90 || code == 122 || code == 1103) {
		first_player.reflector.moveFlagDown = true;
	}	
 	if (code == 75 || code == 107 || code == 1083) {
		second_player.reflector.moveFlagUp = true;
	}	
 	if (code == 77 || code == 109 || code == 1100) {
		second_player.reflector.moveFlagDown = true;
	}	
}


function handlerKeyUp(event) {  
	/* Костыль для IE */
	//console.log('test Up');
	if ( typeof event == "undefined") {
 		e = window.event; 
	}
 	var e = e || event;
	/* Костыль для FireFox*/
 	var code = e.keyCode || e.charCode;
	/* руский и анлизуий вариант клавиш */
	if (code == 65 || code == 97 || code == 1092) {
		/*Отжали на клавишу и взвели флаг в лож */
		first_player.reflector.moveFlagUp = false; 
	}
 	if (code == 90 || code == 122 || code == 1103) {
		first_player.reflector.moveFlagDown = false;
	}	
 	if (code == 75 || code == 107 || code == 1083) {
		second_player.reflector.moveFlagUp = false;
	}	
 	if (code == 77 || code == 109 || code == 1100) {
		second_player.reflector.moveFlagDown = false;
	}	
}

var Game = {} ; // wrapper
/* Будем делать таймер как чать объекта игра , он должен:
	- Начинать игру (в одном такте отрисовки будет отрисовываться не только мяч но и площадки)
	- Останавливать игру (запрет на отрисовку и вычисление позиций мяча и площадок)
	- Устанавливать задержку всей анимации 
	- Иметь Список заданий (статический или динамический?)
	- Возможность маштабиравания класса таймера
*/
Game.intervalId = null; /*Таймер иргы (кадров)*/
Game.taskList = []; /*Массив фунций на исполнение (будут выполняться за кадр)*/
Game.delay = 30; 
Game.TimeAfterGoal = 2000; /*Задержка в 2 секунды после гола*/
Game.TimerAfterGoalID = null; 
/*Здесь мы заносим все функции которые должны быть выполнены за 1 кадр в список заданий на исполнение исходя из состояния флагов*/
Game.taskListInit = function() {
	if (Ball.moveFlag) {
		Game.taskList.push(Ball.move); 
	}
	if (first_player.reflector.moveFlagUp) {
		Game.taskList.push(function() { first_player.moveUp() }); 
	}	
	if (first_player.reflector.moveFlagDown) {
		Game.taskList.push(function() { first_player.moveDown() });
	}
	if (second_player.reflector.moveFlagUp) {
		Game.taskList.push(function() { second_player.moveUp() });
	}	
	if (second_player.reflector.moveFlagDown) {
		Game.taskList.push(function() { second_player.moveDown() });
	}
	//console.log('Game.taskListInit');
}

/*После того как кадр отработан надо сбросить флаги в значение по умолчанию и почистить список задач*/
Game.taskListDefault = function() {
	Game.taskList = [];
	/*first_player.reflector.moveFlagUp = false;
	first_player.reflector.moveFlagDown = false;
	second_player.reflector.moveFlagUp = false;
	second_player.reflector.moveFlagDown = false; */
	//console.log('Game.taskListDefault');
}

/*Наша функция отрисовки , она начинает отрисовку*/
Game.renderingStart =  function() {
	//console.log('Game.renderingStart');
	Game.frame = function() {
		//console.log('Game.frameStart');
		Game.taskListInit(); /*Записываем на исполнение*/
		var taskListLength = Game.taskList.length;
		for(var i = 0; i < taskListLength; i++) {
			var task = Game.taskList[i];
			task(); /*исполняем*/
		}
		/*Сбрасываем в значение по умолчанию*/
		Game.taskListDefault();
	}
	
	Game.intervalId = setInterval(function() {
		Game.frame();
	},Game.delay); 
}

/*Функция останавливает отрисовку*/
Game.renderingStop = function() {
	if (Game.intervalId) { // чтобы остановить интервал
		clearInterval(Game.intervalId);
		Game.intervalId = null; /*Обязательно сбросить*/
	}
}



Game.init = function() {
	/*Инициализируем игровое поле*/
	field.init('game-field'); 
	/*Ставим в начальные позиции плозщадки*/
	setReflectorsInStartPosition();
	Ball(10); // создаём мяч,  аргумент - скороть движения мяча
	/*Ставим мяч по центру поля*/
	Ball.setInStartPosition();
	Ball.startDirection(); //Задаём произвольное направление
	/*Не забываем связять рокетки и игроков*/
	first_player.connectReflector('first-reflector');  
	second_player.connectReflector('second-reflector');
	first_player.connectScoreText('first-player-score');
	second_player.connectScoreText('second-player-score');
	/* Определяем упраляюшие кнопки */
	var start_button = document.getElementById('menu').children[0];
	var pause_button = document.getElementById('menu').children[1];
	var retry_button = document.getElementById('menu').children[2];
	/* Подписываемся для них на события */
	addEvent(start_button,'click',Game.start);
	addEvent(pause_button,'click',Game.pause);
	addEvent(retry_button,'click',Game.retry);
	
}



Game.start = function() { 
	/*Защита от дурака - при конце игры запретить продолжение игры (нажать кнопку статра) она будет работать только в том случае если нажмут кнопень (retry) */
	if (Round.isGone == false) {
		Game.messegeClear(); // стереть сообщения если были
		Ball.moveFlag = true;
		Ball.show(); // лишним не будет
		/*Тут начинает работать отрисовка*/
		Game.renderingStart();
	}	
}

Game.stop = function() { 
	/*Защита от дурака -  при нажатии кнопки стоп нельзя менять положение площадок*/
	Game.renderingStop();
}

Game.pause = function() {
	/*Выводим сообщение о паузе*/
	if (Round.isGone == false) {
		Game.messege('Pause');
		Game.stop();
	}
}

Game.retry = function() {
	/*Стираем все сообщения*/
	Game.messegeClear();  
	Ball.setInStartPosition();
	setReflectorsInStartPosition();
	Ball.startDirection();
	/*Сбрасываем счёт игроков*/
	first_player.resetScore(); 
	second_player.resetScore(); 
	Ball.show();
	Game.renderingStop();
	Round.isGone = false;
	
}

/*Метод вывода игрового сообщения*/
Game.messege = function(messege) {
	/*Получаем доступ к элементу сообщения*/
	var infobox = document.getElementById('info-box');
	var msg = document.getElementById('info-box').children[0].children[0];
	msg.innerHTML = messege; // включаем сообщение
	infobox.style.display = 'block'; // включаем затемнение игрового поля
}

Game.messegeClear = function() {
	/*Просто убирвем блок со страницы*/
	var infobox = document.getElementById('info-box');
	infobox.style.display = 'none';
}


var Round = {};

Round.isGone = false;

Round.End = function() {	 
	var winner = '';
	if (first_player.score == 10) {
		winner = '<span style = "color:#FF2819;">Red</span>'; // Добавляем победителя
	} else if (second_player.score == 10) {
		winner = '<span style = "color:#66FF4F;">Green</span>';
	}
	Game.messege('The Winner is '+winner);
	Game.stop();
	/*Рещил спрятать мяч*/
	Ball.hide(); 
	/*Включам защиту от дурака*/
	Round.isGone = true;
}

Round.isEnd = function() { // проверка на конец раунда
	return ((first_player.score == 10) || (second_player.score == 10) );
}

/*Сначала хотел оформлять все инициализаторы как функции-конструкторы но отказался от этой задумки */

function Field(goalMargin) {
	var goalMargin = goalMargin || 10; // отступ от левой и правой стороны поля после которого будет засчитан гол
	this.self = null; /*Работаем с замыканием поэтому явно вынес свойство экземпляра*/
	this.init = function(id) {
		this.self = document.getElementById(id);
	} 
	/*Получить расстояние на котором засчитывают гол*/
	this.goalMarginLeft = function() {  
		return goalMargin;
	}
	
	this.goalMarginRight = function() { 
		return this.self.offsetWidth - goalMargin; 
	}	
}

/*Сделал с прикидкой на будущее*/
var Menu = {};

/*Инициализатор мяча аргумент это скорость мяча*/
function Ball(speed) { 
	var ball = document.getElementById('ball');
	Ball.speed = speed || 5;  
	/*Значение по умолчанию*/
	Ball.height = parseInt(ball.offsetHeight);
	Ball.width = parseInt(ball.offsetWidth);
	Ball.vx = 0;  // смещение по координатным осям
	Ball.vy = 0;
	Ball.moveFlag = false; // флаг движения мячф в кадре
	
	Ball.setInStartPosition = function() { /*Ставим по центру поля*/
		ball.style.left = Math.round(parseInt(field.self.clientWidth) / 2 - parseInt(ball.offsetWidth) / 2) + 'px';
		ball.style.top = Math.round(parseInt(field.self.clientHeight) / 2 - parseInt(ball.offsetHeight) / 2) + 'px';
	}
	
	Ball.hide = function() {
		ball.style.display = 'none';
	}
	
	Ball.show = function() {
		ball.style.display = 'block';
	}

}

/*Определяем направление мяча (свеху-вниз/снизу-вверх)*/
Ball.topToDown = function() { // направление движения мяча по OY 
	return (Ball.vy > 0 );
}

Ball.downToTop = function() {
	return (Ball.vy < 0 );
}

Ball.getLeft = function() {
	return ball.offsetLeft;
}

Ball.getTop = function() {
	return ball.offsetTop;
}

Ball.setLeft = function(x) {
	ball.style.left = x + 'px';
}

Ball.setTop = function(y) {
	ball.style.top = y + 'px';
}


Ball.startDirection = function() {
	/*
		Координатные оси при таком опредедения направления повёрнуты так что:
		- 0,360 градусов - вертикально вверх; 
		- 90 градусов - горизонтально вправо; 
		- 180 градусов - вертикально вниз;		
		- 270 градусов - горизонтально влево;	
		
		Отсюда выражаем желательные градусные диапозоны:
		Любой градус который входит в интервал:
		- от 30 до 80 градусов 
		- от 100 до 150 градусов
		- от 210 до 260 градусов
		- от 280 до 330 градусов
	*/
	/*Ищем желательный градусный угол*/
	do {
	var degr = random(0, 360);
	//console.log(degr);
	} while ((degr >= 0 && degr <= 30) || (degr >= 80 && degr <= 100) || (degr >=150  && degr <= 210) || (degr >= 260 && degr <= 280) || (degr >=330  && degr <= 360));
	//console.log('--------');
	var angle = degr * Math.PI / 180; 
	// счтиаем угол в радианах
	
	Ball.vx = Math.round(Ball.speed * Math.sin(angle)); // смещение по ОХ  , кстати sin cos в диапозоне [0,1]
	Ball.vy = -Math.round(Ball.speed * Math.cos(angle)); // здесь '-' потому что косинус - отножение гипотенузы (вестора скорости) к прилежажему катету получается верхний катет
}

/*Для того чтобы можно было блокировать проверки на отражения*/
/*
	Задумака обойти баг с застреванием:
	сделал указатель опасной ситуации т.е когда происходит застревание (происходит оно тогда когда мячик залазит на рокетку
	и срабатывает условие отражения по оси OX или OY)
	тоесть если, всё же случилась такая ситуация, то нужно 1  раз задать направление (чтобы выбраться за пределы шарика) и 1 ход не выполнять проверки на условия отражения.
*/

Ball.move = function() {
	 
		/*Если забили гол то через 2 секунды будет начат следуший раунд*/
		if (isGoal()) { 
			Ball.startDirection();
			Ball.setInStartPosition();
			Ball.moveFlag = false;
			Game.TimerAfterGoalID = setTimeout(function() { // та самая задержка в 2 секунды из условия
				Ball.moveFlag = true;
			}, Game.TimeAfterGoal); 
		}
		
		/*Попытка обойти баг с застриванием мяча в рокетке*/
		
		var	reflectOX = reflectionOX(),
			reflectOY = reflectionOY();
		var	reflectOXOY = (!(reflectOX) && !(reflectOY) && reflectionOXOY());
			/*Идея в том что если возникает опасная ситуация (когда мячиу может застрять в рокетке) то нужно изменить направление 
			мячика на правильное и выкинуть мячик за пределы рокетки (выкидывать мы будет двойным изменением положения мячика за 1 проход )  */	
			if ( (Ball.hitTest(first_player.reflector.self) || Ball.hitTest(second_player.reflector.self)) && reflectOX ) {
				Ball.vx = -Ball.vx;
				Ball.setLeft(Ball.getLeft() + Ball.vx);
				//console.log('Warning: OX ');
			} else 	if ( (Ball.hitTest(first_player.reflector.self) || Ball.hitTest(second_player.reflector.self)) && reflectOY ) {
				Ball.vy = -Ball.vy;
				Ball.setTop(Ball.getTop() + Ball.vy);
				//console.log('Warning: OY');
			} else {
				if (reflectOX) { // проверка на отружения по осям
					Ball.vx = -Ball.vx;
					//console.log('OX: true');
				}
				if (reflectOY) {
					Ball.vy = -Ball.vy;
					//console.log('OY: true');	
				}

				if (reflectOXOY) { // самый последний вариант
					Ball.vx = -Ball.vx;
					Ball.vy = -Ball.vy;
					//console.log('OXOY: true');
				}
			}
		//console.log('-----------');
		Ball.setLeft(Ball.getLeft() + Ball.vx); // изменяем позицию мячика с учётом смещения по осям
		Ball.setTop(Ball.getTop() + Ball.vy);
	

	 // if (!Ball.moveInterval)устанавливаем интервал для создания анимации даижения мяча
		//Ball.moveInterval = setInterval(fly, 30);
}

Ball.hitTest = function(obj) { // функция проверки залез ли мяч на обьек, который передаётся в качестве парамета
	var bounds = {};
	bounds.left = ball.offsetLeft;
	bounds.top = ball.offsetTop;
	bounds.right = bounds.left + ball.offsetWidth;
	bounds.bottom = bounds.top + ball.offsetHeight;
	//console.log('bounds: '+bounds.left+' '+bounds.top+' '+bounds.right+' '+bounds.bottom);

	var compare = {};
	compare.left = obj.offsetLeft;
	compare.top = obj.offsetTop;
	compare.right = compare.left + obj.offsetWidth;
	compare.bottom = compare.top + obj.offsetHeight;
	//console.log('compare: '+compare.left+' '+compare.top+' '+compare.right+' '+compare.bottom);

	return (!(compare.right < bounds.left || compare.left > bounds.right || compare.bottom < bounds.top || compare.top > bounds.bottom));

}

/*Конструктор игроков*/
function Player(speed) { 
	this.reflectorSpeed = speed || 5; /*скороть площадок по умолчанию*/
	Player.prototype.connectScoreText = function(id) { /*подключить к каждому игроку свой счёт*/
		this.scoreText = document.getElementById(id);
	}
	this.locked = false;
	this.score = 0;
	Player.prototype.goal = function() { /*Досада всё-таки забили гол*/
		this.score++;
		this.scoreText.innerHTML = this.score;
		if (Round.isEnd()) { // Костыль для того чтобы когда забьют последний гол то мяч отстановился и не сработал таймер мяча
			setTimeout(Round.End,20);
		}
	}
	Player.prototype.resetScore = function() { 
		this.score = 0;
		this.scoreText.innerHTML = this.score;
	}
	this.connectReflector = function(id) { /*Подключить площадки к игрокам*/
		this.reflector = new Reflector(id);
		Player.prototype.moveUp = function() { /*Методы площадок для перемещения */
			//console.log('progress Up');
			if ( (this.reflector.getTop() - this.reflectorSpeed >= 0) && (this.locked == false) )  // если млжно двигаться и не заблокирован контроллер
				this.reflector.setTop(this.reflector.getTop() - this.reflectorSpeed);
		}
		Player.prototype.moveDown = function() {
			//console.log('progress Down '+ field.self.offsetHeight);
			if ( (this.reflector.getTop() + this.reflector.height + this.reflectorSpeed <= field.self.offsetHeight) && (this.locked == false) ) // аналочино только для низа
				this.reflector.setTop(this.reflector.getTop() + this.reflectorSpeed);
		}
	}
}

/*Функция конструктор рокетки*/
function Reflector(id) { /*Нужно связать с блоком*/
	this.self = document.getElementById(id);
	this.height = 100;  // можно брать из контролера , но лучше явно 
	this.width = 20;
	Reflector.prototype.getTop = function() {
		return parseInt(this.self.offsetTop);
	}
	Reflector.prototype.setTop = function(value) {
		this.self.style.top = parseInt(value) + 'px';
	}
	Reflector.prototype.getLeft = function() {
		return parseInt(this.self.offsetLeft);
	}
	Reflector.prototype.setLeft = function(value) {
		this.self.style.left = parseInt(value) + 'px';
	}
}

setReflectorsInStartPosition = function() { // эта функция не внесена в класс так как устанавоивает в начальное положение обе площадки
	var first = document.getElementById('first-reflector');
	var second = document.getElementById('second-reflector');
	var styles = window.getComputedStyle(first);
	first.style.left = field.goalMargin + 'px';
	second.style.right = field.goalMargin + 'px';

	var top = Math.round(parseInt(field.self.clientHeight) / 2 - parseInt(styles.height) / 2) + 'px';
	first.style.top = top;
	second.style.top = top;
}
function random(min, max) { // нормлаьный генератор случайных чисел, для того чтобы крайние числа интервала выпадали с равной вероятностью 
	return Math.round((min - 0.5) + Math.random() * (max - min + 1));
}


/*
 *Мяч может отскативать от препядствий в 3х случаях 
 - отражение по оси OX:
	Для первой рокетки (зелёной):
	1) в случае если верхний левый угол мяча соприкасается с правой стороной рокетки И находится по высоте в пределах: верхний левый угол ниже 
	чем верхняя сторона (по OY) минус треть высоты мяча (треть для реалистичности - т.е. если попадёт хотябы на 1 пиксель выше чем 
	верх рокетки отражаться будет по 2м осям сразу) И нижний левый угол мяча выше чем низ рокетки (по OY) плюс треть высоты мяча.
	!!! ВАЖНО ОТРАЖАТЬСЯ ПО OX может так же в тех случаях если мяч летит снизу-вверх и попадает не на нижний угол площадки где должен отразиться по обоим осям сразу а
	на верхний и на оборот, для обоих рокеток соответсвенно. 
	2) В случае если мяч летит сверху-вних и попадает на нижний угол рокетки.
	3) В случае елм мяч летит снизу вверх и попадает на вернхий угол рокетки.
	Для второй рокетки (красной):
	все пункты аналогично как и для зелёной рокетки, но с учётом зеркального расположения (т.е не верний левый угол мяча , а вернхний правый и т.д.)
	Общие правила: 
	Если мячик удариться о левые и правые стеники поля (при условии если систему голов надо будет отключить)
 - отражение по оси OY: (Редкий случай но тоже надо учитывать)
	Для первой ракетки: (зелёной)
	Эта часть логики делается для того чтобы изменения размеров рокеток не стало причины переделывать логику
	1) верхний левый угол мяча (по OX) Больше чем левая сторона рокетки и меньше чем правая сторона рокетки минус треть ширины мяча И Мяч касается верхней или
	нижней стороны рокетки 
	Для второй рокетки: (красной) 
	Аналочино как и для зелёной но с учётом зеркального располажения
	Общие правила: если мяч касается верхней или нижний стенок игрового поля  то он отражается;
 - отражение по оси OXOY: 
	если не сработает отражение по OX и OY и шарик наедет на первую или вторую площадку то он отразится и по оси OX и по оси OY
	По первоначально задумке если не сработал первый и второй случаи то обязан сработать третий, однако моя логика основана
	на том чтобы прежде чем делать ход смотреть на 1 ход вперёд (с учётом смещения) и лиш потом выносить вердикт о отражении в результате возник следущий баг:
	(сразу я его не заметил) в некторых случаях когда не сработает отражение по OX и OY и шарик наедет на рокетки отразить по обоим осям направление, мячик может
	застрять в рокетке. 	
*/

// Логика отражения
// Логику не стал выносить в отделный класс 
// см. explain_direction.png
function reflectionOX() {
	//Этот блок переменных содержит результат вычисления методов, чтобы они не вызывались постоянно (жалкое подобие оптимизации)
	var ballLeft = Ball.getLeft(),
		firstPlayerLeft = first_player.reflector.getLeft(),
		firstPlayerTop = first_player.reflector.getTop(),
		secondPlayerLeft = second_player.reflector.getLeft(),
		secondPlayerTop = second_player.reflector.getTop(),
		ballTop = Ball.getTop(), 
		thirdBallheight = Math.round(Ball.height / 3),
		ballHitFirst = Ball.hitTest(first_player.reflector.self),
		ballHitSecond = Ball.hitTest(second_player.reflector.self),
		ballDirTopToDown = Ball.downToTop(),
		ballDirDownToTop = Ball.topToDown();
		
	//console.log('OX: call');
	return (
		(
			(ballLeft + Ball.speed <= 0) || (ballLeft >= (field.self.clientWidth - Ball.width)) // если вылезли за границы поля по OX сомнительно иначе был бы гол, но перестраховаться не помешает
		)
		|| 
		(
			(ballLeft <= firstPlayerLeft + first_player.reflector.width ) // не залазит за певую ракетку
			&& 
			(
				//thirdBallheight надо для того чтобы верхний левый / правый нижний угол мог выпирать за пределы высоты котетки
				(ballTop >= firstPlayerTop - thirdBallheight ) &&  
				(ballTop + ball.height <= firstPlayerTop + first_player.reflector.height + thirdBallheight )
			)
		)
		||
		( 
			// Проблема в том что откажается по OX OY даже если мяч попадает на вехний край летя снизу в верх и так далее для углов рокеток
			// соственно это и реализуется учёт направления 
			// для первой (зелёной) рокетки верхний угол
			( ballHitFirst && (ballDirTopToDown) ) 
			&&
			(
				(ballTop >= firstPlayerTop - Ball.height) &&
				(ballTop <= firstPlayerTop ) 
							
			)
		)
		||
		(
			// для первой (зелёной) рокетки нижний угол
			( ballHitFirst && (ballDirDownToTop) )
			&&
			(
				(ballTop + Ball.width >= firstPlayerTop + first_player.reflector.height) &&
				(ballTop + Ball.width <= firstPlayerTop + first_player.reflector.height + Ball.height) 
							
			)
		) 
		|| 
		// почти аналочиная ситуация для второй рокетки 
		(
			(ballLeft + Ball.width >= secondPlayerLeft) 
			&& 
			(
				(ballTop >= secondPlayerTop -thirdBallheight) 
				&& 
				(ballTop + Ball.height <= secondPlayerTop + second_player.reflector.height +thirdBallheight)
			)
		) 
		|| 
		(
			// для второй (красной) рокетки верхний угол
			( ballHitSecond && (ballDirTopToDown) )
			&&
			(
				(ballTop >= secondPlayerTop - Ball.height ) &&
				(ballTop <= secondPlayerTop ) 
							
			)
		)
		|| 
		(
			( ballHitSecond && (ballDirDownToTop) )
			&&
			( 
				// для второй (красной) рокетки нижний угол
				(ballTop + Ball.height >= secondPlayerTop + second_player.reflector.height) &&
				(ballTop + Ball.height <= secondPlayerTop + Ball.height ) 
							
			)
		)
		
	);

	// return ( (ballLeft + ball.speed <= 0) || (ballLeft >= (field.self.clientWidth - ball.width)) ) ? true : false;
}

function reflectionOY() { // редкий случай но тоже надо учитывать если мяч попадёт на  меньшие стороны рокеток то надо оразить по OY
	var ballLeft = Ball.getLeft(),
		ballTop = Ball.getTop(), 
		firstPlayerLeft = first_player.reflector.getLeft(),
		firstPlayerTop = first_player.reflector.getTop(),
		secondPlayerLeft = second_player.reflector.getLeft(),
		secondPlayerTop = second_player.reflector.getTop(), 
		thirdBallwidth = Math.round(Ball.widht / 3);
		
	//console.log('OY: call');	
	
	return (
		(
			(ballTop <= 0) || (ballTop >= (field.self.clientHeight - Ball.height) ) /* Общий случай */
		) 
		|| 
		(
		/* Отражение по OY для первой рокетки */
			(
				/*Смотрим чтобы входил в промежуток по OX */
				(ballLeft > firstPlayerLeft ) &&  
				(ballLeft < firstPlayerLeft + first_player.reflector.width - thirdBallwidth )
			) 
			&& 
			(
				/*И касался верних и нижних сторон рокетки */
				(ballTop + Ball.height >= firstPlayerTop ) || 
				(ballTop <= firstPlayerTop + first_player.reflector.height )
			)
		) 
		|| 
		(
		/* Аналогично для второй рокетки */
			(
				(ballLeft + Ball.width > secondPlayerLeft + thirdBallwidth ) && 
				(ballLeft + Ball.width < secondPlayerLeft + second_player.reflector.width)
			) 
			&& 
			(
				(ballTop + Ball.height >= secondPlayerTop ) || 
				(ballTop <= secondPlayerTop + second_player.reflector.height )
			)
		)
	);
}


function reflectionOXOY() { // во всех остальных случаях надо отражать по всем направлениям
	return (Ball.hitTest(first_player.reflector.self) || Ball.hitTest(second_player.reflector.self)
	);

}



function isGoal() { // проверка на то забили ли гол
	var OX = Ball.getLeft();
	if (OX + Ball.speed <= field.goalMarginLeft()) { // проверка на то вылши ли за границы
		first_player.goal(); // забили гол
	}
	if (OX + Ball.width >= field.goalMarginRight()) {
		second_player.goal();
	}
	return (OX + Ball.speed <= field.goalMarginLeft() || OX + Ball.width >= field.goalMarginRight())
}
