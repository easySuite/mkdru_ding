<?php
/**
 * @file
 * Facet item template.
 */
?>
<fieldset class="mkdru-facet-fieldset">
  <?php if (isset($name)) : ?>
    <legend>
      <span class="fieldset-legend">
        <?php print $name; ?>
      </span>
    </legend>
  <?php endif; ?>
  <div class="fieldset-wrapper">
    <div class="mkdru-facet <?php print $class ?>"></div>
  </div>
</fieldset>
