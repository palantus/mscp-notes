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
let revision = 0;
let note = null
let userInfoTimeout = null;
let isLatestRevision = true;

async function init(){
  let accessToken = getUrlVar("accessToken")
  if(accessToken)
    mscp.mscp_request_include_always_parms.accessToken = accessToken;

  $("#edit").click(() => setEditMode())

  if(noteId){
    note = await mscp.note(noteId)

    if(note.access == "none"){
      alert("You do not have access to this note!")
      return;
    }

    revision = (getUrlVar("revision") !== undefined) ? parseInt(getUrlVar("revision")) : (note.revisions.length -1);
    revision = revision < 0 ? (note.revisions.length - 1) + revision : revision;

    showRevision(revision)

    if(note.access == "write"){
      $("#edit").show();
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
  $("#editorcontainer").show();

  if(simplemde){
    simplemde.toTextArea();
    simplemde = null;
    $("#editor").empty()
  }

  let hideIcons = ["fullscreen", "preview"]
  if(revision <= 0)
    hideIcons.push("revback")
  if(revision >= note.revisions.length - 1)
    hideIcons.push("revforward")
  if(!isLatestRevision)
    hideIcons.push("save")

  simplemde = new SimpleMDE({
    element: $("#editor")[0],
    spellChecker: false,
    hideIcons: hideIcons,
    autofocus: true,
    showIcons: ["code", "table"],
    toolbar: [
      {
          name: "close",
          action: () => close(),
          className: "fa fa-close",
          title: "Close",
      },
      {
          name: "save",
          action: () => save(),
          className: "fa fa-save",
          title: "Save",
      },
      {
          name: "revback",
          action: () => showRevision(revision - 1),
          className: "fa fa-backward",
          title: "Show last revision",
      },
      {
          name: "revforward",
          action: () => showRevision(revision + 1),
          className: "fa fa-forward",
          title: "Show next revision",
          visible: false
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
  if(revision != note.revisions.length - 1 && note.revisions.length > 0){
    showInfo("Can only overwrite the current revision.")
  }
  else if(simplemde.value() != savedContent && allowEdit === true){
    savedContent = simplemde.value();
    let newTitle = "My note";
    let firstLine = savedContent.split("\n")[0];
    if(firstLine.startsWith("# ") && firstLine.length > 2)
      newTitle = firstLine.substring(1)

    try{
      await mscp.noteSave(noteId, newTitle, savedContent)
    } catch(err){
      alert("Could not save the note. You probably don't have access.")
      return;
    }

    window.document.title = newTitle;
    savedContent[noteId] = {content: savedContent, title: window.document.title};
    showInfo("Saved successfully!")
  } else {
    showInfo("No changes")
  }
}

function showInfo(message){
  clearTimeout(userInfoTimeout)
  $("#userinfo").html(message).show();
  userInfoTimeout = setTimeout(() => $("#userinfo").hide(), 3000)
}

async function close(){
  if((simplemde.value() == savedContent || allowEdit === false) ||confirm("You have unsaved changes. Are you sure?")){
    location.reload();
  }
}

async function showRevision(rev){
  revision = Math.max(Math.min(rev, note.revisions.length-1), 0);
  isLatestRevision = (revision == note.revisions.length - 1) || note.revisions.length == 0;

  if(note.revisions.length > 0){

    window.document.title = note.revisions[revision].title;
    let newContent = await mscp.noteContent(noteId, revision)
    if(newContent != savedContent){
      savedContent = newContent;
      if(isLatestRevision){
        localStorage[noteId] = JSON.stringify({content: savedContent, title: window.document.title});
      }
      if(!simplemde){
        $("#viewer").html(new showdown.Converter().makeHtml(savedContent));
      }
    }

    if(simplemde || revision != note.revisions.length - 1){
      showInfo("Showing revision " + (revision+1) + " of " + note.revisions.length)
    }
  } else {
    $("#viewer").html(new showdown.Converter().makeHtml("# Empty note!"));
  }

  if(simplemde){
    //initEditor()
    setEditMode()
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
