
function AgendaEventRenderer() {
	var t = this;
	
	
	// exports
	t.renderEvents = renderEvents;
	t.compileDaySegs = compileDaySegs; // for DayEventRenderer
	t.clearEvents = clearEvents;
	t.slotSegHtml = slotSegHtml;
	t.bindDaySeg = bindDaySeg;
	t.renderEventsSimplified = renderEventsSimplified;
	t.renderEventMarkers = renderEventMarkers;
	t.updateEventNoRerender = updateEventNoRerender;

	
	
	// imports
	DayEventRenderer.call(t);
	var opt = t.opt;
	var trigger = t.trigger;
	//var setOverflowHidden = t.setOverflowHidden;
	var isEventDraggable = t.isEventDraggable;
	var isEventResizable = t.isEventResizable;
	var eventEnd = t.eventEnd;
	var reportEvents = t.reportEvents;
	var reportEventClear = t.reportEventClear;
	var eventElementHandlers = t.eventElementHandlers;
	var setHeight = t.setHeight;
	var getDaySegmentContainer = t.getDaySegmentContainer;
	var getSlotSegmentContainer = t.getSlotSegmentContainer;
	var getHoverListener = t.getHoverListener;
	var getMaxMinute = t.getMaxMinute;
	var getMinMinute = t.getMinMinute;
	var timePosition = t.timePosition;
	var timePositionBottom = t.timePositionBottom;
	var colContentLeft = t.colContentLeft;
	var colContentRight = t.colContentRight;
	var renderDaySegs = t.renderDaySegs;
	var renderDaySegsSimplified = t.renderDaySegsSimplified;
	var renderEventMarkersDaySeg = t.renderEventMarkersDaySeg;
	var resizableDayEvent = t.resizableDayEvent; // TODO: streamline binding architecture
	var getColCnt = t.getColCnt;
	var getColWidth = t.getColWidth;
	var getSlotHeight = t.getSlotHeight;
	var getBodyContent = t.getBodyContent;
	var reportEventElement = t.reportEventElement;
	var showEvents = t.showEvents;
	var hideEvents = t.hideEvents;
	var eventDrop = t.eventDrop;
	var eventResize = t.eventResize;
	var renderDayOverlay = t.renderDayOverlay;
	var clearOverlays = t.clearOverlays;
	var calendar = t.calendar;
	var formatDate = calendar.formatDate;
	var formatDates = calendar.formatDates;
	var timeLineInterval;
	var isDragging;
	
	
	// Here we only update the even in the dom
	// We trigger this function only when the event start/end/allDay didn't change
	function updateEventNoRerender(event) {
		var eventID = event.id;
		var container = getSlotSegmentContainer();
		if (event.allDay) {
			container = getDaySegmentContainer();
		}
		if (!container) { return; }
		var eventElement = container.find('[data-event-id="' + eventID + '"]');
		eventElement.each(function () {
			var el = $(this);

			var classes = ['fc-event', 'fc-event-skin', 'fc-event-vert'];
			if (isEventDraggable(event)) {
				classes.push('fc-event-draggable');
			}
			classes = classes.concat(event.className);
			if (event.source) {
				classes = classes.concat(event.source.className || []);
			}
			el.attr('class', classes.join(' '));

			el.find('.event-title-txt').html(htmlEscape(event.title));
			el.find('.event-timezone').html((event.timezone ? event.timezone : ''));

			var textColor = event.color;
			var backgroundColor = event.backgroundColor || event.color;
			var borderColor = event.borderColor || event.color;
			var secondaryBorderColor = event.secondaryBorderColor || null;

			var cssStyles = {};
			if (backgroundColor) {
				cssStyles['backgroundColor'] = backgroundColor;
			}
			if (borderColor) {
				cssStyles['borderColor'] = borderColor;
			}
			if (secondaryBorderColor) {
				cssStyles['border-right-color'] = secondaryBorderColor;
				cssStyles['border-bottom-color'] = secondaryBorderColor;
			}
			if (textColor) {
				cssStyles['color'] = textColor;
			}

			el.css(cssStyles);
			el.find('.fc-event-skin').css(cssStyles);

			if (secondaryBorderColor) {
				el.css('backgroundColor', secondaryBorderColor);
			}
		});
	}

	/* Rendering
	----------------------------------------------------------------------------*/
	function renderEventMarkers (events, classNames) {
		var i, len=events.length,
			dayEvents=[],
			slotEvents=[];
		for (i=0; i<len; i++) {
			if (events[i].allDay) {
				dayEvents.push(events[i]);
			}else{
				slotEvents.push(events[i]);
			}
		}
		// clear both segments
		getSlotSegmentContainer().find('.fc-event-marker').remove();
		getDaySegmentContainer().find('.fc-event-marker').remove();

		if (opt('allDaySlot') && dayEvents.length > 0) {
			renderEventMarkersDaySeg(compileDaySegs(dayEvents), classNames);
		}
		if (slotEvents.length > 0) {
			renderEventMarkersSlotSeg(compileSlotSegs(slotEvents), classNames);
		}
	}

	function renderEventsSimplified (events, classNames) {
		var i, len=events.length,
			dayEvents=[],
			slotEvents=[];
		for (i=0; i<len; i++) {
			if (events[i].allDay) {
				dayEvents.push(events[i]);
			}else{
				slotEvents.push(events[i]);
			}
		}
		
		if (opt('allDaySlot') && dayEvents.length > 0) {
			renderDaySegsSimplified(compileDaySegs(dayEvents), classNames);
		}
		if (slotEvents.length > 0) {
		    renderSlotSegsSimplified(compileSlotSegs(slotEvents), classNames);
		}
	}

	function renderEvents(events, modifiedEventId) {
		reportEvents(events);
		var i, len=events.length,
			dayEvents=[],
			slotEvents=[];
		for (i=0; i<len; i++) {
			if (events[i].allDay) {
				dayEvents.push(events[i]);
			}else{
				slotEvents.push(events[i]);
			}
		}

		if (isDragging) {
			// For now we are removing the drag-helper while the events are re-rendered to asure that the helper is always removed
			// This is pretty harsh though, as it could result in a drag being cancelled without the user knowing why
			$('body > .ui-draggable-dragging').remove();
			isDragging = false;
		}
		if (opt('allDaySlot')) {
			renderDaySegs(compileDaySegs(dayEvents), modifiedEventId);
			setHeight(); // no params means set to viewHeight
		}
		
		renderSlotSegs(compileSlotSegs(slotEvents), modifiedEventId);
		if (opt('currentTimeIndicator')) {
			window.clearInterval(timeLineInterval);
			timeLineInterval = window.setInterval(setTimeIndicator, 30000);
			setTimeIndicator();
		}
	}
	
	
	function clearEvents() {
		reportEventClear();
		getDaySegmentContainer().empty();
		getSlotSegmentContainer().empty();
	}
	
	
	function compileDaySegs(events) {
		var levels = stackSegs(sliceSegs(events, $.map(events, exclEndDay), t.visStart, t.visEnd)),
			i, levelCnt=levels.length, level,
			j, seg,
			segs=[];
		for (i=0; i<levelCnt; i++) {
			level = levels[i];
			for (j=0; j<level.length; j++) {
				seg = level[j];
				seg.row = 0;
				seg.level = i; // not needed anymore
				segs.push(seg);
			}
		}
		return segs;
	}
	
	
	function compileSlotSegs(events) {
		var colCnt = getColCnt(),
			minMinute = getMinMinute(),
			maxMinute = getMaxMinute(),
			d = addMinutes(cloneDate(t.visStart), minMinute),
			visEventEnds = $.map(events, slotEventEnd),
			i, col,
			j, level,
			k, seg,
			segs=[];
		for (i=0; i<colCnt; i++) {
			col = stackSegs(sliceSegs(events, visEventEnds, d, addMinutes(cloneDate(d), maxMinute-minMinute)));
			countForwardSegs(col);
			for (j=0; j<col.length; j++) {
				level = col[j];
				for (k=0; k<level.length; k++) {
					seg = level[k];
					seg.col = i;
					seg.level = j;
					segs.push(seg);
				}
			}
			addDays(d, 1, true);
		}
		return segs;
	}
	
	
	function slotEventEnd(event) {
		if (event.end) {
			return cloneDate(event.end);
		}else{
			return addMinutes(cloneDate(event.start), opt('defaultEventMinutes'));
		}
	}
	
	// Render events in a simplified manner in the 'time slots' at the bottom
    function renderSlotSegsSimplified (segs, classNames) {
        var i, segCnt=segs.length, seg,
    		event,
    		eventElement,
    		top, bottom,
    		colI, levelI, forward,
    		leftmost,
    		outerWidth,
    		left,
    		html='',
    		slotSegmentContainer = getSlotSegmentContainer(),
    		rtl, dis, dit,
    		colCnt = getColCnt(),
    		overlapping = colCnt > 1,
    		existing;

    	if (rtl = opt('isRTL')) {
    		dis = -1;
    		dit = colCnt - 1;
    	}else{
    		dis = 1;
    		dit = 0;
    	}
        
          for (i=0; i<segCnt; i++) {
              seg = segs[i];
              event = seg.event;
              if (event.fromBottom) {
              	seg.top = timePositionBottom(seg.start, seg.start);
              	seg.bottom = timePositionBottom(seg.start, seg.end);	
              } else {
              	seg.top = timePosition(seg.start, seg.start);
              	seg.bottom = timePosition(seg.start, seg.end);
              }
              colI = seg.col;
              levelI = seg.level;
              forward = seg.forward || 0;
              leftmost = colContentLeft(colI*dis + dit);
              seg.outerWidth = 2;
              seg.outerHeight = Math.abs(seg.bottom - seg.top);
              seg.left = leftmost;
              html += slotSegSimplifiedHtml(event, seg, classNames);
          }
          if (event) {
          	existing = slotSegmentContainer.find('.fc-event-simplified[data-event-id="'+event.id+'"]');
          	if (existing.length === 0) {
				eventElement = $(html).css('display', 'none').appendTo(slotSegmentContainer);
				eventElement.slideDown("fast");
          	} else {
          		eventElement = $(html).replaceAll(existing);
          	}
          	bindSlotSeg(event, eventElement, seg);
	      }
          return;
    }

    // Render events in a simplified manner in the 'time slots' at the bottom
    function renderEventMarkersSlotSeg (segs, classNames) {
        var i, segCnt=segs.length, seg,
    		event,
    		eventElement,
    		top, bottom,
    		colI, levelI, forward,
    		leftmost,
    		outerWidth,
    		left,
    		html='',
    		slotSegmentContainer = getSlotSegmentContainer(),
    		rtl, dis, dit,
    		colCnt = getColCnt(),
    		overlapping = colCnt > 1,
    		existing,
    		lastVerticalPosition, shifts = 0,
    		positions = {},
    		p;

    	if (rtl = opt('isRTL')) {
    		dis = -1;
    		dit = colCnt - 1;
    	}else{
    		dis = 1;
    		dit = 0;
    	}
        
          for (i=0; i<segCnt; i++) {
              seg = segs[i];
              event = seg.event;
              seg.top = timePosition(seg.start, seg.start);
              colI = seg.col;
              levelI = seg.level;
              forward = seg.forward || 0;
              leftmost = colContentLeft(colI*dis + dit);
              seg.outerWidth = 2;
              seg.outerHeight = Math.abs(seg.bottom - seg.top);
              seg.left = leftmost;

              /**
              * shift the marker to the right if there was already a marker on about the same height
              * By filling object with mapping of left position and rounded top-position
              * and if position was encountered before increase seg.left and increment the position mapping
              * is done with an object as the incoming events don't need to be sorted
              */
              p = seg.left+'_'+Math.round(seg.top/10)*10;
              if (positions[p]) {
              	seg.left += 15*positions[p];
              	positions[p]++;
              } else {
              	positions[p] = 1;
              }

              html += eventMarkerHtml(event, seg, classNames);
          }
          if (event) {
          	existing = slotSegmentContainer.find('.fc-event-marker[data-event-id="'+event.id+'"]');
          	if (existing.length === 0) {
				eventElement = $(html).appendTo(slotSegmentContainer);
          	} else {
          		eventElement = $(html).replaceAll(existing);
          	}
	      }
          return;
    }
	
	// renders events in the 'time slots' at the bottom
	
	function renderSlotSegs(segs, modifiedEventId) {
	
		var i, segCnt=segs.length, seg,
			event,
			classes,
			top, bottom,
			colI, levelI, forward,
			leftmost,
			availWidth,
			outerWidth,
			left,
			html='',
			eventElements,
			eventElement,
			triggerRes,
			vsideCache={},
			hsideCache={},
			key, val,
			contentElement,
			height,
			slotSegmentContainer = getSlotSegmentContainer(),
			rtl, dis, dit,
			colCnt = getColCnt(),
			overlapping = colCnt > 1;
			
		if (rtl = opt('isRTL')) {
			dis = -1;
			dit = colCnt - 1;
		}else{
			dis = 1;
			dit = 0;
		}
			
		// calculate position/dimensions, create html
		for (i=0; i<segCnt; i++) {
			seg = segs[i];
			event = seg.event;
			top = timePosition(seg.start, seg.start);
			bottom = timePosition(seg.start, seg.end);
			colI = seg.col;
			levelI = seg.level;
			forward = seg.forward || 0;
			leftmost = colContentLeft(colI*dis + dit);
			availWidth = colContentRight(colI*dis + dit) - leftmost;
			availWidth = Math.min(availWidth-6, availWidth*.95); // TODO: move this to CSS
			if (levelI) {
				// indented and thin
				outerWidth = availWidth / (levelI + forward + 1);
			}else{
				if (forward) {
					if (overlapping) {	// moderately wide, aligned left still
						outerWidth = ((availWidth / (forward + 1)) - (12/2)) * 2; // 12 is the predicted width of resizer =
					}else{
						outerWidth = outerWidth = availWidth / (forward + 1);
					}
				}else{
					// can be entire width, aligned left
					outerWidth = availWidth;
				}
			}
			left = leftmost +                                  // leftmost possible
				(availWidth / (levelI + forward + 1) * levelI) // indentation
				* dis + (rtl ? availWidth - outerWidth : 0);   // rtl
			seg.top = top;
			seg.left = left;
			seg.outerWidth = outerWidth - (overlapping ? 0 : 1);
			seg.outerHeight = bottom - top;
			html += slotSegHtml(event, seg);
		}
		slotSegmentContainer[0].innerHTML = html; // faster than html()
		eventElements = slotSegmentContainer.children();
		
		// retrieve elements, run through eventRender callback, bind event handlers
		for (i=0; i<segCnt; i++) {
			seg = segs[i];
			event = seg.event;
			eventElement = $(eventElements[i]); // faster than eq()
			triggerRes = trigger('eventRender', event, event, eventElement);
			if (triggerRes === false) {
				eventElement.remove();
			}else{
				if (triggerRes && triggerRes !== true) {
					eventElement.remove();
					eventElement = $(triggerRes)
						.css({
							position: 'absolute',
							top: seg.top,
							left: seg.left
						})
						.appendTo(slotSegmentContainer);
				}
				seg.element = eventElement;
				if (event._id === modifiedEventId) {
					bindSlotSeg(event, eventElement, seg);
				}else{
					eventElement[0]._fci = i; // for lazySegBind
				}
				reportEventElement(event, eventElement);
			}
		}
		
		lazySegBind(slotSegmentContainer, segs, bindSlotSeg);
		
		// record event sides and title positions
		for (i=0; i<segCnt; i++) {
			seg = segs[i];
			if (eventElement = seg.element) {
				val = vsideCache[key = seg.key = cssKey(eventElement[0])];
				seg.vsides = val === undefined ? (vsideCache[key] = vsides(eventElement, true)) : val;
				val = hsideCache[key];
				seg.hsides = val === undefined ? (hsideCache[key] = hsides(eventElement, true)) : val;
				contentElement = eventElement.find('div.fc-event-content');
				if (contentElement.length) {
					seg.contentTop = contentElement[0].offsetTop;
				}
			}
		}
		
		// set all positions/dimensions at once
		for (i=0; i<segCnt; i++) {
			seg = segs[i];
			if (eventElement = seg.element) {
				eventElement[0].style.width = Math.max(0, seg.outerWidth - seg.hsides) + 'px';
				height = Math.max(0, seg.outerHeight - seg.vsides);
				eventElement[0].style.height = height + 'px';
				event = seg.event;
				if (seg.contentTop !== undefined && height - seg.contentTop < 10) {
					// not enough room for title, put it in the time header
					eventElement.find('div.fc-event-time')
						.html(htmlEscape(formatDate(event.start, opt('timeFormat'))) + ' ' + (event.timezone ? htmlEscape(event.timezone) + ' - ' : '') + "<span class='event-title-txt'>" + htmlEscape(event.title) + "</span>");
					eventElement.find('div.fc-event-title')
						.remove();
				}
				trigger('eventAfterRender', event, event, eventElement);
			}
		}
					
	}
		
	function eventMarkerHtml (event, seg, classNames) {
		var html = "<a class='fc-event-marker' href='#event-marker' data-event-id='" + event.id + "' style=display:block;position:absolute;z-index:8;top:" + seg.top + "px;left:" + (seg.left) + "px;background:"+event.colors[0]+";'></a>";
		return html;
	}

	function slotSegSimplifiedHtml (event, seg, classNames) {
        var skinCss = getSkinCss(event, opt);
        var daycol = $('.fc-col0:first', t.element);
        var daycolWidth = daycol.width() - 10; // TODO: This should not always be 10 (like in the day view), should be related to seg.hsides (which is not calculated for the simplified segs atm)
        var skinCssAttr = (skinCss ? " style='" + skinCss + "'" : '');
        var defaultClasses = ['fc-event', 'fc-event-skin', 'fc-event-vert', 'fc-event-simplified'];
        var classes = classNames ? defaultClasses.concat(classNames) : defaultClasses;
        var verticalPosition = event.fromBottom ? "bottom:" + (seg.bottom) + "px;" : "top:" + seg.top + "px;";
	    var html = "<div data-event-id='" + event.id + "' style='position:absolute;z-index:8; width: " + daycolWidth + "px ;" + verticalPosition + "left:" + (seg.left - 2) + "px;height:" + seg.outerHeight + "px;" + skinCss + "' class='" + classes.join(' ') + "'>"+
	    (event.title ? htmlEscape(event.title) : "") +
	    " </div>";
	    
	    return html;
	}
	
	function slotSegHtml(event, seg) {
		var html = "<";
		var url = event.url;
		var skinCss = getSkinCss(event, opt);
		var skinCssAttr = (skinCss ? " style='" + skinCss + "'" : '');
		var classes = ['fc-event', 'fc-event-vert'];
		var secondaryBorderColor = event.secondaryBorderColor || null;
		var borderColor = event.borderColor || event.color;
		var mainDivSkinCss = '';
		if (isEventDraggable(event)) {
			classes.push('fc-event-draggable');
		}
		if (secondaryBorderColor) {
			mainDivSkinCss = 'border-left-color:' + borderColor + '; border-top-color:' + borderColor + '; border-right-color:' + secondaryBorderColor + '; border-bottom-color:' + secondaryBorderColor + '; background-color: ' + secondaryBorderColor + ';';
		} else {
			mainDivSkinCss = 'border-color:' + borderColor + ';';
		}
        
        // THESE ARE FAKED ROUNDED CORNERS
        // if (seg.isStart) {
        //     classes.push('fc-corner-top');
        // }
        // if (seg.isEnd) {
        //     classes.push('fc-corner-bottom');
        // }
		classes = classes.concat(event.className);
		if (event.source) {
			classes = classes.concat(event.source.className || []);
		}
		if (url) {
			html += "a href='" + htmlEscape(event.url) + "'";
		}else{
			html += "div";
		}
		html +=
			" data-event-id='" + event.id + "'" +
			" class='" + classes.join(' ') + "'" +
			" style='position:absolute;z-index:8;top:" + seg.top + "px;left:" + seg.left + "px; " + mainDivSkinCss + "'" + 
			">" +
			"<div class='fc-event-inner fc-event-skin'" + skinCssAttr + ">" +
			"<div class='fc-event-head fc-event-skin'" + skinCssAttr + ">" +
			"<div class='fc-event-time'><span class='event-time'>" +
			htmlEscape(formatDates(event.start, event.end, opt('timeFormat'))) +
			"</span></div>" +
			"</div>" +
			"<div class='fc-event-content'>" +
			"<div class='fc-event-title'>" +
			"<span class='event-timezone'>" + (event.timezone ? event.timezone : '') + " </span>" +
			"<span class='event-title-txt'>" + htmlEscape(event.title) + " </span>" +
			"</div>" +
			"</div>" +
			"<div class='fc-event-bg'></div>" +
			"</div>" + // close inner
			"<span class='event-badges'></span>" +
			"<span class='event-icons'></span>";
		if (seg.isEnd && isEventResizable(event)) {
			html +=
				"<div class='ui-resizable-handle ui-resizable-s'>=</div>";
		}
		html +=
			"</" + (url ? "a" : "div") + ">";
		return html;
	}
	
	
	function bindDaySeg(event, eventElement, seg) {
		if (isEventDraggable(event)) {
			draggableDayEvent(event, eventElement, seg.isStart);
		}
		if (seg.isEnd && isEventResizable(event)) {
			resizableDayEvent(event, eventElement, seg);
		}
		eventElementHandlers(event, eventElement);
			// needs to be after, because resizableDayEvent might stopImmediatePropagation on click
	}
	
	
	function bindSlotSeg(event, eventElement, seg) {
		var timeElement = eventElement.find('div.fc-event-time');
		if (isEventDraggable(event)) {
			draggableSlotEvent(event, eventElement, timeElement);
		}
		if (seg.isEnd && isEventResizable(event)) {
			resizableSlotEvent(event, eventElement, timeElement);
		}
		eventElementHandlers(event, eventElement);
	}
	
	
	// draw a horizontal line indicating the current time (#143)
	function setTimeIndicator()
	{
		var container = getBodyContent();
		var timeline = container.children('.fc-timeline');
		if (timeline.length == 0) { // if timeline isn't there, add it
			timeline = $('<hr>').addClass('fc-timeline').appendTo(container);
		}

		var cur_time = new Date();
		if (t.visStart < cur_time && t.visEnd > cur_time) {
			timeline.show();
		}
		else {
			$('.fc-today', t.element).removeClass('fc-state-highlight').removeClass('fc-today');
			timeline.hide();
			return;
		}

		var dayId = dayIDs[cur_time.getDay()];
		if ( !$('.fc-widget-content.fc-today').hasClass('fc-' + dayId) ) {
			$('.fc-widget-content.fc-today').removeClass('fc-today').removeClass('fc-state-highlight');
			$('.fc-widget-content.fc-' + dayId).addClass('fc-today').addClass('fc-state-highlight');
		}

		var secs = (cur_time.getHours() * 60 * 60) + (cur_time.getMinutes() * 60) + cur_time.getSeconds();
		var percents = secs / 86400; // 24 * 60 * 60 = 86400, # of seconds in a day

		timeline.css('top', Math.floor(container.height() * percents - 1) + 'px');

		if (t.name == 'agendaWeek') { // week view, don't want the timeline to go the whole way across
			var daycol = $('.fc-today', t.element);
			var left = daycol.position().left + 1;
			var width = daycol.width();
			timeline.css({ left: left + 'px', width: width + 'px' });
		}
	}
	
	
	/* Dragging
	-----------------------------------------------------------------------------------*/
	
	
	// when event starts out FULL-DAY

	function draggableDayEvent(event, eventElement, isStart) {
		var origWidth;
		var origHeight;
		var revert;
		var allDay=true;
		var dayDelta;
		var dis = opt('isRTL') ? -1 : 1;
		var hoverListener = getHoverListener();
		var colWidth = getColWidth();
		var slotHeight = getSlotHeight();
		var minMinute = getMinMinute();
		var helperElement;
		eventElement.draggable({
			helper: 'clone',
			appendTo: 'body',
			zIndex: 9,
			opacity: opt('dragOpacity', 'month'), // use whatever the month view was using
			revertDuration: opt('dragRevertDuration'), // recommended to put this on zero, to be sure no cloned helpers stay floating around
			start: function(ev, ui) {
				isDragging = true;
				trigger('eventDragStart', eventElement, event, ev, ui);
				hideEvents(event, eventElement);
				origWidth = eventElement.width();
				origHeight = eventElement.height();
				eventElement.css('display', 'none');
				helperElement = ui.helper;
				// As the helper is no longer in the all-day bar, it becomes higher if not implicitly set
				helperElement.css('height', origHeight);
				hoverListener.start(function(cell, origCell, rowDelta, colDelta) {
					clearOverlays();
					if (cell) {
						//setOverflowHidden(true);
						revert = false;
						dayDelta = colDelta * dis;
						if (!cell.row) {
							// on full-days
							renderDayOverlay(
								addDays(cloneDate(event.start), dayDelta),
								addDays(exclEndDay(event), dayDelta)
							);
							resetElement();
						}else{
							// mouse is over bottom slots
							if (isStart) {
								if (allDay) {
									// convert event to temporary slot-event
									helperElement.width(colWidth - 10); // don't use entire width
									setOuterHeight(
										helperElement,
										slotHeight * Math.round(
											(event.end && event.end.getHours() !== 0 ? ((event.end - event.start) / MINUTE_MS) : opt('defaultEventMinutes')) / opt('slotMinutes')
										)
									);
									eventElement.draggable('option', 'grid', [colWidth, 1]);
									allDay = false;
								}
							}else{
								revert = true;
							}
						}
						revert = revert || (allDay && !dayDelta);
					}else{
						resetElement();
						eventElement.draggable('option', 'grid', null);
						revert = true;
					}
					eventElement.draggable('option', 'revert', revert);
				}, ev, 'drag');
			},
			stop: function(ev, ui) {
				hoverListener.stop();
				clearOverlays();

				if (revert) {
					// hasn't moved or is out of bounds (draggable has already reverted)
					resetElement();
					eventElement.css('filter', ''); // clear IE opacity side-effects
					showEvents(event, eventElement);
				}else{
					// changed!
					var minuteDelta = 0;
					if (!allDay) {
						minuteDelta = Math.round((helperElement.offset().top - getBodyContent().offset().top) / slotHeight)
							* opt('slotMinutes')
							+ minMinute
							- (event.start.getHours() * 60 + event.start.getMinutes());
					}
					eventDrop(this, event, dayDelta, minuteDelta, allDay, ev, ui);
				}
				eventElement.css('display', ''); // show() was causing display=inline
				trigger('eventDragStop', eventElement, event, ev, ui);
				isDragging = false;
				//setOverflowHidden(false);
			}
		});
		function resetElement() {
			if (!allDay) {
				helperElement
					.width(origWidth)
					.height(origHeight)
					.draggable('option', 'grid', null);
				allDay = true;
			}
		}
	}
	
	
	// when event starts out IN TIMESLOTS
	
	function draggableSlotEvent(event, eventElement, timeElement) {
		var origPosition;
		var allDay=false;
		var outsideGrid = false;
		var dayDelta;
		var minuteDelta;
		var prevMinuteDelta;
		var dis = opt('isRTL') ? -1 : 1;
		var hoverListener = getHoverListener();
		var colCnt = getColCnt();
		var colWidth = getColWidth();
		var slotHeight = getSlotHeight();
		var originalTopPosition, helperTimeElement;
		
		eventElement.draggable({
			helper: 'clone',
			appendTo: 'body',
			zIndex: 9,
			scroll: false,
			grid: [colWidth, slotHeight],
			// axis: colCnt==1 ? 'y' : false, // commented out, otherwise the dayView (1-column) didn't work
			opacity: opt('dragOpacity'),
			revertDuration: opt('dragRevertDuration'), // recommended to put this on zero, to be sure no cloned helpers stay floating around
			start: function(ev, ui) {
				isDragging = true;
				trigger('eventDragStart', eventElement, event, ev, ui);
				hideEvents(event, eventElement);
				origPosition = eventElement.position();
				eventElement.css('display', 'none');
				originalTopPosition = ev.pageY;
				helperTimeElement = ui.helper.find('div.fc-event-time');
				minuteDelta = prevMinuteDelta = 0;
				hoverListener.start(function(cell, origCell, rowDelta, colDelta) {
					eventElement.draggable('option', 'revert', !cell);
					clearOverlays();
					if (cell) {
						dayDelta = colDelta * dis;
						if (opt('allDaySlot') && !cell.row) {
							// over full days
							if (!allDay) {
								// convert to temporary all-day event
								allDay = true;
								timeElement.hide();
								eventElement.draggable('option', 'grid', null);
							}
							renderDayOverlay(
								addDays(cloneDate(event.start), dayDelta),
								addDays(exclEndDay(event), dayDelta)
							);
						}else{
							// on slots
							resetElement();
						}
					}else{
						// Setting outsideGrid so the revert function works as expected
						outsideGrid = true;
						eventElement.draggable('option', 'grid', null);
					}
				}, ev, 'drag');
			},
			drag: function(ev, ui) {
				minuteDelta = Math.round((ev.pageY - originalTopPosition) / slotHeight) * opt('slotMinutes');
				if (minuteDelta != prevMinuteDelta) {
					if (!allDay) {
						updateTimeText(minuteDelta);
					}
					prevMinuteDelta = minuteDelta;
				}
			},
			stop: function(ev, ui) {
				var cell = hoverListener.stop();
				clearOverlays();
				if (cell && (dayDelta || minuteDelta || allDay)) {
					// changed!
					eventDrop(this, event, dayDelta, allDay ? 0 : minuteDelta, allDay, ev, ui);
				}else{
					// either no change or out-of-bounds (draggable has already reverted)
					resetElement();
					eventElement.css('filter', ''); // clear IE opacity side-effects
					eventElement.css(origPosition); // sometimes fast drags make event revert to wrong position
					updateTimeText(0);
					showEvents(event, eventElement);
					eventElement.css('display', ''); // show() was causing display=inline
				}
				// moved the trigger after it is done, so all the logic of fullcalendar is done before we apply our own
				trigger('eventDragStop', eventElement, event, ev, ui);
				isDragging = false;
			}
		});
		function updateTimeText(minuteDelta) {
			var newStart = addMinutes(cloneDate(event.start), minuteDelta);
			var newEnd;
			if (event.end) {
				newEnd = addMinutes(cloneDate(event.end), minuteDelta);
			}
			var format = formatDates(newStart, newEnd, opt('timeFormat'));
			timeElement.text(format);
			helperTimeElement.text(format);
		}
		function resetElement() {
			// convert back to original slot-event
			if (allDay || outsideGrid) {
				timeElement.css('display', ''); // show() was causing display=inline
				eventElement.draggable('option', 'grid', [colWidth, slotHeight]);
				allDay = false;
				outsideGrid = false;
			}
		}
	}
	
	
	
	/* Resizing
	--------------------------------------------------------------------------------------*/
	
	
	function resizableSlotEvent(event, eventElement, timeElement) {
		var slotDelta, prevSlotDelta;
		var slotHeight = getSlotHeight();
		eventElement.resizable({
			handles: {
				s: 'div.ui-resizable-s'
			},
			grid: slotHeight,
			start: function(ev, ui) {
				slotDelta = prevSlotDelta = 0;
				hideEvents(event, eventElement);
				eventElement.css('z-index', 9);
				trigger('eventResizeStart', this, event, ev, ui);
			},
			resize: function(ev, ui) {
				// don't rely on ui.size.height, doesn't take grid into account
				slotDelta = Math.round((Math.max(slotHeight, eventElement.height()) - ui.originalSize.height) / slotHeight);
				if (slotDelta != prevSlotDelta) {
					timeElement.text(
						formatDates(
							event.start,
							(!slotDelta && !event.end) ? null : // no change, so don't display time range
								addMinutes(eventEnd(event), opt('slotMinutes')*slotDelta),
							opt('timeFormat')
						)
					);
					prevSlotDelta = slotDelta;
				}
			},
			stop: function(ev, ui) {
				trigger('eventResizeStop', this, event, ev, ui);
				if (slotDelta) {
					eventResize(this, event, 0, opt('slotMinutes')*slotDelta, ev, ui);
				}else{
					eventElement.css('z-index', 8);
					showEvents(event, eventElement);
					// BUG: if event was really short, need to put title back in span
				}
			}
		});
	}
	

}


function countForwardSegs(levels) {
	var i, j, k, level, segForward, segBack;
	for (i=levels.length-1; i>0; i--) {
		level = levels[i];
		for (j=0; j<level.length; j++) {
			segForward = level[j];
			for (k=0; k<levels[i-1].length; k++) {
				segBack = levels[i-1][k];
				if (segsCollide(segForward, segBack)) {
					segBack.forward = Math.max(segBack.forward||0, (segForward.forward||0)+1);
				}
			}
		}
	}
}


