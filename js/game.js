/**
 *Тестовая игрушка, проверялось на IE 9, Chrome 18, Firefox 14, Safari 5, Opera 12
*/
 
var GAME_SETTINGS = {
	firstPlayerSpeed: 10,
	secondPlayerSpeed: 10,
	fieldGoalMargin:10,
	ballSpeed:10,
	gameAnimationDelay: 30, 
	gameTimeAfterGoal: {
		minuts:0,
		seconds:3
	},
	gameMaxScore:10
};

/**
  * Эдакий универсальный способ подписки на событие
  * @elem {object} - элемент, к которому будем привязывать событие
  * @evType {string} - тип события (например: "click","mouseover")
  * @call {function} - функция-обработчик (можно анонимную)
 */
 
function addEvent(elem,evType,call) {
     if(elem.addEventListener) {  
        elem.addEventListener(evType, call, false);
     } else if(elem.attachEvent) {  
        elem.attachEvent('on' + evType, call); 
     }                
} 

var first_player = new Player(GAME_SETTINGS.firstPlayerSpeed);
var second_player = new Player(GAME_SETTINGS.secondPlayerSpeed);
var field = new Field(GAME_SETTINGS.fieldGoalMargin); 

addEvent(window,'load',function() { 
	Game.init() 
});
addEvent(window,'keydown',handlerKeyDown);
addEvent(window,'keyup',handlerKeyUp);


/* Управляем рокетками для зелёгоно (a,z,ф,я) и для красного (k,m,л,ь) 
	Выполнение действйи за один кадр определяется флагами функций т.е. для каждой функции которая должна выполена в кадре флаг истина, для отсальных ложь 
*/
function handlerKeyDown(event) {  
	if ( typeof event == "undefined") {
 		e = window.event; 
	}
 	var e = e || event;
 	var code = e.keyCode || e.charCode;
	/* руский и англизуий вариант клавиш */
	if (code == 65 || code == 97 || code == 1092) {
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
	if ( typeof event == "undefined") {
 		e = window.event; 
	}
 	var e = e || event;
 	var code = e.keyCode || e.charCode;
	if (code == 65 || code == 97 || code == 1092) {
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

var Game = {
	stopwatch: null,
	intervalId: null, 
	taskList: [],
	TimerAfterGoalID: null,
	busy: false
};

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
}

/*После того как кадр отработан почистить список задач*/
Game.taskListDefault = function() {
	Game.taskList = [];
}

Game.renderingStart =  function() {
	Game.frame = function() {
		Game.taskListInit(); 
		var taskListLength = Game.taskList.length;
		for(var i = 0; i < taskListLength; i++) {
			var task = Game.taskList[i];
			task();
		}
		Game.taskListDefault();
	}
	
	Game.intervalId = setInterval(function() {
		Game.frame();
	}, GAME_SETTINGS.gameAnimationDelay); 
}

Game.renderingStop = function() {
	if (Game.intervalId) { 
		clearInterval(Game.intervalId);
		Game.intervalId = null;
	}
}



Game.init = function() {
	field.init('game-field'); 
	setReflectorsInStartPosition();
	Ball(GAME_SETTINGS.ballSpeed); 
	Ball.setInStartPosition();
	Ball.startDirection();
	first_player.connectReflector('first-reflector');  
	second_player.connectReflector('second-reflector');
	first_player.connectScoreText('first-player-score');
	second_player.connectScoreText('second-player-score');
	Game.stopwatch = new Stopwatch(document.getElementById('game-timer'));
	var start_button = document.getElementById('menu').children[0];
	var pause_button = document.getElementById('menu').children[1];
	var retry_button = document.getElementById('menu').children[2];
	addEvent(start_button,'click',Game.start);
	addEvent(pause_button,'click',Game.pause);
	addEvent(retry_button,'click',Game.retry);
	
}



Game.start = function() { 
	/*Защита от дурака - при конце игры запретить продолжение игры (нажать кнопку статра)
	 * или паузы она будет работать только в том случае если нажмут кнопень (retry) 
	 */
	if ( (Round.isGone == false) && (Game.busy ==false) ) {
		Game.messegeClear(); 
		Ball.moveFlag = true;
		Ball.show(); 
		Game.renderingStart();
		Game.stopwatch.start();
		Game.busy = true;
	}	
}

Game.stop = function() { 
	Game.renderingStop();
	if (Game.TimerAfterGoalID) {
		    timer.stop();  
		    Game.TimerAfterGoalID = null;
	}
}

Game.pause = function() {
	if (Round.isGone == false) {
		Game.messegeClear();
		Game.stop();
		setTimeout(function(){ Game.messege('Pause') }, 10); //Блокирует баг с отрисовкой в Chrome и Safari 
		Game.stopwatch.stop();
		Game.busy = false;
	}
}

Game.retry = function() {
	Game.messegeClear(); 
	Game.stop(); 
	Game.stopwatch.stop();
	Game.stopwatch.reset();
	Game.stopwatch.timeRefresh();
	Ball.setInStartPosition();
	setReflectorsInStartPosition();
	Ball.startDirection();
	first_player.resetScore(); 
	second_player.resetScore(); 
	Ball.show();
	Round.isGone = false;
	Game.busy = false;
	
}

/*Метод вывода игрового сообщения*/
Game.messege = function(messege) {
	var infobox = document.getElementById('info-box');
	var msg = document.getElementById('info-box').children[0].children[0];
	msg.innerHTML = messege; 
	infobox.style.display = 'block'; 
}

Game.messegeClear = function() {
	var infobox = document.getElementById('info-box');
	infobox.style.display = 'none';
}


var Round = {};

Round.isGone = false;

Round.End = function() {	 
	var winner = '';
	if (first_player.score >= GAME_SETTINGS.gameMaxScore) {
		winner = '<span style = "color:#FF2819;">Red</span>'; 
	} else if (second_player.score >= GAME_SETTINGS.gameMaxScore) {
		winner = '<span style = "color:#66FF4F;">Green</span>';
	}

	Game.stop();
	Game.messege('The Winner is '+winner);
	Ball.hide(); 
	/*Включам защиту от дурака*/
	Round.isGone = true;
}

Round.isEnd = function() { 
	return ((first_player.score == GAME_SETTINGS.gameMaxScore) || (second_player.score == GAME_SETTINGS.gameMaxScore) );
}

function Stopwatch(elem) {
	var intervalID;
	var seconds = minuts = 0;
	function print() {
		function addZero(i) {
	    	return i < 10 ? '0' : '';
		}
	   	return addZero(minuts) + minuts + ':' + addZero(seconds) + seconds;
	};

	this.timeRefresh = function() {
		elem.innerHTML = print();
	};

	this.tick = function() {
	 	if (seconds == 59) {
	      	seconds = 0;
	      	minuts++;
	    } else {
	      	seconds++;
	    }
		elem.innerHTML = print();
	};

	this.start = function() {
	    elem.innerHTML = print();
	    intervalID = setInterval(function() {
	      Stopwatch.obj.tick();
	    }, 1000);
	};

	this.stop = function() {
	    clearInterval(intervalID);
	    intervalID = null;
	};

	this.reset = function() {
		// Stopwatch.obj.stop();
		seconds = minuts = 0;
	};
	Stopwatch.obj = this;
};

function Field(goalMargin) {
	var goalMargin = goalMargin || 10; 
	this.self = null; 
	this.init = function(id) {
		this.self = document.getElementById(id);
	} 
	this.goalMarginLeft = function() {  
		return goalMargin;
	}
	
	this.goalMarginRight = function() { 
		return this.self.offsetWidth - goalMargin; 
	}	
}

/** Иницаилизатор мяча
 * @speed {numder} скорость мяча
 */
function Ball(speed) { 
	var ball = document.getElementById('ball');
	Ball.speed = speed || 5;  
	Ball.height = parseInt(ball.offsetHeight);
	Ball.width = parseInt(ball.offsetWidth);
	// смещение по координатным осям
	Ball.vx = 0;  
	Ball.vy = 0;
	Ball.moveFlag = false; 
	
	Ball.setInStartPosition = function() { 
		/*Ставим по центру поля*/
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


Ball.topToDown = function() { 
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
	} while ((degr >= 0 && degr <= 30) || (degr >= 80 && degr <= 100) || 
	(degr >=150  && degr <= 210) || (degr >= 260 && degr <= 280) || (degr >=330  && degr <= 360));

	var angle = degr * Math.PI / 180; 
	
	Ball.vx = Math.round(Ball.speed * Math.sin(angle)); 
	Ball.vy = -Math.round(Ball.speed * Math.cos(angle)); 
}

function Timer(seconds, minuts) {
	function print() {
	function addZero(i) {
	    return i < 10 ? '0' : '';
	}
	   	return addZero(minuts) + minuts + ':' + addZero(seconds) + seconds;
	};

	this.tick = function() {
	 	if (seconds === 0 && minuts !== 0) {
	      	seconds = 59;
	      	minuts--;
	    } else {
	      	seconds--
	    }
	Game.messege( print() );
	    if (minuts === 0 && seconds === 0) {
	   	  	clearInterval(Game.TimerAfterGoalID);
	      	Game.messegeClear();
	      	Ball.show();
	      	Ball.setInStartPosition();
	      	Game.renderingStart();
	      	Game.TimerAfterGoalID = null;
	      	Game.stopwatch.start();
	    };
	};

	this.start = function() {
	    Game.messege( print() );
	    Game.TimerAfterGoalID = setInterval(function() {
	      Timer.obj.tick();
	    }, 1000);
	};

	this.stop = function() {
	    clearInterval(Game.TimerAfterGoalID);
	    Game.TimerAfterGoalID = null;
	    Game.messegeClear();
	    Ball.setInStartPosition();
	  };
	Timer.obj = this;
};

var timer;

Ball.move = function() {

	if (isGoal()) { 
		Ball.startDirection();
		setReflectorsInStartPosition();
		Game.renderingStop();
		Ball.hide();
		Game.stopwatch.stop();
		Game.stopwatch.reset();
		timer = new Timer( GAME_SETTINGS.gameTimeAfterGoal.seconds, GAME_SETTINGS.gameTimeAfterGoal.minuts );
		timer.start();	
	}

	var	reflectOX = reflectionOX(),
		reflectOY = reflectionOY();
	var	reflectOXOY = (!(reflectOX) && !(reflectOY) && reflectionOXOY());
		/*Идея в том что если возникает опасная ситуация (когда мячик может застрять в рокетке) то нужно изменить направление 
		мячика на правильное и выкинуть мячик за пределы рокетки (выкидывать мы будет двойным изменением положения мячика за 1 проход )*/	
		if ( (Ball.hitTest(first_player.reflector.self) || Ball.hitTest(second_player.reflector.self)) && reflectOX ) {
			Ball.vx = -Ball.vx;
			Ball.setLeft(Ball.getLeft() + Ball.vx);
		} else 	if ( (Ball.hitTest(first_player.reflector.self) || Ball.hitTest(second_player.reflector.self)) && reflectOY ) {
			Ball.vy = -Ball.vy;
			Ball.setTop(Ball.getTop() + Ball.vy);
		} else {
			if (reflectOX) { 
				Ball.vx = -Ball.vx;
			}
			if (reflectOY) {
				Ball.vy = -Ball.vy;
			}
			if (reflectOXOY) {
				Ball.vx = -Ball.vx;
				Ball.vy = -Ball.vy;
			}
		}
		Ball.setLeft(Ball.getLeft() + Ball.vx); 
		Ball.setTop(Ball.getTop() + Ball.vy);
}

/** Функция проверки залазит ли мяч на объект, в нашем случае площадки игроков
 * @obj {object}
 * return {boolean}
 */

Ball.hitTest = function(obj) { 
	var bounds = {};
	bounds.left = ball.offsetLeft;
	bounds.top = ball.offsetTop;
	bounds.right = bounds.left + ball.offsetWidth;
	bounds.bottom = bounds.top + ball.offsetHeight;

	var compare = {};
	compare.left = obj.offsetLeft;
	compare.top = obj.offsetTop;
	compare.right = compare.left + obj.offsetWidth;
	compare.bottom = compare.top + obj.offsetHeight;

	return (!(compare.right < bounds.left || compare.left > bounds.right || compare.bottom < bounds.top || compare.top > bounds.bottom));

}

/** Конструктор игроков
 * @speed {numder} - скорость движения площадок
 * return {Player}
 */
function Player(speed) { 
	this.reflectorSpeed = speed || 5; 
	Player.prototype.connectScoreText = function(id) { 
		this.scoreText = document.getElementById(id);
	}
	this.locked = false;
	this.score = 0;
	Player.prototype.goal = function() { 
		this.score++;
		this.scoreText.innerHTML = this.score;
		if (Round.isEnd()) { // Костыль для того чтобы когда забьют последний гол то мяч отстановился и не сработал таймер мяча
			setTimeout(Round.End,10);
		}
	}
	Player.prototype.resetScore = function() { 
		this.score = 0;
		this.scoreText.innerHTML = this.score;
	}
	this.connectReflector = function(id) { 
		this.reflector = new Reflector(id);
		Player.prototype.moveUp = function() { 
			if ( (this.reflector.getTop() - this.reflectorSpeed >= 0) && (this.locked == false) )  
				this.reflector.setTop(this.reflector.getTop() - this.reflectorSpeed);
		}
		Player.prototype.moveDown = function() {
			if ( (this.reflector.getTop() + this.reflector.height + this.reflectorSpeed <= field.self.offsetHeight) && 
			(this.locked == false) ) 
				this.reflector.setTop(this.reflector.getTop() + this.reflectorSpeed);
		}
	}
}

/** Функция конструктор рокетки
 * @id {string} - id-шник плашадки к которой подключен игрок
 */
function Reflector(id) { 
	this.self = document.getElementById(id);
	this.height = this.self.offsetHeight;  
	this.width = this.self.offsetWidth;
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

setReflectorsInStartPosition = function() { 
	var first = document.getElementById('first-reflector');
	var second = document.getElementById('second-reflector');
	var styles = window.getComputedStyle(first);
	first.style.left = field.goalMargin + 'px';
	second.style.right = field.goalMargin + 'px';

	var top = Math.round(parseInt(field.self.clientHeight) / 2 - parseInt(styles.height) / 2) + 'px';
	first.style.top = top;
	second.style.top = top;
}

function random(min, max) { 
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
	return (
		(
			(ballLeft + Ball.speed <= 0) || (ballLeft >= (field.self.clientWidth - Ball.width)) // если вылезли за границы поля по OX сомнительно иначе был бы гол, но перестраховаться не помешает
		)
		|| 
		(
			(ballLeft <= firstPlayerLeft + first_player.reflector.width ) // не залазит за певую ракетку
			&& 
			(
				//thirdBallheight надо для того чтобы верхний левый/правый нижний угол мог выпирать за пределы высоты ротетки
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
}

function reflectionOY() { // редкий случай но тоже надо учитывать если мяч попадёт на  меньшие стороны рокеток то надо оразить по OY
	var ballLeft = Ball.getLeft(),
		ballTop = Ball.getTop(), 
		firstPlayerLeft = first_player.reflector.getLeft(),
		firstPlayerTop = first_player.reflector.getTop(),
		secondPlayerLeft = second_player.reflector.getLeft(),
		secondPlayerTop = second_player.reflector.getTop(), 
		thirdBallwidth = Math.round(Ball.widht / 3);
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



function isGoal() { 
	var OX = Ball.getLeft();
	if (OX + Ball.speed <= field.goalMarginLeft()) { 
		first_player.goal(); 
	}
	if (OX + Ball.width >= field.goalMarginRight()) {
		second_player.goal();
	}
	return (OX + Ball.speed <= field.goalMarginLeft() || OX + Ball.width >= field.goalMarginRight())
}
