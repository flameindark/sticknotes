/**
 * for protect outer enviroment
 */
var app = {
	util : {},
	store : {}
};

/**
 * Object for save mem in localstorage
 */
app.store = {
	__563sticky_notes__ : '__563_note_items',
	get : function (noteId) {
		return localStorage[this.__563sticky_notes__][noteId]||{};	
	},
	set : function (noteId,item) {
		notes = this.getAll();
		if (notes[noteId]) {
			Object.assign(notes[noteId],item);
		}else{
			notes[noteId] = item;
		};
		localStorage[this.__563sticky_notes__] = JSON.stringify(notes);
	},
	delete : function (noteId) {
		var notes = this.getAll();
		delete notes[noteId];
		localStorage[this.__563sticky_notes__] = JSON.stringify(notes); 
	},
	getAll : function () {
		return JSON.parse(localStorage[this.__563sticky_notes__]||'{}');
	},
};

/**
 * utils for public
 */
app.util = {
	$ : function (selector,node) {
		return (node||document).querySelector(selector);
	},
	formatTime : function(ms) {
		var date = new Date(ms);
		function fixed(s) {
			if (s.toString().length <= 1) {
				s = '0' + s;
			}
			return s;
		}
		var year = date.getFullYear();
		var month = date.getMonth()+1;
		var day = date.getDate();

		var hour = date.getHours();
		var minutes = date.getMinutes();
		var second = date.getSeconds();

		dateString = year + '-' + fixed(month) + '-' + fixed(day) + ' ' + fixed(hour) + ':' + fixed(minutes) + ':' + fixed(second) ;
		return dateString;
	},
	/**
	 * @param  [color num range]
	 * @return "a random rgb color number array"
	 */
	getRandomColorArray : function(max,min){
		var color = [];
		for(i=0;i<3;i++){
		    var colorNum =randomNum(max,min);
		    color.push(colorNum);
		}
		function randomNum(max,min){
		    return Math.floor(Math.random()*(max-min+1)+min)
		}
		return color;
	},
	/**
	 * get ContrastColor num arry
	 * @param  {[Array]} [rgb color number array]
	 * @return {[Array]} [a contrast rgb color number array]
	 */
	getContrastColorArray : function (rgbArray) {
		rgbArray.forEach(function (value,index) {
			rgbArray[index] = 255 - value;
		});
		return rgbArray;
	},
	formatRgbArrayToColor : function (rgbArray) {
		return 'rgb('+rgbArray.join(',')+')';
	}
};

(function(util,store) {
	var noteTpl = `
			<i class="close-btn"></i>
			<i class="rotate-btn"></i>
			<textarea class="note-content"></textarea>
			<div class="update-time">
				<span>更新于:</span>
				<span class="time"></span>
			</div>
			`;
	var MaxIndex = 0;

	var $ = util.$;
	var moveNote = null;
	var startX = null;
	var startY = null;
	var rotateIniX = null;
	var rotateIniY = null;
	var rotateNote = null;

	/**
	 * defined Note Object
	 */
	function Note(option) {
		var note = document.createElement('div');

		note.id = option.noteId;
		note.className = "note-item";
		note.innerHTML = noteTpl;
		note.style.left = option.left+'px';
		note.style.top = option.top+'px';
		note.style.color = option.fontColor||'#222';
		note.style.backgroundColor = option.bgColor||'#f9ff5a';

		note.style.zIndex = option.zIndex||MaxIndex++;
		note.style.transform = option.rotateAngle||"";

		$('.note-content',note).value = option.conent||'';
		$('.note-wrap').appendChild(note);
		this.note = note;
		this.updateTime(option.time);
		this.addEvent();
	}

	Note.prototype.close = function() {
		$('.note-wrap').removeChild(this.note);
		store.delete(this.note.id);
	};
	
	/**
	 * add initial event to Note
	 */
	Note.prototype.addEvent = function () {
		var closeBtn = $('.close-btn',this.note);
		var rotateBtn = $('.rotate-btn',this.note);
		var editor = $('.note-content',this.note);
		var timer = null;
		
		var closeHandler = function(e) {
			this.close();
			closeBtn.removeEventListener('click',closeHandler);
			this.note.removeEventListener('mousedown',mousedownHandler);
		}.bind(this)

		closeBtn.addEventListener('click',closeHandler);

		var mousedownHandler = function (e) {
			startX = e.clientX - this.note.offsetLeft;
			startY = e.clientY - this.note.offsetTop;
			moveNote = this.note;
			if (parseInt(this.note.style.zIndex) !== MaxIndex) {
				this.note.style.zIndex = ++MaxIndex;
			}
		}.bind(this);

		var inputHandler = function (e) {

			clearTimeout(timer);
			timer = setTimeout(function () {
				store.set(this.note.id,{
					conent:editor.value,
					time:Date.now()
				})
				this.updateTime(Date.ms);
			}.bind(this),300);
		}.bind(this);

		this.note.addEventListener('mousedown',mousedownHandler);

		//add input event to store mem
		editor.addEventListener('input',inputHandler);

		//add rotate event
		var rotateHandler = function (e) {
			rotateIniX = e.clientX;
			rotateIniY = e.clientY;
			rotateNote = this.note;
			if (parseInt(rotateNote.style.zIndex) !== MaxIndex) {
				this.note.style.zIndex = ++MaxIndex;
			}
		}.bind(this);
		rotateBtn.addEventListener("mousedown",rotateHandler);
	}	

	/**
	 * save note description in localstorage
	 */
	Note.prototype.save = function () {
		var editor = $('.note-content',this.note);
		var noteId = this.note.id;
		var update_one = {
				conent:editor.value,
				time:Date.now(),
				zIndex:this.note.style.zIndex,
				left:this.note.offsetLeft,
				top:this.note.offsetTop,
				rotateAngle:this.note.style.transform,
				bgColor:this.note.style.backgroundColor,
				fontColor:this.note.style.color
			};
		store.set(noteId,update_one);
	}

	/**
	 * update last change time 
	 */
	Note.prototype.updateTime = function (ms) {
		var node = $('.time',this.note);
		var ts = ms||Date.now();
		node.innerHTML = util.formatTime(ts);
	}

	/**
	 * Dom load event
	 */
	document.addEventListener('DOMContentLoaded',function (e) {
		/**
		 * add click event to button
		 */
		$('#newNoteBtn').addEventListener('click',function (e) {
			var left = Math.floor(Math.random()*(document.documentElement.clientWidth - 190));
			var top = Math.floor(Math.random()*(document.documentElement.clientHeight - 234));
			var fontColorArray = util.getRandomColorArray(0,80);
			var fontColor = util.formatRgbArrayToColor(fontColorArray);
			var bgColor = util.formatRgbArrayToColor(util.getContrastColorArray(fontColorArray));

			var note = new Note({
				left : left,
				top : top,
				noteId : 'note-'+Date.now(),
				fontColor : fontColor,
				bgColor : bgColor
			});
			note.save();
			var now = new Date();
			note.updateTime(now);
		});
		/**
		 * add clear note button event 
		 */
		$('#clearAll').addEventListener('click',function (e) {
			var isClearAll = confirm('this gona clear all notes,sure???');
			if(isClearAll){
				localStorage.clear();
				location.reload();
			}
		});

		$('#orderNote').addEventListener('click',function (e) {
			var currentMaxZindex = MaxIndex;
			var timeArray = [];
			var notes = store.getAll();
			for(key in notes){
				timeArray.push(notes[key].time);
			}
			timeArray.sort(function (a,b) {
				return a > b ? true : false;
			}).reverse();
			for(time in timeArray){
				for(key in notes){
					console.log(timeArray[time] + "---" + key+"-MaxIndex:"+MaxIndex) ;
					if (notes[key].time === timeArray[time]) { 
						var inorderLeft = null;
						if (time/21 >= 1) {
							var lineOrder = (time%21)
							inorderLeft = -(lineOrder%7)*10+160+Math.floor(lineOrder/7)*460;
						}else{
							inorderLeft = -(time%7)*10+160+Math.floor(time/7)*460;
						}
						var inorderTop = -(time%7)*10+100+Math.floor(time/21)*450;
						var inorderRotate = 'rotate('+(4-(time%7))*20+'deg)';
						var inorderZindex = currentMaxZindex--;

						$('#'+key).style.zIndex = inorderZindex;
						$('#'+key).style.left = inorderLeft +'px';
						$('#'+key).style.top = inorderTop +'px';
						$('#'+key).style.transform = inorderRotate;
						store.set(key,{
							left : inorderLeft,
							top : inorderTop,
							rotateAngle : inorderRotate,
							zIndex : inorderZindex
						});
						break;
					}
				}		
			}
		});
		/**
		 * things after drag done 
		 */
		var mouseupHandler = function (e) {
			if (moveNote) {
				store.set(moveNote.id,{
					left:moveNote.offsetLeft,
					top : moveNote.offsetTop,
					zIndex : MaxIndex
				});
			}
			if(rotateNote) {
				console.log(rotateNote.id + "save angle");
				store.set(rotateNote.id,{
					rotateAngle : rotateNote.style.transform,
					zIndex : MaxIndex
				});
			}
			moveNote = null;
			rotateNote = null;
		}

		/**
		 * drag
		 */
		var mousemoveHandler = function (e) {
			if (moveNote && !rotateNote) {
				moveNote.style.left = e.clientX - startX + 'px';
				moveNote.style.top = e.clientY - startY + 'px';
			}
			if(rotateNote) {
				var coreX = rotateNote.offsetLeft + rotateNote.offsetWidth/2;
				var coreY = rotateNote.offsetTop + rotateNote.offsetHeight/2 + 40;

				var cacAngle = null;
				var offsetAngle = Math.atan(moveNote.offsetHeight/moveNote.offsetWidth)*180/Math.PI;

				if (e.clientX < coreX ) {
					cacAngle = Math.atan((e.clientY - coreY)/(e.clientX - coreX))*180/3.14 - 180 + offsetAngle;
				}else if (e.clientX > coreX && e.clientY > coreY){
					cacAngle = Math.atan((e.clientY - coreY)/(e.clientX - coreX))*180/3.14 + offsetAngle;
				}else if (e.clientX > coreX && e.clientY < coreY){
					cacAngle = -Math.atan((e.clientY - coreY)/(e.clientX - coreX))*180/3.14 - offsetAngle;
					if (cacAngle > offsetAngle) {
						cacAngle = cacAngle + offsetAngle;
					}else {
						cacAngle = -cacAngle;
					}
				}else {
					cacAngle = -(Math.atan((e.clientY - coreY)/(e.clientX - coreX))*180/3.14 - offsetAngle);
				}
				rotateInfo = "rotate("+cacAngle+"deg)";
				rotateNote.style.transform = rotateInfo;


			}
		}
		document.addEventListener('mousemove',mousemoveHandler);
		document.addEventListener('mouseup',mouseupHandler);

		/**
		 * initial note use information from localstorage
		 */
		var notes = store.getAll();

		Object.keys(notes).forEach(function (id) {
			if (notes[id].zIndex>MaxIndex) {
				MaxIndex = notes[id].zIndex;
			}
			new Note(Object.assign(notes[id],{
				noteId : id
			}));
		});
	})
})(app.util,app.store);