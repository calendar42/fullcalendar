
/* Additional view: list (by bruederli@kolabsys.com)
---------------------------------------------------------------------------------*/

function ListEventRenderer() {
	var t = this;

	// exports
	t.renderEvents = renderEvents;
	t.renderEventTime = renderEventTime;
	t.compileDaySegs = compileSegs; // for DayEventRenderer
	t.clearEvents = clearEvents;
	t.lazySegBind = lazySegBind;
	t.sortCmp = sortCmp;
	t.renderEventMarkers = renderEventMarkers;

	// imports
	DayEventRenderer.call(t);
	var opt = t.opt;
	var trigger = t.trigger;
	var reportEvents = t.reportEvents;
	var reportEventClear = t.reportEventClear;
	var reportEventElement = t.reportEventElement;
	var eventElementHandlers = t.eventElementHandlers;
	var showEvents = t.showEvents;
	var hideEvents = t.hideEvents;
	var getListContainer = t.getDaySegmentContainer;
	var calendar = t.calendar;
	var formatDate = calendar.formatDate;
	var formatDates = calendar.formatDates;


	/* Rendering
	--------------------------------------------------------------------*/

	function clearEvents() {
		reportEventClear();
		getListContainer().empty();
	}

	function renderEvents(events, modifiedEventId) {
		events.sort(sortCmp);
		reportEvents(events);
		renderSegs(compileSegs(events), modifiedEventId);
	}

	function renderEventMarkers(events) {
		var listContainer = getListContainer(),
			availWidth = listContainer.outerWidth(),
			positions = {},
			event, day, dayHeader, p, left, top, html;

		listContainer.find('.fc-event-marker').remove();

		for (i=0; i < events.length; i++) {
			event = events[i];
			day = clearTime(cloneDate(event.start));
			dayHeader = listContainer.find('.fc-widget-header[data-day="'+day.getTime()+'"]');
			p = day;
			// Let's not mind the magic numbers for now
			left = 20;
			top = 35;
			if (positions[p]) {
				left += 15*positions[p];
				if (left > availWidth - 20) {
					top += 10;
					left -= availWidth;
					left += 30;
				}
				positions[p]++;
			} else {
				positions[p] = 1;
			}
			// same as template now
			html = "<a class='fc-event-marker' href='#event-marker' data-event-id='" + event.id + "' style=display:block;position:absolute;z-index:8;top:" + top + "px;left:" + left + "px;background:"+event.colors[0]+";'><i class='icon icon-bullhorn'></i></a>";
			dayHeader.append(html);
		}
	}

	function renderEventBar(event) {
		var day = clearTime(cloneDate(event.start));
		var listContainer = getListContainer();
		var dayHeader = listContainer.find('.day-header[data-day="'+day.getTime()+'"]');
		var position = '';
		if (event.allDay) {
			position = 'left:5%;right:5%;width:auto;';
		} else {
			position = 'left:'+(event.start.getHours()/24*100)+'%;';
			if (event.end) {
				position += 'right:'+(100-(event.end.getHours()/24*100))+'%;width:auto;';
			}
		}
		var html = '<a class="fc-event-marker" href="#fc-event-marker" data-event-id="'+event.id+'" style="'+position+'background:'+event.colors[0]+';position: absolute;z-index:10;"></a>';
		dayHeader.append(html);
	}

	function compileSegs(events) {
		var segs = [];
		var colFormat = opt('titleFormat', 'day');
		var firstDay = opt('firstDay');
		var segmode = opt('listSections');
		var event, i, dd, ddEnd, wd, md, seg, segHash, curSegHash, segDate, segEndDate, curSeg = -1;
		var today = clearTime(new Date()); // for determining the segment title
		var weekstart = addDays(cloneDate(today), -((today.getDay() - firstDay + 7) % 7));
		var viewstart = cloneDate(t.visStart);


		for (i=0; i < opt('listRange'); i++) {
			// define sections of this event
			// create smart sections such as today, tomorrow, this week, next week, next month, ect.
			segDate = addDays(cloneDate(viewstart), i);
			dd = dayDiff(segDate, today);
			wd = Math.floor(dayDiff(segDate, weekstart) / 7);
			md = segDate.getMonth() + ((segDate.getYear() - today.getYear()) * 12) - today.getMonth();

			// build section title
			if (segmode == 'smart') {
				if (dd < 0) {
					segHash = opt('listTexts', 'past');
				} else if (dd === 0) {
					segHash = opt('listTexts', 'today');
				} else if (dd === 1) {
					segHash = opt('listTexts', 'tomorrow');
				} else if (wd === 0) {
					segHash = opt('listTexts', 'thisWeek');
				} else if (wd === 1) {
					segHash = opt('listTexts', 'nextWeek');
				} else if (md === 0) {
					segHash = opt('listTexts', 'thisMonth');
				} else if (md === 1) {
					segHash = opt('listTexts', 'nextMonth');
				} else if (md > 1) {
					segHash = opt('listTexts', 'future');
				}
			} else if (segmode === 'month') {
				segHash = formatDate(segDate, 'MMMM yyyy');
			} else if (segmode === 'week') {
				segHash = opt('listTexts', 'week') + formatDate(segDate, ' W');
			} else if (segmode == 'smart-day') {
				if (dd === 0) {
					segHash = formatDate(segDate, colFormat) + ' <span class="today-badge pull-right"> ' + opt('listTexts', 'today') + '</span>';
				} else {
					segHash = formatDate(segDate, colFormat);
				}
			} else if (segmode === 'day') {
				segHash = formatDate(segDate, colFormat);
			} else {
				segHash = '';
			}

			segs[i] = { events: [], start: segDate, title: segHash, daydiff: dd, weekdiff: wd, monthdiff: md };
		}

		for (i=0; i < events.length; i++) {
			event = events[i];

			// skip events out of range
			if ((event.end || event.start) < t.start || event.start > t.visEnd) {
				continue;
			}

			// define sections of this event
			// create smart sections such as today, tomorrow, this week, next week, next month, ect.
			segDate = cloneDate(event.start < t.start && event.end > t.start ? t.start : event.start, true);
			segEndDate = event.end ? cloneDate(event.end > t.end ? t.end : event.end, true) : cloneDate(event.start);

			// Get the index of the event compared to the week start
			dd = dayDiff(segDate, viewstart);
			ddEnd = dayDiff(segEndDate, viewstart);

			for (; dd <= ddEnd; dd++) {
				if (segs[dd]) {
					segs[dd].events.push(event);
				}
			}
		}
		return segs;
	}

	function sortCmp(a, b) {
		var sd = a.start.getTime() - b.start.getTime();
		return sd || (a.end ? a.end.getTime() : 0) - (b.end ? b.end.getTime() : 0);
	}

	function renderSegs(segs, modifiedEventId) {
		var tm = opt('theme') ? 'ui' : 'fc';
		var weekHeaderElementType = segs.length !== 7 ? 'a' : 'div';
		var dayHeaderElementType = segs.length !== 1 ? 'a' : 'div';
		// var headerClass = tm + "-widget-header";
		// var contentClass = tm + "-widget-content";
		var i, j, seg, event, times, s, classes, segContainer, eventElement, eventElements, triggerRes;

		if (opt('weekNumbers')) {
			$('<div class="fc-widget-header"><'+weekHeaderElementType+' class="weeknumber-header" href="#week-header-click">Week <span class="weeknumber-number">' + t.visStart.getWeek() + '</span></'+weekHeaderElementType+'></div>').appendTo(getListContainer());
		}

		for (j=0; j < segs.length; j++) {
			seg = segs[j];
			var segEnd = addDays(cloneDate(seg.start), 1);
			var headerClass = '';
			var contentClass = '';

			if (!opt('listShowEmptyDays') && seg.events.length === 0) {
				continue;
			}

			if (seg.daydiff === 0) {
				headerClass += 'today';
				contentClass += 'today';
			}

			if (seg.title) {
				$('<div class="fc-widget-header ' + headerClass + '" data-day="' + seg.start.getTime() + '"> <a class="add-event-from-day btn btn-mini btn-info" href="#add-event-from-day" data-day="' + seg.start.getTime() + '">add event</a> <'+dayHeaderElementType+' class="day-header" href="#day-header-click" data-day="' + seg.start.getTime() + '">' + seg.title + '</'+dayHeaderElementType+'></div>').appendTo(getListContainer());
			}
			segContainer = $('<div>').addClass('fc-list-section ' + contentClass).appendTo(getListContainer());
			s = '';

			if (seg.events.length === 0) {
				s += '<a href="#no-events" class="fc-no-events"></a>';
			} else {
				for (i=0; i < seg.events.length; i++) {
					event = seg.events[i];
					times = renderEventTime(event, seg);

					classes = ['fc-event', 'fc-event-skin', 'fc-event-vert', 'fc-corner-top', 'fc-corner-bottom'].concat(event.className);
					if (event.source && event.source.className) {
						classes = classes.concat(event.source.className);
					}

					if (event.allDay) {
						classes.push('all-day');

						if (event.start >= seg.start && event.start < segEnd) {
							classes.push('all-day-start');
						}

						// Add one day because all day events go from 31-01-2013T00:00/31-01-2013T00:00
						var eventEnd = event.end ? addDays(cloneDate(event.end), 1) : addDays(cloneDate(event.start), 1);
						if (eventEnd <= segEnd && eventEnd > seg.start) {
							classes.push('all-day-end');
						}
					}

					s +=
						"<div class='" + classes.join(' ') + "' data-event-id='"+event.id+"''>" +
							"<div class='fc-event-inner fc-event-skin'>";
							s += t.listItemTemplate(event, times);
							s += "</div>" + // close inner
						"</div>";  // close outer
				}
			}

			segContainer[0].innerHTML = s;
			eventElements = segContainer.children();

			// retrieve elements, run through eventRender callback, bind event handlers
			for (i=0; i < seg.events.length; i++) {
				event = seg.events[i];
				eventElement = $(eventElements[i]); // faster than eq()
				triggerRes = trigger('eventRender', event, event, eventElement);
				if (triggerRes === false) {
					eventElement.remove();
				} else {
					if (triggerRes && triggerRes !== true) {
						eventElement.remove();
						eventElement = $(triggerRes).appendTo(segContainer);
					}
					if (event._id === modifiedEventId) {
						eventElementHandlers(event, eventElement, seg);
					} else {
						eventElement[0]._fci = i; // for lazySegBind
					}
					reportEventElement(event, eventElement);
				}
			}

			lazySegBind(segContainer, seg, eventElementHandlers);
		}

		markFirstLast(getListContainer());
	}

	// event time/date range to display
	function renderEventTime(event, seg) {
		var timeFormat = opt('timeFormat');
		var dateFormat = opt('columnFormat');
		var segmode = opt('listSections');
		var duration = event.end ? event.end.getTime() - event.start.getTime() : 0;
		var datestr = '', timestr = '';

		if (segmode === 'smart') {
			if (event.start < seg.start) {
				datestr = opt('listTexts', 'until') + ' ' + formatDate(event.end, (event.allDay || event.end.getDate() != seg.start.getDate()) ? dateFormat : timeFormat);
			} else if (duration > DAY_MS) {
				datestr = formatDates(event.start, event.end, dateFormat + '{ - ' + dateFormat + '}');
			} else if (seg.daydiff === 0) {
				datestr = opt('listTexts', 'today');
			}	else if (seg.daydiff === 1) {
				datestr = opt('listTexts', 'tomorrow');
			} else if (seg.weekdiff === 0 || seg.weekdiff === 1) {
				datestr = formatDate(event.start, 'dddd');
			} else if (seg.daydiff > 1 || seg.daydiff < 0) {
				datestr = formatDate(event.start, dateFormat);
			}
		} else if (segmode != 'day' && segmode != 'smart-day') {
			datestr = formatDates(event.start, event.end, dateFormat + (duration > DAY_MS ? '{ - ' + dateFormat + '}' : ''));
		}

		if (!datestr && event.allDay) {
			timestr = opt('allDayText');
			// timestr = '';
		} else if ((duration < DAY_MS || !datestr) && !event.allDay) {
			timestr = formatDates(event.start, event.end, timeFormat);
		}

		return [datestr, timestr];
	}

	function lazySegBind(container, seg, bindHandlers) {
		container.unbind('mouseover').mouseover(function(ev) {
			var parent = ev.target, e = parent, i, event;
			while (parent != this) {
				e = parent;
				parent = parent.parentNode;
			}
			if ((i = e._fci) !== undefined) {
				e._fci = undefined;
				event = seg.events[i];
				bindHandlers(event, container.children().eq(i), seg);
				$(ev.target).trigger(ev);
			}
			ev.stopPropagation();
		});
	}

}


fcViews.list = ListView;


function ListView(element, calendar) {
	var t = this;

	// exports
	t.render = render;
	t.select = dummy;
	t.unselect = dummy;
	t.listItemTemplate = listItemTemplate;
	t.getDaySegmentContainer = function(){ return body; };

	// imports
	View.call(t, element, calendar, 'list');
	ListEventRenderer.call(t);
	var opt = t.opt;
	var trigger = t.trigger;
    var clearEvents = t.clearEvents;
	var reportEventClear = t.reportEventClear;
	var formatDates = calendar.formatDates;
	var formatDate = calendar.formatDate;

	// overrides
	t.setWidth = setWidth;
	t.setHeight = setHeight;
	if (opt('listItemTemplate')) {
		t.listItemTemplate = opt('listItemTemplate');
	}

	// locals
	var body;
	var firstDay;
	var nwe;
	var tm;
	var colFormat;


	function render(date, delta) {
		if (delta) {
			addDays(date, opt('listPage') * delta);
		}


		var visStart, visEnd;
		if (opt('listTimespan') === 'week') {
			visStart = addDays(cloneDate(date), -((date.getDay() - opt('firstDay') + 7) % 7));
			visEnd = addDays(cloneDate(visStart), opt('listRange'));
		} else {
			visStart = cloneDate(date);
			visEnd = addDays(cloneDate(date), opt('listRange'));
		}
		addMinutes(visEnd, -1);  // set end to 23:59

		t.start = clearTime(cloneDate(visStart));
		t.end = cloneDate(visEnd);
		t.visStart = clearTime(visStart);
		t.visEnd = visEnd;

		t.title = formatDates(date, t.visEnd, opt('titleFormat'));

		updateOptions();

		if (!body) {
			buildSkeleton();
		} else {
			clearEvents();
		}
	}


	function updateOptions() {
		firstDay = opt('firstDay');
		nwe = opt('weekends') ? 0 : 1;
		tm = opt('theme') ? 'ui' : 'fc';
		colFormat = opt('columnFormat', 'day');
	}

    function tripHtml(event, type) {
        var html = '';
        var trip = null;

        if (!_u.def(event.trips) || !_u.def(event.trips[type])) {
            return html;
        }

        trip = event.trips[type];

        if (trip) {
            html = "<div class='trip-click trip-wrapper trip-" + type + (trip.dirty ? " trip-dirty " : "") + (trip.selected ? " trip-selected " : "") +"' data-event-id='" + trip.id + "'>" +
                        "<div class='trip-inner'>" + htmlEscape(trip.title) + "</div>" +
                    "</div>";
        }

        return html;
    }

	function listItemTemplate(event, times) {
		var html = '';

		html += tripHtml(event, 'to');

		html += "<div class='fc-event-head fc-event-skin'>" +
					"<div class='fc-event-time muted'>" +
						(times[0] ? '<span class="fc-col-date">' + times[0] + '</span> ' : '') +
						(times[1] ? '<span class="fc-col-time">' + times[1] + '</span>' : '') +
						(event.editable ? '' : '<div class="readonly-badge"><i class="icon icon-lock"></i></div>') +
					"</div>";

				html += "</div>" +
				"<div class='fc-event-content'>" +
					"<div class='fc-event-title'>" +
						htmlEscape(event.title) + //(event.editable ? '' : ' ' + opt('listTexts', 'readonly')) +
					"</div>" +
					"<div class='fc-event-location muted'>" +
						(event.location_text ? htmlEscape(event.location_text) : '–') +
					"</div>" +
				"</div>";
				html += '<div class="event-colors">';
				if (event.colors) {
					for (var colorIndex = 0; colorIndex < event.colors.length; colorIndex++) {
						html += '<div class="event-color" style="background-color: ' + event.colors[colorIndex] + '"></div>';
					}
				}
				html += '</div>';

		html += tripHtml(event, 'from');

		return html;
	}

	function buildSkeleton() {
		body = $('<div>').addClass('fc-list-content').appendTo(element);
	}

	function setHeight(height, dateChanged) {
		if (!opt('listNoHeight')) {
			body.css('height', (height-1)+'px').css('overflow', 'auto');
		}
	}

	function setWidth(width) {
		// nothing to be done here
	}

	function dummy() {
		// Stub.
	}

}
