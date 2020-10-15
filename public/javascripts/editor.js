// For <div> with class = editor

var editor = ace.edit("editor");
editor.setOptions({
	highlightActiveLine: true,
	showPrintMargin: false,
	// theme: 'ace/theme/tomorrow_night',
	mode: 'ace/mode/c_cpp',
	fontSize: 16,
})
editor.session.setTabSize(4);