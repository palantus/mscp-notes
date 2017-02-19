$(function() {
  noteId = getUrlVar("n");
  let savedNote = localStorage[noteId] || ""
  if(savedNote != ""){
    let note
    try{
      let note = JSON.parse(savedNote)
      window.document.title = note.title;
      savedContent = note.content;
    } catch(err){}
  }

  initEditor();
  mscp.ready.then(init)
});

var simplemde = null
var noteId = null
var savedContent = "";
var allowEdit = true;

function initEditor(){
  simplemde = new SimpleMDE({
    element: $("#editor")[0],
    spellChecker: false,
    hideIcons: ["fullscreen", "preview"],
    autofocus: true,
    showIcons: ["code", "table"],
    toolbar: [
      {
          name: "save",
          action: () => save(),
          className: "fa fa-save",
          title: "Save",
      },
      "|",
      "bold",
      "italic",
      "|",
      "heading",
      "heading-smaller",
      "heading-bigger",
      "|",
      "strikethrough",
      "code",
      "quote",
      "unordered-list",
      "ordered-list",
      "|",
      "link",
      "image",
      "|",
      "table",
      "horizontal-rule",
      "side-by-side",
      "|",
      "guide"
    ],
    status: false
  });

  simplemde.value(savedContent);
  $("#editorcontainer").hide(); //Hide before switching to preview, to prevent flickering

  if(savedContent != "")
    simplemde.togglePreview();

  try{
    simplemde.toggleFullScreen();
  } catch(err){}

  if(savedContent != "")
    $("#editorcontainer").show();


  $("div.CodeMirror").css("top", "0px")

  $("#edit").click(() => setEditMode())

  allowEdit = (getUrlVar("edit") == "no") ? false : true;
  if(!allowEdit)
    $("#edit").hide();
}

async function init(){
  if(noteId){
    let note = await mscp.note(noteId)

    if(note.revisions.length > 0){
      let revision = (getUrlVar("revision") !== undefined) ? parseInt(getUrlVar("revision")) : (note.revisions.length -1);
      if(revision < 0)
        revision = (note.revisions.length -1) + revision;
      if(revision < 0)
        revision = 0;
      if(revision > note.revisions.length -1)
        revision = note.revisions.length -1;

      window.document.title = note.revisions[revision].title;
      savedContent = await mscp.noteContent(note.revisions[revision].contentId)
      localStorage[noteId] = JSON.stringify({content: savedContent, title: window.document.title});
    }


    if(savedContent != simplemde.value()){
      simplemde.value(savedContent);
      if(simplemde.isPreviewActive()){
        simplemde.togglePreview();
        simplemde.togglePreview();
      }
    }

    if(savedContent != "" && !simplemde.isPreviewActive()){
      simplemde.togglePreview();
    }

    $("#editorcontainer").show();

  } else {
    window.location = "/?n=" + guid()
  }

  if(savedContent == "")
    setEditMode()
}

function setEditMode(editMode){
  if(simplemde.isPreviewActive())
    simplemde.togglePreview();
  $("div.editor-toolbar").show();
  $("#edit").hide();
  $("div.CodeMirror").css("top", "50px")
}

async function save(){
  if(simplemde.value() != savedContent && allowEdit === true){
    savedContent = simplemde.value();
    let newTitle = "My note";
    let firstLine = savedContent.split("\n")[0];
    if(firstLine.startsWith("# ") && firstLine.length > 2)
      newTitle = firstLine.substring(1)
    await mscp.noteSave(noteId, newTitle, savedContent)
    window.document.title = newTitle;
    savedContent[noteId] = {content: savedContent, title: window.document.title};
    $("#saveinfo").show();
    setTimeout(() => $("#saveinfo").hide(), 3000)
  }
}

$(window).bind('keydown', function(event) {
    if (event.ctrlKey || event.metaKey) {
        switch (String.fromCharCode(event.which).toLowerCase()) {
        case 's':
            event.preventDefault();
            save();
            break;
        }
    }
});

function getUrlVar( name ){
    name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
    var regexS = "[\\?&]"+name+"=([^&#]*)";
    var regex = new RegExp( regexS );
    var results = regex.exec( window.location.href );
    if( results == null )
        return undefined;
    else
        return decodeURIComponent(results[1]);
}

function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
             .toString(16)
             .substring(1);
};

function guid() {
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
         s4() + '-' + s4() + s4() + s4();
}
