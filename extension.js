// Desktop Scroller.
// Copyright (C) 2011-2012 Chace Clark <ccdevelop23@gmail.com>.
//
// Desktop Scroller is libre software: you can redistribute it and/or modify it
// under the terms of the GNU General Public License as published by the Free
// Software Foundation, either version 3 of the License, or newer.
//
// You should have received a copy of the GNU General Public License along with
// this file. If not, see <http://www.gnu.org/licenses/>.

const St      = imports.gi.St;
const Main    = imports.ui.main;
const Tweener = imports.ui.tweener;

let text, icon      = null;
let desktopscroller = null;
let makeNewIcon     = true;

function hideDirection() {
  Main.uiGroup.remove_actor(icon);
  makeNewIcon = true;
}

function showDirection(dir, prevIconFilename, nextIconFilename) {
  try {
    var iconFilename = prevIconFilename;
    if (dir > 0) {
      iconFilename = nextIconFilename;
    }
    if (makeNewIcon) {
      let textureCache = St.TextureCache.get_default();
      let directionicontexture = textureCache.load_uri_async("file://"
                                                             + iconFilename,
                                                             -1, -1);
      icon = new St.Bin({ style_class: 'direcion-icon',
                                width: 500,
                               height: 500,
                                child: directionicontexture }
      );
      Main.uiGroup.add_actor(icon);
      makeNewIcon = false;
    }
    let monitor = Main.layoutManager.primaryMonitor;
    icon.set_position(Math.floor(monitor.width / 2 - icon.width / 2),
    Math.floor(monitor.height / 2 - icon.height / 2));
    Tweener.addTween(icon, { opacity: 0,
                                time: 0.5,
                          transition: 'easeOutQuad',
                          onComplete: hideDirection }
    );
  }
  catch (e) {
    global.logError(e);
  }
}

// calculate the maximum width offset of all monitors
function calc_multimon() {
  var offset = 0;
  Main.layoutManager.monitors.forEach(function(monitor, index) {
    offset += monitor.width
  }, this);
  return offset;
}

// Main class for the extension.
function main(metadata) {
  this.metadata = metadata;
  //set defaults for undefined variables in the metadata file
  if (this.metadata.switchAnimationOn === undefined) {
    this.metadata.switchAnimationOn = false;
  }
  if (this.metadata.showActivationAreas === undefined) {
    this.metadata.showActivationAreas = false;
  }
  if (this.metadata.activationAreaWidth === undefined) {
    this.metadata.activationAreaWidth = 50;
  }
  if (this.metadata.switchPrevIcon === undefined) {
    this.metadata.switchPrevIcon = "my-go-prev.svg";
  }
  if (this.metadata.switchNextIcon === undefined) {
    this.metadata.switchNextIcon = "my-go-next.svg";
  }
  this.enable = function() {
    var monitor = Main.layoutManager.primaryMonitor;
    var width = this.metadata.activationAreaWidth;
    var height = monitor.height - 60;
    //var x = monitor.width - width;
    var x = calc_multimon() - width;
    var y = 30;
    this.ractor = new St.Button({style_class:'desktopscroller'});
    this.ractor.set_position(x,y);
    this.ractor.set_width(width);
    this.ractor.set_height(height);
    if (!this.metadata.showActivationAreas) {
      this.ractor.opacity = 0;
    }
    this.ractor.connect('scroll-event', this.hook.bind(this));
    Main.layoutManager.addChrome(this.ractor, {visibleInFullscreen:true});
    x = 0;
    y = 30;
    this.lactor = new St.Button({style_class:'desktopscroller'});
    this.lactor.set_position(x,y);
    this.lactor.set_width(width);
    this.lactor.set_height(height);
    if (!this.metadata.showActivationAreas) {
      this.lactor.opacity = 0;
    }
    this.lactor.connect('scroll-event', this.hook.bind(this));
    Main.layoutManager.addChrome(this.lactor, {visibleInFullscreen:true});
  }
  this.disable = function() {
    Main.layoutManager.removeChrome(this.actor)
    this.actor.destroy()
    this.overview.disconnect(this.connid0)
    this.overview.disconnect(this.connid1)
  }
  this.hook = function(actor, event) {
    var direction = event.get_scroll_direction();
    this.switch_workspace(direction == 0 ? -1 : 1);
  }
  this.switch_workspace = function(incremental) {
    if (this.metadata.switchAnimationOn) {
      showDirection(incremental,
                    this.metadata.path + "/" + this.metadata.switchPrevIcon,
                    this.metadata.path + "/" + this.metadata.switchNextIcon);
    }
    var index = global.screen.get_active_workspace_index() + incremental;
    if (global.screen.get_workspace_by_index(index) != null) {
      global.screen.get_workspace_by_index(index).activate(global.get_current_time());
    }
  },
  this.show = function() {
    this.actor.show()
  }
  this.hide = function() {
    this.actor.hide()
  }
}

// Gnome-shell extension API.
function init(metadata) { desktopscroller = new main(metadata); }
function enable() { desktopscroller.enable() }
function disable() { desktopscroller.disable() }

