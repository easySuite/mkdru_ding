<?php
/**
 * @file
 * Results block template.
 */
?>
<form class="mkdru-dropdowns">
  <div class="dropdown-wrapper select-wrapper">
    <select class="mkdru-sort">
      <option value="relevance" selected="selected"><?php print t("Sort by: ") ?><?php print t("relevance") ?></option>
      <option value="title:1"><?php print t("Sort by: ") ?><?php print t("title") ?></option>
      <option value="date:0"><?php print t("Sort by: ") ?><?php print t("newest") ?></option>
      <option value="date:1"><?php print t("Sort by: ") ?><?php print t("oldest") ?></option>
    </select>
  </div>
  <div class="dropdown-wrapper select-wrapper">
    <select class="mkdru-perpage">
      <option value="10"><?php print t("Show per page: ") ?>10</option>
      <option value="20" selected="selected"><?php print t("Show per page: ") ?>20</option>
      <option value="30"><?php print t("Show per page: ") ?>30</option>
      <option value="50"><?php print t("Show per page: ") ?>50</option>
    </select>
  </div>
</form>
<div class="mkdru-detail"></div>
<div class="mkdru-results">
  <div class="mkdru-above mkdru-above-below mkdru-status-container">
    <div class="mkdru-status-inner-container messages search-field-in-content--message">
      <span class="mkdru-counts"></span>
      <span class="mkdru-status"></span>
    </div>
  </div>
  <div class="mkdru-navi"></div>
  <ol class="mkdru-result-list search-results">
  </ol>
  <div class="mkdru-below mkdru-above-below mkdru-pager-container">
    <div class="mkdru-pager-inner-container">
      <ul class="pager mkdru-pager">
      </ul>
    </div>
  </div>
</div>
