/* global mkdru, pz2 */
(function ($) {
  "use strict";
  mkdru.pagerRange = 3;

  function get_advanced_search_params() {
    var query = window.location.search;
    if (query.length === 0) {
      return false;
    }
    query = decodeURIComponent(query);
    var vars = query.split("&");
    var adv_q = [];
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split("=");
      pair[0] = pair[0].replace(/[^a-zA-Z ]/g, "");
      if (pair[0] === 'ti' || pair[0] === 'au') {
        adv_q.push(pair[0] + '="' + pair[1] + '"');
      }
    }

    return adv_q.join(' AND ');
  }

  function _query_normalizer(str) {
    var query;
    var matches = [];
    var newarray= [];
    var splited = str.split(" ");
    var get_cql_operators_regexp = '@ and | any | all | adj | or | not |=|\(|\)@i';

    if (str.match(get_cql_operators_regexp)) {
      splited.forEach(function (item) {
        // Matching possible term arguments.
        if (item.match(/"([^"]+)"/)) {
          matches.push(item.match(/"([^"]+)"/)[1]);
        }
        else {
          matches.push(item);
        }
      });

      // Filtering duplications.
      var unique = matches.filter(function (item, i, allItems) {
        return i === allItems.indexOf(item);
      });

      unique.forEach(function(item, i) {
        if (item.match(/\d+/)) {
          delete unique[i];

          newarray.push(item);
        }
      });

      unique = unique.concat(newarray.pop());
      unique = unique.filter(function (item) { return item !== undefined; });
      query = unique.join(' ');
    }
    else {
      query = str;
    }

    if (query.match(/"([^"]+)"/)) {
      query = query.match(/"([^"]+)"/)[1];
    }

    return query;
  }

  mkdru.search = function () {
    var filter = null;
    var limit = null;
    var limits = [];
    var filters = [];

    // Filtering response by MKWS resources settings.
    var resources = Drupal.settings.mkdru_mkws_sources;

    if (resources.length !== 0) {
      var out = 'pz:id=';
      for (var resource in resources) {
        out += resource;

        if (resource !== resources.length - 1) {
          out += '|';
        }
      }
      filter = out;
      filters.push(filter);
    }

    // Prepare filter and limit parameters for pz2.search() call.
    for (var facet in mkdru.facets) {
      // Facet is limited.
      if (mkdru.state['limit_' + facet]) {
        // Source facet in the filter parameter, everything else in limit.
        if (facet === "source") {
          filters.push('pz:id=' + mkdru.state.limit_source);
        } else {
          var facetLimits = mkdru.state['limit_' + facet].split(/;+/);
          for (var i = 0; i < facetLimits.length; i++) {
            // Escape backslashes, commas, and pipes as per docs.
            var facetLimit = facetLimits[i];
            facetLimit = facetLimit.replace(/\\/g, '\\\\')
              .replace(/,/g, '\\,')
              .replace(/\|/g, '\\|');
            limits.push(mkdru.facets[facet].pz2Name + '=' + facetLimit);
          }
        }
      }
    }

    if (mkdru.state.filter) {
      filters.push(mkdru.state.filter);
    }
    if (limits.length > 0) {
      limit = limits.join(',');
    }
    if (filters.length > 0) {
      filter = filters.join(',');
    }

    var query = [];

    var str = _query_normalizer(mkdru.state.query);

    if (str) {
      query.push(str);
    }

    var advanced_query = get_advanced_search_params();
    if (advanced_query) {
      query.push(advanced_query);
    }

    query = query.join(" AND ");

    mkdru.pz2.search(query, mkdru.state.perpage, mkdru.sortOrder(), filter, null, {limit: limit});
    mkdru.active = true;
  };

  mkdru.hashChange = function () {
    // Return to top of page.
    window.scrollTo(0, 0);
    // Do we need to restart the search?
    var searchTrigger = false;
    // Shallow copy of state so we can see what changed.
    var oldState = $.extend({}, mkdru.state);
    mkdru.stateFromHash();
    mkdru.form.fromState();
    // Only have to compare values since all keys are initialised.
    for (var key in mkdru.state) {
      var changed = (mkdru.state[key] !== oldState[key]);
      if (key.substring(0,5) === 'limit' && changed) {
        searchTrigger = true;
      }
      if (key === 'page' && changed) {
        mkdru.pz2.showPage(mkdru.state.page - 1);
      }
      if (key === 'query' && changed) {
        searchTrigger = true;
      }
    }
    if (searchTrigger) {
      mkdru.search();
    }
    // Request for record detail.
    if (mkdru.state.recid && (mkdru.state.recid !== oldState.recid)) {
      mkdru.pz2.record(mkdru.state.recid);
    }
    else {
      $('.mkdru-detail').hide();
      $('.mkdru-results').show();
    }
  };

  mkdru.addCategory = function (filter) {
    var newHash = $.deparam.fragment();
    delete newHash.page;
    newHash.filter = filter;
    return $.param.fragment("#", newHash);
  };

  mkdru.init = function () {
    // Generate termlist for pz2.js and populate facet limit state.
    var termlist = [];
    for (var key in mkdru.facets) {
      termlist.push(mkdru.facets[key].pz2Name);
      mkdru.defaultState['limit_' + key] = null;
    }

    mkdru.defaultState.filter = null;

    $(document).bind('mkdru.onrecord', mkdru.pz2Record);
    $(document).bind('mkdru.onshow', mkdru.pz2Show);
    $(document).bind('mkdru.onstat', mkdru.pz2Status);
    $(document).bind('mkdru.onterm', mkdru.pz2Term);
    $(document).bind('mkdru.oninit', mkdru.pz2Init);

    var pz2Params = {
      "pazpar2path": mkdru.settings.pz2_path,
      "termlist": termlist.join(','),
      "usesessions": !mkdru.settings.is_service_proxy,
      "autoInit": false,
      "showtime": 500, //each timer (show, stat, term, bytarget) can be specified this way
      "showResponseType": mkdru.showResponseType,
      "onshow": function (data) {
        $(document).trigger('mkdru.onshow', [data]);
        $(document).trigger('SocialServicesUpdate', [data]);
      },
      "oninit": function () {
        $(document).trigger('mkdru.oninit');
      },
      "onstat": function (data) {
        $(document).trigger('mkdru.onstat', [data]);
      },
      "onterm": function (data) {
        $(document).trigger('mkdru.onterm', [data]);
      },
      "onrecord": function (data) {
        $(document).trigger('mkdru.onrecord', [data]);
      }
    };
    if (mkdru.settings.mergekey) {
      pz2Params.mergekey = mkdru.settings.mergekey;
    }
    if (mkdru.settings.rank) {
      pz2Params.rank = mkdru.settings.rank;
    }
    if (mkdru.settings.sp_server_auth) {
      pz2Params.pazpar2path += ';jsessionid=' + Drupal.settings.mkdru.jsessionid;
    }
    mkdru.pz2 = new pz2(pz2Params);
    mkdru.pz2.showFastCount = 1;

    // Callback for access to DOM and pz2 object pre-search.
    for (var i = 0; i < mkdru.callbacks.length; i++) {
      mkdru.callbacks[i]();
    }

    if (typeof(Drupal.settings.mkdru.state) === "object") {
      // Initialise state with properties from the hash in the URL taking
      // precedence over initial values passed in from embedding and
      // with defaults filling in the gaps.
      mkdru.state = $.extend({}, mkdru.defaultState, Drupal.settings.mkdru.state, $.deparam.fragment());
      mkdru.hashFromState();
    } else {
      // Initialise state to hash string or defaults.
      mkdru.stateFromHash();
    }

    // Update UI to match.
    mkdru.form.fromState();

    if (mkdru.settings.is_service_proxy) {
      // SP doesn't trigger the init callback.
      if (!mkdru.settings.sp_server_auth) {
        mkdru.auth();
      } else {
        mkdru.pz2Init();
      }
    } else {
      mkdru.pz2.init();
    }
  };

  // Update mkdru_form theme's ui to match state.
  mkdru.FormHandler.prototype.fromState = function () {
    for (var key in mkdru.state) {
      switch (key) {
        case 'query':
          $('#search-block-form input:text').attr('value', mkdru.state[key]);
          break;
        case 'perpage':
          $('.mkdru-perpage').val(mkdru.state[key]);
          break;
        case 'sort':
          $('.mkdru-sort').val(mkdru.state[key]);
          break;
        case 'filter':
          $('.mkdru-top-facets input').prop('checked', '');
          break;
      }
    }
  };

  mkdru.FormHandler.prototype.updateCriteria = function () {
    mkdru.state.perpage = $('.mkdru-perpage').val();
    mkdru.state.sort = $('.mkdru-sort').val();
  };

  // pz2.js event handlers:
  mkdru.pz2Init = function () {
    mkdru.search();
  };

  mkdru.pz2Show = function (event, data) {
    mkdru.totalRec = data.merged;
    $('.mkdru-pager').html(mkdru.generatePager());
    $('.mkdru-counts').html(Drupal.theme('mkdruCounts',
      data.num > 0 ? data.start + 1 : 0,
      data.start + data.num,
      data.merged,
      data.total));
    $('.mkdru-counts-total').html('(' + data.total + ')');

    var html = "";
    for (var i = 0; i < data.hits.length; i++) {
      html += Drupal.theme('mkdruResult', data.hits[i],
        i + 1 + mkdru.state.perpage * (mkdru.state.page - 1),
        "#" + $.param.fragment($.param.fragment(
        window.location.href, {recid: data.hits[i].recid}))
      );
    }
    $('.mkdru-result-list').html(html);
    if (mkdru.state.recid) {
      mkdru.pz2.record(mkdru.state.recid);
    }
    else {
      $('.mkdru-results').show();
    }

    // Notify that rendered data is inserted in DOM tree.
    $(document).trigger('mkdru.onshow.domready', [data]);
  }
})(jQuery);
