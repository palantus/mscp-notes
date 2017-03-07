"use strict"

const guid = require("guid")
const moment = require("moment")
const AccessTokenManager = require("mscp-accesstokens");

class Handler{

  initFirst(){
    this.global.accessManager = new AccessTokenManager({secret: this.mscp.setupHandler.setup.accessTokenSecret, alwaysFullAccess: this.mscp.setupHandler.setup.useAccessTokens !== true})
  }

  async note(id){
    let writeAccess = this.global.accessManager.validateAccessReadWrite(this.request.data.accessToken, id, true)
    let readAccess = this.global.accessManager.validateAccessReadWrite(this.request.data.accessToken, id, false)
    let note = {id: id}
    if(writeAccess || readAccess)
      note = await this.mscp.get("notes_" + id, {id: id, revisions: []})
    note.access = writeAccess ? "write" : readAccess ? "read" : "none"
    return note
  }

  async noteSave(id, title, content){
    this.validateAccessToNote(id, true)
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

  async noteContent(id, revisionIdx){
    let note = await this.note(id)
    revisionIdx = Math.min(Math.max(!isNaN(revisionIdx) ? revisionIdx : (note.revisions.length-1), 0), note.revisions.length-1)
    let revision = note.revisions[revisionIdx]
    if(revision !== undefined){
      return await this.mscp.get("notes_content_" + revision.contentId, "")
    } else {
      return "";
    }
  }

  validateAccessToNote(id, requireWrite){
    this.global.accessManager.validateAccessReadWriteThrow(this.request.data.accessToken, id, requireWrite)
  }
}

module.exports = Handler
