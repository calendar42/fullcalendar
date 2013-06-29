
function DayEventRenderer() {
	var t = this;


	// exports
	t.renderDaySegs = renderDaySegs;
	t.resizableDayEvent = resizableDayEvent;
	t.renderDaySegsSimplified = renderDaySegsSimplified;
	t.renderEventMarkersDaySeg = renderEventMarkersDaySeg;


	// imports
	var opt = t.opt;
	var trigger = t.trigger;
	var isEventDraggable = t.isEventDraggable;
	var isEventResizable = t.isEventResizable;
	var eventEnd = t.eventEnd;
	var reportEventElement = t.reportEventElement;
	var showEvents = t.showEvents;
	var hideEvents = t.hideEvents;
	var eventResize = t.eventResize;
	var getRowCnt = t.getRowCnt;
	var getColCnt = t.getColCnt;
	var getColWidth = t.getColWidth;
	var allDayRow = t.allDayRow;
	var allDayBounds = t.allDayBounds;
	var colContentLeft = t.colContentLeft;
	var colContentRight = t.colContentRight;
	var dayOfWeekCol = t.dayOfWeekCol;
	var dateCell = t.dateCell;
	var compileDaySegs = t.compileDaySegs;
	var getDaySegmentContainer = t.getDaySegmentContainer;
	var bindDaySeg = t.bindDaySeg; //TODO: streamline this
	var formatDates = t.calendar.formatDates;
	var renderDayOverlay = t.renderDayOverlay;
	var clearOverlays = t.clearOverlays;
	var clearSelection = t.clearSelection;
	var eventMarkerTemplate = t.eventMarkerTemplate;


	/* Rendering
	-----------------------------------------------------------------------------*/

	function renderEventMarkersDaySeg(segs, classNames) {
		var segmentContainer = getDaySegmentContainer();
		segmentContainer.append(eventMarkersDaySegHtml(segs), classNames);
	}

	function eventMarkersDaySegHtml (segs, classNames) {
		var html = '';
		var segCnt = segs.length;
		var popupplacement = 'bottom';
		var top = 'auto';
		var seg, event, leftCol, left, positions = {}, p;

		for (i=0; i<segCnt; i++) {
			seg = segs[i];
			event = seg.event;
			leftCol = dayOfWeekCol(seg.start.getDay());
			left = colContentLeft(leftCol);
			/**
			* shift the marker to the right if there was already a marker in the same column
			* By filling object with mapping of left position
			* and if position was encountered before increase left and increment the position mapping
			* is done with an object as the incoming events don't need to be sorted
			*/
			p = left;
			if (positions[p]) {
				left += 15*positions[p];
				positions[p]++;
			} else {
				positions[p] = 1;
			}
			html += t.eventMarkerTemplate(event, top, left, popupplacement);
		}
		return html;
	}

	function renderDaySegsSimplified(segs, classNames) {
		var segmentContainer = getDaySegmentContainer();
		segmentContainer.append(daySegSimplifiedHTML(segs), classNames);
	}

    function daySegSimplifiedHTML(segs, classNames) {
    	var rtl = opt('isRTL');
    	var i;
    	var segCnt=segs.length;
    	var seg;
    	var event;
    	var classes;
    	var bounds = allDayBounds();
    	var minLeft = bounds.left;
    	var maxLeft = bounds.right;
    	var leftCol;
    	var rightCol;
    	var left;
    	var right;
    	var skinCss;
    	var html = '';
    	// calculate desired position/dimensions, create html
    	for (i=0; i<segCnt; i++) {
    		seg = segs[i];
    		event = seg.event;
    		defaultClasses = ['fc-event', 'fc-event-skin', 'fc-event-hori', 'fc-event-simplified'];
    		classes = classNames ? defaultClasses.concat(classNames) : defaultClasses;
    		if (rtl) {
                
                // CREATES FAKE ROUNDED CORNERS
                // if (seg.isStart) {
                //     classes.push('fc-corner-right');
                // }
                // if (seg.isEnd) {
                //     classes.push('fc-corner-left');
                // }
    			leftCol = dayOfWeekCol(seg.end.getDay()-1);
    			rightCol = dayOfWeekCol(seg.start.getDay());
    			left = seg.isEnd ? colContentLeft(leftCol) : minLeft;
    			right = seg.isStart ? colContentRight(rightCol) : maxLeft;
    		}else{
                
                // CREATES FAKE ROUNDED CORNERS
    			// if (seg.isStart) {
    			//                     classes.push('fc-corner-left');
    			//                 }
    			//                 if (seg.isEnd) {
    			//                     classes.push('fc-corner-right');
    			//                 }
    			leftCol = dayOfWeekCol(seg.start.getDay());
    			rightCol = dayOfWeekCol(seg.end.getDay()-1);
    			left = seg.isStart ? colContentLeft(leftCol) : minLeft;
    			right = seg.isEnd ? colContentRight(rightCol) : maxLeft;
    		}
    		classes = classes.concat(event.className);
    		if (event.source) {
    			classes = classes.concat(event.source.className || []);
    		}
    		skinCss = getSkinCss(event, opt);

    		seg.left = left;
    		seg.outerWidth = right - left;
    		seg.startCol = leftCol;
    		seg.endCol = rightCol + 1; // needs to be exclusive

    		html +=
    			"<div" +
				" data-event-id='" + event.id + "'" +
    			" class='" + classes.join(' ') + "'" +
    			" style='position:absolute;z-index:8;height:2px;left:"+left+"px;width:" + seg.outerWidth + "px;" + skinCss + "'" +
    			">" +
    			"<div" +
    			" class='fc-event-inner fc-event-skin'" +
    			(skinCss ? " style='" + skinCss + "'" : '') +
    			"></div></div>";
    	}
    	return html;
    }
	
	
	function renderDaySegs(segs, modifiedEventId) {
		var segmentContainer = getDaySegmentContainer();
		var rowDivs;
		var rowCnt = getRowCnt();
		var colCnt = getColCnt();
		var i = 0;
		var rowI;
		var levelI;
		var colHeights;
		var j;
		var segCnt = segs.length;
		var seg;
		var top;
		var k;
		var overflows;
		var overflowLinks;
		var maxHeight = opt('maxHeight');
		segmentContainer[0].innerHTML = daySegHTML(segs); // faster than .html()
		daySegElementResolve(segs, segmentContainer.children());
		daySegElementReport(segs);
		daySegHandlers(segs, segmentContainer, modifiedEventId);
		daySegCalcHSides(segs);
		daySegSetWidths(segs);
		daySegCalcHeights(segs);
		rowDivs = getRowDivs();
		// set row heights, calculate event tops (in relation to row top)
		for (rowI=0; rowI<rowCnt; rowI++) {
			levelI = 0;
			overflows = [];
			overflowLinks = {};
			colHeights = [];
			for (j=0; j<colCnt; j++) {
				overflows[j] = 0;
				colHeights[j] = 0;
			}
			while (i<segCnt && (seg = segs[i]).row == rowI) {
				// loop through segs in a row
				top = arrayMax(colHeights.slice(seg.startCol, seg.endCol));
				if (maxHeight && top + seg.outerHeight > maxHeight) {
					seg.overflow = true;
				}
				else {
					seg.top = top;
					top += seg.outerHeight;
				}
				for (k=seg.startCol; k<seg.endCol; k++) {
					if (overflows[k])
						seg.overflow = true;
					if (seg.overflow) {
						if (seg.isStart && !overflowLinks[k])
							overflowLinks[k] = { seg:seg, top:top, date:cloneDate(seg.start, true), count:0 };
						if (overflowLinks[k])
							overflowLinks[k].count++;
						overflows[k]++;
					}
					else
						colHeights[k] = top;
				}
				i++;
			}
			rowDivs[rowI].height(arrayMax(colHeights));
			renderOverflowLinks(overflowLinks, rowDivs[rowI]);
		}
		daySegSetTops(segs, getRowTops(rowDivs));
	}
	
	
	function renderOverflowLinks(overflowLinks, rowDiv) {
		var container = getDaySegmentContainer();
		var colCnt = getColCnt();
		var element, triggerRes, link;
		for (var j=0; j<colCnt; j++) {
			if ((link = overflowLinks[j])) {
				if (link.count > 1) {
					element = $('<a>').addClass('fc-more-link').html('+'+link.count).appendTo(container);
					element[0].style.position = 'absolute';
					element[0].style.left = link.seg.left + 'px';
					element[0].style.top = (link.top + rowDiv[0].offsetTop) + 'px';
					triggerRes = trigger('overflowRender', link, { count:link.count, date:link.date }, element);
					if (triggerRes === false)
						element.remove();
				}
				else {
					link.seg.top = link.top;
					link.seg.overflow = false;
				}
			}
		}
	}
	
	
	function renderTempDaySegs(segs, adjustRow, adjustTop) {
		var tempContainer = $("<div/>");
		var elements;
		var segmentContainer = getDaySegmentContainer();
		var i;
		var segCnt = segs.length;
		var element;
		tempContainer[0].innerHTML = daySegHTML(segs); // faster than .html()
		elements = tempContainer.children();
		segmentContainer.append(elements);
		daySegElementResolve(segs, elements);
		daySegCalcHSides(segs);
		daySegSetWidths(segs);
		daySegCalcHeights(segs);
		daySegSetTops(segs, getRowTops(getRowDivs()));
		elements = [];
		for (i=0; i<segCnt; i++) {
			element = segs[i].element;
			if (element) {
				if (segs[i].row === adjustRow) {
					element.css('top', adjustTop);
				}
				elements.push(element[0]);
			}
		}
		return $(elements);
	}
	
	
	function daySegHTML(segs) { // also sets seg.left and seg.outerWidth
		var rtl = opt('isRTL');
		var i;
		var segCnt=segs.length;
		var seg;
		var event;
		var url;
		var classes;
		var bounds = allDayBounds();
		var minLeft = bounds.left;
		var maxLeft = bounds.right;
		var leftCol;
		var rightCol;
		var left;
		var right;
		var skinCss;
		var html = '';
		// calculate desired position/dimensions, create html
		for (i=0; i<segCnt; i++) {
			seg = segs[i];
			event = seg.event;
			classes = ['fc-event', 'fc-event-skin', 'fc-event-hori'];
			if (isEventDraggable(event)) {
				classes.push('fc-event-draggable');
			}
			if (rtl) {
                
                // CREATES FAKE ROUNDED CORNERS
                // if (seg.isStart) {
                //     classes.push('fc-corner-right');
                // }
                // if (seg.isEnd) {
                //     classes.push('fc-corner-left');
                // }
				leftCol = dayOfWeekCol(seg.end.getDay()-1);
				rightCol = dayOfWeekCol(seg.start.getDay());
				left = seg.isEnd ? colContentLeft(leftCol) : minLeft;
				right = seg.isStart ? colContentRight(rightCol) : maxLeft;
			}else{
                // CREATES FAKE ROUNDED CORNERS
				// if (seg.isStart) {
				//                     classes.push('fc-corner-left');
				//                 }
				//                 if (seg.isEnd) {
				//                     classes.push('fc-corner-right');
				//                 }
				leftCol = dayOfWeekCol(seg.start.getDay());
				rightCol = dayOfWeekCol(seg.end.getDay()-1);
				left = seg.isStart ? colContentLeft(leftCol) : minLeft;
				right = seg.isEnd ? colContentRight(rightCol) : maxLeft;
			}
			classes = classes.concat(event.className);
			if (event.source) {
				classes = classes.concat(event.source.className || []);
			}
			url = event.url;
			skinCss = getSkinCss(event, opt);
			if (url) {
				html += "<a href='" + htmlEscape(url) + "'";
			}else{
				html += "<div";
			}
			html +=
				" data-event-id='" + event.id + "'" +
				" class='" + classes.join(' ') + "'" +
				" style='position:absolute;z-index:8;left:"+left+"px;" + skinCss + "'" +
				">" +
				"<div" +
				" class='fc-event-inner fc-event-skin'" +
				(skinCss ? " style='" + skinCss + "'" : '') +
				">";
			if (!event.allDay && seg.isStart) {
				html +=
					"<span class='fc-event-time'>" +
					htmlEscape(formatDates(event.start, event.end, opt('timeFormat'))) +
					"</span>";
			}
			html +=
				"<span class='fc-event-title'>" +
					"<span class='event-title-txt'>" + htmlEscape(event.title) + " </span>" +
 				"</span>" +
				"</div>" + // closing inner
				"<span class='event-badges'></span>" +
				"<span class='event-icons'></span>";
			if (seg.isEnd && isEventResizable(event)) {
				html +=
					"<div class='ui-resizable-handle ui-resizable-" + (rtl ? 'w' : 'e') + "'>" +
					"&nbsp;&nbsp;&nbsp;" + // makes hit area a lot better for IE6/7
					"</div>";
			}
			html +=
				"</" + (url ? "a" : "div" ) + ">";
			seg.left = left;
			seg.outerWidth = right - left;
			seg.startCol = leftCol;
			seg.endCol = rightCol + 1; // needs to be exclusive
		}
		return html;
	}
	
	
	function daySegElementResolve(segs, elements) { // sets seg.element
		var i;
		var segCnt = segs.length;
		var seg;
		var event;
		var element;
		var triggerRes;
		for (i=0; i<segCnt; i++) {
			seg = segs[i];
			event = seg.event;
			element = $(elements[i]); // faster than .eq()
			triggerRes = trigger('eventRender', event, event, element);
			if (triggerRes === false) {
				element.remove();
			}else{
				if (triggerRes && triggerRes !== true) {
					triggerRes = $(triggerRes)
						.css({
							position: 'absolute',
							left: seg.left
						});
					element.replaceWith(triggerRes);
					element = triggerRes;
				}
				seg.element = element;
			}
		}
	}
	
	
	function daySegElementReport(segs) {
		var i;
		var segCnt = segs.length;
		var seg;
		var element;
		for (i=0; i<segCnt; i++) {
			seg = segs[i];
			element = seg.element;
			if (element) {
				reportEventElement(seg.event, element);
			}
		}
	}
	
	
	function daySegHandlers(segs, segmentContainer, modifiedEventId) {
		var i;
		var segCnt = segs.length;
		var seg;
		var element;
		var event;
		// retrieve elements, run through eventRender callback, bind handlers
		for (i=0; i<segCnt; i++) {
			seg = segs[i];
			element = seg.element;
			if (element) {
				event = seg.event;
				if (event._id === modifiedEventId) {
					bindDaySeg(event, element, seg);
				}else{
					element[0]._fci = i; // for lazySegBind
				}
			}
		}
		lazySegBind(segmentContainer, segs, bindDaySeg);
	}
	
	
	function daySegCalcHSides(segs) { // also sets seg.key
		var i;
		var segCnt = segs.length;
		var seg;
		var element;
		var key, val;
		var hsideCache = {};
		// record event horizontal sides
		for (i=0; i<segCnt; i++) {
			seg = segs[i];
			element = seg.element;
			if (element) {
				key = seg.key = cssKey(element[0]);
				val = hsideCache[key];
				if (val === undefined) {
					val = hsideCache[key] = hsides(element, true);
				}
				seg.hsides = val;
			}
		}
	}
	
	
	function daySegSetWidths(segs) {
		var i;
		var segCnt = segs.length;
		var seg;
		var element;
		for (i=0; i<segCnt; i++) {
			seg = segs[i];
			element = seg.element;
			if (element) {
				element[0].style.width = Math.max(0, seg.outerWidth - seg.hsides) + 'px';
			}
		}
	}
	
	
	function daySegCalcHeights(segs) {
		var i;
		var segCnt = segs.length;
		var seg;
		var element;
		var key, val;
		var vmarginCache = {};
		// record event heights
		for (i=0; i<segCnt; i++) {
			seg = segs[i];
			element = seg.element;
			if (element) {
				key = seg.key; // created in daySegCalcHSides
				val = vmarginCache[key];
				if (val === undefined) {
					val = vmarginCache[key] = vmargins(element);
				}
				seg.outerHeight = element[0].offsetHeight + val;
			}
			else  // always set a value (issue #1108 )
				seg.outerHeight = 0;
		}
	}
	
	
	function getRowDivs() {
		var i;
		var rowCnt = getRowCnt();
		var rowDivs = [];
		for (i=0; i<rowCnt; i++) {
			rowDivs[i] = allDayRow(i)
				.find('td:first div.fc-day-content > div'); // optimal selector?
		}
		return rowDivs;
	}
	
	
	function getRowTops(rowDivs) {
		var i;
		var rowCnt = rowDivs.length;
		var tops = [];
		for (i=0; i<rowCnt; i++) {
			tops[i] = rowDivs[i][0].offsetTop; // !!?? but this means the element needs position:relative if in a table cell!!!!
		}
		return tops;
	}
	
	
	function daySegSetTops(segs, rowTops) { // also triggers eventAfterRender
		var i;
		var segCnt = segs.length;
		var seg;
		var element;
		var event;
		for (i=0; i<segCnt; i++) {
			seg = segs[i];
			element = seg.element;
			if (element && !seg.overflow) {
				element[0].style.top = rowTops[seg.row] + (seg.top||0) + 'px';
				event = seg.event;
				trigger('eventAfterRender', event, event, element);
			}
			else if (element)
				element.hide();
		}
	}
	
	
	
	/* Resizing
	-----------------------------------------------------------------------------------*/
	
	
	function resizableDayEvent(event, element, seg) {
		var rtl = opt('isRTL');
		var direction = rtl ? 'w' : 'e';
		var handle = element.find('div.ui-resizable-' + direction);
		var isResizing = false;
		
		// TODO: look into using jquery-ui mouse widget for this stuff
		disableTextSelection(element); // prevent native <a> selection for IE
		element
			.mousedown(function(ev) { // prevent native <a> selection for others
				ev.preventDefault();
			})
			.click(function(ev) {
				if (isResizing) {
					ev.preventDefault(); // prevent link from being visited (only method that worked in IE6)
					ev.stopImmediatePropagation(); // prevent fullcalendar eventClick handler from being called
					                               // (eventElementHandlers needs to be bound after resizableDayEvent)
				}
			});
		
		handle.mousedown(function(ev) {
			if (ev.which != 1) {
				return; // needs to be left mouse button
			}
			isResizing = true;
			var hoverListener = t.getHoverListener();
			var rowCnt = getRowCnt();
			var colCnt = getColCnt();
			var dis = rtl ? -1 : 1;
			var dit = rtl ? colCnt-1 : 0;
			var elementTop = element.css('top');
			var dayDelta;
			var helpers;
			var eventCopy = $.extend({}, event);
			var minCell = dateCell(event.start);
			clearSelection();
			$('body')
				.css('cursor', direction + '-resize')
				.one('mouseup', mouseup);
			trigger('eventResizeStart', this, event, ev);
			hoverListener.start(function(cell, origCell) {
				if (cell) {
					var r = Math.max(minCell.row, cell.row);
					var c = cell.col;
					if (rowCnt == 1) {
						r = 0; // hack for all-day area in agenda views
					}
					if (r == minCell.row) {
						if (rtl) {
							c = Math.min(minCell.col, c);
						}else{
							c = Math.max(minCell.col, c);
						}
					}
					dayDelta = (r*7 + c*dis+dit) - (origCell.row*7 + origCell.col*dis+dit);
					var newEnd = addDays(eventEnd(event), dayDelta, true);
					if (dayDelta) {
						eventCopy.end = newEnd;
						var oldHelpers = helpers;
						helpers = renderTempDaySegs(compileDaySegs([eventCopy]), seg.row, elementTop);
						helpers.find('*').css('cursor', direction + '-resize');
						if (oldHelpers) {
							oldHelpers.remove();
						}
						hideEvents(event);
					}else{
						if (helpers) {
							showEvents(event);
							helpers.remove();
							helpers = null;
						}
					}
					clearOverlays();
					renderDayOverlay(event.start, addDays(cloneDate(newEnd), 1)); // coordinate grid already rebuild at hoverListener.start
				}
			}, ev);
			
			function mouseup(ev) {
				trigger('eventResizeStop', this, event, ev);
				$('body').css('cursor', '');
				hoverListener.stop();
				clearOverlays();
				if (dayDelta) {
					eventResize(this, event, dayDelta, 0, ev);
					// event redraw will clear helpers
				}
				// otherwise, the drag handler already restored the old events
				
				setTimeout(function() { // make this happen after the element's click event
					isResizing = false;
				},0);
			}
			
		});
	}
	

}
