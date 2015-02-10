
//BUG: unselect needs to be triggered when events are dragged+dropped

function SelectionManager() {
	var t = this;
	
	
	// exports
	t.select = select;
	t.unselect = unselect;
	t.reportSelection = reportSelection;
	t.daySelectionMousedown = daySelectionMousedown;
	t.daySelectionDblClick = daySelectionDblClick;
	
	
	// imports
	var opt = t.opt;
	var trigger = t.trigger;
	var defaultSelectionEnd = t.defaultSelectionEnd;
	var renderSelection = t.renderSelection;
	var clearSelection = t.clearSelection;
	
	
	// locals
	var selected = false;



	// unselectAuto
	if (opt('selectable') && opt('unselectAuto')) {
		$(document).mousedown(function(ev) {
			var ignore = opt('unselectCancel');
            var target = $(ev.target);
            
			if (ignore) {
                if (ignore instanceof Array) {
                    for (var i = 0; i < ignore.length; i++) {
        				if (target.is(ignore[i]) || target.parents(ignore[i]).length > 0) {
                            return;
                        }
                    }
                } else {
    				if (target.parents(ignore).length) { // could be optimized to stop after first match
    					return;
    				}
                }
			}
			unselect(ev);
		});
	}
	

	function select(startDate, endDate, allDay) {
		unselect();
		if (!endDate) {
			endDate = defaultSelectionEnd(startDate, allDay);
		}
		renderSelection(startDate, endDate, allDay);
		reportSelection(startDate, endDate, allDay);
	}
	
	
	function unselect(ev) {
		if (selected) {
			selected = false;
			clearSelection();
			trigger('unselect', null, ev);
		}
	}
	
	
	function reportSelection(startDate, endDate, allDay, ev) {
		selected = true;
		trigger('select', null, startDate, endDate, allDay, ev);
	}
	
	
	function daySelectionMousedown(ev) { // not really a generic manager method, oh well
		var cellDate = t.cellDate;
		var cellIsAllDay = t.cellIsAllDay;
		var hoverListener = t.getHoverListener();
		var reportDayClick = t.reportDayClick; // this is hacky and sort of weird

		if (ev.which == 1 && opt('selectable') && !$(ev.target).hasClass('fc-cell-overlay')) { // which==1 means left mouse button
			unselect(ev);
			var _mousedownElement = this;
			var dates;
			hoverListener.start(function(cell, origCell) { // TODO: maybe put cellDate/cellIsAllDay info in cell
				clearSelection();
				if (cell && cellIsAllDay(cell) && (cell.row - origCell.row !== 0 || cell.col - origCell.col !== 0 ) ) {
					dates = [ cellDate(origCell), cellDate(cell) ].sort(cmp);
					renderSelection(dates[0], dates[1], true);
				}else{
					dates = null;
				}
			}, ev);
			$(document).one('mouseup', function(ev) {
				hoverListener.stop();
				if (dates) {
					if (+dates[0] == +dates[1]) {
						reportDayClick(dates[0], true, ev);
					}
					reportSelection(dates[0], dates[1], true, ev);
				}
			});
		}
	}
    
    function daySelectionDblClick (ev) {
        if (ev.which == 1 && opt('selectable') && !$(ev.target).hasClass('fc-cell-overlay')) { // which==1 means left mouse button
        	if(!$(ev.target).hasClass('fc-event') && !$(ev.target).parents().hasClass('fc-event')){
	            unselect(ev);
	    		var cellDate = t.cellDate;
	    		var coordinateGrid = t.getCoordinateGrid();
	    		var newCell = coordinateGrid.cell(ev.pageX, ev.pageY);
	    		var d1 = cellDate(newCell);
	    		var d2 = cloneDate(d1);
	    		renderSelection(d1, d2, true);
	    		reportSelection(d1, d2, true, ev);
        	}
        }
    }


}
