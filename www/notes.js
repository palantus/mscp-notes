showdown.setOption("simpleLineBreaks", true);
showdown.setOption("tasklists", true);
showdown.setOption("strikethrough", true);


$(function() {
  noteId = getUrlVar("n");
  let savedNote = localStorage[noteId] || ""
  if(savedNote != ""){
    let note
    try{
      let note = JSON.parse(savedNote)
      window.document.title = note.title;
      savedContent = note.content;

      if(savedContent){
        $("#viewer").html(new showdown.Converter().makeHtml(savedContent))
      }
    } catch(err){}
  }

  mscp.ready.then(init)
});

var simplemde = null
var noteId = null
var savedContent = "";
var allowEdit = true;
var editorInitialized = false;

async function init(){
  $("#edit").click(() => setEditMode())
  allowEdit = (getUrlVar("edit") == "no") ? false : true;
  if(!allowEdit)
    $("#edit").hide();

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
      let newContent = await mscp.noteContent(note.revisions[revision].contentId)
      if(newContent != savedContent){
        savedContent = newContent;
        localStorage[noteId] = JSON.stringify({content: savedContent, title: window.document.title});
        $("#viewer").html(new showdown.Converter().makeHtml(savedContent));
      }
    } else {
      $("#viewer").html(new showdown.Converter().makeHtml("# Empty note!"));
    }
  } else {
    window.location = "/?n=" + guid()
  }
}

function setEditMode(editMode){
  $("#viewer").hide();
  initEditor();
  $("div.editor-toolbar").show();
  $("#edit").hide();
  $("div.CodeMirror").css("top", "50px")
}

function initEditor(){
  if(editorInitialized)
    return;

  editorInitialized = true;
  $("#editorcontainer").show();

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

  try{
    simplemde.toggleFullScreen();
  } catch(err){}

  $("div.CodeMirror").css("top", "0px")
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
