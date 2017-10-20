var GridTable;

$(function() {
  $('[data-grid-table-sort]').on('change', function() {
    var gridtables = GridTableFactory.getAll($(this));
    for (var i = 0; i < gridtables.length; i++) {
      var gridtable = gridtables[i];
      gridtable.refresh((function(_this) {
        var $checked, n, url;
        n = _this.name;
        url = gridtable.getUrl();
        gridtable.setFilter(n, null, {
          skip_load: true
        });
        if (_this.type === 'checkbox') {
          $checked = $(':checkbox[name="' + n + '"]:checked');
          if ($checked.length > 0) {
            url += '?' + ($checked.map(function() {
              return "" + n + "=" + this.value;
            }).toArray().join('&'));
          }
          return gridtable.setUrl(url);
        } else {
          return gridtable.setUrl(gridtable.updateQueryString(n, _this.value, url));
        }

        return;
      })(this));
    }

    return;
  });

  return $('.grid-table').each(function() {
    var $table = $(this);
    return GridTableFactory.createGridTable($table).loadGridTable($table);
  });
});

window.GridTableFactory = (function() {
  function GridTableFactory() {}

  GridTableFactory.gridTableList = {};
  GridTableFactory.defaultGridTableId = 'default-grid-table';

  GridTableFactory.get = function(obj) {
    var gridtables = this.getAll(obj);

    return gridtables.length > 0 ? gridtables[0] : null;
  };

  GridTableFactory.getAll = function(obj) {
    var ids;
    if (typeof obj === 'object') {
      ids = ($(obj).data('grid-table-id') || this.defaultGridTableId).split(',');
    } else {
      ids = [obj];
    }

    var gridtables = []
    for (var i = 0; i < ids.length; i++) {
      var gridtable = this.gridTableList[ids[i]];
      if (gridtable) {
        gridtables.push(gridtable);
      }
    }

    return gridtables;
  };

  GridTableFactory.createGridTable = function(table, params) {
    var $table, existing_table, gridTable;
    if ((existing_table = this.get(table)) != null) {
      throw new Error(existing_table);
    }
    $table = $(table);
    gridTable = new GridTable(params);
    $table.on('ajax:success', 'a, button', function() {
      gridTable = GridTableFactory.get($table);
      return gridTable.refresh();
    });

    this.gridTableList[$table.data('grid-table-id') || this.defaultGridTableId] = gridTable;
    return gridTable;
  };

  return GridTableFactory;

})();

GridTable = (function() {
  GridTable.prototype.gridTableParams = null;
  GridTable.prototype.gridTableDOM = null;
  GridTable.prototype.loadDataCompleteCallback = null;
  GridTable.prototype.loadDataStartCallback = null;
  GridTable.prototype.loadDataErrorCallback = null;

  function GridTable(params) {
    this.gridTableParams = new GridTableParams(params);
  }

  GridTable.prototype.loadGridTable = function(table, params) {
    if (params == null) {
      params = {};
    }
    this.gridTableDOM = $(table);
    this.gridTableParams.setId(this.gridTableDOM.data('grid-table-id'));
    if (this.gridTableDOM.attr('data-page-size')) {
      this.gridTableParams.setPageSize(this.gridTableDOM.data('page-size'));
    }
    this.gridTableParams.setUrl(this.gridTableDOM.data('url'));
    this.gridTableDOM.find('thead th[data-sort="true"], .thead [data-sort="true"]').each((function(_this) {
      return function(index, column) {
        var $column;
        $column = $(column);
        $column.append("<i class='" + _this.gridTableParams.sortIcons['default'] + "'></i>");
        if ($column.data('default-sort')) {
          _this.setSort($column.data('field'), $column.data('default-sort'), true);
        }
        return $column.on('click', function(event) {
          _this.gridTableParams.setSort($(event.currentTarget).data('field'), null);
          return _this.loadData();
        });
      };
    })(this));

    var dataFilterSelector = "[data-filter]";

    $("select" + dataFilterSelector).each((function (_this) {
      return function (index, filter) {
        if (_this.gridTableParams.includeFilter(filter)) {
          _this.gridTableParams.setFilter($(filter).data('field'), $(filter).val());
          return $(filter).on("change", function (event) {
            _this.gridTableParams.setFilter($(filter).data('field'), $(filter).val());
            return _this.loadData();
          });
        }
      };
    })(this));

    // find non-selectable inputs
    $("input:not([type=radio], [type=checkbox])" + dataFilterSelector).each((function (_this) {
      return function (index, filter) {
        if (_this.gridTableParams.includeFilter(filter)) {
          var timeout;
          timeout = null;
          return $(filter).on("propertychange keyup input paste", function (event) {
            clearTimeout(timeout);
            return timeout = setTimeout((function () {
              _this.gridTableParams.setFilter($(filter).data('field'), $(filter).val());
              return _this.loadData();
            }), 500);
          });
        }
      };
    })(this));

    $("input:radio" + dataFilterSelector + ",input:checkbox" + dataFilterSelector).each((function (_this) {
      return function(index, filter) {
        if (_this.gridTableParams.includeFilter(filter)) {
          var timeout;
          // only setFilter for radio && checkbox inputs if they are also checked
          if (filter.checked) {
            _this.gridTableParams.setFilter($(filter).data('field'), $(filter).val());
          }
          timeout = null;
          return $(filter).on("change", function(event) {
            clearTimeout(timeout);
            return timeout = setTimeout((function() {
              _this.gridTableParams.setFilter($(filter).data('field'), $(filter).val());
              return _this.loadData();
            }), 500);
          });
        }
      };
    })(this));

    this.gridTableDOM.find('#pagesize, .pagesize').each((function(_this) {
      return function(index, elem) {
        var pageSizeSelect, size, _i, _len, _ref;

        pageSizeSelect = $(elem).find(".page-size-select");

        if (pageSizeSelect == null) {
          pageSizeSelect = '<select class="page-size-select">';
          _ref = _this.gridTableParams.pageSizeOptions;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            size = _ref[_i];
            if (size === _this.gridTableParams.pageSize) {
              pageSizeSelect += "<option selected value=\"" + size + "\">" + size + "</option>";
            } else {
              pageSizeSelect += "<option value=\"" + size + "\">" + size + "</option>";
            }
          }
          pageSizeSelect += '</select>';
          $(elem).append(pageSizeSelect);
        }

        return $(elem).find('.page-size-select').on("change", function(event) {
          return _this.setPageSize($(event.currentTarget).val());
        });
      };
    })(this));
    this.loadData(params);
    return $('.export[data-grid-table-id="' + this.gridTableParams.id + '"]').on('click', (function(_this) {
      return function(event) {
        return _this.exportData();
      };
    })(this));
  };

  GridTable.prototype.refresh = function(callback) {
    if (typeof callback === "function") {
      callback(callback);
    }
    return this.loadData();
  };

  GridTable.prototype.setId = function(id) {
    return this.gridTableParams.setId(id);
  };

  GridTable.prototype.getId = function () {
    return this.gridTableParams.getId();
  };

  GridTable.prototype.setUrl = function(url) {
    return this.gridTableParams.setUrl(url);
  };

  GridTable.prototype.getUrl = function() {
    return this.gridTableParams.url;
  };

  GridTable.prototype.setFilter = function(key, value, options) {
    if (options == null) {
      options = {};
    }
    this.gridTableParams.setFilter(key, value);
    if (this.gridTableDOM !== null && !options.skip_load) {
      return this.loadData();
    }
  };

  GridTable.prototype.setSort = function(column, direction, initialSort) {
    if (typeof initialSort === 'undefined') {
      initialSort = false;
    }
    this.gridTableParams.setSort(column, direction);
    if (this.gridTableDOM !== null && initialSort === false) {
      return this.loadData();
    }
  };

  GridTable.prototype.loadDataStart = function(callback) {
    return this.loadDataStartCallback = callback;
  };

  GridTable.prototype.loadDataComplete = function(callback) {
    return this.loadDataCompleteCallback = callback;
  };

  GridTable.prototype.loadDataError = function(callback) {
    return this.loadDataErrorCallback = callback;
  };

  GridTable.prototype.buildUrl = function(baseUrl) {
    return this.gridTableParams.buildUrl(baseUrl, true);
  };

  GridTable.prototype.setPage = function(page) {
    this.gridTableParams.page = page;
    return this.loadData();
  };

  GridTable.prototype.setPageSize = function(size) {
    this.gridTableParams.pageSize = size;
    this.gridTableParams.page = 0;
    return this.loadData();
  };

  GridTable.prototype.loadData = function(params) {
    var page_display = this.gridTableDOM.find('#pagedisplay, .pagedisplay');

    if (page_display.data('initial-page') != null) {
      this.gridTableParams.page = page_display.data('initial-page');
    }
    if (params == null) {
      params = {};
    }
    if (params.globalAjax == null) {
      params.globalAjax = true;
    }
    if (typeof this.loadDataStartCallback === "function") {
      this.loadDataStartCallback();
    }
    return $.ajax(this.gridTableParams.buildUrl(this.gridTableParams.url), {
      type: 'GET',
      global: params.globalAjax,
      dataType: 'json',
      error: (function(_this) {
        return function(jqXHR, textStatus, errorThrown) {
          if (typeof _this.loadDataErrorCallback === "function") {
            return _this.loadDataErrorCallback();
          }
        };
      })(this),
      success: (function(_this) {
        return function(data, textStatus, jqXHR) {
          var row, _i, _len, _ref;
          _this.gridTableDOM.find('tbody, .tbody').children().not('.no-results').remove();
          _this.gridTableDOM.find('.no-results').addClass('hide');
          if (data.totals) {
            _this.gridTableDOM.find('thead tr.totals, .thead tr.totals, .thead .tr.totals').html(data.totals);
          }
          if (data.rows.length === 0) {
            _this.gridTableDOM.find('.no-results').removeClass('hide');
          } else {
            _ref = data.rows;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              row = _ref[_i];
              _this.gridTableDOM.find('tbody, .tbody').append(row);
            }
          }
          _this.updateSortDisplay();
          _this.updatePagerDisplay(data.total_rows);
          if (typeof _this.loadDataCompleteCallback === "function") {
            return _this.loadDataCompleteCallback(data);
          }
        };
      })(this)
    });
  };

  GridTable.prototype.clearInitialValues = function() {
    var page_display = this.gridTableDOM.find('#pagedisplay, .pagedisplay');

    page_display.data('initial-page', null);
    page_display.data('initial-id', null);
  }

  GridTable.prototype.exportData = function() {
    var baseUrl, url;
    url = this.gridTableParams.url.split('?');
    if (url.length === 1) {
      baseUrl = url[0] + '.csv';
    } else {
      baseUrl = url[0] + '.csv?' + url[1];
    }
    return window.open(this.gridTableParams.buildUrl(baseUrl));
  };

  GridTable.prototype.updatePagerDisplay = function(total_rows) {
    var back_enabled, display, display_format, first, forward_enabled, last, last_page, next, pager, previous;
    pager = this.gridTableDOM.find('.grid-pager');
    first = $(pager).find('#first, .first');
    previous = $(pager).find('#previous, .previous');
    next = $(pager).find('#next, .next');
    last = $(pager).find('#last, .last');
    display = $(pager).find('#pagedisplay, .pagedisplay');
    display_format = $(display).data('format') || "${current_page} of ${last_page} (${total_rows})";
    $(first).off('click');
    $(previous).off('click');
    $(next).off('click');
    $(last).off('click');
    last_page = Math.floor(total_rows / this.gridTableParams.pageSize);
    if (total_rows % this.gridTableParams.pageSize === 0) {
      last_page -= 1;
    }
    back_enabled = this.gridTableParams.page > 0;
    forward_enabled = this.gridTableParams.page < last_page;
    if (back_enabled) {
      $(first).removeClass('disabled');
      $(first).on('click', (function(_this) {
        return function(event) {
          event.preventDefault();
          return _this.setPage(0);
        };
      })(this));
      $(previous).removeClass('disabled');
      $(previous).on('click', (function(_this) {
        return function(event) {
          event.preventDefault();
          return _this.setPage(Math.max((_this.gridTableParams.page - 1), 0));
        };
      })(this));
    } else {
      $(first).addClass('disabled');
      $(previous).addClass('disabled');
    }
    if (forward_enabled) {
      $(next).removeClass('disabled');
      $(next).on('click', (function(_this) {
        return function(event) {
          event.preventDefault();
          return _this.setPage(_this.gridTableParams.page + 1);
        };
      })(this));
      $(last).removeClass('disabled');
      $(last).on('click', (function(_this) {
        return function(event) {
          event.preventDefault();
          return _this.setPage(last_page);
        };
      })(this));
    } else {
      $(next).addClass('disabled');
      $(last).addClass('disabled');
    }

    var display_test = display_format.
    replace("${current_page}", (this.gridTableParams.page + 1)).
    replace("${last_page}", (last_page + 1)).
    replace("${total_rows}", total_rows)

    return display.text(display_test);
  };

  GridTable.prototype.updateSortDisplay = function() {
    var field, sortOrder;
    field = this.gridTableParams.sortCol;
    sortOrder = this.gridTableParams.sortOrder;
    return this.gridTableDOM.find('thead th[data-sort="true"], .thead [data-sort="true"]').each((function(_this) {
      return function(i, c) {
        var value;
        value = $(c).data('field');
        if (value === field) {
          switch (sortOrder) {
            case 'asc':
              $(c).addClass('sorting');
              return $(c).find('i').attr('class', _this.gridTableParams.sortIcons['asc']);
            case 'desc':
              $(c).addClass('sorting');
              return $(c).find('i').attr('class', _this.gridTableParams.sortIcons['desc']);
            default:
              $(c).removeClass('sorting');
              return $(c).find('i').attr('class', _this.gridTableParams.sortIcons['default']);
          }
        } else {
          $(c).removeClass('sorting');
          return $(c).find('i').attr('class', _this.gridTableParams.sortIcons['default']);
        }
      };
    })(this));
  };

  GridTable.prototype.updateQueryString = function(key, value, url) {
    var hash, re, separator;
    if (!url) {
      url = window.location.href;
    }
    re = new RegExp("([?&])" + key + "=.*?(&|#|$)(.*)", "gi");
    if (re.test(url)) {
      if (typeof value !== "undefined" && value !== null) {
        url = url.replace(re, "$1" + key + "=" + value + "$2$3");
      } else {
        hash = url.split("#");
        url = hash[0].replace(re, "$1$3").replace(/(&|\?)$/, "");
        if (typeof hash[1] !== "undefined" && hash[1] !== null) {
          url += "#" + hash[1];
        }
      }
    } else {
      if (typeof value !== "undefined" && value !== null) {
        separator = (url.indexOf("?") !== -1 ? "&" : "?");
        hash = url.split("#");
        url = hash[0] + separator + key + "=" + value;
        if (typeof hash[1] !== "undefined" && hash[1] !== null) {
          url += "#" + hash[1];
        }
      }
    }
    return url;
  };

  GridTableParams = (function() {
    GridTableParams.prototype.id = null;
    GridTableParams.prototype.url = null;
    GridTableParams.prototype.sortCol = '';
    GridTableParams.prototype.sortOrder = '';
    GridTableParams.prototype.filter = {};
    GridTableParams.prototype.page = 0;
    GridTableParams.prototype.pageSize = 10;
    GridTableParams.prototype.pageSizeOptions = [5, 10, 25, 50, 100, 200];
    GridTableParams.prototype.sortIcons = {
      "default": 'fa fa-sort',
      "asc": 'fa fa-sort-desc',
      "desc": 'fa fa-sort-asc'
    };

    function GridTableParams(params) {
      if (params != null) {
        if ('sortCol' in params) {
          this.sortCol = params['sortCol'];
        }
        if ('sortOrder' in params) {
          this.sortOrder = params['sortOrder'];
        }
        if ('filter' in params) {
          this.filter = params['filter'];
        }
        if ('page' in params) {
          this.page = params['page'];
        }
        if ('pageSize' in params) {
          this.pageSize = params['pageSize'];
        }
        if ('id' in params) {
          this.id = params['id'];
        }
        if ('url' in params) {
          this.url = params['url'];
        }
        if ('sortIcons' in params) {
          this.sortIcons = params['sortIcons'];
        }
      }
    }

    GridTableParams.prototype.setId = function(id) {
      return this.id = id;
    };

    GridTableParams.prototype.getId = function () {
      return this.id;
    };

    GridTableParams.prototype.setUrl = function(url) {
      return this.url = url;
    };

    GridTableParams.prototype.setPageSize = function(pageSize) {
      return this.pageSize = pageSize;
    };

    GridTableParams.prototype.setSortIcons = function(sortIcons) {
      return this.sortIcons = sortIcons;
    };

    GridTableParams.prototype.setSort = function(column, direction) {
      var order;
      this.page = 0;
      if (this.sortCol === column) {
        order = this.sortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        order = 'asc';
      }
      this.sortOrder = direction || order;
      return this.sortCol = column;
    };

    GridTableParams.prototype.setFilter = function(column, value) {
      this.page = 0;
      if (value === null || value.trim().length === 0) {
        return delete this.filter[column];
      } else {
        return this.filter[column] = value;
      }
    };

    GridTableParams.prototype.includeFilter = function (filter) {
      var gridTableIds = $(filter).data('grid-table-id');

      return $.inArray(this.id, gridTableIds.split(',')) >= 0;
    }

    GridTableParams.prototype.buildUrl = function(baseUrl, skip_paging) {
      var k, url, v, _ref;
      if (skip_paging == null) {
        skip_paging = false;
      }
      url = baseUrl;
      url += /\?/.test(url) ? '&' : '?';
      if (!skip_paging) {
        url += 'page=' + this.page;
        url += "&page_size=" + this.pageSize;
        url += "&sort=" + this.sortCol;
        url += "&sort_order=" + this.sortOrder;
      }
      _ref = this.filter;
      for (k in _ref) {
        v = _ref[k];
        url += '&' + k + '=' + v;
      }
      return url;
    };

    return GridTableParams;

  })();

  return GridTable;

})();
