
/* Responsive layout follows the current screen; legacy manual overrides are retired. */
(function(){
  document.documentElement.dataset.fgDisplayMode='auto';
  delete document.documentElement.dataset.fgPreviewMode;
  try{localStorage.removeItem('fg_display_mode_v1');}catch(e){}
})();
