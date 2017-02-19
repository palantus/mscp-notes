"use strict"

var guid = require("guid")
var moment = require("moment")

class Handler{

  async note(id){
    return await this.mscp.get("notes_" + id, {id: id, revisions: []})
  }

  async noteSave(id, title, content){
    let note = await this.mscp.get("notes_" + id, {id: id, revisions: []})

    let oldContent = null
    if(note.revisions.length > 0)
      oldContent = await this.mscp.get("notes_content_" + note.revisions.slice(-1)[0].contentId)

    if(oldContent != content){
      let newContentId = guid.raw()
      await this.mscp.set("notes_content_" + newContentId, content)
      note.revisions.push({title: title, timestamp: moment().toISOString(), contentId: newContentId})
      await this.mscp.set("notes_" + id, note)
    } else if(note.revisions.length > 0 && note.revisions.slice(-1)[0].title != title){
      note.revisions.push({title: title, timestamp: moment().toISOString(), contentId: note.revisions.slice(-1)[0].contentId})
      await this.mscp.set("notes_" + id, note)
    }
    return true
  }

  async noteContent(id){
    return await this.mscp.get("notes_content_" + id, "")
  }
}

module.exports = Handler
