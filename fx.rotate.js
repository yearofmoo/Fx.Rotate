(function($,$$) {

//each browser has it own vendor prefix
if(Browser.chrome || Browser.safari) {
  Browser.vendorPrefix = '-webkit-';
}
else if(Browser.firefox) {
  Browser.vendorPrefix = '-moz-';
}
else if(Browser.opera) {
  Browser.vendorPrefix = '-o-';
}
else if(Browser.ie) {
  Browser.vendorPrefix = '-ms-';
}
else {
  Browser.vendorPrefix = '';
}

Fx.Rotate = new Class({

  Extends : Fx,

  initialize : function(element,options) {
    this.prefix = Browser.vendorPrefix;
    this.transforms = !Browser.ie || Browser.ie9;
    this.element = $(element);
    
    if(!this.transforms) {
      this.set = this._setIEMethod();
    }
    else {
      var prefix = Browser.vendorPrefix;
      this.set = this._setTransformMethod();
      this.element.setStyle(prefix+'transform-origin','center center');
    }

    this.parent(this.element,options);
  },

  start : function(from,to) {
    if(to == null) {
      to = from;
      from = this.getCurrentRotation();
    }
    if(!this.transforms) {
      //ie only - requires a range between 0 and 4
      var CIRCLE = 360;
      var QUADRANTS = 4;
      from = from > 0 ? (from / CIRCLE) * QUADRANTS : 0;
      to = to > 0 ? (to / CIRCLE) * QUADRANTS : 0;
    }
    this.parent(from,to);
  },

  getCurrentRotation : function() {
    var rotation;
    if(this.transforms) {
      var prefix = Browser.vendorPrefix;
      var matches = (this.element.setStyle(prefix+'transform') || '').match(/rotate\((\d+).*?\)/);
      rotation = matches.length > 1 ? matches[1] : 0;
    }
    else { //ie6,ie7,ie8
      var QUADRANT_DEGREES = 90;
      var style = this.element.style.filter;
      var matches = style.match(/\brotation=(.+)\b/);
      rotation = (matches > 0 ? matches[1] : 0).toInt() * QUADRANT_DEGREE;
    }
    return rotation;
  },

  normalize : function() {
    this.set(0);
  },

  _setIEMethod : function() {
    return function(rotation) {
      this.element.style.filter = 'progid:DXImageTransform.Microsoft.BasicImage(rotation='+rotation+')';
    }.bind(this);
  },

  _setTransformMethod : function() {
    var prefix = Browser.vendorPrefix;
    return function(rotation) {
      this.element.setStyle(prefix+'transform','rotate('+rotation+'deg)');
    }.bind(this);
  }

});

Element.implement({

  rotate : function(from,to) {
    var rotate = $(this).get('rotate');
    rotate.start(from,to);
    return rotate;
  },

  normalize : function() {
    var rotate = $(this).get('rotate');
    rotate.normalize();
    return rotate;
  }

});

Element.Properties.rotate = {

  get : function() {
    var rotate = $(this).retrieve('Fx.Rotate');
    if(!rotate) {
      rotate = new Fx.Rotate(this);
    }
    return rotate;
  },

  set : function(options) {
    this.get('rotate').options = options;
  }

};


})(document.id,$$);
